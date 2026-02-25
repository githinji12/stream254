// lib/auth/otpService.ts
import crypto from 'crypto'
import { createClient } from '@/lib/supabase/server'
import { sendVerificationEmail } from '@/lib/email/service'
import { RateLimiter } from '@/lib/security/rateLimiter'
import { SecurityAudit } from '@/lib/security/audit'

// Configuration constants
export const OTP_CONFIG = {
  LENGTH: 6,
  EXPIRY_MINUTES: 10,
  MAX_REQUESTS_PER_HOUR: 3,
  MAX_VERIFICATION_ATTEMPTS: 5,
  LOCKOUT_DURATION_MINUTES: 30,
} as const

export class OTPService {
  private rateLimiter: RateLimiter
  private audit: SecurityAudit

  constructor() {
    this.rateLimiter = new RateLimiter()
    this.audit = new SecurityAudit()
  }

  /**
   * Generate a cryptographically secure OTP
   */
  static generateOTP(): string {
    const array = new Uint32Array(1)
    crypto.getRandomValues(array)
    return (array[0] % 900000 + 100000).toString() // Ensures 6 digits
  }

  /**
   * Hash OTP for secure storage
   */
  static hashOTP(otp: string): string {
    return crypto
      .createHash('sha256')
      .update(otp + (process.env.OTP_SALT || 'default-salt'))
      .digest('hex')
  }

  /**
   * Request OTP for email verification or login
   */
  async requestOTP(
    email: string,
    type: 'login' | 'email_verification' | 'password_reset',
    ipAddress?: string,
    userAgent?: string
  ): Promise<{ success: boolean; error?: string }> {
    const supabase = await createClient()
    
    // Rate limit check
    const rateLimitKey = `otp_request:${email.toLowerCase()}`
    const rateLimitResult = await this.rateLimiter.checkRateLimit(
      rateLimitKey,
      OTP_CONFIG.MAX_REQUESTS_PER_HOUR,
      60 * 60 * 1000 // 1 hour in ms
    )
    
    if (!rateLimitResult.allowed) {
      await this.audit.log({
        eventType: 'otp_request_rate_limited',
        metadata: { email, type, ipAddress, remaining: rateLimitResult.remaining },
        ipAddress,
        userAgent
      })
      return { success: false, error: 'Too many requests. Please try again later.' }
    }

    try {
      // Generate and hash OTP
      const otp = OTPService.generateOTP()
      const otpHash = OTPService.hashOTP(otp)
      const expiresAt = new Date(Date.now() + OTP_CONFIG.EXPIRY_MINUTES * 60 * 1000)

      // Store OTP request
      const { error: insertError } = await supabase
        .from('otp_requests')
        .insert({
          email: email.toLowerCase(),
          otp_hash: otpHash,
          otp_type: type,
          expires_at: expiresAt.toISOString(),
          ip_address: ipAddress,
          user_agent: userAgent
        })

      if (insertError) throw insertError

      // Send email asynchronously (non-blocking)
      await sendVerificationEmail({
        to: email,
        otp,
        type,
        expiryMinutes: OTP_CONFIG.EXPIRY_MINUTES
      }).catch((error: Error) => {
        console.error('Failed to send OTP email:', error)
      })

      // Log successful request
      await this.audit.log({
        eventType: 'otp_requested',
        metadata: { email, type, ipAddress },
        ipAddress,
        userAgent
      })

      return { success: true }
    } catch (error: any) {
      console.error('OTP request error:', error)
      await this.audit.log({
        eventType: 'otp_request_failed',
        metadata: { email, type, error: error.message, ipAddress },
        ipAddress,
        userAgent
      })
      return { success: false, error: 'Failed to send verification code' }
    }
  }

