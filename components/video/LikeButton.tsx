// components/video/LikeButton.tsx
'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Heart } from 'lucide-react'
import { useAuth } from '@/hooks/useAuth'

interface LikeButtonProps {
  videoId: string
  initialLikes: number
  initialIsLiked: boolean
}

export default function LikeButton({ videoId, initialLikes, initialIsLiked }: LikeButtonProps) {
  const { user } = useAuth()
  const [likes, setLikes] = useState(initialLikes)
  const [isLiked, setIsLiked] = useState(initialIsLiked)
  const [loading, setLoading] = useState(false)
  const supabase = createClient()

  // Real-time subscription for likes count
  useEffect(() => {
    const channel = supabase
      .channel(`likes-${videoId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'likes',
          filter: `video_id=eq.${videoId}`,
        },
        async () => {
          // Refresh likes count when any change occurs
          const { count, error } = await supabase
            .from('likes')
            .select('*', { count: 'exact', head: true })
            .eq('video_id', videoId)
          
          if (!error && count !== null) {
            setLikes(count)
          }
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [videoId, supabase])

  // Check if current user has liked this video
  useEffect(() => {
    if (!user) return
    
    const checkLike = async () => {
      const { data, error } = await supabase
        .from('likes')
        .select('id')
        .eq('video_id', videoId)
        .eq('user_id', user.id)
        .maybeSingle()
      
      if (!error) {
        setIsLiked(!!data)
      }
    }
    
    checkLike()
  }, [user, videoId, supabase])

  const handleLike = async () => {
    if (!user) {
      // Redirect to login if not authenticated
      window.location.href = '/login'
      return
    }

    if (loading) return
    setLoading(true)

    try {
      if (isLiked) {
        // Unlike: delete the like record
        const { error } = await supabase
          .from('likes')
          .delete()
          .eq('video_id', videoId)
          .eq('user_id', user.id)
        
        if (error) throw error
        setIsLiked(false)
        setLikes(prev => Math.max(0, prev - 1))
      } else {
        // Like: insert new record
        const { error } = await supabase
          .from('likes')
          .insert({
            video_id: videoId,
            user_id: user.id,
          })
        
        if (error) throw error
        setIsLiked(true)
        setLikes(prev => prev + 1)
      }
    } catch (err: any) {
      console.error('Like error:', err)
      // Revert optimistic update on error
      if (isLiked) {
        setLikes(prev => prev + 1)
      } else {
        setLikes(prev => Math.max(0, prev - 1))
      }
    } finally {
      setLoading(false)
    }
  }

  return (
    <button
      onClick={handleLike}
      disabled={loading}
      className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full transition-colors ${
        isLiked 
          ? 'bg-red-50 text-red-600 hover:bg-red-100' 
          : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
      } ${loading ? 'opacity-50 cursor-not-allowed' : ''}`}
      aria-label={isLiked ? 'Unlike video' : 'Like video'}
    >
      <Heart 
        className={`h-4 w-4 transition-colors ${
          isLiked ? 'fill-red-500 stroke-red-500' : 'stroke-gray-600'
        }`} 
      />
      <span className="text-sm font-medium">{likes}</span>
    </button>
  )
}