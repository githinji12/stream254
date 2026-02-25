// components/settings/NotificationSettings.tsx
'use client'

import { useState, useCallback, useEffect } from 'react'
import { Bell, Mail, Smartphone, Users, Heart, MessageCircle, DollarSign, Loader2, Check, AlertCircle, X } from 'lucide-react'
import { updateNotifications } from '@/app/settings/actions'
import type { NotificationPreferences } from '@/lib/types/settings'
import { toast } from 'react-hot-toast'

interface NotificationSettingsProps {
  preferences: NotificationPreferences | null
  userId: string
}

const KENYA_GRADIENT = 'linear-gradient(135deg, #bb0000, #007847)'

export function NotificationSettings({ preferences, userId }: NotificationSettingsProps) {
  const [settings, setSettings] = useState<NotificationPreferences>({
    email_notifications: preferences?.email_notifications ?? true,
    push_notifications: preferences?.push_notifications ?? true,
    new_follower: preferences?.new_follower ?? true,
    video_comment: preferences?.video_comment ?? true,
    video_like: preferences?.video_like ?? true,
    tip_received: preferences?.tip_received ?? true,
    marketing_emails: preferences?.marketing_emails ?? false,
  })
  const [isSaving, setIsSaving] = useState(false)
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null)

  const handleChange = useCallback((key: keyof NotificationPreferences, value: boolean) => {
    setSettings(prev => ({ ...prev, [key]: value }))
  }, [])

  const handleSubmit = useCallback(async (e: React.FormEvent) => {
    e.preventDefault()
    setMessage(null)
    setIsSaving(true)

    const result = await updateNotifications(settings)
    
    if (result.error) {
      setMessage({ type: 'error', text: result.error })
      toast.error(result.error)
    } else {
      setMessage({ type: 'success', text: 'Notification preferences updated!' })
      toast.success('Notifications updated!')
    }
    setIsSaving(false)
  }, [settings])

  useEffect(() => {
    const handleSave = () => {
      const form = document.querySelector('#notification-settings-form') as HTMLFormElement
      form?.requestSubmit()
    }
    window.addEventListener('settings:save', handleSave)
    return () => window.removeEventListener('settings:save', handleSave)
  }, [])

  const notificationGroups = [
    {
      title: 'Social Activity',
      icon: Users,
      items: [
        { key: 'new_follower', label: 'New Followers', description: 'When someone follows you', icon: Users },
        { key: 'video_comment', label: 'Comments on Videos', description: 'When someone comments on your content', icon: MessageCircle },
        { key: 'video_like', label: 'Likes on Videos', description: 'When your videos receive likes', icon: Heart },
      ]
    },
    {
      title: 'Monetization',
      icon: DollarSign,
      items: [
        { key: 'tip_received', label: 'Tips Received', description: 'When you receive M-Pesa tips', icon: DollarSign },
      ]
    },
    {
      title: 'Platform Updates',
      icon: Bell,
      items: [
        { key: 'marketing_emails', label: 'Marketing Emails', description: 'News, features, and promotions from Stream254', icon: Mail },
      ]
    },
  ]

  return (
    <form id="notification-settings-form" onSubmit={handleSubmit} className="space-y-8">
      <div>
        <h3 className="text-lg font-semibold text-gray-900 mb-1">Notification Preferences</h3>
        <p className="text-sm text-gray-500">Choose what notifications you receive and how</p>
      </div>

      {/* Delivery Methods */}
      <div className="p-4 bg-gray-50 rounded-xl">
        <p className="font-medium text-gray-900 mb-3">Delivery Methods</p>
        <div className="space-y-3">
          <label className="flex items-center justify-between p-3 bg-white border border-gray-200 rounded-lg">
            <div className="flex items-center gap-3">
              <Mail className="h-5 w-5 text-gray-500" />
              <div>
                <p className="font-medium text-gray-900">Email Notifications</p>
                <p className="text-xs text-gray-500">Receive notifications via email</p>
              </div>
            </div>
            <button
              type="button"
              role="switch"
              aria-checked={settings.email_notifications}
              onClick={() => handleChange('email_notifications', !settings.email_notifications)}
              className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                settings.email_notifications ? 'bg-[#007847]' : 'bg-gray-300'
              }`}
            >
              <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                settings.email_notifications ? 'translate-x-6' : 'translate-x-1'
              }`} />
            </button>
          </label>

          <label className="flex items-center justify-between p-3 bg-white border border-gray-200 rounded-lg">
            <div className="flex items-center gap-3">
              <Smartphone className="h-5 w-5 text-gray-500" />
              <div>
                <p className="font-medium text-gray-900">Push Notifications</p>
                <p className="text-xs text-gray-500">Receive notifications on your device</p>
              </div>
            </div>
            <button
              type="button"
              role="switch"
              aria-checked={settings.push_notifications}
              onClick={() => handleChange('push_notifications', !settings.push_notifications)}
              className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                settings.push_notifications ? 'bg-[#007847]' : 'bg-gray-300'
              }`}
            >
              <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                settings.push_notifications ? 'translate-x-6' : 'translate-x-1'
              }`} />
            </button>
          </label>
        </div>
      </div>

      {/* Notification Types */}
      {notificationGroups.map((group) => {
        const Icon = group.icon
        return (
          <div key={group.title} className="space-y-3">
            <h4 className="font-medium text-gray-900 flex items-center gap-2">
              <Icon className="h-5 w-5 text-[#bb0000]" />
              {group.title}
            </h4>
            <div className="space-y-2">
              {group.items.map((item) => {
                const ItemIcon = item.icon
                return (
                  <label key={item.key} className="flex items-center justify-between p-4 border border-gray-200 rounded-xl hover:bg-gray-50 transition-colors">
                    <div className="flex items-center gap-3">
                      <ItemIcon className="h-5 w-5 text-gray-400" />
                      <div>
                        <p className="font-medium text-gray-900">{item.label}</p>
                        <p className="text-sm text-gray-500">{item.description}</p>
                      </div>
                    </div>
                    <button
                      type="button"
                      role="switch"
                      aria-checked={settings[item.key as keyof NotificationPreferences]}
                      onClick={() => handleChange(item.key as keyof NotificationPreferences, !settings[item.key as keyof NotificationPreferences])}
                      className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                        settings[item.key as keyof NotificationPreferences] ? 'bg-[#007847]' : 'bg-gray-300'
                      }`}
                    >
                      <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                        settings[item.key as keyof NotificationPreferences] ? 'translate-x-6' : 'translate-x-1'
                      }`} />
                    </button>
                  </label>
                )
              })}
            </div>
          </div>
        )
      })}

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
          {isSaving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Bell className="h-4 w-4" />}
          {isSaving ? 'Saving...' : 'Save Preferences'}
        </button>
      </div>
    </form>
  )
}