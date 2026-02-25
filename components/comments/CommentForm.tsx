// components/comments/CommentForm.tsx
'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useAuth } from '@/hooks/useAuth'
import { Send, Loader2 } from 'lucide-react'

interface CommentFormProps {
  videoId: string
  onCommentAdded: () => void
}

export default function CommentForm({ videoId, onCommentAdded }: CommentFormProps) {
  const { user } = useAuth()
  const [content, setContent] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const supabase = createClient()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!user) {
      window.location.href = '/login'
      return
    }

    if (!content.trim()) {
      setError('Comment cannot be empty')
      return
    }

    setLoading(true)
    setError('')

    try {
      const result = await supabase
        .from('comments')
        .insert({
          video_id: videoId,
          user_id: user.id,
          content: content.trim(),
        })

      if (result.error) throw result.error

      setContent('')
      onCommentAdded() // Notify parent to refresh comments
    } catch (err: any) {
      console.error('Comment error:', err)
      setError(err.message || 'Failed to post comment')
    } finally {
      setLoading(false)
    }
  }

  if (!user) {
    return (
      <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 text-center">
        <p className="text-gray-600 mb-2">Want to join the conversation?</p>
        <a
          href="/login"
          className="text-blue-600 hover:text-blue-700 font-medium"
        >
          Log in to comment
        </a>
      </div>
    )
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-3">
      {error && (
        <div className="text-sm text-red-600 bg-red-50 px-3 py-2 rounded">
          {error}
        </div>
      )}

      <div>
        <textarea
          value={content}
          onChange={(e) => setContent(e.target.value)}
          placeholder="Write a comment..."
          rows={3}
          className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
          disabled={loading}
        />
      </div>

      <div className="flex justify-end">
        <button
          type="submit"
          disabled={loading || !content.trim()}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          {loading ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
              Posting...
            </>
          ) : (
            <>
              <Send className="h-4 w-4" />
              Post Comment
            </>
          )}
        </button>
      </div>
    </form>
  )
}