// app/search/page.tsx
'use client'

import { Suspense } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import { useSearch } from '@/hooks/useSearch'
import { SearchFilters } from '@/lib/services/searchService'
import { Search, X, Loader2, Filter, ChevronDown } from 'lucide-react'
import Link from 'next/link'
import LikeButtonCard from '@/components/video/LikeButtonCard'
import CommentModal from '@/components/comments/CommentModal'

// 🎨 Kenyan Theme
const KENYA = {
  red: '#bb0000',
  green: '#007847',
  black: '#000000',
} as const

// 🔧 Types
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

// 🎨 Components
function SearchInput({
  value,
  onChange,
  onSubmit,
  onClear,
  suggestions,
  onSuggestionClick,
  isLoading,
}: {
  value: string
  onChange: (value: string) => void
  onSubmit: () => void
  onClear: () => void
  suggestions: Array<{ type: string; value: string; metadata?: any }>
  onSuggestionClick: (value: string) => void
  isLoading: boolean
}) {
  return (
    <div className="relative w-full max-w-2xl">
      <form onSubmit={(e) => { e.preventDefault(); onSubmit() }} className="relative">
        <label htmlFor="search-input" className="sr-only">Search videos and creators</label>
        <input
          id="search-input"
          type="search"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder="Search videos, creators, #hashtags..."
          className="w-full px-4 py-3 pl-12 pr-12 border-2 border-gray-300 rounded-full focus:outline-none focus:border-[#bb0000] focus:ring-2 focus:ring-[#bb0000]/20 text-base transition-all"
          aria-label="Search videos and creators"
        />
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
        
        {(value || isLoading) && (
          <button
            type="button"
            onClick={onClear}
            className="absolute right-4 top-1/2 -translate-y-1/2 p-1 hover:bg-gray-100 rounded-full"
            aria-label="Clear search"
          >
            {isLoading ? (
              <Loader2 className="h-4 w-4 text-gray-400 animate-spin" />
            ) : (
              <X className="h-4 w-4 text-gray-400 hover:text-[#bb0000]" />
            )}
          </button>
        )}
      </form>
      
      {suggestions.length > 0 && (
        <ul className="absolute top-full left-0 right-0 mt-2 bg-white border border-gray-200 rounded-xl shadow-lg z-50 max-h-80 overflow-y-auto">
          {suggestions.map((suggestion, index) => (
            <li
              key={`${suggestion.type}-${suggestion.value}`}
              className="flex items-center gap-3 px-4 py-3 cursor-pointer hover:bg-gray-50"
              onClick={() => onSuggestionClick(suggestion.value)}
            >
              <div className="h-8 w-8 rounded-full bg-gray-100 flex items-center justify-center">
                {suggestion.type === 'profile' && suggestion.metadata?.avatar_url ? (
                  <img src={suggestion.metadata.avatar_url} alt="" className="h-8 w-8 rounded-full object-cover" />
                ) : suggestion.type === 'video' ? (
                  <span className="text-xs">🎬</span>
                ) : (
                  <span className="text-xs">#</span>
                )}
              </div>
              <div className="flex-1">
                <p className="font-medium text-gray-900">
                  {suggestion.type === 'profile' ? '@' : suggestion.type === 'hashtag' ? '#' : ''}
                  {suggestion.value}
                </p>
                <p className="text-xs text-gray-500 capitalize">{suggestion.type}</p>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}

function SearchFiltersBar({
  filters,
  onFilterChange,
  onSortChange,
}: {
  filters: SearchFilters
  onFilterChange: (filters: Partial<SearchFilters>) => void
  onSortChange: (sortBy: SearchFilters['sortBy']) => void
}) {
  const sortOptions = [
    { value: 'relevance', label: 'Relevance' },
    { value: 'views', label: 'Most views' },
    { value: 'likes', label: 'Most likes' },
    { value: 'newest', label: 'Newest' },
  ]
  
  return (
    <div className="flex flex-wrap items-center gap-3 py-4 border-b border-gray-200">
      <div className="relative">
        <select
          value={filters.sortBy}
          onChange={(e) => onSortChange(e.target.value as SearchFilters['sortBy'])}
          className="appearance-none px-4 py-2 pr-8 border border-gray-300 rounded-lg text-sm font-medium"
        >
          {sortOptions.map(opt => (
            <option key={opt.value} value={opt.value}>{opt.label}</option>
          ))}
        </select>
        <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400 pointer-events-none" />
      </div>
      
      <div className="flex items-center gap-2">
        <Filter className="h-4 w-4 text-gray-500" />
        <select
          value={filters.type || 'all'}
          onChange={(e) => onFilterChange({ type: e.target.value as SearchFilters['type'] })}
          className="px-3 py-1.5 border border-gray-300 rounded-lg text-sm"
        >
          <option value="all">All</option>
          <option value="video">Videos</option>
          <option value="profile">Profiles</option>
        </select>
      </div>
    </div>
  )
}

function VideoCard({ video }: { video: SearchResult }) {
  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleDateString('en-KE', { month: 'short', day: 'numeric', year: 'numeric' })
  }
  
  const formatNumber = (num: number): string => {
    if (num >= 1000000) return (num / 1000000).toFixed(1) + 'M'
    if (num >= 1000) return (num / 1000).toFixed(1) + 'K'
    return num.toString()
  }
  
  return (
    <Link
      href={video.type === 'video' ? `/video/${video.id}` : `/profile/${video.id}`}
      className="group block bg-white rounded-xl border border-gray-200 overflow-hidden hover:shadow-lg transition-all"
    >
      <div className="aspect-video bg-gray-100 relative">
        {video.thumbnail_url ? (
          <img src={video.thumbnail_url} alt={video.title} className="w-full h-full object-cover" loading="lazy" />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-gray-400">
            {video.type === 'video' ? '🎬' : '👤'}
          </div>
        )}
        {video.rank > 0.5 && (
          <span className="absolute top-2 left-2 px-2 py-0.5 bg-[#bb0000]/90 text-white text-xs rounded">
            Top match
          </span>
        )}
      </div>
      
      <div className="p-4">
        <h3 
          className="font-semibold text-gray-900 line-clamp-2 mb-2"
          dangerouslySetInnerHTML={{ __html: video.highlight.title }}
        />
        
        {video.type === 'video' && (
          <>
            <div className="flex items-center gap-2 text-sm text-gray-600 mb-2">
              <div className="h-6 w-6 rounded-full bg-to-br from-[#bb0000] to-[#007847] flex items-center justify-center text-white text-xs">
                {video.profile.username?.charAt(0).toUpperCase()}
              </div>
              <span>@{video.profile.username}</span>
            </div>
            
            <div className="flex items-center gap-3 text-xs text-gray-500">
              <span>{formatNumber(video.views)} views</span>
              <span>•</span>
              <span>{formatDate(video.created_at)}</span>
            </div>
          </>
        )}
        
        {video.type === 'profile' && (
          <p className="text-sm text-gray-600 line-clamp-2">
            Creator • {video.profile.is_verified && '✓ Verified'}
          </p>
        )}
      </div>
    </Link>
  )
}

function SearchSkeleton() {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
      {[...Array(8)].map((_, i) => (
        <div key={i} className="bg-white rounded-xl border border-gray-200 overflow-hidden animate-pulse">
          <div className="aspect-video bg-gray-200" />
          <div className="p-4 space-y-3">
            <div className="h-4 bg-gray-200 rounded w-3/4" />
            <div className="h-4 bg-gray-200 rounded w-1/2" />
          </div>
        </div>
      ))}
    </div>
  )
}

function EmptyState({ query }: { query: string }) {
  return (
    <div className="text-center py-16">
      <Search className="h-16 w-16 text-gray-300 mx-auto mb-4" />
      <h2 className="text-2xl font-bold text-gray-900 mb-3">No results found</h2>
      <p className="text-gray-600 mb-6">
        We couldn't find anything matching "<span className="font-semibold">{query}</span>"
      </p>
      <Link
        href="/"
        className="px-6 py-3 rounded-full font-medium text-white"
        style={{ background: `linear-gradient(135deg, ${KENYA.red}, ${KENYA.green})` }}
      >
        Browse All Videos
      </Link>
    </div>
  )
}

// ✅ Main Search Content
function SearchContent() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const initialQuery = searchParams.get('q') || ''
  
  const {
    query,
    setQuery,
    filters,
    setFilters,
    results,
    total,
    hasMore,
    loading,
    error,
    suggestions,
    loadMore,
    clear,
    page,
  } = useSearch({
    initialQuery,
    debounceMs: 300,
  })
  
  const handleSearch = () => {
    if (query.trim()) {
      router.push(`/search?q=${encodeURIComponent(query.trim())}`)
    }
  }
  
  const handleSuggestionClick = (value: string) => {
    setQuery(value)
    router.push(`/search?q=${encodeURIComponent(value)}`)
  }
  
  return (
    <div className="min-h-[calc(100vh-4rem)] py-8 px-4 bg-to-br from-gray-50 to-gray-100">
      <div className="max-w-7xl mx-auto">
        <div className="mb-8">
          <SearchInput
            value={query}
            onChange={setQuery}
            onSubmit={handleSearch}
            onClear={() => {
              clear()
              router.push('/search')
            }}
            suggestions={suggestions}
            onSuggestionClick={handleSuggestionClick}
            isLoading={loading && page === 1}
          />
          
          {query && results.length > 0 && !loading && (
            <p className="mt-4 text-gray-600">
              Found <span className="font-semibold">{total}</span> result{total !== 1 ? 's' : ''} for "{query}"
            </p>
          )}
        </div>
        
        {query && (
          <SearchFiltersBar
            filters={filters}
            onFilterChange={setFilters}
            onSortChange={(sortBy) => setFilters({ sortBy })}
          />
        )}
        
        {error && (
          <div className="p-4 bg-red-50 border border-red-200 rounded-lg text-red-700 mb-6">
            {error}
          </div>
        )}
        
        {loading && page === 1 ? (
          <SearchSkeleton />
        ) : !query ? (
          <div className="text-center py-16">
            <Search className="h-16 w-16 text-gray-300 mx-auto mb-4" />
            <h2 className="text-2xl font-bold text-gray-900 mb-3">Search Stream254</h2>
            <p className="text-gray-600">Find videos, creators, and hashtags</p>
          </div>
        ) : results.length === 0 ? (
          <EmptyState query={query} />
        ) : (
          <>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {results.map((video) => (
                <VideoCard key={`${video.type}-${video.id}`} video={video} />
              ))}
            </div>
            
            {hasMore && (
              <div className="flex justify-center py-8">
                <button
                  onClick={loadMore}
                  disabled={loading}
                  className="px-6 py-3 rounded-full font-medium border-2 border-gray-300 text-gray-700 hover:bg-gray-50 disabled:opacity-50"
                >
                  {loading ? 'Loading...' : 'Load more'}
                </button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  )
}

// ✅ Main Export
export default function SearchPage() {
  return (
    <Suspense fallback={
      <div className="min-h-[calc(100vh-4rem)] flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-[#bb0000]" />
      </div>
    }>
      <SearchContent />
    </Suspense>
  )
}