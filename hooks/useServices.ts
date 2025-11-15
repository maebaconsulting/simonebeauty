// React Query Hooks for Services
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { serviceRepository } from '@/lib/repositories/service-repository'
import type { DbService } from '@/types/database'
import type { ServiceQueryParams } from '@/lib/validations/booking-schemas'

// Query Keys
export const serviceKeys = {
  all: ['services'] as const,
  lists: () => [...serviceKeys.all, 'list'] as const,
  list: (params?: ServiceQueryParams) => [...serviceKeys.lists(), params] as const,
  details: () => [...serviceKeys.all, 'detail'] as const,
  detail: (id: number) => [...serviceKeys.details(), id] as const,
  bySlug: (slug: string) => [...serviceKeys.all, 'slug', slug] as const,
  byCategory: (category: string) => [...serviceKeys.all, 'category', category] as const,
  featured: () => [...serviceKeys.all, 'featured'] as const,
  categories: () => [...serviceKeys.all, 'categories'] as const,
}

/**
 * Get all services with optional filtering
 */
export function useServices(params?: ServiceQueryParams) {
  return useQuery({
    queryKey: serviceKeys.list(params),
    queryFn: () => serviceRepository.getServices(params),
    staleTime: 5 * 60 * 1000, // 5 minutes
  })
}

/**
 * Get a single service by ID
 */
export function useService(id: number) {
  return useQuery({
    queryKey: serviceKeys.detail(id),
    queryFn: () => serviceRepository.getServiceById(id),
    enabled: !!id,
    staleTime: 5 * 60 * 1000,
  })
}

/**
 * Get a single service by slug
 */
export function useServiceBySlug(slug: string) {
  return useQuery({
    queryKey: serviceKeys.bySlug(slug),
    queryFn: () => serviceRepository.getServiceBySlug(slug),
    enabled: !!slug,
    staleTime: 5 * 60 * 1000,
  })
}

/**
 * Get services by category
 */
export function useServicesByCategory(category: string) {
  return useQuery({
    queryKey: serviceKeys.byCategory(category),
    queryFn: () => serviceRepository.getServicesByCategory(category),
    enabled: !!category,
    staleTime: 5 * 60 * 1000,
  })
}

/**
 * Get featured services
 */
export function useFeaturedServices() {
  return useQuery({
    queryKey: serviceKeys.featured(),
    queryFn: () => serviceRepository.getFeaturedServices(),
    staleTime: 10 * 60 * 1000, // 10 minutes for featured
  })
}

/**
 * Get service categories with counts
 */
export function useServiceCategories() {
  return useQuery({
    queryKey: serviceKeys.categories(),
    queryFn: () => serviceRepository.getServiceCategories(),
    staleTime: 10 * 60 * 1000,
  })
}

/**
 * Create a new service (admin only)
 */
export function useCreateService() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: serviceRepository.createService.bind(serviceRepository),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: serviceKeys.lists() })
    },
  })
}

/**
 * Update a service (admin only)
 */
export function useUpdateService() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ id, updates }: { id: number; updates: Partial<DbService> }) =>
      serviceRepository.updateService(id, updates),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: serviceKeys.detail(data.id) })
      queryClient.invalidateQueries({ queryKey: serviceKeys.lists() })
    },
  })
}

/**
 * Delete a service (admin only)
 */
export function useDeleteService() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (id: number) => serviceRepository.deleteService(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: serviceKeys.lists() })
    },
  })
}
