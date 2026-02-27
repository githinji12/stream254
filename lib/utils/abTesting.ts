// lib/utils/abTesting.ts
type AudienceInsight = {
  age_range: string
  percentage: number
  gender: string
  location: string
}

export type ABTestSuggestion = {
  id: string
  title: string
  description: string
  hypothesis: string
  variantA: string
  variantB: string
  metric: string
  confidence: 'low' | 'medium' | 'high'
  expectedImpact: string
  implementation: string[]
}

export function generateABTestSuggestions(
  audience: AudienceInsight[],
  locations: Array<{ name: string; percentage: number }>,
  engagement: Array<{ metric: string; value: string; change: string }>
): ABTestSuggestion[] {
  const suggestions: ABTestSuggestion[] = []
  
  // 🎯 Suggestion 1: Content Language Based on Location
  const nairobiPercent = locations.find(l => l.name === 'Nairobi')?.percentage || 0
  if (nairobiPercent > 30) {
    suggestions.push({
      id: 'lang-test-1',
      title: 'Swahili vs English Content',
      description: 'Test if Swahili-heavy content performs better with your Nairobi-dominant audience',
      hypothesis: 'Since 45% of your audience is from Nairobi, Swahili phrases may increase engagement',
      variantA: 'English-only captions and descriptions',
      variantB: 'Mixed Swahili-English captions with local slang',
      metric: 'Average watch time',
      confidence: nairobiPercent > 40 ? 'high' : 'medium',
      expectedImpact: '+15-25% engagement from urban Kenyan viewers',
      implementation: [
        'Create 2 similar videos with different language approaches',
        'Publish at same time on different days',
        'Compare watch time and comments after 48 hours',
        'Use Stream254 A/B testing dashboard to track results'
      ]
    })
  }
  
  // 🎯 Suggestion 2: Posting Time Based on Age Demographics
  const youngAudience = audience
    .filter(d => ['18-24', '25-34'].includes(d.age_range))
    .reduce((sum, d) => sum + d.percentage, 0)
  
  if (youngAudience > 60) {
    suggestions.push({
      id: 'timing-test-1',
      title: 'Evening vs Late Night Posting',
      description: 'Test optimal posting time for your young adult audience',
      hypothesis: 'Young Kenyans (18-34) are most active 7-10 PM EAT after work/school',
      variantA: 'Post at 2 PM EAT (afternoon)',
      variantB: 'Post at 8 PM EAT (evening prime time)',
      metric: 'First-hour views and engagement',
      confidence: youngAudience > 70 ? 'high' : 'medium',
      expectedImpact: '+30% initial engagement, better algorithm distribution',
      implementation: [
        'Schedule identical content for 2 PM and 8 PM on different days',
        'Track views, likes, comments in first 60 minutes',
        'Repeat test 3 times for statistical significance',
        'Use winning time for future important uploads'
      ]
    })
  }
  
  // 🎯 Suggestion 3: Content Format Based on Engagement Patterns
  const commentEngagement = engagement.find(e => e.metric === 'Comments per Video')
  if (commentEngagement && parseFloat(commentEngagement.change) > 10) {
    suggestions.push({
      id: 'format-test-1',
      title: 'Question-Based vs Statement Content',
      description: 'Your audience comments more - test if asking questions boosts engagement further',
      hypothesis: 'Direct questions in titles/descriptions may increase comment rate by 40%',
      variantA: 'Statement-style titles: "How I grew my channel"',
      variantB: 'Question-style titles: "What\'s your biggest growth challenge?"',
      metric: 'Comments per video',
      confidence: 'medium',
      expectedImpact: '+40% comments, stronger community connection',
      implementation: [
        'Create 4 videos: 2 with statement titles, 2 with question titles',
        'Keep content quality and topic consistent',
        'Measure comment count and quality after 72 hours',
        'Analyze comment sentiment for deeper insights'
      ]
    })
  }
  
  // 🎯 Suggestion 4: M-Pesa Integration Based on Location
  const urbanPercent = locations
    .filter(l => ['Nairobi', 'Mombasa', 'Kisumu'].includes(l.name))
    .reduce((sum, l) => sum + l.percentage, 0)
  
  if (urbanPercent > 60) {
    suggestions.push({
      id: 'monetization-test-1',
      title: 'M-Pesa Tip Prompt Placement',
      description: 'Test optimal placement of M-Pesa tipping prompts for urban Kenyan audiences',
      hypothesis: 'Urban viewers familiar with M-Pesa will tip more when prompted at video end',
      variantA: 'M-Pesa prompt in video description only',
      variantB: 'M-Pesa prompt as end-screen overlay + description',
      metric: 'Tip conversion rate',
      confidence: urbanPercent > 70 ? 'high' : 'medium',
      expectedImpact: '+200% tip conversions from engaged viewers',
      implementation: [
        'Enable M-Pesa tipping in Creator Studio',
        'Create 2 similar videos with different prompt placements',
        'Track tip conversions via Stream254 analytics',
        'Survey tippers for feedback on prompt experience'
      ]
    })
  }
  
  // 🎯 Suggestion 5: Thumbnail Style Based on Gender Split
  const malePercent = audience
    .filter(d => d.gender === 'male')
    .reduce((sum, d) => sum + d.percentage, 0)
  
  if (malePercent > 55 || malePercent < 45) {
    suggestions.push({
      id: 'thumbnail-test-1',
      title: 'Thumbnail Style A/B Test',
      description: 'Test if thumbnail style preferences differ by your audience\'s gender distribution',
      hypothesis: `Your audience is ${Math.round(malePercent)}% male - test if bold/minimal thumbnails perform better`,
      variantA: 'Bold text overlay thumbnails with high contrast',
      variantB: 'Minimal face-focused thumbnails with natural lighting',
      metric: 'Click-through rate (CTR)',
      confidence: malePercent > 65 || malePercent < 35 ? 'high' : 'low',
      expectedImpact: '+10-20% CTR, more efficient audience acquisition',
      implementation: [
        'Design 2 thumbnail styles for same video topic',
        'Use Stream254 thumbnail A/B testing feature',
        'Run test for 1000+ impressions per variant',
        'Adopt winning style for future uploads'
      ]
    })
  }
  
  return suggestions
}

