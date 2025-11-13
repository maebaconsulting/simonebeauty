/**
 * Types for unique code management (client and contractor codes)
 * Feature: 018-international-market-segmentation
 */

/**
 * Client with unique code
 */
export interface ClientWithCode {
  id: string; // UUID
  client_code: string; // CLI-XXXXXX
  first_name: string | null;
  last_name: string | null;
  phone: string | null;
  role: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
  market_id?: number | null;
  market?: {
    id: number;
    name: string;
    code: string;
    currency_code?: string;
  };
  _count?: {
    bookings: number;
    addresses: number;
  };
}

/**
 * Contractor with unique code
 */
export interface ContractorWithCode {
  id: string; // UUID (links to auth.users)
  contractor_code: string; // CTR-XXXXXX
  business_name: string;
  professional_title: string | null;
  email: string | null;
  phone: string | null;
  market_id: number;
  market?: {
    id: number;
    name: string;
    code: string;
    currency_code?: string;
  };
  is_active: boolean;
  created_at: string;
  updated_at: string;
  _count?: {
    bookings: number;
    services: number;
    upcoming_bookings?: number;
  };
}

/**
 * Paginated client list response
 */
export interface ClientListResponse {
  data: ClientWithCode[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    pages: number;
  };
}

/**
 * Paginated contractor list response
 */
export interface ContractorListResponse {
  data: ContractorWithCode[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    pages: number;
  };
}

/**
 * Single client response
 */
export interface ClientDetailResponse {
  data: ClientWithCode;
}

/**
 * Single contractor response
 */
export interface ContractorDetailResponse {
  data: ContractorWithCode;
}

/**
 * Code format validators
 */
export const CLIENT_CODE_REGEX = /^CLI-\d{6}$/;
export const CONTRACTOR_CODE_REGEX = /^CTR-\d{6}$/;

/**
 * Helper to validate client code format
 */
export function isValidClientCode(code: string): boolean {
  return CLIENT_CODE_REGEX.test(code);
}

/**
 * Helper to validate contractor code format
 */
export function isValidContractorCode(code: string): boolean {
  return CONTRACTOR_CODE_REGEX.test(code);
}
