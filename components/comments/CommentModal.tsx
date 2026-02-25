// components/comments/CommentModal.tsx
'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useAuth } from '@/hooks/useAuth'
import { Video, Profile, Comment } from '@/lib/types'
import { X, Send, Trash2, Loader2, MessageCircle } from 'lucide-react'

interface CommentModalProps {
  video: Video & { profile: Profile }
  isOpen: boolean
  onClose: () => void
}

export default function CommentModal({ video, isOpen, onClose }: CommentModalProps) {
  const { user } = useAuth()
  const [comments, setComments] = useState<(Comment & { profile: Profile })[]>([])
  const [newComment, setNewComment] = useState('')
  const [loading, setLoading] = useState(true)
  const [posting, setPosting] = useState(false)
  const [deletingId, setDeletingId] = useState<string | null>(null)
  const supabase = createClient()

  // Check if current user is the video owner
  const isVideoOwner = user?.id === video.creator_id

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
      .eq('video_id', video.id)
      .order('created_at', { ascending: false })

    if (!result.error && result.data) {
      setComments(result.data as any)
    }
    setLoading(false)
  }

  // Fetch on open
  useEffect(() => {
    if (isOpen) {
      fetchComments()
      
      // Real-time subscription
      const channel = supabase
        .channel(`comments-modal-${video.id}`)
        .on(
          'postgres_changes',
          {
            event: '*',
            schema: 'public',
            table: 'comments',
            filter: `video_id=eq.${video.id}`,
          },
          () => fetchComments()
        )
        .subscribe()

      return () => {
        supabase.removeChannel(channel)
      }
    }
  }, [isOpen, video.id])

  // Handle new comment
  const handlePostComment = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!user || !newComment.trim()) return

    setPosting(true)
    try {
      const result = await supabase
        .from('comments')
        .insert({
          video_id: video.id,
          user_id: user.id,
          content: newComment.trim(),
        })

      if (!result.error) {
        setNewComment('')
        fetchComments() // Refresh list
      }
    } catch (err: any) {
      console.error('Comment error:', err)
      alert('Failed to post comment')
    } finally {
      setPosting(false)
    }
  }

  // Handle delete comment (owner can delete ANY, user can delete own)
  const handleDeleteComment = async (commentId: string, commentUserId: string) => {
    // Check permission: video owner OR comment owner
    if (!isVideoOwner && user?.id !== commentUserId) {
      alert('You can only delete your own comments')
      return
    }

    if (!confirm('Delete this comment?')) return

    setDeletingId(commentId)
    try {
      const result = await supabase
        .from('comments')
        .delete()
        .eq('id', commentId)

      if (!result.error) {
        fetchComments()
      }
    } catch (err: any) {
      console.error('Delete error:', err)
      alert('Failed to delete comment')
    } finally {
      setDeletingId(null)
    }
  }

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleDateString('en-KE', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  // Close on Escape key
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    if (isOpen) {
      document.addEventListener('keydown', handleEscape)
      document.body.style.overflow = 'hidden' // Prevent background scroll
    }
    return () => {
      document.removeEventListener('keydown', handleEscape)
      document.body.style.overflow = 'unset'
    }
  }, [isOpen, onClose])

  // Don't render if not open
  if (!isOpen) return null

  return (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50"
      onClick={onClose} // Close on backdrop click
    >
      <div 
        className="bg-white rounded-xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-hidden flex flex-col"
        onClick={(e) => e.stopPropagation()} // Prevent close on modal click
      >
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-200">
          <div className="flex items-center gap-3 min-w-0">
            <div className="h-10 w-10 bg-blue-600 rounded-full flex items-center justify-center text-white font-bold shrink-0">
              {video.profile?.username?.charAt(0).toUpperCase()}
            </div>
            <div className="min-w-0">
              <h3 className="font-semibold text-gray-900 truncate">{video.title}</h3>
              <p className="text-sm text-gray-500">@{video.profile?.username}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-full transition-colors"
            aria-label="Close modal"
          >
            <X className="h-5 w-5 text-gray-500" />
          </button>
        </div>

        {/* Comments List */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {loading ? (
            <div className="flex justify-center py-8">
              <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
            </div>
          ) : comments.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <MessageCircle className="h-12 w-12 mx-auto mb-2 opacity-30" />
              <p>No comments yet</p>
              <p className="text-sm">Be the first to comment!</p>
            </div>
          ) : (
            comments.map((comment) => {
              const canDelete = isVideoOwner || user?.id === comment.user_id
              
              return (
                <div key={comment.id} className="flex gap-3 py-3 border-b border-gray-100 last:border-0">
                  {/* Avatar */}
                  <div className="h-8 w-8 bg-blue-600 rounded-full flex items-center justify-center text-white text-xs font-bold shrink-0">
                    {comment.profile?.username?.charAt(0).toUpperCase() || 'U'}
                  </div>

                  {/* Content */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between mb-1">
                      <div className="flex items-center gap-2">
                        <span className="font-medium text-gray-900 text-sm">
                          @{comment.profile?.username || 'Unknown'}
                        </span>
                        <span className="text-xs text-gray-400">
                          {formatDate(comment.created_at)}
                        </span>
                      </div>

                      {/* Delete Button */}
                      {canDelete && (
                        <button
                          onClick={() => handleDeleteComment(comment.id, comment.user_id)}
                          disabled={deletingId === comment.id}
                          className="p-1 text-gray-400 hover:text-red-600 transition-colors disabled:opacity-50"
                          title={isVideoOwner ? 'Delete comment (as owner)' : 'Delete your comment'}
                        >
                          {deletingId === comment.id ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                          ) : (
                            <Trash2 className="h-4 w-4" />
                          )}
                        </button>
                      )}
                    </div>

                    <p className="text-gray-700 text-sm whitespace-pre-wrap wrap-break-word">
                      {comment.content}
                    </p>
                  </div>
                </div>
              )
            })
          )}
        </div>

        {/* Comment Form */}
        <div className="p-4 border-t border-gray-200 bg-gray-50">
          {user ? (
            <form onSubmit={handlePostComment} className="flex gap-2">
              <input
                type="text"
                value={newComment}
                onChange={(e) => setNewComment(e.target.value)}
                placeholder="Write a comment..."
                className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                disabled={posting}
              />
              <button
                type="submit"
                disabled={posting || !newComment.trim()}
                className="px-4 py-2 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-1 text-sm"
              >
                {posting ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Send className="h-4 w-4" />
                )}
                Post
              </button>
            </form>
          ) : (
            <p className="text-sm text-gray-600 text-center">
              <a href="/login" className="text-blue-600 hover:underline font-medium">
                Log in
              </a> to join the conversation
            </p>
          )}
        </div>
      </div>
    </div>
  )
}