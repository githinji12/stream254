// components/layout/navbar/MobileNav.tsx
'use client'

import { memo, useCallback, useEffect, useState } from 'react'
import { usePathname, useRouter } from 'next/navigation'
import { useLanguage } from '@/lib/i18n/client'
import { useFocusTrap } from '@/hooks/useFocusTrap'
import { NavConfig, UserProfile } from '@/lib/navigation/types'
import { NAV_CONFIG, getFilteredNavItems } from '@/lib/navigation/config'
import { MAASAI_PATTERN_SVG, ANIMATIONS, FOCUS_RING, GRADIENTS } from '@/lib/constants/navbar'

// Sub-components
import { SearchBar } from './SearchBar'
import { ProfileDropdown } from './ProfileDropdown'
import { NavLogo } from './NavLogo'

type MobileNavProps = {
  navItems: NavConfig
  isAuthenticated: boolean
  user?: UserProfile | null
}

export const MobileNav = memo(function MobileNav({
  navItems,
  isAuthenticated,
  user,
}: MobileNavProps) {
  const [isOpen, setIsOpen] = useState(false)
  const pathname = usePathname()

  useEffect(() => {
    setIsOpen(false)
  }, [pathname])

  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = ''
    }
    return () => {
      document.body.style.overflow = ''
    }
  }, [isOpen])

  const toggleMenu = useCallback(() => {
    setIsOpen((prev) => !prev)
  }, [])

  if (!isOpen) {
    return <MobileNavToggle onToggle={toggleMenu} />
  }

  return (
    <MobileNavMenu
      isOpen={isOpen}
      onClose={() => setIsOpen(false)}
      navItems={navItems}
      isAuthenticated={isAuthenticated}
      user={user}
    />
  )
})

// Helper for conditional classes
function cn(...classes: (string | boolean | undefined)[]) {
  return classes.filter(Boolean).join(' ')
}

// ===================================================
// Toggle Button Component
// ===================================================
export const MobileNavToggle = memo(function MobileNavToggle({ 
  onToggle 
}: { 
  onToggle: () => void 
}) {
  return (
    <button
      onClick={onToggle}
      className={cn(
        'p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors',
        FOCUS_RING
      )}
      aria-label="Open navigation menu"
      aria-expanded="false"
      aria-controls="mobile-menu"
    >
      <svg className="h-6 w-6 text-gray-700 dark:text-gray-300" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
        <path d="M4 6h16M4 12h16M4 18h16" />
      </svg>
    </button>
  )
})

