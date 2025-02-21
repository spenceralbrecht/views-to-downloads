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
    const redirectTo = requestUrl.searchParams.get('redirect') || '/dashboard'

    if (!code) {
      console.warn('Auth callback - No code provided in callback')
      throw new Error('No code provided')
    }

    console.log('Auth callback - Exchanging code for session')
    const { data, error } = await supabase.auth.exchangeCodeForSession(code)
    
    if (error) {
      console.error('Auth callback - Code exchange error:', error)
      throw error
    }

    if (!data.session) {
      console.error('Auth callback - No session found after successful code exchange')
      throw new Error('Authentication failed - no session')
    }

    console.log('Auth callback - Session successfully established')
    console.log('Auth callback - Redirecting to:', redirectTo)

    return NextResponse.redirect(new URL(redirectTo, requestUrl.origin))

  } catch (error) {
    console.error('Auth callback - Error during authentication:', error)
    const errorMessage = error instanceof Error ? error.message : 'Authentication failed'
    const errorUrl = new URL('/', requestUrl.origin)
    errorUrl.searchParams.set('error', errorMessage)
    return NextResponse.redirect(errorUrl, {
      status: 302
    })
  }
}