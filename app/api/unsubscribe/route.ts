// app/api/unsubscribe/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function POST(request: NextRequest) {
  try {
    const { email, token } = await request.json()

    if (!token && !email) {
      return NextResponse.json(
        { error: 'Email or unsubscribe token is required' },
        { status: 400 }
      )
    }

    const supabase = await createClient()

    // ✅ Apply filter directly on update()
    const { data, error } = await supabase
      .from('subscriptions')
      .update({
        unsubscribed: true,
        unsubscribed_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .eq(
        token ? 'unsubscribe_token' : 'email',
        token ? token : email!.toLowerCase().trim()
      )
      .select()

    if (error) {
      console.error('Unsubscribe error:', error)
      return NextResponse.json(
        { error: 'Failed to unsubscribe. Please try again.' },
        { status: 500 }
      )
    }

    if (!data || data.length === 0) {
      return NextResponse.json(
        { error: 'Subscription not found or already unsubscribed.' },
        { status: 404 }
      )
    }

    return NextResponse.json({
      success: true,
      message: 'You have been successfully unsubscribed from Stream254 newsletters.',
      unsubscribed: true,
    })
  } catch (error) {
    console.error('Unsubscribe API error:', error)

    return NextResponse.json(
      { error: 'Failed to process unsubscribe request.' },
      { status: 500 }
    )
  }
}

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const token = searchParams.get('token')
    const email = searchParams.get('email')

    if (!token && !email) {
      return NextResponse.json(
        { error: 'Token or email is required' },
        { status: 400 }
      )
    }

    const supabase = await createClient()

    const { data, error } = await supabase
      .from('subscriptions')
      .select('email, unsubscribed, unsubscribed_at, subscribed_at')
      .eq(
        token ? 'unsubscribe_token' : 'email',
        token ? token : email!.toLowerCase().trim()
      )
      .single()

    if (error || !data) {
      return NextResponse.json(
        { error: 'Subscription not found' },
        { status: 404 }
      )
    }

    return NextResponse.json({
      email: data.email,
      unsubscribed: data.unsubscribed,
      unsubscribedAt: data.unsubscribed_at,
      subscribedAt: data.subscribed_at,
    })
  } catch (error) {
    console.error('Unsubscribe status check error:', error)

    return NextResponse.json(
      { error: 'Failed to check subscription status' },
      { status: 500 }
    )
  }
}

export async function OPTIONS() {
  return new NextResponse(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    },
  })
}