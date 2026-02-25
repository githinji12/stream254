// app/trending/page.tsx
'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Video, Profile } from '@/lib/types'
import { Play, Eye, Heart, MessageCircle, Flame, ArrowUp, Clock } from 'lucide-react'
import Link from 'next/link'
import LikeButtonCard from '@/components/video/LikeButtonCard'
import CommentModal from '@/components/comments/CommentModal'

// 🇰🇪 Kenyan Theme Constants
const KENYA = {
  red: '#bb0000',
  green: '#007847',
  black: '#000000',
}

const KENYA_GRADIENT = {
  flag: 'linear-gradient(90deg, #007847 0%, #007847 33%, #000000 33%, #000000 34%, #bb0000 34%, #bb0000 66%, #000000 66%, #000000 67%, #007847 67%, #007847 100%)',
  primary: 'linear-gradient(135deg, #bb0000 0%, #007847 100%)',
}

type TimePeriod = 'today' | 'week' | 'month'

type VideoWithStats = Video & { 
  profile: Profile; 
  trending_score?: number;
  stats?: { views: number, likes: number, comments: number }
}

// 🎬 Reusable Video Card Component - FIXED: No nested <a> tags
const VideoCard = ({ 
  video, 
  rank, 
  isHero = false,
  onCommentClick 
}: { 
  video: VideoWithStats; 
  rank: number;
  isHero?: boolean;
  onCommentClick: (video: VideoWithStats) => void;
}) => {
  const router = useRouter()
  const stats = video.stats || { views: video.views || 0, likes: 0, comments: 0 }
  
  const getRankBadge = (position: number) => {
    if (position === 1) return { 
      bg: 'bg-linear-to-br from-[#bb0000] to-[#FFD700]', 
      text: 'text-white',
      border: 'border-2 border-yellow-400/50',
      glow: 'shadow-[0_0_20px_rgba(187,0,0,0.4)]'
    }
    if (position === 2) return { 
      bg: 'bg-linear-to-br from-[#C0C0C0] to-gray-400', 
      text: 'text-white',
      border: 'border-2 border-gray-300/50',
      glow: 'shadow-[0_0_15px_rgba(192,192,192,0.3)]'
    }
    if (position === 3) return { 
      bg: 'bg-linear-to-br from-[#CD7F32] to-orange-600', 
      text: 'text-white',
      border: 'border-2 border-orange-400/50',
      glow: 'shadow-[0_0_15px_rgba(205,127,50,0.3)]'
    }
    return { 
      bg: 'bg-gray-100', 
      text: 'text-gray-700',
      border: 'border-2 border-gray-200',
      glow: ''
    }
  }

  const rankStyle = getRankBadge(rank)

  const formatNumber = (num: number) => {
    if (num >= 1000000) return (num / 1000000).toFixed(1) + 'M'
    if (num >= 1000) return (num / 1000).toFixed(1) + 'K'
    return num.toString()
  }

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleDateString('en-KE', { month: 'short', day: 'numeric' })
  }

  // ✅ Handle card click - navigate to video (but not if clicking interactive children)
  const handleCardClick = (e: React.MouseEvent) => {
    const target = e.target as HTMLElement
    if (target.closest('button') || target.closest('[role="button"]') || target.tagName === 'A') {
      return
    }
    router.push(`/video/${video.id}`)
  }

  // 🎬 Hero Card Layout (Rank #1)
  if (isHero) {
    return (
      <article 
        className="bg-white rounded-3xl border border-gray-200 shadow-lg overflow-hidden hover:shadow-xl transition-all duration-300 group cursor-pointer"
        onClick={handleCardClick}
        role="article"
        aria-label={`Trending #1: ${video.title}`}
      >
        {/* Header: Rank + Trending Badge */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 bg-linear-to-r from-gray-50 to-white">
          <div className="flex items-center gap-3">
            <div className={`flex items-center justify-center w-10 h-10 rounded-full font-bold text-lg ${rankStyle.bg} ${rankStyle.text} ${rankStyle.border} ${rankStyle.glow} shadow-lg`}>
              {rank}
            </div>
            <div className="flex items-center gap-2">
              <Flame className="h-5 w-5" style={{ color: KENYA.red }} />
              <span className="font-semibold text-gray-900">#1 Trending</span>
            </div>
          </div>
          <div className="flex items-center gap-1.5 text-sm text-gray-500 bg-gray-100 px-3 py-1.5 rounded-full">
            <Clock className="h-4 w-4" />
            <span>Live</span>
          </div>
        </div>

        {/* Content: Thumbnail + Info */}
        <div className="flex flex-col lg:flex-row">
          {/* Thumbnail */}
          <div className="lg:w-1/2 relative aspect-video bg-gray-100 overflow-hidden">
            <video
              className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
              src={video.video_url}
              muted
              preload="metadata"
              onClick={(e) => e.stopPropagation()}
              onMouseEnter={(e) => e.currentTarget.play().catch(() => {})}
              onMouseLeave={(e) => {
                e.currentTarget.pause()
                e.currentTarget.currentTime = 0
              }}
            />
            {/* Gradient Overlay */}
            <div className="absolute inset-0 bg-linear-to-t from-black/60 via-black/20 to-transparent" />
            
            {/* Play Button Overlay */}
            <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300">
              <div className="h-16 w-16 rounded-full flex items-center justify-center bg-white/90 backdrop-blur-sm shadow-2xl transform group-hover:scale-110 transition-transform">
                <Play className="h-7 w-7 ml-1" style={{ color: KENYA.red }} />
              </div>
            </div>

            {/* Stats Overlay */}
            <div className="absolute bottom-4 left-4 right-4 flex items-center justify-between text-white text-sm font-medium">
              <div className="flex items-center gap-3">
                <span className="flex items-center gap-1.5">
                  <Eye className="h-4 w-4" />
                  {formatNumber(stats.views)}
                </span>
                <span className="flex items-center gap-1.5">
                  <Heart className="h-4 w-4" />
                  {formatNumber(stats.likes)}
                </span>
              </div>
              <span className="bg-black/40 px-3 py-1 rounded-full backdrop-blur-sm">
                {formatDate(video.created_at)}
              </span>
            </div>
          </div>

          {/* Info Section */}
          <div className="lg:w-1/2 p-6 flex flex-col justify-center">
            <h2 className="text-xl lg:text-2xl font-bold text-gray-900 mb-3 line-clamp-2 group-hover:text-[#bb0000] transition-colors">
              {video.title}
            </h2>
            
            {/* Creator - FIXED: Profile link with stopPropagation */}
            <div className="flex items-center gap-3 mb-4">
              <Link 
                href={`/profile/${video.profile?.id}`} 
                className="shrink-0"
                onClick={(e) => {
                  e.stopPropagation()
                }}
              >
                <div className="h-11 w-11 rounded-full flex items-center justify-center text-white font-bold text-sm shadow-md transition-transform hover:scale-105"
                     style={{ background: KENYA_GRADIENT.primary }}>
                  {video.profile?.username?.charAt(0).toUpperCase() || 'U'}
                </div>
              </Link>
              <div className="min-w-0">
                <Link 
                  href={`/profile/${video.profile?.id}`}
                  className="font-semibold text-gray-900 hover:text-[#bb0000] transition-colors block truncate"
                  onClick={(e) => e.stopPropagation()}
                >
                  @{video.profile?.username}
                </Link>
                <p className="text-sm text-gray-500">{formatDate(video.created_at)}</p>
              </div>
            </div>
            
            {/* Description */}
            {video.description && (
              <p className="text-gray-600 line-clamp-3 mb-5 leading-relaxed">
                {video.description}
              </p>
            )}
            
            {/* Action Buttons */}
            <div className="flex flex-wrap items-center gap-3 pt-4 border-t border-gray-100">
              <div onClick={(e) => e.stopPropagation()}>
                <LikeButtonCard 
                  videoId={video.id}
                  initialLikes={stats.likes}
                  initialIsLiked={false}
                />
              </div>
              
              <button
                onClick={(e) => {
                  e.stopPropagation()
                  onCommentClick(video)
                }}
                className="flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium text-gray-700 hover:text-[#007847] hover:bg-green-50 transition-all duration-300"
              >
                <MessageCircle className="h-4 w-4" />
                <span>{formatNumber(stats.comments)} comments</span>
              </button>
              
              <button
                onClick={(e) => {
                  e.stopPropagation()
                  router.push(`/video/${video.id}`)
                }}
                className="ml-auto inline-flex items-center gap-2 px-5 py-2.5 rounded-full font-semibold text-white transition-all duration-300 shadow-md hover:shadow-lg hover:-translate-y-0.5"
                style={{ background: KENYA_GRADIENT.primary }}
              >
                <Play className="h-4 w-4" />
                Watch Now
              </button>
            </div>
          </div>
        </div>
      </article>
    )
  }

  // 🎬 Grid Card Layout (Rank #2-20) - FIXED: No nested links
  return (
    <article 
      className="bg-white rounded-2xl border border-gray-200 shadow-md overflow-hidden hover:shadow-xl transition-all duration-300 group cursor-pointer flex flex-col h-full"
      onClick={handleCardClick}
      role="article"
      aria-label={`Trending #${rank}: ${video.title}`}
    >
      {/* Thumbnail Section */}
      <div className="relative aspect-video bg-gray-100 overflow-hidden">
        {/* Rank Badge */}
        <div className="absolute top-3 left-3 z-10">
          <div className={`flex items-center justify-center w-8 h-8 rounded-full font-bold text-sm ${rankStyle.bg} ${rankStyle.text} ${rankStyle.border} ${rankStyle.glow} shadow-lg`}>
            {rank}
          </div>
        </div>

        {/* Trending Flame for Top 3 */}
        {rank <= 3 && (
          <div className="absolute top-3 right-3 z-10">
            <div className="p-1.5 rounded-full bg-black/60 backdrop-blur-sm">
              <Flame className="h-4 w-4" style={{ color: rank === 1 ? '#FFD700' : rank === 2 ? '#C0C0C0' : '#CD7F32' }} />
            </div>
          </div>
        )}

        {/* Video Preview */}
        <video
          className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
          src={video.video_url}
          muted
          preload="metadata"
          onClick={(e) => e.stopPropagation()}
          onMouseEnter={(e) => e.currentTarget.play().catch(() => {})}
          onMouseLeave={(e) => {
            e.currentTarget.pause()
            e.currentTarget.currentTime = 0
          }}
        />

        {/* Hover Overlay */}
        <div className="absolute inset-0 bg-linear-to-t from-black/50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
        
        {/* Play Button */}
        <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300">
          <div className="h-12 w-12 rounded-full flex items-center justify-center bg-white/90 backdrop-blur-sm shadow-xl transform group-hover:scale-110 transition-transform">
            <Play className="h-5 w-5 ml-0.5" style={{ color: KENYA.red }} />
          </div>
        </div>

        {/* Duration Badge */}
        {video.duration && (
          <div className="absolute bottom-3 right-3 px-2 py-1 rounded bg-black/70 text-white text-xs font-medium backdrop-blur-sm">
            {Math.floor(video.duration / 60)}:{String(video.duration % 60).padStart(2, '0')}
          </div>
        )}
      </div>

      {/* Content Section */}
      <div className="p-4 flex-1 flex flex-col">
        {/* Title */}
        <h3 className="font-semibold text-gray-900 line-clamp-2 mb-3 group-hover:text-[#bb0000] transition-colors leading-tight">
          {video.title}
        </h3>
        
        {/* Creator - FIXED: Profile link with stopPropagation */}
        <div className="flex items-center gap-2 mb-3">
          <Link 
            href={`/profile/${video.profile?.id}`} 
            className="shrink-0"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="h-7 w-7 rounded-full flex items-center justify-center text-white text-xs font-bold"
                 style={{ background: KENYA_GRADIENT.primary }}>
              {video.profile?.username?.charAt(0).toUpperCase() || 'U'}
            </div>
          </Link>
          <Link 
            href={`/profile/${video.profile?.id}`}
            className="text-sm text-gray-600 hover:text-[#bb0000] transition-colors truncate"
            onClick={(e) => e.stopPropagation()}
          >
            @{video.profile?.username}
          </Link>
        </div>

        {/* Stats Row - Bottom */}
        <div className="mt-auto pt-3 border-t border-gray-100">
          <div className="flex items-center justify-between text-xs text-gray-500">
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
            <button
              onClick={(e) => {
                e.stopPropagation()
                onCommentClick(video)
              }}
              className="flex items-center gap-1 hover:text-[#007847] transition-colors"
              aria-label={`${stats.comments} comments`}
            >
              <MessageCircle className="h-3.5 w-3.5" />
              {formatNumber(stats.comments)}
            </button>
          </div>
        </div>
      </div>
    </article>
  )
}

