// lib/security/subscriptionLimiter.ts
import { createClient } from '@/lib/supabase/server'

export interface RateLimitResult {
  allowed: boolean
  remaining: number
  resetTime: number
}

export class SubscriptionRateLimiter {
  /**
   * Check if email subscription request is within rate limits
   * Prevents spam and abuse
   */
  async checkRateLimit(
    email: string,
    maxRequests: number = 3,
    windowMs: number = 60 * 60 * 1000 // 1 hour default
  ): Promise<RateLimitResult> {
    const supabase = await createClient()
    const now = new Date()
    const windowStart = new Date(now.getTime() - windowMs)
    
    // Count recent subscription attempts for this email
    const { count, error } = await supabase
      .from('subscriptions')
      .select('*', { count: 'exact', head: true })
      .eq('email', email.toLowerCase())
      .gte('subscribed_at', windowStart.toISOString())
    
    if (error) {
      console.error('Rate limit check error:', error)
      // Fail open - allow request on error
      return { allowed: true, remaining: maxRequests - 1, resetTime: now.getTime() + windowMs }
    }
    
    const requestCount = count || 0
    const remaining = Math.max(0, maxRequests - requestCount)
    const resetTime = windowStart.getTime() + windowMs
    
    return {
      allowed: requestCount < maxRequests,
      remaining,
      resetTime
    }
  }
}