  /**
   * Verify OTP and create session if valid
   */
  async verifyOTP(
    email: string,
    otp: string,
    ipAddress?: string,
    userAgent?: string
  ): Promise<{ success: boolean; user?: any; session?: any; error?: string }> {
    const supabase = await createClient()
    const emailLower = email.toLowerCase()
    
    // Rate limit verification attempts
    const rateLimitKey = `otp_verify:${ipAddress || 'unknown'}`
    const rateLimitResult = await this.rateLimiter.checkRateLimit(
      rateLimitKey,
      OTP_CONFIG.MAX_VERIFICATION_ATTEMPTS,
      15 * 60 * 1000 // 15 minutes
    )
    
    if (!rateLimitResult.allowed) {
      await this.audit.log({
        eventType: 'otp_verify_rate_limited',
        metadata: { email, ipAddress, remaining: rateLimitResult.remaining },
        ipAddress,
        userAgent
      })
      return { success: false, error: 'Too many attempts. Please try again later.' }
    }

    try {
      const otpHash = OTPService.hashOTP(otp)
      const now = new Date().toISOString()

      // ✅ FIX: Use 'data' property, not 'otpRequest'
      const { data: otpRequest, error: otpError } = await supabase
        .from('otp_requests')
        .select(`
          id,
          user_id,
          email,
          otp_type,
          expires_at,
          used_at,
          users!otp_requests_user_id_fkey (
            id,
            email,
            email_verified,
            locked_until
          )
        `)
        .eq('email', emailLower)
        .eq('otp_hash', otpHash)
        .is('used_at', null)
        .gt('expires_at', now)
        .single()

      if (otpError || !otpRequest) {
        // Log failed attempt
        await supabase.from('otp_attempts').insert({
          otp_request_id: null,
          ip_address: ipAddress,
          success: false,
          failure_reason: 'invalid_or_expired_otp'
        })
        
        await this.audit.log({
          eventType: 'otp_verification_failed',
          metadata: { email, ipAddress, reason: 'invalid_or_expired' },
          ipAddress,
          userAgent
        })
        
        return { success: false, error: 'Invalid or expired verification code' }
      }

      // Check if user is locked
      // Fix: Handle Supabase foreign key type inference - users is typed as array but .single() returns single object
      const user = (Array.isArray(otpRequest.users) ? otpRequest.users[0] : otpRequest.users) as { id: any; email: any; email_verified: any; locked_until: any; } | undefined
      if (user?.locked_until && new Date(user.locked_until) > new Date()) {
        return { success: false, error: 'Account temporarily locked. Please try again later.' }
      }

      // Mark OTP as used
      const { error: updateError } = await supabase
        .from('otp_requests')
        .update({ used_at: new Date().toISOString() })
        .eq('id', otpRequest.id)

      if (updateError) throw updateError

      // Log successful verification
      await supabase.from('otp_attempts').insert({
        otp_request_id: otpRequest.id,
        ip_address: ipAddress,
        success: true
      })

      await this.audit.log({
        eventType: 'otp_verified',
        userId: otpRequest.user_id,
        metadata: { email, type: otpRequest.otp_type, ipAddress },
        ipAddress,
        userAgent
      })

      // If this was email verification, mark email as verified
      if (otpRequest.otp_type === 'email_verification' && otpRequest.user_id) {
        await supabase
          .from('users')
          .update({ email_verified: true, updated_at: new Date().toISOString() })
          .eq('id', otpRequest.user_id)
      }

      // Create session
      const session = await this.createSession(
        otpRequest.user_id || emailLower,
        ipAddress,
        userAgent
      )

      // Update user's last login
      if (otpRequest.user_id) {
        await supabase
          .from('users')
          .update({
            last_login_at: new Date().toISOString(),
            failed_login_attempts: 0
          })
          .eq('id', otpRequest.user_id)
      }

      return {
        success: true,
        user: user,
        session
      }
    } catch (error: any) {
      console.error('OTP verification error:', error)
      await this.audit.log({
        eventType: 'otp_verification_error',
        metadata: { email, error: error.message, ipAddress },
        ipAddress,
        userAgent
      })
      return { success: false, error: 'Verification failed. Please try again.' }
    }
  }

  /**
   * Create a secure session
   */
  async createSession(
    userId: string,
    ipAddress?: string,
    userAgent?: string
  ): Promise<{ token: string; expiresAt: Date }> {
    const supabase = await createClient()
    
    // Generate secure session token
    const token = crypto.randomBytes(32).toString('hex')
    const tokenHash = crypto
      .createHash('sha256')
      .update(token + (process.env.SESSION_SALT || 'default-salt'))
      .digest('hex')
    
    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) // 7 days

    // Store session
    const { error } = await supabase
      .from('sessions')
      .insert({
        user_id: userId,
        token_hash: tokenHash,
        expires_at: expiresAt.toISOString(),
        ip_address: ipAddress,
        user_agent: userAgent
      })

    if (error) throw error

    await this.audit.log({
      eventType: 'session_created',
      userId: typeof userId === 'string' ? userId : undefined,
      metadata: { ipAddress, userAgent },
      ipAddress,
      userAgent
    })

    return {
      token,
      expiresAt
    }
  }

  /**
   * Validate session token
   */
  async validateSession(token: string): Promise<{ valid: boolean; user?: any; session?: any }> {
    const supabase = await createClient()
    
    const tokenHash = crypto
      .createHash('sha256')
      .update(token + (process.env.SESSION_SALT || 'default-salt'))
      .digest('hex')

    // ✅ FIX: Use 'data' property, not 'session'
    const { data: session, error } = await supabase
      .from('sessions')
      .select(`
        id,
        user_id,
        expires_at,
        revoked,
        users!sessions_user_id_fkey (
          id,
          email,
          email_verified,
          locked_until
        )
      `)
      .eq('token_hash', tokenHash)
      .eq('revoked', false)
      .gt('expires_at', new Date().toISOString())
      .single()

    if (error || !session) {
      return { valid: false }
    }

    // Check if user is locked
    // Fix: Handle Supabase foreign key type inference - users is typed as array but .single() returns single object
    const sessionUser = (Array.isArray(session.users) ? session.users[0] : session.users) as { id: any; email: any; email_verified: any; locked_until: any; } | undefined
    if (sessionUser?.locked_until && new Date(sessionUser.locked_until) > new Date()) {
      return { valid: false }
    }

    // Update last activity
    await supabase
      .from('sessions')
      .update({ last_activity_at: new Date().toISOString() })
      .eq('id', session.id)

    return {
      valid: true,
      user: sessionUser,
      session
    }
  }

  /**
   * Revoke session (logout)
   */
  async revokeSession(token: string): Promise<boolean> {
    const supabase = await createClient()
    
    const tokenHash = crypto
      .createHash('sha256')
      .update(token + (process.env.SESSION_SALT || 'default-salt'))
      .digest('hex')

    const { error } = await supabase
      .from('sessions')
      .update({
        revoked: true,
        revoked_at: new Date().toISOString()
      })
      .eq('token_hash', tokenHash)

    return !error
  }

  /**
   * Lock user account after too many failed attempts
   */
  async lockUser(userId: string, durationMinutes: number = OTP_CONFIG.LOCKOUT_DURATION_MINUTES): Promise<void> {
    const supabase = await createClient()
    const lockedUntil = new Date(Date.now() + durationMinutes * 60 * 1000)
    
    await supabase
      .from('users')
      .update({
        locked_until: lockedUntil.toISOString(),
        failed_login_attempts: 0
      })
      .eq('id', userId)

    await this.audit.log({
      eventType: 'user_locked',
      userId,
      metadata: { durationMinutes, lockedUntil: lockedUntil.toISOString() }
    })
  }
}