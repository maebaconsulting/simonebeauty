'use client'

/**
 * Admin Applications List Page
 * Task: T033 - Applications list with status filters
 * Feature: 007-contractor-interface
 */

import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { createClient } from '@/lib/supabase/client'
import { ApplicationCard } from '@/components/admin/ApplicationCard'
import { ScheduleInterviewModal } from '@/components/admin/ScheduleInterviewModal'
import { ApproveApplicationModal } from '@/components/admin/ApproveApplicationModal'
import { RejectApplicationModal } from '@/components/admin/RejectApplicationModal'
import { DeleteApplicationModal } from '@/components/admin/DeleteApplicationModal'
import { ApplicationStatus, ContractorApplication } from '@/types/contractor'
import { Button } from '@/components/ui/button'
import { Search, Filter, FileText } from 'lucide-react'
import {
  useScheduleInterview,
  useApproveApplication,
  useRejectApplication,
  useDeleteApplication,
} from '@/hooks/useAdminApplications'

const STATUS_FILTERS: { value: ApplicationStatus | 'all', label: string, count?: number }[] = [
  { value: 'all', label: 'Toutes' },
  { value: 'pending', label: 'En attente' },
  { value: 'interview_scheduled', label: 'Entretien planifié' },
  { value: 'approved', label: 'Approuvées' },
  { value: 'rejected', label: 'Refusées' },
]

