// app/api/test-email/route.ts
import { NextResponse } from 'next/server'
import { Resend } from 'resend'

export async function GET() {
  const resend = new Resend(process.env.RESEND_API_KEY)
  
  try {
    const { data, error } = await resend.emails.send({
      from: `Stream254 <${process.env.EMAIL_FROM || 'onboarding@resend.dev'}>`,
      to: 'briangithinji2022@gmail.com', // Replace with your email
      subject: 'Test Email from Stream254',
      html: '<p>If you receive this, email is working! 🇰🇪</p>'
    })
    
    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }
    
    return NextResponse.json({ 
      success: true, 
      message: 'Test email sent!',
      data 
    })
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}