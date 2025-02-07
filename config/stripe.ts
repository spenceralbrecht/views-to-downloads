interface StripeConfig {
  checkoutLinks: {
    standard: string;
  };
  productIds: {
    standard: string;
  };
}

const devConfig: StripeConfig = {
  checkoutLinks: {
    standard: 'https://billing.stripe.com/p/login/test_28o9CPbdf0uJ55m000'
  },
  productIds: {
    standard: 'price_test_123' // Replace with your actual test product ID
  }
}

const prodConfig: StripeConfig = {
  checkoutLinks: {
    standard: 'https://billing.stripe.com/p/login/test_28o9CPbdf0uJ55m000' // Replace with your actual production link
  },
  productIds: {
    standard: 'price_live_123' // Replace with your actual production product ID
  }
}

export const stripeConfig = process.env.NEXT_PUBLIC_STRIPE_ENV === 'production' ? prodConfig : devConfig
