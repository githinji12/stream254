// hooks/useProfileForm.ts
'use client'

import { useState, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'
import { toast } from 'react-hot-toast'

interface ProfileFormData {
  username: string
  full_name: string
  bio: string
  twitter?: string
  instagram?: string
  website?: string
}

export function useProfileForm(userId: string, initialData: ProfileFormData) {
  const [formData, setFormData] = useState(initialData)
  const [isSaving, setIsSaving] = useState(false)
  const supabase = createClient()

  const handleChange = useCallback((e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target
    setFormData(prev => ({ ...prev, [name]: value }))
  }, [])

  const handleSubmit = useCallback(async (e?: React.FormEvent) => {
    e?.preventDefault()
    setIsSaving(true)
    
    try {
      // Validate username
      if (formData.username && !/^[a-zA-Z0-9_]{3,20}$/.test(formData.username)) {
        throw new Error('Username must be 3-20 characters (letters, numbers, underscores)')
      }
      
      const { error } = await supabase
        .from('profiles')
        .update({ ...formData, updated_at: new Date().toISOString() })
        .eq('id', userId)
      
      if (error) throw error
      
      toast.success('Profile updated!')
      return { success: true }
    } catch (err: any) {
      toast.error(err.message || 'Failed to update profile')
      return { success: false, error: err.message }
    } finally {
      setIsSaving(false)
    }
  }, [userId, formData, supabase])

  return { formData, handleChange, handleSubmit, isSaving, setFormData }
}