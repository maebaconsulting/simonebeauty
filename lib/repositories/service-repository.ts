// Service Repository - CRUD operations for services table
import { createClient } from '@/lib/supabase/client'
import type { DbService, DbServiceInsert, DbServiceUpdate } from '@/types/database'
import type { ServiceQueryParams } from '@/lib/validations/booking-schemas'

export class ServiceRepository {
  /**
   * Get a fresh Supabase client with current auth state
   * Creating a new client for each operation ensures we have the latest auth context
   */
  private getClient() {
    return createClient()
  }

  /**
   * Get all active services with optional filtering
   */
  async getServices(params?: ServiceQueryParams): Promise<DbService[]> {
    const supabase = this.getClient()

    // If market_id filter is provided, we need to filter by service_market_availability
    if (params?.market_id) {
      // First, get service IDs available in the specified market
      const { data: availableServiceIds, error: marketError } = await supabase
        .from('service_market_availability')
        .select('service_id')
        .eq('market_id', params.market_id)

      if (marketError) {
        throw new Error(`Failed to fetch market availability: ${marketError.message}`)
      }

      const serviceIds = (availableServiceIds || []).map((item) => item.service_id)

      // If no services are available in this market, return empty array
      if (serviceIds.length === 0) {
        return []
      }

      // Now query services filtering by these IDs
      let query = supabase
        .from('services')
        .select(`
          *,
          service_images (
            id,
            storage_path,
            display_order,
            is_primary,
            alt_text,
            file_size_bytes,
            width,
            height
          )
        `)
        .in('id', serviceIds)
        .eq('is_active', true)
        .is('service_images.deleted_at', null)
        .order('display_order', { ascending: true })
        .order('name', { ascending: true })

      // Apply other filters
      return this.applyFilters(query, params)
    }

    // Standard query without market filtering
    let query = supabase
      .from('services')
      .select(`
        *,
        service_images (
          id,
          storage_path,
          display_order,
          is_primary,
          alt_text,
          file_size_bytes,
          width,
          height
        )
      `)
      .eq('is_active', true)
      .is('service_images.deleted_at', null)
      .order('display_order', { ascending: true })
      .order('name', { ascending: true })

    // Apply filters
    return this.applyFilters(query, params)
  }

  /**
   * Apply common filters to a service query
   */
  private async applyFilters(query: any, params?: ServiceQueryParams): Promise<DbService[]> {
    const supabase = this.getClient()

    // Apply category filter
    if (params?.category) {
      // Check if category is a number (category_id) or string (category slug)
      const categoryId = Number(params.category)
      if (!isNaN(categoryId)) {
        // It's a numeric ID
        query = query.eq('category_id', categoryId)
      } else {
        // It's a slug, need to lookup the category first
        const { data: categoryData } = await supabase
          .from('service_categories')
          .select('id')
          .eq('slug', params.category)
          .is('parent_id', null) // Only main categories
          .single()

        if (categoryData) {
          query = query.eq('category_id', categoryData.id)
        }
      }
    }

    if (params?.is_featured !== undefined) {
      query = query.eq('is_featured', params.is_featured)
    }

    if (params?.search) {
      query = query.or(`name.ilike.%${params.search}%,description.ilike.%${params.search}%`)
    }

    // Pagination
    if (params?.limit) {
      query = query.limit(params.limit)
    }

    if (params?.offset) {
      query = query.range(params.offset, params.offset + (params.limit || 10) - 1)
    }

    const { data, error } = await query

    if (error) {
      throw new Error(`Failed to fetch services: ${error.message}`)
    }

    return data || []
  }

  /**
   * Get a single service by ID
   */
  async getServiceById(id: number): Promise<DbService | null> {
    const supabase = this.getClient()
    const { data, error } = await supabase
      .from('services')
      .select(`
        *,
        service_images (
          id,
          storage_path,
          display_order,
          is_primary,
          alt_text,
          file_size_bytes,
          width,
          height
        )
      `)
      .eq('id', id)
      .is('service_images.deleted_at', null)
      .single()

    if (error) {
      if (error.code === 'PGRST116') {
        return null // Not found
      }
      throw new Error(`Failed to fetch service: ${error.message}`)
    }

    return data
  }

