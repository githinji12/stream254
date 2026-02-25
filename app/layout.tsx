// app/layout.tsx
import './globals.css'
import { AuthProvider } from '@/hooks/useAuth'
import { LanguageProvider } from '@/lib/i18n/client'
import Navbar from '@/components/layout/Navbar'
import Footer from '@/components/layout/Footer'
import { Toaster } from 'react-hot-toast'

export const metadata = {
  title: 'Stream254 - African Video Platform',
  description: 'Video platform for African creators 🇰🇪',
  keywords: ['video', 'streaming', 'Kenya', 'Africa', 'creators', 'M-Pesa'],
  authors: [{ name: 'Stream254 Team' }],
  openGraph: {
    title: 'Stream254 - African Video Platform',
    description: 'Video platform for African creators 🇰🇪',
    type: 'website',
    locale: 'en_KE',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Stream254 - African Video Platform',
    description: 'Video platform for African creators 🇰🇪',
  },
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body className="min-h-screen bg-background flex flex-col antialiased">
        {/* ✅ LanguageProvider must return JSX */}
        <LanguageProvider>
          <AuthProvider>
            <Navbar />
            <main className="flex-1 pt-16">{children}</main>
            <Footer />
            <Toaster 
              position="bottom-right"
              toastOptions={{
                duration: 4000,
                style: {
                  background: '#333',
                  color: '#fff',
                },
                success: {
                  duration: 3000,
                  iconTheme: {
                    primary: '#007847',
                    secondary: '#fff',
                  },
                },
                error: {
                  duration: 4000,
                  iconTheme: {
                    primary: '#bb0000',
                    secondary: '#fff',
                  },
                },
              }}
            />
          </AuthProvider>
        </LanguageProvider>
      </body>
    </html>
  )
}