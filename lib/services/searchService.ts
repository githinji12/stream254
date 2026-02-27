// lib/services/searchService.ts
import { createClient } from '@/lib/supabase/server'
import type { Video, Profile } from '@/lib/types'

export type SearchResult = {
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

export type SearchFilters = {
  type?: 'video' | 'profile' | 'all'
  category?: string
  dateRange?: 'today' | 'week' | 'month' | 'year' | 'all'
  sortBy: 'relevance' | 'views' | 'likes' | 'trending' | 'newest' | 'oldest'
}

export type SearchResponse = {
  results: SearchResult[]
  total: number
  hasMore: boolean
  query: string
  filters: SearchFilters
}

/**
 * Normalize search query for FTS
 */
export function normalizeQuery(query: string): string {
  return query
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9\s\-_#@]/g, ' ')
    .split(/\s+/)
    .filter(Boolean)
    .map(term => `${term}:*`)
    .join(' & ')
}

/**
 * Highlight matched terms in text
 */
export function highlightText(text: string, query: string, maxLength = 200): string {
  if (!query.trim() || !text) return text
  
  const terms = query
    .trim()
    .split(/\s+/)
    .filter(Boolean)
    .map(term => term.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'))
  
  let highlighted = text
  terms.forEach(term => {
    const regex = new RegExp(`(${term})`, 'gi')
    highlighted = highlighted.replace(regex, '<mark class="bg-[#bb0000]/20 text-[#bb0000] px-0.5 rounded">$1</mark>')
  })
  
  if (highlighted.length > maxLength) {
    const truncated = highlighted.substring(0, maxLength)
    const lastSpace = truncated.lastIndexOf(' ')
    return (lastSpace > maxLength * 0.7 ? truncated.substring(0, lastSpace) : truncated) + '...'
  }
  
  return highlighted
}

/**
 * Search videos and profiles using Full-Text Search
 */
export async function searchContent(
  query: string,
  filters: SearchFilters = { sortBy: 'relevance' },
  page: number = 1,
  limit: number = 20
): Promise<SearchResponse> {
  const supabase = await createClient()
  const normalizedQuery = normalizeQuery(query)
  
  if (!normalizedQuery || normalizedQuery === '*:*') {
    return {
      results: [],
      total: 0,
      hasMore: false,
      query,
      filters
    }
  }
  
  // Build ranking expression for relevance scoring
  const rankExpression = `
    ts_rank(
      fts_content,
      to_tsquery('english', $1),
      32
    ) * 1.0 +
    (COALESCE(views, 0) / 1000.0) * 0.3 +
    (COALESCE(likes_count, 0) / 100.0) * 0.2 +
    POWER(EXTRACT(EPOCH FROM (NOW() - created_at)) / 86400.0 + 1, -0.1) * 0.1
  `
  
  // Build base query
  let dbQuery = supabase
    .from('search_results_combined')
    .select(`
      result_type,
      id,
      title,
      description,
      thumbnail_url,
      video_url,
      duration,
      views,
      likes_count,
      created_at,
      profile_id,
      profile_username,
      profile_avatar,
      profile_verified,
      rank:rank_expression
    `, { 
      count: 'exact',
      head: false 
    })
    .rpc('rank_expression', { 
      query: normalizedQuery 
    })
  
  // Apply type filter
  if (filters.type && filters.type !== 'all') {
    dbQuery = dbQuery.eq('result_type', filters.type)
  }
  
  // Apply category filter (videos only)
  if (filters.category && filters.type !== 'profile') {
    dbQuery = dbQuery.eq('category', filters.category)
  }
  
  // Apply date range filter
  if (filters.dateRange && filters.dateRange !== 'all') {
    const now = new Date()
    const dateFilters: Record<string, Date> = {
      today: new Date(now.setHours(0, 0, 0, 0)),
      week: new Date(now.setDate(now.getDate() - 7)),
      month: new Date(now.setMonth(now.getMonth() - 1)),
      year: new Date(now.setFullYear(now.getFullYear() - 1)),
    }
    dbQuery = dbQuery.gte('created_at', dateFilters[filters.dateRange].toISOString())
  }
  
  // Apply sorting
  switch (filters.sortBy) {
    case 'views':
      dbQuery = dbQuery.order('views', { ascending: false, nullsFirst: false })
      break
    case 'likes':
      dbQuery = dbQuery.order('likes_count', { ascending: false, nullsFirst: false })
      break
    case 'trending':
      dbQuery = dbQuery
        .order('created_at', { ascending: false })
        .order('views', { ascending: false })
      break
    case 'newest':
      dbQuery = dbQuery.order('created_at', { ascending: false })
      break
    case 'oldest':
      dbQuery = dbQuery.order('created_at', { ascending: true })
      break
    case 'relevance':
    default:
      dbQuery = dbQuery.order('rank', { ascending: false, nullsFirst: false })
      break
  }
  
  // Apply pagination
  const from = (page - 1) * limit
  const to = from + limit - 1
  dbQuery = dbQuery.range(from, to)
  
  // Execute query
  const { data, error, count } = await dbQuery
  
  if (error) {
    console.error('Search error:', error)
    throw new Error(`Search failed: ${error.message}`)
  }
  
  // Transform results
  const results: SearchResult[] = (data || []).map((item: any) => {
    const isVideo = item.result_type === 'video'
    
    return {
      type: item.result_type as 'video' | 'profile',
      id: item.id,
      title: item.title,
      description: item.description,
      thumbnail_url: item.thumbnail_url,
      ...(isVideo && {
        video_url: item.video_url,
        duration: item.duration,
      }),
      views: item.views || 0,
      likes_count: item.likes_count || 0,
      created_at: item.created_at,
      profile: {
        id: item.profile_id,
        username: item.profile_username,
        avatar_url: item.profile_avatar,
        is_verified: item.profile_verified,
      },
      rank: item.rank || 0,
      highlight: {
        title: highlightText(item.title, query),
        description: highlightText(item.description || '', query, 150),
      },
    }
  })
  
  const total = count || 0
  const hasMore = from + results.length < total
  
  return {
    results,
    total,
    hasMore,
    query,
    filters,
  }
}

/**
 * Get search suggestions (autocomplete)
 */
export async function getSuggestions(query: string, limit = 10): Promise<Array<{
  type: 'video' | 'profile' | 'hashtag'
  value: string
  metadata?: Record<string, any>
}>> {
  if (!query.trim() || query.length < 2) return []
  
  const supabase = await createClient()
  const sanitized = query.trim().toLowerCase()
  
  // Fetch video title suggestions
  const videoSuggestions = supabase
    .from('videos')
    .select('title')
    .ilike('title', `%${sanitized}%`)
    .eq('visibility', 'public')
    .order('views', { ascending: false })
    .limit(5)
  
  // Fetch profile username suggestions
  const profileSuggestions = supabase
    .from('profiles')
    .select('username, avatar_url')
    .ilike('username', `%${sanitized}%`)
    .limit(5)
  
  const [videoResults, profileResults] = await Promise.all([
    videoSuggestions,
    profileSuggestions,
  ])
  
  const suggestions: Array<{
    type: 'video' | 'profile' | 'hashtag'
    value: string
    metadata?: Record<string, any>
  }> = []
  
  // Add video suggestions
  if (videoResults.data) {
    suggestions.push(
      ...videoResults.data.map((v: any) => ({
        type: 'video' as const,
        value: v.title,
        metadata: { resultType: 'video' },
      }))
    )
  }
  
  // Add profile suggestions
  if (profileResults.data) {
    suggestions.push(
      ...profileResults.data.map((p: any) => ({
        type: 'profile' as const,
        value: p.username,
        metadata: {
          avatar_url: p.avatar_url,
          resultType: 'profile',
        },
      }))
    )
  }
  
  // Extract and add hashtag suggestions
  const hashtags = query.match(/#[a-zA-Z0-9_]+/g) || []
  if (hashtags.length > 0) {
    suggestions.push(
      ...hashtags.map(tag => ({
        type: 'hashtag' as const,
        value: tag.toLowerCase(),
        metadata: { resultType: 'hashtag' },
      }))
    )
  }
  
  // Deduplicate and limit
  const seen = new Set<string>()
  return suggestions
    .filter(s => {
      const key = `${s.type}:${s.value.toLowerCase()}`
      if (seen.has(key)) return false
      seen.add(key)
      return true
    })
    .slice(0, limit)
}

/**
 * Get trending searches (fallback when query is empty)
 */
export async function getTrendingSearches(limit = 10): Promise<string[]> {
  const supabase = await createClient()
  
  // Fetch popular video titles (simple heuristic for trending)
  const { data } = await supabase
    .from('videos')
    .select('title')
    .eq('visibility', 'public')
    .order('views', { ascending: false })
    .order('created_at', { ascending: false })
    .limit(limit)
  
  return (data || []).map((v: any) => v.title).filter(Boolean)
}