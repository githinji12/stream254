// hooks/useSearchSuggestions.ts
'use client'

// ✅ FIXED: Added useRef to imports
import { useCallback, useEffect, useMemo, useState, useRef } from 'react'
import { SearchSuggestion } from '@/lib/navigation/types'  // ✅ Removed SuggestionType import
import { sanitizeSearchInput } from '@/lib/utils/sanitize'

export type UseSearchSuggestionsOptions = {
  debounceMs?: number
  minChars?: number
  maxResults?: number
  endpoint?: string
}

export function useSearchSuggestions({
  debounceMs = 300,
  minChars = 2,
  maxResults = 5,
  endpoint = '/api/search/suggestions',
}: UseSearchSuggestionsOptions = {}) {
  const [query, setQuery] = useState('')
  const [suggestions, setSuggestions] = useState<SearchSuggestion[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [activeIndex, setActiveIndex] = useState(-1)

  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => {
    return () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current)
    }
  }, [])

  const fetchSuggestions = useCallback(
    async (searchQuery: string) => {
      const sanitized = sanitizeSearchInput(searchQuery)
      
      if (sanitized.length < minChars) {
        setSuggestions([])
        setIsLoading(false)
        return
      }

      setIsLoading(true)
      setError(null)

      try {
        await new Promise((resolve) => setTimeout(resolve, debounceMs))
        
        // ✅ FIXED: Use inline union type assertion instead of imported type
        const mockSuggestions: SearchSuggestion[] = [
          {
            id: `video-${sanitized}`,
            label: `Videos about "${sanitized}"`,
            type: 'video' as 'video' | 'creator' | 'hashtag',  // ✅ Inline union
            href: `/search?q=${encodeURIComponent(sanitized)}&type=video`,
          },
          {
            id: `creator-${sanitized}`,
            label: `Creators matching "${sanitized}"`,
            type: 'creator' as 'video' | 'creator' | 'hashtag',
            href: `/search?q=${encodeURIComponent(sanitized)}&type=creator`,
          },
          {
            id: `tag-${sanitized}`,
            label: `#${sanitized}`,
            type: 'hashtag' as 'video' | 'creator' | 'hashtag',
            href: `/search?q=${encodeURIComponent(sanitized)}&type=hashtag`,
          },
        ].slice(0, maxResults)

        setSuggestions(mockSuggestions)
      } catch (err) {
        console.error('Search suggestions error:', err)
        setError('Failed to load suggestions')
        setSuggestions([])
      } finally {
        setIsLoading(false)
      }
    },
    [debounceMs, minChars, maxResults, endpoint]
  )

  const handleQueryChange = useCallback(
    (value: string) => {
      setQuery(value)
      setActiveIndex(-1)

      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current)
      }

      timeoutRef.current = setTimeout(() => {
        fetchSuggestions(value)
      }, debounceMs)
    },
    [fetchSuggestions, debounceMs]
  )

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent, onSelect: (suggestion: SearchSuggestion) => void) => {
      switch (e.key) {
        case 'ArrowDown':
          e.preventDefault()
          setActiveIndex((prev) => 
            prev < suggestions.length - 1 ? prev + 1 : prev
          )
          break
        case 'ArrowUp':
          e.preventDefault()
          setActiveIndex((prev) => (prev > 0 ? prev - 1 : -1))
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
    },
    [suggestions, activeIndex]
  )

  const clearSearch = useCallback(() => {
    setQuery('')
    setSuggestions([])
    setActiveIndex(-1)
    setError(null)
    if (timeoutRef.current) clearTimeout(timeoutRef.current)
  }, [])

  const suggestionsWithActive = useMemo(() => 
    suggestions.map((suggestion, index) => ({
      ...suggestion,
      isActive: index === activeIndex,
    })),
    [suggestions, activeIndex]
  )

  return {
    query,
    suggestions: suggestionsWithActive,
    isLoading,
    error,
    activeIndex,
    setQuery: handleQueryChange,
    clearSearch,
    setActiveIndex,
    handleKeyDown,
    hasSuggestions: suggestions.length > 0,
    isValidQuery: query.trim().length >= minChars,
  }
}