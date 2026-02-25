// app/signup/page.tsx
'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/hooks/useAuth'
import Link from 'next/link'
import { Video, UserPlus, AlertCircle, Loader2, Eye, EyeOff, Check, X, Mail } from 'lucide-react'

export default function SignupPage() {
  const [username, setUsername] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [acceptedTerms, setAcceptedTerms] = useState(false)
  
  const { signUp } = useAuth()
  const router = useRouter()

  const isPasswordValid = password.length >= 6
  const doPasswordsMatch = password === confirmPassword && confirmPassword.length > 0

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')

    if (!username.trim()) {
      setError('Please enter a username')
      return
    }
    if (!email.trim()) {
      setError('Please enter an email address')
      return
    }
    if (!isPasswordValid) {
      setError('Password must be at least 6 characters')
      return
    }
    if (!doPasswordsMatch) {
      setError('Passwords do not match')
      return
    }
    if (!acceptedTerms) {
      setError('Please accept the Terms of Service')
      return
    }

    setLoading(true)

    try {
      // 🔐 Use the useAuth hook's signUp function
      const result = await signUp(email, password, username)
      
      if (result.error) {
        if (result.error.message?.includes('User already registered')) {
          setError('An account with this email already exists')
        } else if (result.error.message?.includes('Username already taken')) {
          setError('Username is already taken. Please choose another')
        } else if (result.error.message?.includes('Invalid email')) {
          setError('Please enter a valid email address')
        } else {
          setError(result.error.message || 'Sign up failed. Please try again')
        }
      } else {
        router.push('/')
      }
    } catch (err: any) {
      console.error('Signup error:', err)
      setError('An unexpected error occurred. Please try again')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-[calc(100vh-4rem)] flex items-center justify-center px-4 py-8 bg-linear-to-br from-gray-50 to-gray-100">
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
            <span style={{ color: '#bb0000' }}>Join</span>
            <span style={{ color: '#000000' }}> Stream254</span>
          </h1>
          <p className="mt-2 text-gray-600">
            Create your account and start sharing <span className="font-semibold text-[#007847]">your story</span>
          </p>
        </div>

        {/* Signup Card */}
        <div className="bg-white rounded-2xl border border-gray-200 shadow-lg p-6 sm:p-8">
          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Error Message */}
            {error && (
              <div className="flex items-start gap-3 p-4 rounded-lg bg-red-50 border border-red-200">
                <AlertCircle className="h-5 w-5 shrink-0 mt-0.5 text-red-600" />
                <p className="text-sm text-red-600">{error}</p>
              </div>
            )}

            {/* Username Input */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Username
              </label>
              <div className="relative">
                <UserPlus className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                <input
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#bb0000]/20 focus:border-[#bb0000] transition-all"
                  placeholder="creator_name"
                  required
                  disabled={loading}
                  autoComplete="username"
                  minLength={3}
                  maxLength={20}
                  pattern="^[a-zA-Z0-9_]+$"
                />
              </div>
              <p className="mt-1 text-xs text-gray-500">
                3-20 characters. Letters, numbers, underscores only.
              </p>
            </div>

            {/* Email Input */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Email Address
              </label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#bb0000]/20 focus:border-[#bb0000] transition-all"
                  placeholder="you@example.com"
                  required
                  disabled={loading}
                  autoComplete="email"
                />
              </div>
            </div>

            {/* Password Input with Show/Hide Toggle */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Password
              </label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full pr-10 pl-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#bb0000]/20 focus:border-[#bb0000] transition-all"
                  placeholder="••••••••"
                  required
                  disabled={loading}
                  autoComplete="new-password"
                  minLength={6}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 p-1 text-gray-400 hover:text-[#bb0000] transition-colors disabled:opacity-50"
                  disabled={loading}
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                  tabIndex={-1}
                >
                  {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                </button>
              </div>
              <div className="mt-2 flex items-center gap-2">
                <div className={`h-1 flex-1 rounded-full ${isPasswordValid ? 'bg-[#007847]' : 'bg-gray-200'}`} />
                <span className={`text-xs ${isPasswordValid ? 'text-[#007847]' : 'text-gray-500'}`}>
                  {isPasswordValid ? '✓ Strong' : 'Min 6 chars'}
                </span>
              </div>
            </div>

            {/* Confirm Password Input */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Confirm Password
              </label>
              <div className="relative">
                <input
                  type={showConfirmPassword ? 'text' : 'password'}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="w-full pr-10 pl-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#bb0000]/20 focus:border-[#bb0000] transition-all"
                  placeholder="••••••••"
                  required
                  disabled={loading}
                  autoComplete="new-password"
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 p-1 text-gray-400 hover:text-[#bb0000] transition-colors disabled:opacity-50"
                  disabled={loading}
                  aria-label={showConfirmPassword ? 'Hide password' : 'Show password'}
                  tabIndex={-1}
                >
                  {showConfirmPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                </button>
              </div>
              {confirmPassword.length > 0 && (
                <div className="mt-2 flex items-center gap-2">
                  {doPasswordsMatch ? (
                    <>
                      <Check className="h-4 w-4 text-[#007847]" />
                      <span className="text-xs text-[#007847]">Passwords match</span>
                    </>
                  ) : (
                    <>
                      <X className="h-4 w-4 text-[#dc2626]" />
                      <span className="text-xs text-[#dc2626]">Passwords do not match</span>
                    </>
                  )}
                </div>
              )}
            </div>

            {/* Terms Checkbox */}
            <div className="flex items-start gap-3">
              <input
                id="terms"
                type="checkbox"
                checked={acceptedTerms}
                onChange={(e) => setAcceptedTerms(e.target.checked)}
                className="mt-1 rounded border-gray-300 text-[#bb0000] focus:ring-[#bb0000]"
                disabled={loading}
              />
              <label htmlFor="terms" className="text-sm text-gray-600">
                I agree to the{' '}
                <Link href="/terms" className="font-medium hover:underline text-[#bb0000]">
                  Terms of Service
                </Link>{' '}
                and{' '}
                <Link href="/privacy" className="font-medium hover:underline text-[#bb0000]">
                  Privacy Policy
                </Link>
              </label>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={loading || !username || !email || !isPasswordValid || !doPasswordsMatch || !acceptedTerms}
              className="w-full flex items-center justify-center gap-2 px-6 py-3 rounded-xl font-semibold text-white transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-md hover:shadow-lg hover:-translate-y-0.5"
              style={{ background: 'linear-gradient(135deg, #bb0000, #007847)' }}
            >
              {loading ? (
                <>
                  <Loader2 className="h-5 w-5 animate-spin" />
                  Creating account...
                </>
              ) : (
                <>
                  <UserPlus className="h-5 w-5" />
                  Create Account
                </>
              )}
            </button>
          </form>

          {/* Divider */}
          <div className="relative my-6">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-gray-200" />
            </div>
            <div className="relative flex justify-center text-xs">
              <span className="px-2 bg-white text-gray-500">Already have an account?</span>
            </div>
          </div>

          {/* Sign In Link */}
          <p className="text-center text-sm text-gray-600">
            <Link href="/login" className="font-semibold hover:underline text-[#007847]">
              Sign in instead
            </Link>
          </p>
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