// app/api/test-email/route.ts
import { NextResponse } from 'next/server'
import { sendSubscriptionThankYouEmail } from '@/lib/email/subscriptionService'

export async function GET() {
  const result = await sendSubscriptionThankYouEmail({
    email: 'briangithinji2022@gmail.com', // Replace with your email
    source: 'test'
  })
  
  return NextResponse.json(result)
}