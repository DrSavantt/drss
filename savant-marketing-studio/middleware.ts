/**
 * Optimized Middleware
 * 
 * Key optimizations:
 * 1. Skip auth check for public routes BEFORE creating Supabase client
 * 2. Minimal work on each request - just refresh session
 * 3. Only runs on routes that actually need auth (via matcher)
 */

import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

export async function middleware(request: NextRequest) {
  const path = request.nextUrl.pathname

  // ========================================================================
  // FAST PATH: Skip auth entirely for public routes
  // Check these BEFORE doing any Supabase work to avoid cold starts
  // ========================================================================
  
  // Public form routes - allow without auth
  if (path.startsWith('/form/')) {
    return NextResponse.next()
  }
  
  // Landing page - allow without auth
  if (path === '/landing' || path === '/') {
    return NextResponse.next()
  }
  
  // Login page - allow without auth (redirect handled below if logged in)
  if (path === '/login' && !request.cookies.has('sb-access-token')) {
    return NextResponse.next()
  }

  // ========================================================================
  // AUTH PATH: Only reach here for protected routes
  // ========================================================================
  
  try {
    // Check if env vars exist
    if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
      console.error('Missing Supabase environment variables in middleware')
      return NextResponse.next()
    }

    let supabaseResponse = NextResponse.next({
      request,
    })

    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
      {
        cookies: {
          getAll() {
            return request.cookies.getAll()
          },
          setAll(cookiesToSet) {
            cookiesToSet.forEach(({ name, value }) =>
              request.cookies.set(name, value)
            )
            supabaseResponse = NextResponse.next({
              request,
            })
            cookiesToSet.forEach(({ name, value, options }) =>
              supabaseResponse.cookies.set(name, value, options)
            )
          },
        },
      }
    )

    // Refresh session if expired
    const {
      data: { user },
    } = await supabase.auth.getUser()

    // Protect dashboard routes - redirect to login if not authenticated
    if (path.startsWith('/dashboard') && !user) {
      return NextResponse.redirect(new URL('/login', request.url))
    }

    // Redirect to dashboard if logged in and trying to access login
    if (path === '/login' && user) {
      return NextResponse.redirect(new URL('/dashboard', request.url))
    }

    return supabaseResponse
  } catch (error) {
    console.error('Middleware error:', error)

    // FAIL CLOSED: If middleware fails, block protected routes
    if (path.startsWith('/dashboard')) {
      return NextResponse.redirect(
        new URL('/login?error=auth_failed', request.url)
      )
    }

    return NextResponse.next()
  }
}

export const config = {
  matcher: [
    /*
     * Only run middleware on routes that need auth:
     * - /dashboard/* - protected app routes
     * - /login - redirect if already logged in
     * - /form/* - public but need to pass through
     * 
     * Explicitly EXCLUDE:
     * - /_next/* (Next.js internals)
     * - /api/* (API routes handle their own auth)
     * - Static files (images, fonts, etc.)
     */
    '/dashboard/:path*',
    '/login',
    '/form/:path*',
  ],
}
