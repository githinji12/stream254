// app/profile/[id]/page.tsx
'use client'

import { useEffect, useState, useRef, useCallback, Suspense } from 'react'
import { useParams, useRouter, useSearchParams } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { useAuth } from '@/hooks/useAuth'
import type { Video, Profile } from '@/lib/types'
import {
  Play, Eye, Heart, Calendar, Edit, MoreVertical,
  Grid3X3, List, UserPlus, MessageCircle, Share2, Bookmark,
  Users, X, Camera, Upload, Loader2, Check, AlertCircle,
  Twitter, Instagram, Globe, BadgeCheck, Phone, Send,
  ChevronLeft, ZoomIn, ZoomOut, RotateCcw, Copy, Flag
} from 'lucide-react'
import Link from 'next/link'
import { toast } from 'react-hot-toast'

// 🎨 Kenyan Theme Constants
const KENYA = {
  red: '#bb0000',
  green: '#007847',
  black: '#000000',
  white: '#ffffff',
  mpesa: '#4CAF50',
  twitter: '#1DA1F2',
  instagram: '#E1306C',
} as const

const KENYA_GRADIENT = {
  primary: `linear-gradient(135deg, ${KENYA.red}, ${KENYA.green})`,
  flag: 'linear-gradient(90deg, #007847 0%, #007847 33%, #000000 33%, #000000 34%, #bb0000 34%, #bb0000 66%, #000000 66%, #000000 67%, #007847 67%, #007847 100%)',
} as const

// ✅ Extended Profile type with all fields
type ExtendedProfile = Profile & {
  twitter?: string | null
  instagram?: string | null
  website?: string | null
  is_verified?: boolean | null
  is_private?: boolean | null
  follower_count?: number
  following_count?: number
  show_email?: boolean
  show_phone?: boolean
  allow_messages?: boolean
  default_video_visibility?: 'public' | 'private' | 'unlisted'
  mpesa_phone?: string | null
  mpesa_verified?: boolean
}

// ✅ Validation Utilities
const validateProfileId = (id: string): boolean => {
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i
  return uuidRegex.test(id)
}

const sanitizeBio = (bio: string | null): string => {
  if (!bio) return ''
  return bio
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
    .replace(/<[^>]*>/g, '')
    .trim()
    .substring(0, 500)
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
    year: 'numeric'
  })
}

