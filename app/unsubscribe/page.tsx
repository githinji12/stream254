// app/unsubscribe/page.tsx
'use client'

import { useState, useEffect, Suspense } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import { Check, X, Loader2, Mail, ArrowLeft, RefreshCcw } from 'lucide-react'
import Link from 'next/link'

// 🎨 Kenyan Theme
const KENYA = {
  red: '#bb0000',
  green: '#007847',
  black: '#000000',
} as const

function UnsubscribeContent() {
  const searchParams = useSearchParams()
  const router = useRouter()
  
  const [status, setStatus] = useState<'loading' | 'subscribed' | 'unsubscribed' | 'not_found' | 'error'>('loading')
  const [email, setEmail] = useState('')
  const [message, setMessage] = useState('')
  const [isProcessing, setIsProcessing] = useState(false)
  
  useEffect(() => {
    const token = searchParams.get('token')
    const emailParam = searchParams.get('email')
    
    if (!token && !emailParam) {
      setStatus('not_found')
      return
    }
    
    // Check subscription status
    const checkStatus = async () => {
      try {
        const params = new URLSearchParams()
        if (token) params.set('token', token)
        if (emailParam) params.set('email', emailParam)
        
        const response = await fetch(`/api/unsubscribe?${params}`)
        const data = await response.json()
        
        if (!response.ok) {
          setStatus('not_found')
          setMessage(data.error || 'Subscription not found')
          return
        }
        
        setEmail(data.email || emailParam || '')
        
        if (data.unsubscribed) {
          setStatus('unsubscribed')
          setMessage('You are already unsubscribed.')
        } else {
          setStatus('subscribed')
        }
      } catch (error) {
        console.error('Status check error:', error)
        setStatus('error')
        setMessage('Failed to check subscription status')
      }
    }
    
    checkStatus()
  }, [searchParams])
  
  const handleUnsubscribe = async () => {
    setIsProcessing(true)
    
    try {
      const token = searchParams.get('token')
      
      const response = await fetch('/api/unsubscribe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: email || undefined,
          token: token || undefined,
        }),
      })
      
      const data = await response.json()
      
      if (!response.ok) {
        throw new Error(data.error || 'Failed to unsubscribe')
      }
      
      setStatus('unsubscribed')
      setMessage(data.message || 'You have been successfully unsubscribed.')
    } catch (error: any) {
      console.error('Unsubscribe error:', error)
      setStatus('error')
      setMessage(error.message || 'Failed to unsubscribe. Please try again.')
    } finally {
      setIsProcessing(false)
    }
  }
  
  const handleResubscribe = async () => {
    setIsProcessing(true)
    
    try {
      const response = await fetch('/api/subscribe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: email,
          source: 'resubscribe',
        }),
      })
      
      const data = await response.json()
      
      if (!response.ok) {
        throw new Error(data.error || 'Failed to resubscribe')
      }
      
      setStatus('subscribed')
      setMessage(data.message || 'You have been successfully resubscribed!')
    } catch (error: any) {
      console.error('Resubscribe error:', error)
      setStatus('error')
      setMessage(error.message || 'Failed to resubscribe. Please try again.')
    } finally {
      setIsProcessing(false)
    }
  }
  
  return (
    <div className="min-h-[calc(100vh-4rem)] flex items-center justify-center bg-to-br from-gray-50 to-gray-100 py-12 px-4">
      <div className="max-w-md w-full bg-white rounded-2xl shadow-lg border border-gray-200 p-8">
        {/* Header */}
        <div className="text-center mb-6">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full mb-4"
            style={{ 
              background: status === 'unsubscribed' 
                ? 'linear-gradient(135deg, #bb0000, #007847)' 
                : 'bg-gray-100'
            }}
          >
            {status === 'loading' || isProcessing ? (
              <Loader2 className="h-8 w-8 animate-spin" style={{ color: KENYA.red }} />
            ) : status === 'unsubscribed' ? (
              <Mail className="h-8 w-8 text-white" />
            ) : status === 'subscribed' ? (
              <Mail className="h-8 w-8" style={{ color: KENYA.red }} />
            ) : (
              <X className="h-8 w-8 text-gray-400" />
            )}
          </div>
          
          <h1 className="text-2xl font-bold text-gray-900 mb-2">
            {status === 'loading' && 'Checking subscription...'}
            {status === 'subscribed' && 'Manage Your Subscription'}
            {status === 'unsubscribed' && 'You\'re Unsubscribed'}
            {status === 'not_found' && 'Subscription Not Found'}
            {status === 'error' && 'Something Went Wrong'}
          </h1>
        </div>
        
        {/* Content */}
        {status === 'loading' && (
          <div className="text-center text-gray-600">
            <p>Please wait while we check your subscription status...</p>
          </div>
        )}
        
        {status === 'subscribed' && (
          <div className="space-y-6">
            <div className="text-center text-gray-600">
              <p className="mb-2">
                You are currently subscribed to Stream254 newsletters.
              </p>
              {email && (
                <p className="text-sm text-gray-500">
                  Email: <span className="font-medium">{email}</span>
                </p>
              )}
            </div>
            
            <div className="space-y-3">
              <button
                onClick={handleUnsubscribe}
                disabled={isProcessing}
                className="w-full py-3 rounded-xl font-semibold text-white transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                style={{ 
                  background: `linear-gradient(135deg, ${KENYA.red}, ${KENYA.green})` 
                }}
              >
                {isProcessing ? (
                  <span className="flex items-center justify-center gap-2">
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Processing...
                  </span>
                ) : (
                  'Unsubscribe from Newsletters'
                )}
              </button>
              
              <Link
                href="/"
                className="block w-full py-3 rounded-xl font-semibold border-2 border-gray-300 text-gray-700 text-center hover:bg-gray-50 transition-colors"
              >
                Back to Stream254
              </Link>
            </div>
            
            <div className="p-4 bg-gray-50 rounded-xl">
              <p className="text-sm text-gray-600 text-center">
                📧 You'll no longer receive newsletter emails, but you'll still receive important account notifications.
              </p>
            </div>
          </div>
        )}
        
        {status === 'unsubscribed' && (
          <div className="space-y-6">
            <div className="text-center">
              <Check className="h-12 w-12 mx-auto mb-4" style={{ color: KENYA.green }} />
              <p className="text-gray-600 mb-2">
                {message || 'You have been successfully unsubscribed from Stream254 newsletters.'}
              </p>
              {email && (
                <p className="text-sm text-gray-500">
                  Email: <span className="font-medium">{email}</span>
                </p>
              )}
            </div>
            
            <div className="space-y-3">
              <button
                onClick={handleResubscribe}
                disabled={isProcessing}
                className="w-full py-3 rounded-xl font-semibold text-white transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                style={{ 
                  background: `linear-gradient(135deg, ${KENYA.green}, #005c36)` 
                }}
              >
                {isProcessing ? (
                  <span className="flex items-center justify-center gap-2">
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Processing...
                  </span>
                ) : (
                  <span className="flex items-center justify-center gap-2">
                    <RefreshCcw className="h-4 w-4" />
                    Resubscribe
                  </span>
                )}
              </button>
              
              <Link
                href="/"
                className="block w-full py-3 rounded-xl font-semibold border-2 border-gray-300 text-gray-700 text-center hover:bg-gray-50 transition-colors"
              >
                Back to Stream254
              </Link>
            </div>
            
            <div className="p-4 bg-[#1DA1F2]/10 rounded-xl">
              <p className="text-sm text-[#1DA1F2] text-center">
                💡 Miss us? You can resubscribe anytime to receive updates again.
              </p>
            </div>
          </div>
        )}
        
        {status === 'not_found' && (
          <div className="space-y-6">
            <div className="text-center text-gray-600">
              <p className="mb-2">
                {message || "We couldn't find a subscription with that email address."}
              </p>
              <p className="text-sm text-gray-500">
                You may have already unsubscribed or never subscribed.
              </p>
            </div>
            
            <div className="space-y-3">
              <Link
                href="/#newsletter"
                className="block w-full py-3 rounded-xl font-semibold text-white text-center"
                style={{ 
                  background: `linear-gradient(135deg, ${KENYA.red}, ${KENYA.green})` 
                }}
              >
                Subscribe Now
              </Link>
              
              <Link
                href="/"
                className="block w-full py-3 rounded-xl font-semibold border-2 border-gray-300 text-gray-700 text-center hover:bg-gray-50 transition-colors"
              >
                Back to Stream254
              </Link>
            </div>
          </div>
        )}
        
        {status === 'error' && (
          <div className="space-y-6">
            <div className="text-center text-red-600">
              <p className="mb-2">{message || 'An error occurred. Please try again.'}</p>
            </div>
            
            <div className="space-y-3">
              <button
                onClick={() => window.location.reload()}
                disabled={isProcessing}
                className="w-full py-3 rounded-xl font-semibold text-white transition-all disabled:opacity-50"
                style={{ 
                  background: `linear-gradient(135deg, ${KENYA.red}, ${KENYA.green})` 
                }}
              >
                Try Again
              </button>
              
              <Link
                href="/"
                className="block w-full py-3 rounded-xl font-semibold border-2 border-gray-300 text-gray-700 text-center hover:bg-gray-50 transition-colors"
              >
                Back to Stream254
              </Link>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

// ✅ Main Export with Suspense
export default function UnsubscribePage() {
  return (
    <Suspense fallback={
      <div className="min-h-[calc(100vh-4rem)] flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin" style={{ color: KENYA.red }} />
      </div>
    }>
      <UnsubscribeContent />
    </Suspense>
  )
}