import { NextRequest, NextResponse } from 'next/server'
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'

// TikTok API configuration
const TIKTOK_CLIENT_KEY = process.env.NEXT_PUBLIC_TIKTOK_CLIENT_KEY
const TIKTOK_CLIENT_SECRET = process.env.TIKTOK_CLIENT_SECRET
const TIKTOK_REDIRECT_URI = process.env.NEXT_PUBLIC_TIKTOK_REDIRECT_URI || 'http://localhost:3000/api/auth/tiktok/callback'

interface TikTokTokenResponse {
  access_token: string
  refresh_token: string
  expires_in: number
  open_id: string
  scope: string
  token_type: string
}

interface TikTokUser {
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

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams
  const code = searchParams.get('code')
  const state = searchParams.get('state')
  const error = searchParams.get('error')
  const errorDescription = searchParams.get('error_description')
  
  console.log('TikTok callback received:', { 
    code: code ? 'present' : 'missing', 
    state: state ? 'present' : 'missing',
    error,
    errorDescription
  });
  
  // Get the code_verifier from the cookie
  const codeVerifier = request.cookies.get('tiktok_code_verifier')?.value
  console.log('Code verifier from cookie:', codeVerifier ? 'present' : 'missing');

  // Handle errors from TikTok
  if (error) {
    console.error('TikTok OAuth error:', error, errorDescription)
    return NextResponse.redirect(new URL(`/dashboard/connected-accounts?error=${error}`, request.url))
  }

  // Validate required parameters
  if (!code || !state) {
    console.error('Missing required parameters:', { code, state })
    return NextResponse.redirect(new URL('/dashboard/connected-accounts?error=missing_params', request.url))
  }

  // Validate code verifier
  if (!codeVerifier) {
    console.error('Missing code verifier')
    return NextResponse.redirect(new URL('/dashboard/connected-accounts?error=missing_code_verifier', request.url))
  }

  try {
    const supabase = createRouteHandlerClient({ cookies })
    
    // Get the current user
    const { data: { session } } = await supabase.auth.getSession()
    if (!session) {
      console.error('No user session found')
      return NextResponse.redirect(new URL('/login?error=not_authenticated', request.url))
    }
    
    console.log('User authenticated:', session.user.id);

    // Verify the state parameter to prevent CSRF attacks
    // In a real implementation, you would compare this with the state stored in the session
    // For simplicity, we'll skip this step in this demo

    // 1. Exchange the code for an access token
    console.log('Exchanging code for token...');
    const tokenResponse = await exchangeCodeForToken(code, codeVerifier)
    if (!tokenResponse) {
      console.error('Failed to exchange code for token')
      return NextResponse.redirect(new URL('/dashboard/connected-accounts?error=token_error', request.url))
    }
    console.log('Token exchange successful');

    // 2. Get the user's TikTok profile
    console.log('Fetching TikTok user profile...');
    const userProfile = await getUserProfile(tokenResponse.access_token)
    if (!userProfile) {
      console.error('Failed to get user profile')
      return NextResponse.redirect(new URL('/dashboard/connected-accounts?error=profile_error', request.url))
    }
    console.log('User profile fetched successfully:', userProfile.display_name);

    // 3. Save the account information to the database
    console.log('Saving account to database...');
    await saveAccount(
      session.user.id,
      userProfile,
      tokenResponse.access_token,
      tokenResponse.refresh_token,
      tokenResponse.expires_in,
      supabase
    )
    console.log('Account saved successfully');

    // Redirect back to the connected accounts page with a success message
    return NextResponse.redirect(new URL('/dashboard/connected-accounts?success=true', request.url))
  } catch (error) {
    console.error('Error processing TikTok callback:', error)
    return NextResponse.redirect(new URL('/dashboard/connected-accounts?error=server_error', request.url))
  }
}

/**
 * Exchange the authorization code for an access token
 */
async function exchangeCodeForToken(code: string, codeVerifier: string): Promise<TikTokTokenResponse | null> {
  try {
    console.log('Exchanging code for token with params:', {
      client_key: TIKTOK_CLIENT_KEY,
      code,
      grant_type: 'authorization_code',
      redirect_uri: TIKTOK_REDIRECT_URI,
      code_verifier: codeVerifier,
    });
    
    const response = await fetch('https://open.tiktokapis.com/v2/oauth/token/', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        client_key: TIKTOK_CLIENT_KEY!,
        client_secret: TIKTOK_CLIENT_SECRET!,
        code,
        grant_type: 'authorization_code',
        redirect_uri: TIKTOK_REDIRECT_URI!,
        code_verifier: codeVerifier,
      }).toString(),
    })

    if (!response.ok) {
      const errorData = await response.json()
      console.error('Error exchanging code for token:', errorData)
      return null
    }

    const data = await response.json()
    console.log('Token response:', data);
    return data as TikTokTokenResponse
  } catch (error) {
    console.error('Error exchanging code for token:', error)
    return null
  }
}

/**
 * Get the user's TikTok profile
 */
async function getUserProfile(accessToken: string): Promise<TikTokUser | null> {
  try {
    console.log('Getting user profile with access token:', accessToken.substring(0, 10) + '...');
    
    const response = await fetch('https://open.tiktokapis.com/v2/user/info/', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        fields: [
          "open_id", "union_id", "avatar_url", "avatar_url_100", "avatar_url_200",
          "display_name", "bio_description", "profile_deep_link", "is_verified",
          "follower_count", "following_count", "likes_count", "video_count"
        ]
      })
    });

    if (!response.ok) {
      const errorData = await response.json();
      console.error('Error getting user profile:', errorData);
      return null;
    }

    const data = await response.json();
    console.log('User profile response:', data);
    
    if (!data.data || !data.data.user) {
      console.error('Invalid user profile response format:', data);
      return null;
    }
    
    return data.data.user as TikTokUser;
  } catch (error) {
    console.error('Error getting user profile:', error);
    return null;
  }
}

/**
 * Save the account information to the database
 */
async function saveAccount(
  userId: string,
  tikTokUser: TikTokUser,
  accessToken: string,
  refreshToken: string,
  expiresIn: number,
  supabase: any
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
  
  // Check if the account already exists
  const { data: existingAccount } = await supabase
    .from('connected_accounts')
    .select('id')
    .eq('user_id', userId)
    .eq('provider', 'tiktok')
    .eq('provider_account_id', tikTokUser.open_id)
    .single()
  
  if (existingAccount) {
    // Update the existing account
    await supabase
      .from('connected_accounts')
      .update({
        username: tikTokUser.display_name,
        display_name: tikTokUser.display_name,
        profile_picture: tikTokUser.avatar_url_200 || tikTokUser.avatar_url,
        access_token: accessToken,
        refresh_token: refreshToken,
        token_expires_at: expiresAt.toISOString(),
        metadata
      })
      .eq('id', existingAccount.id)
  } else {
    // Insert a new account
    await supabase.from('connected_accounts').insert({
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
} 