/**
 * Feature flag utilities for enabling/disabling features based on environment variables
 */

/**
 * Check if TikTok integration is enabled
 * Set NEXT_PUBLIC_ENABLE_TIKTOK=true in .env.local to enable TikTok integration
 */
export const isTikTokEnabled = (): boolean => {
  // Default to disabled if environment variable is not set
  return process.env.NEXT_PUBLIC_ENABLE_TIKTOK === 'true';
};
