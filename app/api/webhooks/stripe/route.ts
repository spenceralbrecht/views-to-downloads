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
  
  try {
    const { data: users, error } = await supabaseAdmin.auth.admin.listUsers()
    
    if (error || !users) {
      console.log('Error finding users:', error)
      return null
    }

    const user = users.users.find(u => u.email === email)
    if (!user) {
      console.log('No user found for email:', email)
      return null
    }

    return user.id
  } catch (error) {
    console.error('Error finding user by email:', error)
    return null
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
        const userId = await getUserIdFromEmail(session.customer_details?.email)
        const customerEmail = session.customer_details?.email

        if (!userId) {
          console.log('No user found for email:', customerEmail)
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
        const { error } = await supabaseAdmin
          .from('subscriptions')
          .update({
            stripe_price_id: priceId,
            plan_name: planName,
            status: subscription.status,
            current_period_start: new Date(subscription.current_period_start * 1000).toISOString(),
            current_period_end: new Date(subscription.current_period_end * 1000).toISOString(),
            content_used_this_month: 0, // Reset content usage on plan change
            content_reset_date: new Date(subscription.current_period_start * 1000).toISOString()
          })
          .eq('stripe_customer_id', customerId)

        if (error) {
          console.error('Error updating subscription:', error)
          return { status: 'error', message: 'Failed to update subscription' }
        }

        return { status: 'success', message: 'Subscription updated' }
      }

      case 'customer.subscription.deleted': {
        const subscription = event.data.object as Stripe.Subscription
        const customerId = subscription.customer as string

        const { error } = await supabaseAdmin
          .from('subscriptions')
          .update({
            status: 'canceled',
            stripe_price_id: null,
            plan_name: null,
            content_used_this_month: 0, // Reset content usage on cancellation
            content_reset_date: null
          })
          .eq('stripe_customer_id', customerId)

        if (error) {
          console.error('Error updating subscription:', error)
          return { status: 'error', message: 'Failed to update subscription' }
        }

        return { status: 'success', message: 'Subscription canceled' }
      }

      case 'invoice.paid': {
        const invoice = event.data.object as Stripe.Invoice
        const subscriptionId = invoice.subscription
        if (!subscriptionId) return { status: 'success', message: 'Not a subscription invoice' }

        const subscription = await stripe.subscriptions.retrieve(subscriptionId as string)
        const customerId = subscription.customer as string
        const priceId = subscription.items.data[0].price.id

        // Get userId from customer email
        const customer = await stripe.customers.retrieve(customerId) as Stripe.Customer
        const userId = await getUserIdFromEmail(customer.email)
        const customerEmail = customer.email

        if (!userId) {
          console.log('No user found for email:', customerEmail)
          return { status: 'success', message: 'Skipped - user not found' }
        }

        // Determine plan name from price ID
        let planName = 'starter'
        if (priceId === priceIds.growth) {
          planName = 'growth'
        } else if (priceId === priceIds.scale) {
          planName = 'scale'
        }

        // Create or update subscription record
        const { error } = await supabaseAdmin.from('subscriptions').upsert({
          user_id: userId,
          stripe_customer_id: customerId,
          stripe_subscription_id: subscriptionId as string,
          stripe_price_id: priceId,
          plan_name: planName,
          status: subscription.status,
          current_period_start: new Date(subscription.current_period_start * 1000).toISOString(),
          current_period_end: new Date(subscription.current_period_end * 1000).toISOString(),
          content_used_this_month: 0,
          content_reset_date: new Date(subscription.current_period_start * 1000).toISOString()
        }, {
          onConflict: 'user_id'
        })

        if (error) {
          console.error('Error upserting subscription:', error)
          return { status: 'error', message: 'Failed to update subscription' }
        }

        // Store userId in customer and subscription metadata for future reference
        await Promise.all([
          stripe.customers.update(customerId, {
            metadata: { userId }
          }),
          stripe.subscriptions.update(subscriptionId as string, {
            metadata: { userId }
          })
        ])

        // Send purchase event to Facebook Conversions API
        if (customerEmail && invoice.amount_paid > 0) {
          try {
            await sendPurchaseEvent({
              email: customerEmail,
              value: invoice.amount_paid / 100, // Convert from cents to dollars
              currency: invoice.currency.toUpperCase(),
              orderId: invoice.id,
              contentIds: [planName],
              eventSourceUrl: process.env.NEXT_PUBLIC_TEST_APP_URL || 'https://viewstodownloads.com',
              actionSource: 'website',
              userAgent: 'Stripe Invoice Payment'
            });
            console.log('Facebook purchase event sent for invoice:', invoice.id);
          } catch (fbError) {
            console.error('Error sending Facebook purchase event:', fbError);
            // Don't fail the webhook if Facebook API fails
          }
        }

        return { status: 'success', message: 'Invoice processed and subscription updated' }
      }

      // We can safely ignore these events
      case 'customer.created':
      case 'customer.updated':
      case 'customer.subscription.created':
        return { status: 'success', message: `Skipped ${event.type}` }

      default:
        console.log('Unhandled event type:', event.type)
        return { status: 'success', message: `Unhandled event type: ${event.type}` }
    }
  } catch (error) {
    console.error('Error in webhook handler:', error)
    return { 
      status: 'error', 
      message: error instanceof Error ? error.message : 'Unknown error'
    }
  }
}

export async function POST(req: Request) {
  const body = await req.text()
  const sig = headers().get('stripe-signature')

  if (!sig) {
    return NextResponse.json({ error: 'No signature' }, { status: 400 })
  }

  try {
    const webhookSecret = getWebhookSecret()
    const event = stripe.webhooks.constructEvent(body, sig, webhookSecret)
    console.log('Webhook event constructed successfully:', event.type)
    
    const result = await handleStripeWebhook(event)
    return NextResponse.json(result)
  } catch (err) {
    console.error('Webhook error:', err)
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Unknown error' },
      { status: 400 }
    )
  }
}
