/**
 * React Query hooks for contractor code operations
 * Feature: 018-international-market-segmentation
 */

import { useQuery } from '@tanstack/react-query';
import type {
  ContractorWithCode,
  ContractorDetailResponse,
  ContractorListResponse,
} from '@/types/code';

/**
 * Fetch contractor by unique code
 */
async function fetchContractorByCode(
  code: string
): Promise<ContractorDetailResponse> {
  const response = await fetch(`/api/admin/contractors/${code}`);

  if (!response.ok) {
    const error = await response.json();
    throw new Error(
      error.error || 'Erreur lors de la récupération du prestataire'
    );
  }

  return response.json();
}

/**
 * Search contractors (with optional code search)
 */
async function searchContractors(params: {
  search?: string;
  market_id?: number;
  is_active?: boolean;
  page?: number;
  limit?: number;
  sort?: string;
  order?: 'asc' | 'desc';
}): Promise<ContractorListResponse> {
  const searchParams = new URLSearchParams();

  if (params.search) searchParams.set('search', params.search);
  if (params.market_id)
    searchParams.set('market_id', params.market_id.toString());
  if (params.is_active !== undefined)
    searchParams.set('is_active', params.is_active.toString());
  if (params.page) searchParams.set('page', params.page.toString());
  if (params.limit) searchParams.set('limit', params.limit.toString());
  if (params.sort) searchParams.set('sort', params.sort);
  if (params.order) searchParams.set('order', params.order);

  const response = await fetch(
    `/api/admin/contractors?${searchParams.toString()}`
  );

  if (!response.ok) {
    const error = await response.json();
    throw new Error(
      error.error || 'Erreur lors de la recherche de prestataires'
    );
  }

  return response.json();
}

/**
 * Hook to fetch contractor by unique code
 *
 * @param code - Contractor code in CTR-XXXXXX format
 * @param options - React Query options
 *
 * @example
 * ```tsx
 * const { data: contractor, isLoading, error } = useContractorByCode('CTR-000001');
 * ```
 */
export function useContractorByCode(
  code: string | null | undefined,
  options?: {
    enabled?: boolean;
  }
) {
  return useQuery({
    queryKey: ['contractor', 'code', code],
    queryFn: () => fetchContractorByCode(code!),
    enabled: !!code && (options?.enabled ?? true),
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
}

/**
 * Hook to search contractors with optional code search
 *
 * @param params - Search parameters
 * @param options - React Query options
 *
 * @example
 * ```tsx
 * const { data, isLoading } = useSearchContractors({
 *   search: 'CTR-000',
 *   market_id: 1,
 *   page: 1,
 *   limit: 20,
 * });
 * ```
 */
export function useSearchContractors(
  params: {
    search?: string;
    market_id?: number;
    is_active?: boolean;
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
    queryKey: ['contractors', 'search', params],
    queryFn: () => searchContractors(params),
    enabled: options?.enabled ?? true,
    staleTime: 1 * 60 * 1000, // 1 minute
  });
}

/**
 * Type exports for convenience
 */
export type {
  ContractorWithCode,
  ContractorDetailResponse,
  ContractorListResponse,
};
