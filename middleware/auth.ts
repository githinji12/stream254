// middleware/auth.ts
import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/middleware'

/**
 * Middleware to validate session and attach user to request
 */
export async function authenticateSession(request: NextRequest): Promise<{
  authenticated: boolean
  user?: any
  response?: NextResponse
}> {
  try {
    // ✅ FIX: Proper Supabase client creation and session destructuring
    const { supabase } = await createClient(request)
    const { data: { session } } = await supabase.auth.getSession()
    
    if (!session) {
      return { authenticated: false }
    }

    return {
      authenticated: true,
      user: session.user
    }
  } catch (error) {
    console.error('Session validation error:', error)
    return { authenticated: false }
  }
}

/**
 * Middleware to enforce email verification for specific actions
 */
export async function requireEmailVerification(
  request: NextRequest,
  user: any
): Promise<{ verified: boolean; response?: NextResponse }> {
  // Check if email is verified (you may need to fetch profile data)
  const emailVerified = user.user_metadata?.email_verified || true
  
  if (emailVerified) {
    return { verified: true }
  }

  // Check if action requires email verification
  const url = new URL(request.url)
  const protectedPaths = ['/upload', '/creator-studio', '/settings']
  
  if (protectedPaths.some(path => url.pathname.startsWith(path))) {
    const response = NextResponse.json(
      { error: 'Email verification required' },
      { status: 403 }
    )
    return { verified: false, response }
  }

  return { verified: true }
}

/**
 * Main authentication middleware for Next.js
 */
export async function authMiddleware(request: NextRequest): Promise<NextResponse> {
  const { authenticated, user, response: authResponse } = await authenticateSession(request)
  
  if (authResponse) return authResponse
  
  // If not authenticated and trying to access protected route
  const url = new URL(request.url)
  const protectedRoutes = ['/dashboard', '/creator-studio', '/upload', '/settings']
  
  if (!authenticated && protectedRoutes.some(route => url.pathname.startsWith(route))) {
    const redirectUrl = new URL('/login', request.url)
    redirectUrl.searchParams.set('returnTo', url.pathname)
    return NextResponse.redirect(redirectUrl)
  }

  // If authenticated but email not verified for protected action
  if (authenticated && user) {
    const { verified, response: verifyResponse } = await requireEmailVerification(request, user)
    if (verifyResponse) return verifyResponse
  }

  return NextResponse.next()
}
