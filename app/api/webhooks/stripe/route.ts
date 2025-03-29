import { headers } from 'next/headers'
import { NextResponse } from 'next/server'
import Stripe from 'stripe'
import { createClient } from '@supabase/supabase-js'
import { sendPurchaseEvent } from '@/utils/facebookConversions'

// Initialize Stripe with the appropriate secret key based on environment
const stripeEnv = process.env.NEXT_PUBLIC_STRIPE_ENV || 'development'
const stripe = new Stripe(
  stripeEnv === 'development' 
    ? process.env.STRIPE_TEST_SECRET_KEY!
    : process.env.STRIPE_SECRET_KEY!,
  {
    apiVersion: '2025-01-27.acacia',
  }
)

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  }
)

// Get the appropriate webhook secret based on environment
function getWebhookSecret(): string {
  const stripeEnv = process.env.NEXT_PUBLIC_STRIPE_ENV
  if (!stripeEnv) {
    throw new Error('NEXT_PUBLIC_STRIPE_ENV must be set')
  }

  const secret = stripeEnv === 'development' 
    ? process.env.STRIPE_TEST_WEBHOOK_SECRET 
    : process.env.STRIPE_WEBHOOK_SECRET

  if (!secret) {
    throw new Error(`Missing ${stripeEnv === 'development' ? 'STRIPE_TEST_WEBHOOK_SECRET' : 'STRIPE_WEBHOOK_SECRET'}`)
  }

  console.log('Using webhook secret for environment:', stripeEnv)
  return secret
}

// Get the appropriate price IDs based on environment
function getPriceIds() {
  const stripeEnv = process.env.NEXT_PUBLIC_STRIPE_ENV
  if (!stripeEnv) {
    throw new Error('NEXT_PUBLIC_STRIPE_ENV must be set')
  }

  if (stripeEnv === 'development') {
    return {
      starter: process.env.NEXT_PUBLIC_STRIPE_TEST_STARTER_PRICE_ID,
      growth: process.env.NEXT_PUBLIC_STRIPE_TEST_GROWTH_PRICE_ID,
      scale: process.env.NEXT_PUBLIC_STRIPE_TEST_SCALE_PRICE_ID,
    }
  } else {
    return {
      starter: process.env.NEXT_PUBLIC_STRIPE_STARTER_PRICE_ID,
      growth: process.env.NEXT_PUBLIC_STRIPE_GROWTH_PRICE_ID,
      scale: process.env.NEXT_PUBLIC_STRIPE_SCALE_PRICE_ID,
    }
  }
}

async function getUserIdFromEmail(email: string | null | undefined): Promise<string | null> {
  if (!email) return null;

  const normalizedEmail = email.trim().toLowerCase(); // Normalize email

  try {
    // Efficiently query for the user by normalized email
    // NOTE: This assumes a 'users' view/table accessible by the service role key.
    // If this doesn't exist, revert to the listUsers method below.
    const { data, error } = await supabaseAdmin
      .from('users') // Check if this view/table exists and mirrors auth.users
      .select('id')
      .ilike('email', normalizedEmail) // Case-insensitive search
      .single(); // Expect only one user

    /* --- Fallback using listUsers (less efficient) ---
    const { data: { users }, error: listError } = await supabaseAdmin.auth.admin.listUsers();
    if (listError || !users) {
      console.error('Error listing users:', listError);
      return null;
    }
    const user = users.find(u => u.email?.trim().toLowerCase() === normalizedEmail);
    if (!user) {
       console.log('No user found for normalized email:', normalizedEmail);
       return null;
    }
    return user.id;
    */

    // Handle potential query errors (PGRST116 means 'not found', which is okay)
    if (error && error.code !== 'PGRST116') { 
      console.error('Error finding user by email:', error);
      return null;
    }

    if (!data) {
      console.log('No user found for normalized email:', normalizedEmail);
      return null;
    }

    return data.id;
  } catch (error) {
    console.error('Exception finding user by email:', error);
    return null;
  }
}

