// components/profile/VideoGrid.tsx
'use client'

import Link from 'next/link'
import { Play, Eye, Heart, Calendar } from 'lucide-react'
import type { Video } from '@/lib/types'

// 🎨 Kenyan Theme Constants
const KENYA = {
  red: '#bb0000',
  green: '#007847',
} as const

interface VideoGridProps {
  videos: Video[]
  videoStats: Record<string, { views: number; likes: number }>
  viewMode: 'grid' | 'list'
}

const formatNumber = (num: number): string => {
  if (num >= 1000000) return (num / 1000000).toFixed(1) + 'M'
  if (num >= 1000) return (num / 1000).toFixed(1) + 'K'
  return num.toString()
}

const formatDate = (dateString: string): string => {
  const date = new Date(dateString)
  return date.toLocaleDateString('en-KE', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  })
}

export function VideoGrid({ videos, videoStats, viewMode }: VideoGridProps) {
  if (viewMode === 'grid') {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {videos.map((video) => {
          const stats = videoStats[video.id] || { views: video.views || 0, likes: 0 }
          return (
            <Link
              key={video.id}
              href={`/video/${video.id}`}
              className="group bg-white rounded-2xl border border-gray-200 shadow-md overflow-hidden hover:shadow-xl transition-all duration-300 hover:-translate-y-1 flex flex-col"
            >
              <div className="aspect-video bg-gray-100 relative overflow-hidden">
                <video
                  className="w-full h-full object-cover"
                  src={video.video_url}
                  muted
                  onMouseEnter={(e) => e.currentTarget.play().catch(() => {})}
                  onMouseLeave={(e) => {
                    e.currentTarget.pause()
                    e.currentTarget.currentTime = 0
                  }}
                />
                <div className="absolute inset-0 bg-linear-to-t from-[#bb0000]/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                  <div
                    className="h-12 w-12 rounded-full flex items-center justify-center shadow-lg"
                    style={{ background: `${KENYA.red}cc` }}
                  >
                    <Play className="h-5 w-5 text-white ml-0.5" />
                  </div>
                </div>
                {video.duration && (
                  <span className="absolute bottom-2 right-2 px-2 py-0.5 bg-black/70 text-white text-xs rounded">
                    {Math.floor(video.duration / 60)}:{String(video.duration % 60).padStart(2, '0')}
                  </span>
                )}
              </div>
              <div className="p-4 flex-1 flex flex-col">
                <h3 className="font-semibold text-gray-900 line-clamp-2 mb-3 group-hover:text-[#bb0000] transition-colors">
                  {video.title}
                </h3>
                <div className="mt-auto flex items-center justify-between text-sm text-gray-500 pt-3 border-t border-gray-100">
                  <div className="flex items-center gap-3">
                    <span className="flex items-center gap-1">
                      <Eye className="h-3.5 w-3.5" style={{ color: KENYA.red }} />
                      {formatNumber(stats.views)}
                    </span>
                    <span className="flex items-center gap-1">
                      <Heart className="h-3.5 w-3.5" style={{ color: KENYA.green }} />
                      {formatNumber(stats.likes)}
                    </span>
                  </div>
                  <span className="flex items-center gap-1">
                    <Calendar className="h-3.5 w-3.5" />
                    {formatDate(video.created_at)}
                  </span>
                </div>
              </div>
            </Link>
          )
        })}
      </div>
    )
  }

  // List view
  return (
    <div className="space-y-4">
      {videos.map((video) => {
        const stats = videoStats[video.id] || { views: video.views || 0, likes: 0 }
        return (
          <Link
            key={video.id}
            href={`/video/${video.id}`}
            className="group bg-white rounded-2xl border border-gray-200 shadow-md flex gap-4 p-4 hover:shadow-xl transition-all duration-300"
          >
            <div className="w-40 sm:w-48 aspect-video bg-gray-100 rounded-lg relative overflow-hidden shrink-0">
              <video
                className="w-full h-full object-cover"
                src={video.video_url}
                muted
                onMouseEnter={(e) => e.currentTarget.play().catch(() => {})}
                onMouseLeave={(e) => {
                  e.currentTarget.pause()
                  e.currentTarget.currentTime = 0
                }}
              />
              <div className="absolute inset-0 bg-linear-to-t from-[#bb0000]/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
              <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                <div
                  className="h-10 w-10 rounded-full flex items-center justify-center shadow-lg"
                  style={{ background: `${KENYA.red}cc` }}
                >
                  <Play className="h-4 w-4 text-white ml-0.5" />
                </div>
              </div>
            </div>
            <div className="flex-1 min-w-0 flex flex-col justify-between">
              <div>
                <h3 className="font-semibold text-gray-900 group-hover:text-[#bb0000] transition-colors line-clamp-2">
                  {video.title}
                </h3>
                {video.description && (
                  <p className="text-sm text-gray-600 mt-2 line-clamp-2">{video.description}</p>
                )}
              </div>
              <div className="flex items-center gap-4 text-sm text-gray-500 mt-3">
                <span className="flex items-center gap-1">
                  <Eye className="h-4 w-4" style={{ color: KENYA.red }} />
                  {formatNumber(stats.views)} views
                </span>
                <span className="flex items-center gap-1">
                  <Heart className="h-4 w-4" style={{ color: KENYA.green }} />
                  {formatNumber(stats.likes)} likes
                </span>
                <span className="flex items-center gap-1">
                  <Calendar className="h-4 w-4" />
                  {formatDate(video.created_at)}
                </span>
              </div>
            </div>
          </Link>
        )
      })}
    </div>
  )
}