export default function AdminApplicationsPage() {
  const [statusFilter, setStatusFilter] = useState<ApplicationStatus | 'all'>('all')
  const [searchQuery, setSearchQuery] = useState('')

  // Modal state
  const [selectedApplication, setSelectedApplication] = useState<ContractorApplication | null>(null)
  const [isScheduleModalOpen, setIsScheduleModalOpen] = useState(false)
  const [isApproveModalOpen, setIsApproveModalOpen] = useState(false)
  const [isRejectModalOpen, setIsRejectModalOpen] = useState(false)
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false)

  // Mutations
  const scheduleInterviewMutation = useScheduleInterview()
  const approveApplicationMutation = useApproveApplication()
  const rejectApplicationMutation = useRejectApplication()
  const deleteApplicationMutation = useDeleteApplication()

  // Fetch applications
  const { data: applications, isLoading, error, refetch } = useQuery({
    queryKey: ['contractor-applications', statusFilter],
    queryFn: async () => {
      const supabase = createClient()

      let query = supabase
        .from('contractor_applications')
        .select('*')
        .order('submitted_at', { ascending: false })

      // Apply status filter
      if (statusFilter !== 'all') {
        query = query.eq('status', statusFilter)
      }

      const { data, error } = await query

      if (error) {
        console.error('Error fetching applications:', error)
        throw error
      }

      return data as ContractorApplication[]
    },
  })

  // Filter applications by search query (client-side)
  const filteredApplications = applications?.filter(app => {
    if (!searchQuery) return true

    const searchLower = searchQuery.toLowerCase()
    return (
      app.first_name.toLowerCase().includes(searchLower) ||
      app.last_name.toLowerCase().includes(searchLower) ||
      app.email.toLowerCase().includes(searchLower) ||
      app.phone.includes(searchQuery) ||
      app.profession.toLowerCase().includes(searchLower)
    )
  })

  // Count applications by status
  const statusCounts = applications?.reduce((acc, app) => {
    acc[app.status] = (acc[app.status] || 0) + 1
    return acc
  }, {} as Record<string, number>)

  // Modal handlers
  const handleScheduleInterview = (applicationId: number) => {
    const application = applications?.find(app => app.id === applicationId)
    if (application) {
      setSelectedApplication(application)
      setIsScheduleModalOpen(true)
    }
  }

  const handleApprove = (applicationId: number) => {
    const application = applications?.find(app => app.id === applicationId)
    if (application) {
      setSelectedApplication(application)
      setIsApproveModalOpen(true)
    }
  }

  const handleReject = (applicationId: number) => {
    const application = applications?.find(app => app.id === applicationId)
    if (application) {
      setSelectedApplication(application)
      setIsRejectModalOpen(true)
    }
  }

  const handleDelete = (applicationId: number) => {
    const application = applications?.find(app => app.id === applicationId)
    if (application) {
      setSelectedApplication(application)
      setIsDeleteModalOpen(true)
    }
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">
                Candidatures Prestataires
              </h1>
              <p className="mt-1 text-sm text-gray-600">
                Gérer les candidatures reçues via le formulaire public
              </p>
            </div>

            <div className="flex items-center gap-3">
              <div className="text-right">
                <div className="text-2xl font-bold text-gray-900">
                  {applications?.length || 0}
                </div>
                <div className="text-sm text-gray-600">
                  {statusFilter === 'all' ? 'Total' : STATUS_FILTERS.find(f => f.value === statusFilter)?.label}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Filters */}
        <div className="bg-white rounded-lg border border-gray-200 p-6 mb-6">
          <div className="flex flex-col md:flex-row gap-4">
            {/* Status Filter */}
            <div className="flex-1">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <Filter className="w-4 h-4 inline mr-1" />
                Filtrer par statut
              </label>
              <div className="flex flex-wrap gap-2">
                {STATUS_FILTERS.map(filter => {
                  const count = filter.value === 'all'
                    ? applications?.length
                    : statusCounts?.[filter.value] || 0

                  return (
                    <button
                      key={filter.value}
                      onClick={() => setStatusFilter(filter.value)}
                      className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                        statusFilter === filter.value
                          ? 'bg-button-primary text-white'
                          : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                      }`}
                    >
                      {filter.label}
                      {count !== undefined && (
                        <span className={`ml-2 px-2 py-0.5 rounded-full text-xs ${
                          statusFilter === filter.value
                            ? 'bg-white/20'
                            : 'bg-gray-200'
                        }`}>
                          {count}
                        </span>
                      )}
                    </button>
                  )
                })}
              </div>
            </div>

            {/* Search */}
            <div className="md:w-80">
              <label htmlFor="search" className="block text-sm font-medium text-gray-700 mb-2">
                <Search className="w-4 h-4 inline mr-1" />
                Rechercher
              </label>
              <input
                type="text"
                id="search"
                placeholder="Nom, email, téléphone, profession..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-button-primary focus:border-transparent"
              />
            </div>
          </div>
        </div>

        {/* Applications List */}
        {isLoading ? (
          <div className="text-center py-12">
            <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-button-primary"></div>
            <p className="mt-4 text-gray-600">Chargement des candidatures...</p>
          </div>
        ) : error ? (
          <div className="bg-red-50 border border-red-200 rounded-lg p-6 text-center">
            <p className="text-red-800">
              Erreur lors du chargement des candidatures.
            </p>
            <Button
              onClick={() => refetch()}
              variant="outline"
              className="mt-4"
            >
              Réessayer
            </Button>
          </div>
        ) : filteredApplications && filteredApplications.length > 0 ? (
          <div className="space-y-4">
            {filteredApplications.map(application => (
              <ApplicationCard
                key={application.id}
                application={application}
                onScheduleInterview={handleScheduleInterview}
                onApprove={handleApprove}
                onReject={handleReject}
                onDelete={handleDelete}
              />
            ))}
          </div>
        ) : (
          <div className="bg-white rounded-lg border border-gray-200 p-12 text-center">
            <FileText className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              Aucune candidature trouvée
            </h3>
            <p className="text-gray-600">
              {searchQuery
                ? 'Aucune candidature ne correspond à votre recherche.'
                : statusFilter === 'all'
                ? 'Aucune candidature n\'a encore été soumise.'
                : `Aucune candidature avec le statut "${STATUS_FILTERS.find(f => f.value === statusFilter)?.label}".`
              }
            </p>
            {searchQuery && (
              <Button
                onClick={() => setSearchQuery('')}
                variant="outline"
                className="mt-4"
              >
                Effacer la recherche
              </Button>
            )}
          </div>
        )}
      </div>

      {/* Modals */}
      {selectedApplication && (
        <>
          <ScheduleInterviewModal
            isOpen={isScheduleModalOpen}
            onClose={() => setIsScheduleModalOpen(false)}
            onSchedule={async (data) => {
              await scheduleInterviewMutation.mutateAsync({
                applicationId: selectedApplication.id,
                interviewDate: data.interviewDate,
                interviewMode: data.interviewMode,
                interviewNotes: data.interviewNotes,
              })
            }}
            candidateName={`${selectedApplication.first_name} ${selectedApplication.last_name}`}
          />

          <ApproveApplicationModal
            isOpen={isApproveModalOpen}
            onClose={() => setIsApproveModalOpen(false)}
            onApprove={async (data) => {
              await approveApplicationMutation.mutateAsync({
                applicationId: selectedApplication.id,
                customSlug: data.slug,
                sendEmail: data.sendEmail,
              })
            }}
            candidateEmail={selectedApplication.email}
            candidateName={`${selectedApplication.first_name} ${selectedApplication.last_name}`}
          />

          <RejectApplicationModal
            isOpen={isRejectModalOpen}
            onClose={() => setIsRejectModalOpen(false)}
            onReject={async (data) => {
              await rejectApplicationMutation.mutateAsync({
                applicationId: selectedApplication.id,
                rejectionReason: data.rejectionReason,
                sendEmail: data.sendEmail,
              })
            }}
            candidateName={`${selectedApplication.first_name} ${selectedApplication.last_name}`}
            candidateEmail={selectedApplication.email}
          />

          <DeleteApplicationModal
            isOpen={isDeleteModalOpen}
            onClose={() => setIsDeleteModalOpen(false)}
            onDelete={async () => {
              await deleteApplicationMutation.mutateAsync({
                applicationId: selectedApplication.id,
              })
            }}
            candidateName={`${selectedApplication.first_name} ${selectedApplication.last_name}`}
            candidateEmail={selectedApplication.email}
            applicationStatus={selectedApplication.status}
          />
        </>
      )}
    </div>
  )
}
