import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

export async function middleware(request: NextRequest) {
  // #region agent log
  fetch('http://127.0.0.1:7243/ingest/de6f83dd-b5e0-4c9a-99d4-d76568bc937c',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'middleware.ts:4',message:'Middleware entry',data:{pathname:request.nextUrl.pathname,method:request.method,hasSupabaseUrl:!!process.env.NEXT_PUBLIC_SUPABASE_URL,hasSupabaseKey:!!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY},timestamp:Date.now(),sessionId:'debug-session',hypothesisId:'H1,H4',runId:'post-fix'})}).catch(()=>{});
  // #endregion
  try {
    // Check if env vars exist
    if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
      console.error('Missing Supabase environment variables in middleware')
      // #region agent log
      fetch('http://127.0.0.1:7243/ingest/de6f83dd-b5e0-4c9a-99d4-d76568bc937c',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'middleware.ts:10',message:'Missing env vars - allowing request',data:{pathname:request.nextUrl.pathname},timestamp:Date.now(),sessionId:'debug-session',hypothesisId:'H3'})}).catch(()=>{});
      // #endregion
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
      // #region agent log
      fetch('http://127.0.0.1:7243/ingest/de6f83dd-b5e0-4c9a-99d4-d76568bc937c',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'middleware.ts:47',message:'Form route detected - allowing without auth',data:{pathname:request.nextUrl.pathname,hasUser:!!user},timestamp:Date.now(),sessionId:'debug-session',hypothesisId:'H4',runId:'post-fix'})}).catch(()=>{});
      // #endregion
      return supabaseResponse
    }

    // Protect dashboard routes
    if (request.nextUrl.pathname.startsWith('/dashboard') && !user) {
      // #region agent log
      fetch('http://127.0.0.1:7243/ingest/de6f83dd-b5e0-4c9a-99d4-d76568bc937c',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'middleware.ts:53',message:'Dashboard route - redirecting to login',data:{pathname:request.nextUrl.pathname},timestamp:Date.now(),sessionId:'debug-session',hypothesisId:'H4'})}).catch(()=>{});
      // #endregion
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

    // #region agent log
    fetch('http://127.0.0.1:7243/ingest/de6f83dd-b5e0-4c9a-99d4-d76568bc937c',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'middleware.ts:68',message:'Middleware exit - returning supabaseResponse',data:{pathname:request.nextUrl.pathname},timestamp:Date.now(),sessionId:'debug-session',hypothesisId:'H4'})}).catch(()=>{});
    // #endregion
    return supabaseResponse
  } catch (error) {
    console.error('Middleware error:', error)
    // #region agent log
    fetch('http://127.0.0.1:7243/ingest/de6f83dd-b5e0-4c9a-99d4-d76568bc937c',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'middleware.ts:74',message:'Middleware error caught',data:{pathname:request.nextUrl.pathname,error:String(error)},timestamp:Date.now(),sessionId:'debug-session',hypothesisId:'H4'})}).catch(()=>{});
    // #endregion
    // If middleware fails, allow the request to proceed
    // This prevents the entire site from crashing
    return NextResponse.next()
  }
}

export const config = {
  matcher: [
    // Run middleware for all routes except static assets
    // Form routes NEED middleware to run (for Supabase cookie handling)
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}

// #region agent log
// Log matcher config on module load
if (typeof fetch !== 'undefined') {
  fetch('http://127.0.0.1:7243/ingest/de6f83dd-b5e0-4c9a-99d4-d76568bc937c',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'middleware.ts:83',message:'Middleware matcher config',data:{matcher:config.matcher},timestamp:Date.now(),sessionId:'debug-session',hypothesisId:'H1',runId:'post-fix'})}).catch(()=>{});
}
// #endregion
