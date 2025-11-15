'use client';

/**
 * Edit Contractor Market Modal
 * Feature: 018-international-market-segmentation
 * Task: T059 - Add market_id dropdown to contractor edit form
 *
 * Allows admins to change a contractor's assigned market.
 */

import { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Globe, X, AlertCircle } from 'lucide-react';
import { useMarkets } from '@/hooks/useMarkets';
import { createClient } from '@/lib/supabase/client';
import { toast } from 'sonner';

interface EditContractorMarketModalProps {
  contractorId: string;
  currentMarketId: number;
  currentMarketName: string;
  isOpen: boolean;
  onClose: () => void;
}

export function EditContractorMarketModal({
  contractorId,
  currentMarketId,
  currentMarketName,
  isOpen,
  onClose,
}: EditContractorMarketModalProps) {
  const [selectedMarketId, setSelectedMarketId] = useState<number>(currentMarketId);
  const queryClient = useQueryClient();

  // Fetch active markets only
  const { data: marketsData, isLoading: isLoadingMarkets } = useMarkets({
    is_active: true,
    limit: 100,
  });

  // Update contractor market mutation
  const updateMarketMutation = useMutation({
    mutationFn: async (marketId: number) => {
      const supabase = createClient();

      const { error } = await supabase
        .from('contractors')
        .update({ market_id: marketId })
        .eq('id', contractorId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'contractor', contractorId] });
      queryClient.invalidateQueries({ queryKey: ['admin', 'contractors'] });
      toast.success('Marché mis à jour avec succès');
      onClose();
    },
    onError: (error: any) => {
      console.error('Error updating contractor market:', error);
      toast.error('Erreur lors de la mise à jour du marché');
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (selectedMarketId === currentMarketId) {
      toast.info('Aucun changement détecté');
      return;
    }

    updateMarketMutation.mutate(selectedMarketId);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="bg-white rounded-lg shadow-xl max-w-md w-full mx-4">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200">
          <div className="flex items-center gap-2">
            <Globe className="h-5 w-5 text-purple-600" />
            <h2 className="text-lg font-semibold text-gray-900">
              Modifier le marché assigné
            </h2>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {/* Current Market Info */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <p className="text-sm text-blue-800">
              <span className="font-medium">Marché actuel :</span> {currentMarketName}
            </p>
          </div>

          {/* Market Selection */}
          <div>
            <label
              htmlFor="market"
              className="block text-sm font-medium text-gray-700 mb-2"
            >
              Nouveau marché <span className="text-red-500">*</span>
            </label>
            {isLoadingMarkets ? (
              <div className="flex items-center justify-center py-8">
                <div className="inline-block animate-spin rounded-full h-6 w-6 border-b-2 border-purple-600"></div>
              </div>
            ) : (
              <select
                id="market"
                value={selectedMarketId}
                onChange={(e) => setSelectedMarketId(Number(e.target.value))}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                required
              >
                {marketsData?.data.map((market) => (
                  <option key={market.id} value={market.id}>
                    {market.name} ({market.code}) - {market.currency_code}
                  </option>
                ))}
              </select>
            )}
            <p className="mt-1 text-xs text-gray-500">
              Seuls les marchés actifs sont affichés
            </p>
          </div>

          {/* Warning */}
          {selectedMarketId !== currentMarketId && (
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 flex gap-3">
              <AlertCircle className="h-5 w-5 text-yellow-600 flex-shrink-0 mt-0.5" />
              <div className="text-sm text-yellow-800">
                <p className="font-medium mb-1">Attention</p>
                <p>
                  Le changement de marché modifiera les réservations que ce
                  prestataire peut voir et gérer. Assurez-vous que ce changement
                  est intentionnel.
                </p>
              </div>
            </div>
          )}

          {/* Actions */}
          <div className="flex items-center justify-end gap-3 pt-4 border-t border-gray-200">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              disabled={updateMarketMutation.isPending}
            >
              Annuler
            </Button>
            <Button
              type="submit"
              disabled={
                updateMarketMutation.isPending ||
                selectedMarketId === currentMarketId
              }
            >
              {updateMarketMutation.isPending ? (
                <>
                  <div className="inline-block animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  Mise à jour...
                </>
              ) : (
                'Enregistrer'
              )}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
