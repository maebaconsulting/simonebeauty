import { useState, useEffect } from 'react'
import { type Locale, defaultLocale } from '@/i18n/config'

/**
 * Hook to get current locale from cookie
 * Falls back to default locale if cookie is not set
 */
export function useLocale(): Locale {
  const [locale, setLocale] = useState<Locale>(defaultLocale)

  useEffect(() => {
    // Read locale from cookie
    const cookies = document.cookie.split(';')
    const localeCookie = cookies.find(c => c.trim().startsWith('NEXT_LOCALE='))

    if (localeCookie) {
      const cookieValue = localeCookie.split('=')[1] as Locale
      setLocale(cookieValue)
    }
  }, [])

  return locale
}
