// components/layout/Navbar.tsx
'use client'

import { memo, useCallback, useState, useEffect, useRef, Suspense } from 'react'
import { usePathname, useRouter } from 'next/navigation'
import { useAuth } from '@/hooks/useAuth'
import { useLanguage } from '@/lib/i18n/client'
import { LanguageSelector } from '@/components/shared/LanguageSelector'

// ===================================================
// 🎨 CONSTANTS - Extracted for reuse and performance
// ===================================================

const KENYA_COLORS = {
  red: 'var(--kenya-red, #bb0000)',
  redHover: 'var(--kenya-red-hover, #990000)',
  green: 'var(--kenya-green, #007847)',
  greenHover: 'var(--kenya-green-hover, #005c36)',
  black: 'var(--kenya-black, #000000)',
  mpesa: 'var(--kenya-mpesa, #4CAF50)',
} as const

const GRADIENTS = {
  kenyanFlag: 'bg-gradient-to-r from-[var(--kenya-green)] via-[var(--kenya-black)] to-[var(--kenya-red)]',
  kenyanDiagonal: 'bg-gradient-to-br from-[var(--kenya-red)] to-[var(--kenya-green)]',
} as const

const ANIMATIONS = {
  flagSlide: 'animate-flag-slide',
  gradientRotate: 'animate-gradient-rotate',
  gradientSlide: 'animate-gradient-slide',
  fadeInDown: 'animate-fade-in-down',
  fadeInUp: 'animate-fade-in-up',
  slideInRight: 'animate-slide-in-right',
  pulse: 'animate-pulse',
  ping: 'animate-ping',
} as const

const GLASS_CLASSES = 'bg-white/80 dark:bg-gray-900/80 backdrop-blur-xl border-b border-gray-200/50 dark:border-gray-800/50'
const FOCUS_RING = 'focus:outline-none focus:ring-2 focus:ring-[var(--kenya-red)]/50 focus:ring-offset-2 focus:ring-offset-white dark:focus:ring-offset-gray-900'

// Maasai pattern SVG (encoded for inline use)
const MAASAI_PATTERN = `url("data:image/svg+xml,${encodeURIComponent(`<svg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'><g fill='none' fill-rule='evenodd'><g fill='#bb0000'><path d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/></g></g></svg>`)}")`

// Kenyan shield watermark SVG (encoded)
const KENYA_SHIELD = `url("image/svg+xml,${encodeURIComponent(`<svg viewBox='0 0 100 100' xmlns='http://www.w3.org/2000/svg'><path d='M50 5 L90 25 L90 65 L50 95 L10 65 L10 25 Z' fill='none' stroke='currentColor' stroke-width='1.5' opacity='0.6'/><path d='M50 15 L80 30 L80 60 L50 80 L20 60 L20 30 Z' fill='none' stroke='currentColor' stroke-width='1' opacity='0.4'/><line x1='50' y1='25' x2='50' y2='75' stroke='currentColor' stroke-width='1' opacity='0.3'/></svg>`)}")`

// ===================================================
// 📐 TYPE DEFINITIONS - Fixed for TypeScript
// ===================================================

interface NavItem {
  id: string
  label: string
  href: string
  icon?: string
  requiresAuth?: boolean
  premium?: boolean
}

// ✅ All items now have consistent type structure
const NAV_ITEMS: NavItem[] = [
  { id: 'home', label: 'navigation.home', href: '/', icon: 'home', requiresAuth: false },
  { id: 'trending', label: 'navigation.trending', href: '/trending', icon: 'trending', requiresAuth: false },
  { id: 'upload', label: 'navigation.upload', href: '/upload', icon: 'upload', requiresAuth: true, premium: true },
]

// ===================================================
// 🔧 UTILITIES
// ===================================================

function useDebounce<T>(value: T, delay: number): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value)

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedValue(value), delay)
    return () => clearTimeout(timer)
  }, [value, delay])

  return debouncedValue
}

function sanitizeInput(input: string): string {
  return input.trim().replace(/[<>{}[\]\\]/g, '').slice(0, 100)
}

// ===================================================
// 🎣 HOOKS
// ===================================================

