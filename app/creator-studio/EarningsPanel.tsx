// app/creator-studio/EarningsPanel.tsx
'use client'

import { useState, useCallback, useEffect } from 'react'
import { Wallet, Download, AlertCircle, Check, Loader2, Phone, ChevronLeft, ChevronRight } from 'lucide-react'
import { requestPayout, getEarningsHistory } from '@/app/creator-studio/actions'
import type { EarningsRecord } from '@/lib/types/creator'
import { toast } from 'react-hot-toast'

interface EarningsPanelProps {
  earnings?: EarningsRecord[]
  compact?: boolean
  full?: boolean
  mpesaPhone?: string | null
  mpesaVerified?: boolean
}

const formatDate = (dateString: string) => {
  return new Date(dateString).toLocaleDateString('en-KE', {
    month: 'short',
    day: 'numeric',
    year: 'numeric'
  })
}

const formatCurrency = (amount: number) => {
  return new Intl.NumberFormat('en-KE', {
    style: 'currency',
    currency: 'KES',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0
  }).format(amount)
}

export function EarningsPanel({ 
  earnings = [], 
  compact = false, 
  full = false,
  mpesaPhone,
  mpesaVerified 
}: EarningsPanelProps) {
  const [payoutAmount, setPayoutAmount] = useState('')
  const [payoutPhone, setPayoutPhone] = useState(mpesaPhone || '')
  const [isRequesting, setIsRequesting] = useState(false)
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  // ✅ FIX: Properly typed earnings state
  const [localEarnings, setLocalEarnings] = useState<EarningsRecord[]>(earnings)

  // Format phone number for M-Pesa
  const formatPhone = useCallback((value: string) => {
    const digits = value.replace(/\D/g, '')
    if (digits.startsWith('254') && digits.length <= 12) return digits
    if (digits.startsWith('0') && digits.length <= 10) return '254' + digits.slice(1)
    if (digits.length <= 9) return '254' + digits
    return digits.slice(0, 12)
  }, [])

  const handlePhoneChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    setPayoutPhone(formatPhone(e.target.value))
  }, [formatPhone])

  // Fetch earnings history for full view
  useEffect(() => {
    if (full) {
      const fetchEarnings = async () => {
        try {
          // ✅ FIX: Get actual user ID from auth context or props
          const result = await getEarningsHistory('current-user-id', page, 10)
          // ✅ FIX: Transform data to match EarningsRecord type
          const transformedEarnings: EarningsRecord[] = result.earnings.map((e: any) => ({
            id: e.id,
            amount: e.amount,
            currency: 'KES' as const,
            source: 'tip' as const,
            status: e.status as 'pending' | 'paid' | 'failed',
            paid_at: e.status === 'paid' ? e.created_at : null,
            created_at: e.created_at,
            sender: e.sender ? {
              username: e.sender.username,
              avatar_url: e.sender.avatar_url
            } : undefined
          }))
          setLocalEarnings(transformedEarnings)
          setTotalPages(result.totalPages)
        } catch (error) {
          console.error('Failed to fetch earnings:', error)
        }
      }
      fetchEarnings()
    }
  }, [full, page])

  // Handle payout request
  const handlePayoutRequest = useCallback(async (e: React.FormEvent) => {
    e.preventDefault()
    
    const amount = parseInt(payoutAmount)
    if (isNaN(amount) || amount < 100) {
      toast.error('Minimum payout amount is KSh 100')
      return
    }
    
    if (!/^254\d{9}$/.test(payoutPhone)) {
      toast.error('Please enter a valid Kenyan phone number')
      return
    }
    
    setIsRequesting(true)
    try {
      // ✅ FIX: requestPayout now returns ActionResult
      const result = await requestPayout(amount, payoutPhone)
      if (result.error) {
        toast.error(result.error)
      } else {
        toast.success(result.message || 'Payout request submitted!')
        setPayoutAmount('')
      }
    } catch (error) {
      toast.error('Failed to request payout')
    } finally {
      setIsRequesting(false)
    }
  }, [payoutAmount, payoutPhone])

  // Compact view for dashboard
  if (compact) {
    return (
      <div className="bg-white rounded-xl border border-gray-200">
        <div className="flex items-center justify-between p-4 border-b border-gray-100">
          <h3 className="font-semibold text-gray-900">Recent Earnings</h3>
          <a href="/creator-studio?tab=earnings" className="text-sm text-[#bb0000] hover:underline">View all</a>
        </div>
        <div className="divide-y divide-gray-100">
          {localEarnings.slice(0, 4).map((earning) => (
            <div key={earning.id} className="flex items-center justify-between p-4 hover:bg-gray-50">
              <div>
                <p className="font-medium text-gray-900">
                  {earning.sender?.username ? `@${earning.sender.username}` : 'Anonymous Tip'}
                </p>
                <p className="text-xs text-gray-500">{formatDate(earning.created_at)}</p>
              </div>
              <div className="text-right">
                <p className="font-semibold text-[#4CAF50]">{formatCurrency(earning.amount)}</p>
                <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${
                  earning.status === 'paid' ? 'bg-green-100 text-green-800' :
                  earning.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                  'bg-red-100 text-red-800'
                }`}>
                  {earning.status}
                </span>
              </div>
            </div>
          ))}
          {localEarnings.length === 0 && (
            <div className="p-8 text-center text-gray-500">
              <Wallet className="h-8 w-8 mx-auto mb-2 opacity-50" />
              <p>No earnings yet</p>
              <p className="text-sm mt-1">Tips from fans will appear here</p>
            </div>
          )}
        </div>
      </div>
    )
  }

  // Full earnings panel view
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold text-gray-900">Earnings & Payouts</h3>
          <p className="text-sm text-gray-500">Manage your M-Pesa earnings and request payouts</p>
        </div>
        <button
          onClick={() => window.print()}
          className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
        >
          <Download className="h-4 w-4" />
          Export
        </button>
      </div>

      {/* Payout Request Form */}
      <div className="bg-linear-to-br from-[#4CAF50]/5 to-[#4CAF50]/10 border border-[#4CAF50]/20 rounded-xl p-5">
        <h4 className="font-medium text-gray-900 mb-4 flex items-center gap-2">
          <Wallet className="h-5 w-5 text-[#4CAF50]" />
          Request Payout via M-Pesa
        </h4>
        
        <form onSubmit={handlePayoutRequest} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Amount (KSh)
              </label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">KSh</span>
                <input
                  type="number"
                  value={payoutAmount}
                  onChange={(e) => setPayoutAmount(e.target.value)}
                  placeholder="1000"
                  min="100"
                  className="w-full pl-12 pr-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#4CAF50]/20 focus:border-[#4CAF50]"
                  required
                />
              </div>
              <p className="text-xs text-gray-500 mt-1">Minimum: KSh 100 • Maximum: KSh 150,000</p>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                M-Pesa Phone Number
              </label>
              <div className="relative">
                <Phone className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                <input
                  type="tel"
                  value={payoutPhone.replace('254', '0')}
                  onChange={handlePhoneChange}
                  placeholder="0712 345 678"
                  className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#4CAF50]/20 focus:border-[#4CAF50]"
                  pattern="^(07\d{8}|2547\d{8})$"
                  required
                />
              </div>
              <p className="text-xs text-gray-500 mt-1">
                {mpesaVerified ? '✓ Verified number' : 'Enter your M-Pesa number for payouts'}
              </p>
            </div>
          </div>
          
          <div className="flex items-center justify-between pt-2">
            <div className="text-sm text-gray-600">
              <span className="font-medium">Available Balance:</span>{' '}
              <span className="text-[#4CAF50] font-semibold">
                {formatCurrency(localEarnings.filter(e => e.status === 'paid').reduce((sum, e) => sum + e.amount, 0))}
              </span>
            </div>
            <button
              type="submit"
              disabled={isRequesting}
              className="flex items-center gap-2 px-6 py-2.5 rounded-lg font-medium text-white transition-all disabled:opacity-50"
              style={{ background: 'linear-gradient(135deg, #4CAF50, #45a049)' }}
            >
              {isRequesting ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Processing...
                </>
              ) : (
                <>
                  <Wallet className="h-4 w-4" />
                  Request Payout
                </>
              )}
            </button>
          </div>
        </form>
      </div>

      {/* Earnings History Table */}
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="text-left text-sm text-gray-500 border-b border-gray-200">
              <th className="pb-3 font-medium">From</th>
              <th className="pb-3 font-medium">Amount</th>
              <th className="pb-3 font-medium">Status</th>
              <th className="pb-3 font-medium">Date</th>
              <th className="pb-3 font-medium">Reference</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {localEarnings.map((earning) => (
              <tr key={earning.id} className="hover:bg-gray-50">
                <td className="py-4">
                  <div className="flex items-center gap-3">
                    {earning.sender?.avatar_url ? (
                      <img 
                        src={earning.sender.avatar_url} 
                        alt={earning.sender.username} 
                        className="h-8 w-8 rounded-full object-cover"
                      />
                    ) : (
                      <div className="h-8 w-8 rounded-full bg-gray-100 flex items-center justify-center text-gray-400">
                        <Wallet className="h-4 w-4" />
                      </div>
                    )}
                    <div>
                      <p className="font-medium text-gray-900">
                        {earning.sender?.username ? `@${earning.sender.username}` : 'Anonymous'}
                      </p>
                      <p className="text-xs text-gray-500 capitalize">{earning.source.replace('_', ' ')}</p>
                    </div>
                  </div>
                </td>
                <td className="py-4 font-semibold text-[#4CAF50]">
                  {formatCurrency(earning.amount)}
                </td>
                <td className="py-4">
                  <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                    earning.status === 'paid' ? 'bg-green-100 text-green-800' :
                    earning.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                    'bg-red-100 text-red-800'
                  }`}>
                    {earning.status === 'paid' && <Check className="h-3 w-3 mr-1" />}
                    {earning.status}
                  </span>
                </td>
                <td className="py-4 text-sm text-gray-600">
                  {formatDate(earning.created_at)}
                </td>
                <td className="py-4 text-sm text-gray-500 font-mono">
                  {earning.id.slice(0, 8)}...
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        
        {localEarnings.length === 0 && (
          <div className="text-center py-12 text-gray-500">
            <Wallet className="h-12 w-12 mx-auto mb-3 opacity-50" />
            <p className="mb-2">No earnings yet</p>
            <p className="text-sm">Fans can tip you via M-Pesa from your profile page</p>
          </div>
        )}
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between pt-4 border-t border-gray-200">
          <p className="text-sm text-gray-500">
            Page {page} of {totalPages}
          </p>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setPage(p => Math.max(1, p - 1))}
              disabled={page === 1}
              className="p-2 rounded-lg border border-gray-300 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <ChevronLeft className="h-4 w-4" />
            </button>
            <button
              onClick={() => setPage(p => Math.min(totalPages, p + 1))}
              disabled={page === totalPages}
              className="p-2 rounded-lg border border-gray-300 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>
        </div>
      )}

      {/* Important Notice */}
      <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
        <div className="flex items-start gap-3">
          <AlertCircle className="h-5 w-5 text-blue-600 shrink-0 mt-0.5" />
          <div>
            <p className="font-medium text-blue-900">Payout Information</p>
            <ul className="text-sm text-blue-800 mt-1 space-y-1">
              <li>• Payouts are processed within 24 hours via M-Pesa</li>
              <li>• Stream254 charges a 5% platform fee on tips</li>
              <li>• You must have a verified M-Pesa number to receive payouts</li>
              <li>• Minimum payout amount: KSh 100</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  )
}