// app/creator-studio/page.tsx
import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { Metadata } from 'next'
import { DashboardLayout } from '@/app/creator-studio/DashboardLayout'
import { AnalyticsCard } from '@/app/creator-studio/AnalyticsCard'
import { VideoManager } from '@/app/creator-studio/VideoManager'
import { EarningsPanel } from '@/app/creator-studio/EarningsPanel'
import { AudienceInsights } from '@/app/creator-studio/AudienceInsights'
import { QuickActions } from '@/app/creator-studio/QuickActions'
// ✅ FIX 1: Remove QuickActions import (component doesn't exist)
// import { QuickActions } from '@/components/creator-studio/QuickActions'
import { getCreatorStats, getCreatorVideos, getEarningsHistory } from './actions'
import type { CreatorTab, EarningsRecord } from '@/lib/types/creator'

export const metadata: Metadata = {
  title: 'Creator Studio | Stream254',
  description: 'Manage your content, track earnings, and grow your audience on Stream254',
  robots: { index: false, follow: false }
}

export default async function CreatorStudioPage({
  searchParams
}: {
  searchParams: Promise<{ tab?: string }>
}) {
  const supabase = await createClient()
  
  // ✅ FIX 2: Correct Supabase auth destructuring
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login?returnTo=/creator-studio')
  }

  // ✅ FIX 3: Correct Supabase database destructuring
  const { data: profile } = await supabase
    .from('profiles')
    .select('username, avatar_url, mpesa_phone, mpesa_verified')
    .eq('id', user.id)
    .single()

  if (!profile) {
    redirect('/signup?role=creator')
  }

  // Fetch stats and data
  const stats = await getCreatorStats(user.id)
  const { videos } = await getCreatorVideos(user.id, 1, 6) // Recent videos for dashboard
  
  // ✅ FIX 4: Transform earnings data to match EarningsRecord type
  const { earnings: rawEarnings } = await getEarningsHistory(user.id, 1, 5)
  const earnings: EarningsRecord[] = rawEarnings.map((e: any) => ({
    id: e.id,
    amount: e.amount,
    currency: 'KES' as const,
    source: 'tip' as const,
    status: e.status as 'pending' | 'paid' | 'failed',
    paid_at: e.status === 'paid' ? e.created_at : null,
    created_at: e.created_at,
    sender: e.sender ? {
      username: e.sender.username,
      avatar_url: e.sender.avatar_url
    } : undefined
  }))

  const tab = (await searchParams).tab as CreatorTab || 'dashboard'

  const tabs: { id: CreatorTab; label: string; icon: string }[] = [
    { id: 'dashboard', label: 'Dashboard', icon: 'layout-dashboard' },
    { id: 'videos', label: 'Videos', icon: 'video' },
    { id: 'earnings', label: 'Earnings', icon: 'wallet' },
    { id: 'audience', label: 'Audience', icon: 'users' },
    { id: 'settings', label: 'Settings', icon: 'settings' },
  ]

  return (
    <DashboardLayout activeTab={tab} tabs={tabs} profile={{
      id: user.id,
      username: profile.username,
      avatar_url: profile.avatar_url
    }}>
      {tab === 'dashboard' && (
        <div className="space-y-6">
          {/* Welcome Header */}
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <h2 className="text-2xl font-bold text-gray-900">
                Welcome back, @{profile.username} 👋
              </h2>
              <p className="text-gray-600">Here's what's happening with your content today.</p>
            </div>
            {/* ✅ FIX 1: Removed QuickActions or create the component */}
            <div className="flex gap-2">
              <a
                href="/upload"
                className="flex items-center gap-2 px-4 py-2 rounded-lg font-medium text-white"
                style={{ background: 'linear-gradient(135deg, #bb0000, #007847)' }}
              >
                <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4M17 8l-5-5-5 5M12 3v12" />
                </svg>
                Upload Video
              </a>
            </div>
          </div>

          {/* Stats Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <AnalyticsCard
              title="Total Views"
              value={stats.totalViews.toLocaleString()}
              trend="+12%"
              icon="eye"
              color="red"
            />
            <AnalyticsCard
              title="Total Likes"
              value={stats.totalLikes.toLocaleString()}
              trend="+8%"
              icon="heart"
              color="green"
            />
            <AnalyticsCard
              title="Followers"
              value={stats.totalFollowers.toLocaleString()}
              trend="+5%"
              icon="users"
              color="blue"
            />
            <AnalyticsCard
              title="Earnings (KSh)"
              value={stats.totalEarnings.toLocaleString()}
              trend="+15%"
              icon="wallet"
              color="mpesa"
              subtitle={stats.pendingPayout > 0 ? `KSh ${stats.pendingPayout} pending` : undefined}
            />
          </div>

          {/* Recent Videos & Earnings */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <VideoManager videos={videos} compact />
            <EarningsPanel earnings={earnings} compact />
          </div>
        </div>
      )}

      {tab === 'videos' && <VideoManager full />}
      {tab === 'earnings' && (
        <EarningsPanel 
          full 
          mpesaPhone={profile.mpesa_phone} 
          mpesaVerified={profile.mpesa_verified} 
        />
      )}
      {tab === 'audience' && <AudienceInsights userId={user.id} />}
      {tab === 'settings' && (
        <div className="text-center py-12">
          <p className="text-gray-600">
            Creator settings coming soon. For now, visit your{' '}
            <a href="/settings" className="text-[#bb0000] hover:underline">
              account settings
            </a>.
          </p>
        </div>
      )}
    </DashboardLayout>
  )
}