/**
 * i18n Configuration
 * Defines supported locales and default locale for the platform
 */

export const locales = ['fr', 'en', 'es', 'de', 'nl', 'it'] as const
export type Locale = (typeof locales)[number]

export const defaultLocale: Locale = 'fr'

export const localeNames: Record<Locale, string> = {
  fr: 'Français',
  en: 'English',
  es: 'Español',
  de: 'Deutsch',
  nl: 'Nederlands',
  it: 'Italiano'
}

export const localeFlags: Record<Locale, string> = {
  fr: '🇫🇷',
  en: '🇬🇧',
  es: '🇪🇸',
  de: '🇩🇪',
  nl: '🇳🇱',
  it: '🇮🇹'
}
