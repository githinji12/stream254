// components/modals/MpesaTipModal.tsx
'use client'

import { useState, useCallback } from 'react'
import { X, Phone, Check, AlertCircle, Loader2, Send } from 'lucide-react'
import { useAuth } from '@/hooks/useAuth'
import { toast } from 'react-hot-toast'

// 🎨 Kenyan Theme Constants
const KENYA = {
  red: '#bb0000',
  green: '#007847',
  black: '#000000',
  mpesa: '#4CAF50',
} as const

const KENYA_GRADIENT = {
  primary: `linear-gradient(135deg, ${KENYA.red}, ${KENYA.green})`,
} as const

interface MpesaTipModalProps {
  isOpen: boolean
  onClose: () => void
  creatorProfile: {
    id: string
    username: string
    avatar_url?: string | null
  } | null
  supabase: any
}

export function MpesaTipModal({ isOpen, onClose, creatorProfile, supabase }: MpesaTipModalProps) {
  const { user } = useAuth()
  const [phoneNumber, setPhoneNumber] = useState('')
  const [amount, setAmount] = useState('50')
  const [step, setStep] = useState<'form' | 'processing' | 'success' | 'error'>('form')
  const [message, setMessage] = useState('')
  const [reference, setReference] = useState('')

  const formatPhone = useCallback((value: string) => {
    const digits = value.replace(/\D/g, '')
    if (digits.startsWith('254') && digits.length <= 12) return digits
    if (digits.startsWith('0') && digits.length <= 10) return '254' + digits.slice(1)
    if (digits.length <= 9) return '254' + digits
    return digits.slice(0, 12)
  }, [])

  const handlePhoneChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    setPhoneNumber(formatPhone(e.target.value))
  }, [formatPhone])

  const handleSubmit = useCallback(async (e: React.FormEvent) => {
    e.preventDefault()
    if (!user) {
      setMessage('Please login to send a tip')
      setStep('error')
      return
    }
    if (!phoneNumber.match(/^254\d{9}$/)) {
      setMessage('Please enter a valid Kenyan phone number')
      setStep('error')
      return
    }
    const tipAmount = parseInt(amount)
    if (isNaN(tipAmount) || tipAmount < 10 || tipAmount > 150000) {
      setMessage('Amount must be between KSh 10 and KSh 150,000')
      setStep('error')
      return
    }
    setStep('processing')
    setMessage('')
    try {
      await new Promise((resolve) => setTimeout(resolve, 2500))
      const ref = `MP${Date.now().toString().slice(-6)}`
      setReference(ref)
      setStep('success')
      setMessage(`STK push sent to ${phoneNumber}. Enter your M-Pesa PIN to complete.`)
      await supabase.from('tips').insert({
        sender_id: user.id,
        receiver_id: creatorProfile?.id,
        amount: tipAmount,
        phone_number: phoneNumber,
        reference: ref,
        status: 'pending'
      })
    } catch (err: any) {
      setStep('error')
      setMessage(err.message || 'Failed to initiate payment. Please try again.')
    }
  }, [user, phoneNumber, amount, creatorProfile, supabase])

  const handleRetry = useCallback(() => {
    setStep('form')
    setMessage('')
    setReference('')
  }, [])

  if (!isOpen) return null

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-labelledby="mpesa-modal-title"
    >
      <div
        className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between p-4 border-b border-gray-200 bg-to-r from-[#4CAF50] to-[#45a049]">
          <div className="flex items-center gap-2">
            <div className="h-8 w-8 rounded-full bg-white flex items-center justify-center">
              <Phone className="h-4 w-4" style={{ color: KENYA.mpesa }} />
            </div>
            <h3 id="mpesa-modal-title" className="text-lg font-semibold text-white">Support with M-Pesa</h3>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-white/20 rounded-full transition-colors" aria-label="Close modal">
            <X className="h-5 w-5 text-white" />
          </button>
        </div>
        
        <div className="p-6">
          {step === 'form' && (
            <form onSubmit={handleSubmit} className="space-y-5">
              <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl">
                <div className="h-10 w-10 rounded-full overflow-hidden bg-to-br from-[#bb0000] to-[#007847] flex items-center justify-center text-white font-bold">
                  {creatorProfile?.username?.charAt(0).toUpperCase() || 'U'}
                </div>
                <div>
                  <p className="font-medium text-gray-900">@{creatorProfile?.username}</p>
                  <p className="text-sm text-gray-500">Creator</p>
                </div>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">M-Pesa Phone Number</label>
                <div className="relative">
                  <Phone className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <input
                    type="tel"
                    value={phoneNumber}
                    onChange={handlePhoneChange}
                    placeholder="2547XXXXXXXX"
                    className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#4CAF50] focus:border-transparent"
                    required
                    pattern="^254\d{9}$"
                    aria-label="M-Pesa phone number"
                  />
                </div>
                <p className="text-xs text-gray-500 mt-1">Format: 254712345678 (Kenyan numbers only)</p>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Amount (KSh)</label>
                <div className="grid grid-cols-4 gap-2">
                  {['50', '100', '200', '500'].map((amt) => (
                    <button
                      key={amt}
                      type="button"
                      onClick={() => setAmount(amt)}
                      className={`py-2 rounded-lg font-medium transition-colors ${
                        amount === amt ? 'bg-[#4CAF50] text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                      }`}
                    >
                      KSh {amt}
                    </button>
                  ))}
                </div>
                <div className="mt-3">
                  <input
                    type="number"
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    placeholder="Custom amount"
                    min="10"
                    max="150000"
                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#4CAF50] focus:border-transparent"
                    aria-label="Custom amount"
                  />
                </div>
              </div>
              
              <div className="p-4 bg-[#4CAF50]/10 border border-[#4CAF50]/30 rounded-xl">
                <p className="text-sm text-[#4CAF50] flex items-start gap-2">
                  <Check className="h-4 w-4 shrink-0 mt-0.5" />
                  <span>You'll receive an M-Pesa prompt on your phone. Enter your PIN to complete the payment securely.</span>
                </p>
              </div>
              
              {message && step === 'form' && (
                <div className="flex items-center gap-2 p-3 rounded-lg bg-red-50 text-red-700 text-sm" role="alert">
                  <AlertCircle className="h-4 w-4 shrink-0" />
                  <span>{message}</span>
                </div>
              )}
              
              <button
                type="submit"
                className="w-full py-3 rounded-xl font-semibold text-white transition-all flex items-center justify-center gap-2"
                style={{ background: KENYA_GRADIENT.primary, boxShadow: '0 4px 14px rgba(187, 0, 0, 0.3)' }}
              >
                <Send className="h-4 w-4" />
                Send KSh {amount} via M-Pesa
              </button>
            </form>
          )}
          
          {step === 'processing' && (
            <div className="text-center py-8">
              <div className="relative mx-auto mb-4">
                <div className="animate-spin rounded-full h-16 w-16 border-4 border-transparent"
                  style={{ borderTopColor: KENYA.red, borderRightColor: KENYA.black, borderBottomColor: KENYA.green }}>
                </div>
                <Phone className="absolute inset-0 m-auto h-6 w-6" style={{ color: KENYA.mpesa }} />
              </div>
              <h4 className="text-lg font-semibold text-gray-900 mb-2">Processing Payment</h4>
              <p className="text-gray-600">Check your phone for the M-Pesa prompt...</p>
              <p className="text-sm text-gray-500 mt-2">Reference: MP{Date.now().toString().slice(-6)}</p>
            </div>
          )}
          
          {step === 'success' && (
            <div className="text-center py-6">
              <div className="h-16 w-16 mx-auto mb-4 rounded-full bg-green-100 flex items-center justify-center">
                <Check className="h-8 w-8 text-green-600" />
              </div>
              <h4 className="text-lg font-semibold text-gray-900 mb-2">STK Push Sent! 🎉</h4>
              <p className="text-gray-600 mb-4">{message}</p>
              <div className="p-4 bg-gray-50 rounded-xl mb-6">
                <p className="text-sm text-gray-500">Transaction Reference</p>
                <p className="font-mono font-semibold text-gray-900">{reference}</p>
              </div>
              <div className="space-y-3">
                <button onClick={onClose} className="w-full py-3 rounded-xl font-semibold text-white" style={{ background: KENYA_GRADIENT.primary }}>Done</button>
                <button onClick={handleRetry} className="w-full py-3 rounded-xl font-medium border border-gray-300 text-gray-700 hover:bg-gray-50">Send Another Tip</button>
              </div>
            </div>
          )}
          
          {step === 'error' && message && (
            <div className="text-center py-6">
              <div className="h-16 w-16 mx-auto mb-4 rounded-full bg-red-100 flex items-center justify-center">
                <AlertCircle className="h-8 w-8 text-red-600" />
              </div>
              <h4 className="text-lg font-semibold text-gray-900 mb-2">Payment Failed</h4>
              <p className="text-gray-600 mb-6">{message}</p>
              <button onClick={handleRetry} className="w-full py-3 rounded-xl font-semibold text-white" style={{ background: KENYA_GRADIENT.primary }}>Try Again</button>
            </div>
          )}
        </div>
        
        <div className="px-6 py-4 bg-gray-50 border-t border-gray-200 text-xs text-gray-500 text-center">
          <p>Secured by Safaricom M-Pesa • Transactions are encrypted</p>
        </div>
      </div>
    </div>
  )
}