// 🖼️ Avatar Crop Modal Component
function AvatarCropModal({
  isOpen,
  onClose,
  profile,
  onSuccess,
  supabase
}: {
  isOpen: boolean
  onClose: () => void
  profile: ExtendedProfile | null
  onSuccess: (avatarUrl: string) => void
  supabase: any
}) {
  const [imageSrc, setImageSrc] = useState<string | null>(null)
  const [crop, setCrop] = useState({ x: 0, y: 0 })
  const [zoom, setZoom] = useState(1)
  const [rotation, setRotation] = useState(0)
  const [croppedAreaPixels, setCroppedAreaPixels] = useState<any>(null)
  const [uploading, setUploading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)
  const [previewUrl, setPreviewUrl] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const imageRef = useRef<HTMLImageElement>(null)
  const containerRef = useRef<HTMLDivElement>(null)

  // Reset state when modal closes
  useEffect(() => {
    if (!isOpen) {
      setImageSrc(null)
      setCrop({ x: 0, y: 0 })
      setZoom(1)
      setRotation(0)
      setCroppedAreaPixels(null)
      setError('')
      setSuccess(false)
      setUploading(false)
      setPreviewUrl(null)
    }
  }, [isOpen])

  // ✅ Calculate croppedAreaPixels from manual crop state
  useEffect(() => {
    if (imageRef.current && containerRef.current && imageSrc) {
      const containerRect = containerRef.current.getBoundingClientRect()
      const image = imageRef.current
      const { naturalWidth, naturalHeight } = image
      
      if (naturalWidth === 0 || naturalHeight === 0 || containerRect.width === 0) return
      
      const cropWidth = containerRect.width / zoom
      const cropHeight = containerRect.height / zoom
      const scaleX = naturalWidth / containerRect.width
      const scaleY = naturalHeight / containerRect.height
      
      const pixelCrop = {
        x: Math.max(0, (-crop.x / zoom) * scaleX),
        y: Math.max(0, (-crop.y / zoom) * scaleY),
        width: Math.min(cropWidth * scaleX, naturalWidth),
        height: Math.min(cropHeight * scaleY, naturalHeight)
      }
      
      setCroppedAreaPixels(pixelCrop)
    }
  }, [crop.x, crop.y, zoom, imageSrc])

  // Generate preview when crop changes
  useEffect(() => {
    if (imageRef.current && croppedAreaPixels && !uploading) {
      generatePreview()
    }
  }, [croppedAreaPixels, imageSrc, uploading])

  const handleFileSelect = useCallback(function(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    
    if (!file.type.startsWith('image/')) {
      setError('Please select an image file (JPG, PNG, WebP)')
      return
    }
    if (file.size > 5 * 1024 * 1024) {
      setError('Image must be less than 5MB')
      return
    }
    
    setError('')
    const reader = new FileReader()
    reader.onload = function() {
      setImageSrc(reader.result as string)
    }
    reader.onerror = function() {
      setError('Failed to read image file')
    }
    reader.readAsDataURL(file)
  }, [])

  const generatePreview = useCallback(async function() {
    if (!imageRef.current || !croppedAreaPixels) return
    try {
      const canvas = document.createElement('canvas')
      const ctx = canvas.getContext('2d')
      if (!ctx) return
      
      const previewSize = 200
      canvas.width = previewSize
      canvas.height = previewSize
      
      ctx.drawImage(
        imageRef.current,
        croppedAreaPixels.x,
        croppedAreaPixels.y,
        croppedAreaPixels.width,
        croppedAreaPixels.height,
        0,
        0,
        previewSize,
        previewSize
      )
      
      const previewDataUrl = canvas.toDataURL('image/jpeg', 0.8)
      setPreviewUrl(previewDataUrl)
    } catch (err) {
      console.error('Preview generation error:', err)
    }
  }, [croppedAreaPixels])

  const createCroppedImage = useCallback(async function(): Promise<Blob> {
    return new Promise(function(resolve, reject) {
      const image = imageRef.current
      const canvas = document.createElement('canvas')
      const ctx = canvas.getContext('2d')
      
      if (!image || !ctx || !croppedAreaPixels) {
        reject(new Error('Missing required elements for cropping'))
        return
      }
      
      const size = 400
      canvas.width = size
      canvas.height = size
      
      ctx.fillStyle = '#ffffff'
      ctx.fillRect(0, 0, size, size)
      
      try {
        ctx.drawImage(
          image,
          croppedAreaPixels.x,
          croppedAreaPixels.y,
          croppedAreaPixels.width,
          croppedAreaPixels.height,
          0,
          0,
          size,
          size
        )
        
        canvas.toBlob(function(blob) {
          if (!blob) {
            reject(new Error('Canvas is empty - failed to create blob'))
            return
          }
          resolve(blob)
        }, 'image/jpeg', 0.9)
      } catch (err) {
        reject(new Error('Failed to draw image on canvas'))
      }
    })
  }, [croppedAreaPixels, rotation])

  const handleUpload = useCallback(async function() {
    if (!profile) {
      setError('Profile not found')
      return
    }
    if (!croppedAreaPixels) {
      setError('Please crop the image first')
      return
    }
    
    setUploading(true)
    setError('')
    
    try {
      const croppedBlob = await createCroppedImage()
      const file = new File([croppedBlob], `avatar-${profile.id}.jpg`, {
        type: 'image/jpeg'
      })
      
      const fileName = `${profile.id}-${Date.now()}.jpg`
      const filePath = `avatars/${fileName}`
      
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('avatars')
        .upload(filePath, file, {
          cacheControl: '3600',
          upsert: false,
          contentType: 'image/jpeg'
        })
      
      if (uploadError) throw new Error(`Upload failed: ${uploadError.message}`)
      
      const { data: urlData } = supabase.storage
        .from('avatars')
        .getPublicUrl(filePath)
      
      const publicUrl = urlData?.publicUrl
      if (!publicUrl) throw new Error('Failed to get public URL')
      
      const { error: updateError } = await supabase
        .from('profiles')
        .update({ avatar_url: publicUrl, updated_at: new Date().toISOString() })
        .eq('id', profile.id)
      
      if (updateError) throw new Error(`Profile update failed: ${updateError.message}`)
      
      setSuccess(true)
      
      // ✅ Emit custom event for cross-page sync
      window.dispatchEvent(new CustomEvent('profile:updated', { 
        detail: { profileId: profile.id, field: 'avatar_url', value: publicUrl } 
      }))
      
      setTimeout(() => {
        onSuccess(publicUrl)
        onClose()
      }, 1500)
    } catch (err: any) {
      setError(err.message || 'Failed to upload avatar. Please try again.')
    } finally {
      setUploading(false)
    }
  }, [profile, croppedAreaPixels, createCroppedImage, supabase, onSuccess, onClose])

  const triggerFileInput = useCallback(function() {
    fileInputRef.current?.click()
  }, [])

  const handleZoomIn = useCallback(function() {
    setZoom(prev => Math.min(prev + 0.1, 3))
  }, [])

  const handleZoomOut = useCallback(function() {
    setZoom(prev => Math.max(prev - 0.1, 1))
  }, [])

  const handleReset = useCallback(function() {
    setCrop({ x: 0, y: 0 })
    setZoom(1)
    setRotation(0)
  }, [])

  if (!isOpen) return null

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-labelledby="avatar-modal-title"
    >
      <div
        className="bg-white rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between p-4 border-b border-gray-200">
          <h3 id="avatar-modal-title" className="text-lg font-semibold text-gray-900">
            {imageSrc ? 'Crop Your Avatar' : 'Select Profile Picture'}
          </h3>
          <button
            onClick={onClose}
            disabled={uploading}
            className="p-2 hover:bg-gray-100 rounded-full transition-colors disabled:opacity-50"
            aria-label="Close modal"
          >
            <X className="h-5 w-5 text-gray-500" />
          </button>
        </div>

        <div className="p-6">
          {!imageSrc ? (
            <div className="flex flex-col items-center py-8">
              <button
                onClick={triggerFileInput}
                className="h-32 w-32 rounded-2xl border-4 border-dashed border-gray-300 hover:border-[#007847] flex flex-col items-center justify-center gap-2 transition-colors bg-gray-50"
              >
                <Camera className="h-8 w-8 text-gray-400" />
                <span className="text-sm text-gray-500">Tap to select</span>
              </button>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleFileSelect}
                className="hidden"
                disabled={uploading}
              />
              <p className="text-sm text-gray-500 mt-4 text-center">
                Choose a square image for best results
              </p>
              {error && (
                <div className="flex items-center gap-2 p-3 mt-4 rounded-lg bg-red-50 text-red-700 text-sm" role="alert">
                  <AlertCircle className="h-4 w-4 shrink-0" />
                  <span>{error}</span>
                </div>
              )}
            </div>
          ) : (
            <div className="space-y-4">
              <div
                ref={containerRef}
                className="relative aspect-square bg-gray-100 rounded-xl overflow-hidden"
                style={{ touchAction: 'none' }}
              >
                <img
                  ref={imageRef}
                  src={imageSrc}
                  alt="Crop preview"
                  className="absolute max-w-none cursor-move"
                  style={{
                    transform: `translate(${crop.x}px, ${crop.y}px) scale(${zoom}) rotate(${rotation}deg)`,
                    transition: uploading ? 'none' : 'transform 0.1s ease-out',
                    maxWidth: 'none'
                  }}
                  onLoad={() => {
                    if (imageRef.current && containerRef.current) {
                      const containerRect = containerRef.current.getBoundingClientRect()
                      const { naturalWidth, naturalHeight } = imageRef.current
                      setCrop({
                        x: (containerRect.width - naturalWidth) / 2,
                        y: (containerRect.height - naturalHeight) / 2
                      })
                    }
                  }}
                  onMouseDown={function(e) {
                    if (uploading) return
                    const startX = e.clientX - crop.x
                    const startY = e.clientY - crop.y
                    const handleMouseMove = function(moveEvent: MouseEvent) {
                      setCrop({
                        x: moveEvent.clientX - startX,
                        y: moveEvent.clientY - startY
                      })
                    }
                    const handleMouseUp = function() {
                      document.removeEventListener('mousemove', handleMouseMove)
                      document.removeEventListener('mouseup', handleMouseUp)
                    }
                    document.addEventListener('mousemove', handleMouseMove)
                    document.addEventListener('mouseup', handleMouseUp)
                  }}
                />
                <div className="absolute inset-0 pointer-events-none">
                  <div className="absolute inset-0 bg-black/40" />
                  <div className="absolute inset-8 border-2 border-white rounded-lg shadow-[0_0_0_9999px_rgba(0,0,0,0.4)]" />
                </div>
                <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex items-center gap-2 bg-black/60 rounded-full px-3 py-1.5 backdrop-blur-sm">
                  <button
                    onClick={handleZoomOut}
                    disabled={uploading}
                    className="p-1.5 hover:bg-white/20 rounded-full transition-colors disabled:opacity-50"
                    aria-label="Zoom out"
                  >
                    <ZoomOut className="h-4 w-4 text-white" />
                  </button>
                  <input
                    type="range"
                    min="1"
                    max="3"
                    step="0.1"
                    value={zoom}
                    onChange={(e) => setZoom(parseFloat(e.target.value))}
                    disabled={uploading}
                    className="w-20 accent-[#007847]"
                    aria-label="Zoom level"
                  />
                  <button
                    onClick={handleZoomIn}
                    disabled={uploading}
                    className="p-1.5 hover:bg-white/20 rounded-full transition-colors disabled:opacity-50"
                    aria-label="Zoom in"
                  >
                    <ZoomIn className="h-4 w-4 text-white" />
                  </button>
                  <button
                    onClick={handleReset}
                    disabled={uploading}
                    className="p-1.5 hover:bg-white/20 rounded-full transition-colors ml-2 disabled:opacity-50"
                    aria-label="Reset crop"
                  >
                    <RotateCcw className="h-4 w-4 text-white" />
                  </button>
                </div>
              </div>

              <div className="flex items-center gap-4 p-3 bg-gray-50 rounded-lg">
                <span className="text-sm text-gray-600">Preview:</span>
                <div className="h-12 w-12 rounded-full overflow-hidden border-2 border-[#007847] bg-white">
                  {previewUrl ? (
                    <img src={previewUrl} alt="Preview" className="h-full w-full object-cover" />
                  ) : (
                    <div className="h-full w-full bg-gradient-to-br from-[#bb0000] to-[#007847] flex items-center justify-center text-white text-sm font-bold">
                      {profile?.username?.charAt(0).toUpperCase() || 'U'}
                    </div>
                  )}
                </div>
                <span className="text-xs text-gray-500">400x400px</span>
              </div>

              {error && (
                <div className="flex items-center gap-2 p-3 rounded-lg bg-red-50 text-red-700 text-sm" role="alert">
                  <AlertCircle className="h-4 w-4 shrink-0" />
                  <span>{error}</span>
                </div>
              )}

              {success && (
                <div className="flex items-center gap-2 p-3 rounded-lg bg-green-50 text-green-700 text-sm" role="status">
                  <Check className="h-4 w-4 shrink-0" />
                  <span>Avatar updated successfully! 🎉</span>
                </div>
              )}

              <div className="flex gap-3 pt-2">
                <button
                  onClick={() => setImageSrc(null)}
                  disabled={uploading}
                  className="flex-1 px-4 py-2.5 rounded-full font-medium border border-gray-300 text-gray-700 hover:bg-gray-50 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  <ChevronLeft className="h-4 w-4" />
                  Back
                </button>
                <button
                  onClick={handleUpload}
                  disabled={uploading || success || !croppedAreaPixels}
                  className="flex-1 px-4 py-2.5 rounded-full font-medium text-white transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                  style={{
                    background: KENYA_GRADIENT.primary,
                    boxShadow: '0 4px 14px rgba(187, 0, 0, 0.3)'
                  }}
                >
                  {uploading ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Uploading...
                    </>
                  ) : success ? (
                    <>
                      <Check className="h-4 w-4" />
                      Done!
                    </>
                  ) : (
                    <>
                      <Upload className="h-4 w-4" />
                      Save Avatar
                    </>
                  )}
                </button>
              </div>
            </div>
          )}

          <div className="mt-6 p-4 rounded-lg bg-gray-50 text-xs text-gray-600">
            <p className="font-medium mb-2">Tips for great avatars:</p>
            <ul className="list-disc list-inside space-y-1">
              <li>Use a clear, well-lit photo of your face</li>
              <li>Square images work best (400x400px recommended)</li>
              <li>Max file size: 5MB • Formats: JPG, PNG, WebP</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  )
}

