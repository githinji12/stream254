// components/shared/SocialLinksEditor.tsx
'use client'

import { useState, useCallback } from 'react'
import { Edit, Twitter, Instagram, Globe, Loader2, Check } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { toast } from 'react-hot-toast'

interface SocialLinksEditorProps {
  userId: string
  // ✅ FIX: Accept null and undefined
  twitter?: string | null
  instagram?: string | null
  website?: string | null
  onUpdate?: (links: { twitter?: string; instagram?: string; website?: string }) => void
  editable?: boolean
}

export function SocialLinksEditor({ 
  userId, 
  twitter, 
  instagram, 
  website, 
  onUpdate,
  editable = true 
}: SocialLinksEditorProps) {
  const [editing, setEditing] = useState(false)
  // ✅ FIX: Handle null/undefined with fallback to empty string
  const [values, setValues] = useState({ 
    twitter: twitter || '', 
    instagram: instagram || '', 
    website: website || '' 
  })
  const [saving, setSaving] = useState(false)
  const supabase = createClient()

  const handleSave = useCallback(async () => {
    setSaving(true)
    try {
      const { error } = await supabase
        .from('profiles')
        .update({ 
          twitter: values.twitter || null, 
          instagram: values.instagram || null, 
          website: values.website || null,
          updated_at: new Date().toISOString() 
        })
        .eq('id', userId)
      if (error) throw error
      onUpdate?.(values)
      setEditing(false)
      toast.success('Social links updated!')
    } catch {
      toast.error('Failed to update')
    } finally {
      setSaving(false)
    }
  }, [userId, values, onUpdate, supabase])

  const formatUrl = (platform: string, handle: string) => {
    if (!handle) return ''
    const urls: Record<string, string> = {
      twitter: `https://twitter.com/${handle.replace('@', '')}`,
      instagram: `https://instagram.com/${handle.replace('@', '')}`,
      website: handle.startsWith('http') ? handle : `https://${handle}`
    }
    return urls[platform] || handle
  }

  // Display mode
  if (!editing || !editable) {
    const hasLinks = values.twitter || values.instagram || values.website
    return (
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h4 className="font-medium text-gray-700">Social Links</h4>
          {editable && (
            <button 
              onClick={() => setEditing(true)} 
              className="text-sm text-[#bb0000] hover:underline flex items-center gap-1"
            >
              <Edit className="h-3.5 w-3.5" /> Edit
            </button>
          )}
        </div>
        {hasLinks ? (
          <div className="flex flex-wrap gap-2">
            {values.twitter && (
              <a 
                href={formatUrl('twitter', values.twitter)} 
                target="_blank" 
                rel="noopener noreferrer" 
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-[#1DA1F2]/10 text-[#1DA1F2] text-sm"
              >
                <Twitter className="h-4 w-4" />
                {values.twitter.replace('@', '')}
              </a>
            )}
            {values.instagram && (
              <a 
                href={formatUrl('instagram', values.instagram)} 
                target="_blank" 
                rel="noopener noreferrer" 
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-[#E1306C]/10 text-[#E1306C] text-sm"
              >
                <Instagram className="h-4 w-4" />
                {values.instagram.replace('@', '')}
              </a>
            )}
            {values.website && (
              <a 
                href={formatUrl('website', values.website)} 
                target="_blank" 
                rel="noopener noreferrer" 
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-gray-100 text-gray-700 text-sm"
              >
                <Globe className="h-4 w-4" />
                {values.website.replace(/^https?:\/\//, '').replace(/\/$/, '').slice(0, 20)}
              </a>
            )}
          </div>
        ) : (
          <p className="text-sm text-gray-500 italic">No social links added</p>
        )}
      </div>
    )
  }

  // Edit mode
  return (
    <div className="space-y-4 p-4 bg-gray-50 rounded-xl">
      <div className="flex items-center justify-between">
        <h4 className="font-medium">Edit Social Links</h4>
        <button 
          onClick={() => { 
            setEditing(false)
            setValues({ twitter: twitter || '', instagram: instagram || '', website: website || '' }) 
          }} 
          className="text-sm text-gray-500"
        >
          Cancel
        </button>
      </div>
      <div className="space-y-3">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            <Twitter className="h-4 w-4 inline mr-1" /> Twitter/X
          </label>
          <div className="relative">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">@</span>
            <input 
              type="text" 
              value={values.twitter} 
              onChange={(e) => setValues(v => ({ ...v, twitter: e.target.value }))} 
              className="w-full pl-8 pr-3 py-2 border rounded-lg" 
              placeholder="username" 
            />
          </div>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            <Instagram className="h-4 w-4 inline mr-1" /> Instagram
          </label>
          <div className="relative">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">@</span>
            <input 
              type="text" 
              value={values.instagram} 
              onChange={(e) => setValues(v => ({ ...v, instagram: e.target.value }))} 
              className="w-full pl-8 pr-3 py-2 border rounded-lg" 
              placeholder="username" 
            />
          </div>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            <Globe className="h-4 w-4 inline mr-1" /> Website
          </label>
          <input 
            type="url" 
            value={values.website} 
            onChange={(e) => setValues(v => ({ ...v, website: e.target.value }))} 
            className="w-full px-3 py-2 border rounded-lg" 
            placeholder="https://yourwebsite.com" 
          />
        </div>
      </div>
      <button 
        onClick={handleSave} 
        disabled={saving} 
        className="w-full py-2 rounded-lg text-white flex items-center justify-center gap-2"
        style={{ background: 'linear-gradient(135deg, #bb0000, #007847)' }}
      >
        {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Check className="h-4 w-4" />}
        {saving ? 'Saving...' : 'Save Changes'}
      </button>
    </div>
  )
}