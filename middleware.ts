// middleware.ts
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { authMiddleware } from '@/middleware/auth'
import { securityMiddleware } from '@/middleware/security'

export async function middleware(request: NextRequest) {
  // Apply security headers
  const securityResponse = securityMiddleware(request)
  if (securityResponse) return securityResponse

  // Apply authentication
  const authResponse = await authMiddleware(request)
  if (authResponse) return authResponse

  return NextResponse.next()
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public folder
     */
    '/((?!api|_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}