import { NextResponse } from 'next/server'
import Stripe from 'stripe'
import { getStripeConfig } from '@/config/stripe'

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2023-10-16'
})

// Get the appropriate price IDs based on environment
function getPriceIds() {
  const stripeEnv = process.env.NEXT_PUBLIC_STRIPE_ENV
  if (!stripeEnv) {
    throw new Error('NEXT_PUBLIC_STRIPE_ENV must be set')
  }

  if (stripeEnv === 'development') {
    return [
      process.env.NEXT_PUBLIC_STRIPE_TEST_STARTER_PRICE_ID,
      process.env.NEXT_PUBLIC_STRIPE_TEST_GROWTH_PRICE_ID,
      process.env.NEXT_PUBLIC_STRIPE_TEST_SCALE_PRICE_ID,
    ]
  } else {
    return [
      process.env.NEXT_PUBLIC_STRIPE_STARTER_PRICE_ID,
      process.env.NEXT_PUBLIC_STRIPE_GROWTH_PRICE_ID,
      process.env.NEXT_PUBLIC_STRIPE_SCALE_PRICE_ID,
    ]
  }
}

export async function GET() {
  try {
    const stripeConfig = getStripeConfig()
    const priceIds = getPriceIds()

    const prices = await Promise.all(
      priceIds.map(async (priceId) => {
        if (!priceId) return null
        const price = await stripe.prices.retrieve(priceId, {
          expand: ['product']
        })
        const product = price.product as Stripe.Product
        
        // Get the checkout link based on the price ID's position (starter, growth, scale)
        let checkoutUrl = ''
        if (price.id === priceIds[0]) checkoutUrl = stripeConfig.checkoutLinks.starter
        else if (price.id === priceIds[1]) checkoutUrl = stripeConfig.checkoutLinks.growth
        else if (price.id === priceIds[2]) checkoutUrl = stripeConfig.checkoutLinks.scale

        return {
          id: price.id,
          name: product.name,
          price: (price.unit_amount! / 100).toString(),
          interval: price.recurring?.interval || 'month',
          features: product.metadata.features ? JSON.parse(product.metadata.features) : [],
          popular: product.metadata.popular === 'true',
          checkoutUrl: checkoutUrl
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
