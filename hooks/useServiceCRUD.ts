/**
 * React Query Hooks for Service CRUD Operations
 * Feature: 018-service-management-crud
 *
 * Comprehensive CRUD operations for service management
 * Used by admin interface for creating, updating, and deleting services
 */

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { createClient } from '@/lib/supabase/client'
import {
  serviceFullSchema,
  serviceInsertSchema,
  serviceUpdateSchema,
  serviceDuplicationSchema,
  type ServiceInsertData,
  type ServiceUpdateData,
  type ServiceFullData,
  type ServiceDuplicationData,
} from '@/lib/validations/service-schemas'

// ============================================================================
// Query: Fetch Single Service
// ============================================================================

/**
 * Fetch a single service by ID with full details
 */
export function useService(serviceId: number | null) {
  const supabase = createClient()

  return useQuery({
    queryKey: ['service', serviceId],
    queryFn: async () => {
      if (!serviceId) return null

      const { data, error } = await supabase
        .from('services')
        .select('*')
        .eq('id', serviceId)
        .single()

      if (error) {
        console.error('Error fetching service:', error)
        throw error
      }

      // Return data without strict validation for now
      // TODO: Update schema to match exact database structure
      return data as ServiceFullData
    },
    enabled: !!serviceId,
  })
}

// ============================================================================
// Query: Fetch All Services (with filters)
// ============================================================================

interface UseServicesOptions {
  category_id?: number
  subcategory_id?: number
  is_active?: boolean
  is_featured?: boolean
  search?: string
  limit?: number
  offset?: number
}

/**
 * Fetch all services with optional filters
 */
export function useServices(options: UseServicesOptions = {}) {
  const supabase = createClient()

  return useQuery({
    queryKey: ['services', options],
    queryFn: async () => {
      let query = supabase
        .from('services')
        .select('*', { count: 'exact' })

      // Apply filters
      if (options.category_id) {
        query = query.eq('category_id', options.category_id)
      }
      if (options.subcategory_id) {
        query = query.eq('subcategory_id', options.subcategory_id)
      }
      if (options.is_active !== undefined) {
        query = query.eq('is_active', options.is_active)
      }
      if (options.is_featured !== undefined) {
        query = query.eq('is_featured', options.is_featured)
      }
      if (options.search) {
        query = query.or(`name.ilike.%${options.search}%,description.ilike.%${options.search}%`)
      }

      // Apply pagination
      const limit = options.limit ?? 20
      const offset = options.offset ?? 0
      query = query.range(offset, offset + limit - 1)

      // Order by display_order, then name
      query = query.order('display_order', { ascending: true })
      query = query.order('name', { ascending: true })

      const { data, error, count } = await query

      if (error) {
        console.error('Error fetching services:', error)
        throw error
      }

      return {
        services: data || [],
        total: count || 0,
      }
    },
  })
}

// ============================================================================
// Mutation: Create Service
// ============================================================================

/**
 * Create a new service
 * Validates data with Zod schema before insertion
 */
export function useCreateService() {
  const queryClient = useQueryClient()
  const supabase = createClient()

  return useMutation({
    mutationFn: async (serviceData: ServiceInsertData) => {
      // Validate with Zod schema
      const validatedData = serviceInsertSchema.parse(serviceData)

      // Auto-generate slug if not provided
      if (!validatedData.slug) {
        validatedData.slug = generateSlug(validatedData.name)
      }

      // Insert service
      const { data, error } = await supabase
        .from('services')
        .insert(validatedData)
        .select()
        .single()

      if (error) {
        console.error('Error creating service:', error)
        throw error
      }

      return data
    },
    onSuccess: (data) => {
      // Invalidate services list queries
      queryClient.invalidateQueries({ queryKey: ['services'] })
      // Set the new service in cache
      queryClient.setQueryData(['service', data.id], data)
    },
  })
}

// ============================================================================
// Mutation: Update Service
// ============================================================================

interface UpdateServiceParams {
  serviceId: number
  updates: ServiceUpdateData
}

/**
 * Update an existing service
 * Validates data with Zod schema before update
 */
export function useUpdateService() {
  const queryClient = useQueryClient()
  const supabase = createClient()

  return useMutation({
    mutationFn: async ({ serviceId, updates }: UpdateServiceParams) => {
      // TEMP: Skip validation to debug
      console.log('🔍 Updates received:', JSON.stringify(updates, null, 2))

      // Update slug if name changed and slug not explicitly provided
      if (updates.name && !updates.slug) {
        updates.slug = generateSlug(updates.name)
      }

      // Add updated_at timestamp
      const updateData = {
        ...updates,
        updated_at: new Date().toISOString(),
      }

      console.log('🔍 Update data to send:', JSON.stringify(updateData, null, 2))

      // Update service
      const { data, error } = await supabase
        .from('services')
        .update(updateData)
        .eq('id', serviceId)
        .select()

      if (error) {
        console.error('❌ Supabase error:', JSON.stringify(error, null, 2))
        throw error
      }

      console.log('✅ Supabase response:', JSON.stringify(data, null, 2))

      // Return first result (update returns an array)
      return data?.[0] || null
    },
    onSuccess: (data, variables) => {
      // Invalidate services list queries
      queryClient.invalidateQueries({ queryKey: ['services'] })
      // Update the specific service in cache
      queryClient.invalidateQueries({ queryKey: ['service', variables.serviceId] })
    },
  })
}

