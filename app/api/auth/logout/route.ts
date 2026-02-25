// app/api/auth/logout/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { OTPService } from '@/lib/auth/otpService'

const otpService = new OTPService()

export async function POST(request: NextRequest) {
  try {
    const token = request.cookies.get('session_token')?.value
    
    if (token) {
      await otpService.revokeSession(token)
    }

    const response = NextResponse.json({ success: true })
    response.cookies.delete('session_token')
    
    return response
  } catch (error) {
    console.error('Logout error:', error)
    return NextResponse.json(
      { error: 'Logout failed' },
      { status: 500 }
    )
  }
}