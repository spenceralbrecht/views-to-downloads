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
  const stripeEnv = process.env.NEXT_PUBLIC_STRIPE_ENV || 'development'
  console.log('🔧 Stripe Environment:', stripeEnv)
  console.log('🔧 Using config:', stripeEnv === 'development' ? 'development (test mode)' : 'production (live mode)')
  
  const config = stripeEnv === 'development' ? devConfig : prodConfig

  if (!config.checkoutLinks.starter || !config.checkoutLinks.growth || !config.checkoutLinks.scale) {
    console.warn('Missing Stripe checkout links')
  }

  if (!config.productIds.starter || !config.productIds.growth || !config.productIds.scale) {
    console.warn('Missing Stripe product IDs')
  }

  if (!config.customerBillingLink) {
    console.warn('Missing Stripe customer billing link')
  }

  return config
}

export default getStripeConfig