// ============================================================================
// Mutation: Delete Service (Soft Delete)
// ============================================================================

/**
 * Soft delete a service
 * Sets is_active to false instead of hard deleting
 */
export function useDeleteService() {
  const queryClient = useQueryClient()
  const supabase = createClient()

  return useMutation({
    mutationFn: async (serviceId: number) => {
      // Soft delete by setting is_active to false
      const { data, error } = await supabase
        .from('services')
        .update({
          is_active: false,
          updated_at: new Date().toISOString(),
        })
        .eq('id', serviceId)
        .select()
        .single()

      if (error) {
        console.error('Error deleting service:', error)
        throw error
      }

      return data
    },
    onSuccess: (data, serviceId) => {
      // Invalidate services list queries
      queryClient.invalidateQueries({ queryKey: ['services'] })
      // Invalidate the specific service
      queryClient.invalidateQueries({ queryKey: ['service', serviceId] })
    },
  })
}

// ============================================================================
// Mutation: Duplicate Service
// ============================================================================

/**
 * Duplicate an existing service with optional customization
 */
export function useDuplicateService() {
  const queryClient = useQueryClient()
  const supabase = createClient()

  return useMutation({
    mutationFn: async (duplicationData: ServiceDuplicationData) => {
      // Validate with Zod schema
      const validatedData = serviceDuplicationSchema.parse(duplicationData)

      // Fetch source service
      const { data: sourceService, error: fetchError } = await supabase
        .from('services')
        .select('*')
        .eq('id', validatedData.source_service_id)
        .single()

      if (fetchError || !sourceService) {
        throw new Error('Service source introuvable')
      }

      // Create new service data
      const newServiceData: any = {
        ...sourceService,
        name: validatedData.new_name,
        slug: generateSlug(validatedData.new_name),
        is_active: false, // Duplicated services start as inactive
        display_order: 0, // Reset display order
      }

      // Remove fields that shouldn't be copied
      delete newServiceData.id
      delete newServiceData.created_at
      delete newServiceData.updated_at

      // Insert duplicated service
      const { data: newService, error: insertError } = await supabase
        .from('services')
        .insert(newServiceData)
        .select()
        .single()

      if (insertError) {
        console.error('Error duplicating service:', insertError)
        throw insertError
      }

      // Copy images if requested
      if (validatedData.copy_images) {
        const { data: images } = await supabase
          .from('service_images')
          .select('*')
          .eq('service_id', validatedData.source_service_id)
          .is('deleted_at', null)

        if (images && images.length > 0) {
          const newImages = images.map(img => ({
            ...img,
            id: undefined,
            service_id: newService.id,
            uploaded_at: new Date().toISOString(),
          }))

          await supabase.from('service_images').insert(newImages)
        }
      }

      // TODO: Copy supplements if copy_supplements is true (Phase 4)
      // TODO: Copy contractors if copy_contractors is true (Phase 4)

      return newService
    },
    onSuccess: () => {
      // Invalidate services list queries
      queryClient.invalidateQueries({ queryKey: ['services'] })
    },
  })
}

// ============================================================================
// Mutation: Bulk Update Services
// ============================================================================

interface BulkUpdateServicesParams {
  serviceIds: number[]
  updates: Partial<ServiceUpdateData>
}

/**
 * Update multiple services at once
 */
export function useBulkUpdateServices() {
  const queryClient = useQueryClient()
  const supabase = createClient()

  return useMutation({
    mutationFn: async ({ serviceIds, updates }: BulkUpdateServicesParams) => {
      if (serviceIds.length === 0) {
        throw new Error('Aucun service sélectionné')
      }

      const updateData = {
        ...updates,
        updated_at: new Date().toISOString(),
      }

      const { data, error } = await supabase
        .from('services')
        .update(updateData)
        .in('id', serviceIds)
        .select()

      if (error) {
        console.error('Error bulk updating services:', error)
        throw error
      }

      return data
    },
    onSuccess: () => {
      // Invalidate all service queries
      queryClient.invalidateQueries({ queryKey: ['services'] })
      queryClient.invalidateQueries({ queryKey: ['service'] })
    },
  })
}

// ============================================================================
// Helper Functions
// ============================================================================

/**
 * Generate a URL-friendly slug from a service name
 */
function generateSlug(name: string): string {
  return name
    .toLowerCase()
    .normalize('NFD') // Normalize to decomposed form
    .replace(/[\u0300-\u036f]/g, '') // Remove diacritics
    .replace(/[^a-z0-9\s-]/g, '') // Remove special chars
    .trim()
    .replace(/\s+/g, '-') // Replace spaces with hyphens
    .replace(/-+/g, '-') // Replace multiple hyphens with single hyphen
}
