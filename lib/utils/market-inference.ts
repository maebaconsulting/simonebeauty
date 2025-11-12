/**
 * Market Inference Utilities
 * Feature: 019-market-integration-optimization
 * Phase 1, Task 8: Market inference from address
 *
 * Automatically determines the appropriate market based on address country code
 */

import type { Market } from '@/types/market';

/**
 * Infer market from country code
 *
 * @param countryCode - ISO 3166-1 alpha-2 country code (FR, BE, CH, etc.)
 * @param markets - List of available markets
 * @returns Market object if found, null otherwise
 *
 * @example
 * ```ts
 * const market = inferMarketFromCountry('FR', markets);
 * if (market) {
 *   console.log(`Inferred market: ${market.name}`);
 * }
 * ```
 */
export function inferMarketFromCountry(
  countryCode: string | null | undefined,
  markets: Market[]
): Market | null {
  if (!countryCode) return null;

  // Normalize country code to uppercase
  const normalizedCode = countryCode.toUpperCase().trim();

  // Find market with matching code
  const market = markets.find(
    (m) => m.code.toUpperCase() === normalizedCode && m.is_active
  );

  return market || null;
}

/**
 * Get market ID from country code
 *
 * @param countryCode - ISO 3166-1 alpha-2 country code
 * @param markets - List of available markets
 * @returns Market ID if found, null otherwise
 */
export function getMarketIdFromCountry(
  countryCode: string | null | undefined,
  markets: Market[]
): number | null {
  const market = inferMarketFromCountry(countryCode, markets);
  return market?.id || null;
}

/**
 * Extract country code from address
 *
 * @param address - Address object with country field
 * @returns Country code (ISO 3166-1 alpha-2) or null
 */
export function extractCountryCode(address: {
  country?: string | null;
}): string | null {
  if (!address?.country) return null;

  // Normalize and extract country code
  // Handles formats like "FR", "France", "fr", etc.
  const country = address.country.trim().toUpperCase();

  // If it's already a 2-letter code, return it
  if (country.length === 2) {
    return country;
  }

  // Map common country names to codes (fallback)
  const countryNameToCode: Record<string, string> = {
    FRANCE: 'FR',
    BELGIUM: 'BE',
    BELGIQUE: 'BE',
    SWITZERLAND: 'CH',
    SUISSE: 'CH',
    SCHWEIZ: 'CH',
    SPAIN: 'ES',
    ESPAGNE: 'ES',
    ESPAÑA: 'ES',
    GERMANY: 'DE',
    ALLEMAGNE: 'DE',
    DEUTSCHLAND: 'DE',
    ITALY: 'IT',
    ITALIE: 'IT',
    ITALIA: 'IT',
    LUXEMBOURG: 'LU',
    NETHERLANDS: 'NL',
    'PAYS-BAS': 'NL',
    NEDERLAND: 'NL',
    CANADA: 'CA',
  };

  return countryNameToCode[country] || null;
}

/**
 * Infer market from full address object
 *
 * Convenience function that combines extraction and inference
 *
 * @param address - Address object
 * @param markets - List of available markets
 * @returns Market object if found, null otherwise
 */
export function inferMarketFromAddress(
  address: { country?: string | null } | null | undefined,
  markets: Market[]
): Market | null {
  if (!address) return null;

  const countryCode = extractCountryCode(address);
  return inferMarketFromCountry(countryCode, markets);
}

/**
 * Get default market currency from country code
 *
 * @param countryCode - ISO 3166-1 alpha-2 country code
 * @returns Currency code or null
 */
export function getDefaultCurrencyForCountry(
  countryCode: string | null | undefined
): string | null {
  if (!countryCode) return null;

  const code = countryCode.toUpperCase().trim();

  const currencyMap: Record<string, string> = {
    FR: 'EUR',
    BE: 'EUR',
    LU: 'EUR',
    ES: 'EUR',
    IT: 'EUR',
    DE: 'EUR',
    NL: 'EUR',
    CH: 'CHF',
    CA: 'CAD',
    US: 'USD',
    GB: 'GBP',
    UK: 'GBP',
  };

  return currencyMap[code] || null;
}

/**
 * Format market for display
 *
 * @param market - Market object
 * @returns Formatted string for display
 */
export function formatMarketDisplay(market: Market | null): string {
  if (!market) return 'Aucun marché détecté';

  return `${market.code} - ${market.name} (${market.currency_code})`;
}
