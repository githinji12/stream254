// components/comments/CommentItem.tsx
'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useAuth } from '@/hooks/useAuth'
import { Profile, Comment } from '@/lib/types'
import { Trash2, Loader2 } from 'lucide-react'

interface CommentItemProps {
  comment: Comment & { profile: Profile }
  onDelete: () => void
}

export default function CommentItem({ comment, onDelete }: CommentItemProps) {
  const { user } = useAuth()
  const [deleting, setDeleting] = useState(false)
  const supabase = createClient()

  const isOwner = user?.id === comment.user_id

  const handleDelete = async () => {
    if (!confirm('Delete this comment?')) return

    setDeleting(true)

    try {
      const result = await supabase
        .from('comments')
        .delete()
        .eq('id', comment.id)

      if (result.error) throw result.error

      onDelete()
    } catch (err: any) {
      console.error('Delete error:', err)
      alert('Failed to delete comment')
    } finally {
      setDeleting(false)
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

  return (
    <div className="flex gap-3 py-4 border-b border-gray-100 last:border-0">
      {/* Avatar */}
      <div className="h-10 w-10 bg-blue-600 rounded-full flex items-center justify-center text-white font-bold shrink-0">
        {comment.profile?.username?.charAt(0).toUpperCase() || 'U'}
      </div>

      {/* Comment Content */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between mb-1">
          <div className="flex items-center gap-2">
            <span className="font-medium text-gray-900">
              @{comment.profile?.username || 'Unknown'}
            </span>
            <span className="text-xs text-gray-500">
              {formatDate(comment.created_at)}
            </span>
          </div>

          {/* Delete Button (only for owner) */}
          {isOwner && (
            <button
              onClick={handleDelete}
              disabled={deleting}
              className="p-1 text-gray-400 hover:text-red-600 transition-colors disabled:opacity-50"
              title="Delete comment"
            >
              {deleting ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Trash2 className="h-4 w-4" />
              )}
            </button>
          )}
        </div>

        <p className="text-gray-700 whitespace-pre-wrap wrap-break-word">
          {comment.content}
        </p>
      </div>
    </div>
  )
}