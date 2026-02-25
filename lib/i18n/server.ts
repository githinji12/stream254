// lib/i18n/server.ts
import { cookies } from 'next/headers'
import { LanguageCode, DEFAULT_LANGUAGE } from './config'
import { getTranslations, createTranslator } from './translations'

export async function getServerTranslations(namespace: string = 'common') {
  // Get language from cookie
  const cookieStore = await cookies()
  const lang = (cookieStore.get('stream254_language')?.value || DEFAULT_LANGUAGE) as LanguageCode
  
  // Load translations
  const translations = await getTranslations(lang, namespace)
  
  // Create translator function
  const t = createTranslator(translations)
  
  return { t, language: lang }
}