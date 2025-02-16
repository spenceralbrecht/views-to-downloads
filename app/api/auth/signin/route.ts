import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'

export async function GET(request: Request) {
  try {
    const requestUrl = new URL(request.url)
    const cookieStore = cookies()

    // Detailed environment logging
    console.log('=== Environment Debug Info ===')
    console.log('NODE_ENV:', process.env.NODE_ENV)
    console.log('VERCEL_ENV:', process.env.VERCEL_ENV)
    console.log('VERCEL_URL:', process.env.VERCEL_URL)
    console.log('Request URL:', requestUrl.toString())
    console.log('Supabase URL Length:', process.env.NEXT_PUBLIC_SUPABASE_URL?.length || 0)
    console.log('Supabase Anon Key Length:', process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY?.length || 0)
    console.log('=== End Environment Debug Info ===')

    if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
      throw new Error('Missing Supabase environment variables')
    }

    const supabase = createRouteHandlerClient({ 
      cookies: () => cookieStore,
    })

    // Ensure we're using the correct redirect URL
    const redirectUrl = new URL('/auth/callback', requestUrl.origin).toString()
    console.log('Redirect URL:', redirectUrl)

    // Add timeout to the OAuth request
    const timeoutPromise = new Promise<never>((_, reject) => 
      setTimeout(() => reject(new Error('Supabase connection timeout')), 10000)
    )

    const authPromise = supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: redirectUrl,
        queryParams: {
          access_type: 'offline',
          prompt: 'consent',
          hd: '*'
        },
        scopes: 'email profile',
      },
    })

    const result = await Promise.race([authPromise, timeoutPromise])
      .catch(error => ({ error: error instanceof Error ? error : new Error('Unknown error') }))

    if ('error' in result) {
      console.error('OAuth error:', result.error)
      return NextResponse.redirect(
        `${requestUrl.origin}/?error=${encodeURIComponent(result.error.message)}`,
        {
          status: 302,
        }
      )
    }

    if (!result.data?.url) {
      throw new Error('No OAuth URL returned')
    }

    console.log('OAuth URL:', result.data.url)
    return NextResponse.redirect(result.data.url, {
      status: 302,
    })
  } catch (error) {
    console.error('Signin error:', error)
    const errorMessage = error instanceof Error ? error.message : 'Authentication failed'
    return NextResponse.redirect(
      `${requestUrl.origin}/?error=${encodeURIComponent(errorMessage)}`,
      {
        status: 302,
      }
    )
  }
}

