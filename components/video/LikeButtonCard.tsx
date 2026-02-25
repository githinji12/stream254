// components/video/LikeButtonCard.tsx
'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Heart } from 'lucide-react'
import { useAuth } from '@/hooks/useAuth'

interface LikeButtonCardProps {
  videoId: string
  initialLikes: number
  initialIsLiked: boolean
  compact?: boolean
}

export default function LikeButtonCard({ 
  videoId, 
  initialLikes, 
  initialIsLiked,
  compact = true 
}: LikeButtonCardProps) {
  const { user } = useAuth()
  const [likes, setLikes] = useState(initialLikes)
  const [isLiked, setIsLiked] = useState(initialIsLiked)
  const [loading, setLoading] = useState(false)
  const supabase = createClient()

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

  const handleLike = async (e: React.MouseEvent) => {
    e.preventDefault()
    
    if (!user) {
      window.location.href = '/login'
      return
    }

    if (loading) return
    setLoading(true)

    try {
      if (isLiked) {
        const { error } = await supabase
          .from('likes')
          .delete()
          .eq('video_id', videoId)
          .eq('user_id', user.id)
        
        if (error) throw error
        setIsLiked(false)
        setLikes(prev => Math.max(0, prev - 1))
      } else {
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
      setIsLiked(!isLiked)
      setLikes(isLiked ? likes + 1 : likes - 1)
    } finally {
      setLoading(false)
    }
  }

// Update the button classes to use Kenyan colors
const buttonClasses = compact
  ? `flex items-center gap-1 px-2 py-1 rounded-full transition-all duration-300 ${
      isLiked 
        ? 'bg-kenya-red/10 text-kenya-red hover:bg-kenya-red/20' 
        : 'bg-gray-100 text-gray-600 hover:bg-kenya-green/10 hover:text-kenya-green'
    } ${loading ? 'opacity-50' : ''}`
  : `flex items-center gap-1.5 px-3 py-1.5 rounded-full transition-all duration-300 ${
      isLiked 
        ? 'bg-kenya-red/10 text-kenya-red hover:bg-kenya-red/20' 
        : 'bg-gray-100 text-gray-600 hover:bg-kenya-green/10 hover:text-kenya-green'
    } ${loading ? 'opacity-50 cursor-not-allowed' : ''}`

  return (
    <button
      onClick={handleLike}
      disabled={loading}
      className={buttonClasses}
      aria-label={isLiked ? 'Unlike video' : 'Like video'}
      title={isLiked ? 'Unlike' : 'Like'}
    >
      <Heart 
        className={`${compact ? 'h-3.5 w-3.5' : 'h-4 w-4'} transition-colors ${
          isLiked ? 'fill-red-500 stroke-red-500' : 'stroke-gray-600'
        }`} 
      />
      <span className={`${compact ? 'text-xs' : 'text-sm'} font-medium`}>
        {likes}
      </span>
    </button>
  )
}