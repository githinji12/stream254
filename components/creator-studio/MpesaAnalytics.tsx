// components/creator-studio/MpesaAnalytics.tsx
'use client'

import { useState, useEffect } from 'react'
import { Phone, TrendingUp, Users, Clock, AlertCircle, Loader2, X, DollarSign } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { toast } from 'react-hot-toast'

// ✅ Define MpesaTip type locally (or import from types file)
type MpesaTip = {
  id: string
  sender_id: string
  receiver_id: string
  amount: number
  phone_number: string
  reference: string
  status: 'pending' | 'completed' | 'failed'
  created_at: string
  sender?: {
    username: string
    avatar_url?: string | null
  } | null
}

// ✅ Define MpesaAnalytics type
type MpesaAnalytics = {
  totalTips: number
  totalAmount: number
  averageTip: number
  tipFrequency: 'daily' | 'weekly' | 'monthly'
  topTippers: Array<{ username: string; total: number; count: number }>
  tipTrends: Array<{ date: string; amount: number; count: number }>
  conversionRate: number
  peakTippingHours: Array<{ hour: number; count: number }>
}

interface MpesaAnalyticsProps {
  creatorId: string
}

export function MpesaAnalytics({ creatorId }: MpesaAnalyticsProps) {
  const [analytics, setAnalytics] = useState<MpesaAnalytics | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [newTipNotification, setNewTipNotification] = useState<MpesaTip | null>(null)
  const supabase = createClient()
  
  // Fetch analytics on mount
  useEffect(() => {
    const fetchAnalytics = async () => {
      try {
        const data = await getMpesaAnalytics(creatorId, supabase)
        setAnalytics(data)
      } catch (err) {
        setError('Failed to load M-Pesa analytics')
        console.error('Analytics fetch error:', err)
      } finally {
        setLoading(false)
      }
    }
    
    fetchAnalytics()
  }, [creatorId, supabase])
  
  // Subscribe to real-time tips
  useEffect(() => {
    const channel = supabase
      .channel(`tips-realtime-${creatorId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'tips',
          filter: `receiver_id=eq.${creatorId} AND status=eq.completed`,
        },
        (payload) => {
          const newTip = payload.new as MpesaTip
          setNewTipNotification(newTip)
          toast.success(`🎉 New tip: KSh ${newTip.amount.toLocaleString()}!`, {
            duration: 5000,
            icon: '💰'
          })
          
          // Refresh analytics after delay
          setTimeout(() => {
            getMpesaAnalytics(creatorId, supabase).then(setAnalytics)
          }, 2000)
        }
      )
      .subscribe()
    
    return () => {
      supabase.removeChannel(channel)
    }
  }, [creatorId, supabase])
  
  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <Loader2 className="h-6 w-6 animate-spin text-[#4CAF50]" />
        <span className="ml-2 text-gray-600">Loading M-Pesa analytics...</span>
      </div>
    )
  }
  
  if (error || !analytics) {
    return (
      <div className="text-center py-8">
        <AlertCircle className="h-10 w-10 text-red-500 mx-auto mb-2" />
        <p className="text-red-600">{error || 'No M-Pesa data available'}</p>
        <p className="text-sm text-gray-500 mt-1">
          Enable M-Pesa tipping in Creator Studio to start receiving support
        </p>
      </div>
    )
  }
  
  return (
    <div className="space-y-4">
      {/* New Tip Notification */}
      {newTipNotification && (
        <div className="p-4 bg-green-50 border border-green-200 rounded-xl flex items-center justify-between animate-fade-in">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-full bg-green-100">
              <Phone className="h-5 w-5 text-green-600" />
            </div>
            <div>
              <p className="font-medium text-green-900">
                New tip received! 🎉
              </p>
              <p className="text-sm text-green-700">
                KSh {newTipNotification.amount.toLocaleString()}
              </p>
            </div>
          </div>
          <button
            onClick={() => setNewTipNotification(null)}
            className="text-green-600 hover:text-green-800"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      )}
      
      {/* Summary Cards */}
      <div className="grid grid-cols-2 gap-4">
        <div className="bg-white rounded-xl border border-gray-200 p-4">
          <div className="flex items-center gap-2">
            <Phone className="h-4 w-4 text-[#4CAF50]" />
            <span className="text-sm text-gray-500">Total Tips</span>
          </div>
          <p className="text-2xl font-bold text-gray-900 mt-1">
            {analytics.totalTips.toLocaleString()}
          </p>
          <p className="text-xs text-gray-500 mt-1">
            {analytics.tipFrequency} frequency
          </p>
        </div>
        
        <div className="bg-white rounded-xl border border-gray-200 p-4">
          <div className="flex items-center gap-2">
            <DollarSign className="h-4 w-4 text-[#bb0000]" />
            <span className="text-sm text-gray-500">Total Amount</span>
          </div>
          <p className="text-2xl font-bold text-gray-900 mt-1">
            KSh {analytics.totalAmount.toLocaleString()}
          </p>
          <p className="text-xs text-gray-500 mt-1">
            Avg: KSh {analytics.averageTip.toLocaleString()}/tip
          </p>
        </div>
      </div>
      
      {/* Top Tippers */}
      {analytics.topTippers.length > 0 && (
        <div>
          <p className="text-sm font-medium text-gray-700 mb-2">Top Supporters</p>
          <div className="space-y-2">
            {analytics.topTippers.slice(0, 3).map((tipper, index) => (
              <div key={index} className="flex items-center justify-between p-2 rounded-lg bg-gray-50">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold text-gray-400 w-4">#{index + 1}</span>
                  <span className="text-sm text-gray-900">@{tipper.username}</span>
                </div>
                <span className="text-sm font-bold text-[#4CAF50]">
                  KSh {tipper.total.toLocaleString()}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
      
      {/* Peak Tipping Hours */}
      {analytics.peakTippingHours.length > 0 && (
        <div>
          <p className="text-sm font-medium text-gray-700 mb-2 flex items-center gap-1">
            <Clock className="h-3 w-3" />
            Peak Tipping Hours (EAT)
          </p>
          <div className="flex flex-wrap gap-2">
            {analytics.peakTippingHours.slice(0, 5).map((peak, index) => (
              <div 
                key={index}
                className="px-3 py-2 rounded-lg bg-gray-50 border border-gray-200 text-center"
              >
                <p className="font-bold text-gray-900 text-sm">
                  {peak.hour}:00
                </p>
                <p className="text-xs text-gray-500">
                  {peak.count} tip{peak.count > 1 ? 's' : ''}
                </p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

// ✅ Helper function to fetch M-Pesa analytics
async function getMpesaAnalytics(creatorId: string, supabase: any): Promise<MpesaAnalytics> {
  const startDate = new Date()
  startDate.setDate(startDate.getDate() - 30)
  
  // Fetch completed tips with sender info
  const {  tips, error } = await supabase
    .from('tips')
    .select(`
      *,
      sender:profiles!tips_sender_id_fkey (
        username,
        avatar_url
      )
    `)
    .eq('receiver_id', creatorId)
    .eq('status', 'completed')
    .gte('created_at', startDate.toISOString())
    .order('created_at', { ascending: true })
  
  if (error || !tips || tips.length === 0) {
    return {
      totalTips: 0,
      totalAmount: 0,
      averageTip: 0,
      tipFrequency: 'monthly',
      topTippers: [],
      tipTrends: [],
      conversionRate: 0,
      peakTippingHours: []
    }
  }
  
  // Calculate metrics
  const totalTips = tips.length
  const totalAmount = tips.reduce((sum: number, tip: MpesaTip) => sum + tip.amount, 0)
  const averageTip = totalAmount / totalTips
  
  // Top tippers
  const tipperMap = new Map<string, { username: string; total: number; count: number }>()
  tips.forEach((tip: MpesaTip) => {
    if (!tip.sender?.username) return
    const existing = tipperMap.get(tip.sender_id) || {
      username: tip.sender.username,
      total: 0,
      count: 0
    }
    existing.total += tip.amount
    existing.count += 1
    tipperMap.set(tip.sender_id, existing)
  })
  
  const topTippers = Array.from(tipperMap.values())
    .sort((a, b) => b.total - a.total)
    .slice(0, 5)
  
  // Daily trends
  const trendsMap = new Map<string, { amount: number; count: number }>()
  tips.forEach((tip: MpesaTip) => {
    const date = new Date(tip.created_at).toISOString().split('T')[0]
    const existing = trendsMap.get(date) || { amount: 0, count: 0 }
    existing.amount += tip.amount
    existing.count += 1
    trendsMap.set(date, existing)
  })
  
  const tipTrends = Array.from(trendsMap.entries())
    .map(([date, data]) => ({ date, ...data }))
    .sort((a, b) => a.date.localeCompare(b.date))
  
  // Peak hours (0-23)
  const hourMap = new Map<number, number>()
  tips.forEach((tip: MpesaTip) => {
    const hour = new Date(tip.created_at).getHours()
    hourMap.set(hour, (hourMap.get(hour) || 0) + 1)
  })
  
  const peakTippingHours = Array.from(hourMap.entries())
    .map(([hour, count]) => ({ hour, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 5)
  
  // Estimate conversion rate
  const estimatedViews = totalTips * 50
  const conversionRate = totalTips / estimatedViews * 100
  
  // Determine frequency
  const daysWithTips = new Set(tips.map((t: MpesaTip) => t.created_at.split('T')[0])).size
  const tipFrequency = daysWithTips > 15 ? 'daily' : daysWithTips > 3 ? 'weekly' : 'monthly'
  
  return {
    totalTips,
    totalAmount,
    averageTip: Math.round(averageTip),
    tipFrequency,
    topTippers,
    tipTrends,
    conversionRate: parseFloat(conversionRate.toFixed(2)),
    peakTippingHours
  }
}