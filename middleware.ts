import { createMiddlewareClient } from '@supabase/auth-helpers-nextjs'
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export async function middleware(req: NextRequest) {
  const res = NextResponse.next()
  const supabase = createMiddlewareClient({ req, res })

  try {
    // Refresh session if expired - use the response from supabase
    const { data: { session }, error } = await supabase.auth.getSession()
    
    // Add detailed logging
    console.log('Middleware - Current path:', req.nextUrl.pathname)
    console.log('Middleware - Session exists:', !!session)
    if (error) console.error('Session error in middleware:', error)

    // If this is the callback route or TikTok OAuth routes, let it process normally
    if (req.nextUrl.pathname === '/auth/callback' || 
        req.nextUrl.pathname.startsWith('/api/auth/tiktok')) {
      console.log('Middleware - Bypassing auth check for:', req.nextUrl.pathname)
      return res
    }

    // If trying to access a protected route and not logged in, redirect to home
    if (req.nextUrl.pathname.startsWith('/dashboard') && !session) {
      console.log('Middleware - Redirecting to home: Not authenticated for dashboard')
      const redirectUrl = new URL('/', req.url)
      redirectUrl.searchParams.set('redirect', req.nextUrl.pathname)
      const redirectRes = NextResponse.redirect(redirectUrl)
      
      // Copy over the supabase auth cookies to the redirect response
      const cookiesList = res.cookies.getAll()
      cookiesList.forEach(cookie => {
        redirectRes.cookies.set(cookie.name, cookie.value, {
          ...cookie,
          sameSite: 'lax',
          secure: process.env.NODE_ENV === 'production'
        })
      })
      
      return redirectRes
    }

    // If logged in and trying to access root page, redirect to dashboard
    if (session && req.nextUrl.pathname === '/') {
      console.log('Middleware - Redirecting to dashboard: Already authenticated')
      const dashboardRes = NextResponse.redirect(new URL('/dashboard', req.url))
      
      // Copy over the supabase auth cookies to the redirect response
      const cookiesList = res.cookies.getAll()
      cookiesList.forEach(cookie => {
        dashboardRes.cookies.set(cookie.name, cookie.value, {
          ...cookie,
          sameSite: 'lax',
          secure: process.env.NODE_ENV === 'production'
        })
      })
      
      return dashboardRes
    }

    return res
  } catch (error) {
    console.error('Middleware - Error:', error)
    return res
  }
}

export const config = {
  matcher: [
    '/',
    '/dashboard/:path*',
    '/auth/callback',
    '/api/auth/tiktok/callback'
  ]
}