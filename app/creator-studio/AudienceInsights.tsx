// app/creator-studio/AudienceInsights.tsx (lines 1-25)

'use client'

import { useState, useEffect, useMemo, useCallback, useRef } from 'react'
import { 
  Users, Globe, Calendar, TrendingUp, Loader2, AlertCircle, 
  PieChart, BarChart3, MapPin, Clock, ArrowUpRight, ArrowDownRight,
  RefreshCw, Info, Sparkles, Target, Zap, Heart, Share2,
  FileText, Table, Phone, DollarSign, Activity,
  Lightbulb, CheckCircle, X, ExternalLink, ArrowRight  // ✅ ArrowRight included
} from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { useAuth } from '@/hooks/useAuth'
import { toast } from 'react-hot-toast'
import { exportInsights } from '@/lib/utils/exportInsights'
import { generateABTestSuggestions, type ABTestSuggestion } from '@/lib/utils/abTesting'  // ✅ ABTestSuggestion exported
import { getMpesaAnalytics, type MpesaAnalytics, subscribeToNewTips } from '@/lib/services/mpesaAnalytics'
// 🎨 Kenyan Theme Constants
const KENYA = {
  red: '#bb0000',
  green: '#007847',
  black: '#000000',
  blue: '#1DA1F2',
  mpesa: '#4CAF50',
  gray: '#6B7280',
} as const

// 🔧 Types
type AudienceInsight = {
  age_range: string
  percentage: number
  gender: string
  location: string
}

type LocationData = {
  name: string
  percentage: number
  followers: number
}

type EngagementMetric = {
  metric: string
  value: string
  change: string
  positive: boolean
}

interface AudienceInsightsProps {
  userId: string
}

// 📊 Animated Bar Component
function AnimatedBar({ 
  percentage, 
  color, 
  delay = 0,
  label,
  value
}: { 
  percentage: number
  color: string
  delay?: number
  label: string
  value: string
}) {
  const [width, setWidth] = useState(0)
  
  useEffect(() => {
    const timer = setTimeout(() => {
      setWidth(percentage)
    }, delay)
    return () => clearTimeout(timer)
  }, [percentage, delay])
  
  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between text-sm">
        <span className="text-gray-700 font-medium">{label}</span>
        <span className="font-bold text-gray-900">{value}</span>
      </div>
      <div className="h-3 bg-gray-100 rounded-full overflow-hidden relative">
        <div 
          className="h-full rounded-full transition-all duration-700 ease-out relative"
          style={{ 
            width: `${width}%`,
            background: `linear-gradient(90deg, ${color}, ${color}dd)`,
            boxShadow: `0 2px 4px ${color}40`
          }}
        >
          <div className="absolute inset-0 bg-to-r from-transparent via-white/30 to-transparent animate-shimmer" />
        </div>
      </div>
    </div>
  )
}

// 🗺️ Interactive Location Map Component
function LocationMap({ locations }: { locations: LocationData[] }) {
  const [hoveredLocation, setHoveredLocation] = useState<string | null>(null)
  
  const kenyaRegions = [
    { name: 'Nairobi', x: 50, y: 60, size: 12 },
    { name: 'Mombasa', x: 85, y: 85, size: 8 },
    { name: 'Kisumu', x: 20, y: 50, size: 6 },
    { name: 'Nakuru', x: 40, y: 55, size: 5 },
    { name: 'Eldoret', x: 30, y: 40, size: 4 },
    { name: 'Other', x: 50, y: 30, size: 3 },
  ]
  
  return (
    <div className="relative">
      <svg viewBox="0 0 100 100" className="w-full h-48 bg-gray-50 rounded-lg border border-gray-200">
        <path 
          d="M20,30 Q30,20 50,25 T80,40 Q85,60 75,80 Q60,90 40,85 Q20,75 15,50 Q10,40 20,30Z"
          fill="none"
          stroke="#007847"
          strokeWidth="0.5"
          className="opacity-30"
        />
        
        {kenyaRegions.map((region) => {
          const location = locations.find(l => l.name === region.name)
          const percentage = location?.percentage || 0
          const size = region.size + (percentage / 10)
          
          return (
            <g key={region.name}>
              <circle
                cx={region.x}
                cy={region.y}
                r={size}
                fill={percentage > 20 ? KENYA.red : percentage > 10 ? KENYA.green : KENYA.blue}
                className="transition-all duration-300 cursor-pointer hover:scale-125"
                style={{ 
                  filter: `drop-shadow(0 2px 4px ${percentage > 20 ? KENYA.red : KENYA.green}40)`,
                  opacity: hoveredLocation === region.name ? 1 : 0.8
                }}
                onMouseEnter={() => setHoveredLocation(region.name)}
                onMouseLeave={() => setHoveredLocation(null)}
              />
              <text
                x={region.x}
                y={region.y + size + 3}
                textAnchor="middle"
                className="text-[3px] fill-gray-600 font-medium select-none"
              >
                {region.name}
              </text>
            </g>
          )
        })}
      </svg>
      
      {hoveredLocation && (
        <div className="absolute top-2 right-2 bg-white rounded-lg shadow-lg border border-gray-200 p-3 z-10 animate-fade-in">
          <p className="font-semibold text-gray-900">{hoveredLocation}</p>
          <p className="text-sm text-gray-600">
            {locations.find(l => l.name === hoveredLocation)?.percentage}% of your audience
          </p>
        </div>
      )}
    </div>
  )
}

