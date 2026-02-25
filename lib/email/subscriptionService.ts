// lib/email/subscriptionService.ts
import sgMail from '@sendgrid/mail'

// Initialize SendGrid
sgMail.setApiKey(process.env.SENDGRID_API_KEY!)

export interface SubscriptionEmailPayload {
  email: string
  source?: string
  metadata?: Record<string, any>
}

export async function sendSubscriptionThankYouEmail(
  payload: SubscriptionEmailPayload
): Promise<{ success: boolean; error?: string }> {
  const msg = {
    to: payload.email,
    from: {
      email: process.env.EMAIL_FROM || 'noreply@stream254.netlify.app',
      name: process.env.EMAIL_FROM_NAME || 'Stream254',
    },
    subject: 'Welcome to Stream254! 🇰🇪',
    html: generateThankYouEmail(payload),
    text: generateThankYouEmailText(payload),
    // Optional: Add tracking categories
    categories: ['subscription', 'welcome', payload.source || 'unknown'],
  }

  try {
    await sgMail.send(msg)
    console.log('✅ Welcome email sent to:', payload.email)
    return { success: true }
  } catch (error: any) {
    console.error('❌ SendGrid error:', error)
    // Log specific errors for debugging
    if (error.response?.body?.errors) {
      console.error('SendGrid errors:', error.response.body.errors)
    }
    return { success: false, error: error.message }
  }
}

// Helper: Generate HTML email content
function generateThankYouEmail(payload: SubscriptionEmailPayload): string {
  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <title>Welcome to Stream254</title>
      <style>
        body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { text-align: center; padding: 20px 0; border-bottom: 3px solid #bb0000; }
        .logo { font-size: 24px; font-weight: bold; color: #bb0000; }
        .content { padding: 30px 0; }
        .button { display: inline-block; padding: 12px 24px; background: linear-gradient(135deg, #bb0000, #007847); color: white; text-decoration: none; border-radius: 8px; font-weight: 600; margin: 20px 0; }
        .footer { padding-top: 30px; border-top: 1px solid #e5e7eb; font-size: 12px; color: #6b7280; text-align: center; }
      </style>
    </head>
    <body>
      <div class="header">
        <div class="logo">🇰🇪 Stream254</div>
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
        <a href="${process.env.NEXT_PUBLIC_SITE_URL || 'https://stream254.netlify.app'}" class="button">
          Explore Stream254 →
        </a>
        <p><strong>What's next?</strong></p>
        <p>Keep an eye on your inbox! We'll send our first newsletter within the next few days.</p>
        <p>Asante,<br>The Stream254 Team 🇰🇪</p>
      </div>
      <div class="footer">
        <p>
          You're receiving this because you subscribed to Stream254 newsletters.<br>
          <a href="${process.env.NEXT_PUBLIC_SITE_URL || 'https://stream254.netlify.app'}/unsubscribe?email=${encodeURIComponent(payload.email)}">Unsubscribe anytime</a>
        </p>
        <p>Stream254 • Nairobi, Kenya<br>© ${new Date().getFullYear()} Stream254. All rights reserved.</p>
      </div>
    </body>
    </html>
  `
}

// Helper: Generate plain text version (fallback)
function generateThankYouEmailText(payload: SubscriptionEmailPayload): string {
  return `
Asante sana! 🙏

Thank you for subscribing to Stream254, Kenya's premier video streaming platform.

You'll now receive:
✨ Updates on new creators and content
🎬 Exclusive behind-the-scenes content
🇰🇪 Local events and creator spotlights
💡 Tips for growing your audience

Explore Stream254: ${process.env.NEXT_PUBLIC_SITE_URL || 'https://stream254.netlify.app'}

What's next?
Keep an eye on your inbox! We'll send our first newsletter within the next few days.

Asante,
The Stream254 Team 🇰🇪

---
Unsubscribe: ${process.env.NEXT_PUBLIC_SITE_URL || 'https://stream254.netlify.app'}/unsubscribe?email=${encodeURIComponent(payload.email)}
Stream254 • Nairobi, Kenya
© ${new Date().getFullYear()} Stream254. All rights reserved.
  `.trim()
}
