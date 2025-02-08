import { NextResponse } from 'next/server'
import Stripe from 'stripe'

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2023-10-16'
})

const PRICE_IDS = [
  process.env.NEXT_PUBLIC_STRIPE_TEST_STARTER_PRICE_ID,
  process.env.NEXT_PUBLIC_STRIPE_TEST_GROWTH_PRICE_ID,
  process.env.NEXT_PUBLIC_STRIPE_TEST_SCALE_PRICE_ID,
]

const CHECKOUT_LINKS = {
  [process.env.NEXT_PUBLIC_STRIPE_TEST_STARTER_PRICE_ID!]: process.env.NEXT_PUBLIC_STRIPE_TEST_STARTER_CHECKOUT_URL,
  [process.env.NEXT_PUBLIC_STRIPE_TEST_GROWTH_PRICE_ID!]: process.env.NEXT_PUBLIC_STRIPE_TEST_GROWTH_CHECKOUT_URL,
  [process.env.NEXT_PUBLIC_STRIPE_TEST_SCALE_PRICE_ID!]: process.env.NEXT_PUBLIC_STRIPE_TEST_SCALE_CHECKOUT_URL,
}

export async function GET() {
  try {
    const prices = await Promise.all(
      PRICE_IDS.map(async (priceId) => {
        if (!priceId) return null
        const price = await stripe.prices.retrieve(priceId, {
          expand: ['product']
        })
        const product = price.product as Stripe.Product
        return {
          id: price.id,
          name: product.name,
          price: (price.unit_amount! / 100).toString(),
          interval: price.recurring?.interval || 'month',
          features: product.metadata.features ? JSON.parse(product.metadata.features) : [],
          popular: product.metadata.popular === 'true',
          checkoutUrl: CHECKOUT_LINKS[price.id] || ''
        }
      })
    )

    // Filter out any null values from prices that failed to fetch
    const validPrices = prices.filter((price): price is NonNullable<typeof price> => price !== null)

    return NextResponse.json({ prices: validPrices })
  } catch (error) {
    console.error('Error fetching Stripe prices:', error)
    return NextResponse.json(
      { error: 'Error fetching prices' },
      { status: 500 }
    )
  }
}
