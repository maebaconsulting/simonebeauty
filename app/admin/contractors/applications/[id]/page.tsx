'use client'

/**
 * Admin Application Detail Page
 * Task: T035 - Full candidate profile, document viewer, comment section
 * Feature: 007-contractor-interface
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { createClient } from '@/lib/supabase/client'
import { ContractorApplication } from '@/types/contractor'
import { Button } from '@/components/ui/button'
import {
  ArrowLeft, User, Mail, Phone, MapPin, Briefcase, Clock, Calendar,
  FileText, Download, MessageSquare, CheckCircle, XCircle, Video,
  DollarSign, MapPinned, Trash2
} from 'lucide-react'
import Link from 'next/link'
import { useState } from 'react'
import { ScheduleInterviewModal } from '@/components/admin/ScheduleInterviewModal'
import { ApproveApplicationModal } from '@/components/admin/ApproveApplicationModal'
import { RejectApplicationModal } from '@/components/admin/RejectApplicationModal'
import { DeleteApplicationModal } from '@/components/admin/DeleteApplicationModal'
import {
  useScheduleInterview,
  useApproveApplication,
  useRejectApplication,
  useDeleteApplication,
} from '@/hooks/useAdminApplications'

interface Props {
  params: { id: string }
}

export default function ApplicationDetailPage({ params }: Props) {
  const { id } = params
  const queryClient = useQueryClient()
  const [adminComment, setAdminComment] = useState('')

  // Modal state
  const [isScheduleModalOpen, setIsScheduleModalOpen] = useState(false)
  const [isApproveModalOpen, setIsApproveModalOpen] = useState(false)
  const [isRejectModalOpen, setIsRejectModalOpen] = useState(false)
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false)

  // Mutations
  const scheduleInterviewMutation = useScheduleInterview()
  const approveApplicationMutation = useApproveApplication()
  const rejectApplicationMutation = useRejectApplication()
  const deleteApplicationMutation = useDeleteApplication()

  // Fetch application details
  const { data: application, isLoading, error } = useQuery({
    queryKey: ['contractor-application', id],
    queryFn: async () => {
      const supabase = createClient()

      const { data, error } = await supabase
        .from('contractor_applications')
        .select('*')
        .eq('id', id)
        .single()

      if (error) {
        console.error('Error fetching application:', error)
        throw error
      }

      return data as ContractorApplication
    },
  })

  // Update admin comments mutation
  const updateCommentsMutation = useMutation({
    mutationFn: async (comments: string) => {
      const supabase = createClient()

      const { error } = await supabase
        .from('contractor_applications')
        .update({
          admin_comments: comments,
          reviewed_at: new Date().toISOString(),
        })
        .eq('id', id)

      if (error) throw error
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['contractor-application', id] })
      setAdminComment('')
    },
  })

  const handleSaveComment = () => {
    if (adminComment.trim()) {
      const existingComments = application?.admin_comments || ''
      const timestamp = new Date().toLocaleString('fr-FR')
      const newComment = `[${timestamp}] ${adminComment}`
      const updatedComments = existingComments
        ? `${existingComments}\n\n${newComment}`
        : newComment

      updateCommentsMutation.mutate(updatedComments)
    }
  }

  const getStatusBadge = (status: string) => {
    const badges = {
      pending: { label: 'En attente', color: 'bg-yellow-100 text-yellow-800', icon: Clock },
      interview_scheduled: { label: 'Entretien planifié', color: 'bg-blue-100 text-blue-800', icon: Calendar },
      approved: { label: 'Approuvé', color: 'bg-green-100 text-green-800', icon: CheckCircle },
      rejected: { label: 'Refusé', color: 'bg-red-100 text-red-800', icon: XCircle },
    }
    const badge = badges[status as keyof typeof badges]
    const Icon = badge.icon

    return (
      <span className={`inline-flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium ${badge.color}`}>
        <Icon className="w-4 h-4" />
        {badge.label}
      </span>
    )
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('fr-FR', {
      day: '2-digit',
      month: 'long',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    })
  }

  const getWorkFrequencyLabel = (frequency: string) => {
    const labels = {
      full_time: 'Temps plein',
      part_time: 'Temps partiel',
      occasional: 'Occasionnel',
    }
    return labels[frequency as keyof typeof labels] || frequency
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-button-primary"></div>
          <p className="mt-4 text-gray-600">Chargement de la candidature...</p>
        </div>
      </div>
    )
  }

  if (error || !application) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <p className="text-red-600">Erreur lors du chargement de la candidature.</p>
          <Link href="/admin/contractors/applications">
            <Button variant="outline" className="mt-4">
              Retour à la liste
            </Button>
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Link href="/admin/contractors/applications">
                <Button variant="outline" size="sm">
                  <ArrowLeft className="w-4 h-4 mr-1" />
                  Retour
                </Button>
              </Link>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">
                  {application.first_name} {application.last_name}
                </h1>
                <p className="text-sm text-gray-600 mt-1">
                  Candidature #{application.id} • Soumise le {formatDate(application.submitted_at)}
                </p>
              </div>
            </div>
            {getStatusBadge(application.status)}
          </div>

          {/* Action Buttons */}
          <div className="flex gap-3 mt-4">
            {(application.status === 'pending' || application.status === 'interview_scheduled') && (
              <>
                <Button
                  onClick={() => setIsScheduleModalOpen(true)}
                  className="bg-blue-600 hover:bg-blue-700 text-white"
                >
                  <Calendar className="w-4 h-4 mr-2" />
                  Planifier entretien
                </Button>

                <Button
                  onClick={() => setIsApproveModalOpen(true)}
                  className="bg-green-600 hover:bg-green-700 text-white"
                >
                  <CheckCircle className="w-4 h-4 mr-2" />
                  Approuver
                </Button>

                <Button
                  onClick={() => setIsRejectModalOpen(true)}
                  className="bg-red-600 hover:bg-red-700 text-white"
                >
                  <XCircle className="w-4 h-4 mr-2" />
                  Refuser
                </Button>
              </>
            )}

            {/* Delete button - only for rejected applications (FR-020a) */}
            {application.status === 'rejected' && (
              <Button
                onClick={() => setIsDeleteModalOpen(true)}
                className="bg-red-800 hover:bg-red-900 text-white ml-auto"
              >
                <Trash2 className="w-4 h-4 mr-2" />
                Supprimer définitivement
              </Button>
            )}
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Personal Information */}
            <div className="bg-white rounded-lg border border-gray-200 p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                <User className="w-5 h-5" />
                Informations personnelles
              </h2>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-gray-700">Email</label>
                  <div className="mt-1 flex items-center gap-2 text-gray-900">
                    <Mail className="w-4 h-4 text-gray-400" />
                    <a href={`mailto:${application.email}`} className="hover:text-button-primary">
                      {application.email}
                    </a>
                  </div>
                </div>

                <div>
                  <label className="text-sm font-medium text-gray-700">Téléphone</label>
                  <div className="mt-1 flex items-center gap-2 text-gray-900">
                    <Phone className="w-4 h-4 text-gray-400" />
                    <a href={`tel:${application.phone}`} className="hover:text-button-primary">
                      {application.phone}
                    </a>
                  </div>
                </div>

                <div className="md:col-span-2">
                  <label className="text-sm font-medium text-gray-700">Adresse</label>
                  <div className="mt-1 flex items-start gap-2 text-gray-900">
                    <MapPin className="w-4 h-4 text-gray-400 mt-0.5" />
                    <span>{application.address}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Professional Profile */}
            <div className="bg-white rounded-lg border border-gray-200 p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                <Briefcase className="w-5 h-5" />
                Profil professionnel
              </h2>

              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium text-gray-700">Profession</label>
                    <p className="mt-1 text-gray-900 font-medium">{application.profession}</p>
                  </div>

                  <div>
                    <label className="text-sm font-medium text-gray-700">Expérience</label>
                    <p className="mt-1 text-gray-900">{application.years_of_experience} ans</p>
                  </div>
                </div>

                {application.diplomas && (
                  <div>
                    <label className="text-sm font-medium text-gray-700">Diplômes</label>
                    <p className="mt-1 text-gray-900">{application.diplomas}</p>
                  </div>
                )}

                <div>
                  <label className="text-sm font-medium text-gray-700">Services offerts</label>
                  <p className="mt-1 text-gray-900 whitespace-pre-wrap">{application.services_offered}</p>
                </div>
              </div>
            </div>

            {/* Availability & Geographic Zones */}
            <div className="bg-white rounded-lg border border-gray-200 p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                <MapPinned className="w-5 h-5" />
                Disponibilités et zones
              </h2>

              <div className="space-y-4">
                <div>
                  <label className="text-sm font-medium text-gray-700">Fréquence de travail</label>
                  <p className="mt-1 text-gray-900">{getWorkFrequencyLabel(application.work_frequency)}</p>
                </div>

                {application.preferred_schedule && (
                  <div>
                    <label className="text-sm font-medium text-gray-700">Horaires préférés</label>
                    <p className="mt-1 text-gray-900">{application.preferred_schedule}</p>
                  </div>
                )}

                <div>
                  <label className="text-sm font-medium text-gray-700 mb-2 block">
                    Zones géographiques ({application.geographic_zones.length})
                  </label>
                  <div className="flex flex-wrap gap-2">
                    {application.geographic_zones.map((zone, index) => (
                      <span key={index} className="px-3 py-1 bg-blue-50 text-blue-700 rounded-full text-sm">
                        {zone}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            {/* Motivation */}
            <div className="bg-white rounded-lg border border-gray-200 p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                <MessageSquare className="w-5 h-5" />
                Lettre de motivation
              </h2>
              <p className="text-gray-900 whitespace-pre-wrap leading-relaxed">
                {application.motivation}
              </p>
              <div className="mt-4 text-sm text-gray-500">
                {application.motivation.length} caractères
              </div>
            </div>

            {/* Documents */}
            {(application.cv_file_path || application.certifications_file_paths?.length || application.portfolio_file_paths?.length) && (
              <div className="bg-white rounded-lg border border-gray-200 p-6">
                <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                  <FileText className="w-5 h-5" />
                  Documents
                </h2>

                <div className="space-y-4">
                  {/* CV */}
                  {application.cv_file_path && (
                    <div>
                      <label className="text-sm font-medium text-gray-700 mb-2 block">CV</label>
                      <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                        <FileText className="w-5 h-5 text-blue-600" />
                        <span className="flex-1 text-sm text-gray-900">{application.cv_file_path.split('/').pop()}</span>
                        <Button variant="outline" size="sm">
                          <Download className="w-4 h-4 mr-1" />
                          Télécharger
                        </Button>
                      </div>
                    </div>
                  )}

                  {/* Certifications */}
                  {application.certifications_file_paths && application.certifications_file_paths.length > 0 && (
                    <div>
                      <label className="text-sm font-medium text-gray-700 mb-2 block">
                        Certifications ({application.certifications_file_paths.length})
                      </label>
                      <div className="space-y-2">
                        {application.certifications_file_paths.map((path, index) => (
                          <div key={index} className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                            <FileText className="w-5 h-5 text-green-600" />
                            <span className="flex-1 text-sm text-gray-900">{path.split('/').pop()}</span>
                            <Button variant="outline" size="sm">
                              <Download className="w-4 h-4 mr-1" />
                              Télécharger
                            </Button>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Portfolio */}
                  {application.portfolio_file_paths && application.portfolio_file_paths.length > 0 && (
                    <div>
                      <label className="text-sm font-medium text-gray-700 mb-2 block">
                        Portfolio ({application.portfolio_file_paths.length} photos)
                      </label>
                      <div className="grid grid-cols-3 gap-3">
                        {application.portfolio_file_paths.map((path, index) => (
                          <div key={index} className="relative group">
                            <div className="aspect-square bg-gray-200 rounded-lg overflow-hidden">
                              {/* TODO: Display actual image */}
                              <div className="w-full h-full flex items-center justify-center text-gray-400">
                                <FileText className="w-8 h-8" />
                              </div>
                            </div>
                            <Button
                              variant="outline"
                              size="sm"
                              className="mt-2 w-full"
                            >
                              <Download className="w-4 h-4 mr-1" />
                              Voir
                            </Button>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Interview Info */}
            {application.status === 'interview_scheduled' && application.interview_date && (
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
                <h3 className="text-lg font-semibold text-blue-900 mb-4 flex items-center gap-2">
                  <Calendar className="w-5 h-5" />
                  Entretien planifié
                </h3>

                <div className="space-y-3">
                  <div>
                    <label className="text-sm font-medium text-blue-700">Date et heure</label>
                    <p className="text-blue-900 font-medium">{formatDate(application.interview_date)}</p>
                  </div>

                  {application.interview_mode && (
                    <div>
                      <label className="text-sm font-medium text-blue-700">Mode</label>
                      <div className="flex items-center gap-2 mt-1">
                        {application.interview_mode === 'video' && <Video className="w-4 h-4 text-blue-600" />}
                        <p className="text-blue-900">
                          {application.interview_mode === 'video' ? 'Visioconférence' :
                           application.interview_mode === 'phone' ? 'Téléphone' :
                           'En personne'}
                        </p>
                      </div>
                    </div>
                  )}

                  {application.interview_notes && (
                    <div>
                      <label className="text-sm font-medium text-blue-700">Notes</label>
                      <p className="text-sm text-blue-800 mt-1">{application.interview_notes}</p>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Rejection Info */}
            {application.status === 'rejected' && application.rejection_reason && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-6">
                <h3 className="text-lg font-semibold text-red-900 mb-2">
                  Candidature refusée
                </h3>
                <div>
                  <label className="text-sm font-medium text-red-700">Raison</label>
                  <p className="text-sm text-red-800 mt-1">{application.rejection_reason}</p>
                </div>
              </div>
            )}

            {/* Admin Comments */}
            <div className="bg-white rounded-lg border border-gray-200 p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                <MessageSquare className="w-5 h-5" />
                Commentaires admin
              </h3>

              {application.admin_comments && (
                <div className="mb-4 p-4 bg-gray-50 rounded-lg">
                  <pre className="text-sm text-gray-700 whitespace-pre-wrap font-sans">
                    {application.admin_comments}
                  </pre>
                </div>
              )}

              <div>
                <textarea
                  value={adminComment}
                  onChange={(e) => setAdminComment(e.target.value)}
                  placeholder="Ajouter un commentaire interne..."
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-button-primary focus:border-transparent resize-none"
                  rows={4}
                />
                <Button
                  onClick={handleSaveComment}
                  disabled={!adminComment.trim() || updateCommentsMutation.isPending}
                  className="mt-2 w-full"
                >
                  {updateCommentsMutation.isPending ? 'Enregistrement...' : 'Enregistrer commentaire'}
                </Button>
              </div>
            </div>

            {/* Review Info */}
            {application.reviewed_at && (
              <div className="bg-gray-50 rounded-lg p-4 text-sm text-gray-600">
                <p>
                  <strong>Dernière révision:</strong><br />
                  {formatDate(application.reviewed_at)}
                </p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Modals */}
      {application && (
        <>
          <ScheduleInterviewModal
            isOpen={isScheduleModalOpen}
            onClose={() => setIsScheduleModalOpen(false)}
            onSchedule={async (data) => {
              await scheduleInterviewMutation.mutateAsync({
                applicationId: parseInt(id),
                interviewDate: data.interviewDate,
                interviewMode: data.interviewMode,
                interviewNotes: data.interviewNotes,
              })
              setIsScheduleModalOpen(false)
              queryClient.invalidateQueries({ queryKey: ['contractor-application', id] })
            }}
            candidateName={`${application.first_name} ${application.last_name}`}
          />

          <ApproveApplicationModal
            isOpen={isApproveModalOpen}
            onClose={() => setIsApproveModalOpen(false)}
            onApprove={async (data) => {
              await approveApplicationMutation.mutateAsync({
                applicationId: parseInt(id),
                customSlug: data.slug,
                sendEmail: data.sendEmail,
              })
              setIsApproveModalOpen(false)
              queryClient.invalidateQueries({ queryKey: ['contractor-application', id] })
            }}
            candidateEmail={application.email}
            candidateName={`${application.first_name} ${application.last_name}`}
          />

          <RejectApplicationModal
            isOpen={isRejectModalOpen}
            onClose={() => setIsRejectModalOpen(false)}
            onReject={async (data) => {
              await rejectApplicationMutation.mutateAsync({
                applicationId: parseInt(id),
                rejectionReason: data.rejectionReason,
                sendEmail: data.sendEmail,
              })
              setIsRejectModalOpen(false)
              queryClient.invalidateQueries({ queryKey: ['contractor-application', id] })
            }}
            candidateName={`${application.first_name} ${application.last_name}`}
            candidateEmail={application.email}
          />

          <DeleteApplicationModal
            isOpen={isDeleteModalOpen}
            onClose={() => setIsDeleteModalOpen(false)}
            onDelete={async () => {
              await deleteApplicationMutation.mutateAsync({
                applicationId: parseInt(id),
              })
              setIsDeleteModalOpen(false)
              // Redirect to applications list after successful deletion
              window.location.href = '/admin/contractors/applications'
            }}
            candidateName={`${application.first_name} ${application.last_name}`}
            candidateEmail={application.email}
            applicationStatus={application.status}
          />
        </>
      )}
    </div>
  )
}