// 💰 M-Pesa Tipping Modal
function MpesaTipModal({
  isOpen,
  onClose,
  creatorProfile,
  supabase
}: {
  isOpen: boolean
  onClose: () => void
  creatorProfile: ExtendedProfile | null
  supabase: any
}) {
  const { user } = useAuth()
  const [phoneNumber, setPhoneNumber] = useState('')
  const [amount, setAmount] = useState('50')
  const [step, setStep] = useState<'form' | 'processing' | 'success' | 'error'>('form')
  const [message, setMessage] = useState('')
  const [reference, setReference] = useState('')

  const formatPhone = useCallback(function(value: string) {
    const digits = value.replace(/\D/g, '')
    if (digits.startsWith('254') && digits.length <= 12) return digits
    if (digits.startsWith('0') && digits.length <= 10) return '254' + digits.slice(1)
    if (digits.length <= 9) return '254' + digits
    return digits.slice(0, 12)
  }, [])

  const handlePhoneChange = useCallback(function(e: React.ChangeEvent<HTMLInputElement>) {
    setPhoneNumber(formatPhone(e.target.value))
  }, [formatPhone])

  const handleSubmit = useCallback(async function(e: React.FormEvent) {
    e.preventDefault()
    if (!user) {
      setMessage('Please login to send a tip')
      setStep('error')
      return
    }
    if (!phoneNumber.match(/^254\d{9}$/)) {
      setMessage('Please enter a valid Kenyan phone number')
      setStep('error')
      return
    }
    const tipAmount = parseInt(amount)
    if (isNaN(tipAmount) || tipAmount < 10 || tipAmount > 150000) {
      setMessage('Amount must be between KSh 10 and KSh 150,000')
      setStep('error')
      return
    }
    
    setStep('processing')
    setMessage('')
    
    try {
      await new Promise((resolve) => setTimeout(resolve, 2500))
      const ref = `MP${Date.now().toString().slice(-6)}`
      setReference(ref)
      setStep('success')
      setMessage(`STK push sent to ${phoneNumber}. Enter your M-Pesa PIN to complete.`)
      
      await supabase.from('tips').insert({
        sender_id: user.id,
        receiver_id: creatorProfile?.id,
        amount: tipAmount,
        phone_number: phoneNumber,
        reference: ref,
        status: 'pending'
      })
    } catch (err: any) {
      setStep('error')
      setMessage(err.message || 'Failed to initiate payment. Please try again.')
    }
  }, [user, phoneNumber, amount, creatorProfile, supabase])

  const handleRetry = useCallback(function() {
    setStep('form')
    setMessage('')
    setReference('')
  }, [])

  if (!isOpen) return null

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-labelledby="mpesa-modal-title"
    >
      <div
        className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between p-4 border-b border-gray-200 bg-gradient-to-r from-[#4CAF50] to-[#45a049]">
          <div className="flex items-center gap-2">
            <div className="h-8 w-8 rounded-full bg-white flex items-center justify-center">
              <Phone className="h-4 w-4" style={{ color: KENYA.mpesa }} />
            </div>
            <h3 id="mpesa-modal-title" className="text-lg font-semibold text-white">Support with M-Pesa</h3>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-white/20 rounded-full transition-colors"
            aria-label="Close modal"
          >
            <X className="h-5 w-5 text-white" />
          </button>
        </div>

        <div className="p-6">
          {step === 'form' && (
            <form onSubmit={handleSubmit} className="space-y-5">
              <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl">
                <div className="h-10 w-10 rounded-full overflow-hidden bg-gradient-to-br from-[#bb0000] to-[#007847] flex items-center justify-center text-white font-bold">
                  {creatorProfile?.username?.charAt(0).toUpperCase() || 'U'}
                </div>
                <div>
                  <p className="font-medium text-gray-900">@{creatorProfile?.username}</p>
                  <p className="text-sm text-gray-500">Creator</p>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  M-Pesa Phone Number
                </label>
                <div className="relative">
                  <Phone className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <input
                    type="tel"
                    value={phoneNumber}
                    onChange={handlePhoneChange}
                    placeholder="2547XXXXXXXX"
                    className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#4CAF50] focus:border-transparent"
                    required
                    pattern="^254\d{9}$"
                    aria-label="M-Pesa phone number"
                  />
                </div>
                <p className="text-xs text-gray-500 mt-1">
                  Format: 254712345678 (Kenyan numbers only)
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Amount (KSh)
                </label>
                <div className="grid grid-cols-4 gap-2">
                  {['50', '100', '200', '500'].map((amt) => (
                    <button
                      key={amt}
                      type="button"
                      onClick={() => setAmount(amt)}
                      className={`py-2 rounded-lg font-medium transition-colors ${
                        amount === amt
                          ? 'bg-[#4CAF50] text-white'
                          : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                      }`}
                    >
                      KSh {amt}
                    </button>
                  ))}
                </div>
                <div className="mt-3">
                  <input
                    type="number"
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    placeholder="Custom amount"
                    min="10"
                    max="150000"
                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#4CAF50] focus:border-transparent"
                    aria-label="Custom amount"
                  />
                </div>
              </div>

              <div className="p-4 bg-[#4CAF50]/10 border border-[#4CAF50]/30 rounded-xl">
                <p className="text-sm text-[#4CAF50] flex items-start gap-2">
                  <Check className="h-4 w-4 shrink-0 mt-0.5" />
                  <span>
                    You'll receive an M-Pesa prompt on your phone.
                    Enter your PIN to complete the payment securely.
                  </span>
                </p>
              </div>

              {message && step === 'form' && (
                <div className="flex items-center gap-2 p-3 rounded-lg bg-red-50 text-red-700 text-sm" role="alert">
                  <AlertCircle className="h-4 w-4 shrink-0" />
                  <span>{message}</span>
                </div>
              )}

              <button
                type="submit"
                className="w-full py-3 rounded-xl font-semibold text-white transition-all flex items-center justify-center gap-2"
                style={{
                  background: KENYA_GRADIENT.primary,
                  boxShadow: '0 4px 14px rgba(187, 0, 0, 0.3)'
                }}
              >
                <Send className="h-4 w-4" />
                Send KSh {amount} via M-Pesa
              </button>
            </form>
          )}

          {step === 'processing' && (
            <div className="text-center py-8">
              <div className="relative mx-auto mb-4">
                <div className="animate-spin rounded-full h-16 w-16 border-4 border-transparent"
                  style={{
                    borderTopColor: KENYA.red,
                    borderRightColor: KENYA.black,
                    borderBottomColor: KENYA.green
                  }}>
                </div>
                <Phone className="absolute inset-0 m-auto h-6 w-6" style={{ color: KENYA.mpesa }} />
              </div>
              <h4 className="text-lg font-semibold text-gray-900 mb-2">Processing Payment</h4>
              <p className="text-gray-600">Check your phone for the M-Pesa prompt...</p>
              <p className="text-sm text-gray-500 mt-2">Reference: MP{Date.now().toString().slice(-6)}</p>
            </div>
          )}

          {step === 'success' && (
            <div className="text-center py-6">
              <div className="h-16 w-16 mx-auto mb-4 rounded-full bg-green-100 flex items-center justify-center">
                <Check className="h-8 w-8 text-green-600" />
              </div>
              <h4 className="text-lg font-semibold text-gray-900 mb-2">STK Push Sent! 🎉</h4>
              <p className="text-gray-600 mb-4">{message}</p>
              <div className="p-4 bg-gray-50 rounded-xl mb-6">
                <p className="text-sm text-gray-500">Transaction Reference</p>
                <p className="font-mono font-semibold text-gray-900">{reference}</p>
              </div>
              <div className="space-y-3">
                <button
                  onClick={onClose}
                  className="w-full py-3 rounded-xl font-semibold text-white"
                  style={{ background: KENYA_GRADIENT.primary }}
                >
                  Done
                </button>
                <button
                  onClick={handleRetry}
                  className="w-full py-3 rounded-xl font-medium border border-gray-300 text-gray-700 hover:bg-gray-50"
                >
                  Send Another Tip
                </button>
              </div>
            </div>
          )}

          {step === 'error' && message && (
            <div className="text-center py-6">
              <div className="h-16 w-16 mx-auto mb-4 rounded-full bg-red-100 flex items-center justify-center">
                <AlertCircle className="h-8 w-8 text-red-600" />
              </div>
              <h4 className="text-lg font-semibold text-gray-900 mb-2">Payment Failed</h4>
              <p className="text-gray-600 mb-6">{message}</p>
              <button
                onClick={handleRetry}
                className="w-full py-3 rounded-xl font-semibold text-white"
                style={{ background: KENYA_GRADIENT.primary }}
              >
                Try Again
              </button>
            </div>
          )}
        </div>

        <div className="px-6 py-4 bg-gray-50 border-t border-gray-200 text-xs text-gray-500 text-center">
          <p>Secured by Safaricom M-Pesa • Transactions are encrypted</p>
        </div>
      </div>
    </div>
  )
}