// Helper to calculate statistical significance
export function calculateSignificance(
  variantA: { views: number; conversions: number },
  variantB: { views: number; conversions: number }
): { significant: boolean; confidence: number } {
  // Simple chi-square approximation for A/B testing
  const totalA = variantA.views
  const totalB = variantB.views
  const convA = variantA.conversions
  const convB = variantB.conversions
  
  if (totalA < 100 || totalB < 100) {
    return { significant: false, confidence: 0 }
  }
  
  const rateA = convA / totalA
  const rateB = convB / totalB
  const pooledRate = (convA + convB) / (totalA + totalB)
  
  const se = Math.sqrt(
    pooledRate * (1 - pooledRate) * (1/totalA + 1/totalB)
  )
  
  if (se === 0) return { significant: false, confidence: 0 }
  
  const zScore = Math.abs(rateA - rateB) / se
  const confidence = 2 * (1 - normalCDF(Math.abs(zScore)))
  
  return {
    significant: confidence < 0.05, // 95% confidence
    confidence: 1 - confidence
  }
}

// Standard normal cumulative distribution function
function normalCDF(x: number): number {
  const t = 1 / (1 + 0.2316419 * Math.abs(x))
  const d = 0.3989423 * Math.exp(-x * x / 2)
  const probability = d * t * (0.3193815 + t * (-0.3565638 + t * (1.781478 + t * (-1.821256 + t * 1.330274))))
  
  return x > 0 ? 1 - probability : probability
}