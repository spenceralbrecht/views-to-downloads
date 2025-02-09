import { headers } from 'next/headers'
import { NextResponse } from 'next/server'
import Stripe from 'stripe'
import { createClient } from '@supabase/supabase-js'

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2023-10-16'
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

export async function POST(req: Request) {
  const body = await req.text()
  const signature = headers().get('stripe-signature')

  if (!signature) {
    return new NextResponse('No signature', { status: 400 })
  }

  try {
    const event = stripe.webhooks.constructEvent(
      body,
      signature,
      process.env.STRIPE_TEST_WEBHOOK_SECRET!
    )

    switch (event.type) {
      case 'checkout.session.completed': {
        const session = event.data.object as Stripe.Checkout.Session
        const customerId = session.customer as string
        const subscriptionId = session.subscription as string
        const userId = session.client_reference_id

        if (!userId) {
          console.error('No client_reference_id in session')
          return new NextResponse('No client_reference_id', { status: 400 })
        }

        // Validate UUID format
        const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i
        if (!uuidRegex.test(userId)) {
          console.error('Invalid client_reference_id format:', userId)
          return new NextResponse('Invalid client_reference_id format', { status: 400 })
        }

        // Get the subscription details
        const subscription = await stripe.subscriptions.retrieve(subscriptionId)
        const priceId = subscription.items.data[0].price.id

        // Get current user metadata
        const { data: { user }, error: userError } = await supabaseAdmin.auth.admin.getUserById(userId)
        
        if (userError) {
          console.error('Error getting user:', userError)
          return new NextResponse('Error getting user', { status: 500 })
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
          return new NextResponse('Error updating user', { status: 500 })
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
          return new NextResponse('Error finding user', { status: 500 })
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
          return new NextResponse('Error updating user', { status: 500 })
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
          return new NextResponse('Error finding user', { status: 500 })
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
          return new NextResponse('Error updating user', { status: 500 })
        }
        break
      }
    }

    return new NextResponse('Webhook processed', { status: 200 })
  } catch (err) {
    console.error('Error processing webhook:', err)
    return new NextResponse('Webhook error', { status: 400 })
  }
}
