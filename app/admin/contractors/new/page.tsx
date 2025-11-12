'use client';

/**
 * Admin Create Contractor Page
 * Feature: 018-international-market-segmentation
 * Task: T058 - Add market_id dropdown to contractor creation form
 *
 * Allows administrators to manually create contractor profiles with market assignment.
 * Bypasses the application approval process for special cases.
 */

import { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Building2, AlertCircle } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useMarkets } from '@/hooks/useMarkets';
import { createClient } from '@/lib/supabase/client';
import { toast } from 'sonner';

interface CreateContractorForm {
  userId: string; // Existing user ID to convert to contractor
  marketId: number;
  businessName?: string;
  professionalTitle?: string;
  phone?: string;
  email?: string;
}

export default function AdminCreateContractorPage() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const [formData, setFormData] = useState<CreateContractorForm>({
    userId: '',
    marketId: 1, // Default to France
    businessName: '',
    professionalTitle: '',
    phone: '',
    email: '',
  });

  // Fetch active markets only
  const { data: marketsData, isLoading: isLoadingMarkets } = useMarkets({
    is_active: true,
    limit: 100,
  });

  // Create contractor mutation
  const createContractorMutation = useMutation({
    mutationFn: async (data: CreateContractorForm) => {
      const supabase = createClient();

      // Check if user exists and isn't already a contractor
      const { data: existingContractor, error: checkError } = await supabase
        .from('contractors')
        .select('id')
        .eq('id', data.userId)
        .maybeSingle();

      if (existingContractor) {
        throw new Error('Cet utilisateur est déjà un prestataire');
      }

      // Create contractor record
      const { data: contractor, error: createError } = await supabase
        .from('contractors')
        .insert({
          id: data.userId,
          market_id: data.marketId,
          business_name: data.businessName || null,
          professional_title: data.professionalTitle || null,
          phone: data.phone || null,
          email: data.email || null,
          is_active: true,
          is_verified: true, // Admin-created contractors are auto-verified
          slug_changes_count: 0,
        })
        .select()
        .single();

      if (createError) throw createError;

      return contractor;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'contractors'] });
      toast.success('Prestataire créé avec succès');
      router.push(`/admin/contractors/${data.id}`);
    },
    onError: (error: any) => {
      console.error('Error creating contractor:', error);
      toast.error(
        error.message || 'Erreur lors de la création du prestataire'
      );
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.userId || !formData.marketId) {
      toast.error('Veuillez remplir tous les champs obligatoires');
      return;
    }

    createContractorMutation.mutate(formData);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center gap-4">
            <Button
              variant="outline"
              size="sm"
              onClick={() => router.push('/admin/contractors')}
            >
              <ArrowLeft className="h-4 w-4" />
            </Button>
            <div>
              <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
                <Building2 className="h-6 w-6" />
                Créer un prestataire
              </h1>
              <p className="mt-1 text-sm text-gray-600">
                Créer un profil prestataire manuellement (sans candidature)
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {/* Info Banner */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6 flex gap-3">
          <AlertCircle className="h-5 w-5 text-blue-600 flex-shrink-0 mt-0.5" />
          <div className="text-sm text-blue-800">
            <p className="font-medium mb-1">Note importante</p>
            <p>
              Cette fonctionnalité permet de créer un prestataire directement sans
              passer par le processus de candidature. L'utilisateur doit déjà avoir un
              compte (ID utilisateur requis). Le prestataire sera automatiquement
              vérifié.
            </p>
          </div>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="bg-white rounded-lg shadow">
          <div className="px-6 py-4 border-b border-gray-200">
            <h2 className="text-lg font-semibold text-gray-900">
              Informations du prestataire
            </h2>
          </div>

          <div className="p-6 space-y-6">
            {/* User ID (Required) */}
            <div>
              <label
                htmlFor="userId"
                className="block text-sm font-medium text-gray-700 mb-2"
              >
                ID Utilisateur <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                id="userId"
                value={formData.userId}
                onChange={(e) =>
                  setFormData({ ...formData, userId: e.target.value })
                }
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                placeholder="UUID de l'utilisateur existant"
                required
              />
              <p className="mt-1 text-xs text-gray-500">
                L'utilisateur doit déjà exister dans la table profiles
              </p>
            </div>

            {/* Market Selection (Required) */}
            <div>
              <label
                htmlFor="marketId"
                className="block text-sm font-medium text-gray-700 mb-2"
              >
                Marché <span className="text-red-500">*</span>
              </label>
              {isLoadingMarkets ? (
                <div className="flex items-center justify-center py-8">
                  <div className="inline-block animate-spin rounded-full h-6 w-6 border-b-2 border-purple-600"></div>
                </div>
              ) : (
                <select
                  id="marketId"
                  value={formData.marketId}
                  onChange={(e) =>
                    setFormData({ ...formData, marketId: Number(e.target.value) })
                  }
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
                Le prestataire sera assigné à ce marché géographique
              </p>
            </div>

            {/* Business Name (Optional) */}
            <div>
              <label
                htmlFor="businessName"
                className="block text-sm font-medium text-gray-700 mb-2"
              >
                Nom commercial
              </label>
              <input
                type="text"
                id="businessName"
                value={formData.businessName}
                onChange={(e) =>
                  setFormData({ ...formData, businessName: e.target.value })
                }
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                placeholder="Ex: Coiffure Marie"
              />
            </div>

            {/* Professional Title (Optional) */}
            <div>
              <label
                htmlFor="professionalTitle"
                className="block text-sm font-medium text-gray-700 mb-2"
              >
                Titre professionnel
              </label>
              <input
                type="text"
                id="professionalTitle"
                value={formData.professionalTitle}
                onChange={(e) =>
                  setFormData({ ...formData, professionalTitle: e.target.value })
                }
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                placeholder="Ex: Coiffeuse professionnelle"
              />
            </div>

            {/* Phone (Optional) */}
            <div>
              <label
                htmlFor="phone"
                className="block text-sm font-medium text-gray-700 mb-2"
              >
                Téléphone
              </label>
              <input
                type="tel"
                id="phone"
                value={formData.phone}
                onChange={(e) =>
                  setFormData({ ...formData, phone: e.target.value })
                }
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                placeholder="+33 6 12 34 56 78"
              />
            </div>

            {/* Email (Optional) */}
            <div>
              <label
                htmlFor="email"
                className="block text-sm font-medium text-gray-700 mb-2"
              >
                Email
              </label>
              <input
                type="email"
                id="email"
                value={formData.email}
                onChange={(e) =>
                  setFormData({ ...formData, email: e.target.value })
                }
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                placeholder="contact@example.com"
              />
            </div>
          </div>

          {/* Actions */}
          <div className="px-6 py-4 bg-gray-50 border-t border-gray-200 flex items-center justify-end gap-3 rounded-b-lg">
            <Button
              type="button"
              variant="outline"
              onClick={() => router.push('/admin/contractors')}
              disabled={createContractorMutation.isPending}
            >
              Annuler
            </Button>
            <Button
              type="submit"
              disabled={
                createContractorMutation.isPending ||
                !formData.userId ||
                !formData.marketId
              }
            >
              {createContractorMutation.isPending ? (
                <>
                  <div className="inline-block animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  Création...
                </>
              ) : (
                'Créer le prestataire'
              )}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
