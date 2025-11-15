/**
 * Supabase Queries - Promo Codes
 * Feature: 015-promo-codes-system
 *
 * Type-safe query builders for promo codes
 */

import { createClient } from '@/lib/supabase/client'
import type { PromoCode, PromoCodeUsage } from '@/types/promo-code'
import type { PromoCodeFilters, PaginationParams, PaginatedResponse } from '@/types/promo-filters'
import type { PromoValidationResult, ValidatePromoParams } from '@/types/promo-validation'
import type { PromoCodeFormSubmit } from '@/types/promo-form'

/**
 * Validate a promo code via RPC function
 * Calls the backend validate_promo_code() function
 *
 * Note: RPC function expects amounts in EUROS (DECIMAL), not cents
 * We convert from cents to euros before calling
 */
export async function validatePromoCode(
  params: ValidatePromoParams
): Promise<PromoValidationResult> {
  const supabase = createClient()

  // Convert service_amount from cents to euros for RPC call
  const serviceAmountEuros = params.service_amount / 100

  const { data, error } = await supabase.rpc('validate_promo_code', {
    p_code: params.code.toUpperCase(),
    p_user_id: params.user_id,
    p_service_id: params.service_id,
    p_service_amount: serviceAmountEuros,
  })

  if (error) {
    console.error('Promo validation error:', error)
    return {
      valid: false,
      error_code: 'invalid_code',
      error_message: 'Code promo invalide',
    }
  }

  // RPC returns an array with single result (RETURNS TABLE)
  const result = Array.isArray(data) ? data[0] : data

  if (!result) {
    return {
      valid: false,
      error_code: 'invalid_code',
      error_message: 'Code promo invalide',
    }
  }

  // Map RPC result to our type format
  // RPC returns: is_valid, promo_id, discount_amount (euros), final_amount (euros), error_message
  return {
    valid: result.is_valid,
    error_code: result.is_valid ? undefined : 'invalid_code',
    error_message: result.error_message || undefined,
    promo_code_id: result.promo_id || undefined,
    discount_amount: result.is_valid ? Math.round(result.discount_amount * 100) : undefined, // Convert to cents
    final_amount: result.is_valid ? Math.round(result.final_amount * 100) : undefined, // Convert to cents
  }
}

/**
 * Fetch paginated list of promo codes with filters
 */
export async function fetchPromoCodes(
  filters: PromoCodeFilters = {},
  pagination: PaginationParams = { page: 1, page_size: 20 }
): Promise<PaginatedResponse<PromoCode>> {
  const supabase = createClient()

  let query = supabase.from('promo_codes').select('*', { count: 'exact' })

  // Apply filters
  if (filters.is_active !== undefined) {
    query = query.eq('is_active', filters.is_active)
  }

  if (filters.discount_type) {
    query = query.eq('discount_type', filters.discount_type)
  }

  if (filters.search) {
    query = query.or(`code.ilike.%${filters.search}%,description.ilike.%${filters.search}%`)
  }

  if (filters.created_after) {
    query = query.gte('created_at', filters.created_after)
  }

  if (filters.created_before) {
    query = query.lte('created_at', filters.created_before)
  }

  // Sorting
  const sortBy = pagination.sort_by ?? 'created_at'
  const sortOrder = pagination.sort_order ?? 'desc'
  query = query.order(sortBy, { ascending: sortOrder === 'asc' })

  // Pagination
  const from = (pagination.page - 1) * pagination.page_size
  const to = from + pagination.page_size - 1
  query = query.range(from, to)

  const { data, error, count } = await query

  if (error) {
    console.error('Error fetching promo codes:', error)
    throw new Error('Failed to fetch promo codes')
  }

  const totalPages = count ? Math.ceil(count / pagination.page_size) : 0

  return {
    data: (data as PromoCode[]) || [],
    pagination: {
      page: pagination.page,
      page_size: pagination.page_size,
      total_items: count || 0,
      total_pages: totalPages,
      has_next: pagination.page < totalPages,
      has_previous: pagination.page > 1,
    },
  }
}

