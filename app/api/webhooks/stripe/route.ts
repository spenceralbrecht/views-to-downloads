import { headers } from 'next/headers'
import { NextResponse } from 'next/server'
import Stripe from 'stripe'
import { createClient } from '@supabase/supabase-js'

// Edge Runtime configuration
export const runtime = 'edge'

// Configure Stripe with minimal options for Edge
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2024-12-18.acacia',
  typescript: true
})

// Create a Supabase client with the service role key
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

async function handleStripeWebhook(event) {
  switch (event.type) {
    case 'checkout.session.completed': {
      const session = event.data.object as Stripe.Checkout.Session
      const customerId = session.customer as string
      const subscriptionId = session.subscription as string
      const userId = session.client_reference_id

      if (!userId) {
        console.error('No client_reference_id in session')
        return { error: 'No client_reference_id' }
      }

      // Validate UUID format
      const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i
      if (!uuidRegex.test(userId)) {
        console.error('Invalid client_reference_id format:', userId)
        return { error: 'Invalid client_reference_id format' }
      }

      // Get the subscription details
      const subscription = await stripe.subscriptions.retrieve(subscriptionId)
      const priceId = subscription.items.data[0].price.id

      // Get current user metadata
      const { data: { user }, error: userError } = await supabaseAdmin.auth.admin.getUserById(userId)
      
      if (userError) {
        console.error('Error getting user:', userError)
        return { error: 'Error getting user' }
      }

      // Map price ID to plan name
      let planName = 'starter'
      if (priceId === process.env.NEXT_PUBLIC_STRIPE_TEST_GROWTH_PRICE_ID) {
        planName = 'growth'
      } else if (priceId === process.env.NEXT_PUBLIC_STRIPE_TEST_SCALE_PRICE_ID) {
        planName = 'scale'
      }

      // Update the user's metadata in Supabase, preserving existing metadata
      const { error } = await supabaseAdmin.auth.admin.updateUserById(
        userId,
        {
          user_metadata: {
            ...user?.user_metadata, // Preserve existing metadata
            stripe_customer_id: customerId,
            stripe_subscription_id: subscriptionId,
            stripe_subscription_status: subscription.status,
            stripe_price_id: priceId,
            stripe_plan_name: planName
          }
        }
      )

      if (error) {
        console.error('Error updating user:', error)
        return { error: 'Error updating user' }
      }
      break
    }

    case 'customer.subscription.updated': {
      const subscription = event.data.object as Stripe.Subscription
      const customerId = subscription.customer as string

      // Get the user with this stripe_customer_id
      const { data: users, error: userError } = await supabaseAdmin.auth.admin.listUsers()
      const user = users?.users.find(
        (u) => u.user_metadata?.stripe_customer_id === customerId
      )

      if (userError || !user) {
        console.error('Error finding user:', userError)
        return { error: 'Error finding user' }
      }

      // Update the user's metadata
      const { error } = await supabaseAdmin.auth.admin.updateUserById(
        user.id,
        {
          user_metadata: {
            ...user.user_metadata, // Preserve existing metadata
            stripe_subscription_status: subscription.status,
            stripe_price_id: subscription.items.data[0].price.id
          }
        }
      )

      if (error) {
        console.error('Error updating user:', error)
        return { error: 'Error updating user' }
      }
      break
    }

    case 'customer.subscription.deleted': {
      const subscription = event.data.object as Stripe.Subscription
      const customerId = subscription.customer as string

      // Get the user with this stripe_customer_id
      const { data: users, error: userError } = await supabaseAdmin.auth.admin.listUsers()
      const user = users?.users.find(
        (u) => u.user_metadata?.stripe_customer_id === customerId
      )

      if (userError || !user) {
        console.error('Error finding user:', userError)
        return { error: 'Error finding user' }
      }

      // Update the user's metadata
      const { error } = await supabaseAdmin.auth.admin.updateUserById(
        user.id,
        {
          user_metadata: {
            ...user.user_metadata, // Preserve existing metadata
            stripe_subscription_status: 'canceled',
            stripe_price_id: null,
            stripe_plan_name: null
          }
        }
      )

      if (error) {
        console.error('Error updating user:', error)
        return { error: 'Error updating user' }
      }
      break
    }
  }

  return { message: 'Webhook processed' }
}

export async function POST(req: Request) {
  console.log('Webhook received:', req.url);
  const body = await req.text()
  const signature = headers().get('stripe-signature')

  if (!signature) {
    console.log('No signature found');
    return new NextResponse(
      JSON.stringify({ error: 'No signature' }), 
      { 
        status: 400,
        headers: {
          'Content-Type': 'application/json'
        }
      }
    )
  }

  try {
    console.log('Constructing event with signature:', signature.substring(0, 10) + '...');
    const event = await stripe.webhooks.constructEventAsync(
      body,
      signature,
      process.env.STRIPE_TEST_WEBHOOK_SECRET!
    )

    // Add response headers to prevent redirects
    const response = await handleStripeWebhook(event)
    return new NextResponse(JSON.stringify(response), {
      status: 200,
      headers: {
        'Content-Type': 'application/json'
      }
    })
  } catch (err) {
    console.error('Error processing webhook:', err);
    return new NextResponse(
      JSON.stringify({ error: 'Webhook error', details: err instanceof Error ? err.message : 'Unknown error' }), 
      { 
        status: 400,
        headers: {
          'Content-Type': 'application/json'
        }
      }
    )
  }
}
