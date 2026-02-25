// lib/i18n/translations.ts
import type { LanguageCode } from './config'

// Dynamic import for translations
export async function getTranslations(lang: LanguageCode, namespace: string = 'common') {
  try {
    const module = await import(`../../locales/${lang}/${namespace}.json`)
    return module.default
  } catch (error) {
    console.warn(`Failed to load translations for ${lang}/${namespace}:`, error)
    // Fallback to English
    if (lang !== 'en') {
      const module = await import(`../../locales/en/${namespace}.json`)
      return module.default
    }
    return {}
  }
}

// Simple translation function for client-side
export function createTranslator(translations: Record<string, any>) {
  return function t(key: string, params?: Record<string, string | number>): string {
    const keys = key.split('.')
    let value: any = translations
    
    for (const k of keys) {
      if (value && typeof value === 'object' && k in value) {
        value = value[k]
      } else {
        return key // Return key if translation not found
      }
    }
    
    if (typeof value !== 'string') {
      return key
    }
    
    // Replace parameters: {{name}} -> value
    if (params) {
      return value.replace(/\{\{(\w+)\}\}/g, (_, param) => {
        return params[param]?.toString() || `{{${param}}}`
      })
    }
    
    return value
  }
}