// ===================================================
// Menu Panel Component
// ===================================================
export const MobileNavMenu = memo(function MobileNavMenu({
  isOpen,
  onClose,
  navItems,
  isAuthenticated,
  user,
}: {
  isOpen: boolean
  onClose: () => void
  navItems: NavConfig
  isAuthenticated: boolean
  user?: UserProfile | null
}) {
  const { t } = useLanguage()
  const router = useRouter()
  const { ref: focusTrapRef } = useFocusTrap(isOpen, onClose)

  const handleNavigate = useCallback(
    (href: string) => {
      router.push(href)
      onClose()
    },
    [router, onClose]
  )

  const handleSignOut = useCallback(async () => {
    // Implement your actual sign out logic here
    onClose()
  }, [onClose])

  const mobileItems = getFilteredNavItems(
    [...navItems.primary, ...navItems.mobile],
    isAuthenticated,
    user?.role
  )

  if (!isOpen) return null

  return (
    <div 
      className="fixed inset-0 z-70 md:hidden"
      role="dialog"
      aria-modal="true"
      aria-label="Mobile navigation menu"
    >
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black/50 dark:bg-black/70 backdrop-blur-sm animate-fade-in" 
        onClick={onClose}
        aria-hidden="true"
      />
      
      {/* Menu Panel */}
      <div
        ref={focusTrapRef}
        id="mobile-menu"
        className={cn(
          'relative bg-white/95 dark:bg-gray-900/95 backdrop-blur-xl',
          'h-full w-80 max-w-full overflow-y-auto',
          ANIMATIONS.slideInRight
        )}
      >
        {/* Maasai pattern overlay */}
        <div
          className="absolute inset-0 opacity-[0.02] dark:opacity-[0.04] pointer-events-none"
          style={{
            backgroundImage: `url("${MAASAI_PATTERN_SVG}")`,
            backgroundSize: '60px 60px',
          }}
          aria-hidden="true"
        />

        {/* Header */}
        <div className="sticky top-0 bg-white/95 dark:bg-gray-900/95 backdrop-blur-xl border-b border-gray-200 dark:border-gray-700 px-4 py-3 flex items-center justify-between z-10">
          <NavLogo />
          <button
            onClick={onClose}
            className={cn(
              'p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors',
              FOCUS_RING
            )}
            aria-label="Close menu"
          >
            <svg className="h-6 w-6 text-gray-700 dark:text-gray-300" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
              <path d="M18 6 6 18M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Content */}
        <div className="relative p-4 space-y-4">
          {/* Search */}
          <SearchBar isMobile onClose={onClose} />

          {/* Navigation Links */}
          <nav className="space-y-2 pt-2 border-t border-gray-100 dark:border-gray-700" aria-label="Mobile navigation">
            {mobileItems.map((item) => (
              <button
                key={item.id}
                onClick={() => handleNavigate(item.href)}
                className={cn(
                  'w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-colors',
                  'text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800',
                  FOCUS_RING
                )}
              >
                <span className="h-5 w-5 text-gray-500" aria-hidden="true">
                  <Icon name={item.icon || 'default'} />
                </span>
                <span className="font-medium">{t(item.label)}</span>
                {item.premium && (
                  <span className="ml-auto text-xs text-[var(--kenya-mpesa)] bg-[var(--kenya-mpesa)]/10 px-2 py-0.5 rounded-full">
                    Pro
                  </span>
                )}
              </button>
            ))}
          </nav>

          {/* Auth Section */}
          {isAuthenticated && user ? (
            <div className="pt-4 border-t border-gray-100 dark:border-gray-700">
              <ProfileDropdown
                user={user}
                onSignOut={handleSignOut}
                isMobile
                onClose={onClose}
              />
            </div>
          ) : (
            <div className="space-y-3 pt-4 border-t border-gray-100 dark:border-gray-700">
              <button
                onClick={() => { handleNavigate('/login'); onClose() }}
                className={cn(
                  'w-full flex items-center justify-center gap-2 px-4 py-3 rounded-xl',
                  'border-2 border-[var(--kenya-red)] text-[var(--kenya-red)] font-medium',
                  'hover:bg-[var(--kenya-red)] hover:text-white transition-colors',
                  FOCUS_RING
                )}
              >
                <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
                  <path d="M15 3h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-4M10 17l5-5-5-5M13.8 12H3" />
                </svg>
                {t('auth.login')}
              </button>
              <button
                onClick={() => { handleNavigate('/signup'); onClose() }}
                className={cn(
                  'w-full flex items-center justify-center gap-2 px-4 py-3 rounded-xl',
                  'bg-[var(--kenya-green)] text-white font-medium',
                  'hover:bg-[var(--kenya-green-hover)] transition-colors',
                  FOCUS_RING
                )}
              >
                <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
                  <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2M9 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8M20 8v6M23 11h-6" />
                </svg>
                {t('auth.signup')}
              </button>
            </div>
          )}

          {/* Footer Links */}
          <div className="pt-4 border-t border-gray-100 dark:border-gray-700">
            <div className="flex flex-wrap gap-4 text-sm text-gray-500 dark:text-gray-400">
              {navItems.footer.map((item) => (
                <a
                  key={item.id}
                  href={item.href}
                  className="hover:text-[var(--kenya-red)] transition-colors"
                  onClick={(e) => {
                    e.preventDefault()
                    handleNavigate(item.href)
                  }}
                >
                  {t(item.label)}
                </a>
              ))}
            </div>
            <p className="mt-4 text-xs text-gray-400 dark:text-gray-500">
              © {new Date().getFullYear()} Stream254 🇰🇪
            </p>
          </div>
        </div>
      </div>
    </div>
  )
})

// ===================================================
// ✅ Icon Registry - FIXED: All multi-path icons wrapped in fragments
// ===================================================
function Icon({ name }: { name: string }) {
  const paths: Record<string, React.ReactNode> = {
    home: <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />,
    trending: <path d="M23 6l-9.5 9.5-5-5L1 18" />,
    upload: <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4M17 8l-5-5-5 5M12 3v12" />,
    // ✅ FIXED: Multi-element icons wrapped in fragment
    profile: <><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" /><circle cx="12" cy="7" r="4" /></>,
    search: <><circle cx="11" cy="11" r="8" /><path d="m21 21-4.3-4.3" /></>,
    menu: <path d="M4 6h16M4 12h16M4 18h16" />,
    close: <path d="M18 6 6 18M6 6l12 12" />,
    default: <circle cx="12" cy="12" r="10" />,
  }
  
  return (
    <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      {paths[name] || paths.default}
    </svg>
  )
}