import { headers } from 'next/headers'
import { NextResponse } from 'next/server'
import Stripe from 'stripe'
import { createClient } from '@supabase/supabase-js'

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2024-12-18.acacia'
})

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

async function handleStripeWebhook(event: Stripe.Event) {
  console.log('Processing webhook event:', event.type);

  try {
    switch (event.type) {
      case 'customer.subscription.created':
      case 'customer.subscription.updated': {
        const subscription = event.data.object as Stripe.Subscription
        const customerId = subscription.customer as string

        // Get the subscription details
        const { data: existingSub } = await supabaseAdmin
          .from('subscriptions')
          .select()
          .eq('stripe_customer_id', customerId)
          .single()

        // Get the price details
        const priceId = subscription.items.data[0].price.id
        let planName = 'starter'
        if (priceId === process.env.NEXT_PUBLIC_STRIPE_TEST_GROWTH_PRICE_ID) {
          planName = 'growth'
        } else if (priceId === process.env.NEXT_PUBLIC_STRIPE_TEST_SCALE_PRICE_ID) {
          planName = 'scale'
        }

        // If no subscription exists yet, try to find the user from metadata
        if (!existingSub) {
          const customer = await stripe.customers.retrieve(customerId) as Stripe.Customer
          const userId = customer.metadata.userId

          if (!userId) {
            console.log('No userId in customer metadata:', customerId)
            return { status: 'error', message: 'No userId found for customer' }
          }

          // Create new subscription record
          const { error: createError } = await supabaseAdmin
            .from('subscriptions')
            .insert({
              user_id: userId,
              stripe_customer_id: customerId,
              stripe_subscription_id: subscription.id,
              stripe_price_id: priceId,
              plan_name: planName,
              status: subscription.status,
              current_period_start: new Date(subscription.current_period_start * 1000).toISOString(),
              current_period_end: new Date(subscription.current_period_end * 1000).toISOString()
            })

          if (createError) {
            console.error('Error creating subscription:', createError)
            return { status: 'error', message: 'Failed to create subscription' }
          }
        } else {
          // Update existing subscription
          const { error: updateError } = await supabaseAdmin
            .from('subscriptions')
            .update({
              stripe_subscription_id: subscription.id,
              stripe_price_id: priceId,
              plan_name: planName,
              status: subscription.status,
              current_period_start: new Date(subscription.current_period_start * 1000).toISOString(),
              current_period_end: new Date(subscription.current_period_end * 1000).toISOString()
            })
            .eq('id', existingSub.id)

          if (updateError) {
            console.error('Error updating subscription:', updateError)
            return { status: 'error', message: 'Failed to update subscription' }
          }
        }

        return { status: 'success', message: 'Subscription processed' }
      }

      case 'checkout.session.completed': {
        const session = event.data.object as Stripe.Checkout.Session
        const customerId = session.customer as string
        const subscriptionId = session.subscription as string
        const userId = session.client_reference_id

        if (!userId) {
          console.log('No client_reference_id in session')
          return { status: 'success', message: 'Skipped - no client_reference_id' }
        }

        // Store userId in customer metadata for future reference
        await stripe.customers.update(customerId, {
          metadata: { userId }
        })

        const subscription = await stripe.subscriptions.retrieve(subscriptionId)
        const priceId = subscription.items.data[0].price.id

        let planName = 'starter'
        if (priceId === process.env.NEXT_PUBLIC_STRIPE_TEST_GROWTH_PRICE_ID) {
          planName = 'growth'
        } else if (priceId === process.env.NEXT_PUBLIC_STRIPE_TEST_SCALE_PRICE_ID) {
          planName = 'scale'
        }

        const { error } = await supabaseAdmin.from('subscriptions').upsert({
          user_id: userId,
          stripe_customer_id: customerId,
          stripe_subscription_id: subscriptionId,
          stripe_price_id: priceId,
          plan_name: planName,
          status: subscription.status,
          current_period_start: new Date(subscription.current_period_start * 1000).toISOString(),
          current_period_end: new Date(subscription.current_period_end * 1000).toISOString()
        }, {
          onConflict: 'user_id'
        })

        if (error) {
          console.error('Error upserting subscription:', error)
          return { status: 'error', message: 'Failed to update subscription' }
        }

        return { status: 'success', message: 'Subscription created/updated' }
      }

      case 'customer.subscription.deleted': {
        const subscription = event.data.object as Stripe.Subscription
        const customerId = subscription.customer as string

        const { error } = await supabaseAdmin
          .from('subscriptions')
          .update({
            status: 'canceled',
            stripe_price_id: null,
            plan_name: null
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

        const { error } = await supabaseAdmin
          .from('subscriptions')
          .update({
            status: subscription.status,
            current_period_end: new Date(subscription.current_period_end * 1000).toISOString()
          })
          .eq('stripe_customer_id', customerId)

        if (error) {
          console.error('Error updating subscription period:', error)
          return { status: 'error', message: 'Failed to update subscription period' }
        }

        return { status: 'success', message: 'Invoice processed' }
      }

      // We can safely ignore these events
      case 'customer.created':
      case 'customer.updated':
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
  if (!process.env.STRIPE_TEST_WEBHOOK_SECRET) {
    console.error('Missing STRIPE_TEST_WEBHOOK_SECRET')
    return new NextResponse(
      JSON.stringify({ error: 'Server configuration error' }), 
      { status: 500 }
    )
  }

  try {
    const text = await req.text()
    const sig = headers().get('stripe-signature')

    if (!sig) {
      console.error('No stripe-signature header')
      return new NextResponse(
        JSON.stringify({ error: 'No stripe-signature header' }), 
        { status: 400 }
      )
    }

    const event = stripe.webhooks.constructEvent(
      text,
      sig,
      process.env.STRIPE_TEST_WEBHOOK_SECRET
    )

    const response = await handleStripeWebhook(event)
    return new NextResponse(JSON.stringify(response), { status: 200 })
  } catch (err) {
    console.error('Webhook Error:', err instanceof Error ? err.message : err)
    return new NextResponse(
      JSON.stringify({ 
        error: 'Webhook error', 
        details: err instanceof Error ? err.message : 'Unknown error'
      }), 
      { status: 400 }
    )
  }
}
