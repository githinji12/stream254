// app/login/page.tsx
'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/hooks/useAuth'
import { createClient } from '@/lib/supabase/client'
import Link from 'next/link'
import { Video, LogIn, AlertCircle, Loader2, Eye, EyeOff, User } from 'lucide-react'

export default function LoginPage() {
  const [identifier, setIdentifier] = useState('') // Accepts username OR email
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  
  const { signIn } = useAuth()
  const router = useRouter()
  const supabase = createClient()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    try {
      const trimmed = identifier.trim().toLowerCase()
      
      // 🔍 Check if input is email format
      const isEmail = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmed)
      
      let emailToSignIn: string | null = null

      if (isEmail) {
        // If email, use directly
        emailToSignIn = trimmed
      } else {
        // If username, look up email from profiles table
        // ✅ FIX: Use 'data' property, not 'profileData'
        const { data, error: profileError } = await supabase
          .from('profiles')
          .select('id, email')
          .eq('username', trimmed)
          .single()

        if (profileError || !data?.email) {
          // ⚠️ Security: Generic error to prevent username enumeration
          setError('Invalid username or password. Please try again.')
          setLoading(false)
          return
        }
        emailToSignIn = data.email
      }

      // ✅ Ensure email is not null before signing in
      if (!emailToSignIn) {
        setError('Invalid username or password. Please try again.')
        setLoading(false)
        return
      }

      // 🔐 Sign in with retrieved email + password
      const result = await signIn(emailToSignIn, password)
      
      if (result.error) {
        setError('Invalid username or password. Please try again.')
      } else {
        router.push('/')
      }
    } catch (err: any) {
      console.error('Login error:', err)
      setError('An error occurred. Please try again.')
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
            <span style={{ color: '#bb0000' }}>Welcome</span>
            <span style={{ color: '#000000' }}> Back</span>
          </h1>
          <p className="mt-2 text-gray-600">
            Sign in to continue to <span className="font-semibold text-[#007847]">Stream254</span>
          </p>
        </div>

        {/* Login Card */}
        <div className="bg-white rounded-2xl border border-gray-200 shadow-lg p-6 sm:p-8">
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Error Message */}
            {error && (
              <div className="flex items-start gap-3 p-4 rounded-lg bg-red-50 border border-red-200">
                <AlertCircle className="h-5 w-5 shrink-0 mt-0.5 text-red-600" />
                <p className="text-sm text-red-600">{error}</p>
              </div>
            )}

            {/* Username/Email Input */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Username or Email
              </label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                <input
                  type="text"
                  value={identifier}
                  onChange={(e) => setIdentifier(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#bb0000]/20 focus:border-[#bb0000] transition-all"
                  placeholder="creator_name or email@example.com"
                  required
                  disabled={loading}
                  autoComplete="username"
                  minLength={3}
                  maxLength={100}
                />
              </div>
              <p className="mt-1 text-xs text-gray-500">
                Enter your Stream254 username or email address
              </p>
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
                  autoComplete="current-password"
                  minLength={6}
                />
                {/* Show/Hide Password Button */}
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 p-1 text-gray-400 hover:text-[#bb0000] transition-colors disabled:opacity-50"
                  disabled={loading}
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                  tabIndex={-1}
                >
                  {showPassword ? (
                    <EyeOff className="h-5 w-5" />
                  ) : (
                    <Eye className="h-5 w-5" />
                  )}
                </button>
              </div>
              <p className="mt-1 text-xs text-gray-500">
                Minimum 6 characters
              </p>
            </div>

            {/* Remember Me + Forgot Password */}
            <div className="flex items-center justify-between text-sm">
              <label className="flex items-center gap-2 text-gray-600">
                <input
                  type="checkbox"
                  className="rounded border-gray-300 text-[#bb0000] focus:ring-[#bb0000]"
                  disabled={loading}
                />
                <span>Remember me</span>
              </label>
              <Link 
                href="/forgot-password" 
                className="font-medium hover:underline text-[#bb0000]"
              >
                Forgot password?
              </Link>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={loading || !identifier || !password}
              className="w-full flex items-center justify-center gap-2 px-6 py-3 rounded-xl font-semibold text-white transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-md hover:shadow-lg hover:-translate-y-0.5"
              style={{ background: 'linear-gradient(135deg, #bb0000, #007847)' }}
            >
              {loading ? (
                <>
                  <Loader2 className="h-5 w-5 animate-spin" />
                  Signing in...
                </>
              ) : (
                <>
                  <LogIn className="h-5 w-5" />
                  Sign In
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
              <span className="px-2 bg-white text-gray-500">Or continue with</span>
            </div>
          </div>

          {/* Sign Up Link */}
          <p className="text-center text-sm text-gray-600">
            Don't have an account?{' '}
            <Link 
              href="/signup" 
              className="font-semibold hover:underline text-[#007847]"
            >
              Create account
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