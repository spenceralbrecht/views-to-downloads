import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'

export async function GET(request: Request) {
  const cookieStore = cookies()
  const requestUrl = new URL(request.url)
  
  console.log('Callback request from:', requestUrl.origin)
  console.log('Full callback URL:', request.url)
  console.log('Callback query params:', Object.fromEntries(requestUrl.searchParams))

  const supabase = createRouteHandlerClient({ cookies: () => cookieStore })
  const code = requestUrl.searchParams.get('code')

  if (code) {
    try {
      console.log('Exchanging code for session...')
      const { data: authData, error: exchangeError } = await supabase.auth.exchangeCodeForSession(code)
      
      if (exchangeError) {
        console.error('Code exchange error:', exchangeError)
        throw exchangeError
      }

      console.log('Code exchange successful, checking session...')
      
      // Get the session to ensure it's properly set
      const { data: { session }, error: sessionError } = await supabase.auth.getSession()
      
      if (sessionError) {
        console.error('Session error:', sessionError)
        throw sessionError
      }

      if (!session) {
        console.error('No session found after successful code exchange')
        throw new Error('Authentication failed - no session')
      }

      console.log('Session successfully established')
      const dashboardUrl = new URL('/dashboard', requestUrl.origin).toString()
      console.log('Redirecting to:', dashboardUrl)

      return NextResponse.redirect(dashboardUrl, {
        status: 302
      })
    } catch (error) {
      console.error('Auth callback error:', error)
      const errorMessage = error instanceof Error ? error.message : 'Authentication failed'
      return NextResponse.redirect(
        `${requestUrl.origin}/?error=${encodeURIComponent(errorMessage)}`,
        {
          status: 302
        }
      )
    }
  }

  console.warn('No code provided in callback')
  return NextResponse.redirect(requestUrl.origin, {
    status: 302
  })
}