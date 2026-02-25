// app/creator-studio/actions.ts
'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'

export interface ActionResult {
  success?: boolean
  error?: string
  [key: string]: any
}

// ---------------------------------------------------
// Fetch Creator Stats
// ---------------------------------------------------
export async function getCreatorStats(userId: string) {
  const supabase = await createClient()
  
  // ✅ FIX: Correct destructuring - use 'data' property
  const { data: videos, error: videosError } = await supabase
    .from('videos')
    .select('views, likes')
    .eq('creator_id', userId)
    .eq('visibility', 'public')
  
  if (videosError) throw videosError
  
  const totalViews = videos?.reduce((sum: number, v: { views: number | null }) => sum + (v.views || 0), 0) || 0
  const totalLikes = videos?.reduce((sum: number, v: { likes: number | null }) => sum + (v.likes || 0), 0) || 0
  const totalVideos = videos?.length || 0
  
  // Get follower count
  const { count: followers, error: followersError } = await supabase
    .from('follows')
    .select('*', { count: 'exact', head: true })
    .eq('following_id', userId)
  
  if (followersError) throw followersError
  
  // ✅ FIX: Correct destructuring - use 'data' property
  const { data: tips, error: tipsError } = await supabase
    .from('tips')
    .select('amount, status')
    .eq('receiver_id', userId)
  
  if (tipsError) throw tipsError
  
  const totalEarnings = tips?.filter((t: { status: string }) => t.status === 'paid')
    .reduce((sum: number, t: { amount: number }) => sum + t.amount, 0) || 0
  const pendingPayout = tips?.filter((t: { status: string }) => t.status === 'pending')
    .reduce((sum: number, t: { amount: number }) => sum + t.amount, 0) || 0
  
  return {
    totalViews,
    totalLikes,
    totalVideos,
    totalFollowers: followers || 0,
    totalEarnings,
    pendingPayout
  }
}

// ---------------------------------------------------
// Fetch Creator Videos
// ---------------------------------------------------
export async function getCreatorVideos(userId: string, page: number = 1, limit: number = 12) {
  const supabase = await createClient()
  const offset = (page - 1) * limit
  
  const { data, error, count } = await supabase
    .from('videos')
    .select('*', { count: 'exact' })
    .eq('creator_id', userId)
    .order('created_at', { ascending: false })
    .range(offset, offset + limit - 1)
  
  if (error) throw error
  
  return {
    videos: data || [],
    total: count || 0,
    page,
    totalPages: Math.ceil((count || 0) / limit)
  }
}

// ---------------------------------------------------
// Update Video
// ---------------------------------------------------
export async function updateVideo(videoId: string, updates: {
  title?: string
  description?: string | null
  visibility?: 'public' | 'private' | 'unlisted'
  thumbnail_url?: string | null
}) {
  const supabase = await createClient()
  
  // ✅ FIX: Correct destructuring for getUser()
  const { data: { user } } = await supabase.auth.getUser()
  
  if (!user) return { error: 'Not authenticated' }
  
  // ✅ FIX: Correct destructuring - use 'data' property
  const { data: video, error: fetchError } = await supabase
    .from('videos')
    .select('creator_id')
    .eq('id', videoId)
    .single()
  
  if (fetchError || !video || video.creator_id !== user.id) {
    return { error: 'Unauthorized' }
  }
  
  const { error } = await supabase
    .from('videos')
    .update({ ...updates, updated_at: new Date().toISOString() })
    .eq('id', videoId)
  
  if (error) return { error: error.message }
  
  revalidatePath('/creator-studio')
  revalidatePath(`/video/${videoId}`)
  
  return { success: true }
}

// ---------------------------------------------------
// Delete Video
// ---------------------------------------------------
export async function deleteVideo(videoId: string) {
  const supabase = await createClient()
  
  // ✅ FIX: Correct destructuring for getUser()
  const { data: { user } } = await supabase.auth.getUser()
  
  if (!user) return { error: 'Not authenticated' }
  
  // ✅ FIX: Correct destructuring - use 'data' property
  const { data: video, error: fetchError } = await supabase
    .from('videos')
    .select('creator_id, thumbnail_url, video_url')
    .eq('id', videoId)
    .single()
  
  if (fetchError || !video || video.creator_id !== user.id) {
    return { error: 'Unauthorized' }
  }
  
  // TODO: Delete files from storage
  // if (video.thumbnail_url) await supabase.storage.from('thumbnails').remove([/* path */])
  // if (video.video_url) await supabase.storage.from('videos').remove([/* path */])
  
  const { error } = await supabase
    .from('videos')
    .delete()
    .eq('id', videoId)
  
  if (error) return { error: error.message }
  
  revalidatePath('/creator-studio')
  
  return { success: true }
}

// ---------------------------------------------------
// Request Payout (M-Pesa)
// ---------------------------------------------------
export async function requestPayout(amount: number, mpesaPhone: string) {
  const supabase = await createClient()
  
  // ✅ FIX: Correct destructuring for getUser()
  const { data: { user } } = await supabase.auth.getUser()
  
  if (!user) return { error: 'Not authenticated' }
  
  // Validate Kenyan phone format
  const formatted = mpesaPhone.replace(/\D/g, '')
  if (!/^254\d{9}$/.test(formatted)) {
    return { error: 'Please enter a valid Kenyan phone number' }
  }
  
  // ✅ FIX: Correct destructuring - use 'data' property
  const { data: tips, error: tipsError } = await supabase
    .from('tips')
    .select('amount, status')
    .eq('receiver_id', user.id)
  
  if (tipsError) throw tipsError
  
  const availableBalance = tips?.filter((t: { status: string }) => t.status === 'paid')
    .reduce((sum: number, t: { amount: number }) => sum + t.amount, 0) || 0
  
  if (amount > availableBalance) {
    return { error: 'Insufficient balance' }
  }
  
  // TODO: Integrate with Safaricom Daraja API for real payout
  // For now, mark as processing
  const { error } = await supabase
    .from('payouts')
    .insert({
      user_id: user.id,
      amount,
      mpesa_phone: formatted,
      status: 'processing',
      requested_at: new Date().toISOString()
    })
  
  if (error) return { error: error.message }
  
  revalidatePath('/creator-studio')
  
  return { success: true, message: 'Payout request submitted. You\'ll receive funds via M-Pesa within 24 hours.' }
}

// ---------------------------------------------------
// Get Earnings History
// ---------------------------------------------------
export async function getEarningsHistory(userId: string, page: number = 1, limit: number = 10) {
  const supabase = await createClient()
  const offset = (page - 1) * limit
  
  const { data, error, count } = await supabase
    .from('tips')
    .select(`
      id,
      amount,
      status,
      created_at,
      sender:profiles!tips_sender_id_fkey (
        username,
        avatar_url
      )
    `, { count: 'exact' })
    .eq('receiver_id', userId)
    .order('created_at', { ascending: false })
    .range(offset, offset + limit - 1)
  
  if (error) throw error
  
  return {
    earnings: data || [],
    total: count || 0,
    page,
    totalPages: Math.ceil((count || 0) / limit)
  }
}