import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'

export async function GET(request: Request) {
  const requestUrl = new URL(request.url)
  const code = requestUrl.searchParams.get('code')

  if (code) {
    const supabase = createRouteHandlerClient({ cookies })
    
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

