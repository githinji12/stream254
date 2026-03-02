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
 * Calculate simple relevance score client-side
 */
function calculateRelevanceScore(
  item: any,
  query: string
): number {
  const searchTerms = query.toLowerCase().split(/\s+/).filter(Boolean)
  let score = 0
  
  // Title match (highest weight)
  if (item.title) {
    const titleLower = item.title.toLowerCase()
    searchTerms.forEach(term => {
      if (titleLower.includes(term)) score += 10
      if (titleLower.startsWith(term)) score += 5
    })
  }
  
  // Description match (medium weight)
  if (item.description) {
    const descLower = item.description.toLowerCase()
    searchTerms.forEach(term => {
      if (descLower.includes(term)) score += 3
    })
  }
  
  // Engagement boost
  score += (item.views || 0) / 1000
  score += (item.likes_count || 0) / 100
  
  // Recency boost (newer = higher score)
  if (item.created_at) {
    const daysOld = (Date.now() - new Date(item.created_at).getTime()) / (1000 * 60 * 60 * 24)
    score += Math.max(0, 10 - daysOld) * 0.5
  }
  
  return score
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
  
  // Build base query for videos
  let videoQuery = supabase
    .from('videos')
    .select(`
      *,
      profile:profiles!videos_creator_id_fkey (
        id,
        username,
        avatar_url,
        is_verified
      ),
      likes_count:likes(count)
    `, { count: 'exact' })
    .textSearch('fts_content', normalizedQuery, {
      type: 'websearch',
      config: 'english'
    })
    .eq('visibility', 'public')
  
  // Apply type filter
  if (filters.type === 'video') {
    // Videos only - already filtered
  } else if (filters.type === 'profile') {
    // Skip videos query entirely
    videoQuery = supabase.from('videos').select('id').eq('id', '00000000-0000-0000-0000-000000000000')
  }
  
  // Apply category filter
  if (filters.category && filters.type !== 'profile') {
    videoQuery = videoQuery.eq('category', filters.category)
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
    videoQuery = videoQuery.gte('created_at', dateFilters[filters.dateRange].toISOString())
  }
  
  // Apply sorting for videos
  switch (filters.sortBy) {
    case 'views':
      videoQuery = videoQuery.order('views', { ascending: false, nullsFirst: false })
      break
    case 'likes':
      videoQuery = videoQuery.order('likes_count', { ascending: false, nullsFirst: false })
      break
    case 'trending':
      videoQuery = videoQuery
        .order('created_at', { ascending: false })
        .order('views', { ascending: false })
      break
    case 'newest':
      videoQuery = videoQuery.order('created_at', { ascending: false })
      break
    case 'oldest':
      videoQuery = videoQuery.order('created_at', { ascending: true })
      break
    case 'relevance':
    default:
      // FTS already returns relevance-ordered results
      break
  }
  
  // Apply pagination
  const from = (page - 1) * limit
  const to = from + limit - 1
  videoQuery = videoQuery.range(from, to)
  
  // Execute video query
  const { data: videosData, error: videosError, count: videosCount } = await videoQuery
  
  if (videosError) {
    console.error('Video search error:', videosError)
    throw new Error(`Video search failed: ${videosError.message}`)
  }
  
  // Search profiles
  let profilesData: any[] = []
  let profilesCount = 0
  
  if (filters.type !== 'video') {
    let profileQuery = supabase
      .from('profiles')
      .select('*', { count: 'exact' })
      .textSearch('fts_content', normalizedQuery, {
        type: 'websearch',
        config: 'english'
      })
      .is('is_private', false)
    
    // Apply date range to profiles if needed
    if (filters.dateRange && filters.dateRange !== 'all') {
      const now = new Date()
      const dateFilters: Record<string, Date> = {
        today: new Date(now.setHours(0, 0, 0, 0)),
        week: new Date(now.setDate(now.getDate() - 7)),
        month: new Date(now.setMonth(now.getMonth() - 1)),
        year: new Date(now.setFullYear(now.getFullYear() - 1)),
      }
      profileQuery = profileQuery.gte('created_at', dateFilters[filters.dateRange].toISOString())
    }
    
    profileQuery = profileQuery.range(0, limit - 1)
    
    const { data, error, count } = await profileQuery
    
    if (!error && data) {
      profilesData = data
      profilesCount = count || 0
    }
  }
  
  // Combine and transform results
  const videoResults: SearchResult[] = (videosData || []).map((video: any) => ({
    type: 'video' as const,
    id: video.id,
    title: video.title,
    description: video.description,
    thumbnail_url: video.thumbnail_url,
    video_url: video.video_url,
    duration: video.duration,
    views: video.views || 0,
    likes_count: video.likes_count || 0,
    created_at: video.created_at,
    profile: video.profile || {
      id: video.creator_id,
      username: 'Unknown',
      avatar_url: null,
      is_verified: false,
    },
    rank: 0, // Will be calculated below
    highlight: {
      title: highlightText(video.title, query),
      description: highlightText(video.description || '', query, 150),
    },
  }))
  
  const profileResults: SearchResult[] = (profilesData || []).map((profile: any) => ({
    type: 'profile' as const,
    id: profile.id,
    title: profile.username,
    description: profile.bio,
    thumbnail_url: profile.avatar_url,
    video_url: null,
    duration: null,
    views: 0,
    likes_count: 0,
    created_at: profile.created_at,
    profile: {
      id: profile.id,
      username: profile.username,
      avatar_url: profile.avatar_url,
      is_verified: profile.is_verified,
    },
    rank: 0,
    highlight: {
      title: highlightText(profile.username, query),
      description: highlightText(profile.bio || '', query, 150),
    },
  }))
  
  // Combine results
  let allResults = [...videoResults, ...profileResults]
  
  // Sort by relevance if needed (client-side scoring)
  if (filters.sortBy === 'relevance') {
    allResults = allResults
      .map(item => ({
        ...item,
        rank: calculateRelevanceScore(item, query)
      }))
      .sort((a, b) => b.rank - a.rank)
  }
  
  // Apply pagination to combined results
  const paginatedResults = allResults.slice(0, limit)
  const total = (videosCount || 0) + profilesCount
  const hasMore = from + paginatedResults.length < total
  
  return {
    results: paginatedResults,
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