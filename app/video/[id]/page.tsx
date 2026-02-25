// app/video/[id]/page.tsx
'use client'

import { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Video, Profile } from '@/lib/types'
import { Eye, Calendar, ArrowLeft, Share2, MessageCircle, Link as LinkIcon } from 'lucide-react'
import Link from 'next/link'
import LikeButton from '@/components/video/LikeButton'
import CommentList from '@/components/comments/CommentList'
import CommentForm from '@/components/comments/CommentForm'

// 🇰🇪 Kenyan Theme Constants
const KENYA_COLORS = {
  red: '#bb0000',
  green: '#007847',
  black: '#000000',
  white: '#ffffff',
  whatsapp: '#25D366',
}

const KENYA_GRADIENT = {
  flag: 'linear-gradient(90deg, #007847 0%, #007847 33%, #000000 33%, #000000 34%, #bb0000 34%, #bb0000 66%, #000000 66%, #000000 67%, #007847 67%, #007847 100%)',
  primary: 'linear-gradient(135deg, #bb0000 0%, #007847 100%)',
  hover: 'linear-gradient(135deg, #990000 0%, #005c36 100%)',
}

export default function VideoPage() {
  const params = useParams()
  const videoId = params.id as string
  const [video, setVideo] = useState<Video | null>(null)
  const [creator, setCreator] = useState<Profile | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  
  // Like system state
  const [likeCount, setLikeCount] = useState(0)
  const [userHasLiked, setUserHasLiked] = useState(false)
  const [likesLoading, setLikesLoading] = useState(true)
  
  const supabase = createClient()

  useEffect(() => {
    async function fetchVideo() {
      try {
        // 1️⃣ Fetch video details
        const videoResult = await supabase
          .from('videos')
          .select('*')
          .eq('id', videoId)
          .single()

        if (videoResult.error) throw videoResult.error
        if (!videoResult.data) {
          setError('Video not found')
          setLoading(false)
          return
        }

        const videoData = videoResult.data as Video
        setVideo(videoData)

        // 2️⃣ Fetch creator profile
        const profileResult = await supabase
          .from('profiles')
          .select('*')
          .eq('id', videoData.creator_id)
          .single()

        if (!profileResult.error && profileResult.data) {
          setCreator(profileResult.data as Profile)
        }

        // 3️⃣ Fetch like count
        const likesResult = await supabase
          .from('likes')
          .select('*', { count: 'exact', head: true })
          .eq('video_id', videoId)

        if (!likesResult.error) {
          setLikeCount(likesResult.count || 0)
        }

        // 4️⃣ Check if current user liked this video
        const sessionResult = await supabase.auth.getSession()
        if (sessionResult.data?.session?.user) {
          const userLikeResult = await supabase
            .from('likes')
            .select('id')
            .eq('video_id', videoId)
            .eq('user_id', sessionResult.data.session.user.id)
            .maybeSingle()
          
          if (!userLikeResult.error) {
            setUserHasLiked(!!userLikeResult.data)
          }
        }

        // 5️⃣ Increment view count (fire-and-forget)
        await supabase
          .from('videos')
          .update({ views: videoData.views + 1 })
          .eq('id', videoId)

      } catch (err: any) {
        console.error('Fetch error:', err)
        setError(err.message || 'Failed to load video')
      } finally {
        setLoading(false)
        setLikesLoading(false)
      }
    }

    if (videoId) {
      fetchVideo()
    }
  }, [videoId])

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleDateString('en-KE', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    })
  }

  // 📱 Share to WhatsApp Handler
  const handleShareToWhatsApp = () => {
    if (!video) return
    
    const videoUrl = typeof window !== 'undefined' 
      ? window.location.href 
      : `https://stream254.co.ke/video/${videoId}`
    
    const shareText = encodeURIComponent(
      `🎬 Check out this video on Stream254: ${video.title}\n\n🔗 ${videoUrl}`
    )
    
    // Open WhatsApp with pre-filled message
    const whatsappUrl = `https://wa.me/?text=${shareText}`
    window.open(whatsappUrl, '_blank')
  }

  // 📋 Copy Link Handler - With Fallback Support
  const handleCopyLink = async () => {
    if (!video) return
    
    const videoUrl = typeof window !== 'undefined' 
      ? window.location.href 
      : `https://stream254.co.ke/video/${videoId}`
    
    try {
      // ✅ Try modern Clipboard API first
      if (navigator.clipboard?.writeText) {
        await navigator.clipboard.writeText(videoUrl)
        showCopyToast('Link copied! 📋')
        return
      }
      
      // 🔄 Fallback for older browsers / non-HTTPS
      fallbackCopyTextToClipboard(videoUrl)
      
    } catch (err) {
      console.error('Clipboard API failed:', err)
      // Final fallback
      fallbackCopyTextToClipboard(videoUrl)
    }
  }

  // 🔄 Fallback copy method using execCommand
  const fallbackCopyTextToClipboard = (text: string) => {
    try {
      // Create temporary textarea element
      const textArea = document.createElement('textarea')
      textArea.value = text
      textArea.style.position = 'fixed'
      textArea.style.left = '-999999px'
      textArea.style.top = '-999999px'
      textArea.style.opacity = '0'
      document.body.appendChild(textArea)
      textArea.focus()
      textArea.select()
      
      // Execute copy command
      const successful = document.execCommand('copy')
      document.body.removeChild(textArea)
      
      if (successful) {
        showCopyToast('Link copied! 📋')
      } else {
        showCopyToast('Press Ctrl+C to copy', true)
      }
    } catch (err) {
      console.error('Fallback copy failed:', err)
      showCopyToast('Could not copy link', true)
    }
  }

  // 🍞 Toast Notification Helper
  const showCopyToast = (message: string, isError = false) => {
    // Remove any existing toast
    const existingToast = document.getElementById('copy-toast')
    if (existingToast) {
      document.body.removeChild(existingToast)
    }

    // Create toast element
    const toast = document.createElement('div')
    toast.id = 'copy-toast'
    toast.className = `fixed bottom-6 right-6 px-6 py-3 rounded-lg shadow-lg z-[100] text-white font-medium transition-all duration-300 ${
      isError ? 'bg-red-600' : 'bg-gray-900'
    }`
    toast.style.cssText = 'animation: slideIn 0.3s ease-out'
    toast.textContent = message
    
    // Add to document
    document.body.appendChild(toast)
    
    // Auto-remove after 3 seconds
    setTimeout(() => {
      toast.style.opacity = '0'
      toast.style.transform = 'translateY(10px)'
      setTimeout(() => {
        if (document.body.contains(toast)) {
          document.body.removeChild(toast)
        }
      }, 300)
    }, 3000)
    
    // Add keyframes for animation if not already present
    if (!document.getElementById('toast-keyframes')) {
      const style = document.createElement('style')
      style.id = 'toast-keyframes'
      style.textContent = `
        @keyframes slideIn {
          from { opacity: 0; transform: translateY(20px); }
          to { opacity: 1; transform: translateY(0); }
        }
      `
      document.head.appendChild(style)
    }
  }

  // 🇰🇪 Loading State with Kenyan Theme
  if (loading) {
    return (
      <div className="min-h-[calc(100vh-4rem)] flex items-center justify-center bg-linear-to-br from-gray-50 to-gray-100">
        <div className="text-center">
          {/* Kenyan Flag Animated Loader */}
          <div className="relative mx-auto mb-4">
            <div className="animate-spin rounded-full h-16 w-16 border-4 border-transparent" 
                 style={{ 
                   borderTopColor: KENYA_COLORS.red,
                   borderRightColor: KENYA_COLORS.black,
                   borderBottomColor: KENYA_COLORS.green
                 }}>
            </div>
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="h-8 w-8 rounded-full bg-white shadow-inner"></div>
            </div>
          </div>
          <p className="text-gray-700 font-medium">Loading video from Kenya... 🇰🇪</p>
        </div>
      </div>
    )
  }

  // 🇰🇪 Error State with Kenyan Theme
  if (error || !video) {
    return (
      <div className="min-h-[calc(100vh-4rem)] flex items-center justify-center bg-linear-to-br from-gray-50 to-gray-100">
        <div className="text-center p-8 bg-white rounded-2xl shadow-lg border border-gray-200 max-w-md mx-4">
          <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-red-100 flex items-center justify-center">
            <span className="text-3xl">🇰🇪</span>
          </div>
          <p className="text-xl font-semibold text-gray-900 mb-2">
            {error || 'Video not found'}
          </p>
          <p className="text-gray-600 mb-6">
            The video you&apos;re looking for might have been removed or is temporarily unavailable.
          </p>
          <Link 
            href="/" 
            className="inline-flex items-center gap-2 px-6 py-3 rounded-full font-semibold text-white transition-all duration-300 shadow-md hover:shadow-lg hover:-translate-y-0.5"
            style={{ background: KENYA_GRADIENT.primary }}
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Home
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-[calc(100vh-4rem)] py-6 px-4 bg-linear-to-br from-gray-50 to-gray-100">
      <div className="max-w-5xl mx-auto">
        
        {/* 🇰🇪 Kenyan Flag Accent Bar */}
        <div className="h-1.5 w-full rounded-full mb-6 shadow-sm" 
             style={{ background: KENYA_GRADIENT.flag }} 
             aria-hidden="true" />

        {/* Back Button - Kenyan Styled */}
        <Link 
          href="/"
          className="inline-flex items-center gap-2 text-gray-700 hover:text-[#bb0000] font-medium mb-4 transition-colors group"
        >
          <ArrowLeft className="h-4 w-4 group-hover:-translate-x-1 transition-transform" />
          <span className="relative">
            Back to Home
            <span className="absolute bottom-0 left-0 w-0 h-0.5 bg-[#bb0000] transition-all group-hover:w-full"></span>
          </span>
        </Link>

        {/* 🎬 Video Player with Kenyan Border Accent */}
        <div className="relative bg-black rounded-2xl overflow-hidden mb-6 shadow-2xl border-4 border-transparent"
             style={{ 
               borderImage: `linear-gradient(135deg, ${KENYA_COLORS.red}, ${KENYA_COLORS.green}) 1`,
               borderImageSlice: 1
             }}>
          {/* Kenyan Corner Accents */}
          <div className="absolute top-0 left-0 w-8 h-8 border-t-4 border-l-4" 
               style={{ borderColor: KENYA_COLORS.red }} 
               aria-hidden="true" />
          <div className="absolute top-0 right-0 w-8 h-8 border-t-4 border-r-4" 
               style={{ borderColor: KENYA_COLORS.green }} 
               aria-hidden="true" />
          <div className="absolute bottom-0 left-0 w-8 h-8 border-b-4 border-l-4" 
               style={{ borderColor: KENYA_COLORS.green }} 
               aria-hidden="true" />
          <div className="absolute bottom-0 right-0 w-8 h-8 border-b-4 border-r-4" 
               style={{ borderColor: KENYA_COLORS.red }} 
               aria-hidden="true" />
          
          <video
            controls
            className="w-full max-h-[70vh] object-contain"
            poster={video.thumbnail_url || undefined}
            style={{ backgroundColor: '#0a0a0a' }}
          >
            <source src={video.video_url} type="video/mp4" />
            <source src={video.video_url} type="video/webm" />
            <source src={video.video_url} type="video/ogg" />
            Your browser does not support the video tag.
          </video>
        </div>

        {/* 📋 Video Info Card - Kenyan Themed */}
        <div className="bg-white rounded-2xl border border-gray-200 p-6 shadow-lg">
          <h1 className="text-2xl md:text-3xl font-bold text-gray-900 mb-3 leading-tight">
            {video.title}
          </h1>

          {/* Meta Info + Action Buttons */}
          <div className="flex flex-wrap items-center gap-3 mb-6 pb-6 border-b border-gray-200">
            {/* Like Button with Kenyan Accent */}
            <LikeButton 
              videoId={video.id}
              initialLikes={likeCount}
              initialIsLiked={userHasLiked}
            />
            
            {/* Views - Kenyan Styled */}
            <div className="flex items-center gap-1.5 text-sm font-medium text-gray-700 px-3 py-1.5 rounded-full bg-gray-100">
              <Eye className="h-4 w-4" style={{ color: KENYA_COLORS.red }} />
              <span>{video.views.toLocaleString('en-KE')} views</span>
            </div>
            
            {/* Date - Kenyan Styled */}
            <div className="flex items-center gap-1.5 text-sm font-medium text-gray-700 px-3 py-1.5 rounded-full bg-gray-100">
              <Calendar className="h-4 w-4" style={{ color: KENYA_COLORS.green }} />
              <span>{formatDate(video.created_at)}</span>
            </div>

            {/* 📱 Share to WhatsApp Button - Very Popular in Kenya! 🇰🇪 */}
            <button
              onClick={handleShareToWhatsApp}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-full font-semibold text-white transition-all duration-300 shadow-md hover:shadow-lg hover:-translate-y-0.5 active:translate-y-0"
              style={{ backgroundColor: KENYA_COLORS.whatsapp }}
              aria-label="Share to WhatsApp"
            >
              <Share2 className="h-4 w-4" />
              <span className="hidden sm:inline">Share on WhatsApp</span>
              <span className="sm:hidden">Share</span>
            </button>

            {/* 🔗 Copy Link Button */}
            <button
              onClick={handleCopyLink}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-full font-semibold border-2 border-gray-300 text-gray-700 transition-all duration-300 hover:border-[#bb0000] hover:text-[#bb0000] hover:bg-red-50 active:scale-95"
              aria-label="Copy link to clipboard"
            >
              <LinkIcon className="h-4 w-4" />
              <span className="text-sm">Copy Link</span>
            </button>
          </div>

          {/* 👤 Creator Info - Kenyan Accent */}
          {creator && (
            <div className="flex items-center gap-4 py-4 mb-6 bg-linear-to-r from-gray-50 to-white rounded-xl px-4 border border-gray-100">
              <Link href={`/profile/${creator.id}`} className="shrink-0">
                <div className="h-12 w-12 rounded-full flex items-center justify-center text-white font-bold text-lg shadow-md transition-transform hover:scale-105"
                     style={{ background: KENYA_GRADIENT.primary }}>
                  {creator.username?.charAt(0).toUpperCase()}
                </div>
              </Link>
              <div className="flex-1 min-w-0">
                <Link 
                  href={`/profile/${creator.id}`}
                  className="font-semibold text-gray-900 hover:text-[#bb0000] transition-colors block truncate"
                >
                  @{creator.username}
                </Link>
                {creator.full_name && (
                  <p className="text-sm text-gray-600 truncate">{creator.full_name}</p>
                )}
              </div>
              <Link
                href={`/profile/${creator.id}`}
                className="px-4 py-2 text-sm font-semibold rounded-full text-white transition-all duration-300 shadow-sm hover:shadow-md hover:-translate-y-0.5"
                style={{ background: KENYA_GRADIENT.primary }}
              >
                View Profile
              </Link>
            </div>
          )}

          {/* 📝 Description - Kenyan Styled */}
          {video.description && (
            <div className="mb-8">
              <h3 className="text-lg font-bold text-gray-900 mb-3 flex items-center gap-2">
                <span className="w-1 h-5 rounded-full" style={{ background: KENYA_GRADIENT.primary }}></span>
                Description
              </h3>
              <div className="prose prose-gray max-w-none text-gray-700 leading-relaxed">
                <p className="whitespace-pre-wrap">{video.description}</p>
              </div>
            </div>
          )}

          {/* 💬 Comments Section - Kenyan Themed */}
          <div className="mt-8 pt-8 border-t border-gray-200">
            <div className="flex items-center gap-2 mb-6">
              <MessageCircle className="h-5 w-5" style={{ color: KENYA_COLORS.green }} />
              <h3 className="text-lg font-bold text-gray-900">
                Comments
              </h3>
            </div>
            
            {/* Comment Form */}
            <div className="mb-8">
              <CommentForm 
                videoId={video.id} 
                onCommentAdded={() => {
                  // CommentList will auto-refresh via real-time subscription
                }} 
              />
            </div>

            {/* Comments List */}
            <div className="space-y-4">
              <CommentList videoId={video.id} />
            </div>
          </div>
        </div>

        {/* 🇰🇪 Footer Accent */}
        <div className="mt-8 flex justify-center">
          <div className="h-0.5 w-24 rounded-full" style={{ background: KENYA_GRADIENT.flag }}></div>
        </div>
      </div>
    </div>
  )
}