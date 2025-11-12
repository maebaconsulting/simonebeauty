// Booking Session Repository - CRUD operations for booking_sessions table
import { createClient } from '@/lib/supabase/client'
import type {
  DbBookingSession,
  DbBookingSessionInsert,
  DbBookingSessionUpdate,
  DbBookingSessionWithRelations,
} from '@/types/database'

export class BookingSessionRepository {
  /**
   * Get a fresh Supabase client with current auth state
   * Creating a new client for each operation ensures we have the latest auth context
   */
  private getClient() {
    return createClient()
  }

  /**
   * Get session by session_id (UUID)
   */
  async getSessionByUuid(sessionId: string): Promise<DbBookingSession | null> {
    const supabase = this.getClient()
    const { data, error } = await supabase
      .from('booking_sessions')
      .select('*')
      .eq('session_id', sessionId)
      .maybeSingle()

    if (error) {
      throw new Error(`Failed to fetch booking session: ${error.message}`)
    }

    return data
  }

  /**
   * Get session with all related data (service, address, contractor)
   */
  async getSessionWithRelations(sessionId: string): Promise<DbBookingSessionWithRelations | null> {
    const supabase = this.getClient()
    const { data, error } = await supabase
      .from('booking_sessions')
      .select(`
        *,
        service:services(id, name, slug, description, base_price, base_duration_minutes, image_url, category),
        address:client_addresses(id, type, label, street, city, postal_code, country, latitude, longitude),
        contractor:profiles(id, first_name, last_name, avatar_url)
      `)
      .eq('session_id', sessionId)
      .maybeSingle()

    if (error) {
      throw new Error(`Failed to fetch booking session with relations: ${error.message}`)
    }

    // PostgreSQL numeric columns are returned as strings - convert to numbers
    if (data?.service) {
      data.service.base_price = Number(data.service.base_price)
      data.service.base_duration_minutes = Number(data.service.base_duration_minutes)
    }

    return data as DbBookingSessionWithRelations | null
  }

  /**
   * Get active sessions for a client
   */
  async getActiveSessions(clientId: string): Promise<DbBookingSession[]> {
    const supabase = this.getClient()
    const { data, error } = await supabase
      .from('booking_sessions')
      .select('*')
      .eq('client_id', clientId)
      .gte('expires_at', new Date().toISOString())
      .order('last_activity_at', { ascending: false })

    if (error) {
      throw new Error(`Failed to fetch active sessions: ${error.message}`)
    }

    return data || []
  }

  /**
   * Create a new booking session
   */
  async createSession(session: DbBookingSessionInsert): Promise<DbBookingSession> {
    const supabase = this.getClient()
    const { data, error } = await supabase
      .from('booking_sessions')
      .insert(session)
      .select()
      .single()

    if (error) {
      throw new Error(`Failed to create booking session: ${error.message}`)
    }

    return data
  }

  /**
   * Update a booking session
   */
  async updateSession(
    sessionId: string,
    updates: DbBookingSessionUpdate
  ): Promise<DbBookingSession> {
    const supabase = this.getClient()

    // Always refresh last_activity_at when updating
    const updatesWithActivity = {
      ...updates,
      last_activity_at: new Date().toISOString(),
    }

    const { data, error } = await supabase
      .from('booking_sessions')
      .update(updatesWithActivity)
      .eq('session_id', sessionId)
      .select()
      .single()

    if (error) {
      throw new Error(`Failed to update booking session: ${error.message}`)
    }

    return data
  }

  /**
   * Update session step
   */
  async updateStep(sessionId: string, step: 1 | 2 | 3 | 4): Promise<DbBookingSession> {
    return this.updateSession(sessionId, { current_step: step })
  }

  /**
   * Delete a booking session
   */
  async deleteSession(sessionId: string): Promise<void> {
    const supabase = this.getClient()
    const { error } = await supabase
      .from('booking_sessions')
      .delete()
      .eq('session_id', sessionId)

    if (error) {
      throw new Error(`Failed to delete booking session: ${error.message}`)
    }
  }

  /**
   * Refresh session expiration (extend by 30 minutes)
   */
  async refreshExpiration(sessionId: string): Promise<DbBookingSession> {
    const expiresAt = new Date()
    expiresAt.setMinutes(expiresAt.getMinutes() + 30)

    return this.updateSession(sessionId, {
      last_activity_at: new Date().toISOString(),
    })
  }

  /**
   * Cleanup expired sessions (for cron job)
   */
  async cleanupExpiredSessions(): Promise<number> {
    const supabase = this.getClient()
    const { data, error } = await supabase
      .from('booking_sessions')
      .delete()
      .lt('expires_at', new Date().toISOString())
      .select('id')

    if (error) {
      throw new Error(`Failed to cleanup expired sessions: ${error.message}`)
    }

    return data?.length || 0
  }

  /**
   * Update service selection (Step 1)
   */
  async updateServiceSelection(
    sessionId: string,
    serviceId: number
  ): Promise<DbBookingSession> {
    return this.updateSession(sessionId, {
      service_id: serviceId,
      current_step: 2,
    })
  }

  /**
   * Update address selection (Step 2)
   */
  async updateAddressSelection(
    sessionId: string,
    addressId: number
  ): Promise<DbBookingSession> {
    return this.updateSession(sessionId, {
      address_id: addressId,
      current_step: 3,
    })
  }

