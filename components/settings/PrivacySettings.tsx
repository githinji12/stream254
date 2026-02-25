// components/settings/PrivacySettings.tsx
'use client'

import { useState, useCallback, useEffect } from 'react'
// ✅ FIX: Add Phone to imports
import { Lock, Eye, EyeOff, MessageSquare, Video, Globe, Loader2, Check, AlertCircle, X, Phone } from 'lucide-react'
import { updatePrivacy } from '@/app/settings/actions'
import type { UserProfile, PrivacySettings as PrivacySettingsType } from '@/lib/types/settings'
import { toast } from 'react-hot-toast'

interface PrivacySettingsProps {
  profile: UserProfile
}

const KENYA_GRADIENT = 'linear-gradient(135deg, #bb0000, #007847)'

export function PrivacySettings({ profile }: PrivacySettingsProps) {
  const [settings, setSettings] = useState<PrivacySettingsType>({
    is_private: profile.is_private || false,
    show_email: profile.show_email || false,
    show_phone: profile.show_phone || false,
    allow_messages: profile.allow_messages !== false,
    default_video_visibility: (profile.default_video_visibility as 'public' | 'private' | 'unlisted') || 'public',
  })
  const [isSaving, setIsSaving] = useState(false)
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null)

  const handleChange = useCallback((key: keyof PrivacySettingsType, value: boolean | string) => {
    setSettings(prev => ({ ...prev, [key]: value }))
  }, [])

  const handleSubmit = useCallback(async (e: React.FormEvent) => {
    e.preventDefault()
    setMessage(null)
    setIsSaving(true)

    const result = await updatePrivacy(settings)
    
    if (result.error) {
      setMessage({ type: 'error', text: result.error })
      toast.error(result.error)
    } else {
      setMessage({ type: 'success', text: 'Privacy settings updated!' })
      toast.success('Privacy updated!')
    }
    setIsSaving(false)
  }, [settings])

  useEffect(() => {
    const handleSave = () => {
      const form = document.querySelector('#privacy-settings-form') as HTMLFormElement
      form?.requestSubmit()
    }
    window.addEventListener('settings:save', handleSave)
    return () => window.removeEventListener('settings:save', handleSave)
  }, [])

  return (
    <form id="privacy-settings-form" onSubmit={handleSubmit} className="space-y-8">
      <div>
        <h3 className="text-lg font-semibold text-gray-900 mb-1">Privacy Settings</h3>
        <p className="text-sm text-gray-500">Control who can see your content and contact you</p>
      </div>

      {/* Account Privacy */}
      <div className="space-y-4">
        <h4 className="font-medium text-gray-900 flex items-center gap-2">
          <Lock className="h-5 w-5 text-[#bb0000]" />
          Account Privacy
        </h4>
        
        <div className="space-y-3">
          <label className="flex items-start gap-3 p-4 border border-gray-200 rounded-xl hover:bg-gray-50 transition-colors cursor-pointer">
            <input
              type="checkbox"
              checked={settings.is_private}
              onChange={(e) => handleChange('is_private', e.target.checked)}
              className="mt-1 h-4 w-4 text-[#bb0000] border-gray-300 rounded focus:ring-[#bb0000]"
            />
            <div className="flex-1">
              <p className="font-medium text-gray-900">Private Account</p>
              <p className="text-sm text-gray-500 mt-1">
                When enabled, only approved followers can see your videos and profile details.
              </p>
            </div>
          </label>

          <label className="flex items-start gap-3 p-4 border border-gray-200 rounded-xl hover:bg-gray-50 transition-colors cursor-pointer">
            <input
              type="checkbox"
              checked={settings.show_email}
              onChange={(e) => handleChange('show_email', e.target.checked)}
              className="mt-1 h-4 w-4 text-[#bb0000] border-gray-300 rounded focus:ring-[#bb0000]"
            />
            <div className="flex-1">
              <p className="font-medium text-gray-900 flex items-center gap-2">
                <Eye className="h-4 w-4" />
                Show Email on Profile
              </p>
              <p className="text-sm text-gray-500 mt-1">
                Allow other users to see your email address on your public profile.
              </p>
            </div>
          </label>

          <label className="flex items-start gap-3 p-4 border border-gray-200 rounded-xl hover:bg-gray-50 transition-colors cursor-pointer">
            <input
              type="checkbox"
              checked={settings.show_phone}
              onChange={(e) => handleChange('show_phone', e.target.checked)}
              className="mt-1 h-4 w-4 text-[#bb0000] border-gray-300 rounded focus:ring-[#bb0000]"
            />
            <div className="flex-1">
              <p className="font-medium text-gray-900 flex items-center gap-2">
                {/* ✅ FIX: Phone icon now imported */}
                <Phone className="h-4 w-4" />
                Show Phone on Profile
              </p>
              <p className="text-sm text-gray-500 mt-1">
                Display your M-Pesa phone number for business inquiries.
              </p>
            </div>
          </label>
        </div>
      </div>

      {/* Messaging & Content */}
      <div className="space-y-4 pt-4 border-t border-gray-200">
        <h4 className="font-medium text-gray-900 flex items-center gap-2">
          <MessageSquare className="h-5 w-5 text-[#bb0000]" />
          Messaging & Content
        </h4>
        
        <div className="space-y-3">
          <label className="flex items-start gap-3 p-4 border border-gray-200 rounded-xl hover:bg-gray-50 transition-colors cursor-pointer">
            <input
              type="checkbox"
              checked={settings.allow_messages}
              onChange={(e) => handleChange('allow_messages', e.target.checked)}
              className="mt-1 h-4 w-4 text-[#bb0000] border-gray-300 rounded focus:ring-[#bb0000]"
            />
            <div className="flex-1">
              <p className="font-medium text-gray-900">Allow Direct Messages</p>
              <p className="text-sm text-gray-500 mt-1">
                Let other Stream254 users send you private messages.
              </p>
            </div>
          </label>

          <div className="p-4 border border-gray-200 rounded-xl">
            <p className="font-medium text-gray-900 flex items-center gap-2 mb-3">
              <Video className="h-5 w-5 text-[#bb0000]" />
              Default Video Visibility
            </p>
            <div className="space-y-2">
              {(['public', 'unlisted', 'private'] as const).map((visibility) => (
                <label key={visibility} className="flex items-center gap-3 cursor-pointer">
                  <input
                    type="radio"
                    name="default_video_visibility"
                    value={visibility}
                    checked={settings.default_video_visibility === visibility}
                    onChange={(e) => handleChange('default_video_visibility', e.target.value)}
                    className="h-4 w-4 text-[#bb0000] border-gray-300 focus:ring-[#bb0000]"
                  />
                  <div>
                    <p className="font-medium text-gray-900 capitalize">{visibility}</p>
                    <p className="text-xs text-gray-500">
                      {visibility === 'public' && 'Anyone can find and watch your videos'}
                      {visibility === 'unlisted' && 'Only people with the link can watch'}
                      {visibility === 'private' && 'Only you can watch your videos'}
                    </p>
                  </div>
                </label>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Data & Security Notice */}
      <div className="p-4 bg-[#bb0000]/5 border border-[#bb0000]/20 rounded-xl">
        <p className="text-sm text-[#bb0000] flex items-start gap-2">
          <Lock className="h-4 w-4 shrink-0 mt-0.5" />
          <span>
            <strong>Kenyan Data Protection:</strong> Your data is stored securely in compliance with 
            the Data Protection Act, 2019.
          </span>
        </p>
      </div>

      {message && (
        <div className={`flex items-center gap-2 p-4 rounded-xl ${
          message.type === 'success' ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'
        }`}>
          {message.type === 'success' ? <Check className="h-5 w-5 shrink-0" /> : <AlertCircle className="h-5 w-5 shrink-0" />}
          <span>{message.text}</span>
          <button type="button" onClick={() => setMessage(null)} className="ml-auto p-1 hover:bg-white/50 rounded">
            <X className="h-4 w-4" />
          </button>
        </div>
      )}

      <div className="flex justify-end pt-4 border-t border-gray-100">
        <button
          type="submit"
          disabled={isSaving}
          className="flex items-center gap-2 px-6 py-2.5 rounded-xl font-medium text-white transition-all disabled:opacity-50"
          style={{ background: KENYA_GRADIENT }}
        >
          {isSaving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Check className="h-4 w-4" />}
          {isSaving ? 'Saving...' : 'Save Privacy Settings'}
        </button>
      </div>
    </form>
  )
}