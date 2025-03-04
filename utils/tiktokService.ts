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
  avatar_url: string
  avatar_url_100: string
  avatar_url_200: string
  display_name: string
  bio_description: string
  profile_deep_link: string
  is_verified: boolean
  follower_count: number
  following_count: number
  likes_count: number
  video_count: number
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

// Helper functions for PKCE
function generateCodeVerifier(): string {
  const array = new Uint8Array(32);
  if (typeof window !== 'undefined') {
    window.crypto.getRandomValues(array);
  }
  return base64UrlEncode(array);
}

function base64UrlEncode(buffer: Uint8Array): string {
  return btoa(String.fromCharCode.apply(null, [...new Uint8Array(buffer)]))
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/, '');
}

async function generateCodeChallenge(verifier: string): Promise<string> {
  if (typeof window === 'undefined') return '';
  
  const encoder = new TextEncoder();
  const data = encoder.encode(verifier);
  const digest = await window.crypto.subtle.digest('SHA-256', data);
  
  return base64UrlEncode(new Uint8Array(digest));
}

// Service class
export class TikTokService {
  private supabase = createClientComponentClient()

  /**
   * Get the TikTok OAuth URL with PKCE
   */
  async getAuthUrl(): Promise<string> {
    const scopes = ['user.info.basic', 'video.list']
    const state = Math.random().toString(36).substring(2, 15)
    
    // Generate code verifier and challenge for PKCE
    const codeVerifier = generateCodeVerifier();
    const codeChallenge = await generateCodeChallenge(codeVerifier);
    
    // Store state and code verifier in localStorage to verify when the user returns
    if (typeof window !== 'undefined') {
      localStorage.setItem('tiktok_auth_state', state);
      localStorage.setItem('tiktok_code_verifier', codeVerifier);
    }
    
    return `https://www.tiktok.com/v2/auth/authorize?` +
      `client_key=${TIKTOK_CLIENT_KEY}&` +
      `response_type=code&` +
      `scope=${scopes.join(',')}&` +
      `redirect_uri=${encodeURIComponent(TIKTOK_REDIRECT_URI)}&` +
      `state=${state}&` +
      `code_challenge=${codeChallenge}&` +
      `code_challenge_method=S256`;
  }

  /**
   * Initiate the TikTok OAuth flow
   */
  async initiateAuth(): Promise<void> {
    if (typeof window !== 'undefined') {
      const authUrl = await this.getAuthUrl();
      window.location.href = authUrl;
    }
  }

  /**
   * Get the code verifier from localStorage
   */
  getCodeVerifier(): string | null {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('tiktok_code_verifier');
    }
    return null;
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
  ): Promise<void> {
    const expiresAt = new Date()
    expiresAt.setSeconds(expiresAt.getSeconds() + expiresIn)
    
    // Store additional metadata
    const metadata = {
      bio_description: tikTokUser.bio_description,
      profile_deep_link: tikTokUser.profile_deep_link,
      is_verified: tikTokUser.is_verified,
      follower_count: tikTokUser.follower_count,
      following_count: tikTokUser.following_count,
      likes_count: tikTokUser.likes_count,
      video_count: tikTokUser.video_count
    }
    
    await this.supabase.from('connected_accounts').insert({
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
    })
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

// Export a singleton instance
export const tiktokService = new TikTokService() 