function useSearchSuggestions(minChars = 2, maxResults = 5) {
  const [query, setQuery] = useState('')
  const [suggestions, setSuggestions] = useState<Array<{ id: string; label: string; type: string; href: string }>>([])
  const [isLoading, setIsLoading] = useState(false)
  const [activeIndex, setActiveIndex] = useState(-1)
  
  const debouncedQuery = useDebounce(query, 300)

  useEffect(() => {
    if (debouncedQuery.length < minChars) {
      setSuggestions([])
      setIsLoading(false)
      return
    }

    setIsLoading(true)
    const timer = setTimeout(() => {
      const sanitized = sanitizeInput(debouncedQuery)
      setSuggestions([
        { id: `v-${sanitized}`, label: `Videos about "${sanitized}"`, type: 'video', href: `/search?q=${encodeURIComponent(sanitized)}&type=video` },
        { id: `c-${sanitized}`, label: `Creators matching "${sanitized}"`, type: 'creator', href: `/search?q=${encodeURIComponent(sanitized)}&type=creator` },
        { id: `t-${sanitized}`, label: `#${sanitized}`, type: 'hashtag', href: `/search?q=${encodeURIComponent(sanitized)}&type=hashtag` },
      ].slice(0, maxResults))
      setIsLoading(false)
    }, 300)

    return () => clearTimeout(timer)
  }, [debouncedQuery, minChars, maxResults])

  const handleKeyDown = useCallback((e: React.KeyboardEvent, onSelect: (s: any) => void) => {
    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault()
        setActiveIndex(prev => Math.min(prev + 1, suggestions.length - 1))
        break
      case 'ArrowUp':
        e.preventDefault()
        setActiveIndex(prev => Math.max(prev - 1, -1))
        break
      case 'Enter':
        e.preventDefault()
        if (activeIndex >= 0 && suggestions[activeIndex]) {
          onSelect(suggestions[activeIndex])
        }
        break
      case 'Escape':
        e.preventDefault()
        setQuery('')
        setSuggestions([])
        setActiveIndex(-1)
        break
    }
  }, [suggestions, activeIndex])

  const clearSearch = useCallback(() => {
    setQuery('')
    setSuggestions([])
    setActiveIndex(-1)
  }, [])

  return {
    query,
    suggestions,
    isLoading,
    activeIndex,
    setQuery,
    clearSearch,
    setActiveIndex,
    handleKeyDown,
    hasSuggestions: suggestions.length > 0,
  }
}

function useFocusTrap(isActive: boolean, onEscape?: () => void) {
  const containerRef = useRef<HTMLDivElement>(null)
  const previousActiveRef = useRef<Element | null>(null)

  useEffect(() => {
    if (!isActive) return
    previousActiveRef.current = document.activeElement
    
    const container = containerRef.current
    if (container) {
      const focusable = container.querySelectorAll<HTMLElement>(
        'button:not([disabled]), input:not([disabled]), [tabindex]:not([tabindex="-1"])'
      )
      if (focusable.length > 0) focusable[0].focus()
    }
  }, [isActive])

  useEffect(() => {
    if (!isActive) return
    
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault()
        onEscape?.()
        return
      }
      if (e.key !== 'Tab') return
      
      const container = containerRef.current
      if (!container) return
      
      const focusable = Array.from(container.querySelectorAll<HTMLElement>(
        'button:not([disabled]), input:not([disabled]), [tabindex]:not([tabindex="-1"])'
      ))
      if (focusable.length === 0) return
      
      const first = focusable[0]
      const last = focusable[focusable.length - 1]
      
      if (e.shiftKey && document.activeElement === first) {
        e.preventDefault()
        last.focus()
      } else if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault()
        first.focus()
      }
    }
    
    document.addEventListener('keydown', handleKeyDown)
    return () => {
      document.removeEventListener('keydown', handleKeyDown)
      if (previousActiveRef.current instanceof HTMLElement) {
        previousActiveRef.current.focus()
      }
    }
  }, [isActive, onEscape])

  return { ref: containerRef }
}

// ===================================================
// 🧩 SUB-COMPONENTS
// ===================================================

