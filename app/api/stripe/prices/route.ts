import { NextResponse } from 'next/server'
import Stripe from 'stripe'
import { getStripeConfig } from '@/config/stripe'

// Get the appropriate secret key based on environment
function getStripeSecretKey() {
  const stripeEnv = process.env.NEXT_PUBLIC_STRIPE_ENV
  if (stripeEnv === 'development') {
    return process.env.STRIPE_TEST_SECRET_KEY
  }
  return process.env.STRIPE_SECRET_KEY
}

const stripe = new Stripe(getStripeSecretKey() || '', {
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
    }
  })

  return [ids.starter, ids.growth, ids.scale]
}

export async function GET() {
  try {
    // First check if we have a valid Stripe secret key
    const secretKey = getStripeSecretKey()
    if (!secretKey) {
      console.error('Missing Stripe secret key');
      return NextResponse.json(
        { error: 'Stripe configuration error' },
        { status: 500 }
      );
    }

    const stripeConfig = getStripeConfig()
    const priceIds = getPriceIds()

    // Log the environment and configuration for debugging
    console.log('Environment:', process.env.NEXT_PUBLIC_STRIPE_ENV);
    console.log('Using secret key:', secretKey.slice(0, 8) + '...');
    console.log('Price IDs:', priceIds);

    // Validate that we have price IDs
    if (!priceIds.some(id => id)) {
      console.error('No valid price IDs found');
      return NextResponse.json(
        { error: 'No pricing information available' },
        { status: 500 }
      );
    }

    const prices = await Promise.all(
      priceIds.map(async (priceId, index) => {
        if (!priceId) {
          console.warn(`Missing price ID for index ${index}`);
          return null;
        }

        try {
          const price = await stripe.prices.retrieve(priceId, {
            expand: ['product']
          })
          const product = price.product as Stripe.Product
          
          // Get the checkout link based on the price ID's position
          let checkoutUrl = ''
          if (index === 0) checkoutUrl = stripeConfig.checkoutLinks.starter
          else if (index === 1) checkoutUrl = stripeConfig.checkoutLinks.growth
          else if (index === 2) checkoutUrl = stripeConfig.checkoutLinks.scale

          if (!checkoutUrl) {
            console.warn(`Missing checkout URL for price ${priceId}`);
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
          console.error(`Error fetching price ${priceId}:`, error);
          return null;
        }
      })
    )

    // Filter out any null values from prices that failed to fetch
    const validPrices = prices.filter((price): price is NonNullable<typeof price> => price !== null)

    if (validPrices.length === 0) {
      console.error('No valid prices were retrieved');
      return NextResponse.json(
        { error: 'Unable to retrieve pricing information' },
        { status: 500 }
      );
    }

    return NextResponse.json({ prices: validPrices })
  } catch (error) {
    console.error('Error in price fetching:', error);
    if (error instanceof Error) {
      return NextResponse.json(
        { error: error.message },
        { status: 500 }
      );
    }
    return NextResponse.json(
      { error: 'An unexpected error occurred while fetching prices' },
      { status: 500 }
    );
  }
}
