import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'

export async function GET(request: Request) {
  // Grab the cookie store (important for local dev)
  const cookieStore = cookies()

  const supabase = createRouteHandlerClient({ cookies: () => cookieStore })
  const requestUrl = new URL(request.url)
  const code = requestUrl.searchParams.get('code')

  if (code) {
    try {
      await supabase.auth.exchangeCodeForSession(code)
      
      // Get the session to ensure it's properly set
      const { data: { session }, error: sessionError } = await supabase.auth.getSession()
      
      if (sessionError || !session) {
        console.error('Session error:', sessionError)
        return NextResponse.redirect(`${requestUrl.origin}/?error=${encodeURIComponent('Authentication failed')}`, {
          status: 302
        })
      }

      return NextResponse.redirect(`${requestUrl.origin}/dashboard`, {
        status: 302
      })
    } catch (error) {
      console.error('Auth error:', error)
      return NextResponse.redirect(`${requestUrl.origin}/?error=${encodeURIComponent('Authentication failed')}`, {
        status: 302
      })
    }
  }

  console.warn('No code provided in callback')
  return NextResponse.redirect(`${requestUrl.origin}/`, {
    status: 302
  })
}