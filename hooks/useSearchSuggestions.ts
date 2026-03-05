// hooks/useSearchSuggestions.ts

'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'
import { SearchSuggestion } from '@/lib/navigation/types'
import { sanitizeSearchInput } from '@/utils/sanitize'

export type UseSearchSuggestionsOptions = {
  /** Debounce delay in milliseconds */
  debounceMs?: number
  /** Minimum characters before fetching */
  minChars?: number
  /** Maximum suggestions to return */
  maxResults?: number
  /** API endpoint for suggestions */
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

  // Stable debounce timer reference
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current)
    }
  }, [])

  /**
   * Fetch suggestions from API with error handling
   */
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
        // TODO: Replace with actual API call
        // const response = await fetch(`${endpoint}?q=${encodeURIComponent(sanitized)}`)
        // const data = await response.json()
        
        // Mock response for development
        await new Promise((resolve) => setTimeout(resolve, debounceMs))
        
        const mockSuggestions: SearchSuggestion[] = [
          {
            id: `video-${sanitized}`,
            label: `Videos about "${sanitized}"`,
            type: 'video',
            href: `/search?q=${encodeURIComponent(sanitized)}&type=video`,
          },
          {
            id: `creator-${sanitized}`,
            label: `Creators matching "${sanitized}"`,
            type: 'creator',
            href: `/search?q=${encodeURIComponent(sanitized)}&type=creator`,
          },
          {
            id: `tag-${sanitized}`,
            label: `#${sanitized}`,
            type: 'hashtag',
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

  /**
   * Debounced query setter
   */
  const handleQueryChange = useCallback(
    (value: string) => {
      setQuery(value)
      setActiveIndex(-1) // Reset keyboard selection

      // Clear existing timeout
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current)
      }

      // Debounce the API call
      timeoutRef.current = setTimeout(() => {
        fetchSuggestions(value)
      }, debounceMs)
    },
    [fetchSuggestions, debounceMs]
  )

  /**
   * Keyboard navigation for suggestions
   */
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

  /**
   * Clear search state
   */
  const clearSearch = useCallback(() => {
    setQuery('')
    setSuggestions([])
    setActiveIndex(-1)
    setError(null)
    if (timeoutRef.current) clearTimeout(timeoutRef.current)
  }, [])

  /**
   * Memoized suggestion list with active state
   */
  const suggestionsWithActive = useMemo(() => 
    suggestions.map((suggestion, index) => ({
      ...suggestion,
      isActive: index === activeIndex,
    })),
    [suggestions, activeIndex]
  )

  return {
    // State
    query,
    suggestions: suggestionsWithActive,
    isLoading,
    error,
    activeIndex,
    
    // Actions
    setQuery: handleQueryChange,
    clearSearch,
    setActiveIndex,
    handleKeyDown,
    
    // Utilities
    hasSuggestions: suggestions.length > 0,
    isValidQuery: query.trim().length >= minChars,
  }
}