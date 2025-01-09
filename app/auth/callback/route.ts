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
      return NextResponse.redirect(new URL('/dashboard', request.url))
    } catch (error) {
      console.error('Auth error:', error)
      // Log the full error object for debugging
      console.log('Full error object:', JSON.stringify(error, null, 2))
      return NextResponse.redirect(new URL(`/?error=${encodeURIComponent('Authentication failed')}`, request.url))
    }
  }

  console.warn('No code provided in callback')
  return NextResponse.redirect(new URL('/', request.url))
}

