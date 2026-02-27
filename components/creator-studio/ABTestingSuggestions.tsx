// components/creator-studio/ABTestingSuggestions.tsx
'use client'

import { useState } from 'react'
import { Lightbulb, CheckCircle, BarChart3, ArrowRight, Sparkles } from 'lucide-react'
import type { ABTestSuggestion } from '@/lib/utils/abTesting'

interface ABTestingSuggestionsProps {
  suggestions: ABTestSuggestion[]
  onApplyTest: (suggestion: ABTestSuggestion) => void
}

export function ABTestingSuggestions({ 
  suggestions, 
  onApplyTest 
}: ABTestingSuggestionsProps) {
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
          {/* Header */}
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
          
          {/* Expanded Details */}
          {expandedId === suggestion.id && (
            <div className="p-4 bg-gray-50 border-t border-gray-200 space-y-4">
              {/* Hypothesis */}
              <div>
                <p className="text-sm font-medium text-gray-700 mb-1">Hypothesis</p>
                <p className="text-sm text-gray-600">{suggestion.hypothesis}</p>
              </div>
              
              {/* Variants */}
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
              
              {/* Metric */}
              <div className="flex items-center gap-2 text-sm">
                <BarChart3 className="h-4 w-4 text-[#1DA1F2]" />
                <span className="text-gray-700">Primary metric: <strong>{suggestion.metric}</strong></span>
              </div>
              
              {/* Implementation Steps */}
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
              
              {/* Action Button */}
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