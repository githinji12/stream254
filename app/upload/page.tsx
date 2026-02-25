// app/upload/page.tsx
'use client'

import { useState, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { useRequireAuth } from '@/lib/auth-utils'
import { createClient } from '@/lib/supabase/client'
import { Upload, X, CheckCircle, AlertCircle, Loader2, RefreshCw, Video } from 'lucide-react'

export default function UploadPage() {
  const { user, loading: authLoading } = useRequireAuth()
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [videoFile, setVideoFile] = useState<File | null>(null)
  const [uploading, setUploading] = useState(false)
  const [uploadProgress, setUploadProgress] = useState(0)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)
  const [estimatedTime, setEstimatedTime] = useState('')
  const router = useRouter()
  const supabase = createClient()
  const abortControllerRef = useRef<AbortController | null>(null)

  const MAX_FILE_SIZE = 25 * 1024 * 1024
  const ALLOWED_TYPES = ['video/mp4', 'video/webm', 'video/ogg']

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    if (!ALLOWED_TYPES.includes(file.type)) {
      setError('Please upload MP4, WebM, or OGG format')
      return
    }

    if (file.size > MAX_FILE_SIZE) {
      setError('File must be under 25MB. Compress with HandBrake first.')
      return
    }

    const uploadSpeedMbps = 2
    const sizeMB = file.size / (1024 * 1024)
    const estimatedSeconds = Math.ceil((sizeMB * 8) / uploadSpeedMbps)
    setEstimatedTime(
      estimatedSeconds < 60 
        ? `~${estimatedSeconds} seconds` 
        : `~${Math.ceil(estimatedSeconds / 60)} minute${estimatedSeconds > 120 ? 's' : ''}`
    )

    setVideoFile(file)
    setError('')
  }

  const handleUpload = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!videoFile || !title) {
      setError('Please fill in all required fields')
      return
    }

    setUploading(true)
    setError('')
    setUploadProgress(0)
    
    abortControllerRef.current = new AbortController()
    const timeoutId = setTimeout(() => {
      abortControllerRef.current?.abort()
      setError('Upload timed out. Please try again with a smaller file.')
      setUploading(false)
    }, 5 * 60 * 1000)

    try {
      const sessionResult = await supabase.auth.getSession()
      if (sessionResult.error) throw sessionResult.error
      if (!sessionResult.data?.session) {
        throw new Error('You must be logged in to upload')
      }
      
      const userId = sessionResult.data.session.user.id

      const fileExt = videoFile.name.split('.').pop()
      const fileName = `${userId}-${Date.now()}.${fileExt}`
      const filePath = fileName

      const sizeMB = videoFile.size / (1024 * 1024)
      const simulateProgress = () => {
        let progress = 0
        const interval = setInterval(() => {
          if (progress >= 90) {
            clearInterval(interval)
            return
          }
          const increment = Math.max(1, Math.floor(90 / (sizeMB * 0.5)))
          progress = Math.min(90, progress + increment)
          setUploadProgress(progress)
        }, 200)
        return () => clearInterval(interval)
      }
      
      const stopProgress = simulateProgress()

      const uploadResult = await supabase.storage
        .from('videos')
        .upload(filePath, videoFile, {
          cacheControl: '3600',
          upsert: true,
          contentType: videoFile.type || 'video/mp4',
        })

      stopProgress()
      setUploadProgress(95)

      if (uploadResult.error) throw uploadResult.error

      const urlResult = supabase.storage
        .from('videos')
        .getPublicUrl(filePath)

      const publicUrl = urlResult.data.publicUrl

      const insertResult = await supabase
        .from('videos')
        .insert({
          creator_id: userId,
          title,
          description,
          video_url: publicUrl,
          duration: 0,
        })
        .select()
        .single()

      if (insertResult.error) throw insertResult.error

      setUploadProgress(100)
      setSuccess(true)

      setTimeout(() => {
        router.push('/')
      }, 1500)

    } catch (err: any) {
      console.error('Upload failed:', err)
      
      if (err.name === 'AbortError') {
        setError('Upload took too long. Try a smaller video (<10MB)')
      } else {
        if (err.message?.includes('timeout')) {
          setError('Connection timeout. Check your internet and try again.')
        } else if (err.message?.includes('network')) {
          setError('Network error. Please check your connection.')
        } else if (err.message?.includes('quota')) {
          setError('Storage quota exceeded. Contact support.')
        } else {
          setError(err.message || 'Upload failed. Please try again.')
        }
      }
    } finally {
      clearTimeout(timeoutId)
      abortControllerRef.current = null
      setUploading(false)
      if (!success) setUploadProgress(0)
    }
  }

  useState(() => () => {
    abortControllerRef.current?.abort()
  })

  if (authLoading) {
    return (
      <div className="min-h-[calc(100vh-4rem)] flex items-center justify-center pattern-savanna">
        <div className="text-center">
          <div className="spinner-kenya h-12 w-12 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    )
  }

  if (!user) {
    return null
  }

  return (
    <div className="min-h-[calc(100vh-4rem)] py-8 px-4 pattern-savanna">
      {/* Kenyan Flag Stripe */}
      <div className="fixed top-16 left-0 right-0 kenya-stripe z-30" />

      <div className="max-w-2xl mx-auto">
        {/* Header with Kenyan styling */}
        <div className="mb-8 text-center">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl mb-4" style={{ background: 'linear-gradient(135deg, #bb0000, #007847)' }}>
            <Video className="h-8 w-8 text-white" />
          </div>
          <h1 className="text-3xl font-bold">
            <span style={{ color: '#bb0000' }}>Upload</span>
            <span style={{ color: '#000000' }}> Video</span>
          </h1>
          <p className="mt-2 text-gray-600">
            Share your content with <span className="font-semibold" style={{ color: '#007847' }}>Stream254</span>
          </p>
        </div>

        {success ? (
          <div className="card-kenya p-6 text-center">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-full mb-4" style={{ background: '#f0fdf4' }}>
              <CheckCircle className="h-8 w-8" style={{ color: '#007847' }} />
            </div>
            <h2 className="text-xl font-semibold text-gray-900 mb-2">Upload Successful!</h2>
            <p className="text-gray-600">Redirecting to homepage...</p>
          </div>
        ) : (
          <div className="card-kenya p-6 sm:p-8">
            <form onSubmit={handleUpload} className="space-y-6">
              {/* Error with Retry */}
              {error && (
                <div className="flex items-start gap-3 p-4 rounded-lg" style={{ background: '#fef2f2', border: '1px solid #fecaca' }}>
                  <AlertCircle className="h-5 w-5 shrink-0 mt-0.5" style={{ color: '#dc2626' }} />
                  <div className="flex-1">
                    <p className="text-sm" style={{ color: '#dc2626' }}>{error}</p>
                    <button
                      type="button"
                      onClick={() => {
                        setError('')
                        setUploading(false)
                        setUploadProgress(0)
                      }}
                      className="mt-2 text-sm font-medium hover:underline flex items-center gap-1"
                      style={{ color: '#bb0000' }}
                    >
                      <RefreshCw className="h-3 w-3" />
                      Try Again
                    </button>
                  </div>
                </div>
              )}

              {/* Title */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Title <span style={{ color: '#bb0000' }}>*</span>
                </label>
                <input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="input-kenya"
                  placeholder="Enter video title"
                  required
                  disabled={uploading}
                />
              </div>

              {/* Description */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Description
                </label>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  rows={4}
                  className="input-kenya resize-none"
                  placeholder="Tell viewers about your video..."
                  disabled={uploading}
                />
              </div>

              {/* Compression Tip - Kenyan styled */}
              <div className="p-4 rounded-lg" style={{ background: '#f0f9ff', border: '1px solid #bae6fd' }}>
                <p className="text-sm" style={{ color: '#0369a1' }}>
                  💡 <strong>Pro Tip:</strong> Compress videos before uploading for faster uploads.
                  Use <a href="https://handbrake.fr" target="_blank" className="font-medium hover:underline" style={{ color: '#bb0000' }}>HandBrake</a> (free) 
                  or <a href="https://cloudconvert.com" target="_blank" className="font-medium hover:underline" style={{ color: '#bb0000' }}>CloudConvert</a>.
                </p>
              </div>

              {/* File Upload - Kenyan styled dropzone */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Video File <span style={{ color: '#bb0000' }}>*</span>
                </label>
                
                {!videoFile ? (
                  <label className="flex flex-col items-center justify-center w-full h-48 border-2 border-dashed rounded-xl cursor-pointer transition-all duration-300"
                    style={{ 
                      borderColor: '#d1d5db',
                      background: 'linear-gradient(to bottom, #ffffff, #fafafa)'
                    }}
                    onMouseEnter={(e) => e.currentTarget.style.borderColor = '#bb0000'}
                    onMouseLeave={(e) => e.currentTarget.style.borderColor = '#d1d5db'}
                  >
                    <div className="flex flex-col items-center justify-center pt-5 pb-6">
                      <div className="p-3 rounded-full mb-3" style={{ background: '#fef2f2' }}>
                        <Upload className="h-8 w-8" style={{ color: '#bb0000' }} />
                      </div>
                      <p className="text-sm text-gray-600">
                        <span className="font-semibold" style={{ color: '#bb0000' }}>Click to upload</span> or drag and drop
                      </p>
                      <p className="text-xs text-gray-500 mt-1">
                        MP4, WebM, or OGG • Max 25MB
                      </p>
                    </div>
                    <input
                      type="file"
                      accept="video/*"
                      onChange={handleFileChange}
                      className="hidden"
                      required
                      disabled={uploading}
                    />
                  </label>
                ) : (
                  <div className="flex items-center justify-between w-full p-4 rounded-xl border"
                    style={{ background: '#f0fdf4', borderColor: '#bbf7d0' }}
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="p-2 rounded-full" style={{ background: '#dcfce7' }}>
                        <CheckCircle className="h-5 w-5" style={{ color: '#007847' }} />
                      </div>
                      <div className="min-w-0">
                        <p className="text-sm font-medium text-gray-900 truncate">{videoFile.name}</p>
                        <p className="text-xs text-gray-500">
                          {(videoFile.size / (1024 * 1024)).toFixed(2)} MB
                          {estimatedTime && <span className="ml-2">• Est. {estimatedTime}</span>}
                        </p>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => {
                        setVideoFile(null)
                        setEstimatedTime('')
                        setError('')
                      }}
                      className="p-2 rounded-full hover:bg-red-50 transition-colors shrink-0"
                      disabled={uploading}
                    >
                      <X className="h-5 w-5" style={{ color: '#6b7280' }} />
                    </button>
                  </div>
                )}
              </div>

              {/* Progress Bar - Kenyan colors */}
              {uploading && (
                <div className="space-y-3 p-4 rounded-xl border" style={{ background: '#fafafa', borderColor: '#e5e7eb' }}>
                  <div className="flex justify-between items-center text-sm">
                    <span className="font-medium text-gray-700">Uploading...</span>
                    <span className="font-medium" style={{ color: '#bb0000' }}>{uploadProgress}%</span>
                  </div>
                  <div className="w-full rounded-full h-3 overflow-hidden" style={{ background: '#e5e7eb' }}>
                    <div
                      className="h-3 rounded-full transition-all duration-300 ease-out"
                      style={{ 
                        width: `${uploadProgress}%`,
                        background: 'linear-gradient(to right, #bb0000, #007847)'
                      }}
                    ></div>
                  </div>
                  <p className="text-xs text-gray-500 text-center">
                    {uploadProgress < 90 
                      ? 'Uploading to server... Do not close this tab' 
                      : 'Finalizing... Almost done!'}
                  </p>
                </div>
              )}

              {/* Submit Button - Kenyan primary */}
              <button
                type="submit"
                disabled={uploading || !videoFile || !title}
                className="btn-kenya-primary w-full justify-center disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {uploading ? (
                  <>
                    <Loader2 className="h-5 w-5 animate-spin" />
                    Uploading... {uploadProgress}%
                  </>
                ) : (
                  <>
                    <Upload className="h-5 w-5" />
                    Upload Video
                  </>
                )}
              </button>

              {/* Helper Text */}
              <p className="text-xs text-gray-500 text-center">
                Having trouble? Try videos under 10MB for fastest uploads.
              </p>
            </form>
          </div>
        )}

       
      </div>
    </div>
  )
}