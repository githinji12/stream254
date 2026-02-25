// components/settings/AccountSettings.tsx
'use client'

import { useState, useCallback, useEffect } from 'react'
import { Mail, Phone, Lock, Loader2, Check, AlertCircle, X, Eye, EyeOff } from 'lucide-react'
import { updateAccount, updatePassword } from '@/app/settings/actions'
import type { UserProfile } from '@/lib/types/settings'
import { toast } from 'react-hot-toast'

interface AccountSettingsProps {
  user: { 
    id: string
    email: string | null | undefined 
  }
  profile: UserProfile
}

const KENYA_GRADIENT = 'linear-gradient(135deg, #bb0000, #007847)'

export function AccountSettings({ user, profile }: AccountSettingsProps) {
  const [formData, setFormData] = useState({
    email: user.email || '',
    phone_number: profile.phone_number || '',
  })
  
  // Password state with show/hide visibility
  const [passwordData, setPasswordData] = useState({
    current: '',
    new: '',
    confirm: '',
  })
  
  // ✅ Show/hide password visibility states
  const [showCurrentPassword, setShowCurrentPassword] = useState(false)
  const [showNewPassword, setShowNewPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  
  const [isUpdating, setIsUpdating] = useState(false)
  const [isChangingPassword, setIsChangingPassword] = useState(false)
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null)

  const handleChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target
    setFormData(prev => ({ ...prev, [name]: value }))
  }, [])

  const handlePasswordChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target
    setPasswordData(prev => ({ ...prev, [name]: value }))
  }, [])

  // ✅ FIX: Format Kenyan phone number - supports 07xxxxxxxx and +254xxxxxx
  const formatPhone = useCallback((value: string) => {
    // Remove all non-digit characters except +
    const cleaned = value.replace(/[^\d+]/g, '')
    
    // Handle +254 format
    if (cleaned.startsWith('+254')) {
      const digits = cleaned.replace('+', '')
      if (digits.length <= 12) return digits
      return digits.slice(0, 12)
    }
    
    // Handle 254 format (without +)
    if (cleaned.startsWith('254') && cleaned.length <= 12) {
      return cleaned
    }
    
    // Handle 07xxxxxxxx format (Kenyan local format)
    if (cleaned.startsWith('0') && cleaned.length <= 10) {
      return '254' + cleaned.slice(1)
    }
    
    // Handle 7xxxxxxxx format (without leading 0)
    if (cleaned.length <= 9 && /^\d+$/.test(cleaned)) {
      return '254' + cleaned
    }
    
    // Default: return digits only, max 12 characters
    return cleaned.replace(/\D/g, '').slice(0, 12)
  }, [])

  const handlePhoneChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const formatted = formatPhone(e.target.value)
    setFormData(prev => ({ ...prev, phone_number: formatted }))
  }, [formatPhone])

  // ✅ Display phone number in user-friendly format
  const displayPhone = useCallback((phone: string) => {
    if (!phone) return ''
    if (phone.startsWith('254') && phone.length === 12) {
      return '0' + phone.slice(3) // Display as 07xxxxxxxx
    }
    return phone
  }, [])

  const handleAccountUpdate = useCallback(async (e: React.FormEvent) => {
    e.preventDefault()
    setMessage(null)
    setIsUpdating(true)

    // ✅ Validate Kenyan phone format (must be 2547XXXXXXXX internally)
    if (formData.phone_number && !/^254\d{9}$/.test(formData.phone_number)) {
      setMessage({ type: 'error', text: 'Please enter a valid Kenyan phone number (07XXXXXXXX or +254XXXXXXXX)' })
      setIsUpdating(false)
      return
    }

    const form = new FormData()
    if (formData.email) form.append('email', formData.email)
    if (formData.phone_number) form.append('phone_number', formData.phone_number)

    const result = await updateAccount(form)
    
    if (result.error) {
      setMessage({ type: 'error', text: result.error })
      toast.error(result.error)
    } else {
      setMessage({ type: 'success', text: 'Account updated successfully!' })
      toast.success('Account updated!')
    }
    setIsUpdating(false)
  }, [formData])

  const handlePasswordUpdate = useCallback(async (e: React.FormEvent) => {
    e.preventDefault()
    setMessage(null)

    // Validate password
    if (passwordData.current.length < 1) {
      setMessage({ type: 'error', text: 'Please enter your current password' })
      return
    }
    if (passwordData.new.length < 8) {
      setMessage({ type: 'error', text: 'New password must be at least 8 characters' })
      return
    }
    if (passwordData.new !== passwordData.confirm) {
      setMessage({ type: 'error', text: 'Passwords do not match' })
      return
    }
    if (passwordData.current === passwordData.new) {
      setMessage({ type: 'error', text: 'New password must be different from current password' })
      return
    }

    setIsChangingPassword(true)
    const result = await updatePassword(passwordData.current, passwordData.new)
    
    if (result.error) {
      setMessage({ type: 'error', text: result.error })
      toast.error(result.error)
    } else {
      setMessage({ type: 'success', text: 'Password changed successfully!' })
      toast.success('Password updated!')
      setPasswordData({ current: '', new: '', confirm: '' })
    }
    setIsChangingPassword(false)
  }, [passwordData])

  // Listen for global save event
  useEffect(() => {
    const handleSave = () => {
      const form = document.querySelector('#account-settings-form') as HTMLFormElement
      form?.requestSubmit()
    }
    window.addEventListener('settings:save', handleSave)
    return () => window.removeEventListener('settings:save', handleSave)
  }, [])

  return (
    <div className="space-y-8">
      <div>
        <h3 className="text-lg font-semibold text-gray-900 mb-1">Account Settings</h3>
        <p className="text-sm text-gray-500">Manage your email, phone, and password</p>
      </div>

      {/* Email & Phone Section */}
      <form id="account-settings-form" onSubmit={handleAccountUpdate} className="space-y-6">
        <div className="grid gap-5 sm:grid-cols-2">
          <div className="sm:col-span-2">
            <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
              <Mail className="h-4 w-4 inline mr-1" />
              Email Address
            </label>
            <input
              type="email"
              id="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              className="w-full px-4 py-2.5 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#bb0000]/20 focus:border-[#bb0000]"
              placeholder="you@example.com"
              required
            />
            <p className="text-xs text-gray-500 mt-1">
              Changing email may require verification
            </p>
          </div>

          <div className="sm:col-span-2">
            <label htmlFor="phone_number" className="block text-sm font-medium text-gray-700 mb-1">
              <Phone className="h-4 w-4 inline mr-1" />
              M-Pesa Phone Number
            </label>
            <div className="relative">
              {/* ✅ Display format hint */}
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm">
                {formData.phone_number.startsWith('254') ? '+254' : '0'}
              </span>
              <input
                type="tel"
                id="phone_number"
                name="phone_number"
                value={displayPhone(formData.phone_number)}
                onChange={handlePhoneChange}
                placeholder="0712 345 678"
                className="w-full pl-14 pr-4 py-2.5 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#4CAF50]/20 focus:border-[#4CAF50]"
                pattern="^(07\d{8}|2547\d{8}|+2547\d{8})$"
              />
            </div>
            <p className="text-xs text-gray-500 mt-1">
              ✅ Accepts: 0712345678 or +254712345678 • Used for M-Pesa tips and verification
            </p>
          </div>
        </div>

        {message && !message.text.includes('password') && (
          <div className={`flex items-center gap-2 p-4 rounded-xl ${
            message.type === 'success' ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'
          }`}>
            {message.type === 'success' ? <Check className="h-5 w-5 shrink-0" /> : <AlertCircle className="h-5 w-5 shrink-0" />}
            <span>{message.text}</span>
            <button type="button" onClick={() => setMessage(null)} className="ml-auto p-1 hover:bg-white/50 rounded">
              <X className="h-4 w-4" />
            </button>
          </div>
        )}

        <div className="flex justify-end pt-4 border-t border-gray-100">
          <button
            type="submit"
            disabled={isUpdating}
            className="flex items-center gap-2 px-6 py-2.5 rounded-xl font-medium text-white transition-all disabled:opacity-50"
            style={{ background: KENYA_GRADIENT }}
          >
            {isUpdating ? <Loader2 className="h-4 w-4 animate-spin" /> : <Check className="h-4 w-4" />}
            {isUpdating ? 'Saving...' : 'Save Changes'}
          </button>
        </div>
      </form>

      {/* Password Change Section */}
      <div className="pt-6 border-t border-gray-200">
        <h4 className="font-semibold text-gray-900 mb-4">
          <Lock className="h-5 w-5 inline mr-2" />
          Change Password
        </h4>
        <form onSubmit={handlePasswordUpdate} className="space-y-4">
          {/* Current Password with Show/Hide */}
          <div>
            <label htmlFor="current" className="block text-sm font-medium text-gray-700 mb-1">
              Current Password
            </label>
            <div className="relative">
              <input
                type={showCurrentPassword ? 'text' : 'password'}
                id="current"
                name="current"
                value={passwordData.current}
                onChange={handlePasswordChange}
                className="w-full px-4 py-2.5 pr-10 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#bb0000]/20 focus:border-[#bb0000]"
                placeholder="••••••••"
                required
              />
              <button
                type="button"
                onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
                aria-label={showCurrentPassword ? 'Hide current password' : 'Show current password'}
                tabIndex={-1}
              >
                {showCurrentPassword ? (
                  <EyeOff className="h-4 w-4" />
                ) : (
                  <Eye className="h-4 w-4" />
                )}
              </button>
            </div>
          </div>

          {/* New Password with Show/Hide */}
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label htmlFor="new" className="block text-sm font-medium text-gray-700 mb-1">
                New Password
              </label>
              <div className="relative">
                <input
                  type={showNewPassword ? 'text' : 'password'}
                  id="new"
                  name="new"
                  value={passwordData.new}
                  onChange={handlePasswordChange}
                  className="w-full px-4 py-2.5 pr-10 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#bb0000]/20 focus:border-[#bb0000]"
                  placeholder="••••••••"
                  minLength={8}
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowNewPassword(!showNewPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
                  aria-label={showNewPassword ? 'Hide new password' : 'Show new password'}
                  tabIndex={-1}
                >
                  {showNewPassword ? (
                    <EyeOff className="h-4 w-4" />
                  ) : (
                    <Eye className="h-4 w-4" />
                  )}
                </button>
              </div>
              <p className="text-xs text-gray-500 mt-1">Minimum 8 characters</p>
            </div>

            {/* Confirm Password with Show/Hide */}
            <div>
              <label htmlFor="confirm" className="block text-sm font-medium text-gray-700 mb-1">
                Confirm New Password
              </label>
              <div className="relative">
                <input
                  type={showConfirmPassword ? 'text' : 'password'}
                  id="confirm"
                  name="confirm"
                  value={passwordData.confirm}
                  onChange={handlePasswordChange}
                  className="w-full px-4 py-2.5 pr-10 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#bb0000]/20 focus:border-[#bb0000]"
                  placeholder="••••••••"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
                  aria-label={showConfirmPassword ? 'Hide confirm password' : 'Show confirm password'}
                  tabIndex={-1}
                >
                  {showConfirmPassword ? (
                    <EyeOff className="h-4 w-4" />
                  ) : (
                    <Eye className="h-4 w-4" />
                  )}
                </button>
              </div>
            </div>
          </div>

          {/* Password Strength Indicator */}
          {passwordData.new && (
            <div className="space-y-1">
              <div className="flex items-center gap-2 text-xs">
                <span className="text-gray-500">Password strength:</span>
                <div className="flex-1 h-1.5 bg-gray-200 rounded-full overflow-hidden">
                  <div 
                    className={`h-full transition-all ${
                      passwordData.new.length >= 12 ? 'bg-green-500 w-full' :
                      passwordData.new.length >= 8 ? 'bg-yellow-500 w-2/3' :
                      'bg-red-500 w-1/3'
                    }`}
                  />
                </div>
              </div>
              <ul className="text-xs text-gray-500 space-y-0.5">
                <li className={passwordData.new.length >= 8 ? 'text-green-600' : ''}>
                  {passwordData.new.length >= 8 ? '✓' : '○'} At least 8 characters
                </li>
                <li className={/[A-Z]/.test(passwordData.new) ? 'text-green-600' : ''}>
                  {/[A-Z]/.test(passwordData.new) ? '✓' : '○'} Contains uppercase letter
                </li>
                <li className={/[0-9]/.test(passwordData.new) ? 'text-green-600' : ''}>
                  {/[0-9]/.test(passwordData.new) ? '✓' : '○'} Contains number
                </li>
              </ul>
            </div>
          )}

          {message && message.text.includes('password') && (
            <div className={`flex items-center gap-2 p-4 rounded-xl ${
              message.type === 'success' ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'
            }`}>
              {message.type === 'success' ? <Check className="h-5 w-5 shrink-0" /> : <AlertCircle className="h-5 w-5 shrink-0" />}
              <span>{message.text}</span>
              <button type="button" onClick={() => setMessage(null)} className="ml-auto p-1 hover:bg-white/50 rounded">
                <X className="h-4 w-4" />
              </button>
            </div>
          )}

          <div className="flex justify-end pt-2">
            <button
              type="submit"
              disabled={isChangingPassword}
              className="flex items-center gap-2 px-6 py-2.5 rounded-xl font-medium text-white transition-all disabled:opacity-50"
              style={{ background: KENYA_GRADIENT }}
            >
              {isChangingPassword ? <Loader2 className="h-4 w-4 animate-spin" /> : <Lock className="h-4 w-4" />}
              {isChangingPassword ? 'Updating...' : 'Update Password'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}