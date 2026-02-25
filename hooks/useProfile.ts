// hooks/useProfile.ts
'use client'

import { useEffect, useState, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'
import type { ExtendedProfile } from '@/lib/types'

export function useProfile(profileId: string) {
  const [profile, setProfile] = useState<ExtendedProfile | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const supabase = createClient()

  const fetchProfile = useCallback(async () => {
    try {
      setIsLoading(true)
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', profileId)
        .single()
      
      if (error) throw error
      setProfile(data as ExtendedProfile)
      setError(null)
    } catch (err: any) {
      setError(err.message)
    } finally {
      setIsLoading(false)
    }
  }, [profileId])

  useEffect(() => {
    fetchProfile()
  }, [fetchProfile])

  // ✅ Realtime subscription
  useEffect(() => {
    const channel = supabase
      .channel(`profile-${profileId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'profiles',
          filter: `id=eq.${profileId}`,
        },
        (payload) => {
          if (payload.eventType === 'UPDATE' && payload.new) {
            setProfile(payload.new as ExtendedProfile)
          }
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [profileId])

  // ✅ Listen for custom update events
  useEffect(() => {
    const handleProfileUpdate = (event: CustomEvent) => {
      const { profileId: eventId, field, fields, value } = event.detail
      
      if (eventId === profileId) {
        setProfile(prev => {
          if (!prev) return prev
          
          if (field && value !== undefined) {
            return { ...prev, [field]: value }
          } else if (fields) {
            return { ...prev, ...fields }
          }
          
          return prev
        })
      }
    }

    window.addEventListener('profile:updated', handleProfileUpdate as EventListener)
    
    return () => {
      window.removeEventListener('profile:updated', handleProfileUpdate as EventListener)
    }
  }, [profileId])

  return { profile, isLoading, error, refreshProfile: fetchProfile }
}