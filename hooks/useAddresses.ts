// React Query Hooks for Client Addresses
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { clientAddressRepository } from '@/lib/repositories/client-address-repository'
import type { DbClientAddress, DbClientAddressInsert, DbClientAddressUpdate } from '@/types/database'

// Query Keys
export const addressKeys = {
  all: ['addresses'] as const,
  lists: () => [...addressKeys.all, 'list'] as const,
  list: (clientId: string) => [...addressKeys.lists(), clientId] as const,
  details: () => [...addressKeys.all, 'detail'] as const,
  detail: (id: number) => [...addressKeys.details(), id] as const,
  default: (clientId: string) => [...addressKeys.all, 'default', clientId] as const,
}

/**
 * Get all addresses for current client
 */
export function useClientAddresses(clientId: string) {
  return useQuery({
    queryKey: addressKeys.list(clientId),
    queryFn: () => clientAddressRepository.getClientAddresses(clientId),
    enabled: !!clientId,
    staleTime: 2 * 60 * 1000, // 2 minutes
  })
}

/**
 * Get a single address by ID
 */
export function useAddress(id: number) {
  return useQuery({
    queryKey: addressKeys.detail(id),
    queryFn: () => clientAddressRepository.getAddressById(id),
    enabled: !!id,
    staleTime: 2 * 60 * 1000,
  })
}

/**
 * Get default address for current client
 */
export function useDefaultAddress(clientId: string) {
  return useQuery({
    queryKey: addressKeys.default(clientId),
    queryFn: () => clientAddressRepository.getDefaultAddress(clientId),
    enabled: !!clientId,
    staleTime: 2 * 60 * 1000,
  })
}

/**
 * Create a new address
 */
export function useCreateAddress() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (address: DbClientAddressInsert) =>
      clientAddressRepository.createAddress(address),
    onSuccess: (data) => {
      // Invalidate address lists for this client
      queryClient.invalidateQueries({ queryKey: addressKeys.list(data.client_id) })
      if (data.is_default) {
        queryClient.invalidateQueries({ queryKey: addressKeys.default(data.client_id) })
      }
    },
  })
}

/**
 * Update an address
 */
export function useUpdateAddress() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ id, updates }: { id: number; updates: DbClientAddressUpdate }) =>
      clientAddressRepository.updateAddress(id, updates),
    onSuccess: async (data) => {
      // Update cache for this specific address
      queryClient.setQueryData(addressKeys.detail(data.id), data)

      // Invalidate lists
      queryClient.invalidateQueries({ queryKey: addressKeys.list(data.client_id) })

      // If default status changed, invalidate default address
      if (data.is_default) {
        queryClient.invalidateQueries({ queryKey: addressKeys.default(data.client_id) })
      }
    },
  })
}

/**
 * Delete an address (soft delete)
 */
export function useDeleteAddress() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({ id, clientId }: { id: number; clientId: string }) => {
      await clientAddressRepository.deleteAddress(id)
      return { id, clientId }
    },
    onSuccess: ({ clientId }) => {
      queryClient.invalidateQueries({ queryKey: addressKeys.list(clientId) })
      queryClient.invalidateQueries({ queryKey: addressKeys.default(clientId) })
    },
  })
}

/**
 * Set an address as default
 */
export function useSetDefaultAddress() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ id, clientId }: { id: number; clientId: string }) =>
      clientAddressRepository.setAsDefault(id, clientId),
    onSuccess: (data) => {
      // Update cache for this address
      queryClient.setQueryData(addressKeys.detail(data.id), data)

      // Invalidate lists and default
      queryClient.invalidateQueries({ queryKey: addressKeys.list(data.client_id) })
      queryClient.invalidateQueries({ queryKey: addressKeys.default(data.client_id) })
    },
  })
}

/**
 * Search addresses by query
 */
export function useSearchAddresses(clientId: string, query: string) {
  return useQuery({
    queryKey: [...addressKeys.list(clientId), 'search', query],
    queryFn: () => clientAddressRepository.searchAddresses(clientId, query),
    enabled: !!clientId && query.length >= 2,
    staleTime: 30 * 1000, // 30 seconds for search results
  })
}
