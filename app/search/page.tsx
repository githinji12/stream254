// app/search/page.tsx
'use client'

import { useEffect, useState, Suspense } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Video, Profile } from '@/lib/types'
import { Search, Eye, MessageCircle, X, Loader2 } from 'lucide-react'
import Link from 'next/link'
import LikeButtonCard from '@/components/video/LikeButtonCard'
import CommentModal from '@/components/comments/CommentModal'

// 🎨 Kenyan Theme Constants
const KENYA = {
  red: '#bb0000',
  green: '#007847',
  black: '#000000',
} as const

// ✅ Inner component that uses useSearchParams (must be wrapped in Suspense)
function SearchContent() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const query = searchParams.get('q') || ''
  
  const [videos, setVideos] = useState<(Video & { profile: Profile })[]>([])
  const [videoEngagement, setVideoEngagement] = useState<Record<string, { 
    likes: number
    isLiked: boolean
    comments: number
  }>>({})
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState(query)
  
  const [selectedVideo, setSelectedVideo] = useState<(Video & { profile: Profile }) | null>(null)
  const [isModalOpen, setIsModalOpen] = useState(false)
  
  const supabase = createClient()

  useEffect(() => {
    setSearchTerm(query)
  }, [query])

  useEffect(() => {
    async function searchVideos() {
      if (!searchTerm.trim()) {
        setVideos([])
        setLoading(false)
        return
      }

      setLoading(true)
      try {
        const videosResult = await supabase
          .from('videos')
          .select(`
            *,
            profile:profiles (
              id,
              username,
              avatar_url
            )
          `)
          .or(`title.ilike.%${searchTerm}%,description.ilike.%${searchTerm}%,profiles.username.ilike.%${searchTerm}%`)
          .order('created_at', { ascending: false })
          .limit(20)

        if (videosResult.error) throw videosResult.error
        if (videosResult.data) {
          const videosData = videosResult.data as (Video & { profile: Profile })[]
          setVideos(videosData)
          
          const videoIds = videosData.map((v) => v.id)
          if (videoIds.length > 0) {
            const [likesResult, commentsResult] = await Promise.all([
              supabase.from('likes').select('video_id').in('video_id', videoIds),
              supabase.from('comments').select('video_id').in('video_id', videoIds)
            ])

            const likeCounts: Record<string, number> = {}
            likesResult.data?.forEach((like: any) => {
              likeCounts[like.video_id] = (likeCounts[like.video_id] || 0) + 1
            })

            const commentCounts: Record<string, number> = {}
            commentsResult.data?.forEach((comment: any) => {
              commentCounts[comment.video_id] = (commentCounts[comment.video_id] || 0) + 1
            })

            const engagement: Record<string, { likes: number, isLiked: boolean, comments: number }> = {}
            videosData.forEach((video) => {
              engagement[video.id] = {
                likes: likeCounts[video.id] || 0,
                isLiked: false,
                comments: commentCounts[video.id] || 0
              }
            })
            setVideoEngagement(engagement)

            const sessionResult = await supabase.auth.getSession()
            if (sessionResult.data?.session?.user) {
              const userId = sessionResult.data.session.user.id
              const userLikesResult = await supabase
                .from('likes')
                .select('video_id')
                .in('video_id', videoIds)
                .eq('user_id', userId)

              if (userLikesResult.data) {
                setVideoEngagement((prev) => {
                  const updated = { ...prev }
                  userLikesResult.data?.forEach((like: any) => {
                    if (updated[like.video_id]) {
                      updated[like.video_id] = { ...updated[like.video_id], isLiked: true }
                    }
                  })
                  return updated
                })
              }
            }
          }
        }
      } catch (err: any) {
        console.error('Search error:', err)
      } finally {
        setLoading(false)
      }
    }

    const timeoutId = setTimeout(() => {
      searchVideos()
    }, 300)

    return () => clearTimeout(timeoutId)
  }, [searchTerm])

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleDateString('en-KE', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    })
  }

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    if (searchTerm.trim()) {
      router.push('/search?q=' + encodeURIComponent(searchTerm.trim()))
    }
  }

  return (
    <div className="min-h-[calc(100vh-4rem)] py-8 px-4 bg-linear-to-br from-gray-50 to-gray-100">
      <div className="max-w-7xl mx-auto">
        <div className="mb-8">
          <form onSubmit={handleSearch} className="max-w-xl mb-4">
            <div className="relative">
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Search videos, creators..."
                className="w-full px-4 py-3 pl-12 pr-12 border border-gray-300 rounded-full focus:outline-none focus:ring-2 focus:ring-[#bb0000]/20 focus:border-[#bb0000] text-base"
              />
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
              {searchTerm && (
                <button
                  type="button"
                  onClick={() => {
                    setSearchTerm('')
                    router.push('/')
                  }}
                  className="absolute right-4 top-1/2 -translate-y-1/2 p-1 hover:bg-gray-100 rounded-full"
                >
                  <X className="h-4 w-4 text-gray-400" />
                </button>
              )}
            </div>
          </form>

          {query && (
            <p className="text-gray-600">
              {loading ? (
                <span>Searching for "{query}"...</span>
              ) : videos.length === 0 ? (
                <span>No results for "{query}"</span>
              ) : (
                <span>Found {videos.length} result{videos.length !== 1 ? 's' : ''} for "{query}"</span>
              )}
            </p>
          )}
        </div>

        {loading ? (
          <div className="flex justify-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-4 border-transparent"
              style={{
                borderTopColor: KENYA.red,
                borderRightColor: KENYA.black,
                borderBottomColor: KENYA.green
              }}>
            </div>
          </div>
        ) : !query ? (
          <div className="text-center py-12">
            <Search className="h-16 w-16 text-gray-300 mx-auto mb-4" />
            <h2 className="text-xl font-semibold text-gray-900 mb-2">
              Search Stream254
            </h2>
            <p className="text-gray-600">
              Find videos by title, description, or creator name
            </p>
          </div>
        ) : videos.length === 0 ? (
          <div className="text-center py-12">
            <Search className="h-16 w-16 text-gray-300 mx-auto mb-4" />
            <h2 className="text-xl font-semibold text-gray-900 mb-2">
              No results found
            </h2>
            <p className="text-gray-600 mb-6">
              Try different keywords or browse the homepage
            </p>
            <Link
              href="/"
              className="inline-block px-6 py-3 rounded-lg font-medium text-white transition-all"
              style={{ background: `linear-gradient(135deg, ${KENYA.red}, ${KENYA.green})` }}
            >
              Browse All Videos
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {videos.map((video) => {
              const engagement = videoEngagement[video.id] || { likes: 0, isLiked: false, comments: 0 }
              
              return (
                <Link
                  key={video.id}
                  href={'/video/' + video.id}
                  className="group block bg-white rounded-lg border border-gray-200 overflow-hidden hover:shadow-lg transition-shadow"
                >
                  <div className="aspect-video bg-gray-100 relative">
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
                    <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors" />
                  </div>

                  <div className="p-4">
                    <h3 className="font-semibold text-gray-900 line-clamp-2 mb-3 group-hover:text-[#bb0000]">
                      {video.title}
                    </h3>
                    
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-2 text-sm text-gray-600">
                        <div 
                          className="h-6 w-6 rounded-full flex items-center justify-center text-white text-xs font-bold shrink-0"
                          style={{ background: `linear-gradient(135deg, ${KENYA.red}, ${KENYA.green})` }}
                        >
                          {video.profile?.username?.charAt(0).toUpperCase() || 'U'}
                        </div>
                        <span className="truncate max-w-25">
                          @{video.profile?.username || 'Unknown'}
                        </span>
                      </div>
                      
                      <div onClick={(e) => e.stopPropagation()}>
                        <LikeButtonCard
                          videoId={video.id}
                          initialLikes={engagement.likes}
                          initialIsLiked={engagement.isLiked}
                          compact={true}
                        />
                      </div>
                    </div>

                    <div className="flex items-center gap-3 text-xs text-gray-500">
                      <div className="flex items-center gap-1">
                        <Eye className="h-3 w-3" style={{ color: KENYA.red }} />
                        <span>{video.views}</span>
                      </div>
                      
                      <button
                        onClick={(e) => {
                          e.preventDefault()
                          e.stopPropagation()
                          setSelectedVideo(video)
                          setIsModalOpen(true)
                        }}
                        className="flex items-center gap-1 hover:text-[#bb0000] transition-colors text-left"
                      >
                        <MessageCircle className="h-3 w-3" style={{ color: KENYA.green }} />
                        <span>{engagement.comments}</span>
                      </button>
                      
                      <span>•</span>
                      <span>{formatDate(video.created_at)}</span>
                    </div>
                  </div>
                </Link>
              )
            })}
          </div>
        )}
      </div>

      {selectedVideo && (
        <CommentModal
          video={selectedVideo}
          isOpen={isModalOpen}
          onClose={() => {
            setIsModalOpen(false)
            setTimeout(() => setSelectedVideo(null), 200)
          }}
        />
      )}
    </div>
  )
}

// ✅ Loading fallback component
function SearchSkeleton() {
  return (
    <div className="min-h-[calc(100vh-4rem)] py-8 px-4 bg-linear-to-br from-gray-50 to-gray-100">
      <div className="max-w-7xl mx-auto">
        <div className="mb-8">
          <div className="max-w-xl mb-4">
            <div className="h-12 bg-gray-200 rounded-full animate-pulse" />
          </div>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {[...Array(8)].map((_, i) => (
            <div key={i} className="bg-white rounded-lg border border-gray-200 overflow-hidden animate-pulse">
              <div className="aspect-video bg-gray-200" />
              <div className="p-4 space-y-3">
                <div className="h-4 bg-gray-200 rounded w-3/4" />
                <div className="h-4 bg-gray-200 rounded w-1/2" />
                <div className="flex gap-2">
                  <div className="h-3 bg-gray-200 rounded w-12" />
                  <div className="h-3 bg-gray-200 rounded w-12" />
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

// ✅ Main export with Suspense boundary
export default function SearchPage() {
  return (
    <Suspense fallback={<SearchSkeleton />}>
      <SearchContent />
    </Suspense>
  )
}