const NavLogo = memo(function NavLogo() {
  const router = useRouter()
  
  const handleHomeClick = useCallback((e: React.MouseEvent) => {
    e.preventDefault()
    router.push('/')
  }, [router])

  return (
    <button 
      onClick={handleHomeClick}
      className={`relative group ${FOCUS_RING}`} 
      aria-label="Stream254 - Go to homepage"
    >
      <div 
        className={`absolute -inset-0.5 ${GRADIENTS.kenyanFlag} rounded-lg opacity-75 group-hover:opacity-100 blur-sm transition-opacity duration-500 ${ANIMATIONS.gradientRotate}`}
        aria-hidden="true"
      />
      <div className="relative flex items-center gap-2 p-1.5 bg-white dark:bg-gray-900 rounded-lg group-hover:scale-105 transition-all duration-300 shadow-sm group-hover:shadow-lg">
        <div className={`p-1.5 rounded-md ${GRADIENTS.kenyanDiagonal}`}>
          <svg className="h-6 w-6 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
            <polygon points="5 3 19 12 5 21 5 3" />
          </svg>
        </div>
        <span className="font-bold text-xl hidden sm:block">
          <span className="text-[var(--kenya-red)] dark:text-[#ff6b6b]">Stream</span>
          <span className="text-[var(--kenya-black)] dark:text-white">254</span>
        </span>
      </div>
    </button>
  )
})

