// lib/security/rateLimiter.ts
import { createClient } from '@/lib/supabase/server'

export interface RateLimitResult {
  allowed: boolean
  remaining: number
  resetTime: number
}

export class RateLimiter {
  private redis: any | null

  constructor() {
    // Try to initialize Redis if available (optional for production)
    this.redis = null
    // Uncomment below if you have Redis configured:
    // if (process.env.REDIS_URL) {
    //   const Redis = require('ioredis')
    //   this.redis = new Redis(process.env.REDIS_URL)
    // }
  }

  /**
   * Check if request is within rate limits
   * Falls back to database if Redis is not available
   */
  async checkRateLimit(
    key: string,
    maxRequests: number,
    windowMs: number
  ): Promise<RateLimitResult> {
    // Use Redis if available, otherwise fallback to database
    if (this.redis) {
      return this.checkRateLimitRedis(key, maxRequests, windowMs)
    } else {
      return this.checkRateLimitDatabase(key, maxRequests, windowMs)
    }
  }

  /**
   * Redis-based rate limiting (preferred for production)
   */
  private async checkRateLimitRedis(
    key: string,
    maxRequests: number,
    windowMs: number
  ): Promise<RateLimitResult> {
    if (!this.redis) {
      return this.checkRateLimitDatabase(key, maxRequests, windowMs)
    }

    const now = Date.now()
    const windowStart = now - windowMs

    try {
      // Use Redis pipeline for atomic operations
      const pipeline = this.redis.pipeline()

      // Remove old entries outside the window
      pipeline.zremrangebyscore(key, 0, windowStart)

      // Add current request timestamp
      pipeline.zadd(key, now, now.toString())

      // Count requests in window
      pipeline.zcard(key)

      // Set expiry on the key
      pipeline.expire(key, Math.ceil(windowMs / 1000) + 1)

      const results = await pipeline.exec()

      if (!results) {
        return { allowed: true, remaining: maxRequests - 1, resetTime: now + windowMs }
      }

      const count = (results[2] as [error: any, result: number])?.[1] || 0
      const remaining = Math.max(0, maxRequests - count)

      // Get oldest timestamp to calculate reset time
      const oldest = await this.redis.zrange(key, 0, 0, 'WITHSCORES')
      const resetTime = oldest?.[1] ? parseInt(oldest[1]) + windowMs : now + windowMs

      return {
        allowed: count <= maxRequests,
        remaining,
        resetTime
      }
    } catch (error) {
      console.error('Redis rate limit error:', error)
      // Fallback to database on Redis error
      return this.checkRateLimitDatabase(key, maxRequests, windowMs)
    }
  }

  /**
   * Database-based rate limiting (fallback)
   */
  private async checkRateLimitDatabase(
    key: string,
    maxRequests: number,
    windowMs: number
  ): Promise<RateLimitResult> {
    const supabase = await createClient()
    const now = new Date()
    const windowStart = new Date(now.getTime() - windowMs)

    try {
      // ✅ FIX: Use 'data' property, not 'existing'
      const { data: existing, error: findError } = await supabase
        .from('rate_limits')
        .select('*')
        .eq('key', key)
        .gte('window_end', now.toISOString())
        .order('window_start', { ascending: false })
        .limit(1)
        .maybeSingle()

      if (findError) {
        console.error('Rate limit query error:', findError)
        return { allowed: true, remaining: maxRequests - 1, resetTime: now.getTime() + windowMs }
      }

      if (existing) {
        // Update existing record
        const newCount = existing.count + 1
        const { error: updateError } = await supabase
          .from('rate_limits')
          .update({
            count: newCount,
            window_end: new Date(existing.window_start.getTime() + windowMs).toISOString()
          })
          .eq('id', existing.id)

        if (updateError) {
          console.error('Rate limit update error:', updateError)
          return { allowed: true, remaining: maxRequests - 1, resetTime: now.getTime() + windowMs }
        }

        const resetTime = new Date(existing.window_start).getTime() + windowMs

        return {
          allowed: newCount <= maxRequests,
          remaining: Math.max(0, maxRequests - newCount),
          resetTime
        }
      } else {
        // Create new record
        const { error: insertError } = await supabase
          .from('rate_limits')
          .insert({
            key,
            count: 1,
            window_start: now.toISOString(),
            window_end: new Date(now.getTime() + windowMs).toISOString()
          })

        if (insertError) {
          console.error('Rate limit insert error:', insertError)
          return { allowed: true, remaining: maxRequests - 1, resetTime: now.getTime() + windowMs }
        }

        return {
          allowed: true,
          remaining: maxRequests - 1,
          resetTime: now.getTime() + windowMs
        }
      }
    } catch (error) {
      console.error('Rate limit error:', error)
      // Fail open - allow request on error
      return { allowed: true, remaining: maxRequests - 1, resetTime: now.getTime() + windowMs }
    }
  }

  /**
   * Clean up old rate limit records (call periodically)
   */
  async cleanup(): Promise<void> {
    if (this.redis) {
      // Redis auto-expires keys, no cleanup needed
      return
    }

    const supabase = await createClient()
    await supabase
      .from('rate_limits')
      .delete()
      .lt('window_end', new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString())
  }
}