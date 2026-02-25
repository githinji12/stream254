// app/cookies/page.tsx
'use client'

import { useState } from 'react'
import Link from 'next/link'
import { ChevronRight, Cookie, Settings, Shield, BarChart3, Megaphone, Check, X } from 'lucide-react'

const KENYA = {
  red: '#bb0000',
  green: '#007847',
  black: '#000000',
}

// Cookie categories with descriptions
const cookieCategories = [
  {
    id: 'essential',
    name: 'Essential Cookies',
    icon: Shield,
    color: KENYA.green,
    required: true,
    description: 'These cookies are necessary for the website to function and cannot be switched off. They are usually only set in response to actions made by you such as setting your privacy preferences, logging in, or filling in forms.',
    cookies: [
      { name: 'session_id', purpose: 'Maintains user session', duration: 'Session' },
      { name: 'auth_token', purpose: 'Authentication', duration: '30 days' },
      { name: 'csrf_token', purpose: 'Security protection', duration: 'Session' },
    ],
  },
  {
    id: 'functional',
    name: 'Functional Cookies',
    icon: Settings,
    color: KENYA.black,
    required: false,
    description: 'These cookies allow the website to provide enhanced functionality and personalization. They may be set by us or by third party providers whose services we have added to our pages.',
    cookies: [
      { name: 'language', purpose: 'Stores language preference', duration: '1 year' },
      { name: 'theme', purpose: 'Stores theme preference', duration: '1 year' },
      { name: 'video_quality', purpose: 'Stores video quality setting', duration: '1 year' },
    ],
  },
  {
    id: 'analytics',
    name: 'Analytics Cookies',
    icon: BarChart3,
    color: KENYA.red,
    required: false,
    description: 'These cookies help us understand how visitors interact with our website by collecting and reporting information anonymously. This helps us improve our website and services.',
    cookies: [
      { name: '_ga', purpose: 'Google Analytics - distinguish users', duration: '2 years' },
      { name: '_gid', purpose: 'Google Analytics - track behavior', duration: '24 hours' },
      { name: 'page_views', purpose: 'Track page views', duration: 'Session' },
    ],
  },
  {
    id: 'marketing',
    name: 'Marketing Cookies',
    icon: Megaphone,
    color: KENYA.red,
    required: false,
    description: 'These cookies may be set through our site by our advertising partners. They may be used by those companies to build a profile of your interests and show you relevant adverts on other sites.',
    cookies: [
      { name: '_fbp', purpose: 'Facebook Pixel - ad tracking', duration: '3 months' },
      { name: '_gcl_au', purpose: 'Google Ads - conversion tracking', duration: '3 months' },
      { name: 'personalization_id', purpose: 'Content personalization', duration: '1 year' },
    ],
  },
]

