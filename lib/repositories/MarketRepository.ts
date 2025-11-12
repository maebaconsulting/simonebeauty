/**
 * MarketRepository - Data access layer for markets
 * Feature: 018-international-market-segmentation
 */

import { createClient } from '@/lib/supabase/server';
import type {
  Market,
  MarketWithStats,
  CreateMarketInput,
  UpdateMarketInput,
  MarketFilterOptions,
  MarketSortOptions,
} from '@/types/market';

export class MarketRepository {
  /**
   * List markets with pagination and filtering
   */
  static async list(options: {
    page: number;
    limit: number;
    filters?: MarketFilterOptions;
    sort?: MarketSortOptions;
  }): Promise<{ data: Market[]; total: number }> {
    const supabase = await createClient();
    const { page, limit, filters, sort } = options;
    const offset = (page - 1) * limit;

    // Build query
    let query = supabase.from('markets').select('*', { count: 'exact' });

    // Apply filters
    if (filters?.is_active !== undefined) {
      query = query.eq('is_active', filters.is_active);
    }

    if (filters?.search) {
      query = query.or(
        `name.ilike.%${filters.search}%,code.ilike.%${filters.search}%`
      );
    }

    // Apply sorting
    if (sort) {
      query = query.order(sort.field, { ascending: sort.order === 'asc' });
    } else {
      query = query.order('id', { ascending: true });
    }

    // Apply pagination
    query = query.range(offset, offset + limit - 1);

    const { data, error, count } = await query;

    if (error) {
      throw new Error(`Erreur lors de la récupération des marchés: ${error.message}`);
    }

    return {
      data: data || [],
      total: count || 0,
    };
  }

