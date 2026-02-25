// app/api/auth/otp/request/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { OTPService } from '@/lib/auth/otpService'
import { createClient } from '@/lib/supabase/server'
import { headers } from 'next/headers'

const otpService = new OTPService()

export async function POST(request: NextRequest) {
  try {
    const { email, type } = await request.json()
    
    if (!email || !['login', 'email_verification', 'password_reset'].includes(type)) {
      return NextResponse.json(
        { error: 'Invalid request' },
        { status: 400 }
      )
    }

    const headersList = await headers()
    
    // ✅ FIX: Handle null values from headers properly
    const xForwardedFor = headersList.get('x-forwarded-for')
    const xRealIp = headersList.get('x-real-ip')
    const userAgent = headersList.get('user-agent') || ''
    
    // ✅ Convert null to undefined for TypeScript compatibility
    const ipAddress: string | undefined = xForwardedFor 
      ? xForwardedFor.split(',')[0].trim() 
      : xRealIp 
        ? xRealIp.trim() 
        : undefined

    const result = await otpService.requestOTP(
      email,
      type as 'login' | 'email_verification' | 'password_reset',
      ipAddress, // ✅ Now properly typed as string | undefined
      userAgent
    )

    if (!result.success) {
      return NextResponse.json(
        { error: result.error },
        { status: 429 } // Too Many Requests
      )
    }

    return NextResponse.json({ 
      success: true,
      message: 'Verification code sent. Check your email.'
    })
  } catch (error) {
    console.error('OTP request error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}