// 📈 Animated Counter Component
function AnimatedCounter({ 
  value, 
  prefix = '', 
  suffix = '',
  duration = 1000 
}: { 
  value: number
  prefix?: string
  suffix?: string
  duration?: number
}) {
  const [displayValue, setDisplayValue] = useState(0)
  
  useEffect(() => {
    let start = 0
    const end = value
    const increment = end / (duration / 16)
    
    const timer = setInterval(() => {
      start += increment
      if (start >= end) {
        setDisplayValue(end)
        clearInterval(timer)
      } else {
        setDisplayValue(Math.floor(start))
      }
    }, 16)
    
    return () => clearInterval(timer)
  }, [value, duration])
  
  return (
    <span className="font-bold">
      {prefix}{displayValue.toLocaleString()}{suffix}
    </span>
  )
}

// 🎯 Growth Tip Card Component
function GrowthTip({ 
  tip, 
  index,
  onApply 
}: { 
  tip: { icon: any; title: string; description: string; action?: string }
  index: number
  onApply?: () => void
}) {
  const [isHovered, setIsHovered] = useState(false)
  
  return (
    <div 
      className={`p-4 rounded-xl border transition-all duration-300 cursor-pointer ${
        isHovered 
          ? 'border-[#bb0000] bg-[#bb0000]/5 shadow-lg scale-[1.02]' 
          : 'border-gray-200 bg-white hover:border-[#bb0000]/50'
      }`}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      onClick={onApply}
      style={{ animationDelay: `${index * 100}ms` }}
    >
      <div className="flex items-start gap-3">
        <div className={`p-2 rounded-lg transition-colors ${
          isHovered ? 'bg-[#bb0000] text-white' : 'bg-[#bb0000]/10 text-[#bb0000]'
        }`}>
          <tip.icon className="h-4 w-4" />
        </div>
        <div className="flex-1">
          <p className="font-medium text-gray-900 text-sm">{tip.title}</p>
          <p className="text-xs text-gray-600 mt-1">{tip.description}</p>
          {tip.action && (
            <button className="mt-2 text-xs font-medium text-[#bb0000] hover:underline flex items-center gap-1">
              {tip.action}
              <ArrowUpRight className="h-3 w-3" />
            </button>
          )}
        </div>
      </div>
    </div>
  )
}

// 🔄 Real-time Update Indicator
function LiveIndicator({ lastUpdated }: { lastUpdated: Date }) {
  const [secondsAgo, setSecondsAgo] = useState(0)
  
  useEffect(() => {
    const update = () => {
      const now = new Date()
      const diff = Math.floor((now.getTime() - lastUpdated.getTime()) / 1000)
      setSecondsAgo(diff)
    }
    
    update()
    const interval = setInterval(update, 1000)
    return () => clearInterval(interval)
  }, [lastUpdated])
  
  return (
    <div className="flex items-center gap-2 text-xs text-gray-500">
      <div className="relative">
        <div className="h-2 w-2 rounded-full bg-green-500" />
        <div className="absolute inset-0 h-2 w-2 rounded-full bg-green-500 animate-ping" />
      </div>
      <span>Live • Updated {secondsAgo}s ago</span>
    </div>
  )
}