const SearchBar = memo(function SearchBar({ isMobile = false, onClose }: { isMobile?: boolean; onClose?: () => void }) {
  const { t } = useLanguage()
  const router = useRouter()
  const inputRef = useRef<HTMLInputElement>(null)
  const listboxId = 'search-suggestions'
  
  const {
    query, suggestions, isLoading, activeIndex,
    setQuery, clearSearch, handleKeyDown, hasSuggestions
  } = useSearchSuggestions()

  const handleSelect = useCallback((suggestion: { href: string }) => {
    router.push(suggestion.href)
    clearSearch()
    onClose?.()
    inputRef.current?.blur()
  }, [router, clearSearch, onClose])

  const handleSubmit = useCallback((e: React.FormEvent) => {
    e.preventDefault()
    const sanitized = sanitizeInput(query)
    if (sanitized) {
      router.push(`/search?q=${encodeURIComponent(sanitized)}`)
      clearSearch()
      onClose?.()
    }
  }, [query, router, clearSearch, onClose])

  const handleKeyDownCombined = useCallback((e: React.KeyboardEvent<HTMLInputElement>) => {
    handleKeyDown(e, handleSelect)
  }, [handleKeyDown, handleSelect])

  const inputClasses = `
    w-full px-4 py-2.5 pl-10 pr-10 
    border-2 border-gray-200 dark:border-gray-700 
    rounded-full 
    focus:outline-none focus:border-[var(--kenya-red)] focus:ring-2 focus:ring-[var(--kenya-red)]/20 
    text-sm text-gray-900 dark:text-white 
    bg-white/50 dark:bg-gray-800/50 backdrop-blur-sm 
    transition-all duration-300 ${FOCUS_RING}
  `.trim()

  return (
    <div className={isMobile ? 'relative w-full' : 'relative w-full max-w-xl'}>
      <form onSubmit={handleSubmit} className="relative" role="search">
        <label htmlFor={isMobile ? 'mobile-search' : 'desktop-search'} className="sr-only">
          {t('search.placeholder')}
        </label>
        <input
          ref={inputRef}
          id={isMobile ? 'mobile-search' : 'desktop-search'}
          type="search"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onKeyDown={handleKeyDownCombined}
          placeholder={t('search.placeholder')}
          className={inputClasses}
          aria-label={t('search.placeholder')}
          aria-autocomplete="list"
          aria-controls={listboxId}
          aria-expanded={hasSuggestions}
          aria-activedescendant={activeIndex >= 0 ? `suggestion-${activeIndex}` : undefined}
        />
        <svg className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
          <circle cx="11" cy="11" r="8" /><path d="m21 21-4.3-4.3" />
        </svg>
        {query && (
          <button type="button" onClick={clearSearch} className="absolute right-3 top-1/2 -translate-y-1/2 p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-full transition-colors" aria-label="Clear search">
            <svg className="h-4 w-4 text-gray-400 hover:text-[var(--kenya-red)]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true"><path d="M18 6 6 18M6 6l12 12" /></svg>
          </button>
        )}
      </form>

      {(query || isLoading) && (
        <div
          id={listboxId}
          className={`absolute top-full left-0 right-0 mt-2 bg-white/95 dark:bg-gray-800/95 backdrop-blur-xl border border-gray-200 dark:border-gray-700 rounded-xl shadow-lg z-60 overflow-hidden ${ANIMATIONS.fadeInDown}`}
          role="listbox"
          aria-label="Search suggestions"
        >
          {isLoading ? (
            <div className="p-4 space-y-3">
              {[...Array(3)].map((_, i) => (
                <div key={i} className="h-10 bg-gray-100 dark:bg-gray-700 rounded animate-pulse" />
              ))}
            </div>
          ) : suggestions.length === 0 && query ? (
            <div className="p-4 text-center text-gray-500 dark:text-gray-400 text-sm">No suggestions for "{query}"</div>
          ) : (
            <ul>
              {suggestions.map((suggestion, index) => (
                <li key={suggestion.id} role="presentation">
                  <button
                    id={`suggestion-${index}`}
                    type="button"
                    onClick={() => handleSelect(suggestion)}
                    className={`w-full flex items-center gap-3 px-4 py-3 text-left transition-colors ${
                      index === activeIndex ? 'bg-[var(--kenya-red)]/10 dark:bg-[var(--kenya-red)]/20' : 'hover:bg-gray-50 dark:hover:bg-gray-700'
                    } ${FOCUS_RING}`}
                    role="option"
                    aria-selected={index === activeIndex}
                  >
                    <svg className="h-4 w-4 text-gray-400 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
                      <circle cx="11" cy="11" r="8" /><path d="m21 21-4.3-4.3" />
                    </svg>
                    <span className="text-sm text-gray-700 dark:text-gray-300 truncate">{suggestion.label}</span>
                    <span className="ml-auto text-xs text-gray-400 capitalize">{suggestion.type}</span>
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

const NavLink = memo(function NavLink({ item, isActive, onClick }: { item: NavItem; isActive: boolean; onClick: (href: string) => void }) {
  const { t } = useLanguage()
  
  return (
    <button
      onClick={() => onClick(item.href)}
      disabled={item.requiresAuth && false}
      className={`relative flex items-center gap-2 px-4 py-2 rounded-lg font-medium text-sm transition-all duration-300 group ${
        isActive ? 'text-[var(--kenya-red)] dark:text-[#ff6b6b]' : 'text-gray-700 dark:text-gray-300 hover:text-[var(--kenya-red)] dark:hover:text-[#ff6b6b]'
      } ${item.requiresAuth && false ? 'opacity-50 cursor-not-allowed' : ''} ${FOCUS_RING}`}
      aria-label={t(item.label)}
      aria-current={isActive ? 'page' : undefined}
    >
      <span className={`h-4 w-4 transition-colors ${isActive ? 'text-[var(--kenya-red)]' : 'text-gray-500 group-hover:text-[var(--kenya-red)]'}`} aria-hidden="true">●</span>
      <span className="hidden lg:inline">{t(item.label)}</span>
      {isActive && <span className={`absolute bottom-0 left-0 right-0 h-0.5 ${GRADIENTS.kenyanFlag} rounded-full ${ANIMATIONS.gradientSlide}`} aria-hidden="true" />}
      {item.premium && <span className="ml-1 text-[8px] text-[var(--kenya-mpesa)] bg-[var(--kenya-mpesa)]/10 px-1.5 py-0.5 rounded-full">Pro</span>}
    </button>
  )
})

const ProfileDropdown = memo(function ProfileDropdown({ 
  username, 
  avatarUrl, 
  onSignOut,
  isMobile = false,
  onClose 
}: { 
  username: string
  avatarUrl?: string | null
  onSignOut: () => Promise<void>
  isMobile?: boolean
  onClose?: () => void 
}) {
  const { t } = useLanguage()
  const router = useRouter()
  const [isOpen, setIsOpen] = useState(false)
  const triggerRef = useRef<HTMLButtonElement>(null)
  const { ref: focusTrapRef } = useFocusTrap(isOpen, () => { setIsOpen(false); triggerRef.current?.focus() })

  const handleNavigate = useCallback((href: string) => {
    router.push(href)
    setIsOpen(false)
    onClose?.()
  }, [router, onClose])

  const handleSignOut = useCallback(async () => {
    setIsOpen(false)
    await onSignOut()
    onClose?.()
  }, [onSignOut, onClose])

  useEffect(() => { setIsOpen(false) }, [onClose])

  const Avatar = () => {
    const [error, setError] = useState(false)
    if (avatarUrl && !error) {
      return (
        <img src={avatarUrl} alt={`${username}'s avatar`} className="h-8 w-8 rounded-full object-cover" loading="lazy" onError={() => setError(true)} />
      )
    }
    return (
      <div className={`h-8 w-8 rounded-full flex items-center justify-center text-white text-sm font-bold ${GRADIENTS.kenyanDiagonal}`} aria-hidden="true">
        {username.charAt(0).toUpperCase()}
      </div>
    )
  }

  if (isMobile) {
    return (
      <div className="space-y-2">
        <button onClick={() => handleNavigate(`/profile`)} className="flex items-center gap-3 px-4 py-3 w-full rounded-xl hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors">
          <Avatar />
          <div className="flex-1 min-w-0 text-left">
            <p className="font-medium text-gray-900 dark:text-white truncate">@{username}</p>
            <p className="text-xs text-gray-500 dark:text-gray-400">{t('profile.view_profile')}</p>
          </div>
        </button>
        <button onClick={() => handleNavigate('/creator-studio')} className="flex items-center gap-3 px-4 py-3 w-full text-left rounded-xl hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors">
          <span className="text-sm font-medium text-gray-700 dark:text-gray-300">{t('navigation.creator_studio')}</span>
          <span className="ml-auto text-xs text-[var(--kenya-mpesa)] bg-[var(--kenya-mpesa)]/10 px-2 py-0.5 rounded-full flex items-center gap-1">
            <svg className="h-3 w-3" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M12 2L15.09 8.26L22 9.27L17 14.14L18.18 21.02L12 17.77L5.82 21.02L7 14.14L2 9.27L8.91 8.26L12 2Z" /></svg>
            M-Pesa
          </span>
        </button>
        <button onClick={handleSignOut} className="flex items-center gap-3 px-4 py-3 w-full text-left rounded-xl hover:bg-red-50 dark:hover:bg-red-900/20 text-red-600 dark:text-red-400 transition-colors mt-2">
          <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4M16 17l5-5-5-5M21 12H9" /></svg>
          <span className="font-medium">{t('navigation.logout')}</span>
        </button>
      </div>
    )
  }

  return (
    <div className="relative">
      <button
        ref={triggerRef}
        onClick={() => setIsOpen(prev => !prev)}
        className={`flex items-center gap-2 px-2 py-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors ${FOCUS_RING}`}
        aria-label={`Open profile menu for @${username}`}
        aria-haspopup="menu"
        aria-expanded={isOpen}
        aria-controls="profile-menu"
      >
        <Avatar />
        <svg className={`h-4 w-4 text-gray-500 transition-transform ${isOpen ? 'rotate-180' : ''}`} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true"><path d="m6 9 6 6 6-6" /></svg>
      </button>
      {isOpen && (
        <div
          ref={focusTrapRef}
          id="profile-menu"
          className={`absolute right-0 top-full mt-2 w-56 bg-white/95 dark:bg-gray-800/95 backdrop-blur-xl border border-gray-200 dark:border-gray-700 rounded-xl shadow-lg py-2 z-60 ${ANIMATIONS.fadeInUp}`}
          role="menu"
          aria-orientation="vertical"
        >
          <div className="px-4 py-3 border-b border-gray-100 dark:border-gray-700">
            <p className="font-medium text-gray-900 dark:text-white truncate">@{username}</p>
          </div>
          <button onClick={() => handleNavigate(`/profile`)} className="w-full flex items-center gap-3 px-4 py-2.5 text-left text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors" role="menuitem">
            <span className="text-sm font-medium">{t('navigation.profile')}</span>
          </button>
          <button onClick={() => handleNavigate('/creator-studio')} className="w-full flex items-center gap-3 px-4 py-2.5 text-left text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors" role="menuitem">
            <span className="text-sm font-medium">{t('navigation.creator_studio')}</span>
            <span className="ml-auto text-xs text-[var(--kenya-mpesa)] bg-[var(--kenya-mpesa)]/10 px-2 py-0.5 rounded-full flex items-center gap-1">
              <svg className="h-3 w-3" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M12 2L15.09 8.26L22 9.27L17 14.14L18.18 21.02L12 17.77L5.82 21.02L7 14.14L2 9.27L8.91 8.26L12 2Z" /></svg>
              M-Pesa
            </span>
          </button>
          <div className="my-2 border-t border-gray-100 dark:border-gray-700" role="separator" />
          <button onClick={handleSignOut} className="w-full flex items-center gap-3 px-4 py-2.5 text-left text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors" role="menuitem">
            <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4M16 17l5-5-5-5M21 12H9" /></svg>
            <span className="text-sm font-medium">{t('navigation.logout')}</span>
          </button>
        </div>
      )}
    </div>
  )
})

const NotificationBell = memo(function NotificationBell() {
  const { t } = useLanguage()
  return (
    <button className={`relative p-2 rounded-lg transition-all duration-300 text-gray-700 dark:text-gray-300 hover:text-[var(--kenya-red)] dark:hover:text-[#ff6b6b] hover:bg-[var(--kenya-red)]/10 dark:hover:bg-[var(--kenya-red)]/20 ${FOCUS_RING}`} aria-label={t('navigation.notifications')}>
      <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
        <path d="M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9" /><path d="M10.3 21a1.94 1.94 0 0 0 3.4 0" />
      </svg>
      <span className="absolute top-1 right-1 h-2 w-2 bg-[var(--kenya-red)] rounded-full animate-ping" aria-hidden="true" />
      <span className="absolute top-1 right-1 h-2 w-2 bg-[var(--kenya-red)] rounded-full" aria-hidden="true" />
      <span className="sr-only">You have new notifications</span>
    </button>
  )
})

const ThemeToggle = memo(function ThemeToggle() {
  const [isDark, setIsDark] = useState(false)
  
  useEffect(() => {
    const stored = localStorage.getItem('stream254_theme')
    const systemPrefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches
    if (stored === 'dark' || (!stored && systemPrefersDark)) {
      setIsDark(true)
      document.documentElement.classList.add('dark')
    }
  }, [])

  const toggle = useCallback(() => {
    setIsDark(prev => {
      const newValue = !prev
      document.documentElement.classList.add('theme-transition')
      if (newValue) {
        document.documentElement.classList.add('dark')
        localStorage.setItem('stream254_theme', 'dark')
      } else {
        document.documentElement.classList.remove('dark')
        localStorage.setItem('stream254_theme', 'light')
      }
      setTimeout(() => document.documentElement.classList.remove('theme-transition'), 300)
      return newValue
    })
  }, [])

  return (
    <button
      onClick={toggle}
      className={`p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-all duration-300 ${FOCUS_RING}`}
      aria-label={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
    >
      {isDark ? (
        <svg className="h-5 w-5 text-yellow-500" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
          <circle cx="12" cy="12" r="4" /><path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M4.93 19.07l1.41-1.41M17.66 6.34l1.41-1.41" />
        </svg>
      ) : (
        <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
          <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
        </svg>
      )}
    </button>
  )
})

const MobileMenu = memo(function MobileMenu({
  isOpen,
  onClose,
  isAuthenticated,
  username,
  avatarUrl,
  onSignOut
}: {
  isOpen: boolean
  onClose: () => void
  isAuthenticated: boolean
  username?: string
  avatarUrl?: string | null
  onSignOut: () => Promise<void>
}) {
  const { t } = useLanguage()
  const router = useRouter()
  const pathname = usePathname()
  const { ref: focusTrapRef } = useFocusTrap(isOpen, onClose)

  useEffect(() => { if (isOpen) onClose() }, [pathname, isOpen, onClose])
  useEffect(() => { document.body.style.overflow = isOpen ? 'hidden' : '' }, [isOpen])

  if (!isOpen) return null

  const handleNavigate = useCallback((href: string) => {
    router.push(href)
    onClose()
  }, [router, onClose])

  return (
    <div className="fixed inset-0 z-70 md:hidden" role="dialog" aria-modal="true" aria-label="Mobile navigation menu">
      <div className="absolute inset-0 bg-black/50 dark:bg-black/70 backdrop-blur-sm animate-fade-in" onClick={onClose} aria-hidden="true" />
      <div ref={focusTrapRef} className={`relative bg-white/95 dark:bg-gray-900/95 backdrop-blur-xl h-full w-80 max-w-full overflow-y-auto ${ANIMATIONS.slideInRight}`}>
        <div className="absolute inset-0 opacity-[0.02] dark:opacity-[0.04] pointer-events-none" style={{ backgroundImage: MAASAI_PATTERN, backgroundSize: '60px 60px' }} aria-hidden="true" />
        <div className="sticky top-0 bg-white/95 dark:bg-gray-900/95 backdrop-blur-xl border-b border-gray-200 dark:border-gray-700 px-4 py-3 flex items-center justify-between z-10">
          <NavLogo />
          <button onClick={onClose} className={`p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors ${FOCUS_RING}`} aria-label="Close menu">
            <svg className="h-6 w-6 text-gray-700 dark:text-gray-300" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true"><path d="M18 6 6 18M6 6l12 12" /></svg>
          </button>
        </div>
        <div className="relative p-4 space-y-4">
          <SearchBar isMobile onClose={onClose} />
          <nav className="space-y-2 pt-2 border-t border-gray-100 dark:border-gray-700" aria-label="Mobile navigation">
            {NAV_ITEMS.filter(item => !item.requiresAuth || isAuthenticated).map((item) => (
              <button key={item.id} onClick={() => handleNavigate(item.href)} className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-colors text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 ${FOCUS_RING}`}>
                <span className="h-5 w-5 text-gray-500" aria-hidden="true">●</span>
                <span className="font-medium">{t(item.label)}</span>
              </button>
            ))}
          </nav>
          {isAuthenticated && username ? (
            <div className="pt-4 border-t border-gray-100 dark:border-gray-700">
              <ProfileDropdown username={username} avatarUrl={avatarUrl} onSignOut={onSignOut} isMobile onClose={onClose} />
            </div>
          ) : (
            <div className="space-y-3 pt-4 border-t border-gray-100 dark:border-gray-700">
              <button onClick={() => { handleNavigate('/login'); onClose() }} className={`w-full flex items-center justify-center gap-2 px-4 py-3 rounded-xl border-2 border-[var(--kenya-red)] text-[var(--kenya-red)] font-medium hover:bg-[var(--kenya-red)] hover:text-white transition-colors ${FOCUS_RING}`}>
                <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true"><path d="M15 3h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-4M10 17l5-5-5-5M13.8 12H3" /></svg>
                {t('auth.login')}
              </button>
              <button onClick={() => { handleNavigate('/signup'); onClose() }} className={`w-full flex items-center justify-center gap-2 px-4 py-3 rounded-xl bg-[var(--kenya-green)] text-white font-medium hover:bg-[var(--kenya-green-hover, #005c36)] transition-colors ${FOCUS_RING}`}>
                <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true"><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2M9 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8M20 8v6M23 11h-6" /></svg>
                {t('auth.signup')}
              </button>
            </div>
          )}
          <div className="pt-4 border-t border-gray-100 dark:border-gray-700">
            <div className="flex flex-wrap gap-4 text-sm text-gray-500 dark:text-gray-400">
              <a href="/about" className="hover:text-[var(--kenya-red)]" onClick={onClose}>{t('footer.about')}</a>
              <a href="/help" className="hover:text-[var(--kenya-red)]" onClick={onClose}>{t('footer.help')}</a>
              <a href="/terms" className="hover:text-[var(--kenya-red)]" onClick={onClose}>{t('footer.terms')}</a>
              <a href="/privacy" className="hover:text-[var(--kenya-red)]" onClick={onClose}>{t('footer.privacy')}</a>
            </div>
            <p className="mt-4 text-xs text-gray-400 dark:text-gray-500">© {new Date().getFullYear()} Stream254 🇰🇪</p>
          </div>
        </div>
      </div>
    </div>
  )
})

// ===================================================
// 🎯 MAIN NAVBAR COMPONENT
// ===================================================
export default function Navbar() {
  const { user, profile, signOut } = useAuth()
  const { t } = useLanguage()
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const pathname = usePathname()
  const router = useRouter()

  useEffect(() => { setMobileMenuOpen(false) }, [pathname])

  const handleSignOut = useCallback(async () => {
    try { await signOut() } catch (error) { console.error('Sign out failed:', error) }
  }, [signOut])

  const handleNavigate = useCallback((href: string) => router.push(href), [router])

  return (
    <nav className="fixed top-0 w-full z-50 transition-all duration-300" role="navigation" aria-label="Main navigation">
      <div className={`relative ${GLASS_CLASSES}`}>
        <div className="absolute inset-0 opacity-[0.02] dark:opacity-[0.04] pointer-events-none" style={{ backgroundImage: MAASAI_PATTERN, backgroundSize: '60px 60px' }} aria-hidden="true" />
        
        <div className="absolute right-4 top-1/2 -translate-y-1/2 w-32 h-32 opacity-[0.03] dark:opacity-[0.05] pointer-events-none hidden lg:block" style={{ backgroundImage: KENYA_SHIELD, backgroundRepeat: 'no-repeat', backgroundPosition: 'center', backgroundSize: 'contain' }} aria-hidden="true" />
        
        <div className="h-1 w-full overflow-hidden">
          <div className={`h-full w-[200%] ${ANIMATIONS.flagSlide}`} style={{ background: 'linear-gradient(90deg, var(--kenya-green) 0%, var(--kenya-green) 33%, var(--kenya-black) 33%, var(--kenya-black) 34%, var(--kenya-red) 34%, var(--kenya-red) 66%, var(--kenya-black) 66%, var(--kenya-black) 67%, var(--kenya-green) 67%, var(--kenya-green) 100%)' }} />
        </div>

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16 items-center">
            <div className="flex items-center gap-2 shrink-0"><NavLogo /></div>
            
            <div className="hidden md:flex items-center gap-4 flex-1 justify-center">
              <Suspense fallback={<div className="h-10 w-96 bg-gray-200 dark:bg-gray-700 rounded-full animate-pulse" />}>
                <SearchBar />
              </Suspense>
            </div>
            
            <div className="hidden md:flex items-center gap-2">
              {NAV_ITEMS.filter(item => !item.requiresAuth || user).map((item) => (
                <NavLink key={item.id} item={item} isActive={pathname === item.href} onClick={handleNavigate} />
              ))}
              <NotificationBell />
              <LanguageSelector compact />
              <ThemeToggle />
              
              {user && profile ? (
                <>
                  <button onClick={() => handleNavigate('/upload')} className={`hidden md:flex items-center justify-center gap-2 px-5 py-2.5 font-semibold rounded-full bg-white dark:bg-gray-800 text-[var(--kenya-red)] dark:text-[#ff6b6b] border-2 border-[var(--kenya-red)] dark:border-[#ff6b6b] hover:bg-[var(--kenya-red)] dark:hover:bg-[var(--kenya-red)] hover:text-white transition-all duration-300 shadow-sm hover:shadow-[var(--kenya-red)]/30 hover:-translate-y-0.5 ${FOCUS_RING}`}>
                    <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4M17 8l-5-5-5 5M12 3v12" /></svg>
                    <span>{t('navigation.upload')}</span>
                  </button>
                  <ProfileDropdown username={profile.username} avatarUrl={profile.avatar_url} onSignOut={handleSignOut} />
                </>
              ) : (
                <>
                  <button onClick={() => handleNavigate('/login')} className={`hidden md:flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-lg text-gray-700 dark:text-gray-300 hover:text-[var(--kenya-red)] hover:bg-[var(--kenya-red)]/10 dark:hover:bg-[var(--kenya-red)]/20 transition-all ${FOCUS_RING}`}>
                    <svg className="h-4 w-4 text-[var(--kenya-red)]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true"><path d="M15 3h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-4M10 17l5-5-5-5M13.8 12H3" /></svg>
                    <span>{t('login')}</span>
                  </button>
                  <button onClick={() => handleNavigate('/signup')} className={`hidden md:flex items-center justify-center gap-2 px-5 py-2.5 font-semibold rounded-full bg-[var(--kenya-green)] text-white hover:bg-[var(--kenya-green-hover, #005c36)] transition-all shadow-sm hover:shadow-[var(--kenya-green)]/30 ${FOCUS_RING}`}>
                    <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true"><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2M9 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8M20 8v6M23 11h-6" /></svg>
                    <span>{t('signup')}</span>
                  </button>
                </>
              )}
            </div>
            
            <div className="md:hidden flex items-center gap-2">
              <LanguageSelector compact />
              <ThemeToggle />
              <button onClick={() => setMobileMenuOpen(prev => !prev)} className={`p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors ${FOCUS_RING}`} aria-label={mobileMenuOpen ? 'Close menu' : 'Open menu'} aria-expanded={mobileMenuOpen}>
                {mobileMenuOpen ? (
                  <svg className="h-6 w-6 text-gray-700 dark:text-gray-300" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true"><path d="M18 6 6 18M6 6l12 12" /></svg>
                ) : (
                  <svg className="h-6 w-6 text-gray-700 dark:text-gray-300" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true"><path d="M4 6h16M4 12h16M4 18h16" /></svg>
                )}
              </button>
            </div>
          </div>
        </div>
      </div>
      
      <MobileMenu 
        isOpen={mobileMenuOpen} 
        onClose={() => setMobileMenuOpen(false)} 
        isAuthenticated={!!user} 
        username={profile?.username} 
        avatarUrl={profile?.avatar_url} 
        onSignOut={handleSignOut} 
      />
    </nav>
  )
}
