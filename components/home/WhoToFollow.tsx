// components/home/WhoToFollow.tsx
'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useAuth } from '@/hooks/useAuth'
import { UserPlus, Check } from 'lucide-react'
import Link from 'next/link'

interface Profile {
  id: string
  username: string
  full_name: string
  avatar_url: string
  video_count: number
  follower_count: number
}

export default function WhoToFollow() {
  const { user } = useAuth()
  const [suggestions, setSuggestions] = useState<Profile[]>([])
  const [following, setFollowing] = useState<Record<string, boolean>>({})
  const [loading, setLoading] = useState(true)
  const supabase = createClient()

  useEffect(() => {
    async function fetchSuggestions() {
      // Get active creators (sorted by video count & followers)
      const result = await supabase
        .from('profiles')
        .select(`
          id,
          username,
          full_name,
          avatar_url,
          videos (count),
          follows (count)
        `)
        .order('created_at', { ascending: false })
        .limit(5)

      if (!result.error && result.data) {
        const profiles = result.data.map((p: any) => ({
          id: p.id,
          username: p.username,
          full_name: p.full_name,
          avatar_url: p.avatar_url,
          video_count: p.videos?.[0]?.count || 0,
          follower_count: p.follows?.[0]?.count || 0,
        }))
        setSuggestions(profiles)

        // Check which ones current user already follows
        if (user) {
          const followResult = await supabase
            .from('follows')
            .select('following_id')
            .eq('follower_id', user.id)
            .in('following_id', profiles.map(p => p.id))

          if (!followResult.error && followResult.data) {
            const followingMap: Record<string, boolean> = {}
            followResult.data.forEach((f: any) => {
              followingMap[f.following_id] = true
            })
            setFollowing(followingMap)
          }
        }
      }
      setLoading(false)
    }

    fetchSuggestions()
  }, [user, supabase])

  const handleFollow = async (profileId: string) => {
    if (!user) {
      window.location.href = '/login'
      return
    }

    try {
      if (following[profileId]) {
        await supabase
          .from('follows')
          .delete()
          .eq('follower_id', user.id)
          .eq('following_id', profileId)
        setFollowing(prev => ({ ...prev, [profileId]: false }))
      } else {
        await supabase
          .from('follows')
          .insert({
            follower_id: user.id,
            following_id: profileId
          })
        setFollowing(prev => ({ ...prev, [profileId]: true }))
      }
    } catch (err) {
      console.error('Follow error:', err)
    }
  }

  if (loading) return null

  return (
    <div className="card-kenya p-6 mb-8">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xl font-bold text-gray-900">
          <span style={{ color: '#bb0000' }}>Who to</span>
          <span style={{ color: '#000000' }}> Follow</span>
        </h2>
        <Link href="/creators" className="text-sm font-medium text-[#bb0000] hover:underline">
          View All
        </Link>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        {suggestions.map((profile) => (
          <div
            key={profile.id}
            className="flex flex-col items-center p-4 rounded-xl bg-gray-50 hover:bg-gray-100 transition-colors"
          >
            <Link href={`/profile/${profile.id}`} className="mb-3">
              <div className="h-16 w-16 bg-linear-to-br from-[#bb0000] to-[#007847] rounded-full flex items-center justify-center text-white text-xl font-bold">
                {profile.username?.charAt(0).toUpperCase() || 'U'}
              </div>
            </Link>
            
            <Link 
              href={`/profile/${profile.id}`}
              className="font-semibold text-gray-900 hover:text-[#bb0000] transition-colors text-center mb-1"
            >
              @{profile.username}
            </Link>
            
            <p className="text-xs text-gray-500 mb-3 text-center">
              {profile.video_count} videos • {profile.follower_count} followers
            </p>
            
            <button
              onClick={() => handleFollow(profile.id)}
              className={`w-full py-2 px-4 rounded-full text-sm font-medium transition-all duration-300 flex items-center justify-center gap-2 ${
                following[profile.id]
                  ? 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                  : 'bg-[#007847] text-white hover:bg-[#005c36]'
              }`}
            >
              {following[profile.id] ? (
                <>
                  <Check className="h-4 w-4" />
                  Following
                </>
              ) : (
                <>
                  <UserPlus className="h-4 w-4" />
                  Follow
                </>
              )}
            </button>
          </div>
        ))}
      </div>
    </div>
  )
}