  /**
   * Update timeslot selection (Step 3)
   */
  async updateTimeslotSelection(
    sessionId: string,
    timeslot: {
      date: string
      start_time: string
      end_time: string
      contractor_id?: string
    },
    contractorId?: string
  ): Promise<DbBookingSession> {
    return this.updateSession(sessionId, {
      timeslot,
      contractor_id: contractorId,
      current_step: 4,
    })
  }

  /**
   * Update contractor selection (Step 3.5 - between timeslot and confirmation)
   */
  async updateContractorSelection(
    sessionId: string,
    contractorId: string
  ): Promise<DbBookingSession> {
    return this.updateSession(sessionId, {
      contractor_id: contractorId,
    })
  }

  /**
   * Apply promo code
   */
  async applyPromoCode(
    sessionId: string,
    promoCodeId: number,
    promoCode: string,
    discountAmount: number
  ): Promise<DbBookingSession> {
    return this.updateSession(sessionId, {
      promo_code_id: promoCodeId,
      promo_code: promoCode,
      promo_discount_amount: discountAmount,
    })
  }

  /**
   * Remove promo code
   */
  async removePromoCode(sessionId: string): Promise<DbBookingSession> {
    return this.updateSession(sessionId, {
      promo_code_id: null,
      promo_code: null,
      promo_discount_amount: 0,
    })
  }

  /**
   * Apply gift card
   */
  async applyGiftCard(
    sessionId: string,
    giftCardId: number,
    giftCardCode: string,
    giftCardAmount: number
  ): Promise<DbBookingSession> {
    return this.updateSession(sessionId, {
      gift_card_id: giftCardId,
      gift_card_code: giftCardCode,
      gift_card_amount: giftCardAmount,
    })
  }

  /**
   * Remove gift card
   */
  async removeGiftCard(sessionId: string): Promise<DbBookingSession> {
    return this.updateSession(sessionId, {
      gift_card_id: null,
      gift_card_code: null,
      gift_card_amount: 0,
    })
  }

  // ============================================================================
  // GUEST SESSION METHODS
  // ============================================================================

  /**
   * Create a guest booking session (no authentication required)
   */
  async createGuestSession(
    guestEmail: string,
    source: string = 'catalog'
  ): Promise<DbBookingSession> {
    const supabase = this.getClient()

    const sessionData: DbBookingSessionInsert = {
      client_id: null, // No client_id for guests
      is_guest: true,
      guest_email: guestEmail,
      current_step: 1,
      source,
      contractor_locked: false,
      promo_discount_amount: 0,
      gift_card_amount: 0,
      expires_at: new Date(Date.now() + 30 * 60 * 1000).toISOString(), // 30 minutes
    }

    const { data, error } = await supabase
      .from('booking_sessions')
      .insert(sessionData)
      .select()
      .single()

    if (error) {
      throw new Error(`Failed to create guest session: ${error.message}`)
    }

    return data
  }

  /**
   * Update guest address (store in JSONB field, not client_addresses table)
   */
  async updateGuestAddress(
    sessionId: string,
    address: {
      street: string
      city: string
      postal_code: string
      country?: string // ISO 3166-1 alpha-2 country code
      latitude?: number
      longitude?: number
      building_info?: string
    }
  ): Promise<DbBookingSession> {
    return this.updateSession(sessionId, {
      guest_address: address,
      current_step: 3, // Move to timeslot selection
    })
  }

  /**
   * Migrate guest session to authenticated user session
   * Called after user signs up or logs in
   */
  async migrateGuestSession(
    sessionId: string,
    userId: string,
    addressId?: number
  ): Promise<DbBookingSession> {
    const supabase = this.getClient()

    // First, get the current session to preserve guest_address if needed
    const session = await this.getSessionByUuid(sessionId)
    if (!session) {
      throw new Error('Session not found')
    }

    if (!session.is_guest) {
      throw new Error('Session is not a guest session')
    }

    // Update session to authenticated
    const updates: DbBookingSessionUpdate = {
      client_id: userId,
      is_guest: false,
      guest_email: null,
      address_id: addressId, // Set address_id from saved guest address
      guest_address: null, // Clear guest_address as it's now in client_addresses
    }

    const { data, error } = await supabase
      .from('booking_sessions')
      .update(updates)
      .eq('session_id', sessionId)
      .select()
      .single()

    if (error) {
      throw new Error(`Failed to migrate guest session: ${error.message}`)
    }

    return data
  }

  /**
   * Save guest address to client_addresses table after authentication
   * This is typically called after successful migration
   */
  async saveGuestAddressToProfile(
    userId: string,
    guestAddress: {
      street: string
      city: string
      postal_code: string
      country?: string // ISO 3166-1 alpha-2 country code
      latitude?: number
      longitude?: number
      building_info?: string
    }
  ): Promise<number> {
    const supabase = this.getClient()

    const { data, error } = await supabase
      .from('client_addresses')
      .insert({
        client_id: userId,
        street: guestAddress.street,
        city: guestAddress.city,
        postal_code: guestAddress.postal_code,
        country: guestAddress.country || 'FR', // Default to FR if not provided
        latitude: guestAddress.latitude,
        longitude: guestAddress.longitude,
        building_info: guestAddress.building_info,
        type: 'home',
        is_default: true, // Set as default since it's likely their first address
      })
      .select('id')
      .single()

    if (error) {
      throw new Error(`Failed to save guest address: ${error.message}`)
    }

    return data.id
  }
}

// Export singleton instance
export const bookingSessionRepository = new BookingSessionRepository()
