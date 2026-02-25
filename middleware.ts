// middleware.ts
import { NextResponse, type NextRequest } from 'next/server'
import { authMiddleware } from '@/middleware/auth'
import { securityMiddleware } from '@/middleware/security'
import { SUPPORTED_LANGUAGES, DEFAULT_LANGUAGE, LANGUAGE_COOKIE_NAME } from '@/lib/i18n/config'

// 🌐 Language detection and routing middleware
function languageMiddleware(request: NextRequest): NextResponse | void {
  const { pathname } = request.nextUrl
  
  // Skip language processing for:
  // - API routes
  // - Static files
  // - Next.js internals
  // - Files with extensions
  if (
    pathname.startsWith('/api') ||
    pathname.startsWith('/_next') ||
    pathname.includes('.') ||
    pathname === '/favicon.ico' ||
    pathname === '/sitemap.xml' ||
    pathname === '/robots.txt'
  ) {
    return
  }

  // Check if pathname already has a language prefix (e.g., /en/about, /sw/videos)
  const pathnameHasLocale = Object.keys(SUPPORTED_LANGUAGES).some(
    (locale) => pathname.startsWith(`/${locale}/`) || pathname === `/${locale}`
  )
  
  if (pathnameHasLocale) {
    return
  }

  // Detect language priority: URL param > Cookie > Browser header > Default
  let detectedLang = DEFAULT_LANGUAGE
  
  // 1. Check URL parameter (?lang=sw)
  const urlLang = request.nextUrl.searchParams.get('lang')
  if (urlLang && SUPPORTED_LANGUAGES[urlLang as keyof typeof SUPPORTED_LANGUAGES]) {
    detectedLang = urlLang as keyof typeof SUPPORTED_LANGUAGES
  }
  
  // 2. Check cookie
  if (detectedLang === DEFAULT_LANGUAGE) {
    const cookieLang = request.cookies.get(LANGUAGE_COOKIE_NAME)?.value
    if (cookieLang && SUPPORTED_LANGUAGES[cookieLang as keyof typeof SUPPORTED_LANGUAGES]) {
      detectedLang = cookieLang as keyof typeof SUPPORTED_LANGUAGES
    }
  }
  
  // 3. Check browser Accept-Language header
  if (detectedLang === DEFAULT_LANGUAGE) {
    const acceptLanguage = request.headers.get('accept-language')
    if (acceptLanguage) {
      const browserLang = acceptLanguage.split(',')[0]?.split('-')[0]
      if (browserLang && SUPPORTED_LANGUAGES[browserLang as keyof typeof SUPPORTED_LANGUAGES]) {
        detectedLang = browserLang as keyof typeof SUPPORTED_LANGUAGES
      }
    }
  }

  // Create response with language cookie
  const response = NextResponse.next()
  
  // Set language cookie for persistence (1 year expiry)
  response.cookies.set(LANGUAGE_COOKIE_NAME, detectedLang, {
    path: '/',
    maxAge: 60 * 60 * 24 * 365, // 1 year
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production'
  })
  
  // Optional: Redirect to language-prefixed URL for SEO
  // Uncomment below if you want /en/about, /sw/videos style URLs
  /*
  const locale = SUPPORTED_LANGUAGES[detectedLang] ? detectedLang : DEFAULT_LANGUAGE
  request.nextUrl.pathname = `/${locale}${pathname}`
  return NextResponse.redirect(request.nextUrl)
  */
  
  return response
}

// 🔐 Main middleware pipeline
export async function middleware(request: NextRequest) {
  // 1. Apply language detection and routing
  const languageResponse = languageMiddleware(request)
  if (languageResponse) {
    return languageResponse
  }
  
  // 2. Apply security headers
  const securityResponse = securityMiddleware(request)
  if (securityResponse) return securityResponse

  // 3. Apply authentication checks
  const authResponse = await authMiddleware(request)
  if (authResponse) return authResponse

  // 4. Continue to next handler
  return NextResponse.next()
}

// 🎯 Middleware configuration
export const config = {
  matcher: [
    /*
     * Match all request paths except:
     * - api routes (handled separately)
     * - _next/static (static files)
     * - _next/image (image optimization)
     * - favicon.ico, sitemap.xml, robots.txt
     * - files with extensions (images, fonts, etc.)
     */
    '/((?!api|_next/static|_next/image|favicon.ico|sitemap.xml|robots.txt|.*\\..*).*)',
  ],
}