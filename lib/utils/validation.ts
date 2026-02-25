// lib/utils/validation.ts

/**
 * Validate UUID format for profile IDs
 */
export const validateProfileId = (id: string): boolean => {
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i
  return uuidRegex.test(id)
}

/**
 * Sanitize user bio to prevent XSS
 */
export const sanitizeBio = (bio: string | null): string => {
  if (!bio) return ''
  return bio
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
    .replace(/<[^>]*>/g, '')
    .trim()
    .substring(0, 500)
}

/**
 * Validate Kenyan phone number format for M-Pesa
 */
export const validateKenyanPhone = (phone: string): boolean => {
  return /^254\d{9}$/.test(phone.replace(/\D/g, ''))
}

/**
 * Format phone number for display (254712345678 → 0712 345 678)
 */
export const formatPhoneDisplay = (phone: string): string => {
  const digits = phone.replace(/\D/g, '')
  if (digits.startsWith('254') && digits.length === 12) {
    const local = digits.slice(3)
    return `0${local.slice(0, 3)} ${local.slice(3, 6)} ${local.slice(6)}`
  }
  return phone
}

/**
 * Format numbers for display (1234 → 1.2K, 1234567 → 1.2M)
 */
export const formatNumber = (num: number): string => {
  if (num >= 1000000) return (num / 1000000).toFixed(1) + 'M'
  if (num >= 1000) return (num / 1000).toFixed(1) + 'K'
  return num.toString()
}

/**
 * Format date for Kenyan locale
 */
export const formatDate = (dateString: string): string => {
  const date = new Date(dateString)
  return date.toLocaleDateString('en-KE', {
    month: 'short',
    day: 'numeric',
    year: 'numeric'
  })
}

/**
 * Validate username format
 */
export const validateUsername = (username: string): { valid: boolean; error?: string } => {
  if (!username || username.length < 3) {
    return { valid: false, error: 'Username must be at least 3 characters' }
  }
  if (username.length > 20) {
    return { valid: false, error: 'Username must be at most 20 characters' }
  }
  if (!/^[a-zA-Z0-9_]+$/.test(username)) {
    return { valid: false, error: 'Username can only contain letters, numbers, and underscores' }
  }
  return { valid: true }
}

/**
 * Validate email format
 */
export const validateEmail = (email: string): boolean => {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)
}