/**
 * Fetch a single promo code by ID
 */
export async function fetchPromoCodeById(id: number): Promise<PromoCode | null> {
  const supabase = createClient()

  const { data, error } = await supabase
    .from('promo_codes')
    .select('*')
    .eq('id', id)
    .single()

  if (error) {
    console.error('Error fetching promo code:', error)
    return null
  }

  return data as PromoCode
}

/**
 * Fetch promo code usage history for a specific code
 */
export async function fetchPromoCodeUsage(
  promoCodeId: number
): Promise<PromoCodeUsage[]> {
  const supabase = createClient()

  const { data, error } = await supabase
    .from('promo_code_usage')
    .select('*')
    .eq('promo_code_id', promoCodeId)
    .order('used_at', { ascending: false })

  if (error) {
    console.error('Error fetching promo code usage:', error)
    return []
  }

  return (data as PromoCodeUsage[]) || []
}

/**
 * Check if user has used a specific promo code
 */
export async function hasUserUsedPromo(
  userId: string,
  promoCodeId: number
): Promise<boolean> {
  const supabase = createClient()

  const { data, error } = await supabase
    .from('promo_code_usage')
    .select('id')
    .eq('user_id', userId)
    .eq('promo_code_id', promoCodeId)
    .limit(1)
    .maybeSingle()

  if (error) {
    console.error('Error checking promo usage:', error)
    return false
  }

  return data !== null
}

/**
 * Get total uses for a user across all promos
 */
export async function getUserPromoUsageCount(
  userId: string
): Promise<number> {
  const supabase = createClient()

  const { count, error } = await supabase
    .from('promo_code_usage')
    .select('*', { count: 'exact', head: true })
    .eq('user_id', userId)

  if (error) {
    console.error('Error getting user promo count:', error)
    return 0
  }

  return count || 0
}

/**
 * CRUD Operations (Admin)
 */

/**
 * Create a new promo code
 */
export async function createPromoCode(
  data: PromoCodeFormSubmit
): Promise<PromoCode> {
  const supabase = createClient()

  const { data: newPromo, error } = await supabase
    .from('promo_codes')
    .insert([data])
    .select()
    .single()

  if (error) {
    console.error('Error creating promo code:', error)
    throw new Error(error.message || 'Failed to create promo code')
  }

  return newPromo as PromoCode
}

/**
 * Update an existing promo code
 */
export async function updatePromoCode(
  id: number,
  data: Partial<PromoCodeFormSubmit>
): Promise<PromoCode> {
  const supabase = createClient()

  const { data: updatedPromo, error } = await supabase
    .from('promo_codes')
    .update(data)
    .eq('id', id)
    .select()
    .single()

  if (error) {
    console.error('Error updating promo code:', error)
    throw new Error(error.message || 'Failed to update promo code')
  }

  return updatedPromo as PromoCode
}

/**
 * Delete a promo code
 * Note: This will fail if there are existing usages due to foreign key constraints
 */
export async function deletePromoCode(id: number): Promise<void> {
  const supabase = createClient()

  const { error } = await supabase
    .from('promo_codes')
    .delete()
    .eq('id', id)

  if (error) {
    console.error('Error deleting promo code:', error)
    throw new Error(error.message || 'Failed to delete promo code')
  }
}

/**
 * Toggle promo code active status
 */
export async function togglePromoCodeActive(
  id: number,
  isActive: boolean
): Promise<PromoCode> {
  const supabase = createClient()

  const { data: updatedPromo, error } = await supabase
    .from('promo_codes')
    .update({ is_active: isActive })
    .eq('id', id)
    .select()
    .single()

  if (error) {
    console.error('Error toggling promo code status:', error)
    throw new Error(error.message || 'Failed to toggle promo code status')
  }

  return updatedPromo as PromoCode
}
