// components/settings/ProfileSettings.tsx
'use client'

import { useState, useCallback, useEffect } from 'react'
import { Camera, Upload, Loader2, Check, AlertCircle, X } from 'lucide-react'
import { updateProfile } from '@/app/settings/actions'
import type { UserProfile } from '@/lib/types/settings'
import { createClient } from '@/lib/supabase/client'
import { toast } from 'react-hot-toast'

interface ProfileSettingsProps {
  profile: UserProfile
}

const KENYA_GRADIENT = 'linear-gradient(135deg, #bb0000, #007847)'

export function ProfileSettings({ profile }: ProfileSettingsProps) {
  const [formData, setFormData] = useState({
    username: profile.username || '',
    full_name: profile.full_name || '',
    bio: profile.bio || '',
    twitter: profile.twitter || '',
    instagram: profile.instagram || '',
    website: profile.website || '',
  })
  const [avatarPreview, setAvatarPreview] = useState<string | null>(profile.avatar_url)
  const [isUploading, setIsUploading] = useState(false)
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null)
  const supabase = createClient()

  const handleChange = useCallback((e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target
    setFormData(prev => ({ ...prev, [name]: value }))
  }, [])

  // ✅ FIX: Full avatar upload to Supabase Storage
  const handleAvatarUpload = useCallback(async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    if (!file.type.startsWith('image/') || file.size > 5 * 1024 * 1024) {
      setMessage({ type: 'error', text: 'Please select a valid image under 5MB' })
      toast.error('Invalid image file')
      return
    }

    setIsUploading(true)
    setMessage(null)

    try {
      // Create preview
      const reader = new FileReader()
      reader.onload = (event) => {
        setAvatarPreview(event.target?.result as string)
      }
      reader.readAsDataURL(file)

      // Upload to Supabase Storage
      const fileName = `${profile.id}-${Date.now()}.jpg`
      const filePath = `avatars/${fileName}`
      
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('avatars')
        .upload(filePath, file, {
          cacheControl: '3600',
          upsert: false,
          contentType: file.type
        })

      if (uploadError) throw uploadError

      // Get public URL
      const { data: urlData } = supabase.storage
        .from('avatars')
        .getPublicUrl(filePath)

      const publicUrl = urlData?.publicUrl
      if (!publicUrl) throw new Error('Failed to get public URL')

      // Update profile with new avatar
      const { error: updateError } = await supabase
        .from('profiles')
        .update({ 
          avatar_url: publicUrl,
          updated_at: new Date().toISOString()
        })
        .eq('id', profile.id)

      if (updateError) throw updateError

      // ✅ Emit custom event for cross-page sync
      window.dispatchEvent(new CustomEvent('profile:updated', { 
        detail: { 
          profileId: profile.id, 
          field: 'avatar_url', 
          value: publicUrl 
        } 
      }))

      setMessage({ type: 'success', text: 'Avatar updated!' })
      toast.success('Avatar updated successfully!')
    } catch (error: any) {
      setMessage({ type: 'error', text: error.message || 'Failed to upload avatar' })
      toast.error(error.message || 'Failed to upload avatar')
    } finally {
      setIsUploading(false)
    }
  }, [profile.id, supabase])

  const handleSubmit = useCallback(async (e: React.FormEvent) => {
    e.preventDefault()
    setMessage(null)

    const form = new FormData()
    Object.entries(formData).forEach(([key, value]) => {
      if (value) form.append(key, value)
    })

    const result = await updateProfile(form)
    
    if (result.error) {
      setMessage({ type: 'error', text: result.error })
      toast.error(result.error)
    } else {
      setMessage({ type: 'success', text: 'Profile updated successfully!' })
      toast.success('Profile updated!')
      
      // ✅ Emit custom event for cross-page sync
      window.dispatchEvent(new CustomEvent('profile:updated', { 
        detail: { 
          profileId: profile.id, 
          fields: formData 
        } 
      }))
    }
  }, [formData, profile.id])

  // Listen for global save event from SettingsLayout
  useEffect(() => {
    const handleSave = () => {
      const form = document.querySelector('#profile-settings-form') as HTMLFormElement
      form?.requestSubmit()
    }
    window.addEventListener('settings:save', handleSave)
    return () => window.removeEventListener('settings:save', handleSave)
  }, [])

  return (
    <form id="profile-settings-form" onSubmit={handleSubmit} className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold text-gray-900 mb-1">Profile Information</h3>
        <p className="text-sm text-gray-500">Update your public profile details</p>
      </div>

      {/* Avatar Upload */}
      <div className="flex items-center gap-6">
        <div className="relative">
          <div className="h-20 w-20 rounded-2xl overflow-hidden border-4 border-white shadow-lg"
            style={{ background: avatarPreview ? 'transparent' : KENYA_GRADIENT }}>
            {avatarPreview ? (
              <img src={avatarPreview} alt="Avatar preview" className="h-full w-full object-cover" />
            ) : (
              <div className="h-full w-full flex items-center justify-center text-white text-2xl font-bold">
                {profile.username?.charAt(0).toUpperCase() || 'U'}
              </div>
            )}
          </div>
          <label className="absolute -bottom-1 -right-1 p-2 bg-white rounded-full shadow-lg border-4 border-white cursor-pointer hover:shadow-xl transition-shadow">
            <Camera className="h-4 w-4" style={{ color: '#bb0000' }} />
            <input
              type="file"
              accept="image/*"
              onChange={handleAvatarUpload}
              className="hidden"
              disabled={isUploading}
            />
          </label>
        </div>
        <div>
          <p className="font-medium text-gray-900">Profile Picture</p>
          <p className="text-sm text-gray-500">JPG, PNG or WebP. Max 5MB.</p>
          {isUploading && (
            <p className="text-sm text-[#bb0000] mt-1 flex items-center gap-1">
              <Loader2 className="h-3 w-3 animate-spin" /> Uploading...
            </p>
          )}
        </div>
      </div>

      {/* Form Fields */}
      <div className="grid gap-5 sm:grid-cols-2">
        <div className="sm:col-span-1">
          <label htmlFor="username" className="block text-sm font-medium text-gray-700 mb-1">
            Username *
          </label>
          <input
            type="text"
            id="username"
            name="username"
            value={formData.username}
            onChange={handleChange}
            pattern="^[a-zA-Z0-9_]{3,20}$"
            className="w-full px-4 py-2.5 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#bb0000]/20 focus:border-[#bb0000]"
            required
          />
          <p className="text-xs text-gray-500 mt-1">3-20 characters. Letters, numbers, underscores.</p>
        </div>

        <div className="sm:col-span-1">
          <label htmlFor="full_name" className="block text-sm font-medium text-gray-700 mb-1">
            Full Name
          </label>
          <input
            type="text"
            id="full_name"
            name="full_name"
            value={formData.full_name}
            onChange={handleChange}
            className="w-full px-4 py-2.5 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#bb0000]/20 focus:border-[#bb0000]"
            placeholder="Your name"
          />
        </div>

        <div className="sm:col-span-2">
          <label htmlFor="bio" className="block text-sm font-medium text-gray-700 mb-1">
            Bio
          </label>
          <textarea
            id="bio"
            name="bio"
            value={formData.bio}
            onChange={handleChange}
            rows={3}
            maxLength={500}
            className="w-full px-4 py-2.5 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#bb0000]/20 focus:border-[#bb0000] resize-none"
            placeholder="Tell us about yourself..."
          />
          <p className="text-xs text-gray-500 mt-1 text-right">{formData.bio.length}/500</p>
        </div>
      </div>

      {/* Social Links */}
      <div className="pt-4 border-t border-gray-100">
        <h4 className="font-medium text-gray-900 mb-4">Social Links</h4>
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label htmlFor="twitter" className="block text-sm font-medium text-gray-700 mb-1">
              Twitter/X Handle
            </label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">@</span>
              <input
                type="text"
                id="twitter"
                name="twitter"
                value={formData.twitter}
                onChange={handleChange}
                className="w-full pl-8 pr-4 py-2.5 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#1DA1F2]/20 focus:border-[#1DA1F2]"
                placeholder="username"
              />
            </div>
          </div>
          <div>
            <label htmlFor="instagram" className="block text-sm font-medium text-gray-700 mb-1">
              Instagram Handle
            </label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">@</span>
              <input
                type="text"
                id="instagram"
                name="instagram"
                value={formData.instagram}
                onChange={handleChange}
                className="w-full pl-8 pr-4 py-2.5 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#E1306C]/20 focus:border-[#E1306C]"
                placeholder="username"
              />
            </div>
          </div>
          <div className="sm:col-span-2">
            <label htmlFor="website" className="block text-sm font-medium text-gray-700 mb-1">
              Website
            </label>
            <input
              type="url"
              id="website"
              name="website"
              value={formData.website}
              onChange={handleChange}
              className="w-full px-4 py-2.5 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#007847]/20 focus:border-[#007847]"
              placeholder="https://yourwebsite.com"
            />
          </div>
        </div>
      </div>

      {/* Status Message */}
      {message && (
        <div className={`flex items-center gap-2 p-4 rounded-xl ${
          message.type === 'success' ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'
        }`}>
          {message.type === 'success' ? (
            <Check className="h-5 w-5 shrink-0" />
          ) : (
            <AlertCircle className="h-5 w-5 shrink-0" />
          )}
          <span>{message.text}</span>
          <button 
            type="button" 
            onClick={() => setMessage(null)}
            className="ml-auto p-1 hover:bg-white/50 rounded"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      )}
    </form>
  )
}