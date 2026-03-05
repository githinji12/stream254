// components/layout/navbar/SearchBar.tsx
'use client'

import { memo, useCallback, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useLanguage } from '@/lib/i18n/client'
import { useSearchSuggestions } from '@/hooks/useSearchSuggestions'
import { useKeyboardNavigation } from '@/hooks/useKeyboardNavigation'
import { FOCUS_RING, ANIMATIONS } from '@/lib/constants/navbar'
import { SearchSuggestion } from '@/lib/navigation/types'
import { sanitizeSearchInput } from '@/lib/utils/sanitize'

type SearchBarProps = {
  isMobile?: boolean
  onClose?: () => void
}

export const SearchBar = memo(function SearchBar({ 
  isMobile = false, 
  onClose 
}: SearchBarProps) {
  const { t } = useLanguage()
  const router = useRouter()
  const inputRef = useRef<HTMLInputElement>(null)
  const listboxId = 'search-suggestions-listbox'
  
  const {
    query,
    suggestions,
    isLoading,
    error,
    activeIndex,
    setQuery,
    clearSearch,
    handleKeyDown: handleSuggestionsKeyDown,
    hasSuggestions,
  } = useSearchSuggestions({
    debounceMs: 300,
    minChars: 2,
    maxResults: 5,
  })

  const {
    ref: keyboardRef,
    handleKeyDown: handleKeyboardNav,
  } = useKeyboardNavigation({
    itemCount: suggestions.length,
    enabled: hasSuggestions,
    onSelect: (index) => {
      const suggestion = suggestions[index]
      if (suggestion) {
        handleSelectSuggestion(suggestion)
      }
    },
    onEscape: () => {
      clearSearch()
      inputRef.current?.blur()
    },
  })

  const handleSelectSuggestion = useCallback(
    (suggestion: SearchSuggestion) => {
      router.push(suggestion.href)
      clearSearch()
      onClose?.()
      inputRef.current?.blur()
    },
    [router, clearSearch, onClose]
  )

  const handleSubmit = useCallback(
    (e: React.FormEvent) => {
      e.preventDefault()
      const sanitized = sanitizeSearchInput(query)
      
      if (sanitized) {
        router.push(`/search?q=${encodeURIComponent(sanitized)}`)
        clearSearch()
        onClose?.()
      }
    },
    [query, router, clearSearch, onClose]
  )

  // ✅ FIXED: Extract native event for handleKeyboardNav
  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLInputElement>) => {
      // Let search suggestions hook handle suggestion-specific nav
      if (hasSuggestions) {
        handleSuggestionsKeyDown(e, handleSelectSuggestion)
      }
      
      // ✅ Extract native event from React synthetic event
      const nativeEvent = e.nativeEvent
      if (nativeEvent instanceof KeyboardEvent) {
        handleKeyboardNav(nativeEvent)
      }
    },
    [hasSuggestions, handleSuggestionsKeyDown, handleKeyboardNav, handleSelectSuggestion]
  )

  // Combined class names for input
  const inputClasses = `
    w-full px-4 py-2.5 pl-10 pr-10 
    border-2 border-gray-200 dark:border-gray-700 
    rounded-full 
    focus:outline-none focus:border-[var(--kenya-red)] focus:ring-2 focus:ring-[var(--kenya-red)]/20 
    text-sm text-gray-900 dark:text-white 
    bg-white/50 dark:bg-gray-800/50 backdrop-blur-sm 
    transition-all duration-300
    ${FOCUS_RING}
  `.trim()

  if (isMobile) {
    return (
      <form onSubmit={handleSubmit} className="relative w-full" role="search">
        <label htmlFor="mobile-search" className="sr-only">
          {t('search.placeholder')}
        </label>
        <input
          ref={inputRef}
          id="mobile-search"
          type="search"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder={t('search.placeholder')}
          className={inputClasses}
          aria-label={t('search.placeholder')}
          aria-autocomplete="list"
          aria-controls={listboxId}
          aria-expanded={hasSuggestions}
          aria-activedescendant={
            activeIndex >= 0 ? `suggestion-${activeIndex}` : undefined
          }
        />
        {/* Search icon */}
        <svg
          className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          aria-hidden="true"
        >
          <circle cx="11" cy="11" r="8" />
          <path d="m21 21-4.3-4.3" />
        </svg>
        {/* Clear button */}
        {query && (
          <button
            type="button"
            onClick={clearSearch}
            className="absolute right-3 top-1/2 -translate-y-1/2 p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-full transition-colors"
            aria-label="Clear search"
          >
            <svg
              className="h-4 w-4 text-gray-400 hover:text-[var(--kenya-red)]"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              aria-hidden="true"
            >
              <path d="M18 6 6 18M6 6l12 12" />
            </svg>
          </button>
        )}
      </form>
    )
  }

  return (
    <div className="relative w-full max-w-xl">
      <form onSubmit={handleSubmit} className="relative" role="search">
        <label htmlFor="desktop-search" className="sr-only">
          {t('search.placeholder')}
        </label>
        <input
          ref={inputRef}
          id="desktop-search"
          type="search"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder={t('search.placeholder')}
          className={inputClasses}
          aria-label={t('search.placeholder')}
          aria-autocomplete="list"
          aria-controls={listboxId}
          aria-expanded={hasSuggestions}
          aria-activedescendant={
            activeIndex >= 0 ? `suggestion-${activeIndex}` : undefined
          }
        />
        <svg
          className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          aria-hidden="true"
        >
          <circle cx="11" cy="11" r="8" />
          <path d="m21 21-4.3-4.3" />
        </svg>
        {query && (
          <button
            type="button"
            onClick={clearSearch}
            className="absolute right-3 top-1/2 -translate-y-1/2 p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-full transition-colors"
            aria-label="Clear search"
          >
            <svg
              className="h-4 w-4 text-gray-400 hover:text-[var(--kenya-red)]"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              aria-hidden="true"
            >
              <path d="M18 6 6 18M6 6l12 12" />
            </svg>
          </button>
        )}
      </form>

      {/* Suggestions Dropdown */}
      {(query || isLoading) && (
        <div
          ref={keyboardRef}
          id={listboxId}
          className={`absolute top-full left-0 right-0 mt-2 
            bg-white/95 dark:bg-gray-800/95 backdrop-blur-xl 
            border border-gray-200 dark:border-gray-700 
            rounded-xl shadow-lg z-60 overflow-hidden 
            ${ANIMATIONS.fadeInDown}
          `}
          role="listbox"
          aria-label="Search suggestions"
        >
          {isLoading ? (
            // Loading skeleton
            <div className="p-4 space-y-3">
              {[...Array(3)].map((_, i) => (
                <div
                  key={i}
                  className="h-10 bg-gray-100 dark:bg-gray-700 rounded animate-pulse"
                />
              ))}
            </div>
          ) : error ? (
            // Error state
            <div className="p-4 text-center text-red-600 dark:text-red-400 text-sm">
              {error}
            </div>
          ) : suggestions.length === 0 && query ? (
            // Empty state
            <div className="p-4 text-center text-gray-500 dark:text-gray-400 text-sm">
              No suggestions for "{query}"
            </div>
          ) : (
            // Suggestions list
            <ul>
              {suggestions.map((suggestion, index) => {
                // ✅ FIXED: Compare index with activeIndex instead of non-existent property
                const isActive = index === activeIndex
                
                return (
                  <li key={suggestion.id} role="presentation">
                    <button
                      id={`suggestion-${index}`}
                      type="button"
                      onClick={() => handleSelectSuggestion(suggestion)}
                      className={`
                        w-full flex items-center gap-3 px-4 py-3 text-left
                        transition-colors
                        ${
                          isActive
                            ? 'bg-[var(--kenya-red)]/10 dark:bg-[var(--kenya-red)]/20'
                            : 'hover:bg-gray-50 dark:hover:bg-gray-700'
                        }
                        ${FOCUS_RING}
                      `.trim()}
                      role="option"
                      aria-selected={isActive}
                    >
                      <svg
                        className="h-4 w-4 text-gray-400 shrink-0"  // ✅ Updated: flex-shrink-0 → shrink-0
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                        aria-hidden="true"
                      >
                        <circle cx="11" cy="11" r="8" />
                        <path d="m21 21-4.3-4.3" />
                      </svg>
                      <span className="text-sm text-gray-700 dark:text-gray-300 truncate">
                        {suggestion.label}
                      </span>
                      <span className="ml-auto text-xs text-gray-400 capitalize">
                        {suggestion.type}
                      </span>
                    </button>
                  </li>
                )
              })}
            </ul>
          )}
        </div>
      )}
    </div>
  )
})