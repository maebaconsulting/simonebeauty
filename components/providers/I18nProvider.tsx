'use client'

import { ReactNode } from 'react'
import { NextIntlClientProvider } from 'next-intl'
import { useLocale } from '@/hooks/useLocale'

interface I18nProviderProps {
  children: ReactNode
}

/**
 * Client-side i18n Provider
 *
 * Loads messages dynamically based on the current locale from cookie.
 * This approach avoids the headers() issue in root layout.
 */
export function I18nProvider({ children }: I18nProviderProps) {
  const locale = useLocale()

  // Dynamically import messages for the current locale
  // This is a client-side operation so it's safe
  const messages = require(`@/messages/${locale}.json`)

  return (
    <NextIntlClientProvider locale={locale} messages={messages}>
      {children}
    </NextIntlClientProvider>
  )
}
