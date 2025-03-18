import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'

// TikTok API configuration
// These should be set in your .env.local file
const TIKTOK_CLIENT_KEY = process.env.NEXT_PUBLIC_TIKTOK_CLIENT_KEY || 'your-tiktok-client-id'
const TIKTOK_CLIENT_SECRET = process.env.TIKTOK_CLIENT_SECRET // This should only be used server-side
const TIKTOK_REDIRECT_URI = process.env.NEXT_PUBLIC_TIKTOK_REDIRECT_URI || 'http://localhost:3000/api/auth/tiktok/callback'
const TIKTOK_API_BASE_URL = 'https://open.tiktokapis.com/v2'

// Types
export interface TikTokUser {
  open_id: string
  union_id: string
  display_name: string
  avatar_url: string
  avatar_url_100: string
  // Optional fields that might not be available in basic scope
  avatar_url_200?: string
  bio_description?: string
  profile_deep_link?: string
  is_verified?: boolean
  // Legacy fields kept as optional for backward compatibility
  follower_count?: number
  following_count?: number
  likes_count?: number
  video_count?: number
}

export interface TikTokTokenResponse {
  access_token: string
  refresh_token: string
  expires_in: number
  open_id: string
  scope: string
  token_type: string
}

export interface TikTokUserResponse {
  data: {
    user: TikTokUser
  }
  error?: {
    code: string
    message: string
    log_id: string
  }
}

export interface ConnectedAccount {
  id: string
  user_id: string
  provider: string
  provider_account_id: string
  username: string
  display_name?: string
  profile_picture?: string
  created_at: string
  metadata?: any
}

// Service class
export class TikTokService {
  private supabase = createClientComponentClient()

  /**
   * Initiate the TikTok OAuth flow using the server-side approach
   * This redirects to our own OAuth endpoint, which handles the PKCE flow securely
   */
  async initiateAuth(): Promise<void> {
    if (typeof window !== 'undefined') {
      // Instead of building the auth URL on the client and managing PKCE ourselves,
      // we redirect to our server-side endpoint that handles all of this securely
      window.location.href = '/api/auth/tiktok/oauth';
    }
  }

  /**
   * Save the TikTok account to the database
   */
  async saveAccount(
    userId: string, 
    tikTokUser: TikTokUser, 
    accessToken: string, 
    refreshToken: string, 
    expiresIn: number
  ): Promise<{ success: boolean, error?: any, data?: any }> {
    const expiresAt = new Date()
    expiresAt.setSeconds(expiresAt.getSeconds() + expiresIn)
    
    // Store only essential metadata
    const metadata = {
      bio_description: tikTokUser.bio_description || '',
      profile_deep_link: tikTokUser.profile_deep_link || '',
      is_verified: tikTokUser.is_verified || false
    }
    
    console.log('Inserting TikTok account with data:', {
      provider: 'tiktok',
      provider_account_id: tikTokUser.open_id,
      username: tikTokUser.display_name,
      // Omitting sensitive data like tokens
    });

    try {
      const { data, error } = await this.supabase.from('connected_accounts').insert({
        user_id: userId,
        provider: 'tiktok',
        provider_account_id: tikTokUser.open_id,
        username: tikTokUser.display_name,
        display_name: tikTokUser.display_name,
        profile_picture: tikTokUser.avatar_url_200 || tikTokUser.avatar_url,
        access_token: accessToken,
        refresh_token: refreshToken,
        token_expires_at: expiresAt.toISOString(),
        metadata
      }).select();
      
      if (error) {
        console.error('Error saving TikTok account:', error);
        return { success: false, error };
      }
      
      console.log('TikTok account saved successfully:', data);
      return { success: true, data };
    } catch (error) {
      console.error('Exception saving TikTok account:', error);
      return { success: false, error };
    }
  }

  /**
   * Disconnect a TikTok account
   */
  async disconnectAccount(accountId: string): Promise<void> {
    await this.supabase
      .from('connected_accounts')
      .delete()
      .eq('id', accountId)
  }

  /**
   * Get all connected TikTok accounts for a user
   */
  async getConnectedAccounts(userId: string): Promise<ConnectedAccount[]> {
    const { data, error } = await this.supabase
      .from('connected_accounts')
      .select('*')
      .eq('user_id', userId)
      .eq('provider', 'tiktok')
    
    if (error) {
      throw new Error(error.message)
    }
    
    return data || []
  }

  /**
   * Get TikTok videos for a connected account
   * This would be implemented in a real app to fetch videos from TikTok API
   */
  async getVideos(accountId: string): Promise<any[]> {
    // In a real implementation, you would:
    // 1. Get the account from the database
    // 2. Use the access token to call the TikTok API
    // 3. Return the videos
    
    // For now, we'll just return a mock response
    return [
      {
        id: 'video1',
        title: 'My first TikTok video',
        thumbnail: 'https://placehold.co/300x500',
        views: 1000,
        likes: 500,
        comments: 50,
        shares: 20
      },
      {
        id: 'video2',
        title: 'My second TikTok video',
        thumbnail: 'https://placehold.co/300x500',
        views: 2000,
        likes: 1000,
        comments: 100,
        shares: 40
      }
    ]
  }
}

/**
 * Exchange the authorization code for an access token
 * This is extracted as a separate function so it can be used both from the callback route and the client component
 */
export async function exchangeCodeForToken(code: string, codeVerifier: string): Promise<TikTokTokenResponse | null> {
  try {
    console.log('Exchanging code for token with verifier:', codeVerifier.substring(0, 10) + '...');
    
    const tokenEndpoint = 'https://open.tiktokapis.com/v2/oauth/token/';
    const response = await fetch(tokenEndpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        client_key: TIKTOK_CLIENT_KEY,
        client_secret: TIKTOK_CLIENT_SECRET || '',
        code,
        grant_type: 'authorization_code',
        redirect_uri: TIKTOK_REDIRECT_URI,
        code_verifier: codeVerifier,
      }).toString(),
    });

    if (!response.ok) {
      const errorData = await response.text();
      console.error('Token exchange error:', response.status, errorData);
      return null;
    }

    const data: TikTokTokenResponse = await response.json();
    console.log('Token exchange successful, expires in', data.expires_in, 'seconds');
    return data;
  } catch (error) {
    console.error('Error exchanging code for token:', error);
    return null;
  }
}

// Export a singleton instance
export const tiktokService = new TikTokService()