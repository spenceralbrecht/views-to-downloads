import { NextResponse } from 'next/server'
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'
import Stripe from 'stripe'

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2023-10-16'
})

export async function POST(request: Request) {
  try {
    const { priceId } = await request.json()
    
    // Get the user from Supabase auth
    const supabase = createRouteHandlerClient({ cookies })
    const { data: { user } } = await supabase.auth.getUser()
    
    if (!user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    // Create a Stripe checkout session
    const session = await stripe.checkout.sessions.create({
      customer_email: user.email,
      client_reference_id: user.id, // This must be a valid UUID from Supabase
      line_items: [
        {
          price: priceId,
          quantity: 1,
        },
      ],
      mode: 'subscription',
      success_url: `${process.env.NEXT_PUBLIC_TEST_APP_URL}/dashboard?success=true`, // Use test URL in development
      cancel_url: `${process.env.NEXT_PUBLIC_TEST_APP_URL}/dashboard?canceled=true`,
      automatic_tax: { enabled: true },
      tax_id_collection: { enabled: true },
      customer_creation: 'always', // Always create a new customer
      payment_method_types: ['card'],
      billing_address_collection: 'required',
      metadata: {
        userId: user.id
      }
    })

    return NextResponse.json({ url: session.url })
  } catch (error) {
    console.error('Error creating checkout session:', error)
    return NextResponse.json(
      { error: 'Error creating checkout session' },
      { status: 500 }
    )
  }
}
