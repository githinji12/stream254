// lib/types/creator.ts

export interface CreatorStats {
  totalViews: number
  totalLikes: number
  totalVideos: number
  totalFollowers: number
  totalEarnings: number
  pendingPayout: number
}

export interface CreatorVideo {
  id: string
  title: string
  description: string | null
  thumbnail_url: string | null
  video_url: string
  duration: number | null
  views: number
  likes: number
  comments: number
  visibility: 'public' | 'private' | 'unlisted'
  status: 'published' | 'draft' | 'processing'
  created_at: string
  updated_at: string
  earnings: number
}

export interface EarningsRecord {
  id: string
  amount: number
  currency: 'KES'
  source: 'tip' | 'subscription' | 'ad_revenue'
  status: 'pending' | 'paid' | 'failed'
  paid_at: string | null
  created_at: string
  sender?: {
    username: string
    avatar_url?: string
  }
}

export interface AudienceInsight {
  age_range: string
  percentage: number
  gender?: 'male' | 'female' | 'other'
  location?: string
}

export type CreatorTab = 
  | 'dashboard' 
  | 'videos' 
  | 'earnings' 
  | 'audience' 
  | 'settings'


  export type ABTest = {
  id: string
  name: string
  description: string | null
  hypothesis: string | null
  metric: string
  variant_a_name: string
  variant_b_name: string
  variant_a_config: Record<string, any>
  variant_b_config: Record<string, any>
  status: 'draft' | 'active' | 'paused' | 'completed'
  start_date: string | null
  end_date: string | null
  target_sample_size: number
  confidence_level: number
  created_by: string | null
  created_at: string
  updated_at: string
}

export type ABTestResult = {
  id: string
  ab_test_id: string
  user_id: string | null
  variant: 'a' | 'b'
  metric_value: number | null
  converted: boolean
  metadata: Record<string, any>
  created_at: string
}