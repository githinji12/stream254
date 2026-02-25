// components/creator-studio/AudienceInsights.tsx
'use client'

import { useState, useEffect } from 'react'
import { Users, Globe, Calendar, TrendingUp, Loader2, AlertCircle } from 'lucide-react'
import type { AudienceInsight } from '@/lib/types/creator'

interface AudienceInsightsProps {
  userId: string
}

// Mock data - replace with actual API call
const mockAudienceData: AudienceInsight[] = [
  { age_range: '18-24', percentage: 35, gender: 'male', location: 'Nairobi' },
  { age_range: '25-34', percentage: 42, gender: 'female', location: 'Mombasa' },
  { age_range: '35-44', percentage: 15, gender: 'other', location: 'Kisumu' },
  { age_range: '45+', percentage: 8, gender: 'male', location: 'Nakuru' },
]

const locationData = [
  { name: 'Nairobi', percentage: 45 },
  { name: 'Mombasa', percentage: 20 },
  { name: 'Kisumu', percentage: 12 },
  { name: 'Nakuru', percentage: 8 },
  { name: 'Other', percentage: 15 },
]

export function AudienceInsights({ userId }: AudienceInsightsProps) {
  const [loading, setLoading] = useState(true)
  const [audience, setAudience] = useState<AudienceInsight[]>([])
  const [error, setError] = useState<string | null>(null)

  // Fetch audience data (mock for now)
  useEffect(() => {
    const fetchAudience = async () => {
      try {
        // TODO: Replace with actual API call
        // const response = await fetch(`/api/creator/${userId}/audience`)
        // const data = await response.json()
        // setAudience(data)
        
        // Mock delay
        await new Promise(resolve => setTimeout(resolve, 800))
        setAudience(mockAudienceData)
      } catch (err) {
        setError('Failed to load audience data')
        console.error('Audience fetch error:', err)
      } finally {
        setLoading(false)
      }
    }
    
    fetchAudience()
  }, [userId])

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto mb-3 text-[#bb0000]" />
          <p className="text-gray-600">Loading audience insights...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="text-center py-12">
        <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-3" />
        <p className="text-red-600 font-medium">{error}</p>
        <button 
          onClick={() => window.location.reload()}
          className="mt-4 text-sm text-[#bb0000] hover:underline"
        >
          Try again
        </button>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h3 className="text-lg font-semibold text-gray-900">Audience Insights</h3>
        <p className="text-sm text-gray-500">Understand your followers and grow your reach</p>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-[#bb0000]/10">
              <Users className="h-5 w-5 text-[#bb0000]" />
            </div>
            <div>
              <p className="text-sm text-gray-500">Total Followers</p>
              <p className="text-2xl font-bold text-gray-900">1,248</p>
              <p className="text-xs text-green-600 flex items-center gap-1 mt-1">
                <TrendingUp className="h-3 w-3" />
                +12% this month
              </p>
            </div>
          </div>
        </div>
        
        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-[#007847]/10">
              <Globe className="h-5 w-5 text-[#007847]" />
            </div>
            <div>
              <p className="text-sm text-gray-500">Top Location</p>
              <p className="text-2xl font-bold text-gray-900">Nairobi</p>
              <p className="text-xs text-gray-500 mt-1">45% of your audience</p>
            </div>
          </div>
        </div>
        
        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-[#1DA1F2]/10">
              <Calendar className="h-5 w-5 text-[#1DA1F2]" />
            </div>
            <div>
              <p className="text-sm text-gray-500">Avg. Watch Time</p>
              <p className="text-2xl font-bold text-gray-900">4:32</p>
              <p className="text-xs text-gray-500 mt-1">Per video session</p>
            </div>
          </div>
        </div>
      </div>

      {/* Demographics Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Age & Gender Distribution */}
        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <h4 className="font-medium text-gray-900 mb-4">Age & Gender Distribution</h4>
          
          <div className="space-y-4">
            {audience.map((item, index) => (
              <div key={index} className="space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-700">
                    {item.age_range} • {item.gender}
                  </span>
                  <span className="font-medium text-gray-900">{item.percentage}%</span>
                </div>
                <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                  <div 
                    className="h-full rounded-full transition-all duration-500"
                    style={{ 
                      width: `${item.percentage}%`,
                      background: index === 0 ? '#bb0000' : 
                                 index === 1 ? '#007847' : 
                                 index === 2 ? '#1DA1F2' : '#6B7280'
                    }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Top Locations */}
        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <h4 className="font-medium text-gray-900 mb-4">Top Locations in Kenya</h4>
          
          <div className="space-y-3">
            {locationData.map((location, index) => (
              <div key={location.name} className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <span className="text-sm font-medium text-gray-700 w-24">{location.name}</span>
                  <div className="flex-1 h-2 bg-gray-100 rounded-full overflow-hidden">
                    <div 
                      className="h-full rounded-full"
                      style={{ 
                        width: `${location.percentage}%`,
                        background: index === 0 ? '#bb0000' : 
                                   index === 1 ? '#007847' : 
                                   index === 2 ? '#1DA1F2' : '#6B7280'
                      }}
                    />
                  </div>
                </div>
                <span className="text-sm font-medium text-gray-900 w-12 text-right">
                  {location.percentage}%
                </span>
              </div>
            ))}
          </div>
          
          <div className="mt-6 pt-4 border-t border-gray-100">
            <p className="text-sm text-gray-500">
              <Globe className="h-4 w-4 inline mr-1" />
              Your audience is primarily from urban areas in Kenya. Consider creating content that resonates with Nairobi and Mombasa viewers.
            </p>
          </div>
        </div>
      </div>

      {/* Growth Tips */}
      <div className="bg-to-br from-[#bb0000]/5 to-[#007847]/5 border border-[#bb0000]/10 rounded-xl p-5">
        <h4 className="font-medium text-gray-900 mb-3 flex items-center gap-2">
          <TrendingUp className="h-5 w-5 text-[#bb0000]" />
          Growth Tips for Kenyan Creators
        </h4>
        <ul className="space-y-2 text-sm text-gray-700">
          <li className="flex items-start gap-2">
            <span className="text-[#bb0000] font-bold">1.</span>
            <span>Post during peak hours: 7-9 PM EAT when most Kenyans are online</span>
          </li>
          <li className="flex items-start gap-2">
            <span className="text-[#bb0000] font-bold">2.</span>
            <span>Use Swahili phrases in your content to connect with local audiences</span>
          </li>
          <li className="flex items-start gap-2">
            <span className="text-[#bb0000] font-bold">3.</span>
            <span>Collaborate with creators from Nairobi and Mombasa to expand your reach</span>
          </li>
          <li className="flex items-start gap-2">
            <span className="text-[#bb0000] font-bold">4.</span>
            <span>Enable M-Pesa tips to monetize your most engaged followers</span>
          </li>
        </ul>
      </div>

      {/* Data Notice */}
      <div className="text-center text-xs text-gray-400 pt-4 border-t border-gray-100">
        <p>Insights updated daily • Data reflects last 30 days of activity</p>
        <p className="mt-1">Your audience data is private and never shared with third parties</p>
      </div>
    </div>
  )
}