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
 * @param tier Optional plan tier name (e.g., 'Starter', 'Growth', 'Scale') - for logging only
 */
export function trackStripeCheckout(email?: string | null, tier?: string) {
  if (typeof window !== 'undefined' && window.twq) {
    // Log the tier for debugging but don't send it to Twitter as it's not supported
    console.log(`Tracking Stripe checkout with Twitter for ${tier || 'unknown'} plan`);
    window.twq('event', 'tw-oyx5r-p663b', {
      email_address: email || null
      // content_name parameter is not supported by Twitter's API
    });
  }
} 