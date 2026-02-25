// app/creator-studio/VideoUploadModal.tsx
'use client'

import { useState, useCallback, useRef, useEffect } from 'react'
import { 
  Upload, X, Loader2, Check, AlertCircle, Film, 
  Edit, Trash2, Eye, EyeOff, Plus 
} from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { toast } from 'react-hot-toast'

interface VideoUploadModalProps {
  isOpen: boolean
  onClose: () => void
  userId: string
  onUploadComplete?: (videoId: string) => void
}

const KENYA_GRADIENT = 'linear-gradient(135deg, #bb0000, #007847)'

export function VideoUploadModal({ 
  isOpen, 
  onClose, 
  userId,
  onUploadComplete 
}: VideoUploadModalProps) {
  const [step, setStep] = useState<'select' | 'uploading' | 'details' | 'success'>('select')
  const [file, setFile] = useState<File | null>(null)
  const [previewUrl, setPreviewUrl] = useState<string | null>(null)
  const [uploadProgress, setUploadProgress] = useState(0)
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    visibility: 'public' as 'public' | 'private' | 'unlisted',
    thumbnail: null as File | null
  })
  const [error, setError] = useState('')
  const [isProcessing, setIsProcessing] = useState(false)
  
  const fileInputRef = useRef<HTMLInputElement>(null)
  const thumbnailInputRef = useRef<HTMLInputElement>(null)
  const supabase = createClient()

  // Reset state when modal closes
  useEffect(() => {
    if (!isOpen) {
      setStep('select')
      setFile(null)
      setPreviewUrl(null)
      setUploadProgress(0)
      setFormData({
        title: '',
        description: '',
        visibility: 'public',
        thumbnail: null
      })
      setError('')
      setIsProcessing(false)
    }
  }, [isOpen])

  // Handle file selection
  const handleFileSelect = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0]
    if (!selectedFile) return
    
    // Validate video file
    if (!selectedFile.type.startsWith('video/')) {
      setError('Please select a video file (MP4, MOV, WebM)')
      return
    }
    
    // Validate file size (max 500MB)
    if (selectedFile.size > 500 * 1024 * 1024) {
      setError('Video must be less than 500MB')
      return
    }
    
    setError('')
    setFile(selectedFile)
    
    // Create preview URL
    const url = URL.createObjectURL(selectedFile)
    setPreviewUrl(url)
    
    // Move to next step
    setStep('details')
  }, [])

  // Handle thumbnail selection
  const handleThumbnailSelect = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const thumbnail = e.target.files?.[0]
    if (!thumbnail) return
    
    if (!thumbnail.type.startsWith('image/')) {
      setError('Please select an image file for thumbnail')
      return
    }
    
    if (thumbnail.size > 5 * 1024 * 1024) {
      setError('Thumbnail must be less than 5MB')
      return
    }
    
    setFormData(prev => ({ ...prev, thumbnail }))
    setError('')
  }, [])

  // Handle form submission
  const handleSubmit = useCallback(async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!file) {
      setError('No video file selected')
      return
    }
    
    if (!formData.title.trim()) {
      setError('Please enter a title for your video')
      return
    }
    
    setIsProcessing(true)
    setStep('uploading')
    
    try {
      // Step 1: Upload video file to Supabase Storage
      const videoFileName = `${userId}/${Date.now()}-${file.name}`
      const { error: uploadError } = await supabase.storage
        .from('videos')
        .upload(videoFileName, file, {
          cacheControl: '3600',
          upsert: false,
          contentType: file.type
        })
      
      if (uploadError) throw uploadError
      
      // Simulate progress
      setUploadProgress(30)
      
      // Step 2: Upload thumbnail if provided
      let thumbnailUrl = null
      if (formData.thumbnail) {
        const thumbnailFileName = `${userId}/thumbnails/${Date.now()}-${formData.thumbnail.name}`
        const { error: thumbError } = await supabase.storage
          .from('thumbnails')
          .upload(thumbnailFileName, formData.thumbnail, {
            cacheControl: '3600',
            upsert: false
          })
        
        if (!thumbError) {
          const { data: thumbUrlData } = supabase.storage
            .from('thumbnails')
            .getPublicUrl(thumbnailFileName)
          thumbnailUrl = thumbUrlData?.publicUrl
        }
        
        setUploadProgress(60)
      }
      
      // Step 3: Get public URL for video
      const { data: videoUrlData } = supabase.storage
        .from('videos')
        .getPublicUrl(videoFileName)
      const videoUrl = videoUrlData?.publicUrl
      
      if (!videoUrl) throw new Error('Failed to get video URL')
      
      setUploadProgress(80)
      
      // Step 4: Create video record in database
      // ✅ FIX: Use 'data' property, not 'video'
      const { data: video, error: dbError } = await supabase
        .from('videos')
        .insert({
          creator_id: userId,
          title: formData.title,
          description: formData.description || null,
          video_url: videoUrl,
          thumbnail_url: thumbnailUrl,
          duration: null,
          visibility: formData.visibility,
          status: 'published',
          earnings: 0
        })
        .select()
        .single()
      
      if (dbError) throw dbError
      
      setUploadProgress(100)
      
      // Step 5: Success!
      setStep('success')
      toast.success('Video uploaded successfully!')
      
      // Notify parent component
      if (onUploadComplete && video?.id) {
        onUploadComplete(video.id)
      }
      
      // Auto-close after success
      setTimeout(() => {
        onClose()
      }, 2000)
      
    } catch (err: any) {
      console.error('Upload error:', err)
      setError(err.message || 'Failed to upload video')
      setStep('details')
      toast.error('Upload failed. Please try again.')
    } finally {
      setIsProcessing(false)
    }
  }, [file, formData, userId, onUploadComplete, onClose, supabase])

  // Handle cancel
  const handleCancel = useCallback(() => {
    if (previewUrl) {
      URL.revokeObjectURL(previewUrl)
    }
    onClose()
  }, [previewUrl, onClose])

  // Trigger file input
  const triggerFileInput = useCallback(() => {
    fileInputRef.current?.click()
  }, [])

  const triggerThumbnailInput = useCallback(() => {
    thumbnailInputRef.current?.click()
  }, [])

  if (!isOpen) return null

  return (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm"
      onClick={handleCancel}
      role="dialog"
      aria-modal="true"
      aria-labelledby="upload-modal-title"
    >
      <div 
        className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-200">
          <h3 id="upload-modal-title" className="text-lg font-semibold text-gray-900">
            {step === 'select' && 'Upload New Video'}
            {step === 'details' && 'Video Details'}
            {step === 'uploading' && 'Uploading Video'}
            {step === 'success' && 'Upload Complete!'}
          </h3>
          <button
            onClick={handleCancel}
            disabled={isProcessing}
            className="p-2 hover:bg-gray-100 rounded-full transition-colors disabled:opacity-50"
            aria-label="Close modal"
          >
            <X className="h-5 w-5 text-gray-500" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6">
          {/* Step 1: Select File */}
          {step === 'select' && (
            <div className="text-center py-8">
              <div 
                className="border-2 border-dashed border-gray-300 rounded-2xl p-8 hover:border-[#007847] transition-colors cursor-pointer"
                onClick={triggerFileInput}
              >
                <Upload className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <p className="text-lg font-medium text-gray-900 mb-2">
                  Click to upload or drag and drop
                </p>
                <p className="text-sm text-gray-500 mb-4">
                  MP4, MOV, or WebM • Max 500MB
                </p>
                <button
                  type="button"
                  className="px-6 py-2.5 rounded-full font-medium text-white"
                  style={{ background: KENYA_GRADIENT }}
                >
                  Select Video File
                </button>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="video/*"
                  onChange={handleFileSelect}
                  className="hidden"
                />
              </div>
              
              {error && (
                <div className="flex items-center gap-2 p-3 mt-4 rounded-lg bg-red-50 text-red-700 text-sm">
                  <AlertCircle className="h-4 w-4 shrink-0" />
                  <span>{error}</span>
                </div>
              )}
              
              <div className="mt-6 p-4 rounded-lg bg-gray-50 text-xs text-gray-600">
                <p className="font-medium mb-2">Tips for great videos:</p>
                <ul className="list-disc list-inside space-y-1">
                  <li>Use horizontal (16:9) format for best results</li>
                  <li>Keep videos under 15 minutes for better engagement</li>
                  <li>Add captions to reach wider audiences</li>
                  <li>Include relevant tags to help discovery</li>
                </ul>
              </div>
            </div>
          )}

          {/* Step 2: Video Details */}
          {step === 'details' && file && previewUrl && (
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Video Preview */}
              <div className="flex flex-col sm:flex-row gap-6">
                <div className="sm:w-1/2">
                  <div className="aspect-video bg-gray-100 rounded-xl overflow-hidden">
                    <video 
                      src={previewUrl} 
                      className="w-full h-full object-cover"
                      controls
                    />
                  </div>
                  <p className="text-xs text-gray-500 mt-2 text-center">
                    {file.name} • {(file.size / 1024 / 1024).toFixed(1)} MB
                  </p>
                </div>
                
                {/* Form Fields */}
                <div className="sm:w-1/2 space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Title *
                    </label>
                    <input
                      type="text"
                      value={formData.title}
                      onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
                      placeholder="Enter video title"
                      className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#bb0000]/20 focus:border-[#bb0000]"
                      required
                      maxLength={100}
                    />
                    <p className="text-xs text-gray-500 mt-1 text-right">
                      {formData.title.length}/100
                    </p>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Description
                    </label>
                    <textarea
                      value={formData.description}
                      onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                      placeholder="Tell viewers about your video"
                      rows={3}
                      className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#bb0000]/20 focus:border-[#bb0000] resize-none"
                      maxLength={500}
                    />
                    <p className="text-xs text-gray-500 mt-1 text-right">
                      {formData.description.length}/500
                    </p>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Visibility
                    </label>
                    <div className="grid grid-cols-3 gap-2">
                      {(['public', 'unlisted', 'private'] as const).map((visibility) => (
                        <button
                          key={visibility}
                          type="button"
                          onClick={() => setFormData(prev => ({ ...prev, visibility }))}
                          className={`px-3 py-2 rounded-lg text-sm font-medium border transition-colors ${
                            formData.visibility === visibility
                              ? 'border-[#bb0000] bg-[#bb0000]/10 text-[#bb0000]'
                              : 'border-gray-300 hover:bg-gray-50'
                          }`}
                        >
                          {visibility.charAt(0).toUpperCase() + visibility.slice(1)}
                        </button>
                      ))}
                    </div>
                    <p className="text-xs text-gray-500 mt-1">
                      {formData.visibility === 'public' && 'Anyone can find and watch'}
                      {formData.visibility === 'unlisted' && 'Only people with the link can watch'}
                      {formData.visibility === 'private' && 'Only you can watch'}
                    </p>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Thumbnail (Optional)
                    </label>
                    <div 
                      className="border-2 border-dashed border-gray-300 rounded-lg p-4 text-center hover:border-[#007847] transition-colors cursor-pointer"
                      onClick={triggerThumbnailInput}
                    >
                      {formData.thumbnail ? (
                        <div className="relative">
                          <img 
                            src={URL.createObjectURL(formData.thumbnail)} 
                            alt="Thumbnail preview" 
                            className="h-20 w-full object-cover rounded"
                          />
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation()
                              setFormData(prev => ({ ...prev, thumbnail: null }))
                            }}
                            className="absolute -top-2 -right-2 p-1 bg-red-500 text-white rounded-full hover:bg-red-600 transition-colors"
                          >
                            <X className="h-3 w-3" />
                          </button>
                        </div>
                      ) : (
                        <>
                          <Plus className="h-6 w-6 text-gray-400 mx-auto mb-2" />
                          <p className="text-sm text-gray-600">Add custom thumbnail</p>
                          <p className="text-xs text-gray-400">JPG or PNG • Max 5MB</p>
                        </>
                      )}
                      <input
                        ref={thumbnailInputRef}
                        type="file"
                        accept="image/*"
                        onChange={handleThumbnailSelect}
                        className="hidden"
                      />
                    </div>
                  </div>
                </div>
              </div>
              
              {error && (
                <div className="flex items-center gap-2 p-3 rounded-lg bg-red-50 text-red-700 text-sm">
                  <AlertCircle className="h-4 w-4 shrink-0" />
                  <span>{error}</span>
                </div>
              )}
              
              {/* Action Buttons */}
              <div className="flex justify-end gap-3 pt-4 border-t border-gray-100">
                <button
                  type="button"
                  onClick={() => {
                    setStep('select')
                    setError('')
                  }}
                  className="px-6 py-2.5 rounded-lg font-medium border border-gray-300 text-gray-700 hover:bg-gray-50 transition-colors"
                >
                  Back
                </button>
                <button
                  type="submit"
                  disabled={isProcessing || !formData.title.trim()}
                  className="px-6 py-2.5 rounded-lg font-medium text-white transition-all disabled:opacity-50 flex items-center gap-2"
                  style={{ background: KENYA_GRADIENT }}
                >
                  {isProcessing ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Uploading...
                    </>
                  ) : (
                    <>
                      <Upload className="h-4 w-4" />
                      Upload Video
                    </>
                  )}
                </button>
              </div>
            </form>
          )}

          {/* Step 3: Uploading */}
          {step === 'uploading' && (
            <div className="text-center py-12">
              <div className="relative mx-auto mb-6">
                <div className="animate-spin rounded-full h-16 w-16 border-4 border-transparent"
                  style={{
                    borderTopColor: '#bb0000',
                    borderRightColor: '#000000',
                    borderBottomColor: '#007847'
                  }}>
                </div>
                <Film className="absolute inset-0 m-auto h-6 w-6 text-gray-500" />
              </div>
              
              <h4 className="text-lg font-semibold text-gray-900 mb-2">Uploading Your Video</h4>
              <p className="text-gray-600 mb-6">
                {file?.name} • {(file?.size || 0 / 1024 / 1024).toFixed(1)} MB
              </p>
              
              {/* Progress Bar */}
              <div className="max-w-md mx-auto mb-6">
                <div className="flex justify-between text-sm text-gray-600 mb-2">
                  <span>Uploading...</span>
                  <span>{uploadProgress}%</span>
                </div>
                <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                  <div 
                    className="h-full rounded-full transition-all duration-300"
                    style={{ 
                      width: `${uploadProgress}%`,
                      background: KENYA_GRADIENT
                    }}
                  />
                </div>
              </div>
              
              <p className="text-sm text-gray-500">
                This may take a few minutes depending on your connection speed.
                Please don't close this window.
              </p>
            </div>
          )}

          {/* Step 4: Success */}
          {step === 'success' && (
            <div className="text-center py-12">
              <div className="h-16 w-16 mx-auto mb-4 rounded-full bg-green-100 flex items-center justify-center">
                <Check className="h-8 w-8 text-green-600" />
              </div>
              <h4 className="text-lg font-semibold text-gray-900 mb-2">Video Uploaded! 🎉</h4>
              <p className="text-gray-600 mb-6">
                Your video is now processing and will be available shortly.
              </p>
              
              <div className="flex justify-center gap-3">
                <button
                  onClick={handleCancel}
                  className="px-6 py-2.5 rounded-lg font-medium border border-gray-300 text-gray-700 hover:bg-gray-50 transition-colors"
                >
                  Close
                </button>
                <a
                  href="/creator-studio?tab=videos"
                  className="px-6 py-2.5 rounded-lg font-medium text-white"
                  style={{ background: KENYA_GRADIENT }}
                >
                  View My Videos
                </a>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}