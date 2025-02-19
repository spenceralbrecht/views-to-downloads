import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'

export async function GET(request: Request) {
  const cookieStore = cookies()
  const requestUrl = new URL(request.url)
  const supabase = createRouteHandlerClient({ cookies: () => cookieStore })

  try {
    console.log('Auth callback - Processing request:', requestUrl.toString())
    
    const code = requestUrl.searchParams.get('code')
    // Get the redirect URL if it exists
    const redirectTo = requestUrl.searchParams.get('redirect') || '/dashboard'

    if (!code) {
      console.warn('Auth callback - No code provided in callback')
      throw new Error('No code provided')
    }

    console.log('Auth callback - Exchanging code for session')
    // Exchange the code for a session
    const { data: { session }, error: exchangeError } = await supabase.auth.exchangeCodeForSession(code)
    
    if (exchangeError) {
      console.error('Auth callback - Code exchange error:', exchangeError)
      throw exchangeError
    }

    if (!session) {
      console.error('Auth callback - No session found after successful code exchange')
      throw new Error('Authentication failed - no session')
    }

    console.log('Auth callback - Setting session')
    // Set the auth cookie
    await supabase.auth.setSession(session)

    // Verify the session was set
    console.log('Auth callback - Verifying session')
    const { data: verifyData, error: verifyError } = await supabase.auth.getUser()
    
    if (verifyError || !verifyData.user) {
      console.error('Auth callback - Session verification failed:', verifyError)
      throw new Error('Session verification failed')
    }

    console.log('Auth callback - Session successfully established')
    console.log('Auth callback - Redirecting to:', redirectTo)

    // Redirect to the intended destination
    return NextResponse.redirect(new URL(redirectTo, requestUrl.origin), {
      status: 302
    })

  } catch (error) {
    console.error('Auth callback - Error:', error)
    const errorMessage = error instanceof Error ? error.message : 'Authentication failed'
    const errorUrl = new URL('/', requestUrl.origin)
    errorUrl.searchParams.set('error', errorMessage)
    return NextResponse.redirect(errorUrl, {
      status: 302
    })
  }
}