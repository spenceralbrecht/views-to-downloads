import { createClient } from '@supabase/supabase-js'
import { NextResponse } from 'next/server'
import Stripe from 'stripe'

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

export async function POST(req: Request) {
  try {
    const { priceId, userId } = await req.json()

    if (!userId || !priceId) {
      return new NextResponse(
        JSON.stringify({ error: 'Missing required fields' }),
        { status: 400 }
      )
    }

    // Check if user already has a subscription
    const { data: existingSub } = await supabaseAdmin
      .from('subscriptions')
      .select()
      .eq('user_id', userId)
      .single()

    // If they have an active subscription, redirect to billing portal
    if (existingSub?.status === 'active') {
      const session = await stripe.billingPortal.sessions.create({
        customer: existingSub.stripe_customer_id,
        return_url: process.env.NEXT_PUBLIC_TEST_APP_URL + '/dashboard'
      })
      return new NextResponse(JSON.stringify({ url: session.url }))
    }

    // Get user email from Supabase
    const { data: { user }, error: userError } = await supabaseAdmin.auth.admin.getUserById(userId)
    if (userError || !user?.email) {
      return new NextResponse(
        JSON.stringify({ error: 'User not found' }),
        { status: 404 }
      )
    }

    // Create new checkout session
    const session = await stripe.checkout.sessions.create({
      mode: 'subscription',
      payment_method_types: ['card'],
      line_items: [
        {
          price: priceId,
          quantity: 1
        }
      ],
      success_url: process.env.NEXT_PUBLIC_TEST_APP_URL + '/dashboard?success=true',
      cancel_url: process.env.NEXT_PUBLIC_TEST_APP_URL + '/dashboard?canceled=true',
      client_reference_id: userId,
      customer_email: user.email,
      subscription_data: {
        metadata: {
          userId: userId // Add userId to subscription metadata
        }
      },
      customer_creation: 'always',
      metadata: {
        userId: userId // Add userId to session metadata
      }
    })

    return new NextResponse(JSON.stringify({ url: session.url }))
  } catch (err) {
    console.error('Error in checkout:', err)
    return new NextResponse(
      JSON.stringify({ error: err instanceof Error ? err.message : 'Unknown error' }),
      { status: 500 }
    )
  }
}
