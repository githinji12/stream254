// lib/types/mpesa.ts
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