/**
 * React Query hooks for market operations
 * Feature: 018-international-market-segmentation
 * User Story 1: Market Configuration
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import type {
  Market,
  MarketWithStats,
  MarketListResponse,
  MarketDetailResponse,
  CreateMarketInput,
  UpdateMarketInput,
  MarketListQuery,
} from '@/types/market';

/**
 * Fetch all markets with pagination and filters
 */
async function fetchMarkets(params: MarketListQuery = {}): Promise<MarketListResponse> {
  const searchParams = new URLSearchParams();

  if (params.page) searchParams.set('page', params.page.toString());
  if (params.limit) searchParams.set('limit', params.limit.toString());
  if (params.is_active !== undefined)
    searchParams.set('is_active', params.is_active.toString());
  if (params.search) searchParams.set('search', params.search);
  if (params.sort) searchParams.set('sort', params.sort);
  if (params.order) searchParams.set('order', params.order);

  const response = await fetch(`/api/admin/markets?${searchParams.toString()}`);

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Erreur lors de la récupération des marchés');
  }

  return response.json();
}

/**
 * Fetch single market by ID
 */
async function fetchMarketById(id: number): Promise<MarketDetailResponse> {
  const response = await fetch(`/api/admin/markets/${id}`);

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Erreur lors de la récupération du marché');
  }

  return response.json();
}

/**
 * Create a new market
 */
async function createMarket(
  input: CreateMarketInput
): Promise<{ data: Market; message: string }> {
  const response = await fetch('/api/admin/markets', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(input),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Erreur lors de la création du marché');
  }

  return response.json();
}

/**
 * Update an existing market
 */
async function updateMarket(
  id: number,
  input: UpdateMarketInput
): Promise<{ data: Market; message: string }> {
  const response = await fetch(`/api/admin/markets/${id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(input),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Erreur lors de la mise à jour du marché');
  }

  return response.json();
}

/**
 * Soft delete (deactivate) a market
 */
async function deleteMarket(id: number): Promise<{ message: string }> {
  const response = await fetch(`/api/admin/markets/${id}`, {
    method: 'DELETE',
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Erreur lors de la désactivation du marché');
  }

  return response.json();
}

/**
 * Hook to fetch markets list
 *
 * @param params - Query parameters for filtering, pagination, sorting
 * @param options - React Query options
 *
 * @example
 * ```tsx
 * const { data, isLoading } = useMarkets({ is_active: true, page: 1 });
 * ```
 */
export function useMarkets(
  params: MarketListQuery = {},
  options?: {
    enabled?: boolean;
  }
) {
  return useQuery({
    queryKey: ['markets', 'list', params],
    queryFn: () => fetchMarkets(params),
    enabled: options?.enabled ?? true,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
}

/**
 * Hook to fetch single market by ID
 *
 * @param id - Market ID
 * @param options - React Query options
 *
 * @example
 * ```tsx
 * const { data: market, isLoading } = useMarket(1);
 * ```
 */
export function useMarket(
  id: number | null | undefined,
  options?: {
    enabled?: boolean;
  }
) {
  return useQuery({
    queryKey: ['markets', 'detail', id],
    queryFn: () => fetchMarketById(id!),
    enabled: !!id && (options?.enabled ?? true),
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
}

/**
 * Hook to create a new market
 *
 * @example
 * ```tsx
 * const createMarket = useCreateMarket();
 *
 * const handleSubmit = async (data) => {
 *   await createMarket.mutateAsync(data);
 * };
 * ```
 */
export function useCreateMarket() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: createMarket,
    onSuccess: () => {
      // Invalidate markets list to refetch
      queryClient.invalidateQueries({ queryKey: ['markets', 'list'] });
    },
  });
}

/**
 * Hook to update an existing market
 *
 * @example
 * ```tsx
 * const updateMarket = useUpdateMarket();
 *
 * const handleSubmit = async (id, data) => {
 *   await updateMarket.mutateAsync({ id, data });
 * };
 * ```
 */
export function useUpdateMarket() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: { id: number; data: UpdateMarketInput }) =>
      updateMarket(id, data),
    onSuccess: (_, variables) => {
      // Invalidate specific market and list
      queryClient.invalidateQueries({ queryKey: ['markets', 'detail', variables.id] });
      queryClient.invalidateQueries({ queryKey: ['markets', 'list'] });
    },
  });
}

/**
 * Hook to delete (deactivate) a market
 *
 * @example
 * ```tsx
 * const deleteMarket = useDeleteMarket();
 *
 * const handleDelete = async (id) => {
 *   if (confirm('Êtes-vous sûr ?')) {
 *     await deleteMarket.mutateAsync(id);
 *   }
 * };
 * ```
 */
export function useDeleteMarket() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: deleteMarket,
    onSuccess: () => {
      // Invalidate markets list to refetch
      queryClient.invalidateQueries({ queryKey: ['markets', 'list'] });
    },
  });
}

/**
 * Type exports for convenience
 */
export type {
  Market,
  MarketWithStats,
  MarketListResponse,
  MarketDetailResponse,
  CreateMarketInput,
  UpdateMarketInput,
  MarketListQuery,
};
