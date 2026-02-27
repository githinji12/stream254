// hooks/useSearch.ts
'use client'

import { useState, useCallback, useEffect, useRef } from 'react'

type SearchResult = {
  type: 'video' | 'profile'
  id: string
  title: string
  description: string | null
  thumbnail_url: string | null
  video_url?: string | null
  duration?: number | null
  views: number
  likes_count: number
  created_at: string
  profile: {
    id: string
    username: string
    avatar_url: string | null
    is_verified: boolean | null
  }
  rank: number
  highlight: {
    title: string
    description: string
  }
}

type SearchFilters = {
  type?: 'video' | 'profile' | 'all'
  sortBy: 'relevance' | 'views' | 'likes' | 'trending' | 'newest' | 'oldest'
}

type UseSearchReturn = {
  query: string
  filters: SearchFilters
  results: SearchResult[]
  total: number
  hasMore: boolean
  loading: boolean
  error: string | null
  suggestions: Array<{ type: string; value: string; metadata?: any }>
  setQuery: (query: string) => void
  setFilters: (filters: Partial<SearchFilters>) => void
  loadMore: () => void
  clear: () => void
  page: number
}

export function useSearch({
  initialQuery = '',
  debounceMs = 300,
}: {
  initialQuery?: string
  debounceMs?: number
} = {}): UseSearchReturn {
  // ✅ FIX: All useState calls must have initial values
  const [query, setQuery] = useState<string>(initialQuery)
  const [filters, setFiltersState] = useState<SearchFilters>({ sortBy: 'relevance' })
  const [results, setResults] = useState<SearchResult[]>([])
  const [total, setTotal] = useState<number>(0)
  const [hasMore, setHasMore] = useState<boolean>(true)
  const [loading, setLoading] = useState<boolean>(false)
  const [error, setError] = useState<string | null>(null)
  const [suggestions, setSuggestions] = useState<Array<{ type: string; value: string; metadata?: any }>>([])
  const [page, setPage] = useState<number>(1)
  
  const debounceTimer = useRef<NodeJS.Timeout | null>(null)
  const abortController = useRef<AbortController | null>(null)
  
  // Debounced query
  const [debouncedQuery, setDebouncedQuery] = useState<string>(initialQuery)
  
  useEffect(() => {
    if (debounceTimer.current) clearTimeout(debounceTimer.current)
    
    debounceTimer.current = setTimeout(() => {
      setDebouncedQuery(query)
    }, debounceMs)
    
    return () => {
      if (debounceTimer.current) clearTimeout(debounceTimer.current)
    }
  }, [query, debounceMs])
  
  // Fetch suggestions
  useEffect(() => {
    if (!debouncedQuery.trim() || debouncedQuery.length < 2) {
      setSuggestions([])
      return
    }
    
    const fetchSuggestions = async () => {
      try {
        const response = await fetch(
          `/api/search?q=${encodeURIComponent(debouncedQuery)}&limit=10`,
          { signal: abortController.current?.signal || undefined }
        )
        
        if (!response.ok) throw new Error('Failed to fetch suggestions')
        
        const data = await response.json()
        setSuggestions(data.suggestions || [])
      } catch (err) {
        if ((err as Error).name !== 'AbortError') {
          console.error('Suggestions error:', err)
        }
      }
    }
    
    fetchSuggestions()
    
    return () => {
      abortController.current?.abort()
      abortController.current = new AbortController()
    }
  }, [debouncedQuery])
  
  // Fetch search results
  useEffect(() => {
    if (!debouncedQuery.trim()) {
      setResults([])
      setTotal(0)
      setHasMore(true)
      return
    }
    
    const executeSearch = async () => {
      setLoading(true)
      setError(null)
      
      try {
        const params = new URLSearchParams({
          q: debouncedQuery,
          page: page.toString(),
          limit: '20',
          sortBy: filters.sortBy,
          ...(filters.type && { type: filters.type }),
        })
        
        const response = await fetch(`/api/search?${params}`, {
          signal: abortController.current?.signal || undefined,
        })
        
        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}))
          throw new Error(errorData.error || 'Search failed')
        }
        
        const data = await response.json()
        
        if (page === 1) {
          setResults(data.results || [])
        } else {
          setResults(prev => [...prev, ...(data.results || [])])
        }
        
        setTotal(data.total || 0)
        setHasMore(data.hasMore ?? true)
        if (data.suggestions) {
          setSuggestions(data.suggestions)
        }
        
      } catch (err: any) {
        if (err.name !== 'AbortError') {
          console.error('Search error:', err)
          setError(err.message || 'Failed to load search results')
          if (page === 1) {
            setResults([])
          }
        }
      } finally {
        setLoading(false)
      }
    }
    
    abortController.current?.abort()
    abortController.current = new AbortController()
    
    executeSearch()
    
    return () => {
      abortController.current?.abort()
    }
  }, [debouncedQuery, filters, page])
  
  const handleSetQuery = useCallback((newQuery: string) => {
    setQuery(newQuery)
    setPage(1)
  }, [])
  
  const handleSetFilters = useCallback((newFilters: Partial<SearchFilters>) => {
    setFiltersState(prev => ({ ...prev, ...newFilters }))
    setPage(1)
  }, [])
  
  const handleLoadMore = useCallback(() => {
    if (!loading && hasMore) {
      setPage(prev => prev + 1)
    }
  }, [loading, hasMore])
  
  const handleClear = useCallback(() => {
    setQuery('')
    setResults([])
    setTotal(0)
    setHasMore(true)
    setSuggestions([])
    setPage(1)
  }, [])
  
  return {
    query,
    filters,
    results,
    total,
    hasMore,
    loading,
    error,
    suggestions,
    setQuery: handleSetQuery,
    setFilters: handleSetFilters,
    loadMore: handleLoadMore,
    clear: handleClear,
    page,
  }
}