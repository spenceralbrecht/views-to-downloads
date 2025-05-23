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
  if (!email) {
     console.log('getUserIdFromEmail: No email provided.');
     return null;
  }

  const normalizedEmail = email.trim().toLowerCase(); // Normalize email
  console.log(`getUserIdFromEmail: Searching for normalized email: ${normalizedEmail}`);

  try {
    // Use listUsers from the admin API as there is no separate 'users' table/view
    console.log('getUserIdFromEmail: Attempting lookup via supabaseAdmin.auth.admin.listUsers()');
    const { data: { users }, error: listError } = await supabaseAdmin.auth.admin.listUsers({
      // Consider pagination if you have a very large number of users (>1000 typically)
      // page: 1, 
      // perPage: 1000 
    });

    if (listError) {
      console.error('getUserIdFromEmail: Error listing users:', listError);
      return null;
    }
    
    if (!users || users.length === 0) {
      console.log('getUserIdFromEmail: No users found in listUsers response.');
      return null;
    }

    // Find the user with the matching normalized email
    const user = users.find(u => u.email?.trim().toLowerCase() === normalizedEmail);

    if (!user) {
       console.log('getUserIdFromEmail: No user found matching normalized email:', normalizedEmail);
       return null;
    }

    console.log('getUserIdFromEmail: Found user ID:', user.id);
    return user.id;

    /* --- Old code attempting to query 'users' table (incorrect for this setup) ---
    const { data, error } = await supabaseAdmin
      .from('users') 
      .select('id')
      .ilike('email', normalizedEmail) 
      .single();

    if (error && error.code !== 'PGRST116') { 
      console.error('Error finding user by email:', error);
      return null;
    }

    if (!data) {
      console.log('No user found for normalized email:', normalizedEmail);
      return null;
    }

    return data.id;
    */

  } catch (error) {
    console.error('getUserIdFromEmail: Exception during user lookup:', error);
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
        const clientReferenceId = session.client_reference_id // Get client_reference_id
        const customerEmail = session.customer_details?.email // Get email for fallback/metadata

        let userId: string | null = null;
        let userLookupMethod: string = 'unknown'; // For logging

        console.log(`Processing checkout.session.completed for session ${session.id}. Client Ref ID: ${clientReferenceId}, Email: ${customerEmail}`);

        // 1. Try using client_reference_id (should be the Supabase User UUID)
        if (clientReferenceId) {
          console.log(`Attempting user lookup using client_reference_id: ${clientReferenceId}`);
          // Directly query auth.users using the admin client
          // Note: Assumes clientReferenceId IS the UUID. Add validation if needed.
          try {
             const { data: userData, error: userError } = await supabaseAdmin.auth.admin.getUserById(clientReferenceId);
             
             if (userError) {
                console.warn(`Error looking up user by client_reference_id (${clientReferenceId}):`, userError.message);
                // Don't assign userId, let it fall through to email lookup
             } else if (userData?.user) {
                userId = userData.user.id;
                userLookupMethod = 'client_reference_id';
                console.log(`User found via client_reference_id: ${userId}`);
             } else {
                console.warn(`User not found for client_reference_id: ${clientReferenceId}. Potential mismatch or delay.`);
                // Fall through to email lookup
             }
          } catch (catchError) {
              console.error(`Exception during getUserById lookup for client_reference_id ${clientReferenceId}:`, catchError);
              // Fall through to email lookup
          }
        }

        // 2. Fallback: Try using email if lookup by ID failed or wasn't possible
        if (!userId && customerEmail) {
          console.log(`User not found via client_reference_id or ID was missing. Attempting lookup via email: ${customerEmail}`);
          userId = await getUserIdFromEmail(customerEmail); // Use existing function
          if (userId) {
            userLookupMethod = 'email_initial';
            console.log(`User found via initial email lookup: ${userId}`);
          } else {
            // Retry email lookup after delay (existing logic)
            console.log(`User not found for ${customerEmail} on first email attempt. Retrying after 2 seconds...`);
            await new Promise(resolve => setTimeout(resolve, 2000)); 
            userId = await getUserIdFromEmail(customerEmail);
            if (userId) {
              userLookupMethod = 'email_retry';
              console.log(`User found for ${customerEmail} on email retry: ${userId}`);
            }
          }
        }

        // 3. Check if user was found by any method
        if (!userId) {
          console.log('User could not be found via client_reference_id or email after retry.', 
                      { clientReferenceId, customerEmail });
          // Return success to Stripe, but log that we skipped processing
          return { status: 'success', message: 'Skipped - user not found via ID or email' } 
        }

        console.log(`Successfully identified userId: ${userId} via method: ${userLookupMethod}`);

        // 4. Store userId in customer and subscription metadata (existing logic)
        try {
           console.log(`Updating Stripe customer ${customerId} and subscription ${subscriptionId} metadata with userId: ${userId}`);
           await Promise.all([
             stripe.customers.update(customerId, {
               metadata: { userId } // Store Supabase UUID
             }),
             stripe.subscriptions.update(subscriptionId, {
               metadata: { userId } // Store Supabase UUID
             })
           ]);
           console.log(`Successfully updated metadata for customer ${customerId} and subscription ${subscriptionId}`);
        } catch (metaError) {
            console.error(`Error updating Stripe metadata for customer ${customerId} or subscription ${subscriptionId}:`, metaError);
            // Decide if this is fatal. If subsequent webhooks rely on this metadata,
            // it might be better to return an error here to force a retry.
            // For now, we'll log the error and continue, but this could cause issues later.
            // return { status: 'error', message: 'Failed to update Stripe metadata' };
        }

        // 5. Retrieve subscription details and upsert to Supabase (existing logic)
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
    // Still return 400 for signature verification failures as these are client errors
    // Stripe should retry with the correct signature
    return NextResponse.json({ error: `Webhook Error: ${err.message}` }, { status: 400 })
  }

  // Process the event
  const result = await handleStripeWebhook(event);

  // Always return 200 to acknowledge receipt of the webhook
  // Include appropriate information in the response body
  if (result.status === 'error') {
    console.error(`Webhook handler encountered an error for event ${event.id}: ${result.message}`);
    // Return 200 with error information to prevent Stripe from retrying
    return NextResponse.json({ received: true, error: result.message }, { status: 200 }); 
  }

  // Return 200 for success (including skipped or unhandled events)
  console.log(`Webhook handler finished for event ${event.id}: ${result.message}`);
  return NextResponse.json({ received: true, message: result.message }, { status: 200 }); 
}
