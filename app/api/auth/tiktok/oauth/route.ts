import { NextResponse, NextRequest } from 'next/server'
import { cookies } from 'next/headers'

// TikTok API configuration
const TIKTOK_CLIENT_KEY = process.env.NEXT_PUBLIC_TIKTOK_CLIENT_KEY || 'your-tiktok-client-id'
const TIKTOK_CLIENT_SECRET = process.env.TIKTOK_CLIENT_SECRET as string
const TIKTOK_REDIRECT_URI = process.env.NEXT_PUBLIC_TIKTOK_REDIRECT_URI || 'http://localhost:3000/api/auth/tiktok/callback'

/**
 * Helper functions for PKCE
 */
function generateCodeVerifier(): string {
  // Generate a random string for the code verifier
  const array = new Uint8Array(32)
  
  // In a server component we don't have window.crypto
  // Using Node.js crypto module instead
  const crypto = require('crypto')
  crypto.randomFillSync(array)
  
  return base64UrlEncode(array)
}

function base64UrlEncode(buffer: Uint8Array): string {
  return Buffer.from(buffer)
    .toString('base64')
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/, '')
}

async function generateCodeChallenge(verifier: string): Promise<string> {
  const crypto = require('crypto')
  const hash = crypto.createHash('sha256')
  hash.update(verifier)
  return base64UrlEncode(new Uint8Array(hash.digest()))
}

/**
 * OAuth endpoint to initiate the TikTok authorization flow
 * This follows TikTok's recommended server-side approach
 */
export async function GET(request: NextRequest) {
  try {
    console.log('TikTok OAuth route called');
    
    // Generate a random state value to prevent CSRF attacks
    const csrfState = Math.random().toString(36).substring(2)
    
    // Generate code verifier and challenge for PKCE
    const codeVerifier = generateCodeVerifier()
    const codeChallenge = await generateCodeChallenge(codeVerifier)
    
    console.log('Generated code verifier:', codeVerifier.substring(0, 10) + '...');
    console.log('Generated CSRF state:', csrfState);
    
    // Create a composite state that includes the CSRF token and code verifier
    // This will be used to validate the callback and recover the code verifier
    const compositeState = Buffer.from(JSON.stringify({
      csrf: csrfState,
      codeVerifier: codeVerifier
    })).toString('base64')
    
    // Don't double-encode the state - TikTok will handle the encoding
    const encodedState = compositeState;
    
    console.log('Created composite state with code verifier and CSRF token');
    
    // Set the state and code verifier as HTTP-only cookies as a backup
    // This ensures they are sent with the request when TikTok redirects back to our callback
    const cookieStore = cookies()
    
    // Set cookies with appropriate options to ensure they are included in the redirect
    cookieStore.set('tiktok_csrf_state', csrfState, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      maxAge: 60 * 10, // 10 minutes
      path: '/',
      sameSite: 'lax'
    })
    
    cookieStore.set('tiktok_code_verifier', codeVerifier, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      maxAge: 60 * 10, // 10 minutes
      path: '/',
      sameSite: 'lax'
    })
    
    // Verify cookies were set
    const cookies_after = cookieStore.getAll();
    console.log('Cookies after setting:', cookies_after.map(c => c.name));
    console.log('Code verifier cookie present:', cookies_after.some(c => c.name === 'tiktok_code_verifier'));
    console.log('CSRF state cookie present:', cookies_after.some(c => c.name === 'tiktok_csrf_state'));
    
    // Log for debugging
    console.log('OAuth route - Setting code verifier cookie:', codeVerifier.substring(0, 10) + '...')
    console.log('OAuth route - Setting CSRF state cookie:', csrfState)
    
    // Build the TikTok authorization URL
    const authUrl = new URL('https://www.tiktok.com/v2/auth/authorize/');
    authUrl.searchParams.append('client_key', TIKTOK_CLIENT_KEY);
    authUrl.searchParams.append('scope', 'user.info.basic,video.publish,video.upload');
    authUrl.searchParams.append('response_type', 'code');
    authUrl.searchParams.append('redirect_uri', TIKTOK_REDIRECT_URI);
    authUrl.searchParams.append('state', encodedState);
    authUrl.searchParams.append('code_challenge', codeChallenge);
    authUrl.searchParams.append('code_challenge_method', 'S256');
    // Add prompt=consent to force TikTok to show the authorization screen again
    // This helps with the "scope_not_authorized" error when a user has already authorized with different scopes
    authUrl.searchParams.append('prompt', 'consent');
    
    console.log('Redirecting to TikTok auth URL');
    
    // Redirect the user to the TikTok authorization page
    return NextResponse.redirect(authUrl)
  } catch (error) {
    console.error('Error initiating TikTok OAuth flow:', error)
    return NextResponse.redirect(new URL('/dashboard/connected-accounts?error=oauth_init_error', request.url))
  }
}
