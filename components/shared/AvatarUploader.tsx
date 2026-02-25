// components/shared/AvatarUploader.tsx
'use client'

import { useState, useCallback, useRef, useEffect } from 'react'
import { Camera, Upload, Loader2, Check, AlertCircle, X, ZoomIn, ZoomOut, RotateCcw, ChevronLeft } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { toast } from 'react-hot-toast'

interface AvatarUploaderProps {
  userId: string
  currentAvatar?: string | null
  username: string
  onUpdate: (newAvatarUrl: string) => void
  trigger?: React.ReactNode // Optional trigger button
}

const KENYA_GRADIENT = 'linear-gradient(135deg, #bb0000, #007847)'

export function AvatarUploader({ 
  userId, 
  currentAvatar, 
  username, 
  onUpdate,
  trigger 
}: AvatarUploaderProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [imageSrc, setImageSrc] = useState<string | null>(null)
  const [crop, setCrop] = useState({ x: 0, y: 0 })
  const [zoom, setZoom] = useState(1)
  const [croppedAreaPixels, setCroppedAreaPixels] = useState<any>(null)
  const [uploading, setUploading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)
  const [previewUrl, setPreviewUrl] = useState<string | null>(null)
  
  const fileInputRef = useRef<HTMLInputElement>(null)
  const imageRef = useRef<HTMLImageElement>(null)
  const containerRef = useRef<HTMLDivElement>(null)
  const supabase = createClient()

  // Calculate crop pixels for manual drag
  useEffect(() => {
    if (imageRef.current && containerRef.current && imageSrc) {
      const containerRect = containerRef.current.getBoundingClientRect()
      const { naturalWidth, naturalHeight } = imageRef.current
      if (naturalWidth === 0 || containerRect.width === 0) return
      
      const cropWidth = containerRect.width / zoom
      const cropHeight = containerRect.height / zoom
      const scaleX = naturalWidth / containerRect.width
      const scaleY = naturalHeight / containerRect.height
      
      setCroppedAreaPixels({
        x: Math.max(0, (-crop.x / zoom) * scaleX),
        y: Math.max(0, (-crop.y / zoom) * scaleY),
        width: Math.min(cropWidth * scaleX, naturalWidth),
        height: Math.min(cropHeight * scaleY, naturalHeight)
      })
    }
  }, [crop.x, crop.y, zoom, imageSrc])

  // Generate preview
  useEffect(() => {
    if (imageRef.current && croppedAreaPixels && !uploading) {
      const canvas = document.createElement('canvas')
      const ctx = canvas.getContext('2d')
      if (!ctx) return
      
      canvas.width = 200
      canvas.height = 200
      ctx.drawImage(
        imageRef.current,
        croppedAreaPixels.x, croppedAreaPixels.y,
        croppedAreaPixels.width, croppedAreaPixels.height,
        0, 0, 200, 200
      )
      setPreviewUrl(canvas.toDataURL('image/jpeg', 0.8))
    }
  }, [croppedAreaPixels, uploading])

  const handleFileSelect = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    if (!file.type.startsWith('image/') || file.size > 5 * 1024 * 1024) {
      setError('Please select a valid image under 5MB')
      return
    }
    setError('')
    const reader = new FileReader()
    reader.onload = (event) => setImageSrc(event.target?.result as string)
    reader.onerror = () => setError('Failed to read image')
    reader.readAsDataURL(file)
  }, [])

  const createCroppedImage = useCallback((): Promise<Blob> => {
    return new Promise((resolve, reject) => {
      const image = imageRef.current
      const canvas = document.createElement('canvas')
      const ctx = canvas.getContext('2d')
      if (!image || !ctx || !croppedAreaPixels) {
        reject(new Error('Missing crop data'))
        return
      }
      canvas.width = 400
      canvas.height = 400
      ctx.fillStyle = '#ffffff'
      ctx.fillRect(0, 0, 400, 400)
      ctx.drawImage(
        image,
        croppedAreaPixels.x, croppedAreaPixels.y,
        croppedAreaPixels.width, croppedAreaPixels.height,
        0, 0, 400, 400
      )
      canvas.toBlob((blob) => blob ? resolve(blob) : reject(new Error('Failed')), 'image/jpeg', 0.9)
    })
  }, [croppedAreaPixels])

  const handleUpload = useCallback(async () => {
    if (!croppedAreaPixels) { setError('Please crop the image first'); return }
    setUploading(true)
    setError('')
    
    try {
      const blob = await createCroppedImage()
      const file = new File([blob], `avatar-${userId}.jpg`, { type: 'image/jpeg' })
      const filePath = `avatars/${userId}-${Date.now()}.jpg`
      
      const { error: uploadError } = await supabase.storage
        .from('avatars').upload(filePath, file, { cacheControl: '3600', upsert: false })
      if (uploadError) throw uploadError

      const { data: urlData } = supabase.storage.from('avatars').getPublicUrl(filePath)
      const publicUrl = urlData?.publicUrl
      if (!publicUrl) throw new Error('Failed to get URL')

      const { error: updateError } = await supabase
        .from('profiles').update({ avatar_url: publicUrl, updated_at: new Date().toISOString() })
        .eq('id', userId)
      if (updateError) throw updateError

      setSuccess(true)
      onUpdate(publicUrl)
      toast.success('Avatar updated!')
      
      setTimeout(() => { setIsOpen(false); setImageSrc(null); setSuccess(false) }, 1500)
    } catch (err: any) {
      setError(err.message || 'Upload failed')
      toast.error(err.message || 'Upload failed')
    } finally {
      setUploading(false)
    }
  }, [userId, croppedAreaPixels, createCroppedImage, supabase, onUpdate])

  if (!isOpen) {
    return (
      <>
        {trigger ? (
          <div onClick={() => setIsOpen(true)}>{trigger}</div>
        ) : (
          <button onClick={() => setIsOpen(true)} className="p-2 hover:bg-gray-100 rounded-full">
            <Camera className="h-5 w-5" />
          </button>
        )}
      </>
    )
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm" onClick={() => setIsOpen(false)}>
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between p-4 border-b">
          <h3 className="font-semibold">{imageSrc ? 'Crop Avatar' : 'Select Photo'}</h3>
          <button onClick={() => setIsOpen(false)} className="p-2 hover:bg-gray-100 rounded-full"><X className="h-5 w-5" /></button>
        </div>
        
        <div className="p-6">
          {!imageSrc ? (
            <div className="flex flex-col items-center py-8">
              <button onClick={() => fileInputRef.current?.click()} className="h-32 w-32 rounded-2xl border-4 border-dashed border-gray-300 hover:border-[#007847] flex flex-col items-center justify-center gap-2 bg-gray-50">
                <Camera className="h-8 w-8 text-gray-400" /><span className="text-sm text-gray-500">Tap to select</span>
              </button>
              <input ref={fileInputRef} type="file" accept="image/*" onChange={handleFileSelect} className="hidden" />
              {error && <p className="text-red-600 text-sm mt-4">{error}</p>}
            </div>
          ) : (
            <div className="space-y-4">
              <div ref={containerRef} className="relative aspect-square bg-gray-100 rounded-xl overflow-hidden" style={{ touchAction: 'none' }}>
                <img ref={imageRef} src={imageSrc} alt="Crop" className="absolute max-w-none cursor-move" style={{ transform: `translate(${crop.x}px, ${crop.y}px) scale(${zoom})`, maxWidth: 'none' }}
                  onMouseDown={(e) => {
                    const startX = e.clientX - crop.x, startY = e.clientY - crop.y
                    const onMove = (m: MouseEvent) => setCrop({ x: m.clientX - startX, y: m.clientY - startY })
                    const onUp = () => { document.removeEventListener('mousemove', onMove); document.removeEventListener('mouseup', onUp) }
                    document.addEventListener('mousemove', onMove); document.addEventListener('mouseup', onUp)
                  }}
                />
                <div className="absolute inset-0 pointer-events-none"><div className="absolute inset-0 bg-black/40" /><div className="absolute inset-8 border-2 border-white rounded-lg shadow-[0_0_0_9999px_rgba(0,0,0,0.4)]" /></div>
                <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex items-center gap-2 bg-black/60 rounded-full px-3 py-1.5">
                  <button onClick={() => setZoom(z => Math.max(z - 0.1, 1))} className="p-1.5"><ZoomOut className="h-4 w-4 text-white" /></button>
                  <input type="range" min="1" max="3" step="0.1" value={zoom} onChange={(e) => setZoom(parseFloat(e.target.value))} className="w-20" />
                  <button onClick={() => setZoom(z => Math.min(z + 0.1, 3))} className="p-1.5"><ZoomIn className="h-4 w-4 text-white" /></button>
                </div>
              </div>
              
              <div className="flex items-center gap-4 p-3 bg-gray-50 rounded-lg">
                <span className="text-sm">Preview:</span>
                <div className="h-12 w-12 rounded-full overflow-hidden border-2 border-[#007847]">
                  {previewUrl ? <img src={previewUrl} alt="Preview" className="h-full w-full object-cover" /> : <div className="h-full w-full flex items-center justify-center text-white text-sm font-bold" style={{ background: KENYA_GRADIENT }}>{username.charAt(0).toUpperCase()}</div>}
                </div>
              </div>
              
              {error && <p className="text-red-600 text-sm">{error}</p>}
              {success && <p className="text-green-600 text-sm">✓ Updated!</p>}
              
              <div className="flex gap-3">
                <button onClick={() => { setImageSrc(null); setError('') }} className="flex-1 px-4 py-2 rounded-full border">Back</button>
                <button onClick={handleUpload} disabled={uploading || !croppedAreaPixels} className="flex-1 px-4 py-2 rounded-full text-white" style={{ background: KENYA_GRADIENT }}>
                  {uploading ? <Loader2 className="h-4 w-4 animate-spin mx-auto" /> : 'Save'}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}