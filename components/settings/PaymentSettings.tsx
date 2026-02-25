// components/settings/PaymentSettings.tsx
'use client'

import { useState, useCallback, useEffect } from 'react'
import { Phone, CreditCard, CheckCircle, AlertCircle, Loader2, Check, X } from 'lucide-react'
import { updateMpesaPhone, verifyMpesaPhone } from '@/app/settings/actions'
import type { UserProfile } from '@/lib/types/settings'
import { toast } from 'react-hot-toast'

interface PaymentSettingsProps {
  profile: UserProfile
}

const KENYA_GRADIENT = 'linear-gradient(135deg, #bb0000, #007847)'
const MPESA_GREEN = '#4CAF50'

export function PaymentSettings({ profile }: PaymentSettingsProps) {
  const [mpesaPhone, setMpesaPhone] = useState(profile.mpesa_phone || '')
  const [isVerifying, setIsVerifying] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [verificationCode, setVerificationCode] = useState('')
  const [showVerification, setShowVerification] = useState(false)
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null)

  const formatPhone = useCallback((value: string) => {
    const digits = value.replace(/\D/g, '')
    if (digits.startsWith('254') && digits.length <= 12) return digits
    if (digits.startsWith('0') && digits.length <= 10) return '254' + digits.slice(1)
    if (digits.length <= 9) return '254' + digits
    return digits.slice(0, 12)
  }, [])

  const handlePhoneChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    setMpesaPhone(formatPhone(e.target.value))
  }, [formatPhone])

  const handleSavePhone = useCallback(async () => {
    if (!/^254\d{9}$/.test(mpesaPhone)) {
      setMessage({ type: 'error', text: 'Please enter a valid Kenyan phone number' })
      return
    }

    setIsSaving(true)
    setMessage(null)
    
    const result = await updateMpesaPhone(mpesaPhone)
    
    if (result.error) {
      setMessage({ type: 'error', text: result.error })
      toast.error(result.error)
    } else {
      setMessage({ type: 'success', text: 'M-Pesa number saved!' })
      toast.success('M-Pesa number updated!')
      setShowVerification(true)
    }
    setIsSaving(false)
  }, [mpesaPhone])

  const handleVerifyPhone = useCallback(async () => {
    if (!verificationCode || verificationCode.length !== 6) {
      setMessage({ type: 'error', text: 'Please enter the 6-digit code' })
      return
    }

    setIsVerifying(true)
    const result = await verifyMpesaPhone(mpesaPhone, verificationCode)
    
    if (result.error) {
      setMessage({ type: 'error', text: result.error })
      toast.error('Verification failed')
    } else {
      setMessage({ type: 'success', text: 'M-Pesa number verified!' })
      toast.success('M-Pesa verified! You can now receive tips.')
      setShowVerification(false)
    }
    setIsVerifying(false)
  }, [mpesaPhone, verificationCode])

  useEffect(() => {
    const handleSave = () => handleSavePhone()
    window.addEventListener('settings:save', handleSave)
    return () => window.removeEventListener('settings:save', handleSave)
  }, [handleSavePhone])

  return (
    <div className="space-y-8">
      <div>
        <h3 className="text-lg font-semibold text-gray-900 mb-1">Payment Settings</h3>
        <p className="text-sm text-gray-500">Configure M-Pesa to receive tips from your fans</p>
      </div>

      {/* M-Pesa Setup */}
      <div className="space-y-6">
        <div className="p-4 bg-[#4CAF50]/5 border border-[#4CAF50]/20 rounded-xl">
          <div className="flex items-start gap-3">
            <Phone className="h-6 w-6 text-[#4CAF50] shrink-0" />
            <div>
              <h4 className="font-medium text-gray-900">M-Pesa Integration</h4>
              <p className="text-sm text-gray-600 mt-1">
                Connect your M-Pesa number to receive tips directly. Fans can support you with 
                secure STK push payments via Safaricom.
              </p>
            </div>
          </div>
        </div>

        <div>
          <label htmlFor="mpesa_phone" className="block text-sm font-medium text-gray-700 mb-2">
            M-Pesa Phone Number
          </label>
          <div className="flex gap-3">
            <div className="relative flex-1">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm">+254</span>
              <input
                type="tel"
                id="mpesa_phone"
                value={mpesaPhone.replace('254', '')}
                onChange={handlePhoneChange}
                placeholder="712 345 678"
                className="w-full pl-14 pr-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#4CAF50]/20 focus:border-[#4CAF50]"
                pattern="^254\d{9}$"
              />
            </div>
            <button
              onClick={handleSavePhone}
              disabled={isSaving || !/^254\d{9}$/.test(mpesaPhone)}
              className="px-6 py-3 rounded-xl font-medium text-white transition-all disabled:opacity-50 flex items-center gap-2"
              style={{ background: MPESA_GREEN }}
            >
              {isSaving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Check className="h-4 w-4" />}
              {isSaving ? 'Saving...' : 'Save'}
            </button>
          </div>
          <p className="text-xs text-gray-500 mt-2">
            Format: 254712345678 • Used only for receiving tips • Secured by Safaricom
          </p>
        </div>

        {/* Verification Flow */}
        {showVerification && mpesaPhone && (
          <div className="p-4 bg-blue-50 border border-blue-200 rounded-xl space-y-4">
            <div className="flex items-center gap-2">
              <AlertCircle className="h-5 w-5 text-blue-600" />
              <p className="font-medium text-blue-900">Verify Your Number</p>
            </div>
            <p className="text-sm text-blue-700">
              We've sent a 6-digit code to <strong>+{mpesaPhone}</strong>. 
              Enter it below to complete verification.
            </p>
            <div className="flex gap-3">
              <input
                type="text"
                value={verificationCode}
                onChange={(e) => setVerificationCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                placeholder="000000"
                maxLength={6}
                className="flex-1 px-4 py-2.5 border border-gray-300 rounded-xl text-center text-lg tracking-widest focus:outline-none focus:ring-2 focus:ring-[#4CAF50]/20 focus:border-[#4CAF50]"
              />
              <button
                onClick={handleVerifyPhone}
                disabled={isVerifying || verificationCode.length !== 6}
                className="px-6 py-2.5 rounded-xl font-medium text-white transition-all disabled:opacity-50 flex items-center gap-2"
                style={{ background: MPESA_GREEN }}
              >
                {isVerifying ? <Loader2 className="h-4 w-4 animate-spin" /> : <CheckCircle className="h-4 w-4" />}
                {isVerifying ? 'Verifying...' : 'Verify'}
              </button>
            </div>
            <button
              type="button"
              onClick={() => setShowVerification(false)}
              className="text-sm text-blue-600 hover:underline"
            >
              Change number instead
            </button>
          </div>
        )}

        {/* Verification Status */}
        {profile.mpesa_phone && (
          <div className={`p-4 rounded-xl border ${
            profile.mpesa_verified 
              ? 'bg-green-50 border-green-200' 
              : 'bg-yellow-50 border-yellow-200'
          }`}>
            <div className="flex items-center gap-3">
              {profile.mpesa_verified ? (
                <CheckCircle className="h-5 w-5 text-green-600" />
              ) : (
                <AlertCircle className="h-5 w-5 text-yellow-600" />
              )}
              <div>
                <p className="font-medium text-gray-900">
                  {profile.mpesa_verified ? 'M-Pesa Verified ✓' : 'Pending Verification'}
                </p>
                <p className="text-sm text-gray-600">
                  {profile.mpesa_verified 
                    ? 'You can now receive tips from fans' 
                    : 'Complete verification to start receiving tips'}
                </p>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Payout Info */}
      <div className="pt-6 border-t border-gray-200">
        <h4 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
          <CreditCard className="h-5 w-5 text-[#bb0000]" />
          Payout Information
        </h4>
        <div className="space-y-3 text-sm text-gray-600">
          <p>• Tips are processed instantly via M-Pesa STK push</p>
          <p>• Stream254 charges a 5% platform fee on tips</p>
          <p>• Minimum tip amount: KSh 10 • Maximum: KSh 150,000</p>
          <p>• View your tip history in Creator Studio → Earnings</p>
        </div>
      </div>

      {message && (
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
    </div>
  )
}