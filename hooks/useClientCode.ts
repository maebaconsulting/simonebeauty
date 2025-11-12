/**
 * React Query hooks for client code operations
 * Feature: 018-international-market-segmentation
 */

import { useQuery } from '@tanstack/react-query';
import type {
  ClientWithCode,
  ClientDetailResponse,
  ClientListResponse,
} from '@/types/code';

/**
 * Fetch client by unique code
 */
async function fetchClientByCode(
  code: string
): Promise<ClientDetailResponse> {
  const response = await fetch(`/api/admin/clients/${code}`);

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Erreur lors de la récupération du client');
  }

  return response.json();
}

/**
 * Search clients (with optional code search)
 */
async function searchClients(params: {
  search?: string;
  page?: number;
  limit?: number;
  sort?: string;
  order?: 'asc' | 'desc';
}): Promise<ClientListResponse> {
  const searchParams = new URLSearchParams();

  if (params.search) searchParams.set('search', params.search);
  if (params.page) searchParams.set('page', params.page.toString());
  if (params.limit) searchParams.set('limit', params.limit.toString());
  if (params.sort) searchParams.set('sort', params.sort);
  if (params.order) searchParams.set('order', params.order);

  const response = await fetch(`/api/admin/clients?${searchParams.toString()}`);

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Erreur lors de la recherche de clients');
  }

  return response.json();
}

/**
 * Hook to fetch client by unique code
 *
 * @param code - Client code in CLI-XXXXXX format
 * @param options - React Query options
 *
 * @example
 * ```tsx
 * const { data: client, isLoading, error } = useClientByCode('CLI-000001');
 * ```
 */
export function useClientByCode(
  code: string | null | undefined,
  options?: {
    enabled?: boolean;
  }
) {
  return useQuery({
    queryKey: ['client', 'code', code],
    queryFn: () => fetchClientByCode(code!),
    enabled: !!code && (options?.enabled ?? true),
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
}

/**
 * Hook to search clients with optional code search
 *
 * @param params - Search parameters
 * @param options - React Query options
 *
 * @example
 * ```tsx
 * const { data, isLoading } = useSearchClients({
 *   search: 'CLI-000',
 *   page: 1,
 *   limit: 20,
 * });
 * ```
 */
export function useSearchClients(
  params: {
    search?: string;
    page?: number;
    limit?: number;
    sort?: string;
    order?: 'asc' | 'desc';
  } = {},
  options?: {
    enabled?: boolean;
  }
) {
  return useQuery({
    queryKey: ['clients', 'search', params],
    queryFn: () => searchClients(params),
    enabled: options?.enabled ?? true,
    staleTime: 1 * 60 * 1000, // 1 minute
  });
}

/**
 * Type exports for convenience
 */
export type { ClientWithCode, ClientDetailResponse, ClientListResponse };
