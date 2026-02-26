// app/api/subscribe/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { sendSubscriptionThankYouEmail } from '@/lib/email/subscriptionService'
import { SubscriptionRateLimiter } from '@/lib/security/subscriptionLimiter'

const rateLimiter = new SubscriptionRateLimiter()

// ✅ Add CORS headers helper
function corsHeaders() {
  return {
    'Access-Control-Allow-Origin': '*', // Or specify your domain: 'https://stream254.netlify.app'
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
  }
}

export async function POST(request: NextRequest) {
  // ✅ Handle preflight OPTIONS request for CORS
  if (request.method === 'OPTIONS') {
    return new NextResponse(null, {
      status: 200,
      headers: corsHeaders(),
    })
  }

  try {
    const { email, source = 'other', metadata = {} } = await request.json()
    
    // Validate input
    if (!email || typeof email !== 'string') {
      return NextResponse.json(
        { error: 'Valid email address is required' },
        { status: 400, headers: corsHeaders() }
      )
    }
    
    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(email)) {
      return NextResponse.json(
        { error: 'Please enter a valid email address' },
        { status: 400, headers: corsHeaders() }
      )
    }
    
    const normalizedEmail = email.toLowerCase().trim()
    
    // Rate limit check
    const rateLimit = await rateLimiter.checkRateLimit(normalizedEmail)
    if (!rateLimit.allowed) {
      const remainingSeconds = Math.ceil((rateLimit.resetTime - Date.now()) / 1000)
      return NextResponse.json(
        { 
          error: 'Too many subscription attempts. Please try again later.',
          retryAfter: remainingSeconds
        },
        { 
          status: 429, 
          headers: { 
            ...corsHeaders(),
            'Retry-After': remainingSeconds.toString()
          } 
        }
      )
    }
    
    const supabase = await createClient()
    
    // Check if already subscribed
    const { data: existing, error: findError } = await supabase
      .from('subscriptions')
      .select('id, confirmed, unsubscribed, metadata')
      .eq('email', normalizedEmail)
      .maybeSingle()
    
    if (findError) {
      console.error('Subscription lookup error:', findError)
      return NextResponse.json(
        { error: 'Failed to process subscription. Please try again.' },
        { status: 500, headers: corsHeaders() }
      )
    }
    
    if (existing) {
      if (existing.unsubscribed) {
        // Re-subscribe: update record
        const { error: updateError } = await supabase
          .from('subscriptions')
          .update({
            unsubscribed: false,
            unsubscribed_at: null,
            source,
            metadata: { 
              ...(existing.metadata || {}), 
              ...metadata, 
              resubscribed_at: new Date().toISOString() 
            },
            updated_at: new Date().toISOString()
          })
          .eq('id', existing.id)
        
        if (updateError) throw updateError
      }
      // If already confirmed, don't send duplicate email
      if (existing.confirmed && !existing.unsubscribed) {
        return NextResponse.json({
          success: true,
          message: 'You are already subscribed to Stream254! 🎉',
          alreadySubscribed: true
        }, { headers: corsHeaders() })
      }
    } else {
      // New subscription
      const { error: insertError } = await supabase
        .from('subscriptions')
        .insert({
          email: normalizedEmail,
          confirmed: true,
          confirmed_at: new Date().toISOString(),
          source,
          metadata: { ...metadata, subscribed_via: 'api' },
          subscribed_at: new Date().toISOString()
        })
      
      if (insertError) {
        if (insertError.code === '23505') {
          return NextResponse.json({
            success: true,
            message: 'You are already subscribed! 🎉',
            alreadySubscribed: true
          }, { headers: corsHeaders() })
        }
        throw insertError
      }
    }
    
    // Send thank you email (async, non-blocking)
    sendSubscriptionThankYouEmail({
      email: normalizedEmail,
      source,
      metadata
    }).catch(err => {
      console.error('Failed to send subscription email:', err)
      // Don't fail the request if email fails
    })
    
    return NextResponse.json({
      success: true,
      message: 'Thank you for subscribing to Stream254! Check your inbox for a welcome email. 🇰🇪✨'
    }, { headers: corsHeaders() })
    
  } catch (error: any) {
    console.error('Subscription API error:', error)
    
    return NextResponse.json(
      { error: 'Failed to process subscription. Please try again.' },
      { status: 500, headers: corsHeaders() }
    )
  }
}

// ✅ Handle OPTIONS preflight requests
export async function OPTIONS() {
  return new NextResponse(null, {
    status: 200,
    headers: corsHeaders(),
  })
}