// app/page.tsx
'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Video, Profile } from '@/lib/types'
import { Play, Eye, MessageCircle, UserPlus, Check } from 'lucide-react'
import Link from 'next/link'
import LikeButtonCard from '@/components/video/LikeButtonCard'
import CommentModal from '@/components/comments/CommentModal'
import CookieBanner from '@/components/layout/CookieBanner'

export default function Home() {
  const [videos, setVideos] = useState<(Video & { profile: Profile })[]>([])
  const [videoEngagement, setVideoEngagement] = useState<Record<string, { 
    likes: number
    isLiked: boolean
    comments: number
  }>>({})
  const [followingCreators, setFollowingCreators] = useState<Record<string, boolean>>({})
  const [currentUserId, setCurrentUserId] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  
  const [selectedVideo, setSelectedVideo] = useState<(Video & { profile: Profile }) | null>(null)
  const [isModalOpen, setIsModalOpen] = useState(false)
  
  const supabase = createClient()

  useEffect(() => {
    async function fetchVideos() {
      try {
        // 🔍 Fetch current user session first
        const sessionResult = await supabase.auth.getSession()
        const userId = sessionResult.data?.session?.user?.id || null
        setCurrentUserId(userId)

        // 🎬 Fetch videos with profiles
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
          .order('created_at', { ascending: false })
          .limit(20)

        if (videosResult.error) throw videosResult.error
        if (videosResult.data) {
          const videosData = videosResult.data as (Video & { profile: Profile })[]
          setVideos(videosData)
          
          const videoIds = videosData.map((v) => v.id)
          
          if (videoIds.length > 0) {
            // Fetch likes and comments
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

            const initialEngagement: Record<string, { likes: number, isLiked: boolean, comments: number }> = {}
            videosData.forEach((video) => {
              initialEngagement[video.id] = {
                likes: likeCounts[video.id] || 0,
                isLiked: false,
                comments: commentCounts[video.id] || 0
              }
            })
            setVideoEngagement(initialEngagement)
          }
        }

        // 🔐 Fetch user's likes
        if (userId && videosResult.data?.length) {
          const userLikesResult = await supabase
            .from('likes')
            .select('video_id')
            .in('video_id', videosResult.data.map((v) => v.id))
            .eq('user_id', userId)
          
          if (!userLikesResult.error && userLikesResult.data) {
            setVideoEngagement((prev) => {
              const updated = { ...prev }
              userLikesResult.data?.forEach((like: any) => {
                if (updated[like.video_id]) {
                  updated[like.video_id] = {
                    ...updated[like.video_id],
                    isLiked: true
                  }
                }
              })
              return updated
            })
          }

          // 👥 Fetch which creators user follows
          const creatorIds = [...new Set(videosResult.data.map((v) => v.creator_id))]
          const followResult = await supabase
            .from('follows')
            .select('following_id')
            .eq('follower_id', userId)
            .in('following_id', creatorIds)
          
          if (!followResult.error && followResult.data) {
            const followMap: Record<string, boolean> = {}
            followResult.data.forEach((f: any) => {
              followMap[f.following_id] = true
            })
            setFollowingCreators(followMap)
          }
        }

      } catch (err: any) {
        console.error('Fetch error:', err)
      } finally {
        setLoading(false)
      }
    }

    fetchVideos()
  }, [])

  // ➕ Handle Follow/Unfollow
  const handleFollow = async (e: React.MouseEvent, creatorId: string) => {
    e.preventDefault()
    e.stopPropagation()

    if (!currentUserId) {
      window.location.href = '/login'
      return
    }

    try {
      if (followingCreators[creatorId]) {
        // Unfollow
        await supabase
          .from('follows')
          .delete()
          .eq('follower_id', currentUserId)
          .eq('following_id', creatorId)
        
        setFollowingCreators(prev => ({ ...prev, [creatorId]: false }))
      } else {
        // Follow
        await supabase
          .from('follows')
          .insert({
            follower_id: currentUserId,
            following_id: creatorId
          })
        
        setFollowingCreators(prev => ({ ...prev, [creatorId]: true }))
      }
    } catch (err) {
      console.error('Follow error:', err)
    }
  }

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleDateString('en-KE', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    })
  }

  return (
    <>
      <div className="min-h-[calc(100vh-4rem)] py-8 px-4 pattern-savanna">
        <div className="max-w-7xl mx-auto">
          <div className="mb-10 text-center">
            <h1 className="text-4xl md:text-5xl font-bold mb-3">
              <span style={{ color: '#bb0000' }}>Latest</span>
              <span style={{ color: '#000000' }}> Videos</span>
            </h1>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto">
              Discover authentic content from <span className="font-semibold" style={{ color: '#007847' }}>African creators</span>
            </p>
            <div className="kenya-stripe mt-6 max-w-xs mx-auto rounded-full" />
          </div>

          {loading ? (
            <div className="flex justify-center py-12">
              <div className="spinner-kenya h-12 w-12"></div>
            </div>
          ) : videos.length === 0 ? (
            <div className="text-center py-16 bg-white rounded-2xl shadow-kenya pattern-maasai">
              <Play className="h-20 w-20 mx-auto mb-6" style={{ color: '#bb000030' }} />
              <h2 className="text-2xl font-bold text-gray-900 mb-3">No videos yet</h2>
              <p className="text-gray-600 mb-8 max-w-md mx-auto">
                Be the first to share your story with the Stream254 community!
              </p>
              <Link
                href="/upload"
                className="btn-kenya-primary inline-flex items-center gap-2"
              >
                <Play className="h-5 w-5" />
                Upload Video
              </Link>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {videos.map((video) => {
                const engagement = videoEngagement[video.id] || { likes: 0, isLiked: false, comments: 0 }
                const isFollowing = followingCreators[video.creator_id] || false
                const isOwnVideo = currentUserId === video.creator_id

                return (
                  <Link
                    key={video.id}
                    href={'/video/' + video.id}
                    className="card-kenya group"
                  >
                    {/* Thumbnail */}
                    <div className="aspect-video bg-linear-to-br from-gray-100 to-gray-200 relative overflow-hidden">
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
                      <div className="absolute inset-0 bg-linear-to-t from-[#bb0000]/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                      <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                        <div className="h-14 w-14 rounded-full flex items-center justify-center shadow-kenya" style={{ background: '#bb0000cc' }}>
                          <Play className="h-6 w-6 text-white ml-1" />
                        </div>
                      </div>
                    </div>

                    {/* Video Info */}
                    <div className="p-4">
                      <h3 className="font-bold text-gray-900 line-clamp-2 mb-3 group-hover:text-[#bb0000] transition-colors duration-300">
                        {video.title}
                      </h3>
                      
                      {/* Creator + Follow Button + Like */}
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center gap-2 text-sm flex-1 min-w-0">
                          <div className="h-7 w-7 bg-linear-to-br from-[#bb0000] via-[#000000] to-[#007847] rounded-full flex items-center justify-center text-white text-xs font-bold shrink-0">
                            {video.profile?.username?.charAt(0).toUpperCase() || 'U'}
                          </div>
                          <span className="truncate text-gray-600">
                            @{video.profile?.username || 'Unknown'}
                          </span>
                        </div>
                        
                        {/* ➕ Quick Follow Button (only if not own video) */}
                        {!isOwnVideo && (
                          <button
                            onClick={(e) => handleFollow(e, video.creator_id)}
                            className={`p-1.5 rounded-full transition-all duration-300 shrink-0 ml-2 ${
                              isFollowing
                                ? 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                                : 'bg-[#007847]/10 text-[#007847] hover:bg-[#007847] hover:text-white'
                            }`}
                            aria-label={isFollowing ? 'Unfollow creator' : 'Follow creator'}
                            title={isFollowing ? 'Following' : 'Follow'}
                          >
                            {isFollowing ? (
                              <Check className="h-3.5 w-3.5" />
                            ) : (
                              <UserPlus className="h-3.5 w-3.5" />
                            )}
                          </button>
                        )}
                        
                        {/* Like Button */}
                        <div onClick={(e) => e.stopPropagation()}>
                          <LikeButtonCard
                            videoId={video.id}
                            initialLikes={engagement.likes}
                            initialIsLiked={engagement.isLiked}
                            compact={true}
                          />
                        </div>
                      </div>

                      {/* Stats: Views + Comments + Date */}
                      <div className="flex items-center gap-3 text-xs text-gray-500 pt-3 border-t border-gray-100">
                        <div className="flex items-center gap-1">
                          <Eye className="h-3.5 w-3.5" />
                          <span>{video.views}</span>
                        </div>
                        
                        <button
                          onClick={(e) => {
                            e.preventDefault()
                            e.stopPropagation()
                            setSelectedVideo(video)
                            setIsModalOpen(true)
                          }}
                          className="flex items-center gap-1 hover:text-[#007847] transition-colors text-left"
                          aria-label="View comments"
                        >
                          <MessageCircle className="h-3.5 w-3.5" />
                          <span>{engagement.comments}</span>
                        </button>
                        
                        <span style={{ color: '#bb0000' }}>•</span>
                        <span>{formatDate(video.created_at)}</span>
                      </div>
                    </div>
                  </Link>
                )
              })}
            </div>
          )}
        </div>

        {/* Comment Modal */}
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

      {/* 🍪 Cookie Banner - Fixed at bottom, above footer */}
      <CookieBanner />
    </>
  )
}