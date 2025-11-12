'use client';

/**
 * Admin Contractors List Page
 * Feature: 018-international-market-segmentation
 * Task: T047 - Add contractor_code column to admin contractors listing page
 *
 * Displays all contractors with their unique codes, market assignment,
 * and search by code functionality.
 */

import { useState } from 'react';
import { useSearchContractors } from '@/hooks/useContractorCode';
import { useMarkets } from '@/hooks/useMarkets';
import { CodeDisplay } from '@/components/admin/CodeDisplay';
import { Button } from '@/components/ui/button';
import { Search, Users, ChevronLeft, ChevronRight, Building2, Globe } from 'lucide-react';
import Link from 'next/link';

export default function AdminContractorsPage() {
  const [searchQuery, setSearchQuery] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [marketFilter, setMarketFilter] = useState<number | undefined>(undefined);
  const [activeFilter, setActiveFilter] = useState<boolean | undefined>(undefined);
  const [sortField, setSortField] = useState<'contractor_code' | 'business_name' | 'created_at'>('created_at');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');

  // Fetch contractors with current filters
  const { data, isLoading, error } = useSearchContractors({
    search: searchQuery || undefined,
    market_id: marketFilter,
    is_active: activeFilter,
    page: currentPage,
    limit: 20,
    sort: sortField,
    order: sortOrder,
  });

  // Fetch markets for filter dropdown
  const { data: marketsData } = useMarkets({ limit: 100 });

  const contractors = data?.data || [];
  const pagination = data?.pagination;

  const handleSearch = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setCurrentPage(1); // Reset to first page on new search
  };

  const toggleSort = (field: typeof sortField) => {
    if (sortField === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortOrder('asc');
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
                <Building2 className="h-6 w-6" />
                Gestion des Prestataires
              </h1>
              <p className="mt-1 text-sm text-gray-600">
                Consulter et rechercher les prestataires par code, nom ou marché
              </p>
            </div>

            <div className="flex items-center gap-4">
              <div className="text-right">
                <div className="text-2xl font-bold text-gray-900">
                  {pagination?.total || 0}
                </div>
                <div className="text-sm text-gray-600">Prestataires</div>
              </div>
              <Link href="/admin/contractors/applications">
                <Button variant="outline">
                  Voir les candidatures
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* Filters Bar */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-4">
        {/* Search */}
        <form onSubmit={handleSearch} className="flex gap-3">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Rechercher par code (CTR-XXXXXX) ou nom d'entreprise..."
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
            />
          </div>
          <Button type="submit" disabled={isLoading}>
            Rechercher
          </Button>
        </form>

        {/* Additional Filters */}
        <div className="flex gap-3">
          {/* Market Filter */}
          <select
            value={marketFilter || 'all'}
            onChange={(e) => {
              setMarketFilter(e.target.value === 'all' ? undefined : Number(e.target.value));
              setCurrentPage(1);
            }}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
          >
            <option value="all">Tous les marchés</option>
            {marketsData?.data.map((market) => (
              <option key={market.id} value={market.id}>
                {market.name} ({market.code})
              </option>
            ))}
          </select>

          {/* Status Filter */}
          <select
            value={activeFilter === undefined ? 'all' : activeFilter ? 'active' : 'inactive'}
            onChange={(e) => {
              setActiveFilter(
                e.target.value === 'all'
                  ? undefined
                  : e.target.value === 'active'
              );
              setCurrentPage(1);
            }}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
          >
            <option value="all">Tous les statuts</option>
            <option value="active">Actifs uniquement</option>
            <option value="inactive">Inactifs uniquement</option>
          </select>
        </div>

        {/* Search hint */}
        {searchQuery && (
          <p className="text-sm text-gray-600">
            {searchQuery.match(/^CTR-\d{0,6}$/)
              ? `Recherche par code: ${searchQuery}`
              : `Recherche par nom: ${searchQuery}`}
          </p>
        )}
      </div>

      {/* Contractors Table */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-6">
        <div className="bg-white rounded-lg shadow overflow-hidden">
          {isLoading ? (
            <div className="p-12 text-center">
              <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
              <p className="mt-4 text-gray-600">Chargement des prestataires...</p>
            </div>
          ) : error ? (
            <div className="p-12 text-center">
              <p className="text-red-600">
                Erreur lors du chargement des prestataires
              </p>
              <p className="text-sm text-gray-600 mt-2">{String(error)}</p>
            </div>
          ) : contractors.length === 0 ? (
            <div className="p-12 text-center">
              <Building2 className="mx-auto h-12 w-12 text-gray-400" />
              <p className="mt-4 text-gray-600">Aucun prestataire trouvé</p>
              {(searchQuery || activeFilter !== undefined) && (
                <Button
                  variant="outline"
                  onClick={() => {
                    setSearchQuery('');
                    setActiveFilter(undefined);
                    setMarketFilter(undefined);
                    setCurrentPage(1);
                  }}
                  className="mt-4"
                >
                  Réinitialiser les filtres
                </Button>
              )}
            </div>
          ) : (
            <>
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th
                      className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                      onClick={() => toggleSort('contractor_code')}
                    >
                      Code Prestataire{' '}
                      {sortField === 'contractor_code' && (sortOrder === 'asc' ? '↑' : '↓')}
                    </th>
                    <th
                      className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                      onClick={() => toggleSort('business_name')}
                    >
                      Nom d'entreprise{' '}
                      {sortField === 'business_name' && (sortOrder === 'asc' ? '↑' : '↓')}
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Titre professionnel
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Marché
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Téléphone
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Services
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Réservations
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Statut
                    </th>
                    <th
                      className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                      onClick={() => toggleSort('created_at')}
                    >
                      Créé le{' '}
                      {sortField === 'created_at' && (sortOrder === 'asc' ? '↑' : '↓')}
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {contractors.map((contractor) => (
                    <tr
                      key={contractor.id}
                      className="hover:bg-gray-50 transition-colors"
                    >
                      <td className="px-6 py-4 whitespace-nowrap">
                        <CodeDisplay
                          code={contractor.contractor_code}
                          type="contractor"
                          size="sm"
                        />
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900">
                          {contractor.business_name}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-600">
                          {contractor.professional_title || '-'}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {contractor.market ? (
                          <div className="flex items-center gap-2">
                            <span className="text-sm font-medium text-gray-900">
                              {contractor.market.name}
                            </span>
                            <span className="text-xs text-gray-500">
                              ({contractor.market.code})
                            </span>
                          </div>
                        ) : (
                          <span className="text-sm text-gray-400">Non assigné</span>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-600">
                          {contractor.phone || '-'}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="px-2 py-1 text-xs font-medium bg-purple-100 text-purple-800 rounded-full">
                          {contractor._count?.services || 0}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex flex-col gap-1">
                          <span className="px-2 py-1 text-xs font-medium bg-blue-100 text-blue-800 rounded-full text-center">
                            {contractor._count?.bookings || 0}
                          </span>
                          {(contractor._count?.upcoming_bookings || 0) > 0 && (
                            <span className="px-2 py-1 text-xs font-medium bg-green-100 text-green-800 rounded-full text-center">
                              {contractor._count?.upcoming_bookings} à venir
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span
                          className={`px-2 py-1 text-xs font-medium rounded-full ${
                            contractor.is_active
                              ? 'bg-green-100 text-green-800'
                              : 'bg-red-100 text-red-800'
                          }`}
                        >
                          {contractor.is_active ? 'Actif' : 'Inactif'}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                        {new Date(contractor.created_at).toLocaleDateString('fr-FR')}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        <Link
                          href={`/admin/contractors/${contractor.id}`}
                          className="text-purple-600 hover:text-purple-900"
                        >
                          Voir détails
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>

              {/* Pagination */}
              {pagination && pagination.pages > 1 && (
                <div className="bg-white px-4 py-3 flex items-center justify-between border-t border-gray-200 sm:px-6">
                  <div className="flex-1 flex justify-between sm:hidden">
                    <Button
                      onClick={() => setCurrentPage(currentPage - 1)}
                      disabled={currentPage === 1}
                      variant="outline"
                    >
                      Précédent
                    </Button>
                    <Button
                      onClick={() => setCurrentPage(currentPage + 1)}
                      disabled={currentPage === pagination.pages}
                      variant="outline"
                    >
                      Suivant
                    </Button>
                  </div>
                  <div className="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
                    <div>
                      <p className="text-sm text-gray-700">
                        Page <span className="font-medium">{currentPage}</span> sur{' '}
                        <span className="font-medium">{pagination.pages}</span> (
                        <span className="font-medium">{pagination.total}</span>{' '}
                        prestataires au total)
                      </p>
                    </div>
                    <div className="flex gap-2">
                      <Button
                        onClick={() => setCurrentPage(currentPage - 1)}
                        disabled={currentPage === 1}
                        variant="outline"
                        size="sm"
                      >
                        <ChevronLeft className="h-4 w-4" />
                        Précédent
                      </Button>
                      <Button
                        onClick={() => setCurrentPage(currentPage + 1)}
                        disabled={currentPage === pagination.pages}
                        variant="outline"
                        size="sm"
                      >
                        Suivant
                        <ChevronRight className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
