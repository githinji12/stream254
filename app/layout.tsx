// app/layout.tsx
import './globals.css'
import { AuthProvider } from '@/hooks/useAuth'
import { LanguageProvider } from '@/lib/i18n/client'
import Navbar from '@/components/layout/Navbar'
import Footer from '@/components/layout/Footer'
import { Toaster } from 'react-hot-toast'
import { Metadata, Viewport } from 'next'

// ✅ Type-safe metadata for Next.js 14+
export const metadata: Metadata = {
  metadataBase: new URL('https://stream254.netlify.app'),
  title: {
    default: 'Stream254 - African Video Platform',
    template: '%s | Stream254',
  },
  description: 'Video platform for African creators 🇰🇪 Share, stream, and grow with Stream254 - Kenya\'s premier video platform with M-Pesa tipping.',
  keywords: ['video', 'streaming', 'Kenya', 'Africa', 'creators', 'M-Pesa', 'content', 'social', 'Nairobi', 'entertainment'],
  authors: [{ name: 'Stream254 Team' }],
  creator: 'Stream254',
  publisher: 'Stream254',
  formatDetection: {
    email: false,
    address: false,
    telephone: false,
  },
  alternates: {
    canonical: '/',
  },
  openGraph: {
    title: 'Stream254 - African Video Platform',
    description: 'Video platform for African creators 🇰🇪',
    url: 'https://stream254.netlify.app',
    siteName: 'Stream254',
    locale: 'en_KE',
    type: 'website',
    images: [
      {
        url: '/og-image.png',
        width: 1200,
        height: 630,
        alt: 'Stream254 - African Video Platform',
        type: 'image/png',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Stream254 - African Video Platform',
    description: 'Video platform for African creators 🇰🇪',
    images: ['/og-image.png'],
    creator: '@stream254ke',
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
  icons: {
    icon: '/favicon.ico',
    shortcut: '/favicon-16x16.png',
    apple: '/apple-touch-icon.png',
  },
  manifest: '/site.webmanifest',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'default',
    title: 'Stream254',
  },
}

// ✅ Viewport configuration for mobile optimization
export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 5,
  userScalable: true,
  themeColor: [
    { media: '(prefers-color-scheme: light)', color: '#ffffff' },
    { media: '(prefers-color-scheme: dark)', color: '#0a0a0a' },
  ],
  colorScheme: 'light dark',
}

// ✅ Root Layout Component
export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html 
      lang="en-KE" 
      suppressHydrationWarning  // ✅ Fixes browser extension hydration errors
      className="scroll-smooth"
    >
      <head>
        {/* 🔗 Preconnect to Supabase for performance */}
        <link rel="preconnect" href="https://fiexcwhibeqfmfrbgvbg.supabase.co" crossOrigin="anonymous" />
        <link rel="dns-prefetch" href="https://fiexcwhibeqfmfrbgvbg.supabase.co" />
      </head>
      
      <body className="min-h-screen bg-background text-foreground flex flex-col antialiased selection:bg-[var(--kenya-red)]/20 selection:text-inherit">
        
        {/* ♿ Skip Link - Critical for keyboard accessibility */}
        <a 
          href="#main-content" 
          className="sr-only focus:not-sr-only focus:fixed focus:top-4 focus:left-4 focus:z-[100] focus:px-4 focus:py-2 focus:bg-[var(--kenya-red)] focus:text-white focus:rounded-lg focus:outline-none focus:ring-2 focus:ring-[var(--kenya-red)]/50 focus:ring-offset-2 focus:ring-offset-background transition-all"
        >
          Skip to main content
        </a>
        
        {/* 🌍 Language Provider - i18n context */}
        <LanguageProvider>
          {/* 🔐 Auth Provider - User session context */}
          <AuthProvider>
            {/* 🧭 Theme Transition Wrapper */}
            <div className="theme-transition-wrapper min-h-screen flex flex-col">
              
              {/* 📱 Navbar */}
              <Navbar />
              
              {/* 📄 Main Content - Semantic HTML + ARIA */}
              <main 
                id="main-content"
                className="flex-1 pt-16"
                role="main"
                aria-label="Main content"
                tabIndex={-1}  // Allows programmatic focus for skip links
              >
                {children}
              </main>
              
              {/* 🦶 Footer */}
              <Footer />
              
              {/* 🔔 Toast Notifications - Kenyan-themed */}
              <Toaster 
                position="bottom-right"
                toastOptions={{
                  duration: 4000,
                  style: {
                    background: 'var(--toast-bg, #1f2937)',
                    color: 'var(--toast-color, #f9fafb)',
                    border: '1px solid var(--toast-border, transparent)',
                    borderRadius: '12px',
                    boxShadow: '0 4px 20px rgba(0, 0, 0, 0.15)',
                  },
                  success: {
                    duration: 3000,
                    iconTheme: {
                      primary: '#007847',
                      secondary: '#fff',
                    },
                    style: {
                      '--toast-bg': '#fff',
                      '--toast-color': '#1f2937',
                      '--toast-border': '#007847/20',
                    } as React.CSSProperties,
                  },
                  error: {
                    duration: 5000,
                    iconTheme: {
                      primary: '#bb0000',
                      secondary: '#fff',
                    },
                    style: {
                      '--toast-bg': '#fff',
                      '--toast-color': '#1f2937',
                      '--toast-border': '#bb0000/20',
                    } as React.CSSProperties,
                  },
                  loading: {
                    iconTheme: {
                      primary: '#6b7280',
                      secondary: '#fff',
                    },
                  },
                }}
              />
              
            </div>
          </AuthProvider>
        </LanguageProvider>
        
        {/* ⚡ Initialize theme transitions after paint - prevents FOUC */}
        <script
          dangerouslySetInnerHTML={{
            __html: `
              (function() {
                try {
                  const stored = localStorage.getItem('stream254_theme')
                  const systemPrefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches
                  
                  if (stored === 'dark' || (!stored && systemPrefersDark)) {
                    document.documentElement.classList.add('dark')
                  }
                  
                  requestAnimationFrame(() => {
                    setTimeout(() => {
                      document.documentElement.classList.add('theme-enabled')
                    }, 50)
                  })
                } catch (e) {
                  console.warn('Theme init error:', e)
                }
              })()
            `,
          }}
        />
      </body>
    </html>
  )
}