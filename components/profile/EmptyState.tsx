// components/profile/EmptyState.tsx
'use client'

import Link from 'next/link'
import { Play } from 'lucide-react'

// 🎨 Kenyan Theme Constants
const KENYA = {
  red: '#bb0000',
  green: '#007847',
} as const

const KENYA_GRADIENT = {
  primary: `linear-gradient(135deg, ${KENYA.red}, ${KENYA.green})`,
} as const

interface EmptyStateProps {
  isOwnProfile: boolean
  contentType: 'videos' | 'liked'
}

export function EmptyState({ isOwnProfile, contentType }: EmptyStateProps) {
  const messages = {
    videos: {
      title: isOwnProfile ? 'No videos yet' : 'No videos yet',
      description: isOwnProfile
        ? 'Start sharing your story by uploading your first video!'
        : 'This creator hasn\'t uploaded any videos yet.',
      action: isOwnProfile ? 'Upload Your First Video' : undefined,
      actionHref: isOwnProfile ? '/upload' : undefined,
    },
    liked: {
      title: 'Liked Videos',
      description: isOwnProfile
        ? 'Videos you\'ve liked will appear here.'
        : 'This user\'s liked videos are private.',
      action: undefined,
      actionHref: undefined,
    },
  }

  const message = messages[contentType]

  return (
    <div className="text-center py-16 bg-white rounded-2xl border border-gray-200 shadow-lg">
      <Play className="h-16 w-16 text-gray-300 mx-auto mb-4" />
      <h3 className="text-xl font-semibold text-gray-900 mb-2">{message.title}</h3>
      <p className="text-gray-600 mb-6">{message.description}</p>
      {message.action && message.actionHref && (
        <Link
          href={message.actionHref}
          className="inline-flex items-center gap-2 px-6 py-3 rounded-full font-semibold text-white transition-all duration-300 shadow-md hover:shadow-lg hover:-translate-y-0.5"
          style={{ background: KENYA_GRADIENT.primary }}
        >
          <Play className="h-4 w-4" />
          {message.action}
        </Link>
      )}
    </div>
  )
}