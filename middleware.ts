import { createMiddlewareClient } from '@supabase/auth-helpers-nextjs'
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export async function middleware(req: NextRequest) {
  const res = NextResponse.next()
  const supabase = createMiddlewareClient({ req, res })

  // Refresh session if expired
  const { data: { session }, error } = await supabase.auth.getSession()
  if (error) console.error('Session error in middleware:', error)

  // If trying to access a protected route and not logged in, redirect to home
  if (req.nextUrl.pathname.startsWith('/dashboard') && !session) {
    const redirectUrl = new URL('/', req.url)
    redirectUrl.searchParams.set('redirect', req.nextUrl.pathname)
    return NextResponse.redirect(redirectUrl)
  }

  // If logged in and trying to access login page, redirect to dashboard
  if (session && req.nextUrl.pathname === '/') {
    const redirectUrl = req.nextUrl.searchParams.get('redirect') || '/dashboard'
    return NextResponse.redirect(new URL(redirectUrl, req.url))
  }

  return res
}

export const config = {
  matcher: [
    '/',
    '/dashboard/:path*',
    '/auth/callback'
  ]
}
