'use client';

/**
 * Admin Clients List Page
 * Feature: 018-international-market-segmentation
 * Task: T046 - Add client_code column to admin clients listing page
 *
 * Displays all clients with their unique codes, search by code functionality,
 * and pagination.
 */

import { useState } from 'react';
import { useSearchClients } from '@/hooks/useClientCode';
import { useMarkets } from '@/hooks/useMarkets';
import { CodeDisplay } from '@/components/admin/CodeDisplay';
import { Button } from '@/components/ui/button';
import { Search, Users, ChevronLeft, ChevronRight, Filter } from 'lucide-react';
import Link from 'next/link';

export default function AdminClientsPage() {
  const [searchQuery, setSearchQuery] = useState('');
  const [marketFilter, setMarketFilter] = useState<string>('');
  const [currentPage, setCurrentPage] = useState(1);
  const [sortField, setSortField] = useState<'client_code' | 'first_name' | 'last_name' | 'created_at'>('created_at');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');

  // Fetch markets for filter
  const { data: marketsData } = useMarkets();
  const markets = marketsData?.data || [];

  // Fetch clients with current filters
  const { data, isLoading, error } = useSearchClients({
    search: searchQuery || undefined,
    market_id: marketFilter || undefined,
    page: currentPage,
    limit: 20,
    sort: sortField,
    order: sortOrder,
  });

  const clients = data?.data || [];
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
                <Users className="h-6 w-6" />
                Gestion des Clients
              </h1>
              <p className="mt-1 text-sm text-gray-600">
                Consulter et rechercher les clients par code, nom ou email
              </p>
            </div>

            <div className="text-right">
              <div className="text-2xl font-bold text-gray-900">
                {pagination?.total || 0}
              </div>
              <div className="text-sm text-gray-600">Clients total</div>
            </div>
          </div>
        </div>
      </div>

      {/* Search Bar */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <form onSubmit={handleSearch} className="space-y-3">
          <div className="flex gap-3">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Rechercher par code (CLI-XXXXXX), nom ou prénom..."
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
            <Button type="submit" disabled={isLoading}>
              Rechercher
            </Button>
          </div>

          {/* Market Filter */}
          <div className="flex items-center gap-3">
            <Filter className="h-5 w-5 text-gray-400" />
            <select
              value={marketFilter}
              onChange={(e) => {
                setMarketFilter(e.target.value);
                setCurrentPage(1);
              }}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="">Tous les marchés</option>
              {markets.map((market: any) => (
                <option key={market.id} value={market.id}>
                  {market.name} ({market.code})
                </option>
              ))}
            </select>
            {marketFilter && (
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => {
                  setMarketFilter('');
                  setCurrentPage(1);
                }}
              >
                Réinitialiser
              </Button>
            )}
          </div>
        </form>

        {/* Search hint */}
        {searchQuery && (
          <p className="mt-2 text-sm text-gray-600">
            {searchQuery.match(/^CLI-\d{0,6}$/)
              ? `Recherche par code: ${searchQuery}`
              : `Recherche par nom: ${searchQuery}`}
          </p>
        )}
      </div>

      {/* Clients Table */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-6">
        <div className="bg-white rounded-lg shadow overflow-hidden">
          {isLoading ? (
            <div className="p-12 text-center">
              <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
              <p className="mt-4 text-gray-600">Chargement des clients...</p>
            </div>
          ) : error ? (
            <div className="p-12 text-center">
              <p className="text-red-600">
                Erreur lors du chargement des clients
              </p>
              <p className="text-sm text-gray-600 mt-2">{String(error)}</p>
            </div>
          ) : clients.length === 0 ? (
            <div className="p-12 text-center">
              <Users className="mx-auto h-12 w-12 text-gray-400" />
              <p className="mt-4 text-gray-600">Aucun client trouvé</p>
              {searchQuery && (
                <Button
                  variant="outline"
                  onClick={() => {
                    setSearchQuery('');
                    setCurrentPage(1);
                  }}
                  className="mt-4"
                >
                  Réinitialiser la recherche
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
                      onClick={() => toggleSort('client_code')}
                    >
                      Code Client{' '}
                      {sortField === 'client_code' && (sortOrder === 'asc' ? '↑' : '↓')}
                    </th>
                    <th
                      className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                      onClick={() => toggleSort('first_name')}
                    >
                      Prénom{' '}
                      {sortField === 'first_name' && (sortOrder === 'asc' ? '↑' : '↓')}
                    </th>
                    <th
                      className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                      onClick={() => toggleSort('last_name')}
                    >
                      Nom{' '}
                      {sortField === 'last_name' && (sortOrder === 'asc' ? '↑' : '↓')}
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Téléphone
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Réservations
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Adresses
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Marché
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
                  {clients.map((client) => (
                    <tr
                      key={client.id}
                      className="hover:bg-gray-50 transition-colors"
                    >
                      <td className="px-6 py-4 whitespace-nowrap">
                        <CodeDisplay
                          code={client.client_code}
                          type="client"
                          size="sm"
                        />
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900">
                          {client.first_name || '-'}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">
                          {client.last_name || '-'}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-600">
                          {client.phone || '-'}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="px-2 py-1 text-xs font-medium bg-blue-100 text-blue-800 rounded-full">
                          {client._count?.bookings || 0}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="px-2 py-1 text-xs font-medium bg-gray-100 text-gray-800 rounded-full">
                          {client._count?.addresses || 0}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {client.market ? (
                          <span className="px-2 py-1 text-xs font-medium bg-purple-100 text-purple-800 rounded-full">
                            {client.market.code}
                          </span>
                        ) : (
                          <span className="text-xs text-gray-400">-</span>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                        {new Date(client.created_at).toLocaleDateString('fr-FR')}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        <Link
                          href={`/admin/clients/${client.id}`}
                          className="text-blue-600 hover:text-blue-900"
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
                        clients au total)
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
