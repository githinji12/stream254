// lib/email/service.ts
import { Queue } from 'bullmq'
import { createClient } from '@/lib/supabase/server'
import { Resend } from 'resend'

// Initialize email service
const resend = process.env.RESEND_API_KEY ? new Resend(process.env.RESEND_API_KEY) : null
const emailQueue = process.env.REDIS_URL 
  ? new Queue('email-queue', { connection: { url: process.env.REDIS_URL } })
  : null

export interface EmailPayload {
  to: string
  otp: string
  type: 'login' | 'email_verification' | 'password_reset'
  expiryMinutes: number
}

/**
 * Send verification email (queued for async processing)
 */
export async function sendVerificationEmail(payload: EmailPayload): Promise<void> {
  if (emailQueue) {
    // Queue email for async processing
    await emailQueue.add('send-verification', payload, {
      attempts: 3,
      backoff: {
        type: 'exponential',
        delay: 2000
      },
      removeOnComplete: true,
      removeOnFail: false
    })
  } else {
    // Fallback to synchronous sending (not recommended for production)
    await sendEmailSync(payload)
  }
}

/**
 * Process email from queue (worker function)
 */
export async function processEmailJob(payload: EmailPayload): Promise<void> {
  try {
    await sendEmailSync(payload)
    
    // Log successful send
    const supabase = await createClient()
    await supabase.from('email_logs').insert({
      to: payload.to,
      type: payload.type,
      status: 'sent',
      sent_at: new Date().toISOString()
    })
  } catch (error) {
    console.error('Failed to send email:', error)
    
    // Log failure
    const supabase = await createClient()
    await supabase.from('email_logs').insert({
      to: payload.to,
      type: payload.type,
      status: 'failed',
      error: error instanceof Error ? error.message : 'Unknown error',
      sent_at: new Date().toISOString()
    })
    
    throw error // Will trigger retry
  }
}

/**
 * Synchronous email sending (fallback)
 */
async function sendEmailSync(payload: EmailPayload): Promise<void> {
  if (!resend) {
    console.warn('Resend not configured, skipping email send')
    return
  }

  const subject = {
    login: 'Stream254 - Your Login Code',
    email_verification: 'Stream254 - Verify Your Email',
    password_reset: 'Stream254 - Reset Your Password'
  }[payload.type]

  const html = `
    <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto;">
      <h2 style="color: #bb0000;">Stream254</h2>
      <p>Your verification code is:</p>
      <div style="background: #f3f4f6; padding: 16px; border-radius: 8px; text-align: center; font-size: 24px; font-weight: bold; letter-spacing: 4px; margin: 24px 0;">
        ${payload.otp}
      </div>
      <p>This code will expire in ${payload.expiryMinutes} minutes.</p>
      <p>If you didn't request this code, please ignore this email.</p>
      <hr style="margin: 32px 0; border: none; border-top: 1px solid #e5e7eb;">
      <p style="color: #6b7280; font-size: 14px;">
        Stream254 🇰🇪<br>
        Secure video streaming for Kenya
      </p>
    </div>
  `

  const { error } = await resend.emails.send({
    from: 'Stream254 <noreply@stream254.ke>',
    to: payload.to,
    subject,
    html
  })

  if (error) {
    throw new Error(`Failed to send email: ${JSON.stringify(error)}`)
  }
}