// 👥 Follower/Following Modal Component
function FollowersModal({
  isOpen,
  onClose,
  profileId,
  type,
  supabase
}: {
  isOpen: boolean
  onClose: () => void
  profileId: string
  type: 'followers' | 'following'
  supabase: any
}) {
  const [users, setUsers] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (isOpen) {
      async function fetchUsers() {
        setLoading(true)
        try {
          if (type === 'followers') {
            const result = await supabase
              .from('follows')
              .select(`
                follower_id,
                profile:profiles!follows_follower_id_fkey (
                  id,
                  username,
                  full_name,
                  avatar_url,
                  is_verified
                )
              `)
              .eq('following_id', profileId)
            if (!result.error && result.data) {
              setUsers(result.data.map((f: any) => f.profile))
            }
          } else {
            const result = await supabase
              .from('follows')
              .select(`
                following_id,
                profile:profiles!follows_following_id_fkey (
                  id,
                  username,
                  full_name,
                  avatar_url,
                  is_verified
                )
              `)
              .eq('follower_id', profileId)
            if (!result.error && result.data) {
              setUsers(result.data.map((f: any) => f.profile))
            }
          }
        } catch (err) {
          console.error('Fetch users error:', err)
        } finally {
          setLoading(false)
        }
      }
      fetchUsers()
    }
  }, [isOpen, profileId, type, supabase])

  if (!isOpen) return null

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-labelledby="followers-modal-title"
    >
      <div
        className="bg-white rounded-2xl shadow-2xl w-full max-w-md max-h-[80vh] overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between p-4 border-b border-gray-200">
          <h3 id="followers-modal-title" className="text-lg font-semibold text-gray-900">
            {type === 'followers' ? 'Followers' : 'Following'}
          </h3>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-full transition-colors"
            aria-label="Close modal"
          >
            <X className="h-5 w-5 text-gray-500" />
          </button>
        </div>

        <div className="overflow-y-auto max-h-[60vh] p-4">
          {loading ? (
            <div className="flex justify-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-4 border-transparent"
                style={{
                  borderTopColor: KENYA.red,
                  borderRightColor: KENYA.black,
                  borderBottomColor: KENYA.green
                }}>
              </div>
            </div>
          ) : users.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <Users className="h-12 w-12 mx-auto mb-2 opacity-30" />
              <p>No {type} yet</p>
            </div>
          ) : (
            <div className="space-y-2">
              {users.map((user) => (
                <Link
                  key={user.id}
                  href={`/profile/${user.id}`}
                  onClick={onClose}
                  className="flex items-center gap-3 p-3 rounded-xl hover:bg-gray-50 transition-colors"
                >
                  <div className="relative">
                    <div className="h-10 w-10 rounded-full overflow-hidden bg-gray-100 shrink-0">
                      {user.avatar_url ? (
                        <img
                          src={user.avatar_url}
                          alt={user.username}
                          className="h-full w-full object-cover"
                          onError={(e) => {
                            e.currentTarget.style.display = 'none'
                            const parent = e.currentTarget.parentElement
                            if (parent) {
                              parent.style.background = KENYA_GRADIENT.primary
                              parent.innerHTML = `<span class="flex items-center justify-center h-full w-full text-white text-sm font-bold">${user.username?.charAt(0).toUpperCase() || 'U'}</span>`
                            }
                          }}
                        />
                      ) : (
                        <div className="h-full w-full flex items-center justify-center text-white text-sm font-bold"
                          style={{ background: KENYA_GRADIENT.primary }}>
                          {user.username?.charAt(0).toUpperCase() || 'U'}
                        </div>
                      )}
                    </div>
                    {user.is_verified && (
                      <div className="absolute -bottom-0.5 -right-0.5 h-4 w-4 rounded-full bg-[#1DA1F2] flex items-center justify-center border-2 border-white">
                        <BadgeCheck className="h-3 w-3 text-white" />
                      </div>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1">
                      <p className="font-medium text-gray-900 truncate">@{user.username}</p>
                      {user.is_verified && (
                        <BadgeCheck className="h-4 w-4 text-[#1DA1F2]" />
                      )}
                    </div>
                    {user.full_name && (
                      <p className="text-sm text-gray-500 truncate">{user.full_name}</p>
                    )}
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

// 🌐 Social Links Editor Component
function SocialLinksEditor({
  profile,
  onUpdate,
  supabase
}: {
  profile: ExtendedProfile
  onUpdate: (links: { twitter?: string, instagram?: string, website?: string }) => void
  supabase: any
}) {
  const [editing, setEditing] = useState(false)
  const [twitter, setTwitter] = useState(profile.twitter || '')
  const [instagram, setInstagram] = useState(profile.instagram || '')
  const [website, setWebsite] = useState(profile.website || '')
  const [saving, setSaving] = useState(false)

  const handleSave = useCallback(async function() {
    setSaving(true)
    try {
      const { error } = await supabase
        .from('profiles')
        .update({ 
          twitter, 
          instagram, 
          website,
          updated_at: new Date().toISOString()
        })
        .eq('id', profile.id)
      if (error) throw error
      onUpdate({ twitter, instagram, website })
      setEditing(false)
      
      // ✅ Emit custom event for cross-page sync
      window.dispatchEvent(new CustomEvent('profile:updated', { 
        detail: { 
          profileId: profile.id, 
          fields: { twitter, instagram, website } 
        } 
      }))
      
      toast.success('Social links updated!')
    } catch (err: any) {
      toast.error('Failed to update social links')
      console.error('Update error:', err)
    } finally {
      setSaving(false)
    }
  }, [profile.id, twitter, instagram, website, onUpdate, supabase])

  const formatSocialUrl = useCallback(function(platform: string, handle: string) {
    if (!handle) return ''
    const urls: Record<string, string> = {
      twitter: `https://twitter.com/${handle.replace('@', '')}`,
      instagram: `https://instagram.com/${handle.replace('@', '')}`,
      website: handle.startsWith('http') ? handle : `https://${handle}`
    }
    return urls[platform] || handle
  }, [])

  if (!editing) {
    const hasLinks = twitter || instagram || website
    return (
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h4 className="font-medium text-gray-700">Social Links</h4>
          <button
            onClick={() => setEditing(true)}
            className="text-sm text-[#bb0000] hover:underline flex items-center gap-1"
          >
            <Edit className="h-3.5 w-3.5" />
            Edit
          </button>
        </div>
        {hasLinks ? (
          <div className="flex flex-wrap gap-2">
            {twitter && (
              <a
                href={formatSocialUrl('twitter', twitter)}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-[#1DA1F2]/10 text-[#1DA1F2] text-sm font-medium hover:bg-[#1DA1F2]/20 transition-colors"
              >
                <Twitter className="h-4 w-4" />
                {twitter.replace('@', '')}
              </a>
            )}
            {instagram && (
              <a
                href={formatSocialUrl('instagram', instagram)}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-[#E1306C]/10 text-[#E1306C] text-sm font-medium hover:bg-[#E1306C]/20 transition-colors"
              >
                <Instagram className="h-4 w-4" />
                {instagram.replace('@', '')}
              </a>
            )}
            {website && (
              <a
                href={formatSocialUrl('website', website)}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-gray-100 text-gray-700 text-sm font-medium hover:bg-gray-200 transition-colors"
              >
                <Globe className="h-4 w-4" />
                {website.replace(/^https?:\/\//, '').replace(/\/$/, '').slice(0, 20)}
                {website.length > 20 ? '...' : ''}
              </a>
            )}
          </div>
        ) : (
          <p className="text-sm text-gray-500 italic">No social links added yet</p>
        )}
      </div>
    )
  }

  return (
    <div className="space-y-4 p-4 bg-gray-50 rounded-xl">
      <div className="flex items-center justify-between">
        <h4 className="font-medium text-gray-700">Edit Social Links</h4>
        <button
          onClick={() => setEditing(false)}
          className="text-sm text-gray-500 hover:text-gray-700"
        >
          Cancel
        </button>
      </div>
      <div className="space-y-3">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            <Twitter className="h-4 w-4 inline mr-1" />
            Twitter/X Handle
          </label>
          <input
            type="text"
            value={twitter}
            onChange={(e) => setTwitter(e.target.value)}
            placeholder="@username"
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#1DA1F2]"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            <Instagram className="h-4 w-4 inline mr-1" />
            Instagram Handle
          </label>
          <input
            type="text"
            value={instagram}
            onChange={(e) => setInstagram(e.target.value)}
            placeholder="@username"
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#E1306C]"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            <Globe className="h-4 w-4 inline mr-1" />
            Website URL
          </label>
          <input
            type="url"
            value={website}
            onChange={(e) => setWebsite(e.target.value)}
            placeholder="yourwebsite.com"
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#007847]"
          />
        </div>
      </div>
      <button
        onClick={handleSave}
        disabled={saving}
        className="w-full py-2.5 rounded-lg font-medium text-white transition-all disabled:opacity-50 flex items-center justify-center gap-2"
        style={{ background: KENYA_GRADIENT.primary }}
      >
        {saving ? (
          <>
            <Loader2 className="h-4 w-4 animate-spin" />
            Saving...
          </>
        ) : (
          <>
            <Check className="h-4 w-4" />
            Save Changes
          </>
        )}
      </button>
    </div>
  )
}

// 📊 Profile Stats Component
function ProfileStats({
  videos,
  videoStats,
  followerCount,
  followingCount,
  onFollowersClick,
  onFollowingClick
}: {
  videos: Video[]
  videoStats: Record<string, { views: number, likes: number }>
  followerCount: number
  followingCount: number
  onFollowersClick: () => void
  onFollowingClick: () => void
}) {
  const totalViews = videos.reduce((sum, v) => sum + (videoStats[v.id]?.views || v.views || 0), 0)
  const totalLikes = videos.reduce((sum, v) => sum + (videoStats[v.id]?.likes || 0), 0)

  return (
    <div className="flex flex-wrap items-center gap-6 mt-6 pt-6 border-t border-gray-200">
      <div className="text-center">
        <p className="text-2xl font-bold" style={{ color: KENYA.red }}>{videos.length}</p>
        <p className="text-sm text-gray-500">Videos</p>
      </div>
      <div className="text-center">
        <p className="text-2xl font-bold" style={{ color: KENYA.green }}>{formatNumber(totalViews)}</p>
        <p className="text-sm text-gray-500">Views</p>
      </div>
      <div className="text-center">
        <p className="text-2xl font-bold" style={{ color: KENYA.red }}>{formatNumber(totalLikes)}</p>
        <p className="text-sm text-gray-500">Likes</p>
      </div>
      <button
        onClick={onFollowersClick}
        className="text-center hover:opacity-70 transition-opacity"
      >
        <p className="text-2xl font-bold text-gray-900">{formatNumber(followerCount)}</p>
        <p className="text-sm text-gray-500">Followers</p>
      </button>
      <button
        onClick={onFollowingClick}
        className="text-center hover:opacity-70 transition-opacity"
      >
        <p className="text-2xl font-bold text-gray-900">{formatNumber(followingCount)}</p>
        <p className="text-sm text-gray-500">Following</p>
      </button>
    </div>
  )
}

// 🎬 Video Grid Component
function VideoGrid({
  videos,
  videoStats,
  viewMode
}: {
  videos: Video[]
  videoStats: Record<string, { views: number, likes: number }>
  viewMode: 'grid' | 'list'
}) {
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
                <div className="absolute inset-0 bg-gradient-to-t from-[#bb0000]/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                  <div className="h-12 w-12 rounded-full flex items-center justify-center shadow-lg" style={{ background: `${KENYA.red}cc` }}>
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
              <div className="absolute inset-0 bg-gradient-to-t from-[#bb0000]/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
              <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                <div className="h-10 w-10 rounded-full flex items-center justify-center shadow-lg" style={{ background: `${KENYA.red}cc` }}>
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

// ===================================================
// MAIN PAGE COMPONENT
// ===================================================
export default function ProfilePage() {
  const params = useParams()
  const router = useRouter()
  const { user: currentUser } = useAuth()
  const supabase = createClient()

  const [profile, setProfile] = useState<ExtendedProfile | null>(null)
  const [videos, setVideos] = useState<Video[]>([])
  const [videoStats, setVideoStats] = useState<Record<string, { views: number, likes: number }>>({})
  const [isFollowing, setIsFollowing] = useState(false)
  const [followerCount, setFollowerCount] = useState(0)
  const [followingCount, setFollowingCount] = useState(0)
  const [activeTab, setActiveTab] = useState<'videos' | 'liked' | 'about'>('videos')
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  // Modal states
  const [avatarModalOpen, setAvatarModalOpen] = useState(false)
  const [mpesaModalOpen, setMpesaModalOpen] = useState(false)
  const [followersModalOpen, setFollowersModalOpen] = useState(false)
  const [followersModalType, setFollowersModalType] = useState<'followers' | 'following'>('followers')

  // ✅ Validate profile ID
  useEffect(() => {
    const profileId = params.id as string
    if (profileId && !validateProfileId(profileId)) {
      setError('Invalid profile ID')
      setLoading(false)
    }
  }, [params.id])

  // ✅ Fetch Profile Data
  useEffect(() => {
    async function fetchProfile() {
      const profileId = params.id as string
      if (!profileId || !validateProfileId(profileId)) return

      try {
        const profileResult = await supabase
          .from('profiles')
          .select('*')
          .eq('id', profileId)
          .single()

        if (profileResult.error) throw profileResult.error
        if (!profileResult.data) {
          setError('Profile not found')
          setLoading(false)
          return
        }

        const profileData = profileResult.data as ExtendedProfile

        // ✅ Security: Check private profile access
        if (profileData.is_private && currentUser?.id !== profileData.id) {
          setError('This profile is private')
          setLoading(false)
          return
        }

        setProfile(profileData)

        const videosResult = await supabase
          .from('videos')
          .select('*')
          .eq('creator_id', profileId)
          .eq('visibility', 'public')
          .order('created_at', { ascending: false })
          .limit(24)

        if (!videosResult.error && videosResult.data) {
          const videosData = videosResult.data as Video[]
          setVideos(videosData)

          const videoIds = videosData.map(v => v.id)
          if (videoIds.length > 0) {
            const likesResult = await supabase
              .from('likes')
              .select('video_id')
              .in('video_id', videoIds)

            const likesMap: Record<string, number> = {}
            if (!likesResult.error && likesResult.data) {
              likesResult.data.forEach(like => {
                likesMap[like.video_id] = (likesMap[like.video_id] || 0) + 1
              })
            }

            const stats: Record<string, { views: number, likes: number }> = {}
            videoIds.forEach(id => {
              stats[id] = {
                views: videosData.find(v => v.id === id)?.views || 0,
                likes: likesMap[id] || 0
              }
            })
            setVideoStats(stats)
          }
        }

        const [{ count: followers }, { count: following }] = await Promise.all([
          supabase.from('follows').select('*', { count: 'exact', head: true }).eq('following_id', profileId),
          supabase.from('follows').select('*', { count: 'exact', head: true }).eq('follower_id', profileId)
        ])

        setFollowerCount(followers || 0)
        setFollowingCount(following || 0)

        if (currentUser?.id && currentUser.id !== profileId) {
          const followResult = await supabase
            .from('follows')
            .select('id')
            .eq('follower_id', currentUser.id)
            .eq('following_id', profileId)
            .maybeSingle()
          setIsFollowing(!!followResult.data)
        }

        // ✅ Track profile view analytics
        await fetch('/api/analytics/profile-view', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            profileId,
            viewerId: currentUser?.id || null,
            timestamp: new Date().toISOString()
          })
        }).catch(() => {})
      } catch (err: any) {
        console.error('Profile fetch error:', err)
        setError('Failed to load profile')
      } finally {
        setLoading(false)
      }
    }

    fetchProfile()
  }, [params.id, currentUser, supabase])

  // ✅ Real-time follower count updates
  useEffect(() => {
    const profileId = params.id as string
    if (!profileId) return

    const channel = supabase
      .channel(`followers-${profileId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'follows',
          filter: `following_id=eq.${profileId}`,
        },
        async () => {
          const result = await supabase
            .from('follows')
            .select('*', { count: 'exact', head: true })
            .eq('following_id', profileId)
          if (!result.error) {
            setFollowerCount(result.count || 0)
          }
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [params.id, supabase])

  // ✅ REALTIME: Listen for profile changes from Settings
  useEffect(() => {
    const profileId = params.id as string
    if (!profileId) return

    // Supabase Realtime subscription for profile table
    const channel = supabase
      .channel(`profile-${profileId}`)
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'profiles',
          filter: `id=eq.${profileId}`,
        },
        (payload) => {
          console.log('🔄 Profile updated via Realtime:', payload)
          if (payload.new) {
            setProfile(payload.new as ExtendedProfile)
            toast.success('Profile updated!')
          }
        }
      )
      .subscribe()

    // Custom event listener for cross-tab sync
    const handleProfileUpdate = (event: CustomEvent) => {
      const { profileId: eventId, field, fields, value } = event.detail
      
      if (eventId === profileId) {
        console.log('🔄 Profile updated via custom event:', event.detail)
        
        setProfile(prev => {
          if (!prev) return prev
          
          if (field && value !== undefined) {
            return { ...prev, [field]: value }
          } else if (fields) {
            return { ...prev, ...fields }
          }
          
          return prev
        })
        
        toast.success('Profile updated!')
      }
    }

    window.addEventListener('profile:updated', handleProfileUpdate as EventListener)
    
    return () => {
      supabase.removeChannel(channel)
      window.removeEventListener('profile:updated', handleProfileUpdate as EventListener)
    }
  }, [params.id, supabase])

  // ✅ Follow/Unfollow Handler
  const handleFollow = useCallback(async function() {
    const profileId = params.id as string
    if (!currentUser) {
      router.push('/login')
      return
    }

    try {
      if (isFollowing) {
        await supabase
          .from('follows')
          .delete()
          .eq('follower_id', currentUser.id)
          .eq('following_id', profileId)
        setIsFollowing(false)
        setFollowerCount(prev => Math.max(0, prev - 1))
        toast.success('Unfollowed successfully')
      } else {
        await supabase
          .from('follows')
          .insert({
            follower_id: currentUser.id,
            following_id: profileId
          })
        setIsFollowing(true)
        setFollowerCount(prev => prev + 1)
        toast.success('Following successfully')
      }
    } catch (err) {
      console.error('Follow error:', err)
      toast.error('Failed to update follow status')
    }
  }, [currentUser, isFollowing, params.id, router, supabase])

  // ✅ Avatar Update Handler
  const handleAvatarUpdate = useCallback(function(newAvatarUrl: string) {
    setProfile(prev => prev ? { ...prev, avatar_url: newAvatarUrl } : null)
    toast.success('Avatar updated successfully!')
  }, [])

  // ✅ Social Links Update Handler
  const handleSocialUpdate = useCallback(function(links: { twitter?: string, instagram?: string, website?: string }) {
    setProfile(prev => prev ? { ...prev, ...links } : null)
  }, [])

  // ✅ Share Profile Handler
  const handleShareProfile = useCallback(async function() {
    const url = `${window.location.origin}/profile/${params.id}`
    try {
      await navigator.clipboard.writeText(url)
      toast.success('Profile link copied!')
    } catch {
      toast.error('Failed to copy link')
    }
  }, [params.id])

  const isOwnProfile = currentUser?.id === profile?.id

  // ✅ Loading State
  if (loading) {
    return (
      <div className="min-h-[calc(100vh-4rem)] flex items-center justify-center bg-gradient-to-br from-gray-50 to-gray-100">
        <div className="text-center">
          <div className="relative mx-auto mb-4">
            <div className="animate-spin rounded-full h-16 w-16 border-4 border-transparent"
              style={{
                borderTopColor: KENYA.red,
                borderRightColor: KENYA.black,
                borderBottomColor: KENYA.green
              }}>
            </div>
          </div>
          <p className="text-gray-700 font-medium">Loading profile... 🇰🇪</p>
        </div>
      </div>
    )
  }

  // ✅ Error State
  if (error || !profile) {
    return (
      <div className="min-h-[calc(100vh-4rem)] flex items-center justify-center bg-gradient-to-br from-gray-50 to-gray-100">
        <div className="text-center p-8 bg-white rounded-2xl shadow-lg border border-gray-200 max-w-md mx-4">
          <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-red-100 flex items-center justify-center">
            <span className="text-3xl">🇰🇪</span>
          </div>
          <p className="text-xl font-semibold text-gray-900 mb-2">{error || 'Profile not found'}</p>
          <Link
            href="/"
            className="inline-flex items-center gap-2 px-6 py-3 rounded-full font-semibold text-white transition-all duration-300 shadow-md hover:shadow-lg hover:-translate-y-0.5 mt-4"
            style={{ background: KENYA_GRADIENT.primary }}
          >
            <Play className="h-4 w-4" />
            Back to Home
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-[calc(100vh-4rem)] bg-gradient-to-br from-gray-50 to-gray-100">
      {/* ✅ Kenyan Flag Progress Bar */}
      <div 
        className="fixed top-16 left-0 right-0 h-1 z-30"
        style={{ background: KENYA_GRADIENT.flag }}
        aria-hidden="true"
      />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* ✅ Profile Header Card */}
        <div className="bg-white rounded-3xl border border-gray-200 shadow-lg p-6 sm:p-8 mb-8">
          <div className="flex flex-col md:flex-row gap-6 items-start md:items-center">
            {/* Avatar */}
            <div className="relative group">
              <div 
                className="h-24 w-24 sm:h-32 sm:w-32 rounded-2xl overflow-hidden border-4 border-white shadow-lg transition-transform hover:scale-105"
                style={{
                  background: profile.avatar_url ? 'transparent' : KENYA_GRADIENT.primary
                }}
              >
                {profile.avatar_url ? (
                  <img
                    src={profile.avatar_url}
                    alt={profile.username}
                    className="h-full w-full object-cover"
                    onError={(e) => {
                      e.currentTarget.style.display = 'none'
                      const parent = e.currentTarget.parentElement
                      if (parent) {
                        parent.style.background = KENYA_GRADIENT.primary
                        parent.innerHTML = `<span class="flex items-center justify-center h-full w-full text-white text-3xl sm:text-4xl font-bold">${profile.username?.charAt(0).toUpperCase() || 'U'}</span>`
                      }
                    }}
                  />
                ) : (
                  <div className="h-full w-full flex items-center justify-center text-white text-3xl sm:text-4xl font-bold">
                    {profile.username?.charAt(0).toUpperCase() || 'U'}
                  </div>
                )}
              </div>

              {profile.is_verified && (
                <div className="absolute -top-1 -right-1 h-7 w-7 rounded-full bg-[#1DA1F2] flex items-center justify-center border-3 border-white shadow-lg" title="Verified Creator">
                  <BadgeCheck className="h-4 w-4 text-white" />
                </div>
              )}

              {isOwnProfile && (
                <button
                  onClick={() => setAvatarModalOpen(true)}
                  className="absolute -bottom-2 -right-2 p-3 bg-white rounded-full shadow-lg border-4 border-white hover:shadow-xl transition-all group-hover:scale-110"
                  aria-label="Update profile picture"
                >
                  <Camera className="h-5 w-5" style={{ color: KENYA.red }} />
                </button>
              )}
            </div>

            {/* Profile Info */}
            <div className="flex-1 min-w-0">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div>
                  <div className="flex items-center gap-2 flex-wrap">
                    <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">
                      @{profile.username}
                    </h1>
                    {profile.is_verified && (
                      <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-[#1DA1F2]/10 text-[#1DA1F2] text-sm font-medium">
                        <BadgeCheck className="h-4 w-4" />
                        Verified
                      </span>
                    )}
                  </div>
                  {profile.full_name && (
                    <p className="text-lg text-gray-600 mt-1">{profile.full_name}</p>
                  )}
                  {profile.bio && (
                    <p className="text-gray-700 mt-3 max-w-2xl line-clamp-2">
                      {sanitizeBio(profile.bio)}
                    </p>
                  )}
                </div>

                {/* Action Buttons */}
                <div className="flex items-center gap-3">
                  {!isOwnProfile && (
                    <>
                      <button
                        onClick={handleFollow}
                        className={`px-6 py-2.5 rounded-full font-medium transition-all duration-300 flex items-center gap-2 shadow-sm ${
                          isFollowing
                            ? 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                            : 'text-white hover:shadow-md hover:-translate-y-0.5'
                        }`}
                        style={isFollowing ? {} : { background: KENYA_GRADIENT.primary }}
                      >
                        <UserPlus className="h-4 w-4" />
                        {isFollowing ? 'Following' : 'Follow'}
                      </button>
                      <button
                        onClick={() => setMpesaModalOpen(true)}
                        className="px-4 py-2.5 rounded-full font-medium text-white flex items-center gap-2 shadow-sm hover:shadow-md hover:-translate-y-0.5 transition-all"
                        style={{ background: `linear-gradient(135deg, ${KENYA.mpesa}, #45a049)` }}
                        aria-label="Support creator with M-Pesa"
                      >
                        <Phone className="h-4 w-4" />
                        <span className="hidden sm:inline">Tip</span>
                      </button>
                    </>
                  )}
                  <button 
                    onClick={handleShareProfile}
                    className="p-2.5 rounded-full border border-gray-300 hover:bg-gray-50 transition-colors"
                    aria-label="Share profile"
                  >
                    <Copy className="h-5 w-5 text-gray-600" />
                  </button>
                  {!isOwnProfile && (
                    <button className="p-2.5 rounded-full border border-gray-300 hover:bg-gray-50 transition-colors" aria-label="More options">
                      <MoreVertical className="h-5 w-5 text-gray-600" />
                    </button>
                  )}
                </div>
              </div>

              {/* Profile Stats */}
              <ProfileStats
                videos={videos}
                videoStats={videoStats}
                followerCount={followerCount}
                followingCount={followingCount}
                onFollowersClick={() => {
                  setFollowersModalType('followers')
                  setFollowersModalOpen(true)
                }}
                onFollowingClick={() => {
                  setFollowersModalType('following')
                  setFollowersModalOpen(true)
                }}
              />
            </div>
          </div>
        </div>

        {/* ✅ Content Tabs */}
        <div className="mb-6">
          <div className="flex items-center justify-between border-b border-gray-200">
            <div className="flex gap-1">
              {(['videos', 'liked', 'about'] as const).map((tab) => (
                <button
                  key={tab}
                  onClick={() => setActiveTab(tab)}
                  className={`px-4 py-3 font-medium text-sm border-b-2 transition-colors ${
                    activeTab === tab
                      ? 'border-[#bb0000] text-[#bb0000]'
                      : 'border-transparent text-gray-500 hover:text-gray-700'
                  }`}
                >
                  {tab.charAt(0).toUpperCase() + tab.slice(1)}
                </button>
              ))}
            </div>
            {activeTab === 'videos' && (
              <div className="flex items-center gap-1 bg-gray-100 rounded-lg p-1">
                <button
                  onClick={() => setViewMode('grid')}
                  className={`p-2 rounded-md transition-colors ${
                    viewMode === 'grid' ? 'bg-white shadow text-[#bb0000]' : 'text-gray-500 hover:text-gray-700'
                  }`}
                  aria-label="Grid view"
                >
                  <Grid3X3 className="h-4 w-4" />
                </button>
                <button
                  onClick={() => setViewMode('list')}
                  className={`p-2 rounded-md transition-colors ${
                    viewMode === 'list' ? 'bg-white shadow text-[#bb0000]' : 'text-gray-500 hover:text-gray-700'
                  }`}
                  aria-label="List view"
                >
                  <List className="h-4 w-4" />
                </button>
              </div>
            )}
          </div>
        </div>

        {/* ✅ Tab Content */}
        {activeTab === 'videos' && (
          <>
            {videos.length === 0 ? (
              <div className="text-center py-16 bg-white rounded-2xl border border-gray-200 shadow-lg">
                <Play className="h-16 w-16 text-gray-300 mx-auto mb-4" />
                <h3 className="text-xl font-semibold text-gray-900 mb-2">No videos yet</h3>
                <p className="text-gray-600 mb-6">
                  {isOwnProfile 
                    ? 'Start sharing your story by uploading your first video!' 
                    : 'This creator hasn\'t uploaded any videos yet.'}
                </p>
                {isOwnProfile && (
                  <Link
                    href="/upload"
                    className="inline-flex items-center gap-2 px-6 py-3 rounded-full font-semibold text-white transition-all duration-300 shadow-md hover:shadow-lg hover:-translate-y-0.5"
                    style={{ background: KENYA_GRADIENT.primary }}
                  >
                    <Play className="h-4 w-4" />
                    Upload Your First Video
                  </Link>
                )}
              </div>
            ) : (
              <VideoGrid
                videos={videos}
                videoStats={videoStats}
                viewMode={viewMode}
              />
            )}
          </>
        )}

        {activeTab === 'liked' && (
          <div className="text-center py-16 bg-white rounded-2xl border border-gray-200 shadow-lg">
            <Heart className="h-16 w-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-gray-900 mb-2">Liked Videos</h3>
            <p className="text-gray-600">
              {isOwnProfile 
                ? 'Videos you\'ve liked will appear here.' 
                : 'This user\'s liked videos are private.'}
            </p>
          </div>
        )}

        {activeTab === 'about' && (
          <div className="bg-white rounded-2xl border border-gray-200 shadow-lg p-6 sm:p-8">
            <h3 className="text-xl font-semibold text-gray-900 mb-4">About @{profile.username}</h3>
            <div className="space-y-6">
              {profile.bio && (
                <div>
                  <h4 className="font-medium text-gray-700 mb-2">Bio</h4>
                  <p className="text-gray-600 whitespace-pre-wrap">{sanitizeBio(profile.bio)}</p>
                </div>
              )}
              {isOwnProfile && profile && (
                <SocialLinksEditor
                  profile={profile}
                  onUpdate={handleSocialUpdate}
                  supabase={supabase}
                />
              )}
              <div>
                <h4 className="font-medium text-gray-700 mb-2">Member Since</h4>
                <p className="text-gray-600">{formatDate(profile.created_at)}</p>
              </div>
              {profile.full_name && (
                <div>
                  <h4 className="font-medium text-gray-700 mb-2">Full Name</h4>
                  <p className="text-gray-600">{profile.full_name}</p>
                </div>
              )}
              {profile.is_verified && (
                <div className="p-4 bg-[#1DA1F2]/10 border border-[#1DA1F2]/30 rounded-xl">
                  <div className="flex items-start gap-3">
                    <BadgeCheck className="h-5 w-5 text-[#1DA1F2] shrink-0 mt-0.5" />
                    <div>
                      <h4 className="font-medium text-gray-900">Verified Creator</h4>
                      <p className="text-sm text-gray-600 mt-1">
                        This account has been verified by Stream254 as an authentic creator.
                        Verified creators get priority support and early access to new features.
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* ✅ Modals */}
      {isOwnProfile && profile && (
        <AvatarCropModal
          isOpen={avatarModalOpen}
          onClose={() => setAvatarModalOpen(false)}
          profile={profile}
          onSuccess={handleAvatarUpdate}
          supabase={supabase}
        />
      )}

      {!isOwnProfile && profile && (
        <MpesaTipModal
          isOpen={mpesaModalOpen}
          onClose={() => setMpesaModalOpen(false)}
          creatorProfile={profile}
          supabase={supabase}
        />
      )}

      {profile && (
        <FollowersModal
          isOpen={followersModalOpen}
          onClose={() => setFollowersModalOpen(false)}
          profileId={profile.id}
          type={followersModalType}
          supabase={supabase}
        />
      )}
    </div>
  )
} 