  /**
   * Get a single service by slug
   */
  async getServiceBySlug(slug: string): Promise<DbService | null> {
    const supabase = this.getClient()
    const { data, error } = await supabase
      .from('services')
      .select(`
        *,
        service_images (
          id,
          storage_path,
          display_order,
          is_primary,
          alt_text,
          file_size_bytes,
          width,
          height
        )
      `)
      .eq('slug', slug)
      .eq('is_active', true)
      .is('service_images.deleted_at', null)
      .single()

    if (error) {
      if (error.code === 'PGRST116') {
        return null // Not found
      }
      throw new Error(`Failed to fetch service: ${error.message}`)
    }

    return data
  }

  /**
   * Get services by category
   */
  async getServicesByCategory(category: string): Promise<DbService[]> {
    const supabase = this.getClient()
    const { data, error } = await supabase
      .from('services')
      .select(`
        *,
        service_images (
          id,
          storage_path,
          display_order,
          is_primary,
          alt_text,
          file_size_bytes,
          width,
          height
        )
      `)
      .eq('category', category)
      .eq('is_active', true)
      .is('service_images.deleted_at', null)
      .order('display_order', { ascending: true })

    if (error) {
      throw new Error(`Failed to fetch services by category: ${error.message}`)
    }

    return data || []
  }

  /**
   * Get featured services
   */
  async getFeaturedServices(): Promise<DbService[]> {
    const supabase = this.getClient()
    const { data, error } = await supabase
      .from('services')
      .select(`
        *,
        service_images (
          id,
          storage_path,
          display_order,
          is_primary,
          alt_text,
          file_size_bytes,
          width,
          height
        )
      `)
      .eq('is_featured', true)
      .eq('is_active', true)
      .is('service_images.deleted_at', null)
      .order('display_order', { ascending: true })
      .limit(6)

    if (error) {
      throw new Error(`Failed to fetch featured services: ${error.message}`)
    }

    return data || []
  }

  /**
   * Create a new service (admin only)
   */
  async createService(service: DbServiceInsert): Promise<DbService> {
    const supabase = this.getClient()
    const { data, error } = await supabase
      .from('services')
      .insert(service)
      .select()
      .single()

    if (error) {
      throw new Error(`Failed to create service: ${error.message}`)
    }

    return data
  }

  /**
   * Update a service (admin only)
   */
  async updateService(id: number, updates: DbServiceUpdate): Promise<DbService> {
    const supabase = this.getClient()
    const { data, error } = await supabase
      .from('services')
      .update(updates)
      .eq('id', id)
      .select()
      .single()

    if (error) {
      throw new Error(`Failed to update service: ${error.message}`)
    }

    return data
  }

  /**
   * Delete a service (soft delete by setting is_active to false)
   */
  async deleteService(id: number): Promise<void> {
    const supabase = this.getClient()
    const { error } = await supabase
      .from('services')
      .update({ is_active: false })
      .eq('id', id)

    if (error) {
      throw new Error(`Failed to delete service: ${error.message}`)
    }
  }

  /**
   * Get main service categories with counts
   */
  async getServiceCategories(): Promise<
    Array<{ id: number; name: string; slug: string; icon: string | null; image_url: string | null; count: number }>
  > {
    const supabase = this.getClient()

    // Get main categories (parent_id IS NULL)
    const { data: categories, error: categoriesError } = await supabase
      .from('service_categories')
      .select('id, name, slug, icon, image_url, display_order')
      .is('parent_id', null)
      .eq('is_active', true)
      .order('display_order', { ascending: true })

    if (categoriesError) {
      throw new Error(`Failed to fetch service categories: ${categoriesError.message}`)
    }

    if (!categories || categories.length === 0) {
      return []
    }

    // Count services for each category
    const categoriesWithCounts = await Promise.all(
      categories.map(async (category) => {
        const { count, error } = await supabase
          .from('services')
          .select('id', { count: 'exact', head: true })
          .eq('category_id', category.id)
          .eq('is_active', true)

        if (error) {
          console.error(`Failed to count services for category ${category.id}:`, error)
          return { ...category, count: 0 }
        }

        return { ...category, count: count || 0 }
      })
    )

    return categoriesWithCounts
  }
}

// Export singleton instance
export const serviceRepository = new ServiceRepository()