  /**
   * Get a single market by ID
   */
  static async findById(id: number): Promise<Market | null> {
    const supabase = await createClient();

    const { data, error } = await supabase
      .from('markets')
      .select('*')
      .eq('id', id)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        return null; // Not found
      }
      throw new Error(`Erreur lors de la récupération du marché: ${error.message}`);
    }

    return data;
  }

  /**
   * Get a market by ID with statistics
   */
  static async findByIdWithStats(id: number): Promise<MarketWithStats | null> {
    const supabase = await createClient();

    // Get market
    const market = await this.findById(id);
    if (!market) return null;

    // Get contractor count
    const { count: contractorCount, error: contractorError } = await supabase
      .from('contractors')
      .select('*', { count: 'exact', head: true })
      .eq('market_id', id);

    if (contractorError) {
      throw new Error(`Erreur lors du comptage des prestataires: ${contractorError.message}`);
    }

    // Get active contractor count
    const { count: activeContractorCount, error: activeContractorError } = await supabase
      .from('contractors')
      .select('*', { count: 'exact', head: true })
      .eq('market_id', id)
      .eq('is_active', true);

    if (activeContractorError) {
      throw new Error(`Erreur lors du comptage des prestataires actifs: ${activeContractorError.message}`);
    }

    // Get service count (via service_market_availability)
    const { count: serviceCount, error: serviceError } = await supabase
      .from('service_market_availability')
      .select('*', { count: 'exact', head: true })
      .eq('market_id', id)
      .eq('is_available', true);

    if (serviceError) {
      throw new Error(`Erreur lors du comptage des services: ${serviceError.message}`);
    }

    return {
      ...market,
      _count: {
        contractors: contractorCount || 0,
        services: serviceCount || 0,
        active_contractors: activeContractorCount || 0,
      },
    };
  }

  /**
   * Get a market by code (e.g., "FR", "BE")
   */
  static async findByCode(code: string): Promise<Market | null> {
    const supabase = await createClient();

    const { data, error } = await supabase
      .from('markets')
      .select('*')
      .eq('code', code.toUpperCase())
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        return null; // Not found
      }
      throw new Error(`Erreur lors de la récupération du marché: ${error.message}`);
    }

    return data;
  }

  /**
   * Create a new market
   */
  static async create(input: CreateMarketInput): Promise<Market> {
    const supabase = await createClient();

    // Check if code already exists
    const existing = await this.findByCode(input.code);
    if (existing) {
      throw new Error(`Un marché avec le code ${input.code} existe déjà`);
    }

    const { data, error } = await supabase
      .from('markets')
      .insert({
        name: input.name,
        code: input.code.toUpperCase(),
        currency_code: input.currency_code,
        timezone: input.timezone,
        supported_languages: input.supported_languages,
        is_active: input.is_active ?? true,
      })
      .select()
      .single();

    if (error) {
      throw new Error(`Erreur lors de la création du marché: ${error.message}`);
    }

    return data;
  }

  /**
   * Update an existing market
   */
  static async update(id: number, input: UpdateMarketInput): Promise<Market> {
    const supabase = await createClient();

    // Verify market exists
    const existing = await this.findById(id);
    if (!existing) {
      throw new Error(`Marché avec l'ID ${id} introuvable`);
    }

    // If code is being updated, check for duplicates
    if (input.code && input.code !== existing.code) {
      const duplicate = await this.findByCode(input.code);
      if (duplicate) {
        throw new Error(`Un marché avec le code ${input.code} existe déjà`);
      }
    }

    const updateData: Partial<Market> = {};
    if (input.name !== undefined) updateData.name = input.name;
    if (input.code !== undefined) updateData.code = input.code.toUpperCase();
    if (input.currency_code !== undefined) updateData.currency_code = input.currency_code;
    if (input.timezone !== undefined) updateData.timezone = input.timezone;
    if (input.supported_languages !== undefined) updateData.supported_languages = input.supported_languages;
    if (input.is_active !== undefined) updateData.is_active = input.is_active;

    const { data, error } = await supabase
      .from('markets')
      .update(updateData)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      throw new Error(`Erreur lors de la mise à jour du marché: ${error.message}`);
    }

    return data;
  }

  /**
   * Soft delete a market (set is_active = false)
   */
  static async softDelete(id: number): Promise<Market> {
    const supabase = await createClient();

    // Verify market exists
    const existing = await this.findById(id);
    if (!existing) {
      throw new Error(`Marché avec l'ID ${id} introuvable`);
    }

    // Check if market has active contractors
    const { count: activeContractors, error: countError } = await supabase
      .from('contractors')
      .select('*', { count: 'exact', head: true })
      .eq('market_id', id)
      .eq('is_active', true);

    if (countError) {
      throw new Error(`Erreur lors de la vérification des prestataires: ${countError.message}`);
    }

    if (activeContractors && activeContractors > 0) {
      throw new Error(
        `Impossible de désactiver ce marché: ${activeContractors} prestataire(s) actif(s) assigné(s)`
      );
    }

    const { data, error } = await supabase
      .from('markets')
      .update({ is_active: false })
      .eq('id', id)
      .select()
      .single();

    if (error) {
      throw new Error(`Erreur lors de la désactivation du marché: ${error.message}`);
    }

    return data;
  }

  /**
   * Hard delete a market (permanent deletion)
   * WARNING: This will fail if contractors or services are assigned to this market
   */
  static async hardDelete(id: number): Promise<void> {
    const supabase = await createClient();

    // Verify market exists
    const existing = await this.findById(id);
    if (!existing) {
      throw new Error(`Marché avec l'ID ${id} introuvable`);
    }

    // Check if market has any contractors
    const { count: contractorCount, error: countError } = await supabase
      .from('contractors')
      .select('*', { count: 'exact', head: true })
      .eq('market_id', id);

    if (countError) {
      throw new Error(`Erreur lors de la vérification des prestataires: ${countError.message}`);
    }

    if (contractorCount && contractorCount > 0) {
      throw new Error(
        `Impossible de supprimer ce marché: ${contractorCount} prestataire(s) assigné(s). Désactivez-le plutôt.`
      );
    }

    const { error } = await supabase.from('markets').delete().eq('id', id);

    if (error) {
      throw new Error(`Erreur lors de la suppression du marché: ${error.message}`);
    }
  }

  /**
   * Get all active markets (for dropdowns, etc.)
   */
  static async listActive(): Promise<Market[]> {
    const supabase = await createClient();

    const { data, error } = await supabase
      .from('markets')
      .select('*')
      .eq('is_active', true)
      .order('name', { ascending: true });

    if (error) {
      throw new Error(`Erreur lors de la récupération des marchés actifs: ${error.message}`);
    }

    return data || [];
  }

  /**
   * Check if a market code is available
   */
  static async isCodeAvailable(code: string, excludeId?: number): Promise<boolean> {
    const existing = await this.findByCode(code);
    if (!existing) return true;
    if (excludeId && existing.id === excludeId) return true;
    return false;
  }
}
