// app/forgot-password/page.tsx
'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import Link from 'next/link'
import { Video, AlertCircle, Loader2, Mail, CheckCircle, ArrowLeft } from 'lucide-react'

export default function ForgotPasswordPage() {
  const [identifier, setIdentifier] = useState('')
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)
  const [loading, setLoading] = useState(false)
  const [maskedEmail, setMaskedEmail] = useState('')
  const [lastRequestTime, setLastRequestTime] = useState(0) // ✅ Track last request time
  
  const router = useRouter()
  const supabase = createClient()

  // Mask email for display (e.g., "j***@gmail.com")
  const maskEmail = (email: string) => {
    if (!email) return ''
    const [local, domain] = email.split('@')
    if (!local || !domain) return email
    const maskedLocal = local[0] + '*'.repeat(Math.max(0, local.length - 2)) + local.slice(-1)
    return `${maskedLocal}@${domain}`
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    
    // ✅ Check rate limit (60 seconds between requests)
    const now = Date.now()
    if (now - lastRequestTime < 60000) {
      const remaining = Math.ceil((60000 - (now - lastRequestTime)) / 1000)
      setError(`Please wait ${remaining} seconds before requesting another reset link.`)
      return
    }
    
    setLoading(true)

    try {
      const trimmed = identifier.trim().toLowerCase()
      
      // 🔍 Check if input is email format
      const isEmail = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmed)
      
      let emailToSend: string | null = null

      if (isEmail) {
        // If email, use directly (more secure - no lookup needed)
        emailToSend = trimmed
      } else {
        // If username, look up email
        const { data, error: profileError } = await supabase
          .from('profiles')
          .select('email')
          .eq('username', trimmed)
          .single()

        if (profileError || !data?.email) {
          // ⚠️ Security: Always show success to prevent username enumeration
          setSuccess(true)
          setMaskedEmail('your email')
          setLoading(false)
          return
        }
        emailToSend = data.email
      }

      // ✅ Ensure email is not null before calling resetPasswordForEmail
      if (!emailToSend) {
        setSuccess(true)
        setMaskedEmail('your email')
        setLoading(false)
        return
      }

      // 📧 Send password reset email
      const { error: resetError } = await supabase.auth.resetPasswordForEmail(
        emailToSend,
        {
          redirectTo: `${window.location.origin}/reset-password`,
        }
      )

      if (resetError) {
        // ✅ Handle rate limit specifically
        if (resetError.status === 429 || resetError.message?.includes('26 seconds')) {
          setError('Too many requests. Please wait a minute before trying again.')
        } else {
          // Don't reveal specific errors for security
          setError('If an account exists, a reset link has been sent.')
        }
      } else {
        setSuccess(true)
        setMaskedEmail(maskEmail(emailToSend))
        setLastRequestTime(Date.now()) // ✅ Update last request time on success
      }
    } catch (err: any) {
      console.error('Forgot password error:', err)
      // Don't reveal specific errors for security
      setError('If an account exists, a reset link has been sent.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-[calc(100vh-4rem)] flex items-center justify-center px-4 bg-linear-to-br from-gray-50 to-gray-100">
      {/* Kenyan Flag Stripe Top */}
      <div 
        className="fixed top-16 left-0 right-0 h-1 z-40"
        style={{
          background: 'linear-gradient(90deg, #007847 0%, #007847 33%, #000000 33%, #000000 34%, #bb0000 34%, #bb0000 66%, #000000 66%, #000000 67%, #007847 67%, #007847 100%)'
        }}
      />

      <div className="w-full max-w-md">
        {/* Logo Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center gap-2 mb-4">
            <div 
              className="p-3 rounded-xl"
              style={{ background: 'linear-gradient(135deg, #bb0000, #007847)' }}
            >
              <Video className="h-8 w-8 text-white" />
            </div>
          </div>
          <h1 className="text-3xl font-bold">
            <span style={{ color: '#bb0000' }}>Reset</span>
            <span style={{ color: '#000000' }}> Password</span>
          </h1>
          <p className="mt-2 text-gray-600">
            We'll send you a link to reset your password
          </p>
        </div>

        {/* Forgot Password Card */}
        <div className="bg-white rounded-2xl border border-gray-200 shadow-lg p-6 sm:p-8">
          {!success ? (
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Error Message - Updated for rate limit */}
              {error && (
                <div className={`flex items-start gap-3 p-4 rounded-lg ${
                  error.includes('wait') 
                    ? 'bg-yellow-50 border border-yellow-200' 
                    : 'bg-red-50 border border-red-200'
                }`}>
                  <AlertCircle className={`h-5 w-5 shrink-0 mt-0.5 ${
                    error.includes('wait') ? 'text-yellow-600' : 'text-red-600'
                  }`} />
                  <p className={`text-sm ${
                    error.includes('wait') ? 'text-yellow-700' : 'text-red-600'
                  }`}>{error}</p>
                </div>
              )}

              {/* Username/Email Input */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Username or Email
                </label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                  <input
                    type="text"
                    value={identifier}
                    onChange={(e) => setIdentifier(e.target.value)}
                    className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#bb0000]/20 focus:border-[#bb0000] transition-all"
                    placeholder="creator_name or email@example.com"
                    required
                    disabled={loading}
                    autoComplete="username"
                  />
                </div>
                <p className="mt-1 text-xs text-gray-500">
                  Enter your Stream254 username or email address
                </p>
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                disabled={loading || !identifier}
                className="w-full flex items-center justify-center gap-2 px-6 py-3 rounded-xl font-semibold text-white transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-md hover:shadow-lg hover:-translate-y-0.5"
                style={{ background: 'linear-gradient(135deg, #bb0000, #007847)' }}
              >
                {loading ? (
                  <>
                    <Loader2 className="h-5 w-5 animate-spin" />
                    Sending...
                  </>
                ) : (
                  <>
                    <Mail className="h-5 w-5" />
                    Send Reset Link
                  </>
                )}
              </button>
            </form>
          ) : (
            /* Success Message */
            <div className="text-center py-6">
              <div className="inline-flex items-center justify-center w-16 h-16 rounded-full mb-4 bg-green-50">
                <CheckCircle className="h-8 w-8 text-[#007847]" />
              </div>
              <h2 className="text-xl font-semibold text-gray-900 mb-2">
                Check Your Email
              </h2>
              <p className="text-gray-600 mb-6">
                We've sent a password reset link to{' '}
                <span className="font-medium text-[#007847]">{maskedEmail}</span>
              </p>
              <p className="text-sm text-gray-500 mb-6">
                Didn't receive the email? Check your spam folder or{' '}
                <button
                  type="button"
                  onClick={handleSubmit}
                  disabled={loading}
                  className="font-medium hover:underline text-[#bb0000] disabled:opacity-50"
                >
                  click here to resend
                </button>
              </p>
              <div className="p-4 bg-blue-50 rounded-lg text-left">
                <p className="text-sm text-blue-800">
                  <strong>Tip:</strong> The reset link expires in 1 hour. 
                  If you don't see the email, check your spam/junk folder.
                </p>
              </div>
            </div>
          )}

          {/* Back to Login */}
          <div className="mt-6 pt-6 border-t border-gray-200">
            <Link 
              href="/login"
              className="flex items-center justify-center gap-2 text-sm font-medium text-gray-600 hover:text-[#bb0000] transition-colors"
            >
              <ArrowLeft className="h-4 w-4" />
              Back to Login
            </Link>
          </div>
        </div>

        {/* Help Text */}
        <p className="text-center text-xs text-gray-400 mt-6">
          Having trouble?{' '}
          <Link href="/help" className="hover:underline text-gray-500">
            Contact Support
          </Link>
        </p>
      </div>
    </div>
  )
}