import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'

export async function GET(request: Request) {
  const requestUrl = new URL(request.url)
  const cookieStore = cookies()

  console.log('Auth request from:', requestUrl.origin)
  console.log('Full request URL:', request.url)

  const supabase = createRouteHandlerClient({ 
    cookies: () => cookieStore,
  })

  // Ensure we're using the correct redirect URL
  const redirectUrl = new URL('/auth/callback', requestUrl.origin).toString()
  console.log('Redirect URL:', redirectUrl)

  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: 'google',
    options: {
      redirectTo: redirectUrl,
      queryParams: {
        access_type: 'offline',
        prompt: 'consent',
        hd: '*' // Allow any Google domain
      },
      scopes: 'email profile',
    },
  })

  if (error) {
    console.error('OAuth error:', error)
    return NextResponse.redirect(
      `${requestUrl.origin}/?error=${encodeURIComponent(error.message)}`,
      {
        status: 302,
      }
    )
  }

  console.log('OAuth URL:', data.url)
  return NextResponse.redirect(data.url, {
    status: 302,
  })
}

