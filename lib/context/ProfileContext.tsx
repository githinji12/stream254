// lib/context/ProfileContext.tsx
'use client'

import { createContext, useContext, useEffect, useState, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'
import type { ExtendedProfile } from '@/lib/types'

interface ProfileContextType {
  profile: ExtendedProfile | null
  isLoading: boolean
  refreshProfile: () => Promise<void>
}

const ProfileContext = createContext<ProfileContextType | undefined>(undefined)

export function ProfileProvider({ 
  children, 
  profileId 
}: { 
  children: React.ReactNode
  profileId: string 
}) {
  const [profile, setProfile] = useState<ExtendedProfile | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const supabase = createClient()

  // Fetch initial profile
  const fetchProfile = useCallback(async () => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', profileId)
        .single()
      
      if (error) throw error
      setProfile(data as ExtendedProfile)
    } catch (error) {
      console.error('Profile fetch error:', error)
    } finally {
      setIsLoading(false)
    }
  }, [profileId, supabase])

  // Initial fetch
  useEffect(() => {
    fetchProfile()
  }, [fetchProfile])

  // ✅ REALTIME: Subscribe to profile changes
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
          console.log('🔄 Profile changed:', payload)
          if (payload.eventType === 'UPDATE' && payload.new) {
            setProfile(payload.new as ExtendedProfile)
          }
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [profileId, supabase])

  const refreshProfile = useCallback(async () => {
    await fetchProfile()
  }, [fetchProfile])

  return (
    <ProfileContext.Provider value={{ profile, isLoading, refreshProfile }}>
      {children}
    </ProfileContext.Provider>
  )
}

export function useProfile() {
  const context = useContext(ProfileContext)
  if (context === undefined) {
    throw new Error('useProfile must be used within a ProfileProvider')
  }
  return context
}