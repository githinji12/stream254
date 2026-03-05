// components/layout/navbar/ProfileDropdown.tsx
'use client'

import { memo, useCallback, useEffect, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useLanguage } from '@/lib/i18n/client'
import { useFocusTrap } from '@/hooks/useFocusTrap'
import { NAV_CONFIG, getFilteredNavItems } from '@/lib/navigation/config'
import { UserProfile } from '@/lib/navigation/types'
import { GRADIENTS, ANIMATIONS, FOCUS_RING, KENYA_COLORS } from '@/lib/constants/navbar'

type ProfileDropdownProps = {
  user: UserProfile
  onSignOut: () => Promise<void>
  isMobile?: boolean
  onClose?: () => void
}

export const ProfileDropdown = memo(function ProfileDropdown({
  user,
  onSignOut,
  isMobile = false,
  onClose,
}: ProfileDropdownProps) {
  const { t } = useLanguage()
  const router = useRouter()
  const [isOpen, setIsOpen] = useState(false)
  const triggerRef = useRef<HTMLButtonElement>(null)
  const dropdownRef = useRef<HTMLDivElement>(null)

  // Focus trap for accessibility when dropdown is open
  const { ref: focusTrapRef } = useFocusTrap(isOpen, () => {
    setIsOpen(false)
    triggerRef.current?.focus()
  })

  // Filter menu items by user role
  const menuItems = getFilteredNavItems(
    NAV_CONFIG.secondary,
    true, // User is authenticated
    user.role
  )

  const handleNavigate = useCallback(
    (href: string) => {
      router.push(href)
      setIsOpen(false)
      onClose?.()
    },
    [router, onClose]
  )

  const handleSignOut = useCallback(async () => {
    setIsOpen(false)
    try {
      await onSignOut()
      onClose?.()
    } catch (error) {
      console.error('Sign out failed:', error)
    }
  }, [onSignOut, onClose])

  // Close on route change
  useEffect(() => {
    setIsOpen(false)
  }, [onClose])

  // Close when clicking outside
  useEffect(() => {
    if (!isOpen) return

    const handleClickOutside = (e: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(e.target as Node) &&
        triggerRef.current &&
        !triggerRef.current.contains(e.target as Node)
      ) {
        setIsOpen(false)
        triggerRef.current?.focus()
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [isOpen])

  // Avatar component with safe error handling (no innerHTML)
  const Avatar = useCallback(() => {
    const [imageError, setImageError] = useState(false)

    if (user.avatarUrl && !imageError) {
      return (
        <img
          src={user.avatarUrl}
          alt={`${user.username}'s avatar`}
          className="h-8 w-8 rounded-full object-cover"
          loading="lazy"
          onError={() => setImageError(true)}
        />
      )
    }

    // Fallback avatar with initials
    return (
      <div
        className={`h-8 w-8 rounded-full flex items-center justify-center text-white text-sm font-bold ${GRADIENTS.kenyanDiagonal}`}
        aria-hidden="true"
      >
        {user.username.charAt(0).toUpperCase()}
      </div>
    )
  }, [user.avatarUrl, user.username])

  if (isMobile) {
    return (
      <div className="space-y-2">
        {/* User info header */}
        <div className="flex items-center gap-3 px-4 py-3">
          <Avatar />
          <div className="flex-1 min-w-0">
            <p className="font-medium text-gray-900 dark:text-white truncate">
              @{user.username}
            </p>
            <p className="text-xs text-gray-500 dark:text-gray-400">
              {t('profile.view_profile')}
            </p>
          </div>
        </div>

        {/* Menu items */}
        <nav className="space-y-1 pt-2 border-t border-gray-100 dark:border-gray-700">
          {menuItems.map((item) => (
            <button
              key={item.id}
              onClick={() => handleNavigate(item.href)}
              className="flex items-center gap-3 px-4 py-3 w-full text-left rounded-xl hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
            >
              <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                {t(item.label)}
              </span>
              {item.premium && (
                <span
                  className="ml-auto text-xs text-[var(--kenya-mpesa)] bg-[var(--kenya-mpesa)]/10 px-2 py-0.5 rounded-full flex items-center gap-1"
                  aria-label="Premium feature"
                >
                  <svg
                    className="h-3 w-3"
                    viewBox="0 0 24 24"
                    fill="currentColor"
                    aria-hidden="true"
                  >
                    <path d="M12 2L15.09 8.26L22 9.27L17 14.14L18.18 21.02L12 17.77L5.82 21.02L7 14.14L2 9.27L8.91 8.26L12 2Z" />
                  </svg>
                  M-Pesa
                </span>
              )}
            </button>
          ))}

          {/* Sign out */}
          <button
            onClick={handleSignOut}
            className="flex items-center gap-3 px-4 py-3 w-full text-left rounded-xl hover:bg-red-50 dark:hover:bg-red-900/20 text-red-600 dark:text-red-400 transition-colors mt-2"
          >
            <svg
              className="h-5 w-5"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              aria-hidden="true"
            >
              <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4M16 17l5-5-5-5M21 12H9"
            />
            </svg>
            <span className="font-medium">{t('navigation.logout')}</span>
          </button>
        </nav>
      </div>
    )
  }

  return (
    <div className="relative" ref={dropdownRef}>
      {/* Trigger button */}
      <button
        ref={triggerRef}
        onClick={() => setIsOpen((prev) => !prev)}
        className={`flex items-center gap-2 px-2 py-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors ${FOCUS_RING}`}
        aria-label={`Open profile menu for @${user.username}`}
        aria-haspopup="menu"
        aria-expanded={isOpen}
        aria-controls="profile-menu"
      >
        <Avatar />
        <svg
          className={`h-4 w-4 text-gray-500 transition-transform ${
            isOpen ? 'rotate-180' : ''
          }`}
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          aria-hidden="true"
        >
          <path d="m6 9 6 6 6-6" />
        </svg>
      </button>

      {/* Dropdown menu */}
      {isOpen && (
        <div
          ref={focusTrapRef}
          id="profile-menu"
          className={`absolute right-0 top-full mt-2 w-56 
            bg-white/95 dark:bg-gray-800/95 backdrop-blur-xl 
            border border-gray-200 dark:border-gray-700 
            rounded-xl shadow-lg py-2 z-60 
            ${ANIMATIONS.fadeInUp}
          `}
          role="menu"
          aria-orientation="vertical"
        >
          {/* User info header */}
          <div className="px-4 py-3 border-b border-gray-100 dark:border-gray-700">
            <p className="font-medium text-gray-900 dark:text-white truncate">
              @{user.username}
            </p>
            {user.isPremium && (
              <span className="text-xs text-[var(--kenya-mpesa)]">
                Premium Creator
              </span>
            )}
          </div>

          {/* Menu items */}
          <nav role="none">
            {menuItems.map((item) => (
              <button
                key={item.id}
                onClick={() => handleNavigate(item.href)}
                className="w-full flex items-center gap-3 px-4 py-2.5 text-left text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                role="menuitem"
              >
                <span className="text-sm font-medium">{t(item.label)}</span>
                {item.premium && (
                  <span
                    className="ml-auto text-xs text-[var(--kenya-mpesa)] bg-[var(--kenya-mpesa)]/10 px-2 py-0.5 rounded-full flex items-center gap-1"
                    aria-label="Premium feature"
                  >
                    <svg
                      className="h-3 w-3"
                      viewBox="0 0 24 24"
                      fill="currentColor"
                      aria-hidden="true"
                    >
                      <path d="M12 2L15.09 8.26L22 9.27L17 14.14L18.18 21.02L12 17.77L5.82 21.02L7 14.14L2 9.27L8.91 8.26L12 2Z" />
                    </svg>
                    M-Pesa
                  </span>
                )}
              </button>
            ))}
          </nav>

          {/* Divider */}
          <div className="my-2 border-t border-gray-100 dark:border-gray-700" role="separator" />

          {/* Sign out */}
          <button
            onClick={handleSignOut}
            className="w-full flex items-center gap-3 px-4 py-2.5 text-left text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
            role="menuitem"
          >
            <svg
              className="h-4 w-4"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              aria-hidden="true"
            >
              <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4M16 17l5-5-5-5M21 12H9" />
            </svg>
            <span className="text-sm font-medium">{t('navigation.logout')}</span>
          </button>
        </div>
      )}
    </div>
  )
})