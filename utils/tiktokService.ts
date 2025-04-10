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
      // Only include fields that are defined in the database schema
      // and are essential for the application
      open_id: tikTokUser.open_id,
      union_id: tikTokUser.union_id
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
        profile_picture: tikTokUser.avatar_url_100 || tikTokUser.avatar_url,
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
    // Placeholder implementation
    console.warn('TikTokService.getVideos is not implemented')
    // In a real app, you'd use the account's access token to call the TikTok API
    // Example endpoint: /v2/video/list/?fields=id,title,create_time,duration,cover_image_url
    
    // Get account details (including access token) from Supabase
    const { data: account, error } = await this.supabase
      .from('connected_accounts')
      .select('access_token, token_expires_at') // Select only needed fields
      .eq('id', accountId)
      .single()

    if (error || !account) {
      console.error('Could not find account or token to fetch videos:', error)
      throw new Error('TikTok account not found or token missing.')
    }

    // TODO: Check if token needs refreshing before making the API call
    // const accessToken = await this.ensureValidToken(account.access_token, account.token_expires_at, account.refresh_token, accountId);

    // Mock response for now
    return [
      { id: '123', title: 'Mock Video 1' },
      { id: '456', title: 'Mock Video 2' },
    ]
  }

  /**
   * Get TikTok creator info for a connected account
   * This is used to determine available privacy options and interaction settings
   */
  async getCreatorInfo(accountId: string): Promise<any> {
    // Placeholder implementation
    console.warn('TikTokService.getCreatorInfo is not implemented')
    // In a real app, you'd use the account's access token to call the TikTok API
    // Example endpoint: /v2/user/info/?fields=open_id,union_id,avatar_url,display_name,bio_description,profile_deep_link,is_verified,follower_count,following_count,likes_count,video_count
    // We also need creator-specific info if available, potentially from a different endpoint or scope

    // Get account details (including access token) from Supabase
    const { data: account, error } = await this.supabase
      .from('connected_accounts')
      .select('access_token, token_expires_at, username') // Fetch username too
      .eq('id', accountId)
      .single()

    if (error || !account) {
      console.error('Could not find account or token to fetch creator info:', error)
      throw new Error('TikTok account not found or token missing.')
    }

    // TODO: Implement token refresh logic
    // TODO: Make actual API call to TikTok's user info endpoint

    // Mock response based on common defaults and account username
    return {
      creator_username: account.username || 'UnknownUser',
      creator_nickname: account.username || 'Unknown User',
      privacy_level_options: ['PUBLIC_TO_EVERYONE', 'MUTUAL_FOLLOW_FRIENDS', 'SELF_ONLY'],
      comment_disabled: false, // TikTok defaults generally allow comments
      duet_disabled: false,    // TikTok defaults generally allow duets
      stitch_disabled: false,  // TikTok defaults generally allow stitches
      max_video_post_duration_sec: 600 // Example limit (10 minutes), check API docs for actual
      // posting_unavailability_reason: null // Example if posting is available
    }
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

/**
 * Refresh the TikTok access token using the refresh token
 */
export async function refreshTikTokToken(refreshToken: string): Promise<TikTokTokenResponse | null> {
  try {
    console.log('Refreshing access token...');
    
    const tokenEndpoint = 'https://open.tiktokapis.com/v2/oauth/token/';
    const response = await fetch(tokenEndpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        client_key: TIKTOK_CLIENT_KEY,
        client_secret: TIKTOK_CLIENT_SECRET || '',
        grant_type: 'refresh_token',
        refresh_token: refreshToken,
      }).toString(),
    });

    if (!response.ok) {
      const errorData = await response.text();
      console.error('Token refresh error:', response.status, errorData);
      return null;
    }

    const data: TikTokTokenResponse = await response.json();
    console.log('Token refresh successful, expires in', data.expires_in, 'seconds');
    return data;
  } catch (error) {
    console.error('Error refreshing token:', error);
    return null;
  }
}

// Export a singleton instance
export const tiktokService = new TikTokService()