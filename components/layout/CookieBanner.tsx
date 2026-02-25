// components/layout/CookieBanner.tsx
'use client'

import { useState, useEffect } from 'react'
import { Cookie, X, Settings, Check } from 'lucide-react'
import Link from 'next/link'

const KENYA = {
  red: '#bb0000',
  green: '#007847',
}

export default function CookieBanner() {
  const [showBanner, setShowBanner] = useState(false)
  const [saved, setSaved] = useState(false)

  useEffect(() => {
    const hasConsent = localStorage.getItem('cookieConsent')
    if (!hasConsent) {
      // Show banner after 2 seconds
      const timer = setTimeout(() => setShowBanner(true), 2000)
      return () => clearTimeout(timer)
    }
  }, [])

  const handleAccept = () => {
    localStorage.setItem('cookieConsent', 'all')
    localStorage.setItem('cookiePreferences', JSON.stringify({
      essential: true,
      functional: true,
      analytics: true,
      marketing: true,
    }))
    setSaved(true)
    setTimeout(() => setShowBanner(false), 500)
  }

  const handleDecline = () => {
    localStorage.setItem('cookieConsent', 'essential')
    localStorage.setItem('cookiePreferences', JSON.stringify({
      essential: true,
      functional: false,
      analytics: false,
      marketing: false,
    }))
    setSaved(true)
    setTimeout(() => setShowBanner(false), 500)
  }

  if (!showBanner) return null

  return (
    <div className={`fixed bottom-0 left-0 right-0 z-50 p-4 transition-all duration-500 ${
      saved ? 'translate-y-full opacity-0' : 'translate-y-0 opacity-100'
    }`}>
      <div className="max-w-5xl mx-auto">
        <div className="bg-white rounded-2xl shadow-2xl border border-gray-200 p-4 sm:p-6">
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
            {/* Icon & Text */}
            <div className="flex items-start gap-3 flex-1">
              <div className="p-2 rounded-lg" style={{ background: `${KENYA.red}15` }}>
                <Cookie className="h-6 w-6" style={{ color: KENYA.red }} />
              </div>
              <div>
                <p className="font-semibold text-gray-900 mb-1">
                  We Value Your Privacy 🇰🇪
                </p>
                <p className="text-sm text-gray-600">
                  Stream254 uses cookies to enhance your experience, analyze usage, and serve relevant content. 
                  By clicking "Accept All", you consent to our use of cookies.{' '}
                  <Link href="/cookies" className="font-medium hover:underline" style={{ color: KENYA.red }}>
                    Learn more
                  </Link>
                </p>
              </div>
            </div>

            {/* Buttons */}
            <div className="flex flex-wrap gap-2 shrink-0">
              <button
                onClick={handleDecline}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors flex items-center gap-2"
              >
                <X className="h-4 w-4" />
                Essential Only
              </button>
              <button
                onClick={handleAccept}
                className="px-4 py-2 text-sm font-medium text-white rounded-lg transition-all duration-300 flex items-center gap-2"
                style={{ background: KENYA.green }}
              >
                <Check className="h-4 w-4" />
                Accept All
              </button>
              <Link
                href="/cookies"
                className="px-4 py-2 text-sm font-medium text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors flex items-center gap-2"
              >
                <Settings className="h-4 w-4" />
                Customize
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}