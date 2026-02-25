// components/layout/Navbar.tsx
'use client'

import { memo, useCallback, useState, useEffect, useRef } from 'react'
import { usePathname, useRouter } from 'next/navigation'
import { useAuth } from '@/hooks/useAuth'
import { useLanguage } from '@/lib/i18n/client'
import { LanguageSelector } from '@/components/shared/LanguageSelector'

// 🎨 Kenyan Theme Constants
const KENYA = {
  red: '#bb0000',
  green: '#007847',
  black: '#000000',
  mpesa: '#4CAF50',
} as const

const KENYA_GRADIENT = {
  primary: `linear-gradient(135deg, ${KENYA.red}, ${KENYA.green})`,
  flag: 'linear-gradient(90deg, #007847 0%, #007847 33%, #000000 33%, #000000 34%, #bb0000 34%, #bb0000 66%, #000000 66%, #000000 67%, #007847 67%, #007847 100%)',
} as const

// 🗺️ Route Constants
const ROUTES = {
  HOME: '/',
  LOGIN: '/login',
  SIGNUP: '/signup',
  UPLOAD: '/upload',
  SEARCH: '/search',
  TRENDING: '/trending',
  PROFILE: (id: string) => `/profile/${id}`,
  CREATOR_STUDIO: '/creator-studio',
  SETTINGS: '/settings',
} as const

// 🔧 Debounce Utility
function debounce<T extends (...args: any[]) => any>(func: T, wait: number) {
  let timeout: ReturnType<typeof setTimeout> | null
  return function executedFunction(...args: Parameters<T>) {
    const later = () => { timeout = null; func(...args) }
    if (timeout) clearTimeout(timeout)
    timeout = setTimeout(later, wait)
  }
}

// 🏠 Home Navigation Helper
const navigateHome = (router: ReturnType<typeof useRouter>, onClose?: () => void) => {
  router.push(ROUTES.HOME)
  onClose?.()
}

// 🇰🇪 Kenyan Flag Stripe Component
const KenyaFlagStripe = memo(function KenyaFlagStripe() {
  return (
    <div 
      className="h-1 w-full" 
      style={{ background: KENYA_GRADIENT.flag }}
      aria-hidden="true"
      role="presentation"
    />
  )
})
KenyaFlagStripe.displayName = 'KenyaFlagStripe'

// 🎬 Logo Component
const NavLogo = memo(function NavLogo() {
  const router = useRouter()
  
  const handleHomeClick = useCallback((e: React.MouseEvent) => {
    e.preventDefault()
    navigateHome(router)
  }, [router])

  return (
    <button 
      onClick={handleHomeClick}
      className="flex items-center gap-2 group" 
      aria-label="Stream254 Home"
    >
      <div
        className="p-1.5 rounded-lg bg-linear-to-br from-[#bb0000] to-[#007847] group-hover:scale-105 transition-transform"
        aria-hidden="true"
      >
        <svg className="h-6 w-6 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <polygon points="5 3 19 12 5 21 5 3" />
        </svg>
      </div>
      <span className="font-bold text-xl hidden sm:block">
        <span style={{ color: KENYA.red }}>Stream</span>
        <span style={{ color: KENYA.black }}>254</span>
      </span>
    </button>
  )
})
NavLogo.displayName = 'NavLogo'

