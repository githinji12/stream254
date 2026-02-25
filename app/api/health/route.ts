// app/api/health/route.ts
import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET() {
  const supabase = await createClient()
  
  try {
    // ✅ FIX 1: Use 'data' property, not 'health'
    const { data, error } = await supabase
      .from('users')
      .select('count', { count: 'exact', head: true })
    
    // Check database connection
    const databaseStatus = !error && data ? 'healthy' : 'unhealthy'
    
    // Check Redis connection (if configured)
    let redisStatus = 'not_configured'
    if (process.env.REDIS_URL) {
      try {
        const Redis = require('ioredis')
        const redis = new Redis(process.env.REDIS_URL)
        await redis.ping()
        await redis.quit()
        redisStatus = 'healthy'
      } catch {
        redisStatus = 'unhealthy'
      }
    }

    // Check email service configuration
    const emailStatus = process.env.RESEND_API_KEY ? 'configured' : 'not_configured'

    return NextResponse.json({
      status: databaseStatus === 'healthy' ? 'healthy' : 'unhealthy',
      timestamp: new Date().toISOString(),
      services: {
        database: databaseStatus,
        redis: redisStatus,
        email: emailStatus
      }
    })
  } catch (err: unknown) {
    // ✅ FIX 2: Properly type the error
    const errorMessage = err instanceof Error ? err.message : 'Unknown error'
    
    return NextResponse.json(
      { 
        status: 'unhealthy', 
        error: errorMessage,
        timestamp: new Date().toISOString()
      },
      { status: 503 }
    )
  }
}