// lib/navigation/types.ts

export type NavItem = {
  /** Unique identifier for the nav item */
  id: string
  /** Display label (supports i18n keys) */
  label: string
  /** Route path or external URL */
  href: string
  /** Icon component name or SVG path */
  icon?: string
  /** Whether item requires authentication */
  requiresAuth?: boolean
  /** Required user role (for future RBAC) */
  requiredRole?: 'user' | 'creator' | 'admin'
  /** Show premium badge */
  premium?: boolean
  /** External link opens in new tab */
  external?: boolean
  /** Hide on mobile */
  hideOnMobile?: boolean
  /** Hide on desktop */
  hideOnDesktop?: boolean
  /** Child navigation items */
  children?: NavItem[]
}

export type NavConfig = {
  /** Primary navigation items */
  primary: NavItem[]
  /** Secondary/utility items (auth, settings) */
  secondary: NavItem[]
  /** Mobile-only items */
  mobile: NavItem[]
  /** Footer navigation */
  footer: NavItem[]
}

export type UserProfile = {
  id: string
  username: string
  avatarUrl?: string | null
  role: 'user' | 'creator' | 'admin'
  isPremium?: boolean
}

export type SearchSuggestion = {
  id: string
  label: string
  type: 'video' | 'creator' | 'hashtag'
  href: string
}