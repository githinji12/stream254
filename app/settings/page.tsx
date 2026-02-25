// app/settings/page.tsx
import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { Metadata } from 'next'
import { SettingsLayout } from '@/components/settings/SettingsLayout'
import { ProfileSettings } from '@/components/settings/ProfileSettings'
import { AccountSettings } from '@/components/settings/AccountSettings'
import { PrivacySettings } from '@/components/settings/PrivacySettings'
import { NotificationSettings } from '@/components/settings/NotificationSettings'
import { PaymentSettings } from '@/components/settings/PaymentSettings'
import { DangerZone } from '@/components/settings/DangerZone'
import type { SettingsTab } from '@/lib/types/settings'

export const metadata: Metadata = {
  title: 'Settings | Stream254',
  description: 'Manage your Stream254 account settings, privacy, and preferences',
  robots: { index: false, follow: false }
}

export default async function SettingsPage({
  searchParams
}: {
  searchParams: Promise<{ tab?: string }>
}) {
  // ✅ FIX: Await createClient() in Server Component
  const supabase = await createClient()
  
  // ✅ FIX: Correct destructuring for getUser() - data contains user
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login?returnTo=/settings')
  }

  // ✅ FIX: Await database queries
  const { data: profile } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .single()

  if (!profile) {
    redirect('/signup')
  }

  const { data: preferences } = await supabase
    .from('notification_preferences')
    .select('*')
    .eq('user_id', user.id)
    .single()

  const tab = (await searchParams).tab as SettingsTab || 'profile'

  const tabs: { id: SettingsTab; label: string; icon: string }[] = [
    { id: 'profile', label: 'Profile', icon: 'user' },
    { id: 'account', label: 'Account', icon: 'shield' },
    { id: 'privacy', label: 'Privacy', icon: 'lock' },
    { id: 'notifications', label: 'Notifications', icon: 'bell' },
    { id: 'payments', label: 'Payments', icon: 'credit-card' },
    { id: 'danger', label: 'Danger Zone', icon: 'alert-triangle' },
  ]

  return (
    <SettingsLayout activeTab={tab} tabs={tabs}>
      {tab === 'profile' && <ProfileSettings profile={profile} />}
      
      {/* ✅ FIX: Transform user object to match expected type (email: string | null | undefined) */}
      {tab === 'account' && (
        <AccountSettings 
          user={{ 
            id: user.id, 
            email: user.email ?? null  // Convert undefined to null
          }} 
          profile={profile} 
        />
      )}
      
      {tab === 'privacy' && <PrivacySettings profile={profile} />}
      {tab === 'notifications' && (
        <NotificationSettings preferences={preferences} userId={user.id} />
      )}
      {tab === 'payments' && <PaymentSettings profile={profile} />}
      {tab === 'danger' && <DangerZone />}
    </SettingsLayout>
  )
}