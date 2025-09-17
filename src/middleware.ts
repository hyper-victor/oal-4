import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

export async function middleware(request: NextRequest) {
  let supabaseResponse = NextResponse.next({
    request,
  })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value))
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

  const { data: { user } } = await supabase.auth.getUser()
  
  // Check if user is confirmed
  const isConfirmedUser = user && user.email_confirmed_at !== null
  
  const { data: profile } = isConfirmedUser ? await supabase
    .from('profiles')
    .select('active_family_id')
    .eq('id', user.id)
    .single() : { data: null }

  const { pathname } = request.nextUrl

  // Public routes that don't require authentication
  const publicRoutes = ['/signin', '/signup', '/onboarding', '/check-email']
  const isPublicRoute = publicRoutes.some(route => pathname.startsWith(route))
  const isApiRoute = pathname.startsWith('/api')
  const isAuthRoute = pathname.startsWith('/auth/')
  const isStaticAsset = pathname.startsWith('/_next') || pathname.includes('.')

  // Allow static assets, API routes, and auth routes
  if (isStaticAsset || isApiRoute || isAuthRoute) {
    return supabaseResponse
  }

  // If not authenticated or not confirmed and trying to access protected routes
  if (!isConfirmedUser && !isPublicRoute) {
    return NextResponse.redirect(new URL('/signin', request.url))
  }

  // If authenticated but no active family and not on onboarding
  if (isConfirmedUser && !profile?.active_family_id && pathname !== '/onboarding') {
    return NextResponse.redirect(new URL('/onboarding', request.url))
  }

  // If authenticated with family and on auth pages, redirect to dashboard
  if (isConfirmedUser && profile?.active_family_id && isPublicRoute) {
    return NextResponse.redirect(new URL('/dashboard', request.url))
  }

  return supabaseResponse
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * Feel free to modify this pattern to include more paths.
     */
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}