// 📊 A/B Testing Suggestions Component
function ABTestingSuggestions({ 
  suggestions, 
  onApplyTest 
}: { 
  suggestions: ABTestSuggestion[]
  onApplyTest: (suggestion: ABTestSuggestion) => void
}) {
  const [expandedId, setExpandedId] = useState<string | null>(null)
  
  if (suggestions.length === 0) {
    return (
      <div className="text-center py-8 text-gray-500">
        <Lightbulb className="h-12 w-12 mx-auto mb-3 opacity-50" />
        <p>Not enough data for A/B test suggestions yet.</p>
        <p className="text-sm mt-1">Keep creating content to unlock personalized tests!</p>
      </div>
    )
  }
  
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h4 className="font-medium text-gray-900 flex items-center gap-2">
          <Sparkles className="h-4 w-4 text-[#bb0000]" />
          Personalized A/B Test Ideas
        </h4>
        <span className="text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded">
          {suggestions.length} suggestions
        </span>
      </div>
      
      {suggestions.map((suggestion) => (
        <div 
          key={suggestion.id}
          className={`border rounded-xl overflow-hidden transition-all ${
            expandedId === suggestion.id 
              ? 'border-[#bb0000] shadow-lg' 
              : 'border-gray-200 hover:border-[#bb0000]/50'
          }`}
        >
          <button
            onClick={() => setExpandedId(expandedId === suggestion.id ? null : suggestion.id)}
            className="w-full p-4 text-left flex items-start gap-3 bg-white hover:bg-gray-50"
          >
            <div className={`p-2 rounded-lg shrink-0 ${
              suggestion.confidence === 'high' ? 'bg-green-100 text-green-700' :
              suggestion.confidence === 'medium' ? 'bg-yellow-100 text-yellow-700' :
              'bg-gray-100 text-gray-700'
            }`}>
              <Lightbulb className="h-4 w-4" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-medium text-gray-900">{suggestion.title}</p>
              <p className="text-sm text-gray-600 mt-1 line-clamp-2">{suggestion.description}</p>
              <div className="flex items-center gap-3 mt-2 text-xs">
                <span className={`px-2 py-0.5 rounded-full ${
                  suggestion.confidence === 'high' ? 'bg-green-100 text-green-700' :
                  suggestion.confidence === 'medium' ? 'bg-yellow-100 text-yellow-700' :
                  'bg-gray-100 text-gray-700'
                }`}>
                  {suggestion.confidence.charAt(0).toUpperCase() + suggestion.confidence.slice(1)} confidence
                </span>
                <span className="text-gray-500">
                  Expected: {suggestion.expectedImpact}
                </span>
              </div>
            </div>
            <ArrowRight className={`h-4 w-4 text-gray-400 transition-transform ${
              expandedId === suggestion.id ? 'rotate-90' : ''
            }`} />
          </button>
          
          {expandedId === suggestion.id && (
            <div className="p-4 bg-gray-50 border-t border-gray-200 space-y-4">
              <div>
                <p className="text-sm font-medium text-gray-700 mb-1">Hypothesis</p>
                <p className="text-sm text-gray-600">{suggestion.hypothesis}</p>
              </div>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="p-3 bg-white rounded-lg border border-gray-200">
                  <p className="text-xs font-medium text-gray-500 mb-1">Variant A</p>
                  <p className="text-sm text-gray-900">{suggestion.variantA}</p>
                </div>
                <div className="p-3 bg-white rounded-lg border border-gray-200">
                  <p className="text-xs font-medium text-gray-500 mb-1">Variant B</p>
                  <p className="text-sm text-gray-900">{suggestion.variantB}</p>
                </div>
              </div>
              
              <div className="flex items-center gap-2 text-sm">
                <BarChart3 className="h-4 w-4 text-[#1DA1F2]" />
                <span className="text-gray-700">Primary metric: <strong>{suggestion.metric}</strong></span>
              </div>
              
              <div>
                <p className="text-sm font-medium text-gray-700 mb-2">How to implement</p>
                <ol className="space-y-2">
                  {suggestion.implementation.map((step, idx) => (
                    <li key={idx} className="flex items-start gap-2 text-sm text-gray-600">
                      <CheckCircle className="h-4 w-4 text-[#007847] shrink-0 mt-0.5" />
                      <span>{step}</span>
                    </li>
                  ))}
                </ol>
              </div>
              
              <button
                onClick={() => onApplyTest(suggestion)}
                className="w-full py-2.5 rounded-lg font-medium text-white transition-all"
                style={{ background: 'linear-gradient(135deg, #bb0000, #007847)' }}
              >
                Start This A/B Test
              </button>
            </div>
          )}
        </div>
      ))}
    </div>
  )
}