// 🦴 Skeleton Loader Component
const VideoCardSkeleton = ({ isHero = false }: { isHero?: boolean }) => {
  if (isHero) {
    return (
      <div className="bg-white rounded-3xl border border-gray-200 shadow-lg overflow-hidden animate-pulse">
        <div className="flex flex-col lg:flex-row">
          <div className="lg:w-1/2 aspect-video bg-gray-200" />
          <div className="lg:w-1/2 p-6 space-y-4">
            <div className="h-6 bg-gray-200 rounded w-3/4" />
            <div className="h-4 bg-gray-200 rounded w-1/2" />
            <div className="h-4 bg-gray-200 rounded w-full" />
            <div className="h-4 bg-gray-200 rounded w-5/6" />
            <div className="flex gap-3 pt-4">
              <div className="h-10 bg-gray-200 rounded-full w-24" />
              <div className="h-10 bg-gray-200 rounded-full w-28" />
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="bg-white rounded-2xl border border-gray-200 shadow-md overflow-hidden animate-pulse flex flex-col h-full">
      <div className="aspect-video bg-gray-200" />
      <div className="p-4 flex-1 flex flex-col">
        <div className="h-5 bg-gray-200 rounded w-full mb-3" />
        <div className="h-4 bg-gray-200 rounded w-2/3 mb-3" />
        <div className="flex items-center gap-2 mb-3">
          <div className="h-7 w-7 rounded-full bg-gray-200" />
          <div className="h-4 bg-gray-200 rounded w-20" />
        </div>
        <div className="mt-auto pt-3 border-t border-gray-100">
          <div className="flex justify-between">
            <div className="h-3 bg-gray-200 rounded w-16" />
            <div className="h-3 bg-gray-200 rounded w-12" />
          </div>
        </div>
      </div>
    </div>
  )
}

export default function TrendingPage() {
  const router = useRouter()
  const [videos, setVideos] = useState<VideoWithStats[]>([])
  const [period, setPeriod] = useState<TimePeriod>('week')
  const [loading, setLoading] = useState(true)
  const [selectedVideo, setSelectedVideo] = useState<VideoWithStats | null>(null)
  const [isModalOpen, setIsModalOpen] = useState(false)
  
  const supabase = createClient()

  useEffect(() => {
    async function fetchTrending() {
      setLoading(true)
      
      try {
        const daysMap: Record<TimePeriod, number> = {
          today: 1,
          week: 7,
          month: 30,
        }
        const days = daysMap[period]

        const result = await supabase
          .from('videos')
          .select(`
            *,
            profile:profiles (
              id,
              username,
              avatar_url
            )
          `)
          .gte('created_at', new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString())
          .order('views', { ascending: false })
          .limit(20)

        if (result.error) throw result.error
        if (result.data) {
          const videosData = result.data as (Video & { profile: Profile })[]
          const videoIds = videosData.map(v => v.id)
          let statsMap: Record<string, { views: number, likes: number, comments: number }> = {}
          
          if (videoIds.length > 0) {
            const [likesResult, commentsResult] = await Promise.all([
              supabase.from('likes').select('video_id').in('video_id', videoIds),
              supabase.from('comments').select('video_id').in('video_id', videoIds)
            ])

            videoIds.forEach((id: string) => { 
              statsMap[id] = { views: 0, likes: 0, comments: 0 } 
            })
            videosData.forEach((v: Video) => { 
              statsMap[v.id].views = v.views || 0 
            })
            likesResult.data?.forEach((l: any) => { 
              if (statsMap[l.video_id]) statsMap[l.video_id].likes += 1 
            })
            commentsResult.data?.forEach((c: any) => { 
              if (statsMap[c.video_id]) statsMap[c.video_id].comments += 1 
            })
          }

          const videosWithStats = videosData.map((v: Video & { profile: Profile }) => ({ 
            ...v, 
            stats: statsMap[v.id] 
          }))
          setVideos(videosWithStats)
        }
      } catch (err) {
        console.error('Trending fetch error:', err)
      } finally {
        setLoading(false)
      }
    }

    fetchTrending()
  }, [period, supabase])

  const handleCommentClick = (video: VideoWithStats) => {
    setSelectedVideo(video)
    setIsModalOpen(true)
  }

  return (
    <div className="min-h-[calc(100vh-4rem)] py-6 px-4 bg-linear-to-br from-gray-50 to-gray-100">
      {/* 🇰🇪 Kenyan Flag Accent Bar */}
      <div className="fixed top-16 left-0 right-0 h-1 z-30" 
           style={{ background: KENYA_GRADIENT.flag }} 
           aria-hidden="true" />

      <div className="max-w-7xl mx-auto">
        {/* 📰 Header Section */}
        <header className="mb-10 text-center">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl mb-5 shadow-lg" 
               style={{ background: KENYA_GRADIENT.primary }}>
            <Flame className="h-8 w-8 text-white" />
          </div>
          <h1 className="text-4xl md:text-5xl font-bold mb-3">
            <span style={{ color: KENYA.red }}>Trending</span>
            <span style={{ color: KENYA.black }}> Now</span>
          </h1>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto leading-relaxed">
            The hottest videos from African creators, updated in real-time 🔥
          </p>
          
          {/* ⏰ Time Period Filter */}
          <div className="flex items-center justify-center gap-2 mt-8">
            {(['today', 'week', 'month'] as TimePeriod[]).map((p) => (
              <button
                key={p}
                onClick={() => setPeriod(p)}
                className={`px-5 py-2.5 rounded-full text-sm font-semibold transition-all duration-300 shadow-sm ${
                  period === p
                    ? 'text-white shadow-md hover:shadow-lg hover:-translate-y-0.5'
                    : 'bg-white text-gray-700 hover:bg-gray-50 border border-gray-200'
                }`}
                style={period === p ? { background: KENYA_GRADIENT.primary } : {}}
              >
                {p === 'today' ? '🌅 Today' : p === 'week' ? '📅 This Week' : '🗓️ This Month'}
              </button>
            ))}
          </div>
        </header>

        {/* 🦴 Loading State */}
        {loading ? (
          <div className="space-y-8">
            <VideoCardSkeleton isHero />
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {[...Array(8)].map((_, i) => (
                <VideoCardSkeleton key={`skeleton-${i}`} />
              ))}
            </div>
          </div>
        ) : videos.length === 0 ? (
          /* 📭 Empty State */
          <div className="text-center py-20 bg-white rounded-3xl border border-gray-200 shadow-lg">
            <div className="w-20 h-20 mx-auto mb-6 rounded-2xl flex items-center justify-center" 
                 style={{ background: `linear-gradient(135deg, ${KENYA.red}20, ${KENYA.green}20)` }}>
              <Flame className="h-10 w-10" style={{ color: KENYA.red }} />
            </div>
            <h2 className="text-2xl font-bold text-gray-900 mb-3">No trending videos yet</h2>
            <p className="text-gray-600 mb-8 max-w-md mx-auto">
              Check back later or explore the homepage for amazing new content from Kenyan creators!
            </p>
            <button 
              onClick={() => router.push('/')}
              className="inline-flex items-center gap-2 px-6 py-3 rounded-full font-semibold text-white transition-all duration-300 shadow-md hover:shadow-lg hover:-translate-y-0.5"
              style={{ background: KENYA_GRADIENT.primary }}
            >
              <Play className="h-4 w-4" />
              Browse All Videos
            </button>
          </div>
        ) : (
          <>
            {/* 🎬 Video Grid */}
            <div className="space-y-8">
              {/* 🔥 #1 Trending Hero Card */}
              {videos[0] && (
                <VideoCard 
                  key={videos[0].id}
                  video={videos[0]} 
                  rank={1} 
                  isHero={true}
                  onCommentClick={handleCommentClick}
                />
              )}

              {/* 🔥 Trending Grid (Videos #2-20) */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                {videos.slice(1).map((video, index) => (
                  <VideoCard
                    key={video.id}
                    video={video}
                    rank={index + 2}
                    onCommentClick={handleCommentClick}
                  />
                ))}
              </div>
            </div>
          </>
        )}

        {/* 📈 Back to Top Button */}
        <button
          onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
          className="fixed bottom-6 right-6 p-3 rounded-full bg-white border border-gray-200 shadow-lg hover:shadow-xl transition-all duration-300 hover:-translate-y-1 z-40 group"
          aria-label="Back to top"
        >
          <ArrowUp className="h-5 w-5 text-gray-700 group-hover:text-[#bb0000] transition-colors" />
        </button>
      </div>

      {/* 💬 Comment Modal */}
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
