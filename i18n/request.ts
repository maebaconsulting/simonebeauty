/**
 * i18n Request Configuration
 * Configures next-intl for server-side locale detection
 */

import { getRequestConfig } from 'next-intl/server'
import { headers } from 'next/headers'
import { defaultLocale, locales, type Locale } from './config'

export default getRequestConfig(async () => {
  let locale: Locale = defaultLocale

  try {
    // Detect locale from headers (set by middleware)
    // This will fail during build-time, which is expected
    const headersList = await headers()
    const localeHeader = headersList.get('x-locale')

    // Fallback to Accept-Language header if x-locale not set
    const acceptLanguage = headersList.get('accept-language')

    if (localeHeader && locales.includes(localeHeader as Locale)) {
      locale = localeHeader as Locale
    } else if (acceptLanguage) {
      // Parse Accept-Language header (e.g., "fr-FR,fr;q=0.9,en;q=0.8")
      const preferredLocale = acceptLanguage
        .split(',')[0]
        ?.split('-')[0]
        ?.toLowerCase()

      if (preferredLocale && locales.includes(preferredLocale as Locale)) {
        locale = preferredLocale as Locale
      }
    }
  } catch (error) {
    // During build time, headers() will fail - use default locale
    locale = defaultLocale
  }

  return {
    locale,
    messages: (await import(`../messages/${locale}.json`)).default
  }
})
