/**
 * React Query Hooks for Admin Application Management
 * Feature: 007-contractor-interface (Phase 2 - Admin Review)
 * Tasks: T035, T037, T039, T041
 */

import { useMutation, useQueryClient } from '@tanstack/react-query'
import { createClient } from '@/lib/supabase/client'
import type { InterviewMode } from '@/types/contractor'

// ============================================================================
// Types
// ============================================================================

interface ScheduleInterviewData {
  applicationId: number
  interviewDate: string
  interviewMode: InterviewMode
  interviewNotes?: string
}

interface ApproveApplicationData {
  applicationId: number
  customSlug?: string
  sendEmail?: boolean
}

interface RejectApplicationData {
  applicationId: number
  rejectionReason: string
  sendEmail?: boolean
}

interface DeleteApplicationData {
  applicationId: number
}

// ============================================================================
// Mutations
// ============================================================================

/**
 * Schedule Interview Mutation
 * Calls the schedule-interview edge function
 */
export function useScheduleInterview() {
  const queryClient = useQueryClient()
  const supabase = createClient()

  return useMutation({
    mutationFn: async (data: ScheduleInterviewData) => {
      const { data: result, error } = await supabase.functions.invoke('schedule-interview', {
        body: {
          applicationId: data.applicationId,
          interviewDate: data.interviewDate,
          interviewMode: data.interviewMode,
          interviewNotes: data.interviewNotes,
        },
      })

      if (error) {
        console.error('Error scheduling interview:', error)
        throw error
      }

      return result
    },
    onSuccess: () => {
      // Invalidate applications list query to refetch updated data
      queryClient.invalidateQueries({ queryKey: ['contractor-applications'] })
    },
  })
}

/**
 * Approve Application Mutation
 * Calls the approve-contractor-application edge function
 * Creates contractor account, profile, and onboarding status
 */
export function useApproveApplication() {
  const queryClient = useQueryClient()
  const supabase = createClient()

  return useMutation({
    mutationFn: async (data: ApproveApplicationData) => {
      const { data: result, error } = await supabase.functions.invoke('approve-contractor-application', {
        body: {
          applicationId: data.applicationId,
          customSlug: data.customSlug,
          sendEmail: data.sendEmail ?? true,
        },
      })

      if (error) {
        console.error('Error approving application:', error)
        throw error
      }

      return result
    },
    onSuccess: () => {
      // Invalidate applications list query
      queryClient.invalidateQueries({ queryKey: ['contractor-applications'] })
      // Invalidate contractors list (if exists)
      queryClient.invalidateQueries({ queryKey: ['contractors'] })
    },
  })
}

/**
 * Reject Application Mutation
 * Calls the reject-application edge function
 */
export function useRejectApplication() {
  const queryClient = useQueryClient()
  const supabase = createClient()

  return useMutation({
    mutationFn: async (data: RejectApplicationData) => {
      const { data: result, error } = await supabase.functions.invoke('reject-application', {
        body: {
          applicationId: data.applicationId,
          rejectionReason: data.rejectionReason,
          sendEmail: data.sendEmail ?? true,
        },
      })

      if (error) {
        console.error('Error rejecting application:', error)
        throw error
      }

      return result
    },
    onSuccess: () => {
      // Invalidate applications list query
      queryClient.invalidateQueries({ queryKey: ['contractor-applications'] })
    },
  })
}

/**
 * Delete Application Mutation
 * Calls the delete-application edge function
 * Deletes rejected applications and their associated files
 * Per FR-020a: Only rejected applications can be deleted
 */
export function useDeleteApplication() {
  const queryClient = useQueryClient()
  const supabase = createClient()

  return useMutation({
    mutationFn: async (data: DeleteApplicationData) => {
      const { data: result, error } = await supabase.functions.invoke('delete-application', {
        body: {
          applicationId: data.applicationId,
        },
      })

      if (error) {
        console.error('Error deleting application:', error)
        throw error
      }

      return result
    },
    onSuccess: () => {
      // Invalidate applications list query
      queryClient.invalidateQueries({ queryKey: ['contractor-applications'] })
    },
  })
}
