import { NextResponse, type NextRequest } from 'next/server'

export async function middleware(request: NextRequest) {
  const pathname = request.nextUrl.pathname

  // For now, allow ALL routes through to test if middleware works
  // We'll add Supabase auth back once we confirm the site loads
  
  // Root redirects to landing
  if (pathname === '/') {
    return NextResponse.redirect(new URL('/landing', request.url))
  }

  // Allow everything else through
  return NextResponse.next()
}

export const config = {
  matcher: [
    // Only run on specific paths, not everything
    '/',
    '/dashboard/:path*',
    '/login',
  ],
}
