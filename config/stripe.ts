interface StripeConfig {
  checkoutLinks: {
    starter: string;
    growth: string;
    scale: string;
  };
  productIds: {
    starter: string;
    growth: string;
    scale: string;
  };
  customerBillingLink: string;
}

const devConfig: StripeConfig = {
  checkoutLinks: {
    starter: process.env.NEXT_PUBLIC_STRIPE_TEST_STARTER_LINK || '',
    growth: process.env.NEXT_PUBLIC_STRIPE_TEST_GROWTH_LINK || '',
    scale: process.env.NEXT_PUBLIC_STRIPE_TEST_SCALE_LINK || ''
  },
  productIds: {
    starter: process.env.NEXT_PUBLIC_STRIPE_TEST_STARTER_PRICE_ID || '',
    growth: process.env.NEXT_PUBLIC_STRIPE_TEST_GROWTH_PRICE_ID || '',
    scale: process.env.NEXT_PUBLIC_STRIPE_TEST_SCALE_PRICE_ID || ''
  },
  customerBillingLink: process.env.NEXT_PUBLIC_STRIPE_TEST_CUSTOMER_BILLING_LINK || ''
}

const prodConfig: StripeConfig = {
  checkoutLinks: {
    starter: process.env.NEXT_PUBLIC_STRIPE_STARTER_LINK || '',
    growth: process.env.NEXT_PUBLIC_STRIPE_GROWTH_LINK || '',
    scale: process.env.NEXT_PUBLIC_STRIPE_SCALE_LINK || ''
  },
  productIds: {
    starter: process.env.NEXT_PUBLIC_STRIPE_STARTER_PRICE_ID || '',
    growth: process.env.NEXT_PUBLIC_STRIPE_GROWTH_PRICE_ID || '',
    scale: process.env.NEXT_PUBLIC_STRIPE_SCALE_PRICE_ID || ''
  },
  customerBillingLink: process.env.NEXT_PUBLIC_STRIPE_CUSTOMER_BILLING_LINK || ''
}

export function getStripeConfig(): StripeConfig {
  const stripeEnv = process.env.NEXT_PUBLIC_STRIPE_ENV
  if (!stripeEnv) {
    console.warn('NEXT_PUBLIC_STRIPE_ENV not set, defaulting to production')
    return prodConfig
  }
  
  if (stripeEnv !== 'development' && stripeEnv !== 'production') {
    console.warn('NEXT_PUBLIC_STRIPE_ENV must be either "development" or "production", defaulting to production')
    return prodConfig
  }

  console.log('🔧 Stripe Environment:', stripeEnv)
  console.log('🔧 Using config:', stripeEnv === 'development' ? 'development (test mode)' : 'production (live mode)')
  
  const config = stripeEnv === 'development' ? devConfig : prodConfig

  // Validate required configuration
  const missingLinks = []
  if (!config.checkoutLinks.starter) missingLinks.push('starter')
  if (!config.checkoutLinks.growth) missingLinks.push('growth')
  if (!config.checkoutLinks.scale) missingLinks.push('scale')
  
  if (missingLinks.length > 0) {
    console.warn(`Missing Stripe checkout links for plans: ${missingLinks.join(', ')}`)
  }

  if (!config.customerBillingLink) {
    console.warn('Missing Stripe customer billing link')
  }

  // Log configuration for debugging
  console.log('Using links:', {
    starter: config.checkoutLinks.starter || 'missing',
    growth: config.checkoutLinks.growth || 'missing',
    scale: config.checkoutLinks.scale || 'missing'
  })

  return config
}

export default getStripeConfig;