// 🔍 Search Bar Component (Debounced)
const SearchBar = memo(function SearchBar({ 
  isMobile = false,
  onClose 
}: { 
  isMobile?: boolean
  onClose?: () => void 
}) {
  const { t } = useLanguage() // ✅ Get translation function
  const [query, setQuery] = useState('')
  const [suggestions, setSuggestions] = useState<string[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const router = useRouter()
  const pathname = usePathname()

  const handleSearch = useCallback(
    debounce(async (searchQuery: string) => {
      if (!searchQuery.trim()) { setSuggestions([]); setIsLoading(false); return }
      setIsLoading(true)
      try {
        // TODO: Replace with actual API call to /api/search/suggestions
        await new Promise(resolve => setTimeout(resolve, 300))
        setSuggestions([
          `Videos about "${searchQuery}"`,
          `Creators matching "${searchQuery}"`,
          `#${searchQuery}`,
        ])
      } catch (error) {
        console.error('Search suggestions error:', error)
      } finally {
        setIsLoading(false)
      }
    }, 300),
    []
  )

  const handleChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value
    setQuery(value)
    handleSearch(value)
  }, [handleSearch])

  const handleSubmit = useCallback((e: React.FormEvent) => {
    e.preventDefault()
    const sanitized = query.trim()
    // Security: Validate input
    if (sanitized && /^[a-zA-Z0-9\s\-_#@]+$/.test(sanitized)) {
      router.push(`${ROUTES.SEARCH}?q=${encodeURIComponent(sanitized)}`)
      setQuery('')
      onClose?.()
    }
  }, [query, router, onClose])

  const handleClear = useCallback(() => {
    setQuery('')
    setSuggestions([])
  }, [])

  useEffect(() => { setSuggestions([]) }, [pathname])

  return (
    <div className={isMobile ? 'relative w-full' : 'relative w-full max-w-xl'}>
      <form onSubmit={handleSubmit} className="relative">
        <label htmlFor="search-input" className="sr-only">{t('search.placeholder')}</label>
        <input
          id="search-input"
          type="search"
          value={query}
          onChange={handleChange}
          placeholder={t('search.placeholder')} // ✅ Translated placeholder
          className="w-full px-4 py-2.5 pl-10 pr-10 border-2 border-gray-300 rounded-full focus:outline-none focus:border-[#bb0000] focus:ring-2 focus:ring-[#bb0000]/20 text-sm transition-all duration-300"
          aria-label={t('search.placeholder')}
          aria-autocomplete="list"
        />
        <svg className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
          <circle cx="11" cy="11" r="8" /><path d="m21 21-4.3-4.3" />
        </svg>
        {query && (
          <button type="button" onClick={handleClear} className="absolute right-3 top-1/2 -translate-y-1/2 p-1 hover:bg-gray-100 rounded-full transition-colors" aria-label="Clear search">
            <svg className="h-4 w-4 text-gray-400 hover:text-[#bb0000]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true"><path d="M18 6 6 18M6 6l12 12" /></svg>
          </button>
        )}
      </form>
      {(query || isLoading) && suggestions.length > 0 && (
        <div className="absolute top-full left-0 right-0 mt-2 bg-white border border-gray-200 rounded-xl shadow-lg z-50 overflow-hidden">
          {isLoading ? (
            <div className="p-4 text-center text-gray-500 text-sm">{t('loading.searching')}</div>
          ) : (
            <ul>
              {suggestions.map((suggestion, index) => (
                <li key={index}>
                  <button
                    onClick={() => { router.push(`${ROUTES.SEARCH}?q=${encodeURIComponent(suggestion)}`); setQuery(''); onClose?.() }}
                    className="w-full flex items-center gap-3 px-4 py-3 hover:bg-gray-50 transition-colors text-left"
                  >
                    <span className="text-sm text-gray-700">{suggestion}</span>
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </div>
  )
})
SearchBar.displayName = 'SearchBar'

// 🔥 Trending Button Component
const TrendingButton = memo(function TrendingButton({ 
  isMobile = false,
  onClose 
}: { 
  isMobile?: boolean
  onClose?: () => void 
}) {
  const { t } = useLanguage() // ✅ Get translation function
  const router = useRouter()
  const pathname = usePathname()
  const isActive = pathname === ROUTES.TRENDING

  const handleClick = useCallback(() => { router.push(ROUTES.TRENDING); onClose?.() }, [router, onClose])

  return (
    <button
      onClick={handleClick}
      className={`flex items-center gap-2 font-medium rounded-lg transition-all duration-300 ${isActive ? 'bg-[#bb0000]/10 text-[#bb0000]' : 'text-gray-700 hover:text-[#bb0000] hover:bg-[#bb0000]/10'} ${isMobile ? 'px-4 py-3 w-full justify-start' : 'px-4 py-2 text-sm'}`}
      aria-label={t('navigation.trending')}
      aria-current={isActive ? 'page' : undefined}
    >
      <svg className={`${isMobile ? 'h-5 w-5' : 'h-4 w-4'} text-[#bb0000]`} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
        <path d="M8.5 14.5A2.5 2.5 0 0 0 11 12c0-1.38-.5-2-1-3-1.072-2.143-.224-4.054 2-6 .5 2.5 2 4.9 4 6.5 2 1.6 3 3.5 3 5.5a7 7 0 1 1-14 0c0-1.1.2-2.2.5-3.3.3.9.8 1.8 1.5 2.8z" />
      </svg>
      <span>{isMobile ? t('navigation.trending') : t('navigation.trending')}</span>
    </button>
  )
})
TrendingButton.displayName = 'TrendingButton'

// 🔔 Notification Bell Component
const NotificationBell = memo(function NotificationBell({ isMobile = false }: { isMobile?: boolean }) {
  const { t } = useLanguage() // ✅ Get translation function
  const [hasNotifications] = useState(false)
  return (
    <button className={`relative p-2 rounded-lg transition-colors text-gray-700 hover:text-[#bb0000] hover:bg-[#bb0000]/10 ${isMobile ? 'w-full justify-start px-4 py-3' : ''}`} aria-label={t('navigation.notifications')}>
      <svg className={isMobile ? 'h-5 w-5' : 'h-5 w-5'} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
        <path d="M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9" /><path d="M10.3 21a1.94 1.94 0 0 0 3.4 0" />
      </svg>
      {hasNotifications && <><span className="absolute top-1 right-1 h-2 w-2 bg-[#bb0000] rounded-full" aria-hidden="true" /><span className="sr-only">You have new notifications</span></>}
    </button>
  )
})
NotificationBell.displayName = 'NotificationBell'

// 👤 Profile Dropdown Component
const ProfileDropdown = memo(function ProfileDropdown({ 
  userId,
  username, 
  avatarUrl,
  onSignOut,
  isMobile = false,
  onClose 
}: { 
  userId: string
  username: string
  avatarUrl?: string | null
  onSignOut: () => Promise<void>
  isMobile?: boolean
  onClose?: () => void 
}) {
  const { t } = useLanguage() // ✅ Get translation function
  const [isOpen, setIsOpen] = useState(false)
  const router = useRouter()
  const pathname = usePathname()
  const dropdownRef = useRef<HTMLDivElement>(null)

  const menuItems = [
    { label: t('navigation.profile'), href: ROUTES.PROFILE(userId), icon: 'user' },
    { label: t('navigation.creator_studio'), href: ROUTES.CREATOR_STUDIO, icon: 'video', premium: true },
    { label: t('navigation.settings'), href: ROUTES.SETTINGS, icon: 'settings' },
  ]

  const handleNavigate = useCallback((href: string) => { router.push(href); setIsOpen(false); onClose?.() }, [router, onClose])

  const handleSignOut = useCallback(async () => {
    try { setIsOpen(false); await onSignOut(); onClose?.() } 
    catch (error) { console.error('Sign out error:', error) }
  }, [onSignOut, onClose])

  useEffect(() => { setIsOpen(false) }, [pathname])

  useEffect(() => {
    if (!isOpen) return
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) setIsOpen(false)
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [isOpen])

  const Avatar = () => {
    if (avatarUrl) {
      return (
        <img src={avatarUrl} alt={`${username}'s avatar`} className="h-8 w-8 rounded-full object-cover"
          onError={(e) => {
            e.currentTarget.style.display = 'none'
            const parent = e.currentTarget.parentElement
            if (parent) {
              parent.style.background = KENYA_GRADIENT.primary
              parent.innerHTML = `<span class="flex items-center justify-center h-full w-full text-white text-sm font-bold">${username.charAt(0).toUpperCase()}</span>`
            }
          }}
        />
      )
    }
    return <div className="h-8 w-8 rounded-full flex items-center justify-center text-white text-sm font-bold" style={{ background: KENYA_GRADIENT.primary }}>{username.charAt(0).toUpperCase()}</div>
  }

  if (isMobile) {
    return (
      <>
        <button onClick={() => handleNavigate(ROUTES.PROFILE(userId))} className="flex items-center gap-3 px-4 py-3 w-full rounded-xl hover:bg-gray-50 transition-colors">
          <Avatar /><div className="flex-1 min-w-0"><p className="font-medium text-gray-900 truncate">@{username}</p><p className="text-xs text-gray-500">{t('profile.view_profile')}</p></div>
        </button>
        <div className="space-y-1 pt-2 border-t border-gray-100">
          {menuItems.map((item) => (
            <button key={item.href} onClick={() => handleNavigate(item.href)} className="flex items-center gap-3 px-4 py-3 w-full text-left rounded-xl hover:bg-gray-50 transition-colors">
              <span className="text-sm font-medium text-gray-700">{item.label}</span>
              {item.premium && <span className="ml-auto text-xs text-[#bb0000]">Pro</span>}
            </button>
          ))}
          <button onClick={handleSignOut} className="flex items-center gap-3 px-4 py-3 w-full text-left rounded-xl hover:bg-red-50 text-red-600 transition-colors">
            <span className="font-medium">{t('navigation.logout')}</span>
          </button>
        </div>
      </>
    )
  }

  return (
    <div className="relative" ref={dropdownRef}>
      <button onClick={() => setIsOpen(prev => !prev)} className="flex items-center gap-2 px-2 py-1.5 rounded-lg hover:bg-gray-100 transition-colors" aria-label={`Open profile menu for @${username}`} aria-haspopup="menu" aria-expanded={isOpen}>
        <Avatar />
        <svg className={`h-4 w-4 text-gray-500 transition-transform ${isOpen ? 'rotate-180' : ''}`} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true"><path d="m6 9 6 6 6-6" /></svg>
      </button>
      {isOpen && (
        <div className="absolute right-0 top-full mt-2 w-56 bg-white border border-gray-200 rounded-xl shadow-lg py-2 z-50" role="menu" aria-orientation="vertical">
          <div className="px-4 py-3 border-b border-gray-100"><p className="font-medium text-gray-900">@{username}</p></div>
          {menuItems.map((item) => (
            <button key={item.href} onClick={() => handleNavigate(item.href)} className="w-full flex items-center gap-3 px-4 py-2.5 text-left text-gray-700 hover:bg-gray-50 transition-colors" role="menuitem">
              <span className="text-sm font-medium">{item.label}</span>
              {item.premium && <span className="ml-auto text-xs text-[#bb0000]">Pro</span>}
            </button>
          ))}
          <div className="my-2 border-t border-gray-100" />
          <button onClick={handleSignOut} className="w-full flex items-center gap-3 px-4 py-2.5 text-left text-red-600 hover:bg-red-50 transition-colors" role="menuitem">
            <span className="text-sm font-medium">{t('navigation.logout')}</span>
          </button>
        </div>
      )}
    </div>
  )
})
ProfileDropdown.displayName = 'ProfileDropdown'

// 🔐 Auth Buttons Component
const AuthButtons = memo(function AuthButtons({ 
  user, 
  profile,
  onSignOut,
  isMobile = false,
  onClose 
}: { 
  user: { id: string } | null
  profile: { username: string; avatar_url?: string | null } | null
  onSignOut: () => Promise<void>
  isMobile?: boolean
  onClose?: () => void 
}) {
  const { t } = useLanguage() // ✅ Get translation function
  const router = useRouter()
  const handleNavigate = useCallback((href: string) => { router.push(href); onClose?.() }, [router, onClose])
  const handleUploadClick = useCallback(() => { if (!user) { router.push(ROUTES.LOGIN); return }; handleNavigate(ROUTES.UPLOAD) }, [user, router, handleNavigate])
  const iconClasses = isMobile ? 'h-5 w-5' : 'h-4 w-4'

  if (user && profile) {
    return (
      <>
        <button onClick={handleUploadClick} className={isMobile ? 'flex items-center gap-3 px-4 py-3 w-full rounded-xl bg-white text-[#bb0000] border-2 border-[#bb0000] hover:bg-[#bb0000] hover:text-white transition-colors justify-center' : 'hidden md:flex items-center justify-center gap-2 px-5 py-2.5 font-semibold rounded-full bg-white text-[#bb0000] border-2 border-[#bb0000] hover:bg-[#bb0000] hover:text-white transition-all shadow-sm hover:shadow-[#bb0000]/30 hover:-translate-y-0.5'} aria-label={t('video.upload')}>
          <svg className={iconClasses} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4M17 8l-5-5-5 5M12 3v12" /></svg>
          <span>{isMobile ? t('video.upload') : t('navigation.upload')}</span>
        </button>
        <ProfileDropdown 
          userId={user.id} 
          username={profile.username} 
          avatarUrl={profile.avatar_url} 
          onSignOut={onSignOut} 
          isMobile={isMobile} 
          onClose={onClose} 
        />
      </>
    )
  }

  return (
    <>
      <button onClick={() => handleNavigate(ROUTES.LOGIN)} className={isMobile ? 'flex items-center gap-3 px-4 py-3 w-full rounded-xl hover:bg-gray-50 transition-colors' : 'hidden md:flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-lg text-gray-700 hover:text-[#bb0000] hover:bg-[#bb0000]/10 transition-all'} aria-label={t(' login')}>
        <svg className={`${iconClasses} text-[#bb0000]`} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true"><path d="M15 3h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-4M10 17l5-5-5-5M13.8 12H3" /></svg>
        <span>{t('login')}</span>
      </button>
      <button onClick={() => handleNavigate(ROUTES.SIGNUP)} className={isMobile ? 'flex items-center gap-3 px-4 py-3 w-full rounded-xl bg-[#007847] text-white hover:bg-[#005c36] transition-colors justify-center' : 'hidden md:flex items-center justify-center gap-2 px-5 py-2.5 font-semibold rounded-full bg-[#007847] text-white hover:bg-[#005c36] transition-all shadow-sm hover:shadow-[#007847]/30'} aria-label={t('signup')}>
        <svg className={iconClasses} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true"><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2M9 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8M20 8v6M23 11h-6" /></svg>
        <span>{t('signup')}</span>
      </button>
    </>
  )
})
AuthButtons.displayName = 'AuthButtons'

// 📱 Mobile Menu Component
const MobileMenu = memo(function MobileMenu({
  isOpen,
  onClose,
  user,
  profile,
  onSignOut
}: {
  isOpen: boolean
  onClose: () => void
  user: { id: string } | null
  profile: { username: string; avatar_url?: string | null } | null
  onSignOut: () => Promise<void>
}) {
  const { t } = useLanguage() // ✅ Get translation function
  const pathname = usePathname()
  useEffect(() => { if (isOpen) onClose() }, [pathname, isOpen, onClose])

  useEffect(() => {
    if (!isOpen) return
    const handleKeyDown = (e: KeyboardEvent) => { if (e.key === 'Escape') { e.preventDefault(); onClose() } }
    document.addEventListener('keydown', handleKeyDown)
    document.body.style.overflow = 'hidden'
    return () => { document.removeEventListener('keydown', handleKeyDown); document.body.style.overflow = '' }
  }, [isOpen, onClose])

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 md:hidden" role="dialog" aria-modal="true" aria-label="Mobile navigation menu">
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} aria-hidden="true" />
      <div className="relative bg-white h-full overflow-y-auto animate-slide-in-right">
        <div className="p-4 space-y-4">
          <SearchBar isMobile onClose={onClose} />
          <nav className="space-y-2 pt-2 border-t border-gray-100" aria-label="Mobile navigation">
            <TrendingButton isMobile onClose={onClose} />
            <NotificationBell isMobile />
            <AuthButtons user={user} profile={profile} onSignOut={onSignOut} isMobile onClose={onClose} />
          </nav>
          <div className="pt-4 border-t border-gray-100">
            <div className="flex flex-wrap gap-4 text-sm text-gray-500">
              <a href="/about" className="hover:text-[#bb0000]">{t('footer.about')}</a>
              <a href="/help" className="hover:text-[#bb0000]">{t('footer.help')}</a>
              <a href="/terms" className="hover:text-[#bb0000]">{t('footer.terms')}</a>
              <a href="/privacy" className="hover:text-[#bb0000]">{t('footer.privacy')}</a>
            </div>
            <p className="mt-4 text-xs text-gray-400">© {new Date().getFullYear()} {t('app.name')} 🇰🇪</p>
          </div>
        </div>
      </div>
    </div>
  )
})
MobileMenu.displayName = 'MobileMenu'

// ===================================================
// MAIN NAVBAR COMPONENT
// ===================================================
export default function Navbar() {
  const { user, profile, signOut } = useAuth()
  const { t } = useLanguage() // ✅ Get translation function
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const pathname = usePathname()
  const router = useRouter()

  useEffect(() => { setMobileMenuOpen(false) }, [pathname])

  const handleSignOut = useCallback(async () => {
    try { await signOut() } catch (error) { console.error('Sign out failed:', error) }
  }, [signOut])

  const toggleMobileMenu = useCallback(() => { setMobileMenuOpen(prev => !prev) }, [])

  return (
    <nav className="fixed top-0 w-full bg-white/95 backdrop-blur-md border-b border-gray-200 z-50 shadow-sm" role="navigation" aria-label="Main navigation">
      <KenyaFlagStripe />
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16 items-center">
          <div className="flex items-center gap-2 shrink-0"><NavLogo /></div>
          <div className="hidden md:flex flex-1 max-w-xl mx-8"><SearchBar /></div>
          <div className="hidden md:flex items-center gap-2">
            <TrendingButton />
            <NotificationBell />
            {/* ✅ Language Selector */}
            <LanguageSelector compact />
            <AuthButtons user={user} profile={profile} onSignOut={handleSignOut} />
          </div>
          <div className="md:hidden flex items-center gap-2">
            {/* ✅ Compact Language Selector for Mobile */}
            <LanguageSelector compact />
            <button onClick={toggleMobileMenu} className="p-2 hover:bg-gray-100 rounded-lg transition-colors" aria-label={mobileMenuOpen ? 'Close navigation menu' : 'Open navigation menu'} aria-expanded={mobileMenuOpen}>
              {mobileMenuOpen ? (
                <svg className="h-6 w-6 text-gray-700" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true"><path d="M18 6 6 18M6 6l12 12" /></svg>
              ) : (
                <svg className="h-6 w-6 text-gray-700" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true"><path d="M4 6h16M4 12h16M4 18h16" /></svg>
              )}
            </button>
          </div>
        </div>
      </div>
      <MobileMenu isOpen={mobileMenuOpen} onClose={() => setMobileMenuOpen(false)} user={user} profile={profile} onSignOut={handleSignOut} />
    </nav>
  )
}