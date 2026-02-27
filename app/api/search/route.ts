// app/api/search/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export type SearchFilters = {
  type?: 'video' | 'profile' | 'all'
  category?: string
  dateRange?: 'today' | 'week' | 'month' | 'year' | 'all'
  sortBy: 'relevance' | 'views' | 'likes' | 'trending' | 'newest' | 'oldest'
}

/**
 * Normalize search query for safe database search
 */
function normalizeQuery(query: string): string {
  return query
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9\s\-_#@]/g, ' ')
    .split(/\s+/)
    .filter(Boolean)
    .join(' & ')
}

/**
 * Highlight matched terms in text
 */
function highlightText(text: string, query: string, maxLength = 200): string {
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
 * GET /api/search - Search videos and profiles
 */
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const query = searchParams.get('q') || ''
    const page = parseInt(searchParams.get('page') || '1', 10)
    const limit = parseInt(searchParams.get('limit') || '20', 10)
    const sortBy = (searchParams.get('sortBy') as SearchFilters['sortBy']) || 'relevance'
    const type = searchParams.get('type') || 'all'
    
    // Validate input
    if (!query.trim()) {
      return NextResponse.json({
        results: [],
        total: 0,
        hasMore: false,
        query: '',
        filters: { sortBy, type },
        suggestions: [],
      })
    }
    
    const sanitizedQuery = query.trim().slice(0, 200)
    const normalizedQuery = normalizeQuery(sanitizedQuery)
    
    // Initialize Supabase client
    const supabase = await createClient()
    
    // ✅ FALLBACK: Use simple ILIKE search if FTS is not set up
    // This works even without fts_content columns
    let videosQuery = supabase
      .from('videos')
      .select(`
        *,
        profile:profiles!videos_creator_id_fkey (
          id,
          username,
          avatar_url,
          is_verified
        )
      `, { count: 'exact' })
      .or(`title.ilike.%${sanitizedQuery}%,description.ilike.%${sanitizedQuery}%`)
      .eq('visibility', 'public')
    
    // Apply type filter
    if (type === 'video') {
      // Videos only - already filtered
    } else if (type === 'profile') {
      // Skip videos, search profiles only
      videosQuery = supabase.from('videos').select('*').eq('id', '00000000-0000-0000-0000-000000000000')
    }
    
    // Apply sorting
    switch (sortBy) {
      case 'views':
        videosQuery = videosQuery.order('views', { ascending: false })
        break
      case 'likes':
        videosQuery = videosQuery.order('created_at', { ascending: false })
        break
      case 'newest':
        videosQuery = videosQuery.order('created_at', { ascending: false })
        break
      case 'oldest':
        videosQuery = videosQuery.order('created_at', { ascending: true })
        break
      case 'relevance':
      case 'trending':
      default:
        videosQuery = videosQuery.order('created_at', { ascending: false })
        break
    }
    
    // Apply pagination
    const from = (page - 1) * limit
    const to = from + limit - 1
    videosQuery = videosQuery.range(from, to)
    
    // Execute video search
    const { data: videosData, error: videosError, count: videosCount } = await videosQuery
    
    if (videosError) {
      console.error('Video search error:', videosError)
      throw new Error(`Video search failed: ${videosError.message}`)
    }
    
    // Search profiles
    let profilesData: any[] = []
    let profilesCount = 0
    
    if (type !== 'video') {
      const profilesQuery = supabase
        .from('profiles')
        .select('*', { count: 'exact' })
        .or(`username.ilike.%${sanitizedQuery}%,full_name.ilike.%${sanitizedQuery}%,bio.ilike.%${sanitizedQuery}%`)
        .is('is_private', false)
        .range(0, limit - 1)
      
      const { data, error, count } = await profilesQuery
      
      if (!error && data) {
        profilesData = data
        profilesCount = count || 0
      }
    }
    
    // Transform results
    const results = [
      ...(videosData || []).map((video: any) => ({
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
        rank: 0,
        highlight: {
          title: highlightText(video.title, sanitizedQuery),
          description: highlightText(video.description || '', sanitizedQuery, 150),
        },
      })),
      ...(profilesData || []).map((profile: any) => ({
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
          title: highlightText(profile.username, sanitizedQuery),
          description: highlightText(profile.bio || '', sanitizedQuery, 150),
        },
      })),
    ]
    
    // Sort by relevance (videos first, then profiles)
    results.sort((a, b) => {
      if (a.type === 'video' && b.type === 'profile') return -1
      if (a.type === 'profile' && b.type === 'video') return 1
      return 0
    })
    
    const total = (videosCount || 0) + profilesCount
    const hasMore = from + results.length < total
    
    // Get suggestions
    const suggestions = await getSuggestions(sanitizedQuery, supabase)
    
    return NextResponse.json({
      results,
      total,
      hasMore,
      query: sanitizedQuery,
      filters: { sortBy, type },
      suggestions,
    })
    
  } catch (error: any) {
    console.error('Search API error:', error)
    
    return NextResponse.json(
      { 
        error: 'Search failed. Please try again.',
        details: process.env.NODE_ENV === 'development' ? error.message : undefined,
        results: [],
        total: 0,
        hasMore: false,
      },
      { status: 500 }
    )
  }
}

/**
 * Get search suggestions
 */
async function getSuggestions(query: string, supabase: any) {
  if (!query.trim() || query.length < 2) return []
  
  try {
    const sanitized = query.trim().toLowerCase()
    
    const [videoResults, profileResults] = await Promise.all([
      supabase
        .from('videos')
        .select('title')
        .ilike('title', `%${sanitized}%`)
        .eq('visibility', 'public')
        .order('views', { ascending: false })
        .limit(5),
      
      supabase
        .from('profiles')
        .select('username, avatar_url')
        .ilike('username', `%${sanitized}%`)
        .limit(5),
    ])
    
    const suggestions: Array<{
      type: 'video' | 'profile' | 'hashtag'
      value: string
      metadata?: Record<string, any>
    }> = []
    
    if (videoResults.data) {
      suggestions.push(
        ...videoResults.data.map((v: any) => ({
          type: 'video' as const,
          value: v.title,
          metadata: { resultType: 'video' },
        }))
      )
    }
    
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
    
    // Deduplicate
    const seen = new Set<string>()
    return suggestions
      .filter(s => {
        const key = `${s.type}:${s.value.toLowerCase()}`
        if (seen.has(key)) return false
        seen.add(key)
        return true
      })
      .slice(0, 10)
      
  } catch (error) {
    console.error('Suggestions error:', error)
    return []
  }
}

// Handle OPTIONS for CORS
export async function OPTIONS() {
  return new NextResponse(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    },
  })
}