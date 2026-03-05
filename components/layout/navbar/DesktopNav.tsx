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
  onSignOut?: () => Promise<void>
  notificationCount?: number
}

export const DesktopNav = memo(function DesktopNav({
  navItems,
  isAuthenticated,
  user,
  onSignOut,
  notificationCount = 0,
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

  // Handle auth-restricted navigation
  const handleNavClick = useCallback(
    (item: NavItem) => {
      if (item.requiresAuth && !isAuthenticated) {
        router.push(`/login?returnTo=${encodeURIComponent(item.href)}`)
        return
      }
      handleNavigate(item.href)
    },
    [isAuthenticated, handleNavigate, router]
  )

  // Helper for conditional classes (replaces clsx)
  const cn = (...classes: (string | boolean | undefined)[]) => {
    return classes.filter(Boolean).join(' ')
  }

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
          const isDisabled = item.requiresAuth && !isAuthenticated
          
          return (
            <button
              key={item.id}
              onClick={() => handleNavClick(item)}
              disabled={isDisabled}
              className={cn(
                'relative flex items-center gap-2 px-4 py-2 rounded-lg font-medium text-sm transition-all duration-300 group',
                isActive 
                  ? 'text-[var(--kenya-red)] dark:text-[#ff6b6b]' 
                  : 'text-gray-700 dark:text-gray-300 hover:text-[var(--kenya-red)] dark:hover:text-[#ff6b6b]',
                isDisabled && 'opacity-50 cursor-not-allowed',
                FOCUS_RING
              )}
              aria-label={t(item.label)}
              aria-current={isActive ? 'page' : undefined}
              aria-disabled={isDisabled || undefined}
            >
              {/* Icon with semantic label */}
              {item.icon && (
                <span 
                  className={cn(
                    'h-4 w-4 transition-colors',
                    isActive 
                      ? 'text-[var(--kenya-red)]' 
                      : 'text-gray-500 group-hover:text-[var(--kenya-red)]'
                  )}
                  aria-hidden="true"
                >
                  <Icon name={item.icon} />
                </span>
              )}
              
              <span className="hidden lg:inline">{t(item.label)}</span>
              
              {/* Animated Kenyan gradient underline for active state */}
              {isActive && (
                <span
                  className={cn(
                    'absolute bottom-0 left-0 right-0 h-0.5',
                    GRADIENTS.kenyanFlag,
                    'rounded-full',
                    ANIMATIONS.gradientSlide
                  )}
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

      {/* Notifications - Conditional badge & accessibility */}
      {isAuthenticated && (
        <button
          className={cn(
            'relative p-2 rounded-lg transition-all duration-300',
            'text-gray-700 dark:text-gray-300',
            'hover:text-[var(--kenya-red)] dark:hover:text-[#ff6b6b]',
            'hover:bg-[var(--kenya-red)]/10 dark:hover:bg-[var(--kenya-red)]/20',
            FOCUS_RING
          )}
          aria-label={t('navigation.notifications')}
          aria-live="polite"
        >
          <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
            <path d="M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9" />
            <path d="M10.3 21a1.94 1.94 0 0 0 3.4 0" />
          </svg>
          
          {/* Only show indicator if there are notifications */}
          {notificationCount > 0 && (
            <>
              <span 
                className="absolute top-1 right-1 h-2 w-2 bg-[var(--kenya-red)] rounded-full animate-ping" 
                aria-hidden="true"
              />
              <span 
                className="absolute top-1 right-1 h-2 w-2 bg-[var(--kenya-red)] rounded-full" 
                aria-hidden="true"
              />
              <span className="sr-only">
                {notificationCount} new {notificationCount === 1 ? 'notification' : 'notifications'}
              </span>
            </>
          )}
        </button>
      )}

      {/* Auth Section - rendered inline instead of static property */}
      <DesktopNavAuthSection 
        isAuthenticated={isAuthenticated} 
        user={user}
        onSignOut={onSignOut}
      />
    </>
  )
})

/**
 * ✅ Separate component for Auth Section (fixes TypeScript static property issue)
 */
const DesktopNavAuthSection = memo(function DesktopNavAuthSection({
  isAuthenticated,
  user,
  onSignOut,
}: {
  isAuthenticated: boolean
  user?: UserProfile | null
  onSignOut?: () => Promise<void>
}) {
  const { t } = useLanguage()
  const router = useRouter()
  const [isSigningOut, setIsSigningOut] = useState(false)

  // Helper for conditional classes
  const cn = (...classes: (string | boolean | undefined)[]) => {
    return classes.filter(Boolean).join(' ')
  }

  const handleSignOut = useCallback(async () => {
    if (isSigningOut) return
    
    try {
      setIsSigningOut(true)
      if (onSignOut) {
        await onSignOut()
      } else {
        // Fallback: clear auth state and redirect
        localStorage.removeItem('auth_token')
        sessionStorage.clear()
      }
      router.push('/')
      router.refresh()
    } catch (error) {
      console.error('Sign out failed:', error)
    } finally {
      setIsSigningOut(false)
    }
  }, [onSignOut, router, isSigningOut])

  if (isAuthenticated && user) {
    return (
      <>
        {/* Upload Button */}
        <button
          onClick={() => router.push('/upload')}
          className={cn(
            'hidden md:flex items-center justify-center gap-2 px-5 py-2.5',
            'font-semibold rounded-full',
            'bg-white dark:bg-gray-800',
            'text-[var(--kenya-red)] dark:text-[#ff6b6b]',
            'border-2 border-[var(--kenya-red)] dark:border-[#ff6b6b]',
            'hover:bg-[var(--kenya-red)] dark:hover:bg-[var(--kenya-red)]',
            'hover:text-white transition-all duration-300',
            'shadow-sm hover:shadow-[var(--kenya-red)]/30 hover:-translate-y-0.5',
            FOCUS_RING
          )}
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
        className={cn(
          'hidden md:flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-lg',
          'text-gray-700 dark:text-gray-300',
          'hover:text-[var(--kenya-red)] hover:bg-[var(--kenya-red)]/10',
          'dark:hover:text-[#ff6b6b] dark:hover:bg-[var(--kenya-red)]/20',
          'transition-all duration-300',
          FOCUS_RING
        )}
        aria-label={t('login')}
      >
        <svg className="h-4 w-4 text-[var(--kenya-red)]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
          <path d="M15 3h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-4M10 17l5-5-5-5M13.8 12H3" />
        </svg>
        <span>{t('login')}</span>
      </button>
      
      <button
        onClick={() => router.push('/signup')}
        className={cn(
          'hidden md:flex items-center justify-center gap-2 px-5 py-2.5',
          'font-semibold rounded-full',
          'bg-[var(--kenya-green)] text-white',
          'hover:bg-[var(--kenya-green-hover)]',
          'transition-all duration-300 shadow-sm hover:shadow-[var(--kenya-green)]/30',
          FOCUS_RING
        )}
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

/**
 * ✅ Simple icon registry - replace with your icon system
 */
function Icon({ name }: { name: string }) {
  // Using inline SVG paths - replace with your icon library
  const paths: Record<string, React.ReactNode> = {
    home: <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />,
    trending: <path d="M23 6l-9.5 9.5-5-5L1 18" />,
    upload: <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4M17 8l-5-5-5 5M12 3v12" />,
    search: <><circle cx="11" cy="11" r="8" /><path d="m21 21-4.3-4.3" /></>,
  }
  
  return (
    <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      {paths[name] || <circle cx="12" cy="12" r="10" />}
    </svg>
  )
}