// components/shared/NewsletterSignup.tsx
'use client'

import { useState } from 'react'
import { Mail, Loader2, Check, AlertCircle } from 'lucide-react'
import { toast } from 'react-hot-toast'

interface NewsletterSignupProps {
  source?: 'footer' | 'popup' | 'creator_page' | 'video_page' | 'other'
  compact?: boolean
  onSuccess?: () => void
}

export function NewsletterSignup({ 
  source = 'footer', 
  compact = false,
  onSuccess 
}: NewsletterSignupProps) {
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)
  const [subscribed, setSubscribed] = useState(false)
  const [error, setError] = useState('')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    
    if (!email.trim()) {
      setError('Please enter your email address')
      return
    }
    
    // Basic email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(email)) {
      setError('Please enter a valid email address')
      return
    }
    
    setLoading(true)
    
    try {
      const response = await fetch('/api/subscribe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: email.trim(),
          source,
          metadata: {
            user_agent: navigator.userAgent,
            page_url: window.location.href,
            timestamp: new Date().toISOString()
          }
        })
      })
      
      const result = await response.json()
      
      if (!response.ok) {
        if (response.status === 429) {
          setError(`Too many attempts. Please wait ${result.retryAfter || 60} seconds.`)
        } else {
          setError(result.error || 'Failed to subscribe. Please try again.')
        }
        return
      }
      
      setSubscribed(true)
      setEmail('')
      toast.success(result.message)
      
      if (onSuccess) {
        onSuccess()
      }
      
    } catch (err: any) {
      console.error('Subscription error:', err)
      setError('Network error. Please check your connection and try again.')
    } finally {
      setLoading(false)
    }
  }

  if (subscribed) {
    return (
      <div className={`flex items-center gap-3 p-4 rounded-xl bg-green-50 border border-green-200 ${compact ? 'py-3' : ''}`}>
        <div className="h-8 w-8 rounded-full bg-green-100 flex items-center justify-center shrink-0">
          <Check className="h-5 w-5 text-green-600" />
        </div>
        <div>
          <p className="font-medium text-green-900">Thank you for subscribing! 🎉</p>
          <p className="text-sm text-green-700">Check your inbox for a welcome email.</p>
        </div>
      </div>
    )
  }

  if (compact) {
    return (
      <form onSubmit={handleSubmit} className="flex gap-2">
        <div className="relative flex-1">
          <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
          <input
            type="email"
            value={email}
            onChange={(e) => {
              setEmail(e.target.value)
              setError('')
            }}
            placeholder="your@email.com"
            className="w-full pl-9 pr-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#bb0000]/20 focus:border-[#bb0000] text-sm"
            disabled={loading}
            aria-label="Email address"
          />
        </div>
        <button
          type="submit"
          disabled={loading}
          className="px-4 py-2.5 rounded-lg font-medium text-white text-sm transition-all disabled:opacity-50 flex items-center gap-2"
          style={{ background: 'linear-gradient(135deg, #bb0000, #007847)' }}
        >
          {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Subscribe'}
        </button>
      </form>
    )
  }

  return (
    <div className="bg-white rounded-2xl border border-gray-200 shadow-lg p-6 sm:p-8">
      <div className="text-center mb-6">
        <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-[#bb0000]/10 mb-4">
          <Mail className="h-6 w-6 text-[#bb0000]" />
        </div>
        <h3 className="text-xl font-bold text-gray-900 mb-2">
          Stay Updated with Stream254 🇰🇪
        </h3>
        <p className="text-gray-600">
          Get the latest videos, creator spotlights, and exclusive content delivered to your inbox.
        </p>
      </div>
      
      <form onSubmit={handleSubmit} className="space-y-4">
        {error && (
          <div className="flex items-start gap-2 p-3 rounded-lg bg-red-50 border border-red-200">
            <AlertCircle className="h-4 w-4 text-red-600 shrink-0 mt-0.5" />
            <p className="text-sm text-red-700">{error}</p>
          </div>
        )}
        
        <div>
          <label htmlFor="newsletter-email" className="sr-only">
            Email address
          </label>
          <div className="relative">
            <Mail className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
            <input
              id="newsletter-email"
              type="email"
              value={email}
              onChange={(e) => {
                setEmail(e.target.value)
                setError('')
              }}
              placeholder="your@email.com"
              className="w-full pl-12 pr-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#bb0000]/20 focus:border-[#bb0000] transition-all"
              disabled={loading}
              required
              aria-label="Email address"
            />
          </div>
          <p className="mt-2 text-xs text-gray-500">
            We respect your privacy. Unsubscribe anytime.
          </p>
        </div>
        
        <button
          type="submit"
          disabled={loading}
          className="w-full flex items-center justify-center gap-2 px-6 py-3 rounded-xl font-semibold text-white transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-md hover:shadow-lg hover:-translate-y-0.5"
          style={{ background: 'linear-gradient(135deg, #bb0000, #007847)' }}
        >
          {loading ? (
            <>
              <Loader2 className="h-5 w-5 animate-spin" />
              Subscribing...
            </>
          ) : (
            <>
              <Mail className="h-5 w-5" />
              Subscribe to Newsletter
            </>
          )}
        </button>
      </form>
      
      <p className="mt-4 text-center text-xs text-gray-500">
        By subscribing, you agree to our{' '}
        <a href="/privacy" className="text-[#bb0000] hover:underline">
          Privacy Policy
        </a>
      </p>
    </div>
  )
}