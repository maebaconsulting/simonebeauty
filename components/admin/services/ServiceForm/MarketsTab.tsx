'use client';

/**
 * Service Markets Tab
 * Feature: 019-market-integration-optimization
 *
 * Manages service availability across different markets with optional localized pricing.
 */

import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useMarkets } from '@/hooks/useMarkets';
import { Button } from '@/components/ui/button';
import { Globe, Plus, Trash2, AlertCircle, Check } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import { toast } from 'sonner';

interface MarketAvailability {
  market_id: number;
  is_available: boolean;
  localized_price: number | null;
}

interface MarketsTabProps {
  serviceId: number | null; // null for create mode
  basePrice: number; // From pricing tab
}

export function MarketsTab({ serviceId, basePrice }: MarketsTabProps) {
  const queryClient = useQueryClient();
  const [availabilities, setAvailabilities] = useState<MarketAvailability[]>([]);
  const [hasChanges, setHasChanges] = useState(false);

  // Fetch all markets
  const { data: marketsData, isLoading: isLoadingMarkets } = useMarkets({
    is_active: undefined, // Show all markets
    limit: 100,
  });

  // Fetch existing market availabilities for this service
  const { data: existingAvailabilities, isLoading: isLoadingAvailabilities } = useQuery({
    queryKey: ['service', serviceId, 'markets'],
    queryFn: async () => {
      if (!serviceId) return [];

      const supabase = createClient();
      const { data, error } = await supabase
        .from('service_market_availability')
        .select('market_id, is_available, localized_price')
        .eq('service_id', serviceId);

      if (error) throw error;
      return data as MarketAvailability[];
    },
    enabled: !!serviceId,
  });

  // Initialize availabilities when data loads
  useEffect(() => {
    if (existingAvailabilities) {
      setAvailabilities(existingAvailabilities);
    } else if (marketsData?.data) {
      // For new services, default to France market only
      setAvailabilities([
        {
          market_id: 1, // France
          is_available: true,
          localized_price: null,
        },
      ]);
    }
  }, [existingAvailabilities, marketsData]);

  // Save mutation
  const saveMutation = useMutation({
    mutationFn: async (data: MarketAvailability[]) => {
      if (!serviceId) {
        throw new Error('Service must be created before adding markets');
      }

      const supabase = createClient();

      // Delete all existing availabilities
      await supabase
        .from('service_market_availability')
        .delete()
        .eq('service_id', serviceId);

      // Insert new availabilities (only those marked as available)
      const toInsert = data
        .filter((a) => a.is_available)
        .map((a) => ({
          service_id: serviceId,
          market_id: a.market_id,
          is_available: a.is_available,
          localized_price: a.localized_price,
        }));

      if (toInsert.length > 0) {
        const { error } = await supabase
          .from('service_market_availability')
          .insert(toInsert);

        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['service', serviceId, 'markets'] });
      queryClient.invalidateQueries({ queryKey: ['admin', 'services'] });
      toast.success('Disponibilité des marchés mise à jour');
      setHasChanges(false);
    },
    onError: (error: any) => {
      console.error('Error saving market availability:', error);
      toast.error('Erreur lors de la sauvegarde');
    },
  });

  const toggleMarket = (marketId: number) => {
    setAvailabilities((prev) => {
      const existing = prev.find((a) => a.market_id === marketId);

      if (existing) {
        // Toggle existing
        return prev.map((a) =>
          a.market_id === marketId ? { ...a, is_available: !a.is_available } : a
        );
      } else {
        // Add new
        return [
          ...prev,
          {
            market_id: marketId,
            is_available: true,
            localized_price: null,
          },
        ];
      }
    });
    setHasChanges(true);
  };

  const updateLocalizedPrice = (marketId: number, price: number | null) => {
    setAvailabilities((prev) =>
      prev.map((a) =>
        a.market_id === marketId ? { ...a, localized_price: price } : a
      )
    );
    setHasChanges(true);
  };

  const handleSave = () => {
    saveMutation.mutate(availabilities);
  };

  if (isLoadingMarkets || (serviceId && isLoadingAvailabilities)) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600"></div>
      </div>
    );
  }

  if (!serviceId) {
    return (
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-6 flex gap-3">
        <AlertCircle className="h-5 w-5 text-blue-600 flex-shrink-0 mt-0.5" />
        <div className="text-sm text-blue-800">
          <p className="font-medium mb-1">Service non enregistré</p>
          <p>
            Enregistrez d'abord le service (onglets Général et Prix & Durée) avant de
            configurer les marchés.
          </p>
        </div>
      </div>
    );
  }

  const markets = marketsData?.data || [];
  const availableCount = availabilities.filter((a) => a.is_available).length;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
          <Globe className="h-5 w-5" />
          Disponibilité par marché
        </h2>
        <p className="mt-1 text-sm text-gray-600">
          Sélectionnez les marchés où ce service est disponible. Vous pouvez définir
          un prix spécifique par marché ou utiliser le prix de base.
        </p>
      </div>

      {/* Stats */}
      <div className="bg-gradient-to-r from-purple-50 to-blue-50 rounded-lg p-4 border border-purple-200">
        <div className="flex items-center justify-between">
          <div>
            <div className="text-sm text-gray-600">Marchés disponibles</div>
            <div className="text-2xl font-bold text-gray-900">
              {availableCount} / {markets.length}
            </div>
          </div>
          <Globe className="h-12 w-12 text-purple-400" />
        </div>
      </div>

      {/* Markets List */}
      <div className="space-y-3">
        {markets.map((market) => {
          const availability = availabilities.find((a) => a.market_id === market.id);
          const isAvailable = availability?.is_available || false;
          const localizedPrice = availability?.localized_price;

          return (
            <div
              key={market.id}
              className={`border rounded-lg p-4 transition-all ${
                isAvailable
                  ? 'border-purple-300 bg-purple-50'
                  : 'border-gray-200 bg-white'
              }`}
            >
              <div className="flex items-start justify-between">
                {/* Market Info */}
                <div className="flex items-center gap-3 flex-1">
                  <button
                    type="button"
                    onClick={() => toggleMarket(market.id)}
                    className={`flex-shrink-0 w-6 h-6 rounded border-2 flex items-center justify-center transition-colors ${
                      isAvailable
                        ? 'bg-purple-600 border-purple-600'
                        : 'bg-white border-gray-300'
                    }`}
                  >
                    {isAvailable && <Check className="h-4 w-4 text-white" />}
                  </button>

                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <span className="font-medium text-gray-900">
                        {market.name}
                      </span>
                      <span
                        className={`px-2 py-0.5 text-xs font-medium rounded-full ${
                          market.is_active
                            ? 'bg-green-100 text-green-800'
                            : 'bg-gray-100 text-gray-800'
                        }`}
                      >
                        {market.code}
                      </span>
                      {!market.is_active && (
                        <span className="text-xs text-gray-500">(Inactif)</span>
                      )}
                    </div>
                    <div className="mt-1 text-sm text-gray-600">
                      {market.currency_code} • {market.timezone}
                    </div>
                  </div>
                </div>

                {/* Price Input */}
                {isAvailable && (
                  <div className="ml-4 w-48">
                    <label className="block text-xs text-gray-600 mb-1">
                      Prix localisé (optionnel)
                    </label>
                    <div className="relative">
                      <input
                        type="number"
                        step="0.01"
                        min="0"
                        value={localizedPrice || ''}
                        onChange={(e) =>
                          updateLocalizedPrice(
                            market.id,
                            e.target.value ? parseFloat(e.target.value) : null
                          )
                        }
                        placeholder={`${basePrice} (défaut)`}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                      />
                      <span className="absolute right-3 top-2 text-sm text-gray-500">
                        {market.currency_code}
                      </span>
                    </div>
                    <p className="mt-1 text-xs text-gray-500">
                      {localizedPrice
                        ? `Prix personnalisé : ${localizedPrice} ${market.currency_code}`
                        : `Prix de base : ${basePrice} ${market.currency_code}`}
                    </p>
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Save Button */}
      {hasChanges && (
        <div className="sticky bottom-0 bg-white border-t border-gray-200 p-4 flex items-center justify-between -mx-6 -mb-6">
          <div className="text-sm text-gray-600">
            Modifications non enregistrées
          </div>
          <div className="flex items-center gap-3">
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                setAvailabilities(existingAvailabilities || []);
                setHasChanges(false);
              }}
              disabled={saveMutation.isPending}
            >
              Annuler
            </Button>
            <Button
              type="button"
              onClick={handleSave}
              disabled={saveMutation.isPending}
            >
              {saveMutation.isPending ? (
                <>
                  <div className="inline-block animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  Enregistrement...
                </>
              ) : (
                'Enregistrer les marchés'
              )}
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
