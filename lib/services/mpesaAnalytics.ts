// lib/services/mpesaAnalytics.ts
import { createClient } from '@/lib/supabase/client'

// ✅ Define MpesaTip type
export type MpesaTip = {
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
export type MpesaAnalytics = {
  totalTips: number
  totalAmount: number
  averageTip: number
  tipFrequency: 'daily' | 'weekly' | 'monthly'
  topTippers: Array<{ username: string; total: number; count: number }>
  tipTrends: Array<{ date: string; amount: number; count: number }>
  conversionRate: number
  peakTippingHours: Array<{ hour: number; count: number }>
}

/**
 * Fetch M-Pesa analytics for a creator
 */
export async function getMpesaAnalytics(
  creatorId: string,
  days: number = 30
): Promise<MpesaAnalytics> {
  const supabase = createClient()
  const startDate = new Date()
  startDate.setDate(startDate.getDate() - days)
  
  // ✅ FIX: Destructure 'data' not 'tips' from Supabase response
  const {  data, error } = await supabase
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
  
  // ✅ FIX: Check 'data' not 'tips'
  if (error || !data || data.length === 0) {
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
  
  // ✅ FIX: Add explicit types to all parameters
  const totalTips: number = data.length
  const totalAmount: number = data.reduce((sum: number, tip: MpesaTip) => sum + tip.amount, 0)
  const averageTip: number = totalAmount / totalTips
  
  // Top tippers
  const tipperMap = new Map<string, { username: string; total: number; count: number }>()
  data.forEach((tip: MpesaTip) => {
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
  
  const topTippers: Array<{ username: string; total: number; count: number }> = Array.from(tipperMap.values())
    .sort((a, b) => b.total - a.total)
    .slice(0, 5)
  
  // Daily trends
  const trendsMap = new Map<string, { amount: number; count: number }>()
  data.forEach((tip: MpesaTip) => {
    const date: string = new Date(tip.created_at).toISOString().split('T')[0]
    const existing = trendsMap.get(date) || { amount: 0, count: 0 }
    existing.amount += tip.amount
    existing.count += 1
    trendsMap.set(date, existing)
  })
  
  const tipTrends: Array<{ date: string; amount: number; count: number }> = Array.from(trendsMap.entries())
    .map(([date, data]) => ({ date, ...data }))
    .sort((a, b) => a.date.localeCompare(b.date))
  
  // Peak hours (0-23)
  const hourMap = new Map<number, number>()
  data.forEach((tip: MpesaTip) => {
    const hour: number = new Date(tip.created_at).getHours()
    hourMap.set(hour, (hourMap.get(hour) || 0) + 1)
  })
  
  const peakTippingHours: Array<{ hour: number; count: number }> = Array.from(hourMap.entries())
    .map(([hour, count]) => ({ hour, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 5)
  
  // Estimate conversion rate (simplified)
  const estimatedViews: number = totalTips * 50
  const conversionRate: number = totalTips / estimatedViews * 100
  
  // Determine frequency
  const daysWithTips: number = new Set(data.map((t: MpesaTip) => t.created_at.split('T')[0])).size
  const tipFrequency: 'daily' | 'weekly' | 'monthly' = 
    daysWithTips > 15 ? 'daily' : 
    daysWithTips > 3 ? 'weekly' : 
    'monthly'
  
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

/**
 * Subscribe to real-time new tips
 */
export function subscribeToNewTips(
  creatorId: string,
  onNewTip: (tip: MpesaTip) => void
) {
  const supabase = createClient()
  
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
        // ✅ FIX: Cast payload.new to MpesaTip
        onNewTip(payload.new as MpesaTip)
      }
    )
    .subscribe()
  
  return () => {
    supabase.removeChannel(channel)
  }
}