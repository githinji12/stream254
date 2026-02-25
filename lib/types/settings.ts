// lib/types/settings.ts

export interface UserProfile {
  id: string
  username: string
  full_name: string | null
  email: string
  avatar_url: string | null
  bio: string | null
  phone_number: string | null
  twitter: string | null
  instagram: string | null
  website: string | null
  is_private: boolean
  is_verified: boolean
  created_at: string
  updated_at: string
  // ✅ M-Pesa fields
  mpesa_phone: string | null
  mpesa_verified: boolean
  // ✅ ADD: Privacy settings fields
  show_email: boolean
  show_phone: boolean
  allow_messages: boolean
  default_video_visibility: 'public' | 'private' | 'unlisted'
}

export interface NotificationPreferences {
  email_notifications: boolean
  push_notifications: boolean
  new_follower: boolean
  video_comment: boolean
  video_like: boolean
  tip_received: boolean
  marketing_emails: boolean
}

export interface PrivacySettings {
  is_private: boolean
  show_email: boolean
  show_phone: boolean
  allow_messages: boolean
  default_video_visibility: 'public' | 'private' | 'unlisted'
}

export interface PaymentSettings {
  mpesa_phone: string | null
  mpesa_verified: boolean
  payout_enabled: boolean
}

export type SettingsTab = 
  | 'profile' 
  | 'account' 
  | 'privacy' 
  | 'notifications' 
  | 'payments' 
  | 'danger'