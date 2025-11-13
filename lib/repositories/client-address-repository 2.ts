// Client Address Repository - CRUD operations for client_addresses table
import { createClient } from '@/lib/supabase/client'
import type { DbClientAddress, DbClientAddressInsert, DbClientAddressUpdate } from '@/types/database'

export class ClientAddressRepository {
  /**
   * Get a fresh Supabase client with current auth state
   * Creating a new client for each operation ensures we have the latest auth context
   */
  private getClient() {
    return createClient()
  }

  /**
   * Get all addresses for a client
   */
  async getClientAddresses(clientId: string): Promise<DbClientAddress[]> {
    const supabase = this.getClient()
    const { data, error } = await supabase
      .from('client_addresses')
      .select('*')
      .eq('client_id', clientId)
      .eq('is_active', true)
      .order('is_default', { ascending: false })
      .order('created_at', { ascending: false })

    if (error) {
      throw new Error(`Failed to fetch client addresses: ${error.message}`)
    }

    return data || []
  }

  /**
   * Get a single address by ID
   */
  async getAddressById(id: number): Promise<DbClientAddress | null> {
    const supabase = this.getClient()
    const { data, error } = await supabase
      .from('client_addresses')
      .select('*')
      .eq('id', id)
      .single()

    if (error) {
      if (error.code === 'PGRST116') {
        return null // Not found
      }
      throw new Error(`Failed to fetch address: ${error.message}`)
    }

    return data
  }

  /**
   * Get default address for a client
   */
  async getDefaultAddress(clientId: string): Promise<DbClientAddress | null> {
    const supabase = this.getClient()
    const { data, error } = await supabase
      .from('client_addresses')
      .select('*')
      .eq('client_id', clientId)
      .eq('is_default', true)
      .eq('is_active', true)
      .maybeSingle()

    if (error) {
      throw new Error(`Failed to fetch default address: ${error.message}`)
    }

    return data
  }

  /**
   * Create a new address
   */
  async createAddress(address: DbClientAddressInsert): Promise<DbClientAddress> {
    const supabase = this.getClient()

    console.log('🔵 ClientAddressRepository.createAddress called with:', address)
    console.log('🔑 client_id type:', typeof address.client_id)
    console.log('🔑 client_id value:', address.client_id)

    const { data, error } = await supabase
      .from('client_addresses')
      .insert(address)
      .select()
      .single()

    if (error) {
      console.error('❌ Supabase error:', error)
      console.error('   Error code:', error.code)
      console.error('   Error message:', error.message)
      console.error('   Error details:', error.details)
      console.error('   Error hint:', error.hint)
      throw new Error(`Failed to create address: ${error.message}`)
    }

    console.log('✅ Address created successfully:', data)
    return data
  }

  /**
   * Update an address
   */
  async updateAddress(id: number, updates: DbClientAddressUpdate): Promise<DbClientAddress> {
    const supabase = this.getClient()
    const { data, error } = await supabase
      .from('client_addresses')
      .update(updates)
      .eq('id', id)
      .select()
      .single()

    if (error) {
      throw new Error(`Failed to update address: ${error.message}`)
    }

    return data
  }

  /**
   * Delete an address (soft delete)
   */
  async deleteAddress(id: number): Promise<void> {
    const supabase = this.getClient()
    const { error } = await supabase
      .from('client_addresses')
      .update({ is_active: false })
      .eq('id', id)

    if (error) {
      throw new Error(`Failed to delete address: ${error.message}`)
    }
  }

  /**
   * Hard delete an address (permanent)
   */
  async permanentlyDeleteAddress(id: number): Promise<void> {
    const supabase = this.getClient()
    const { error } = await supabase.from('client_addresses').delete().eq('id', id)

    if (error) {
      throw new Error(`Failed to permanently delete address: ${error.message}`)
    }
  }

  /**
   * Set an address as default
   * (The trigger will automatically unset other defaults)
   */
  async setAsDefault(id: number, clientId: string): Promise<DbClientAddress> {
    const supabase = this.getClient()
    const { data, error } = await supabase
      .from('client_addresses')
      .update({ is_default: true })
      .eq('id', id)
      .eq('client_id', clientId)
      .select()
      .single()

    if (error) {
      throw new Error(`Failed to set address as default: ${error.message}`)
    }

    return data
  }

  /**
   * Search addresses by query (street, city, postal code)
   */
  async searchAddresses(clientId: string, query: string): Promise<DbClientAddress[]> {
    const supabase = this.getClient()
    const { data, error } = await supabase
      .from('client_addresses')
      .select('*')
      .eq('client_id', clientId)
      .eq('is_active', true)
      .or(`street.ilike.%${query}%,city.ilike.%${query}%,postal_code.ilike.%${query}%`)
      .order('is_default', { ascending: false })
      .order('created_at', { ascending: false })

    if (error) {
      throw new Error(`Failed to search addresses: ${error.message}`)
    }

    return data || []
  }
}

// Export singleton instance
export const clientAddressRepository = new ClientAddressRepository()