// 💰 M-Pesa Analytics Component
function MpesaAnalyticsCard({ creatorId }: { creatorId: string }) {
  const [analytics, setAnalytics] = useState<MpesaAnalytics | null>(null)
  const [loading, setLoading] = useState(true)
  const [newTipNotification, setNewTipNotification] = useState<any | null>(null)
  
  useEffect(() => {
    const fetchAnalytics = async () => {
      try {
        const data = await getMpesaAnalytics(creatorId)
        setAnalytics(data)
      } catch (err) {
        console.error('M-Pesa analytics error:', err)
      } finally {
        setLoading(false)
      }
    }
    
    fetchAnalytics()
  }, [creatorId])
  
  useEffect(() => {
    const unsubscribe = subscribeToNewTips(creatorId, (tip) => {
      setNewTipNotification(tip)
      toast.success(`🎉 New tip: KSh ${tip.amount.toLocaleString()}!`, { duration: 5000 })
      
      setTimeout(() => {
        getMpesaAnalytics(creatorId).then(setAnalytics)
      }, 2000)
    })
    
    return () => unsubscribe()
  }, [creatorId])
  
  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <Loader2 className="h-6 w-6 animate-spin text-[#4CAF50]" />
        <span className="ml-2 text-gray-600">Loading M-Pesa analytics...</span>
      </div>
    )
  }
  
  if (!analytics || analytics.totalTips === 0) {
    return (
      <div className="text-center py-8">
        <Phone className="h-10 w-10 text-gray-400 mx-auto mb-2" />
        <p className="text-gray-600 font-medium">No M-Pesa tips yet</p>
        <p className="text-sm text-gray-500 mt-1">
          Enable M-Pesa tipping to start receiving support from your audience
        </p>
      </div>
    )
  }
  
  return (
    <div className="space-y-4">
      {newTipNotification && (
        <div className="p-4 bg-green-50 border border-green-200 rounded-xl flex items-center justify-between animate-fade-in">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-full bg-green-100">
              <Phone className="h-5 w-5 text-green-600" />
            </div>
            <div>
              <p className="font-medium text-green-900">New tip received! 🎉</p>
              <p className="text-sm text-green-700">
                KSh {newTipNotification.amount.toLocaleString()}
              </p>
            </div>
          </div>
          <button
            onClick={() => setNewTipNotification(null)}
            className="text-green-600 hover:text-green-800"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      )}
      
      <div className="grid grid-cols-2 gap-4">
        <div className="bg-white rounded-xl border border-gray-200 p-4">
          <div className="flex items-center gap-2">
            <Phone className="h-4 w-4 text-[#4CAF50]" />
            <span className="text-sm text-gray-500">Total Tips</span>
          </div>
          <p className="text-2xl font-bold text-gray-900 mt-1">
            {analytics.totalTips}
          </p>
        </div>
        
        <div className="bg-white rounded-xl border border-gray-200 p-4">
          <div className="flex items-center gap-2">
            <DollarSign className="h-4 w-4 text-[#bb0000]" />
            <span className="text-sm text-gray-500">Total Amount</span>
          </div>
          <p className="text-2xl font-bold text-gray-900 mt-1">
            KSh {analytics.totalAmount.toLocaleString()}
          </p>
        </div>
      </div>
      
      {analytics.topTippers.length > 0 && (
        <div>
          <p className="text-sm font-medium text-gray-700 mb-2">Top Supporters</p>
          <div className="space-y-2">
            {analytics.topTippers.slice(0, 3).map((tipper, index) => (
              <div key={index} className="flex items-center justify-between p-2 rounded-lg bg-gray-50">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold text-gray-400 w-4">#{index + 1}</span>
                  <span className="text-sm text-gray-900">@{tipper.username}</span>
                </div>
                <span className="text-sm font-bold text-[#4CAF50]">
                  KSh {tipper.total.toLocaleString()}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

// ===================================================
// MAIN AUDIENCE INSIGHTS COMPONENT
// ===================================================
export function AudienceInsights({ userId }: AudienceInsightsProps) {
  const { user } = useAuth()
  const supabase = useMemo(() => createClient(), [])
  
  const [loading, setLoading] = useState(true)
  const [audience, setAudience] = useState<AudienceInsight[]>([])
  const [locationData, setLocationData] = useState<LocationData[]>([])
  const [engagementData, setEngagementData] = useState<EngagementMetric[]>([])
  const [followerCount, setFollowerCount] = useState(0)
  const [error, setError] = useState<string | null>(null)
  const [lastUpdated, setLastUpdated] = useState(new Date())
  const [activeTab, setActiveTab] = useState<'demographics' | 'locations' | 'engagement' | 'monetization'>('demographics')
  const [abSuggestions, setAbSuggestions] = useState<ABTestSuggestion[]>([])
  
  // Mock data - replace with actual API calls
  const mockAudienceData: AudienceInsight[] = useMemo(() => [
    { age_range: '18-24', percentage: 35, gender: 'male', location: 'Nairobi' },
    { age_range: '25-34', percentage: 42, gender: 'female', location: 'Mombasa' },
    { age_range: '35-44', percentage: 15, gender: 'other', location: 'Kisumu' },
    { age_range: '45+', percentage: 8, gender: 'male', location: 'Nakuru' },
  ], [])
  
  const mockLocationData: LocationData[] = useMemo(() => [
    { name: 'Nairobi', percentage: 45, followers: 562 },
    { name: 'Mombasa', percentage: 20, followers: 250 },
    { name: 'Kisumu', percentage: 12, followers: 150 },
    { name: 'Nakuru', percentage: 8, followers: 100 },
    { name: 'Other', percentage: 15, followers: 186 },
  ], [])
  
  const mockEngagementData: EngagementMetric[] = useMemo(() => [
    { metric: 'Avg. Watch Time', value: '4:32', change: '+12%', positive: true },
    { metric: 'Likes per Video', value: '156', change: '+8%', positive: true },
    { metric: 'Comments per Video', value: '23', change: '-3%', positive: false },
    { metric: 'Shares per Video', value: '45', change: '+25%', positive: true },
  ], [])
  
  const growthTips = useMemo(() => [
    {
      icon: Clock,
      title: 'Post at Peak Hours',
      description: '7-9 PM EAT when most Kenyans are online after work',
      action: 'Schedule post'
    },
    {
      icon: Globe,
      title: 'Use Local Language',
      description: 'Mix Swahili phrases to connect with Nairobi & Mombasa audiences',
      action: 'Add subtitles'
    },
    {
      icon: Users,
      title: 'Collaborate Locally',
      description: 'Partner with creators from your top 3 cities for cross-promotion',
      action: 'Find creators'
    },
    {
      icon: Zap,
      title: 'Enable M-Pesa Tips',
      description: 'Monetize your most engaged followers with one-tap tipping',
      action: 'Setup M-Pesa'
    },
  ], [])
  
  // Fetch audience data
  useEffect(() => {
    const fetchAudience = async () => {
      try {
        // TODO: Replace with actual API call
        // const response = await fetch(`/api/creator/${userId}/audience`)
        // const data = await response.json()
        
        await new Promise(resolve => setTimeout(resolve, 1200))
        setAudience(mockAudienceData)
        setLocationData(mockLocationData)
        setEngagementData(mockEngagementData)
        setFollowerCount(1248)
        setLastUpdated(new Date())
        
        // Generate A/B test suggestions
        const suggestions = generateABTestSuggestions(
          mockAudienceData,
          mockLocationData,
          mockEngagementData
        )
        setAbSuggestions(suggestions)
      } catch (err) {
        setError('Failed to load audience data')
        console.error('Audience fetch error:', err)
      } finally {
        setLoading(false)
      }
    }
    
    fetchAudience()
    
    // Auto-refresh every 5 minutes
    const interval = setInterval(() => {
      fetchAudience()
    }, 5 * 60 * 1000)
    
    return () => clearInterval(interval)
  }, [userId, mockAudienceData, mockLocationData, mockEngagementData])
  
  // Real-time follower count updates via Supabase Realtime
  useEffect(() => {
    if (!userId) return
    
    const channel = supabase
      .channel(`followers-realtime-${userId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'follows',
          filter: `following_id=eq.${userId}`,
        },
        async (payload) => {
          if (payload.eventType === 'INSERT') {
            setFollowerCount(prev => prev + 1)
            triggerFollowerAnimation('increment')
          } else if (payload.eventType === 'DELETE') {
            setFollowerCount(prev => Math.max(0, prev - 1))
            triggerFollowerAnimation('decrement')
          }
          
          // Re-fetch accurate count (debounced)
          setTimeout(() => {
            fetchFollowerCount()
          }, 1000)
        }
      )
      .subscribe()
    
    return () => {
      supabase.removeChannel(channel)
    }
  }, [userId, supabase])
  
  const fetchFollowerCount = async () => {
    try {
      const { count } = await supabase
        .from('follows')
        .select('*', { count: 'exact', head: true })
        .eq('following_id', userId)
      
      if (count !== null) {
        setFollowerCount(count)
      }
    } catch (err) {
      console.error('Follower count fetch error:', err)
    }
  }
  
  const triggerFollowerAnimation = (type: 'increment' | 'decrement') => {
    const element = document.querySelector('[data-follower-count]')
    if (!element) return
    
    element.classList.add(type === 'increment' ? 'animate-pulse-green' : 'animate-pulse-red')
    setTimeout(() => {
      element.classList.remove('animate-pulse-green', 'animate-pulse-red')
    }, 300)
  }
  
  const handleRefresh = async () => {
    setLoading(true)
    try {
      await new Promise(resolve => setTimeout(resolve, 800))
      setAudience(mockAudienceData)
      setLocationData(mockLocationData)
      setEngagementData(mockEngagementData)
      setLastUpdated(new Date())
      toast.success('Insights refreshed!')
    } finally {
      setLoading(false)
    }
  }
  
  const handleExport = async (format: 'pdf' | 'csv') => {
    try {
      const insightData = {
        followers: followerCount,
        topLocations: locationData,
        demographics: audience,
        engagement: engagementData,
        period: 'Last 30 days',
      }
      
      await exportInsights(insightData, format, user?.email?.split('@')[0] || 'creator')
      toast.success(`Insights exported as ${format.toUpperCase()}!`)
    } catch (error) {
      console.error('Export error:', error)
      toast.error('Failed to export insights. Please try again.')
    }
  }
  
  const handleApplyABTest = useCallback((suggestion: ABTestSuggestion) => {
    console.log('Apply A/B test:', suggestion)
    toast.success(`A/B test "${suggestion.title}" created! Check your Creator Studio dashboard.`)
    // TODO: Navigate to A/B test setup page or open modal
  }, [])
  
  if (loading && audience.length === 0) {
    return (
      <div className="flex items-center justify-center py-16">
        <div className="text-center">
          <div className="relative">
            <Loader2 className="h-10 w-10 animate-spin mx-auto mb-4 text-[#bb0000]" />
            <Sparkles className="absolute -top-1 -right-1 h-4 w-4 text-[#007847] animate-pulse" />
          </div>
          <p className="text-gray-600 font-medium">Analyzing your audience...</p>
          <p className="text-xs text-gray-400 mt-1">This usually takes a few seconds</p>
        </div>
      </div>
    )
  }
  
  if (error) {
    return (
      <div className="text-center py-12">
        <div className="relative inline-block">
          <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-3" />
          <div className="absolute inset-0 h-12 w-12 rounded-full bg-red-500/10 animate-ping" />
        </div>
        <p className="text-red-600 font-medium">{error}</p>
        <button 
          onClick={handleRefresh}
          className="mt-4 text-sm text-[#bb0000] hover:underline flex items-center gap-1 mx-auto"
        >
          <RefreshCw className="h-3 w-3" />
          Try again
        </button>
      </div>
    )
  }
  
  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header with Live Indicator & Actions */}
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
            <Users className="h-5 w-5 text-[#bb0000]" />
            Audience Insights
          </h3>
          <p className="text-sm text-gray-500">Understand your followers and grow your reach</p>
        </div>
        <div className="flex items-center gap-3">
          <LiveIndicator lastUpdated={lastUpdated} />
          <button
            onClick={handleRefresh}
            disabled={loading}
            className="p-2 rounded-lg hover:bg-gray-100 transition-colors disabled:opacity-50"
            title="Refresh data"
          >
            <RefreshCw className={`h-4 w-4 text-gray-500 ${loading ? 'animate-spin' : ''}`} />
          </button>
          <div className="flex items-center gap-2">
            <button
              onClick={() => handleExport('pdf')}
              className="flex items-center gap-2 px-3 py-1.5 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
            >
              <FileText className="h-4 w-4" />
              <span className="hidden sm:inline">PDF</span>
            </button>
            <button
              onClick={() => handleExport('csv')}
              className="flex items-center gap-2 px-3 py-1.5 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
            >
              <Table className="h-4 w-4" />
              <span className="hidden sm:inline">CSV</span>
            </button>
          </div>
        </div>
      </div>
      
      {/* Tab Navigation */}
      <div className="flex gap-1 bg-gray-100 rounded-lg p-1 w-fit flex-wrap">
        {(['demographics', 'locations', 'engagement', 'monetization'] as const).map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`px-4 py-2 rounded-md text-sm font-medium transition-all ${
              activeTab === tab
                ? 'bg-white shadow text-[#bb0000]'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            {tab.charAt(0).toUpperCase() + tab.slice(1)}
          </button>
        ))}
      </div>
      
      {/* Key Metrics - Animated */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white rounded-xl border border-gray-200 p-5 hover:shadow-lg transition-shadow relative overflow-hidden">
          <div className="absolute top-3 right-3 flex items-center gap-1.5">
            <div className="h-2 w-2 rounded-full bg-green-500 animate-live-pulse" />
            <span className="text-[10px] text-gray-400 uppercase tracking-wide">Live</span>
          </div>
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-[#bb0000]/10 relative">
              <Users className="h-5 w-5 text-[#bb0000]" />
              <div className="absolute inset-0 rounded-lg bg-[#bb0000]/5 animate-ping opacity-0" data-follower-count />
            </div>
            <div>
              <p className="text-sm text-gray-500">Total Followers</p>
              <p 
                className="text-2xl font-bold text-gray-900 transition-all duration-300"
                data-follower-count
              >
                <AnimatedCounter value={followerCount} />
              </p>
              <p className="text-xs text-green-600 flex items-center gap-1 mt-1">
                <ArrowUpRight className="h-3 w-3" />
                +12% this month
              </p>
            </div>
          </div>
        </div>
        
        <div className="bg-white rounded-xl border border-gray-200 p-5 hover:shadow-lg transition-shadow">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-[#007847]/10">
              <MapPin className="h-5 w-5 text-[#007847]" />
            </div>
            <div>
              <p className="text-sm text-gray-500">Top Location</p>
              <p className="text-2xl font-bold text-gray-900">Nairobi</p>
              <p className="text-xs text-gray-500 mt-1">45% of your audience</p>
            </div>
          </div>
        </div>
        
        <div className="bg-white rounded-xl border border-gray-200 p-5 hover:shadow-lg transition-shadow">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-[#1DA1F2]/10">
              <Clock className="h-5 w-5 text-[#1DA1F2]" />
            </div>
            <div>
              <p className="text-sm text-gray-500">Avg. Watch Time</p>
              <p className="text-2xl font-bold text-gray-900">4:32</p>
              <p className="text-xs text-gray-500 mt-1">Per video session</p>
            </div>
          </div>
        </div>
        
        <div className="bg-white rounded-xl border border-gray-200 p-5 hover:shadow-lg transition-shadow">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-[#4CAF50]/10">
              <DollarSign className="h-5 w-5 text-[#4CAF50]" />
            </div>
            <div>
              <p className="text-sm text-gray-500">M-Pesa Tips</p>
              <p className="text-2xl font-bold text-gray-900">KSh 12.5K</p>
              <p className="text-xs text-gray-500 mt-1">Last 30 days</p>
            </div>
          </div>
        </div>
      </div>
      
      {/* Tab Content */}
      {activeTab === 'demographics' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="bg-white rounded-xl border border-gray-200 p-5">
            <div className="flex items-center justify-between mb-4">
              <h4 className="font-medium text-gray-900 flex items-center gap-2">
                <PieChart className="h-4 w-4 text-[#bb0000]" />
                Age & Gender Distribution
              </h4>
  // OR wrap in a span with title attribute:
<span className="inline-flex items-center" title="Based on profile data">
  <Info className="h-4 w-4 text-gray-400 cursor-help" />
</span>
            </div>
            
            <div className="space-y-4">
              {audience.map((item, index) => (
                <AnimatedBar
                  key={index}
                  percentage={item.percentage}
                  color={index === 0 ? KENYA.red : 
                         index === 1 ? KENYA.green : 
                         index === 2 ? KENYA.blue : KENYA.gray}
                  delay={index * 150}
                  label={`${item.age_range} • ${item.gender}`}
                  value={`${item.percentage}%`}
                />
              ))}
            </div>
            
            <div className="mt-6 pt-4 border-t border-gray-100">
              <p className="text-xs text-gray-500 flex items-start gap-2">
                <Info className="h-3 w-3 mt-0.5 shrink-0" />
                Demographics are estimated based on profile information and engagement patterns.
              </p>
            </div>
          </div>
          
          <div className="bg-white rounded-xl border border-gray-200 p-5">
            <div className="flex items-center justify-between mb-4">
              <h4 className="font-medium text-gray-900 flex items-center gap-2">
                <Globe className="h-4 w-4 text-[#007847]" />
                Audience Locations in Kenya
              </h4>
              <span className="text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded">
                {locationData.length} regions
              </span>
            </div>
            
            <LocationMap locations={locationData} />
            
            <div className="mt-4 grid grid-cols-2 gap-2">
              {locationData.slice(0, 4).map((location, index) => (
                <div key={location.name} className="flex items-center gap-2 text-sm">
                  <div 
                    className="h-2 w-2 rounded-full"
                    style={{ 
                      background: index === 0 ? KENYA.red : 
                                 index === 1 ? KENYA.green : 
                                 index === 2 ? KENYA.blue : KENYA.gray
                    }}
                  />
                  <span className="text-gray-700">{location.name}</span>
                  <span className="text-gray-500 ml-auto">{location.percentage}%</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
      
      {activeTab === 'locations' && (
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <h4 className="font-medium text-gray-900 mb-6 flex items-center gap-2">
            <MapPin className="h-5 w-5 text-[#007847]" />
            Detailed Location Breakdown
          </h4>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <LocationMap locations={locationData} />
            </div>
            
            <div className="space-y-4">
              {locationData.map((location, index) => (
                <div 
                  key={location.name}
                  className="flex items-center justify-between p-3 rounded-lg hover:bg-gray-50 transition-colors cursor-pointer"
                  style={{ animationDelay: `${index * 100}ms` }}
                >
                  <div className="flex items-center gap-3">
                    <div 
                      className="h-10 w-10 rounded-full flex items-center justify-center text-white font-bold text-sm"
                      style={{ 
                        background: `linear-gradient(135deg, ${index === 0 ? KENYA.red : index === 1 ? KENYA.green : KENYA.blue}, ${KENYA.black})`
                      }}
                    >
                      {location.name.charAt(0)}
                    </div>
                    <div>
                      <p className="font-medium text-gray-900">{location.name}</p>
                      <p className="text-xs text-gray-500">
                        {location.percentage}% of your {followerCount} followers
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-bold text-gray-900">
                      {location.followers.toLocaleString()}
                    </p>
                    <p className="text-xs text-gray-500">followers</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
          
          <div className="mt-6 p-4 bg-[#007847]/5 border border-[#007847]/20 rounded-xl">
            <p className="text-sm text-[#007847] flex items-start gap-2">
              <Target className="h-4 w-4 shrink-0 mt-0.5" />
              <span>
                <strong>Pro Tip:</strong> Your audience is concentrated in urban Kenya. 
                Consider creating content about city life, local events, or collaborations 
                with Nairobi-based creators to boost engagement.
              </span>
            </p>
          </div>
        </div>
      )}
      
      {activeTab === 'engagement' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {engagementData.map((item, index) => (
              <div 
                key={item.metric}
                className="bg-white rounded-xl border border-gray-200 p-5 hover:shadow-lg transition-shadow"
                style={{ animationDelay: `${index * 100}ms` }}
              >
                <p className="text-sm text-gray-500">{item.metric}</p>
                <p className="text-2xl font-bold text-gray-900 mt-1">{item.value}</p>
                <div className={`flex items-center gap-1 mt-2 text-xs font-medium ${
                  item.positive ? 'text-green-600' : 'text-red-600'
                }`}>
                  {item.positive ? (
                    <ArrowUpRight className="h-3 w-3" />
                  ) : (
                    <ArrowDownRight className="h-3 w-3" />
                  )}
                  {item.change} vs last month
                </div>
              </div>
            ))}
          </div>
          
          <div>
            <h4 className="font-medium text-gray-900 mb-4 flex items-center gap-2">
              <Sparkles className="h-4 w-4 text-[#bb0000]" />
              Boost Your Engagement
            </h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {growthTips.map((tip, index) => (
                <GrowthTip 
                  key={index}
                  tip={tip}
                  index={index}
                  onApply={() => console.log('Apply tip:', tip.title)}
                />
              ))}
            </div>
          </div>
          
          <div className="bg-to-br from-[#bb0000]/5 to-[#007847]/5 border border-[#bb0000]/10 rounded-xl p-5">
            <h4 className="font-medium text-gray-900 mb-4">Quick Actions</h4>
            <div className="flex flex-wrap gap-3">
              <button className="flex items-center gap-2 px-4 py-2 rounded-lg bg-white border border-gray-200 hover:border-[#bb0000] transition-colors text-sm font-medium">
                <Heart className="h-4 w-4 text-[#bb0000]" />
                Thank Top Fans
              </button>
              <button className="flex items-center gap-2 px-4 py-2 rounded-lg bg-white border border-gray-200 hover:border-[#bb0000] transition-colors text-sm font-medium">
                <Share2 className="h-4 w-4 text-[#007847]" />
                Share Insights
              </button>
              <button className="flex items-center gap-2 px-4 py-2 rounded-lg bg-white border border-gray-200 hover:border-[#bb0000] transition-colors text-sm font-medium">
                <Target className="h-4 w-4 text-[#1DA1F2]" />
                Target New Audience
              </button>
            </div>
          </div>
        </div>
      )}
      
      {activeTab === 'monetization' && (
        <div className="space-y-6">
          {/* M-Pesa Analytics */}
          <div className="bg-white rounded-xl border border-gray-200 p-6">
            <div className="flex items-center justify-between mb-6">
              <h4 className="font-medium text-gray-900 flex items-center gap-2">
                <Phone className="h-5 w-5 text-[#4CAF50]" />
                M-Pesa Tipping Analytics
              </h4>
              <button className="text-sm text-[#bb0000] hover:underline flex items-center gap-1">
                View Full Report
                <ExternalLink className="h-3 w-3" />
              </button>
            </div>
            
            <MpesaAnalyticsCard creatorId={userId} />
          </div>
          
          {/* A/B Testing Suggestions */}
          <div className="bg-white rounded-xl border border-gray-200 p-6">
            <ABTestingSuggestions 
              suggestions={abSuggestions}
              onApplyTest={handleApplyABTest}
            />
          </div>
        </div>
      )}
      
      {/* Data Notice */}
      <div className="text-center text-xs text-gray-400 pt-4 border-t border-gray-100">
        <p>✨ Insights updated in real-time • Data reflects last 30 days</p>
        <p className="mt-1">🔒 Your audience data is private and never shared with third parties</p>
      </div>
    </div>
  )
}