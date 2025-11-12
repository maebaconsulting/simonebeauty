/**
 * Market types for international market segmentation
 * Feature: 018-international-market-segmentation
 */

/**
 * Core Market entity from database
 */
export interface Market {
  id: number;
  name: string;
  code: string; // ISO 3166-1 alpha-2 (FR, BE, CH, ES, DE)
  currency_code: string; // ISO 4217 (EUR, CHF, USD, GBP, CAD, JPY)
  timezone: string; // IANA timezone (Europe/Paris, Europe/Brussels, etc.)
  supported_languages: string[]; // ISO 639-1 codes (fr, en, de, nl, it)
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

/**
 * Market creation payload (excludes auto-generated fields)
 */
export interface CreateMarketInput {
  name: string;
  code: string;
  currency_code: string;
  timezone: string;
  supported_languages: string[];
  is_active?: boolean;
}

/**
 * Market update payload (all fields optional except constraints)
 */
export interface UpdateMarketInput {
  name?: string;
  code?: string;
  currency_code?: string;
  timezone?: string;
  supported_languages?: string[];
  is_active?: boolean;
}

/**
 * Market with additional stats/counts
 */
export interface MarketWithStats extends Market {
  _count: {
    contractors: number;
    services: number;
    active_contractors?: number;
  };
}

/**
 * Paginated market list response
 */
export interface MarketListResponse {
  data: Market[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    pages: number;
  };
}

/**
 * Market detail response (includes stats)
 */
export interface MarketDetailResponse {
  data: MarketWithStats;
}

/**
 * Supported currencies (matching database constraint)
 */
export const SUPPORTED_CURRENCIES = [
  'EUR',
  'CHF',
  'USD',
  'GBP',
  'CAD',
  'JPY',
] as const;

export type SupportedCurrency = typeof SUPPORTED_CURRENCIES[number];

/**
 * Supported timezones (matching database constraint)
 */
export const SUPPORTED_TIMEZONES = [
  'Europe/Paris',
  'Europe/Brussels',
  'Europe/Zurich',
  'Europe/Madrid',
  'Europe/Berlin',
  'Europe/London',
  'Europe/Rome',
  'Europe/Amsterdam',
  'America/New_York',
  'America/Los_Angeles',
  'America/Toronto',
  'America/Montreal',
  'UTC',
] as const;

export type SupportedTimezone = typeof SUPPORTED_TIMEZONES[number];

/**
 * Common language codes (ISO 639-1)
 */
export const SUPPORTED_LANGUAGE_CODES = [
  'fr', // French
  'en', // English
  'de', // German
  'nl', // Dutch
  'it', // Italian
  'es', // Spanish
] as const;

export type SupportedLanguageCode = typeof SUPPORTED_LANGUAGE_CODES[number];

/**
 * Market filter options for list queries
 */
export interface MarketFilterOptions {
  is_active?: boolean;
  search?: string; // Search by name or code
}

/**
 * Market sort options
 */
export type MarketSortField = 'id' | 'name' | 'code' | 'created_at';
export type SortOrder = 'asc' | 'desc';

export interface MarketSortOptions {
  field: MarketSortField;
  order: SortOrder;
}
