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

// Helper function to append parameters to payment links
export function appendParamsToLink(
  link: string, 
  email?: string | null | undefined, 
  userId?: string | null | undefined
): string {
  if (!link) {
    console.log('appendParamsToLink returning empty link due to missing base link');
    return '';
  }

  try {
    const url = new URL(link); // Use URL constructor for robust parameter handling

    if (email) {
      const normalizedEmail = email.trim();
      if (normalizedEmail) {
        url.searchParams.set('prefilled_email', normalizedEmail);
        console.log('Appended prefilled_email:', normalizedEmail);
      } else {
        console.log('Skipped appending empty/whitespace email');
      }
    } else {
      console.log('No email provided to appendParamsToLink');
    }

    if (userId) {
       if (userId.trim()) {
         url.searchParams.set('client_reference_id', userId.trim());
         console.log('Appended client_reference_id:', userId.trim());
       } else {
          console.log('Skipped appending empty/whitespace userId');
       }
    } else {
      console.log('No userId provided to appendParamsToLink');
    }

    const result = url.toString();
    console.log('appendParamsToLink returning:', result);
    return result;
  } catch (error) {
    console.error('Error constructing URL or appending params in appendParamsToLink:', error);
    // Attempt to append manually as a fallback (less robust)
    try {
       let tempLink = link;
       const hasQueryParams = link.includes('?');
       let separator = hasQueryParams ? '&' : '?';

       if (email && email.trim()) {
         tempLink = `${tempLink}${separator}prefilled_email=${encodeURIComponent(email.trim())}`;
         separator = '&'; // Subsequent params always use &
       }
       if (userId && userId.trim()) {
         tempLink = `${tempLink}${separator}client_reference_id=${encodeURIComponent(userId.trim())}`;
       }
       console.warn('appendParamsToLink returning link constructed via fallback method:', tempLink);
       return tempLink;
    } catch (fallbackError) {
       console.error('Error in appendParamsToLink fallback:', fallbackError);
       return link; // Return original link if even fallback fails
    }
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

export function getStripeConfig(
  email?: string | null, 
  userId?: string | null // Add userId parameter
): StripeConfig {
  console.log('getStripeConfig called with email:', email, 'and userId:', userId);
  
  const stripeEnv = process.env.NEXT_PUBLIC_STRIPE_ENV
  if (!stripeEnv) {
    console.warn('NEXT_PUBLIC_STRIPE_ENV not set, defaulting to production')
    return prodConfig // Return unmodified config if env var missing
  }
  
  if (stripeEnv !== 'development' && stripeEnv !== 'production') {
    console.warn('NEXT_PUBLIC_STRIPE_ENV must be either "development" or "production", defaulting to production')
    return prodConfig // Return unmodified config if env var invalid
  }

  console.log('🔧 Stripe Environment:', stripeEnv)
  console.log('🔧 Using config:', stripeEnv === 'development' ? 'development (test mode)' : 'production (live mode)')
  
  const baseConfig = stripeEnv === 'development' ? devConfig : prodConfig

  // Validate required base configuration links before appending params
  const missingLinks = []
  if (!baseConfig.checkoutLinks.starter) missingLinks.push('starter checkout')
  if (!baseConfig.checkoutLinks.growth) missingLinks.push('growth checkout')
  if (!baseConfig.checkoutLinks.scale) missingLinks.push('scale checkout')
  if (!baseConfig.customerBillingLink) missingLinks.push('customer billing')
  
  if (missingLinks.length > 0) {
    console.warn(`Missing base Stripe links for: ${missingLinks.join(', ')}`)
    // Consider returning baseConfig here or throwing an error if links are critical
  }

  // If email or userId is provided, create a new config object with appended params
  if (email || userId) {
    console.log('Appending params to Stripe links...');
    const result = {
      ...baseConfig,
      checkoutLinks: {
        starter: appendParamsToLink(baseConfig.checkoutLinks.starter, email, userId),
        growth: appendParamsToLink(baseConfig.checkoutLinks.growth, email, userId),
        scale: appendParamsToLink(baseConfig.checkoutLinks.scale, email, userId)
      },
      customerBillingLink: appendParamsToLink(baseConfig.customerBillingLink, email, userId)
    };
    console.log('Modified config with appended params:', result);
    return result;
  }

  console.log('No email or userId provided, returning original config');
  return baseConfig // Return the base config if no email/userId to append
}

export default getStripeConfig;
