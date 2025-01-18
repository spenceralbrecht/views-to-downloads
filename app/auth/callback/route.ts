import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'

export async function GET(request: Request) {
  // Grab the cookie store (important for local dev)
  const cookieStore = cookies()

  const requestUrl = new URL(request.url)
  const code = requestUrl.searchParams.get('code')

  if (code) {
    // Pass cookieOptions explicitly for local dev
    const supabase = createRouteHandlerClient({
      cookies: () => cookieStore,
      cookieOptions: {
        sameSite: 'none',
        secure: false, // set to true in production with https
      },
    })
    
    try {
      await supabase.auth.exchangeCodeForSession(code)
      return NextResponse.redirect(`${requestUrl.origin}/dashboard`)
    } catch (error) {
      console.error('Auth error:', error)
      return NextResponse.redirect(`${requestUrl.origin}/?error=${encodeURIComponent('Authentication failed')}`)
    }
  }

  console.warn('No code provided in callback')
  return NextResponse.redirect(`${requestUrl.origin}/`)
}