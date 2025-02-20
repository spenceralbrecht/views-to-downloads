import { createMiddlewareClient } from '@supabase/auth-helpers-nextjs'
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export async function middleware(req: NextRequest) {
  const res = NextResponse.next()
  const supabase = createMiddlewareClient({ req, res })

  // Refresh session if expired
  const { data: { session }, error } = await supabase.auth.getSession()
  
  // Add detailed logging
  console.log('Middleware - Current path:', req.nextUrl.pathname)
  console.log('Middleware - Session exists:', !!session)
  if (error) console.error('Session error in middleware:', error)

  // If this is the callback route, let it process normally
  if (req.nextUrl.pathname === '/auth/callback') {
    console.log('Middleware - Processing callback route')
    return res
  }

  // If trying to access a protected route and not logged in, redirect to home
  if (req.nextUrl.pathname.startsWith('/dashboard') && !session) {
    console.log('Middleware - Redirecting to home: Not authenticated for dashboard')
    const redirectUrl = new URL('/', req.url)
    redirectUrl.searchParams.set('redirect', req.nextUrl.pathname)
    return NextResponse.redirect(redirectUrl)
  }

  // If logged in and trying to access root page, redirect to dashboard
  if (session && req.nextUrl.pathname === '/') {
    console.log('Middleware - Redirecting to dashboard: Already authenticated')
    return NextResponse.redirect(new URL('/dashboard', req.url))
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