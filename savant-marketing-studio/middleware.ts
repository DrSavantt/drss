import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

export async function middleware(request: NextRequest) {
  try {
    // Check if env vars exist
    if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
      console.error('Missing Supabase environment variables in middleware')
      // Allow request to proceed without auth check
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
            cookiesToSet.forEach(({ name, value, options }) =>
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

    // Allow public form routes without authentication (client questionnaires)
    if (request.nextUrl.pathname.startsWith('/form/')) {
      return supabaseResponse
    }

    // Protect dashboard routes
    if (request.nextUrl.pathname.startsWith('/dashboard') && !user) {
      return NextResponse.redirect(new URL('/login', request.url))
    }

    // Allow landing page without authentication
    if (request.nextUrl.pathname === '/landing') {
      return NextResponse.next()
    }

    // Redirect to dashboard if logged in and trying to access login
    if (request.nextUrl.pathname === '/login' && user) {
      return NextResponse.redirect(new URL('/dashboard', request.url))
    }

    return supabaseResponse
  } catch (error) {
    console.error('Middleware error:', error)
    // If middleware fails, allow the request to proceed
    // This prevents the entire site from crashing
    return NextResponse.next()
  }
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|form/|api/|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}
