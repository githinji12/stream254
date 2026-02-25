// components/settings/SettingsLayout.tsx
'use client'

import { useState, useCallback } from 'react'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { 
  User, Shield, Lock, Bell, CreditCard, AlertTriangle,
  ChevronRight, Save, Loader2
} from 'lucide-react'
import type { SettingsTab } from '@/lib/types/settings'

interface SettingsLayoutProps {
  activeTab: SettingsTab
  tabs: Array<{ id: SettingsTab; label: string; icon: string }>
  children: React.ReactNode
}

const KENYA = {
  red: '#bb0000',
  green: '#007847',
  gradient: 'linear-gradient(135deg, #bb0000, #007847)',
}

const iconMap: Record<string, React.ComponentType<{ className?: string }>> = {
  'user': User,
  'shield': Shield,
  'lock': Lock,
  'bell': Bell,
  'credit-card': CreditCard,
  'alert-triangle': AlertTriangle,
}

export function SettingsLayout({ activeTab, tabs, children }: SettingsLayoutProps) {
  const pathname = usePathname()
  const router = useRouter()
  const [isSaving, setIsSaving] = useState(false)

  const handleTabChange = useCallback((tab: SettingsTab) => {
    router.push(`/settings?tab=${tab}`, { scroll: false })
  }, [router])

  const handleSave = useCallback(async () => {
    setIsSaving(true)
    // Trigger form submission via custom event
    window.dispatchEvent(new CustomEvent('settings:save'))
    setTimeout(() => setIsSaving(false), 1500)
  }, [])

  return (
    <div className="min-h-[calc(100vh-4rem)] bg-[linear-gradient(to_bottom_right,rgb(249_250_251),rgb(243_244_246))]">
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
          
          {/* Sidebar Navigation */}
          <aside className="lg:w-64 shrink-0">
            <nav className="sticky top-24 bg-white rounded-2xl border border-gray-200 shadow-lg p-4" aria-label="Settings navigation">
              <h2 className="px-3 py-2 text-sm font-semibold text-gray-500 uppercase tracking-wider">
                Settings
              </h2>
              <ul className="space-y-1 mt-2" role="tablist">
                {tabs.map((tab) => {
                  const Icon = iconMap[tab.icon] || User
                  const isActive = activeTab === tab.id
                  return (
                    <li key={tab.id}>
                      <button
                        onClick={() => handleTabChange(tab.id)}
                        role="tab"
                        aria-selected={isActive}
                        aria-controls={`settings-${tab.id}`}
                        className={`
                          w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-left transition-all duration-200
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

              {/* Save Button */}
              <div className="mt-6 pt-4 border-t border-gray-100">
                <button
                  onClick={handleSave}
                  disabled={isSaving}
                  className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl font-medium text-white transition-all disabled:opacity-50"
                  style={{ background: KENYA.gradient }}
                >
                  {isSaving ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Saving...
                    </>
                  ) : (
                    <>
                      <Save className="h-4 w-4" />
                      Save Changes
                    </>
                  )}
                </button>
              </div>
            </nav>
          </aside>

          {/* Main Content */}
          <main className="flex-1 min-w-0">
            <div 
              id={`settings-${activeTab}`}
              role="tabpanel"
              aria-labelledby={`tab-${activeTab}`}
              className="bg-white rounded-2xl border border-gray-200 shadow-lg p-6 sm:p-8"
            >
              {children}
            </div>
          </main>
        </div>
      </div>
    </div>
  )
}