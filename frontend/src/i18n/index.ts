import { useState, useCallback } from 'react'
import type { SupportedLocale } from '../types/portal.types.js'
import { TRANSLATIONS } from './translations.js'

export function useI18n(initialLocale: SupportedLocale = 'pt-BR') {
  const [locale, setLocale] = useState<SupportedLocale>(() => {
    if (typeof window !== 'undefined') {
      const stored = localStorage.getItem('biga_locale') as SupportedLocale
      if (stored && ['pt-BR', 'en-US', 'es-ES', 'de-DE'].includes(stored)) {
        return stored
      }
    }
    return initialLocale
  })

  const changeLocale = useCallback((nextLocale: SupportedLocale) => {
    setLocale(nextLocale)
    if (typeof window !== 'undefined') {
      localStorage.setItem('biga_locale', nextLocale)
    }
  }, [])

  const t = useCallback(
    (key: string, fallback?: string): string => {
      const dict = TRANSLATIONS[locale] ?? TRANSLATIONS['pt-BR']
      return dict[key] ?? fallback ?? key
    },
    [locale],
  )

  return { locale, changeLocale, t }
}

