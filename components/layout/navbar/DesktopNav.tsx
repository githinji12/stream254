// components/layout/navbar/DesktopNav.tsx
'use client'

import { memo, useCallback, useState } from 'react'
import { usePathname, useRouter } from 'next/navigation'
import { useLanguage } from '@/lib/i18n/client'
import { NavItem, UserProfile } from '@/lib/navigation/types'
import { GRADIENTS, ANIMATIONS, FOCUS_RING } from '@/lib/constants/navbar'

// Sub-components
import { SearchBar } from './SearchBar'
import { ProfileDropdown } from './ProfileDropdown'

type DesktopNavProps = {
  navItems: NavItem[]
  isAuthenticated: boolean
  user?: UserProfile | null
}

export const DesktopNav = memo(function DesktopNav({
  navItems,
  isAuthenticated,
  user,
}: DesktopNavProps) {
  const { t } = useLanguage()
  const router = useRouter()
  const pathname = usePathname()

  const handleNavigate = useCallback(
    (href: string) => {
      router.push(href)
    },
    [router]
  )

  return (
    <>
      {/* Search Bar */}
      <div className="flex-1 max-w-xl mx-4">
        <SearchBar />
      </div>

      {/* Navigation Links */}
      <nav className="flex items-center gap-1" aria-label="Primary navigation">
        {navItems.map((item) => {
          const isActive = pathname === item.href
          
          return (
            <button
              key={item.id}
              onClick={() => handleNavigate(item.href)}
              className={`
                relative flex items-center gap-2 px-4 py-2 rounded-lg 
                font-medium text-sm transition-all duration-300 group
                ${
                  isActive
                    ? 'text-[var(--kenya-red)] dark:text-[#ff6b6b]'
                    : 'text-gray-700 dark:text-gray-300 hover:text-[var(--kenya-red)] dark:hover:text-[#ff6b6b]'
                }
                ${FOCUS_RING}
              `.trim()}
              aria-label={t(item.label)}
              aria-current={isActive ? 'page' : undefined}
            >
              {/* Icon placeholder - replace with actual icon system */}
              {item.icon && (
                <span 
                  className={`h-4 w-4 transition-colors ${
                    isActive 
                      ? 'text-[var(--kenya-red)]' 
                      : 'text-gray-500 group-hover:text-[var(--kenya-red)]'
                  }`}
                  aria-hidden="true"
                >
                  {/* Icon would be rendered here via icon registry */}
                  ●
                </span>
              )}
              
              <span className="hidden lg:inline">{t(item.label)}</span>
              
              {/* Animated Kenyan gradient underline for active state */}
              {isActive && (
                <span
                  className={`absolute bottom-0 left-0 right-0 h-0.5 ${GRADIENTS.kenyanFlag} rounded-full ${ANIMATIONS.gradientSlide}`}
                  aria-hidden="true"
                />
              )}
              
              {/* Premium badge */}
              {item.premium && (
                <span className="ml-1 text-[8px] text-[var(--kenya-mpesa)] bg-[var(--kenya-mpesa)]/10 px-1.5 py-0.5 rounded-full">
                  Pro
                </span>
              )}
            </button>
          )
        })}
      </nav>

      {/* Notifications */}
      {isAuthenticated && (
        <button
          className={`relative p-2 rounded-lg transition-all duration-300 text-gray-700 dark:text-gray-300 hover:text-[var(--kenya-red)] dark:hover:text-[#ff6b6b] hover:bg-[var(--kenya-red)]/10 dark:hover:bg-[var(--kenya-red)]/20 ${FOCUS_RING}`}
          aria-label={t('navigation.notifications')}
        >
          <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
            <path d="M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9" />
            <path d="M10.3 21a1.94 1.94 0 0 0 3.4 0" />
          </svg>
          {/* Notification indicator */}
          <span className="absolute top-1 right-1 h-2 w-2 bg-[var(--kenya-red)] rounded-full animate-ping" aria-hidden="true" />
          <span className="absolute top-1 right-1 h-2 w-2 bg-[var(--kenya-red)] rounded-full" aria-hidden="true" />
          <span className="sr-only">You have new notifications</span>
        </button>
      )}

      {/* Auth Section */}
      <DesktopNav.AuthSection 
        isAuthenticated={isAuthenticated} 
        user={user} 
      />
    </>
  )
})

/**
 * Auth Section - extracted for separate lazy loading
 */
DesktopNav.AuthSection = memo(function AuthSection({
  isAuthenticated,
  user,
}: {
  isAuthenticated: boolean
  user?: UserProfile | null
}) {
  const { t } = useLanguage()
  const router = useRouter()

  const handleSignOut = useCallback(async () => {
    // Implement your sign out logic here
    // Example: await signOut({ redirect: false })
  }, [])

  if (isAuthenticated && user) {
    return (
      <>
        {/* Upload Button */}
        <button
          onClick={() => router.push('/upload')}
          className={`
            hidden md:flex items-center justify-center gap-2 px-5 py-2.5 
            font-semibold rounded-full bg-white dark:bg-gray-800 
            text-[var(--kenya-red)] dark:text-[#ff6b6b] 
            border-2 border-[var(--kenya-red)] dark:border-[#ff6b6b] 
            hover:bg-[var(--kenya-red)] dark:hover:bg-[var(--kenya-red)] 
            hover:text-white transition-all duration-300 
            shadow-sm hover:shadow-[var(--kenya-red)]/30 hover:-translate-y-0.5
            ${FOCUS_RING}
          `.trim()}
          aria-label={t('navigation.upload')}
        >
          <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
            <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4M17 8l-5-5-5 5M12 3v12" />
          </svg>
          <span>{t('navigation.upload')}</span>
        </button>

        {/* Profile Dropdown */}
        <ProfileDropdown
          user={user}
          onSignOut={handleSignOut}
        />
      </>
    )
  }

  // Guest auth buttons
  return (
    <>
      <button
        onClick={() => router.push('/login')}
        className={`
          hidden md:flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-lg 
          text-gray-700 dark:text-gray-300 
          hover:text-[var(--kenya-red)] hover:bg-[var(--kenya-red)]/10 
          dark:hover:text-[#ff6b6b] dark:hover:bg-[var(--kenya-red)]/20 
          transition-all duration-300
          ${FOCUS_RING}
        `.trim()}
        aria-label={t('login')}
      >
        <svg className="h-4 w-4 text-[var(--kenya-red)]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
          <path d="M15 3h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-4M10 17l5-5-5-5M13.8 12H3" />
        </svg>
        <span>{t('login')}</span>
      </button>
      
      <button
        onClick={() => router.push('/signup')}
        className={`
          hidden md:flex items-center justify-center gap-2 px-5 py-2.5 
          font-semibold rounded-full bg-[var(--kenya-green)] text-white 
          hover:bg-[var(--kenya-green-hover, #005c36)] 
          transition-all duration-300 shadow-sm hover:shadow-[var(--kenya-green)]/30
          ${FOCUS_RING}
        `.trim()}
        aria-label={t('signup')}
      >
        <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
          <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2M9 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8M20 8v6M23 11h-6" />
        </svg>
        <span>{t('signup')}</span>
      </button>
    </>
  )
})