export default function CookiesPage() {
  const [cookiePreferences, setCookiePreferences] = useState({
    essential: true,
    functional: true,
    analytics: false,
    marketing: false,
  })
  const [saved, setSaved] = useState(false)

  const handleToggle = (category: string) => {
    const categoryData = cookieCategories.find(c => c.id === category)
    if (categoryData?.required) return // Cannot disable essential cookies

    setCookiePreferences(prev => ({
      ...prev,
      [category]: !prev[category as keyof typeof prev],
    }))
  }

  const handleSave = () => {
    // TODO: Save preferences to localStorage or backend
    localStorage.setItem('cookiePreferences', JSON.stringify(cookiePreferences))
    setSaved(true)
    setTimeout(() => setSaved(false), 3000)
  }

  return (
    <div className="min-h-[calc(100vh-4rem)] py-8 px-4 pattern-savanna">
      {/* 🇰🇪 Kenyan Flag Stripe */}
      <div className="fixed top-16 left-0 right-0 kenya-stripe z-30" />

      <div className="max-w-5xl mx-auto">
        {/* Header */}
        <div className="mb-8 text-center">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl mb-4" style={{ background: `linear-gradient(135deg, ${KENYA.red}, ${KENYA.black})` }}>
            <Cookie className="h-8 w-8 text-white" />
          </div>
          <h1 className="text-3xl sm:text-4xl font-bold mb-2">
            <span style={{ color: KENYA.red }}>Cookies</span>
            <span style={{ color: KENYA.black }}> Policy</span>
          </h1>
          <p className="text-gray-600">How we use cookies and similar technologies</p>
        </div>

        {/* Breadcrumb */}
        <nav className="flex items-center gap-2 text-sm text-gray-500 mb-8">
          <Link href="/" className="hover:text-[#bb0000] transition-colors">Home</Link>
          <ChevronRight className="h-4 w-4" />
          <span className="text-gray-900 font-medium">Cookies Policy</span>
        </nav>

        <div className="card-kenya p-6 sm:p-8 space-y-8">
          
          {/* Introduction */}
          <section>
            <h2 className="text-xl font-bold text-gray-900 mb-3">What Are Cookies?</h2>
            <div className="prose prose-sm max-w-none text-gray-700">
              <p>
                Cookies are small text files that are placed on your device (computer, smartphone, or tablet) 
                when you visit a website. They are widely used to make websites work more efficiently and 
                provide information to the owners of the site.
              </p>
              <p className="mt-3">
                Stream254 uses cookies and similar technologies (such as pixels, local storage, and device 
                identifiers) to enhance your experience, analyze usage, and serve relevant content.
              </p>
            </div>
          </section>

          {/* Cookie Preferences */}
          <section>
            <h2 className="text-xl font-bold text-gray-900 mb-3">Manage Your Cookie Preferences</h2>
            <div className="prose prose-sm max-w-none text-gray-700 mb-4">
              <p>
                You can customize which types of cookies you allow. Note that essential cookies cannot be 
                disabled as they are necessary for the website to function.
              </p>
            </div>

            <div className="space-y-4">
              {cookieCategories.map((category) => {
                const Icon = category.icon
                const isEnabled = cookiePreferences[category.id as keyof typeof cookiePreferences]

                return (
                  <div
                    key={category.id}
                    className="border border-gray-200 rounded-xl p-4 hover:border-[#bb0000] transition-colors"
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex items-start gap-3 flex-1">
                        <div 
                          className="p-2 rounded-lg shrink-0" 
                          style={{ background: `${category.color}15` }}
                        >
                          <Icon className="h-5 w-5" style={{ color: category.color }} />
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <h3 className="font-semibold text-gray-900">{category.name}</h3>
                            {category.required && (
                              <span className="px-2 py-0.5 text-xs font-medium rounded-full bg-gray-100 text-gray-600">
                                Required
                              </span>
                            )}
                          </div>
                          <p className="text-sm text-gray-600 mb-3">{category.description}</p>
                          
                          {/* Cookie List */}
                          <div className="bg-gray-50 rounded-lg p-3">
                            <p className="text-xs font-medium text-gray-700 mb-2">Cookies in this category:</p>
                            <ul className="space-y-1">
                              {category.cookies.map((cookie, index) => (
                                <li key={index} className="text-xs text-gray-600 flex items-center justify-between">
                                  <span><strong>{cookie.name}</strong> - {cookie.purpose}</span>
                                  <span className="text-gray-400">{cookie.duration}</span>
                                </li>
                              ))}
                            </ul>
                          </div>
                        </div>
                      </div>

                      {/* Toggle Switch */}
                      <button
                        onClick={() => handleToggle(category.id)}
                        disabled={category.required}
                        className={`relative w-12 h-6 rounded-full transition-colors shrink-0 ${
                          isEnabled 
                            ? 'bg-[#007847]' 
                            : 'bg-gray-300'
                        } ${category.required ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
                        aria-label={`Toggle ${category.name}`}
                        aria-pressed={isEnabled}
                      >
                        <span
                          className={`absolute top-1 left-1 w-4 h-4 bg-white rounded-full transition-transform ${
                            isEnabled ? 'translate-x-6' : 'translate-x-0'
                          }`}
                        />
                      </button>
                    </div>
                  </div>
                )
              })}
            </div>

            {/* Save Button */}
            <div className="flex items-center gap-4 mt-6 pt-6 border-t border-gray-200">
              <button
                onClick={handleSave}
                className="btn-kenya-primary inline-flex items-center gap-2"
              >
                <Settings className="h-4 w-4" />
                Save Preferences
              </button>
              
              {saved && (
                <span className="text-sm flex items-center gap-2" style={{ color: KENYA.green }}>
                  <Check className="h-4 w-4" />
                  Preferences saved!
                </span>
              )}
            </div>
          </section>

          {/* How We Use Cookies */}
          <section>
            <h2 className="text-xl font-bold text-gray-900 mb-3">How We Use Cookies</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {[
                { title: 'Authentication', desc: 'Keep you logged in and secure your session' },
                { title: 'Personalization', desc: 'Remember your preferences and settings' },
                { title: 'Analytics', desc: 'Understand how you use our platform' },
                { title: 'Security', desc: 'Detect and prevent fraud and abuse' },
                { title: 'Performance', desc: 'Improve website speed and reliability' },
                { title: 'Marketing', desc: 'Show relevant content and advertisements' },
              ].map((item, index) => (
                <div key={index} className="flex items-start gap-3 p-4 rounded-lg bg-gray-50">
                  <Check className="h-5 w-5 shrink-0 mt-0.5" style={{ color: KENYA.green }} />
                  <div>
                    <p className="text-sm font-medium text-gray-900">{item.title}</p>
                    <p className="text-sm text-gray-600">{item.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </section>

          {/* Third-Party Cookies */}
          <section>
            <h2 className="text-xl font-bold text-gray-900 mb-3">Third-Party Cookies</h2>
            <div className="prose prose-sm max-w-none text-gray-700">
              <p>
                In addition to our own cookies, we may also use various third-party cookies to report usage 
                statistics, deliver advertisements, and so on. These third parties include:
              </p>
              <ul className="list-disc list-inside mt-3 space-y-1">
                <li><strong>Google Analytics</strong> - Website analytics and traffic measurement</li>
                <li><strong>Google Ads</strong> - Advertising and conversion tracking</li>
                <li><strong>Facebook Pixel</strong> - Social media advertising and analytics</li>
                <li><strong>YouTube</strong> - Video embedding and playback</li>
                <li><strong>Cloudflare</strong> - Security and performance optimization</li>
              </ul>
              <p className="mt-3">
                These third parties have their own privacy policies and cookie policies. We recommend reviewing 
                their policies to understand how they use your data.
              </p>
            </div>
          </section>

          {/* How to Control Cookies */}
          <section>
            <h2 className="text-xl font-bold text-gray-900 mb-3">How to Control Cookies</h2>
            <div className="prose prose-sm max-w-none text-gray-700">
              <p>In addition to our cookie preferences tool, you can control cookies through your browser:</p>
              
              <div className="mt-4 space-y-3">
                {[
                  { browser: 'Chrome', steps: 'Settings → Privacy and security → Cookies and other site data' },
                  { browser: 'Firefox', steps: 'Options → Privacy & Security → Cookies and Site Data' },
                  { browser: 'Safari', steps: 'Preferences → Privacy → Cookies and website data' },
                  { browser: 'Edge', steps: 'Settings → Cookies and site permissions → Manage and delete cookies' },
                ].map((item, index) => (
                  <div key={index} className="flex items-start gap-3 p-3 rounded-lg bg-gray-50">
                    <span className="font-semibold text-gray-900 min-w-20">{item.browser}:</span>
                    <span className="text-sm text-gray-600">{item.steps}</span>
                  </div>
                ))}
              </div>

              <div className="mt-4 p-4 rounded-lg" style={{ background: '#fef3c7', border: '1px solid #fcd34d' }}>
                <p className="text-sm text-gray-800">
                  <strong>Note:</strong> Disabling cookies may affect the functionality of Stream254 and limit 
                  your ability to use certain features.
                </p>
              </div>
            </div>
          </section>

          {/* Updates */}
          <section>
            <h2 className="text-xl font-bold text-gray-900 mb-3">Updates to This Policy</h2>
            <div className="prose prose-sm max-w-none text-gray-700">
              <p>
                We may update this Cookies Policy from time to time to reflect changes in our practices or 
                for operational, legal, or regulatory reasons. We will notify you of material changes via 
                email or prominent notice on the Service.
              </p>
              <p className="mt-3">
                The "Last updated" date at the top of this page indicates when this policy was last revised.
              </p>
            </div>
          </section>

          {/* Contact */}
          <section>
            <h2 className="text-xl font-bold text-gray-900 mb-3">Contact Us</h2>
            <div className="prose prose-sm max-w-none text-gray-700">
              <p>For questions about our use of cookies, please contact us:</p>
              <ul className="list-none mt-3 space-y-1">
                <li>📧 Email: <strong>privacy@stream254.co.ke</strong></li>
                <li>📍 Address: Nairobi, Kenya</li>
                <li>📱 Phone: +254 700 000 000</li>
              </ul>
              <p className="mt-3">
                You may also contact the <strong>Office of the Data Protection Commissioner (Kenya)</strong> 
                if you have concerns about how we handle your data.
              </p>
            </div>
          </section>

          {/* Action Buttons */}
          <div className="pt-6 border-t border-gray-200 flex flex-wrap gap-4">
            <Link href="/privacy" className="btn-kenya-secondary inline-flex items-center gap-2">
              <Shield className="h-4 w-4" />
              Privacy Policy
            </Link>
            <Link href="/terms" className="btn-kenya-outline inline-flex items-center gap-2">
              <Cookie className="h-4 w-4" />
              Terms of Service
            </Link>
          </div>
        </div>

      
      </div>
    </div>
  )
}