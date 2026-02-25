// lib/i18n/config.ts

export const SUPPORTED_LANGUAGES = {
  en: {
    code: 'en',
    name: 'English',
    flag: '🇬🇧',
    dir: 'ltr'
  },
  sw: {
    code: 'sw',
    name: 'Kiswahili',
    flag: '🇰🇪',
    dir: 'ltr'
  }
} as const

export type LanguageCode = keyof typeof SUPPORTED_LANGUAGES

export const DEFAULT_LANGUAGE: LanguageCode = 'en'

export const LANGUAGE_COOKIE_NAME = 'stream254_language'
export const LANGUAGE_STORAGE_KEY = 'stream254_language'