'use client';
/**
 * Admin Markets List Page
 * Feature: 018-international-market-segmentation
 * User Story 1: Market Configuration
 */
import { useState } from 'react';
import { useMarkets } from '@/hooks/useMarkets';
import { Button } from '@/components/ui/button';
import { Globe, Plus } from 'lucide-react';
import Link from 'next/link';

export default function AdminMarketsPage() {
  const [isActiveFilter, setIsActiveFilter] = useState<boolean | undefined>(undefined);
  const { data, isLoading } = useMarkets({ is_active: isActiveFilter, page: 1, limit: 20 });
  const markets = data?.data || [];

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
                <Globe className="h-6 w-6" />
                Gestion des Marchés
              </h1>
              <p className="mt-1 text-sm text-gray-600">
                Gérer les marchés géographiques de la plateforme
              </p>
            </div>
            <Link href="/admin/markets/new">
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                Nouveau marché
              </Button>
            </Link>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="bg-white rounded-lg shadow overflow-hidden">
          {isLoading ? (
            <div className="p-12 text-center">Chargement...</div>
          ) : (
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Code</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Nom</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Devise</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Timezone</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Statut</th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Actions</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {markets.map((market) => (
                  <tr key={market.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">{market.code}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm">{market.name}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm">{market.currency_code}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm">{market.timezone}</td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-2 py-1 text-xs rounded-full ${market.is_active ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                        {market.is_active ? 'Actif' : 'Inactif'}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm">
                      <Link href={`/admin/markets/${market.id}`} className="text-blue-600 hover:text-blue-900">
                        Voir
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );
}
