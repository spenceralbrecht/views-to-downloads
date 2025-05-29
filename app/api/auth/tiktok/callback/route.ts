import { NextRequest, NextResponse } from 'next/server'
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'
import { TikTokService, exchangeCodeForToken } from '@/utils/tiktokService'

// Mark this route as dynamic to prevent static generation errors
export const dynamic = 'force-dynamic'

// TikTok API configuration
const TIKTOK_CLIENT_KEY = process.env.NEXT_PUBLIC_TIKTOK_CLIENT_KEY || 'your-tiktok-client-id'
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

// Define the TikTok user interface based on the fields we're requesting
interface TikTokUser {
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

export async function GET(request: NextRequest) {
  try {
    console.log('TikTok callback received');
    
    // Parse the URL to get the query parameters
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
    
    // If there's an error, handle it
    if (error) {
      console.error('TikTok auth error:', error, errorDescription)
      return NextResponse.redirect(new URL('/dashboard/connected-accounts?error=tiktok_auth_error', request.url))
    }
    
    // If there's no code or state, something went wrong
    if (!code || !state) {
      console.error('Missing code or state in TikTok callback')
      return NextResponse.redirect(new URL('/dashboard/connected-accounts?error=missing_params', request.url))
    }
    
    // Store these variables for use in error handlers
    let accessToken: string | null = null;
    let tokenResponse: TikTokTokenResponse | null = null;
    let codeVerifier: string | null = null;
    
    // First try to get the code verifier from the cookie (fallback)
    codeVerifier = request.cookies.get('ttver')?.value || null;
    let csrfState = request.cookies.get('ttcsrf')?.value || null;
    
    console.log('From cookies - Code verifier:', codeVerifier ? codeVerifier.substring(0, 10) + '...' : 'missing');
    console.log('From cookies - CSRF state:', csrfState ? csrfState : 'missing');
    
    // If we have a state parameter from TikTok, try to extract the code verifier from it
    if (state) {
      try {
        // The state parameter should be a base64-encoded JSON string
        const decodedState = Buffer.from(state, 'base64').toString('utf-8');
        console.log('Decoded state:', decodedState);
        
        const stateData = JSON.parse(decodedState);
        console.log('Parsed state data:', stateData);
        
        // If we have the code verifier in the state, use it
        if (stateData.codeVerifier) {
          console.log('Found code verifier in state data');
          codeVerifier = stateData.codeVerifier;
        }
        
        // If we have the CSRF token in the state, use it
        if (stateData.csrf) {
          console.log('Found CSRF token in state data');
          csrfState = stateData.csrf;
        }
      } catch (error) {
        console.error('Error parsing state parameter:', error);
        // If we can't parse the state, we'll fall back to the cookie values
      }
    }
    
    console.log('Final code verifier:', codeVerifier ? `${codeVerifier.substring(0, 10)}...` : 'missing');
    
    // Log all cookies for debugging
    console.log('All cookies:', request.cookies.getAll().map(c => `${c.name}${c.value ? ': ' + c.value.substring(0, 5) + '...' : ''}`));

    // Get the host and protocol from the request headers to ensure we redirect to the same domain
    const host = request.headers.get('host') || 'localhost:3000'
    
    // Check for X-Forwarded-Proto header which ngrok and other proxies set
    // This tells us the protocol that was used for the original request
    const forwardedProto = request.headers.get('x-forwarded-proto')
    
    // For ngrok, we need to handle a special case - it forwards HTTPS to HTTP
    // So we need to make sure our redirects go back to HTTPS if they came from ngrok
    const isNgrok = host.includes('ngrok')
    
    // Use the forwarded protocol if available, otherwise default to https for ngrok
    // and http for localhost (when developing locally without ngrok)
    const protocol = isNgrok 
      ? 'https' 
      : (forwardedProto || (host.includes('localhost') ? 'http' : 'https'))
    
    console.log('Using protocol:', protocol, 'for host:', host, 'with forwarded proto:', forwardedProto);
    
    // Helper function to build redirect URLs that preserve the original host
    const buildRedirectUrl = (path: string) => `${protocol}://${host}${path}`
    
    // Validate code verifier
    if (!codeVerifier) {
      console.error('Missing code verifier')
      return NextResponse.redirect(buildRedirectUrl('/dashboard/connected-accounts?error=missing_code_verifier'))
    }

    try {
      console.log('Proceeding with code exchange regardless of session');
      
      // 1. Exchange the code for an access token
      console.log('Exchanging code for token with code verifier:', codeVerifier ? codeVerifier.substring(0, 10) + '...' : 'missing');
      tokenResponse = await exchangeCodeForToken(code, codeVerifier)
      if (!tokenResponse) {
        console.error('Failed to exchange code for token')
        return NextResponse.redirect(buildRedirectUrl('/dashboard/connected-accounts?error=token_error'))
      }
      console.log('Token exchange successful');

      // 2. Get the user's TikTok profile
      console.log('Getting user profile...');
      const userProfile = await getUserProfile(tokenResponse.access_token)
      if (!userProfile) {
        console.error('Failed to get user profile')
        return NextResponse.redirect(buildRedirectUrl('/dashboard/connected-accounts?error=profile_error'))
      }
      console.log('User profile fetched successfully:', userProfile.display_name);

      // Store the TikTok account data in the user's session temporarily
      // We'll use this to display a success message and complete the account connection on the client
      const accountData = {
        open_id: userProfile.open_id,
        display_name: userProfile.display_name,
        profile_picture: userProfile.avatar_url_100 || userProfile.avatar_url,
        access_token: tokenResponse.access_token,
        refresh_token: tokenResponse.refresh_token,
        expires_in: tokenResponse.expires_in
      };
      
      // Encode the account data as a URL-safe base64 string to pass through the URL
      // Replace standard base64 characters with URL-safe ones and remove padding
      const encodedData = Buffer.from(JSON.stringify(accountData))
        .toString('base64')
        .replace(/\+/g, '-')
        .replace(/\//g, '_')
        .replace(/=+$/, '');
      
      // Check if the user is authenticated using proper Supabase session check
      const supabase = createRouteHandlerClient({ cookies });
      const { data: { session }, error } = await supabase.auth.getSession();
      
      console.log('Session check result:', {
        hasSession: !!session,
        userId: session?.user?.id,
        error: error?.message
      });
      
      if (session) {
        // User is authenticated, redirect directly to the connected accounts page
        console.log('User is authenticated, redirecting to connected accounts page');
        return NextResponse.redirect(buildRedirectUrl(`/dashboard/connected-accounts?tiktok_success=true&tiktok_data=${encodedData}`));
      } else {
        // User is not authenticated, redirect to the home page which will handle login
        console.log('User is not authenticated, redirecting to home page');
        return NextResponse.redirect(buildRedirectUrl(`/?tiktok_success=true&tiktok_data=${encodedData}`));
      }
    } catch (error) {
      console.error('Error processing TikTok callback:', error)
      return NextResponse.redirect(buildRedirectUrl('/dashboard/connected-accounts?error=server_error'))
    }
  } catch (error) {
    console.error('Error processing TikTok callback:', error)
    return NextResponse.redirect(new URL('/dashboard/connected-accounts?error=server_error', request.url))
  }
}

/**
 * Get the user's TikTok profile
 */
async function getUserProfile(accessToken: string): Promise<TikTokUser | null> {
  try {
    console.log('Getting user profile with access token:', accessToken.substring(0, 10) + '...');
    
    // Create URL with fields parameter - TikTok API requires fields to be specified
    // Only request fields that are available in the user.info.basic scope
    const apiUrl = new URL('https://open.tiktokapis.com/v2/user/info/');
    apiUrl.searchParams.append('fields', [
      // Basic profile info (user.info.basic scope)
      "open_id", 
      "union_id", 
      "avatar_url", 
      "avatar_url_100", 
      "display_name"
      // Removed fields that might not be available in basic scope:
      // "avatar_url_200", "bio_description", "profile_deep_link", "is_verified"
    ].join(','));
    
    console.log('Making request to TikTok API:', apiUrl.toString());
    
    const response = await fetch(apiUrl.toString(), {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      }
    });

    // First check if response is ok
    if (!response.ok) {
      // Try to get text first to see what the error message is
      const errorText = await response.text();
      console.error('Error getting user profile (status ' + response.status + '):', errorText);
      
      // Try to parse as JSON if possible
      try {
        const errorData = JSON.parse(errorText);
        console.error('Parsed error data:', errorData);
        
        // Special handling for scope_not_authorized error
        // This happens when the user has already authorized the app but with different scopes
        if (errorData?.error?.code === 'scope_not_authorized') {
          console.log('Scope not authorized error detected. Creating a minimal account.');
          
          // Generate a unique ID for this TikTok account
          // In a real scenario, we'd want to extract this from the token, but for now
          // we'll generate a random one that's prefixed with 'tiktok_' for identification
          const randomId = 'tiktok_' + Math.random().toString(36).substring(2, 15);
          
          // Create a minimal user profile with placeholder data
          // The real data will be updated when the user re-authorizes with correct scopes
          return {
            open_id: randomId,
            union_id: randomId,
            display_name: 'TikTok User',
            avatar_url: 'https://placehold.co/100x100',
            avatar_url_100: 'https://placehold.co/100x100'
          };
        }
      } catch (parseError) {
        console.error('Could not parse error response as JSON');
      }
      
      return null;
    }

    // Try to get the response as text first
    const responseText = await response.text();
    console.log('User profile raw response:', responseText);
    
    // Then parse it as JSON
    let data;
    try {
      data = JSON.parse(responseText);
    } catch (parseError) {
      console.error('Error parsing user profile response:', parseError);
      // Fall back to a simple user object with the open_id we have from the token response
      return {
        open_id: 'unknown',
        union_id: 'unknown',
        display_name: 'TikTok User',
        avatar_url: 'https://placehold.co/100x100',
        avatar_url_100: 'https://placehold.co/100x100',
        avatar_url_200: 'https://placehold.co/200x200',
        bio_description: '',
        profile_deep_link: '',
        is_verified: false
      };
    }
    
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