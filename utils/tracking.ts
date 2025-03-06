/**
 * Utility functions for tracking user actions and conversions
 */

declare global {
  interface Window {
    twq?: (command: string, event: string, params?: object) => void;
  }
}

/**
 * Tracks a Stripe checkout initiation with Twitter's conversion tracking
 * @param email The user's email address
 */
export function trackStripeCheckout(email?: string | null) {
  if (typeof window !== 'undefined' && window.twq) {
    console.log('Tracking Stripe checkout initiation with Twitter');
    window.twq('event', 'tw-oyx5r-p663b', {
      email_address: email || null
    });
  }
} 