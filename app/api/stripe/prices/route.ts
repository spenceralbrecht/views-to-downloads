import { NextResponse } from 'next/server'
import Stripe from 'stripe'
import { getStripeConfig } from '@/config/stripe'

// Get the appropriate secret key based on environment
function getStripeSecretKey() {
  const stripeEnv = process.env.NEXT_PUBLIC_STRIPE_ENV
  const secretKey = stripeEnv === 'development' 
    ? process.env.STRIPE_TEST_SECRET_KEY 
    : process.env.STRIPE_SECRET_KEY

  if (!secretKey) {
    throw new Error(`Missing Stripe secret key for environment: ${stripeEnv}`)
  }

  return secretKey
}

const stripe = new Stripe(getStripeSecretKey(), {
  apiVersion: '2025-01-27.acacia'
})

// Get the appropriate price IDs based on environment
function getPriceIds() {
  const stripeEnv = process.env.NEXT_PUBLIC_STRIPE_ENV || 'development'
  console.log('Getting price IDs for environment:', stripeEnv)

  const ids = stripeEnv === 'production' 
    ? {
        starter: process.env.NEXT_PUBLIC_STRIPE_STARTER_PRICE_ID,
        growth: process.env.NEXT_PUBLIC_STRIPE_GROWTH_PRICE_ID,
        scale: process.env.NEXT_PUBLIC_STRIPE_SCALE_PRICE_ID
      }
    : {
        starter: process.env.NEXT_PUBLIC_STRIPE_TEST_STARTER_PRICE_ID,
        growth: process.env.NEXT_PUBLIC_STRIPE_TEST_GROWTH_PRICE_ID,
        scale: process.env.NEXT_PUBLIC_STRIPE_TEST_SCALE_PRICE_ID
      }

  // Log which IDs are missing
  Object.entries(ids).forEach(([tier, id]) => {
    if (!id) {
      console.error(`Missing ${stripeEnv} price ID for ${tier} tier`)
    } else {
      console.log(`${tier} price ID: ${id.slice(0, 8)}...`)
    }
  })

  return [ids.starter, ids.growth, ids.scale]
}

export async function GET() {
  try {
    // First check if we have a valid Stripe secret key
    const secretKey = getStripeSecretKey()
    const stripeEnv = process.env.NEXT_PUBLIC_STRIPE_ENV || 'development'
    
    console.log('=== Stripe Configuration ===')
    console.log('Environment:', stripeEnv)
    console.log('Secret key present:', !!secretKey)
    if (secretKey) {
      console.log('Secret key prefix:', secretKey.startsWith('sk_test_') ? 'sk_test_' : 'sk_live_')
    }

    const stripeConfig = getStripeConfig()
    const priceIds = getPriceIds()

    console.log('=== Price IDs ===')
    priceIds.forEach((id, index) => {
      if (id) {
        console.log(`Price ID ${index}: ${id.slice(0, 8)}... (${id.startsWith('price_test_') ? 'test' : 'live'})`)
      } else {
        console.log(`Price ID ${index}: missing`)
      }
    })

    console.log('=== Checkout Links ===')
    Object.entries(stripeConfig.checkoutLinks).forEach(([tier, url]) => {
      if (url) {
        console.log(`${tier}: ${url.includes('test') ? 'test link' : 'live link'}`)
      } else {
        console.log(`${tier}: missing`)
      }
    })

    // Validate that we have price IDs
    if (!priceIds.some(id => id)) {
      const error = `No valid price IDs found for environment: ${stripeEnv}`
      console.error(error)
      return NextResponse.json({ error }, { status: 500 })
    }

    const prices = await Promise.all(
      priceIds.map(async (priceId, index) => {
        if (!priceId) {
          console.warn(`Missing price ID for index ${index}`)
          return null
        }

        try {
          console.log(`Attempting to fetch price info for ID: ${priceId}`)
          const price = await stripe.prices.retrieve(priceId, {
            expand: ['product']
          })
          console.log(`Successfully retrieved price info for ID: ${priceId}`)
          
          const product = price.product as Stripe.Product
          
          // Get the checkout link based on the price ID's position
          let checkoutUrl = ''
          if (index === 0) checkoutUrl = stripeConfig.checkoutLinks.starter
          else if (index === 1) checkoutUrl = stripeConfig.checkoutLinks.growth
          else if (index === 2) checkoutUrl = stripeConfig.checkoutLinks.scale

          if (!checkoutUrl) {
            console.warn(`Missing checkout URL for price ${priceId}`)
          }

          return {
            id: price.id,
            name: product.name,
            price: (price.unit_amount! / 100).toString(),
            interval: price.recurring?.interval || 'month',
            features: product.metadata.features ? JSON.parse(product.metadata.features) : [],
            popular: product.metadata.popular === 'true',
            checkoutUrl: checkoutUrl
          }
        } catch (error) {
          if (error instanceof Stripe.errors.StripeError) {
            console.error(`Stripe error for price ${priceId}:`, {
              type: error.type,
              code: error.code,
              message: error.message
            })
          } else {
            console.error(`Error fetching price ${priceId}:`, error)
          }
          return null
        }
      })
    )

    // Filter out any null values from prices that failed to fetch
    const validPrices = prices.filter((price): price is NonNullable<typeof price> => price !== null)

    if (validPrices.length === 0) {
      const error = 'No valid prices were retrieved. Check server logs for details.'
      console.error(error)
      return NextResponse.json({ error }, { status: 500 })
    }

    console.log('=== Successfully Retrieved Prices ===')
    console.log('Number of valid prices:', validPrices.length)
    validPrices.forEach((price, index) => {
      console.log(`Price ${index}:`, {
        id: price.id,
        name: price.name,
        price: price.price,
        hasCheckoutUrl: !!price.checkoutUrl
      })
    })

    return NextResponse.json({ prices: validPrices })
  } catch (error) {
    console.error('=== Fatal Error ===')
    if (error instanceof Stripe.errors.StripeError) {
      console.error('Stripe error:', {
        type: error.type,
        code: error.code,
        message: error.message
      })
    } else {
      console.error('Error in price fetching:', error)
    }
    const errorMessage = error instanceof Error ? error.message : 'An unexpected error occurred'
    return NextResponse.json({ error: errorMessage }, { status: 500 })
  }
}
