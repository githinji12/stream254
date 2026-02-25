// lib/email/subscriptionService.ts
import { Resend } from 'resend'

// Initialize Resend (or your preferred email service)
const resend = process.env.RESEND_API_KEY ? new Resend(process.env.RESEND_API_KEY) : null

export interface SubscriptionEmailPayload {
  email: string
  source?: string
  metadata?: Record<string, any>
}

/**
 * Send thank you email for new subscription
 */
export async function sendSubscriptionThankYouEmail(
  payload: SubscriptionEmailPayload
): Promise<{ success: boolean; error?: string }> {
  if (!resend) {
    console.warn('Resend not configured - skipping thank you email')
    // In development, log instead of sending
    console.log('📧 [DEV] Thank you email would be sent to:', payload.email)
    return { success: true }
  }

  try {
    const {  data, error } = await resend.emails.send({
      from: `Stream254 <${process.env.EMAIL_FROM || 'noreply@stream254.ke'}>`,
      to: payload.email,
      subject: 'Welcome to Stream254! 🇰🇪',
      html: generateThankYouEmail(payload),
      text: generateThankYouEmailText(payload),
      // Optional: Add tags for analytics
      tags: [
        { name: 'type', value: 'subscription_welcome' },
        { name: 'source', value: payload.source || 'unknown' },
      ],
    })

    if (error) {
      console.error('Failed to send subscription email:', error)
      return { success: false, error: error.message }
    }

    console.log('✅ Thank you email sent to:', payload.email)
    return { success: true }
  } catch (err: any) {
    console.error('Subscription email error:', err)
    return { success: false, error: err.message }
  }
}

/**
 * Generate HTML email content
 */
function generateThankYouEmail(payload: SubscriptionEmailPayload): string {
  const { email, source } = payload
  
  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Welcome to Stream254</title>
      <style>
        body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { text-align: center; padding: 20px 0; border-bottom: 3px solid #bb0000; }
        .logo { font-size: 24px; font-weight: bold; color: #bb0000; }
        .flag { display: inline-block; width: 40px; height: 24px; background: linear-gradient(90deg, #007847 33%, #000 33%, #000 34%, #bb0000 34%); margin-right: 8px; vertical-align: middle; border-radius: 2px; }
        .content { padding: 30px 0; }
        .button { display: inline-block; padding: 12px 24px; background: linear-gradient(135deg, #bb0000, #007847); color: white; text-decoration: none; border-radius: 8px; font-weight: 600; margin: 20px 0; }
        .footer { padding-top: 30px; border-top: 1px solid #e5e7eb; font-size: 12px; color: #6b7280; text-align: center; }
        .unsubscribe { color: #6b7280; text-decoration: none; }
        .unsubscribe:hover { color: #bb0000; }
      </style>
    </head>
    <body>
      <div class="header">
        <div class="logo">
          <span class="flag"></span>
          Stream254
        </div>
      </div>
      
      <div class="content">
        <h2>Asante sana! 🙏</h2>
        <p>Thank you for subscribing to Stream254, Kenya's premier video streaming platform.</p>
        
        <p>You'll now receive:</p>
        <ul>
          <li>✨ Updates on new creators and content</li>
          <li>🎬 Exclusive behind-the-scenes content</li>
          <li>🇰🇪 Local events and creator spotlights</li>
          <li>💡 Tips for growing your audience</li>
        </ul>
        
        <a href="${process.env.NEXT_PUBLIC_SITE_URL}" class="button">
          Explore Stream254 →
        </a>
        
        <p><strong>What's next?</strong></p>
        <p>Keep an eye on your inbox! We'll send our first newsletter within the next few days with exciting updates from the Stream254 community.</p>
        
        <p>Asante,<br>
        The Stream254 Team 🇰🇪</p>
      </div>
      
      <div class="footer">
        <p>
          You're receiving this email because you subscribed to Stream254 newsletters.<br>
          <a href="${process.env.NEXT_PUBLIC_SITE_URL}/unsubscribe?email=${encodeURIComponent(email)}" class="unsubscribe">
            Unsubscribe anytime
          </a>
        </p>
        <p>
          Stream254 • Nairobi, Kenya<br>
          © ${new Date().getFullYear()} Stream254. All rights reserved.
        </p>
      </div>
    </body>
    </html>
  `
}

/**
 * Generate plain text email content (fallback)
 */
function generateThankYouEmailText(payload: SubscriptionEmailPayload): string {
  const { email, source } = payload
  
  return `
Asante sana! 🙏

Thank you for subscribing to Stream254, Kenya's premier video streaming platform.

You'll now receive:
✨ Updates on new creators and content
🎬 Exclusive behind-the-scenes content
🇰🇪 Local events and creator spotlights
💡 Tips for growing your audience

Explore Stream254: ${process.env.NEXT_PUBLIC_SITE_URL}

What's next?
Keep an eye on your inbox! We'll send our first newsletter within the next few days with exciting updates from the Stream254 community.

Asante,
The Stream254 Team 🇰🇪

---
You're receiving this email because you subscribed to Stream254 newsletters.
Unsubscribe anytime: ${process.env.NEXT_PUBLIC_SITE_URL}/unsubscribe?email=${encodeURIComponent(email)}

Stream254 • Nairobi, Kenya
© ${new Date().getFullYear()} Stream254. All rights reserved.
  `.trim()
}