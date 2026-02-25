// app/creator-studio/DashboardLayout.tsx
'use client'

import { useState, useCallback } from 'react'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { 
  LayoutDashboard, Video, Wallet, Users, Settings,
  ChevronRight, LogOut, Menu, X
} from 'lucide-react'
import type { CreatorTab } from '@/lib/types/creator'

interface DashboardLayoutProps {
  activeTab: CreatorTab
  tabs: Array<{ id: CreatorTab; label: string; icon: string }>
  // ✅ FIX: Added id field to profile type
  profile: { 
    id: string
    username: string
    avatar_url?: string | null 
  }
  children: React.ReactNode
}

const KENYA = {
  red: '#bb0000',
  green: '#007847',
  gradient: 'linear-gradient(135deg, #bb0000, #007847)',
}

const iconMap: Record<string, React.ComponentType<{ className?: string }>> = {
  'layout-dashboard': LayoutDashboard,
  'video': Video,
  'wallet': Wallet,
  'users': Users,
  'settings': Settings,
}

export function DashboardLayout({ activeTab, tabs, profile, children }: DashboardLayoutProps) {
  const pathname = usePathname()
  const router = useRouter()
  const [sidebarOpen, setSidebarOpen] = useState(false)

  const handleTabChange = useCallback((tab: CreatorTab) => {
    router.push(`/creator-studio?tab=${tab}`, { scroll: false })
    setSidebarOpen(false)
  }, [router])

  return (
    <div className="min-h-[calc(100vh-4rem)] bg-linear-to-br from-gray-50 to-gray-100">
      {/* Kenyan Flag Stripe */}
      <div 
        className="fixed top-16 left-0 right-0 h-1 z-30"
        style={{
          background: 'linear-gradient(90deg, #007847 0%, #007847 33%, #000000 33%, #000000 34%, #bb0000 34%, #bb0000 66%, #000000 66%, #000000 67%, #007847 67%, #007847 100%)'
        }}
        aria-hidden="true"
      />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex flex-col lg:flex-row gap-8">
          
          {/* Desktop Sidebar */}
          <aside className="hidden lg:block lg:w-64 shrink-0">
            <nav className="sticky top-24 bg-white rounded-2xl border border-gray-200 shadow-lg p-4">
              {/* Creator Profile */}
              <div className="flex items-center gap-3 px-3 py-4 border-b border-gray-100">
                <div className="h-10 w-10 rounded-full overflow-hidden bg-gray-100">
                  {profile.avatar_url ? (
                    <img src={profile.avatar_url} alt={profile.username} className="h-full w-full object-cover" />
                  ) : (
                    <div className="h-full w-full flex items-center justify-center text-white text-sm font-bold" style={{ background: KENYA.gradient }}>
                      {profile.username.charAt(0).toUpperCase()}
                    </div>
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-gray-900 truncate">@{profile.username}</p>
                  <p className="text-xs text-gray-500">Creator</p>
                </div>
              </div>

              {/* Navigation */}
              <ul className="space-y-1 mt-4" role="tablist">
                {tabs.map((tab) => {
                  const Icon = iconMap[tab.icon] || LayoutDashboard
                  const isActive = activeTab === tab.id
                  return (
                    <li key={tab.id}>
                      <button
                        onClick={() => handleTabChange(tab.id)}
                        role="tab"
                        aria-selected={isActive}
                        className={`
                          w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-left transition-all
                          ${isActive 
                            ? 'bg-[#bb0000]/10 text-[#bb0000] font-medium' 
                            : 'text-gray-700 hover:bg-gray-50'
                          }
                        `}
                      >
                        <Icon className={`h-5 w-5 ${isActive ? 'text-[#bb0000]' : 'text-gray-400'}`} />
                        <span className="flex-1">{tab.label}</span>
                        {isActive && <ChevronRight className="h-4 w-4" />}
                      </button>
                    </li>
                  )
                })}
              </ul>

              {/* Back to Profile */}
              <div className="mt-6 pt-4 border-t border-gray-100">
                {/* ✅ FIX: Now profile.id exists */}
                <Link
                  href={`/profile/${profile.id}`}
                  className="flex items-center gap-2 px-3 py-2 text-sm text-gray-600 hover:text-[#bb0000] transition-colors"
                >
                  <Users className="h-4 w-4" />
                  View Public Profile
                </Link>
              </div>
            </nav>
          </aside>

          {/* Mobile Header */}
          <div className="lg:hidden flex items-center justify-between mb-4">
            <button
              onClick={() => setSidebarOpen(true)}
              className="p-2 hover:bg-gray-100 rounded-lg"
              aria-label="Open menu"
            >
              <Menu className="h-6 w-6" />
            </button>
            <h1 className="font-semibold text-gray-900">Creator Studio</h1>
            <div className="w-10" /> {/* Spacer */}
          </div>

          {/* Mobile Sidebar */}
          {sidebarOpen && (
            <div className="fixed inset-0 z-50 lg:hidden" role="dialog" aria-modal="true">
              <div className="absolute inset-0 bg-black/50" onClick={() => setSidebarOpen(false)} />
              <div className="absolute left-0 top-0 bottom-0 w-72 bg-white shadow-xl p-4">
                <div className="flex items-center justify-between mb-6">
                  <h2 className="font-semibold">Menu</h2>
                  <button onClick={() => setSidebarOpen(false)} className="p-2 hover:bg-gray-100 rounded-lg">
                    <X className="h-5 w-5" />
                  </button>
                </div>
                
                {/* Creator Profile */}
                <div className="flex items-center gap-3 px-3 py-4 border-b border-gray-100 mb-4">
                  <div className="h-10 w-10 rounded-full overflow-hidden bg-gray-100">
                    {profile.avatar_url ? (
                      <img src={profile.avatar_url} alt={profile.username} className="h-full w-full object-cover" />
                    ) : (
                      <div className="h-full w-full flex items-center justify-center text-white text-sm font-bold" style={{ background: KENYA.gradient }}>
                        {profile.username.charAt(0).toUpperCase()}
                      </div>
                    )}
                  </div>
                  <div>
                    <p className="font-medium">@{profile.username}</p>
                    <p className="text-xs text-gray-500">Creator</p>
                  </div>
                </div>

                {/* Navigation */}
                <nav className="space-y-1">
                  {tabs.map((tab) => {
                    const Icon = iconMap[tab.icon] || LayoutDashboard
                    const isActive = activeTab === tab.id
                    return (
                      <button
                        key={tab.id}
                        onClick={() => handleTabChange(tab.id)}
                        className={`
                          w-full flex items-center gap-3 px-3 py-3 rounded-xl text-left transition-all
                          ${isActive 
                            ? 'bg-[#bb0000]/10 text-[#bb0000] font-medium' 
                            : 'text-gray-700 hover:bg-gray-50'
                          }
                        `}
                      >
                        <Icon className={`h-5 w-5 ${isActive ? 'text-[#bb0000]' : 'text-gray-400'}`} />
                        <span>{tab.label}</span>
                      </button>
                    )
                  })}
                </nav>

                {/* Back to Profile */}
                <div className="mt-6 pt-4 border-t border-gray-100">
                  {/* ✅ FIX: Now profile.id exists */}
                  <Link
                    href={`/profile/${profile.id}`}
                    onClick={() => setSidebarOpen(false)}
                    className="flex items-center gap-2 px-3 py-3 text-sm text-gray-600 hover:text-[#bb0000]"
                  >
                    <Users className="h-4 w-4" />
                    View Public Profile
                  </Link>
                </div>
              </div>
            </div>
          )}

          {/* Main Content */}
          <main className="flex-1 min-w-0">
            <div className="bg-white rounded-2xl border border-gray-200 shadow-lg p-6 sm:p-8">
              {children}
            </div>
          </main>
        </div>
      </div>
    </div>
  )
}