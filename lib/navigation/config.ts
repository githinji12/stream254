// lib/navigation/config.ts

import { NavConfig } from './types'

/**
 * Centralized navigation configuration
 * Easy to extend for roles, A/B tests, or feature flags
 */
export const NAV_CONFIG: NavConfig = {
  primary: [
    {
      id: 'home',
      label: 'navigation.home',
      href: '/',
      icon: 'home',
    },
    {
      id: 'trending',
      label: 'navigation.trending',
      href: '/trending',
      icon: 'trending',
    },
    {
      id: 'categories',
      label: 'navigation.categories',
      href: '/categories',
      icon: 'grid',
      children: [
        { id: 'music', label: 'categories.music', href: '/categories/music' },
        { id: 'comedy', label: 'categories.comedy', href: '/categories/comedy' },
        { id: 'education', label: 'categories.education', href: '/categories/education' },
        { id: 'news', label: 'categories.news', href: '/categories/news' },
      ],
    },
  ],

  secondary: [
    {
      id: 'upload',
      label: 'navigation.upload',
      href: '/upload',
      icon: 'upload',
      requiresAuth: true,
      requiredRole: 'creator',
      hideOnMobile: true,
    },
    {
      id: 'notifications',
      label: 'navigation.notifications',
      href: '/notifications',
      icon: 'bell',
      requiresAuth: true,
      hideOnMobile: true,
    },
  ],

  mobile: [
    {
      id: 'profile',
      label: 'navigation.profile',
      href: '/profile',
      icon: 'user',
      requiresAuth: true,
      hideOnDesktop: true,
    },
    {
      id: 'creator-studio',
      label: 'navigation.creator_studio',
      href: '/creator-studio',
      icon: 'video',
      requiresAuth: true,
      requiredRole: 'creator',
      premium: true,
    },
  ],

  footer: [
    { id: 'about', label: 'footer.about', href: '/about' },
    { id: 'help', label: 'footer.help', href: '/help' },
    { id: 'terms', label: 'footer.terms', href: '/terms' },
    { id: 'privacy', label: 'footer.privacy', href: '/privacy' },
    { id: 'contact', label: 'footer.contact', href: '/contact' },
  ],
}

/**
 * Get navigation items filtered by user role and auth status
 */
export function getFilteredNavItems(
  config: NavItem[],
  isAuthenticated: boolean,
  userRole?: 'user' | 'creator' | 'admin'
): NavItem[] {
  return config.filter((item) => {
    // Hide items requiring auth from unauthenticated users
    if (item.requiresAuth && !isAuthenticated) return false
    
    // Hide items requiring specific roles
    if (item.requiredRole && userRole !== item.requiredRole && userRole !== 'admin') {
      return false
    }
    
    return true
  })
}

/**
 * Generate href with dynamic params
 */
export function buildNavHref(item: NavItem, params?: Record<string, string>): string {
  if (!params) return item.href
  
  let href = item.href
  Object.entries(params).forEach(([key, value]) => {
    href = href.replace(`:${key}`, encodeURIComponent(value))
  })
  return href
}