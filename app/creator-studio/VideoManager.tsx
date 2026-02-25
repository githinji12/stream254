// components/creator-studio/VideoManager.tsx
'use client'

import { useState, useCallback } from 'react'
import Link from 'next/link'
import { Edit, Trash2, Eye, EyeOff, MoreVertical, Upload, Loader2 } from 'lucide-react'
import { updateVideo, deleteVideo } from '@/app/creator-studio/actions'
import type { CreatorVideo } from '@/lib/types/creator'
import { toast } from 'react-hot-toast'

interface VideoManagerProps {
  videos?: CreatorVideo[]
  compact?: boolean
  full?: boolean
}

const formatDate = (dateString: string) => {
  return new Date(dateString).toLocaleDateString('en-KE', {
    month: 'short',
    day: 'numeric',
    year: 'numeric'
  })
}

const formatNumber = (num: number) => {
  if (num >= 1000000) return (num / 1000000).toFixed(1) + 'M'
  if (num >= 1000) return (num / 1000).toFixed(1) + 'K'
  return num.toString()
}

export function VideoManager({ videos = [], compact = false, full = false }: VideoManagerProps) {
  const [editingId, setEditingId] = useState<string | null>(null)
  const [deletingId, setDeletingId] = useState<string | null>(null)
  const [editForm, setEditForm] = useState<{ title: string; visibility: CreatorVideo['visibility'] }>({ title: '', visibility: 'public' })

  const handleEdit = useCallback(async (videoId: string) => {
    const result = await updateVideo(videoId, editForm)
    if (result.error) {
      toast.error(result.error)
    } else {
      toast.success('Video updated!')
      setEditingId(null)
    }
  }, [editForm])

  const handleDelete = useCallback(async (videoId: string) => {
    if (!confirm('Are you sure you want to delete this video? This cannot be undone.')) return
    
    setDeletingId(videoId)
    const result = await deleteVideo(videoId)
    if (result.error) {
      toast.error(result.error)
    } else {
      toast.success('Video deleted')
    }
    setDeletingId(null)
  }, [])

  if (compact) {
    return (
      <div className="bg-white rounded-xl border border-gray-200">
        <div className="flex items-center justify-between p-4 border-b border-gray-100">
          <h3 className="font-semibold text-gray-900">Recent Videos</h3>
          <Link href="/creator-studio?tab=videos" className="text-sm text-[#bb0000] hover:underline">View all</Link>
        </div>
        <div className="divide-y divide-gray-100">
          {videos.slice(0, 4).map((video) => (
            <div key={video.id} className="flex items-center gap-4 p-4 hover:bg-gray-50">
              <div className="w-20 h-12 rounded-lg bg-gray-100 overflow-hidden shrink-0">
                {video.thumbnail_url ? (
                  <img src={video.thumbnail_url} alt={video.title} className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-gray-400">
                    <svg className="h-6 w-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polygon points="5 3 19 12 5 21 5 3" /></svg>
                  </div>
                )}
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-medium text-gray-900 truncate">{video.title}</p>
                <p className="text-xs text-gray-500">{formatNumber(video.views)} views • {formatDate(video.created_at)}</p>
              </div>
              <span className={`px-2 py-0.5 rounded text-xs font-medium ${
                video.visibility === 'public' ? 'bg-green-100 text-green-700' :
                video.visibility === 'private' ? 'bg-red-100 text-red-700' :
                'bg-gray-100 text-gray-700'
              }`}>
                {video.visibility}
              </span>
            </div>
          ))}
          {videos.length === 0 && (
            <div className="p-8 text-center text-gray-500">
              <p>No videos yet</p>
              <Link href="/upload" className="text-[#bb0000] hover:underline mt-2 inline-block">Upload your first video</Link>
            </div>
          )}
        </div>
      </div>
    )
  }

  // Full video manager view
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold text-gray-900">Your Videos</h3>
        <Link
          href="/upload"
          className="flex items-center gap-2 px-4 py-2 rounded-lg font-medium text-white"
          style={{ background: 'linear-gradient(135deg, #bb0000, #007847)' }}
        >
          <Upload className="h-4 w-4" />
          Upload New
        </Link>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="text-left text-sm text-gray-500 border-b border-gray-200">
              <th className="pb-3 font-medium">Video</th>
              <th className="pb-3 font-medium">Views</th>
              <th className="pb-3 font-medium">Likes</th>
              <th className="pb-3 font-medium">Visibility</th>
              <th className="pb-3 font-medium">Date</th>
              <th className="pb-3 font-medium text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {videos.map((video) => (
              <tr key={video.id} className="hover:bg-gray-50">
                <td className="py-4">
                  <div className="flex items-center gap-3">
                    <div className="w-16 h-10 rounded-lg bg-gray-100 overflow-hidden shrink-0">
                      {video.thumbnail_url ? (
                        <img src={video.thumbnail_url} alt={video.title} className="w-full h-full object-cover" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-gray-400">
                          <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polygon points="5 3 19 12 5 21 5 3" /></svg>
                        </div>
                      )}
                    </div>
                    {editingId === video.id ? (
                      <input
                        type="text"
                        value={editForm.title}
                        onChange={(e) => setEditForm(prev => ({ ...prev, title: e.target.value }))}
                        className="px-2 py-1 border rounded text-sm"
                        autoFocus
                        onBlur={() => handleEdit(video.id)}
                        onKeyDown={(e) => e.key === 'Enter' && handleEdit(video.id)}
                      />
                    ) : (
                      <p className="font-medium text-gray-900 truncate max-w-xs">{video.title}</p>
                    )}
                  </div>
                </td>
                <td className="py-4 text-sm text-gray-600">{formatNumber(video.views)}</td>
                <td className="py-4 text-sm text-gray-600">{formatNumber(video.likes)}</td>
                <td className="py-4">
                  <select
                    value={video.visibility}
                    onChange={(e) => updateVideo(video.id, { visibility: e.target.value as CreatorVideo['visibility'] })}
                    className="px-2 py-1 border rounded text-sm bg-white"
                  >
                    <option value="public">Public</option>
                    <option value="unlisted">Unlisted</option>
                    <option value="private">Private</option>
                  </select>
                </td>
                <td className="py-4 text-sm text-gray-500">{formatDate(video.created_at)}</td>
                <td className="py-4 text-right">
                  <div className="flex items-center justify-end gap-2">
                    <Link href={`/video/${video.id}`} className="p-1.5 hover:bg-gray-100 rounded" title="View">
                      <Eye className="h-4 w-4 text-gray-500" />
                    </Link>
                    <button
                      onClick={() => { setEditingId(video.id); setEditForm({ title: video.title, visibility: video.visibility }) }}
                      className="p-1.5 hover:bg-gray-100 rounded"
                      title="Edit"
                    >
                      <Edit className="h-4 w-4 text-gray-500" />
                    </button>
                    <button
                      onClick={() => handleDelete(video.id)}
                      disabled={deletingId === video.id}
                      className="p-1.5 hover:bg-red-50 rounded text-red-600 disabled:opacity-50"
                      title="Delete"
                    >
                      {deletingId === video.id ? <Loader2 className="h-4 w-4 animate-spin" /> : <Trash2 className="h-4 w-4" />}
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {videos.length === 0 && (
          <div className="text-center py-12 text-gray-500">
            <p className="mb-4">No videos uploaded yet</p>
            <Link href="/upload" className="text-[#bb0000] hover:underline">Upload your first video</Link>
          </div>
        )}
      </div>
    </div>
  )
}