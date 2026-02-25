// components/comments/CommentList.tsx
'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Comment, Profile } from '@/lib/types'
import CommentItem from './CommentItem'
import { MessageCircle } from 'lucide-react'

interface CommentListProps {
  videoId: string
}

export default function CommentList({ videoId }: CommentListProps) {
  const [comments, setComments] = useState<(Comment & { profile: Profile })[]>([])
  const [loading, setLoading] = useState(true)
  const supabase = createClient()

  // Fetch comments
  const fetchComments = async () => {
    const result = await supabase
      .from('comments')
      .select(`
        *,
        profile:profiles (
          id,
          username,
          avatar_url
        )
      `)
      .eq('video_id', videoId)
      .order('created_at', { ascending: false })

    if (!result.error && result.data) {
      setComments(result.data as any)
    }
    setLoading(false)
  }

  // Initial fetch
  useEffect(() => {
    fetchComments()
  }, [videoId])

  // Real-time subscription for new comments
  useEffect(() => {
    const channel = supabase
      .channel(`comments-${videoId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'comments',
          filter: `video_id=eq.${videoId}`,
        },
        () => {
          // Refresh comments when any change occurs
          fetchComments()
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [videoId])

  if (loading) {
    return (
      <div className="flex justify-center py-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  return (
    <div className="space-y-2">
      <div className="flex items-center gap-2 mb-4">
        <MessageCircle className="h-5 w-5 text-gray-600" />
        <h3 className="text-lg font-semibold text-gray-900">
          Comments ({comments.length})
        </h3>
      </div>

      {comments.length === 0 ? (
        <div className="text-center py-8 text-gray-500">
          <MessageCircle className="h-12 w-12 mx-auto mb-2 opacity-30" />
          <p>No comments yet</p>
          <p className="text-sm">Be the first to comment!</p>
        </div>
      ) : (
        <div className="divide-y divide-gray-100">
          {comments.map((comment) => (
            <CommentItem
              key={comment.id}
              comment={comment}
              onDelete={fetchComments}
            />
          ))}
        </div>
      )}
    </div>
  )
}