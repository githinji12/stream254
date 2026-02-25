// lib/constants/routes.ts
export const ROUTES = {
  HOME: '/',
  LOGIN: '/login',
  SIGNUP: '/signup',
  UPLOAD: '/upload',
  SEARCH: '/search',
  TRENDING: '/trending',
  PROFILE: (id: string) => `/profile/${id}`,
  CREATOR_STUDIO: '/creator-studio',
  SETTINGS: '/settings',
  WATCH: (id: string) => `/video/${id}`,
} as const

export type RouteKey = keyof typeof ROUTES