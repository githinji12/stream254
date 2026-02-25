// Database Types for TypeScript

export type Profile = {
  id: string
  username: string
  full_name: string | null
  avatar_url: string | null
  bio: string | null
  is_verified: boolean | null
  created_at: string
  updated_at: string
}

export type ExtendedProfile = Profile & {
  twitter?: string | null
  instagram?: string | null
  website?: string | null
  is_private?: boolean | null
  follower_count?: number
  following_count?: number
  show_email?: boolean
  show_phone?: boolean
  allow_messages?: boolean
  default_video_visibility?: 'public' | 'private' | 'unlisted'
  mpesa_phone?: string | null
  mpesa_verified?: boolean
}

export type Video = {
  id: string
  creator_id: string
  title: string
  description: string | null
  video_url: string
  thumbnail_url: string | null
  duration: number | null
  views: number
  created_at: string
  updated_at: string
}

export type Like = {
  id: string
  user_id: string
  video_id: string
  created_at: string
}

export type Comment = {
  id: string
  user_id: string
  video_id: string
  content: string
  created_at: string
  updated_at: string
}