async function handleStripeWebhook(event: Stripe.Event) {
  console.log('Processing webhook event:', event.type);
  const priceIds = getPriceIds()

  try {
    switch (event.type) {
      case 'checkout.session.completed': {
        const session = event.data.object as Stripe.Checkout.Session
        const customerId = session.customer as string
        const subscriptionId = session.subscription as string
        
        // Get userId from customer email
        let userId = await getUserIdFromEmail(session.customer_details?.email)
        const customerEmail = session.customer_details?.email

        // If user not found, wait a bit and retry (potential replication delay)
        if (!userId && customerEmail) {
          console.log(`User not found for ${customerEmail} on first attempt. Retrying after 2 seconds...`);
          await new Promise(resolve => setTimeout(resolve, 2000)); // Wait 2 seconds
          userId = await getUserIdFromEmail(customerEmail);
          if (userId) {
            console.log(`User found for ${customerEmail} on retry.`);
          }
        }

        if (!userId) {
          console.log('No user found for email:', customerEmail, 'after retry.')
          // Return success because the webhook itself is fine, but we can't process this user
          return { status: 'success', message: 'Skipped - user not found' } 
        }

        // Store userId in customer and subscription metadata for future reference
        await Promise.all([
          stripe.customers.update(customerId, {
            metadata: { userId }
          }),
          stripe.subscriptions.update(subscriptionId, {
            metadata: { userId }
          })
        ])

        const subscription = await stripe.subscriptions.retrieve(subscriptionId)
        const priceId = subscription.items.data[0].price.id
        const price = subscription.items.data[0].price.unit_amount || 0
        const amount = price / 100 // Convert from cents to dollars

        // Determine plan name from price ID
        let planName = 'starter'
        if (priceId === priceIds.growth) {
          planName = 'growth'
        } else if (priceId === priceIds.scale) {
          planName = 'scale'
        }

        // Create or update subscription record with reset content usage
        const { error } = await supabaseAdmin.from('subscriptions').upsert({
          user_id: userId,
          stripe_customer_id: customerId,
          stripe_subscription_id: subscriptionId,
          stripe_price_id: priceId,
          plan_name: planName,
          status: subscription.status,
          current_period_start: new Date(subscription.current_period_start * 1000).toISOString(),
          current_period_end: new Date(subscription.current_period_end * 1000).toISOString(),
          content_used_this_month: 0, // Reset content usage on new subscription
          content_reset_date: new Date(subscription.current_period_start * 1000).toISOString()
        }, {
          onConflict: 'user_id'
        })

        if (error) {
          console.error('Error upserting subscription:', error)
          return { status: 'error', message: 'Failed to update subscription' }
        }

        // Send purchase event to Facebook Conversions API
        if (customerEmail) {
          try {
            await sendPurchaseEvent({
              email: customerEmail,
              value: amount,
              currency: 'USD',
              orderId: session.id,
              contentIds: [planName],
              eventSourceUrl: process.env.NEXT_PUBLIC_TEST_APP_URL || 'https://viewstodownloads.com',
              actionSource: 'website',
              userAgent: session.client_reference_id || 'Stripe Checkout'
            });
            console.log('Facebook purchase event sent for session:', session.id);
          } catch (fbError) {
            console.error('Error sending Facebook purchase event:', fbError);
            // Don't fail the webhook if Facebook API fails
          }
        }

        return { status: 'success', message: 'Subscription created/updated' }
      }

      case 'customer.subscription.updated': {
        const subscription = event.data.object as Stripe.Subscription
        const customerId = subscription.customer as string
        const priceId = subscription.items.data[0].price.id

        // Determine new plan name from price ID
        let planName = 'starter'
        if (priceId === priceIds.growth) {
          planName = 'growth'
        } else if (priceId === priceIds.scale) {
          planName = 'scale'
        }

        // Update subscription with new plan and reset content usage for upgrade
        // Important: We need the userId here. Get it from metadata or lookup.
        const userIdFromMeta = subscription.metadata?.userId;
        let userId = userIdFromMeta;

        if (!userId) {
           console.log(`[${subscription.id}] User ID not found in subscription metadata. Attempting fallback...`);
           const customer = await stripe.customers.retrieve(customerId) as Stripe.Customer; 
           console.log(`[${subscription.id}] Retrieved customer ${customerId}. Email: ${customer.email || 'null'}`);
           
           // Also check customer metadata as a fallback
           const userIdFromCustomerMeta = customer.metadata?.userId;
           if (userIdFromCustomerMeta) {
              console.log(`[${subscription.id}] Found userId in CUSTOMER metadata: ${userIdFromCustomerMeta}`);
              userId = userIdFromCustomerMeta;
           } else {
              console.log(`[${subscription.id}] No userId found in customer metadata.`);
              // Check if email exists before attempting lookup
              if (customer.email) { 
                 console.log(`[${subscription.id}] Attempting email lookup for: ${customer.email}`);
                 // Use a temporary variable for the lookup result
                 const emailLookupResult = await getUserIdFromEmail(customer.email);
                 if (emailLookupResult) {
                    console.log(`[${subscription.id}] Found userId via email lookup: ${emailLookupResult}`);
                    userId = emailLookupResult; // Assign to main userId only if successful
                 } else {
                    console.log(`[${subscription.id}] Email lookup failed for: ${customer.email}`);
                 }
              } else {
                 console.error(`[${subscription.id}] Customer email is null, cannot look up user for subscription update.`);
                 // Handle case where email is null - maybe skip update or log differently?
              }
           }
        }

        // Only proceed with update if we found a userId
        if (userId) {
          const { error } = await supabaseAdmin
            .from('subscriptions')
            .update({
              stripe_price_id: priceId,
              plan_name: planName,
              status: subscription.status,
              current_period_start: new Date(subscription.current_period_start * 1000).toISOString(),
              current_period_end: new Date(subscription.current_period_end * 1000).toISOString(),
              // Reset usage on plan change (upgrade/downgrade)? Adjust if needed.
              content_used_this_month: 0, 
              content_reset_date: new Date(subscription.current_period_start * 1000).toISOString()
            })
            // @ts-ignore - Linter incorrectly flags userId type despite the if(userId) check
            .eq('user_id', userId!); // Use assertion directly

          if (error) {
             console.error('Error updating subscription:', error);
             return { status: 'error', message: 'Failed to update subscription' };
          }
          return { status: 'success', message: 'Subscription updated' };
        } else {
          // This case should ideally not be reached due to the earlier check,
          // but we handle it just in case.
          console.error('Could not find userId for subscription update after all checks:', subscription.id);
          return { status: 'error', message: 'User ID not found for subscription update' };
        }
      }

      case 'invoice.paid': {
        const invoice = event.data.object as Stripe.Invoice;
        const customerId = invoice.customer as string;
        const subscriptionId = invoice.subscription as string;
        const customerEmail = invoice.customer_email; // Get email from invoice

        // If it's for a subscription, update the status and potentially usage
        if (subscriptionId) {
           const subscription = await stripe.subscriptions.retrieve(subscriptionId);
           const userId = subscription.metadata?.userId; // Get userId from metadata

           if (userId) {
             const { error } = await supabaseAdmin
               .from('subscriptions')
               .update({
                 status: subscription.status, // Update status (e.g., from 'past_due' to 'active')
                 current_period_start: new Date(subscription.current_period_start * 1000).toISOString(),
                 current_period_end: new Date(subscription.current_period_end * 1000).toISOString(),
                 // Reset usage on renewal?
                 // content_used_this_month: 0, 
                 // content_reset_date: new Date(subscription.current_period_start * 1000).toISOString()
               })
               .eq('user_id', userId); // Use userId for lookup

              if (error) {
                 console.error('Error updating subscription status from invoice.paid:', error);
                 // Decide if this is fatal - maybe just log?
              } else {
                 console.log('Subscription status updated from invoice.paid for user:', userId);
              }
           } else {
              // Fallback: If userId wasn't in metadata (should not happen after first checkout)
              if (customerEmail) { 
                 console.warn('No userId found in subscription metadata for invoice.paid. Falling back to email lookup for:', customerEmail);
                 const fallbackUserId = await getUserIdFromEmail(customerEmail);
                 if (fallbackUserId) {
                    console.log('Found userId via email fallback:', fallbackUserId);
                    // Optional: Retry the update using fallbackUserId if necessary
                    // const { error } = await supabaseAdmin.from('subscriptions')...eq('user_id', fallbackUserId);
                 } else {
                    console.error('Could not find user by email fallback either for email:', customerEmail);
                    // Cannot update subscription record
                 }
              } else {
                 console.error('Cannot perform email fallback lookup in invoice.paid: customer_email is null for invoice:', invoice.id);
              }
           }
        } else {
           console.log('Invoice.paid event received without a subscription ID. Possibly a one-time charge:', invoice.id);
           // Handle one-time charges if necessary
        }

        return { status: 'success', message: 'Invoice processed' };
      }

      // Optional: Add handling for failed payments or subscription cancellations
      // case 'invoice.payment_failed': { ... }
      // case 'customer.subscription.deleted': { ... }

      default:
        console.log(`Unhandled event type ${event.type}`);
        // Return success even for unhandled types to acknowledge receipt to Stripe
        return { status: 'success', message: 'Unhandled event type' }; 
    }
  } catch (error: any) { // Catch specific error types if needed
    console.error('Error processing webhook:', error);
    // Add more details to the error message if possible
    return { status: 'error', message: `Webhook processing failed: ${error.message || 'Unknown error'}` }; 
  }
}

export async function POST(req: Request) {
  const body = await req.text()
  const sig = headers().get('stripe-signature') as string
  const webhookSecret = getWebhookSecret()

  let event: Stripe.Event

  try {
    event = stripe.webhooks.constructEvent(body, sig, webhookSecret)
    console.log('Webhook event constructed successfully:', event.type); // Log success
  } catch (err: any) {
    console.error(`Webhook signature verification failed: ${err.message}`)
    return NextResponse.json({ error: `Webhook Error: ${err.message}` }, { status: 400 })
  }

  // Process the event
  const result = await handleStripeWebhook(event);

  // Return appropriate response based on processing outcome
  if (result.status === 'error') {
     console.error(`Webhook handler failed for event ${event.id}: ${result.message}`);
     // Return 500 to indicate failure, Stripe might retry
     return NextResponse.json({ error: result.message }, { status: 500 }); 
  }

  // Return 200 for success (including skipped or unhandled events)
  console.log(`Webhook handler finished for event ${event.id}: ${result.message}`);
  return NextResponse.json({ received: true, message: result.message }, { status: 200 }); 
}
