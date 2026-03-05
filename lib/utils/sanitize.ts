// utils/sanitize.ts

/**
 * Sanitize user input for search queries
 * Prevents XSS and injection attacks
 */
export function sanitizeSearchInput(input: string): string {
  return input
    .trim()
    // Remove potentially dangerous characters
    .replace(/[<>{}[\]\\]/g, '')
    // Limit length to prevent abuse
    .slice(0, 100)
}

/**
 * Validate URL safety for navigation
 */
export function isValidNavUrl(url: string): boolean {
  try {
    // Allow relative URLs
    if (url.startsWith('/')) return true
    
    // Allow whitelisted external domains
    const allowedDomains = ['stream254.netlify.app', 'stream254.com']
    const parsed = new URL(url)
    return allowedDomains.includes(parsed.hostname)
  } catch {
    return false
  }
}

/**
 * Escape HTML entities for safe rendering
 */
export function escapeHtml(text: string): string {
  const map: Record<string, string> = {
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#039;',
  }
  return text.replace(/[&<>"']/g, (m) => map[m])
}