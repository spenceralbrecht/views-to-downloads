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
      case 'checkout.session.completed': {
        const session = event.data.object as Stripe.Checkout.Session
        const customerId = session.customer as string
        const subscriptionId = session.subscription as string
        const userId = session.client_reference_id

        if (!userId) {
          console.log('No client_reference_id in session');
          return { status: 'success', message: 'Skipped - no client_reference_id' }
        }

        const subscription = await stripe.subscriptions.retrieve(subscriptionId)
        const priceId = subscription.items.data[0].price.id

        const { data: { user }, error: userError } = await supabaseAdmin.auth.admin.getUserById(userId)
        
        if (userError || !user) {
          console.error('Error finding user:', userError);
          return { status: 'success', message: 'Skipped - user not found' }
        }

        let planName = 'starter'
        if (priceId === process.env.NEXT_PUBLIC_STRIPE_TEST_GROWTH_PRICE_ID) {
          planName = 'growth'
        } else if (priceId === process.env.NEXT_PUBLIC_STRIPE_TEST_SCALE_PRICE_ID) {
          planName = 'scale'
        }

        await supabaseAdmin.auth.admin.updateUserById(userId, {
          user_metadata: {
            ...user.user_metadata,
            stripe_customer_id: customerId,
            stripe_subscription_id: subscriptionId,
            stripe_subscription_status: subscription.status,
            stripe_price_id: priceId,
            stripe_plan_name: planName
          }
        })
        return { status: 'success', message: 'User updated with subscription info' }
      }

      case 'customer.subscription.updated': {
        const subscription = event.data.object as Stripe.Subscription
        const customerId = subscription.customer as string

        const { data: users, error: userError } = await supabaseAdmin.auth.admin.listUsers()
        if (userError) {
          console.error('Error listing users:', userError);
          return { status: 'error', message: 'Failed to list users' }
        }

        const user = users.users.find(u => u.user_metadata?.stripe_customer_id === customerId)
        if (!user) {
          console.log('No user found with customer ID:', customerId);
          return { status: 'success', message: 'Skipped - user not found' }
        }

        await supabaseAdmin.auth.admin.updateUserById(user.id, {
          user_metadata: {
            ...user.user_metadata,
            stripe_subscription_status: subscription.status,
            stripe_price_id: subscription.items.data[0].price.id
          }
        })
        return { status: 'success', message: 'Subscription status updated' }
      }

      case 'customer.subscription.deleted': {
        const subscription = event.data.object as Stripe.Subscription
        const customerId = subscription.customer as string

        const { data: users, error: userError } = await supabaseAdmin.auth.admin.listUsers()
        if (userError) {
          console.error('Error listing users:', userError);
          return { status: 'error', message: 'Failed to list users' }
        }

        const user = users.users.find(u => u.user_metadata?.stripe_customer_id === customerId)
        if (!user) {
          console.log('No user found with customer ID:', customerId);
          return { status: 'success', message: 'Skipped - user not found' }
        }

        await supabaseAdmin.auth.admin.updateUserById(user.id, {
          user_metadata: {
            ...user.user_metadata,
            stripe_subscription_status: 'canceled',
            stripe_price_id: null,
            stripe_plan_name: null
          }
        })
        return { status: 'success', message: 'Subscription canceled' }
      }

      default:
        console.log('Unhandled event type:', event.type);
        return { status: 'success', message: `Unhandled event type: ${event.type}` }
    }
  } catch (error) {
    console.error('Error in webhook handler:', error);
    return { 
      status: 'error', 
      message: error instanceof Error ? error.message : 'Unknown error'
    }
  }
}

export async function POST(req: Request) {
  if (!process.env.STRIPE_TEST_WEBHOOK_SECRET) {
    console.error('Missing STRIPE_TEST_WEBHOOK_SECRET');
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

    console.log('Headers:', JSON.stringify(Object.fromEntries(headers().entries()), null, 2))
    console.log('Signature:', sig)
    console.log('Body length:', text.length)
    console.log('First 100 chars of body:', text.substring(0, 100))

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
