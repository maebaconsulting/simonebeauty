/**
 * i18n Request Configuration
 * Configures next-intl for server-side locale detection
 */

import { getRequestConfig } from 'next-intl/server'
import { headers } from 'next/headers'
import { defaultLocale, locales, type Locale } from './config'

export default getRequestConfig(async () => {
  // Detect locale from headers (set by middleware)
  const headersList = headers()
  const localeHeader = headersList.get('x-locale')

  // Fallback to Accept-Language header if x-locale not set
  const acceptLanguage = headersList.get('accept-language')

  let locale: Locale = defaultLocale

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

  return {
    locale,
    messages: (await import(`../messages/${locale}.json`)).default
  }
})
