// app/settings/actions.ts
'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import type { NotificationPreferences } from '@/lib/types/settings'

export interface ActionResult {
  success?: boolean
  error?: string
  [key: string]: any
}

// ---------------------------------------------------
// Update Profile Settings
// ---------------------------------------------------
export async function updateProfile(formData: FormData): Promise<ActionResult> {
  const supabase = await createClient()
  
  // ✅ FIX: Correct destructuring for getUser()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Not authenticated' }

  const username = formData.get('username') as string
  const full_name = formData.get('full_name') as string
  const bio = formData.get('bio') as string
  const twitter = formData.get('twitter') as string
  const instagram = formData.get('instagram') as string
  const website = formData.get('website') as string

  // Validation
  if (username && !/^[a-zA-Z0-9_]{3,20}$/.test(username)) {
    return { error: 'Username must be 3-20 characters, letters/numbers/underscores only' }
  }

  const { error } = await supabase
    .from('profiles')
    .update({
      username: username || undefined,
      full_name: full_name || null,
      bio: bio || null,
      twitter: twitter || null,
      instagram: instagram || null,
      website: website || null,
      updated_at: new Date().toISOString()
    })
    .eq('id', user.id)

  if (error) return { error: error.message }

  revalidatePath('/settings')
  revalidatePath(`/profile/${user.id}`)
  
  return { success: true }
}

// ---------------------------------------------------
// Update Account Settings
// ---------------------------------------------------
export async function updateAccount(formData: FormData): Promise<ActionResult> {
  const supabase = await createClient()
  
  // ✅ FIX: Correct destructuring for getUser()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Not authenticated' }

  const email = formData.get('email') as string
  const phone_number = formData.get('phone_number') as string

  // Validate Kenyan phone format
  if (phone_number && !/^254\d{9}$/.test(phone_number.replace(/\D/g, ''))) {
    return { error: 'Please enter a valid Kenyan phone number (2547XXXXXXXX)' }
  }

  const { error } = await supabase
    .from('profiles')
    .update({
      email: email || undefined,
      phone_number: phone_number || null,
      updated_at: new Date().toISOString()
    })
    .eq('id', user.id)

  if (error) return { error: error.message }

  // If email changed, send confirmation
  if (email && email !== user.email) {
    await supabase.auth.updateUser({ email })
  }

  revalidatePath('/settings')
  return { success: true }
}

// ---------------------------------------------------
// Update Privacy Settings
// ---------------------------------------------------
export async function updatePrivacy(settings: {
  is_private: boolean
  show_email: boolean
  show_phone: boolean
  allow_messages: boolean
  default_video_visibility: 'public' | 'private' | 'unlisted'
}): Promise<ActionResult> {
  const supabase = await createClient()
  
  // ✅ FIX: Correct destructuring for getUser()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Not authenticated' }

  const { error } = await supabase
    .from('profiles')
    .update({
      is_private: settings.is_private,
      show_email: settings.show_email,
      show_phone: settings.show_phone,
      allow_messages: settings.allow_messages,
      default_video_visibility: settings.default_video_visibility,
      updated_at: new Date().toISOString()
    })
    .eq('id', user.id)

  if (error) return { error: error.message }

  revalidatePath('/settings')
  revalidatePath(`/profile/${user.id}`)
  return { success: true }
}

// ---------------------------------------------------
// Update Notification Preferences
// ---------------------------------------------------
export async function updateNotifications(settings: NotificationPreferences): Promise<ActionResult> {
  const supabase = await createClient()
  
  // ✅ FIX: Correct destructuring for getUser()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Not authenticated' }

  const { error } = await supabase
    .from('notification_preferences')
    .upsert({
      user_id: user.id,
      ...settings,
      updated_at: new Date().toISOString()
    })

  if (error) return { error: error.message }

  revalidatePath('/settings')
  return { success: true }
}

// ---------------------------------------------------
// Update M-Pesa Phone
// ---------------------------------------------------
export async function updateMpesaPhone(phone: string): Promise<ActionResult> {
  const supabase = await createClient()
  
  // ✅ FIX: Correct destructuring for getUser()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Not authenticated' }

  // Validate Kenyan format
  const formatted = phone.replace(/\D/g, '')
  if (!/^254\d{9}$/.test(formatted)) {
    return { error: 'Please enter a valid Kenyan phone number' }
  }

  const { error } = await supabase
    .from('profiles')
    .update({
      mpesa_phone: formatted,
      updated_at: new Date().toISOString()
    })
    .eq('id', user.id)

  if (error) return { error: error.message }

  revalidatePath('/settings')
  return { success: true, phone: formatted }
}

// ---------------------------------------------------
// Verify M-Pesa Phone (Mock for demo)
// ---------------------------------------------------
export async function verifyMpesaPhone(phone: string, code: string): Promise<ActionResult> {
  const supabase = await createClient()
  
  // ✅ FIX: Correct destructuring for getUser()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Not authenticated' }

  // TODO: Integrate with Safaricom Daraja API for real verification
  // For now, mock verification
  if (code === '123456') {
    const { error } = await supabase
      .from('profiles')
      .update({ mpesa_verified: true, updated_at: new Date().toISOString() })
      .eq('id', user.id)
    
    if (error) return { error: error.message }
    return { success: true }
  }
  
  return { error: 'Invalid verification code' }
}

// ---------------------------------------------------
// Update Password
// ---------------------------------------------------
export async function updatePassword(currentPassword: string, newPassword: string): Promise<ActionResult> {
  const supabase = await createClient()
  
  // ✅ FIX: Correct destructuring for getUser()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Not authenticated' }

  // Verify current password
  const { error: authError } = await supabase.auth.signInWithPassword({
    email: user.email || '',
    password: currentPassword
  })
  if (authError) return { error: 'Current password is incorrect' }

  // Update password
  const { error } = await supabase.auth.updateUser({ password: newPassword })
  if (error) return { error: error.message }

  return { success: true }
}

// ---------------------------------------------------
// Delete Account
// ---------------------------------------------------
export async function deleteAccount(password: string): Promise<ActionResult> {
  const supabase = await createClient()
  
  // ✅ FIX: Correct destructuring for getUser()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Not authenticated' }

  // Verify password before deletion
  const { error: authError } = await supabase.auth.signInWithPassword({
    email: user.email || '',
    password
  })

  if (authError) return { error: 'Incorrect password' }

  // Soft delete profile
  const { error } = await supabase
    .from('profiles')
    .update({
      deleted_at: new Date().toISOString(),
      is_active: false
    })
    .eq('id', user.id)

  if (error) return { error: error.message }

  // Sign out user
  await supabase.auth.signOut()
  
  redirect('/login?deleted=1')
}