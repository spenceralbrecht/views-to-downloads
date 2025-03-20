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

// Helper function to append email to payment links
export function appendEmailToLink(link: string, email: string | null | undefined): string {
  console.log('appendEmailToLink called with:', { link, email });
  
  if (!link) {
    console.log('appendEmailToLink returning empty link due to missing link');
    return '';
  }
  
  if (!email) {
    console.log('appendEmailToLink returning original link due to missing email');
    return link;
  }
  
  try {
    // Check if the URL already has query parameters
    const hasQueryParams = link.includes('?');
    const separator = hasQueryParams ? '&' : '?';
    
    // Properly encode the email
    const encodedEmail = encodeURIComponent(email.trim());
    
    // Append the email parameter
    const result = `${link}${separator}prefilled_email=${encodedEmail}`;
    console.log('appendEmailToLink returning:', result);
    return result;
  } catch (error) {
    console.error('Error in appendEmailToLink:', error);
    return link; // Return original link if there's an error
  }
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

export function getStripeConfig(email?: string | null): StripeConfig {
  console.log('getStripeConfig called with email:', email);
  
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

  // If email is provided, append it to all links
  if (email) {
    const result = {
      ...config,
      checkoutLinks: {
        starter: appendEmailToLink(config.checkoutLinks.starter, email),
        growth: appendEmailToLink(config.checkoutLinks.growth, email),
        scale: appendEmailToLink(config.checkoutLinks.scale, email)
      },
      customerBillingLink: appendEmailToLink(config.customerBillingLink, email)
    };
    console.log('Modified config with email:', result);
    return result;
  }

  console.log('No email provided, returning original config');
  return config
}

export default getStripeConfig;
