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
    throw new Error('NEXT_PUBLIC_STRIPE_ENV must be set to either "development" or "production"')
  }
  
  if (stripeEnv !== 'development' && stripeEnv !== 'production') {
    throw new Error('NEXT_PUBLIC_STRIPE_ENV must be either "development" or "production"')
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
    throw new Error(`Missing Stripe checkout links for plans: ${missingLinks.join(', ')}`)
  }

  if (!config.customerBillingLink) {
    throw new Error('Missing Stripe customer billing link')
  }

  // Validate that we're not mixing test and live links
  const isTestLink = (url: string) => {
    if (!url) return false;
    return url.includes('test_') || url.includes('/test/');
  };
  
  const isTestPriceId = (id: string) => {
    if (!id) return false;
    return id.startsWith('price_test_');
  };

  const hasTestLinks = Object.values(config.checkoutLinks).some(isTestLink);
  const hasTestPriceIds = Object.values(config.productIds).some(isTestPriceId);
  const shouldBeTest = stripeEnv === 'development';

  if (hasTestLinks !== shouldBeTest || hasTestPriceIds !== shouldBeTest) {
    console.error('Environment:', stripeEnv);
    console.error('Links:', config.checkoutLinks);
    console.error('Price IDs:', config.productIds);
    throw new Error(
      shouldBeTest 
        ? 'Production links/prices detected in development environment' 
        : 'Test links/prices detected in production environment'
    );
  }

  return config;
}

export default getStripeConfig;
