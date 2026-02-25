// components/profile/ProfileHeader.tsx
'use client'

import { ExtendedProfile } from '@/lib/types'
import { Camera, BadgeCheck } from 'lucide-react'

interface ProfileHeaderProps {
  profile: ExtendedProfile
  isOwnProfile: boolean
  onAvatarClick?: () => void
}

export function ProfileHeader({ profile, isOwnProfile, onAvatarClick }: ProfileHeaderProps) {
  return (
    <div className="flex flex-col md:flex-row gap-6 items-start md:items-center">
      {/* Avatar */}
      <div className="relative group">
        <div className="h-24 w-24 sm:h-32 sm:w-32 rounded-2xl overflow-hidden border-4 border-white shadow-lg">
          {profile.avatar_url ? (
            <img src={profile.avatar_url} alt={profile.username} className="h-full w-full object-cover" />
          ) : (
            <div className="h-full w-full bg-to-br from-[#bb0000] to-[#007847] flex items-center justify-center text-white text-3xl font-bold">
              {profile.username?.charAt(0).toUpperCase() || 'U'}
            </div>
          )}
        </div>
        {profile.is_verified && (
          <div className="absolute -top-1 -right-1 h-7 w-7 rounded-full bg-[#1DA1F2] flex items-center justify-center border-2 border-white">
            <BadgeCheck className="h-4 w-4 text-white" />
          </div>
        )}
        {isOwnProfile && onAvatarClick && (
          <button onClick={onAvatarClick} className="absolute -bottom-2 -right-2 p-3 bg-white rounded-full shadow-lg">
            <Camera className="h-5 w-5 text-[#bb0000]" />
          </button>
        )}
      </div>
      
      {/* Profile Info */}
      <div className="flex-1">
        <div className="flex items-center gap-2">
          <h1 className="text-2xl sm:text-3xl font-bold">@{profile.username}</h1>
          {profile.is_verified && (
            <span className="px-2 py-1 rounded-full bg-[#1DA1F2]/10 text-[#1DA1F2] text-sm">Verified</span>
          )}
        </div>
        {profile.full_name && <p className="text-lg text-gray-600">{profile.full_name}</p>}
      </div>
    </div>
  )
}