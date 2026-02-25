// lib/i18n/client.ts
'use client'

import { createContext, useContext, useEffect, useState, ReactNode } from 'react'
import { LanguageCode, DEFAULT_LANGUAGE, LANGUAGE_STORAGE_KEY, SUPPORTED_LANGUAGES } from './config'
import { getTranslations, createTranslator } from './translations'

interface LanguageContextType {
  language: LanguageCode
  setLanguage: (lang: LanguageCode) => void
  t: (key: string, params?: Record<string, string | number>) => string
  translations: Record<string, any>
  isLoading: boolean
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined)

// ✅ Proper function signature with explicit ReactNode return type
export function LanguageProvider({ children }: { children: ReactNode }): ReactNode {
  const [language, setLanguageState] = useState<LanguageCode>(DEFAULT_LANGUAGE)
  const [translations, setTranslations] = useState<Record<string, any>>({})
  const [isLoading, setIsLoading] = useState(true)

  // Load language preference on mount
  useEffect(() => {
    const loadLanguage = async () => {
      // 1. Check URL parameter
      const urlParams = new URLSearchParams(window.location.search)
      const urlLang = urlParams.get('lang') as LanguageCode
      
      // 2. Check localStorage
      const storedLang = localStorage.getItem(LANGUAGE_STORAGE_KEY) as LanguageCode
      
      // 3. Check browser locale
      const browserLang = navigator.language.split('-')[0] as LanguageCode
      
      // Determine language with priority: URL > localStorage > browser > default
      const detectedLang = urlLang || storedLang || (SUPPORTED_LANGUAGES[browserLang] ? browserLang : DEFAULT_LANGUAGE)
      
      setLanguageState(detectedLang)
      
      // Load translations
      await loadTranslations(detectedLang)
      
      // Save to localStorage for future visits
      localStorage.setItem(LANGUAGE_STORAGE_KEY, detectedLang)
    }
    
    loadLanguage()
  }, [])

  // Load translations for a language
  const loadTranslations = async (lang: LanguageCode) => {
    setIsLoading(true)
    try {
      const common = await getTranslations(lang, 'common')
      setTranslations(common)
    } catch (error) {
      console.error('Failed to load translations:', error)
    } finally {
      setIsLoading(false)
    }
  }

  // Set language and persist preference
  const setLanguage = async (lang: LanguageCode) => {
    if (!SUPPORTED_LANGUAGES[lang]) return
    
    setLanguageState(lang)
    localStorage.setItem(LANGUAGE_STORAGE_KEY, lang)
    
    // Update URL without reload
    const url = new URL(window.location.href)
    url.searchParams.set('lang', lang)
    window.history.replaceState({}, '', url.toString())
    
    // Load new translations
    await loadTranslations(lang)
  }

  // Create translation function
  const t = createTranslator(translations)

  // Set document direction and language
  useEffect(() => {
    document.documentElement.lang = language
    document.documentElement.dir = SUPPORTED_LANGUAGES[language].dir
  }, [language])

  // ✅ FIX: Return valid JSX - properly formatted with explicit typing
  return (
    <LanguageContext.Provider
      value={{
        language,
        setLanguage,
        t,
        translations,
        isLoading
      }}
    >
      {children}
    </LanguageContext.Provider>
  )
}

export function useLanguage() {
  const context = useContext(LanguageContext)
  if (context === undefined) {
    throw new Error('useLanguage must be used within a LanguageProvider')
  }
  return context
}