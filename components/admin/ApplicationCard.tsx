'use client'

/**
 * Application Card Component
 * Task: T034 - Display candidate info, documents, and action buttons
 * Feature: 007-contractor-interface
 */

import { ContractorApplication } from '@/types/contractor'
import { Button } from '@/components/ui/button'
import { Calendar, FileText, Mail, MapPin, Phone, User, Clock, CheckCircle, XCircle, Trash2 } from 'lucide-react'
import Link from 'next/link'

interface ApplicationCardProps {
  application: ContractorApplication
  onScheduleInterview?: (applicationId: number) => void
  onApprove?: (applicationId: number) => void
  onReject?: (applicationId: number) => void
  onDelete?: (applicationId: number) => void
}

export function ApplicationCard({
  application,
  onScheduleInterview,
  onApprove,
  onReject,
  onDelete
}: ApplicationCardProps) {
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
      <span className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-sm font-medium ${badge.color}`}>
        <Icon className="w-4 h-4" />
        {badge.label}
      </span>
    )
  }

  const getWorkFrequencyLabel = (frequency: string) => {
    const labels = {
      full_time: 'Temps plein',
      part_time: 'Temps partiel',
      occasional: 'Occasionnel',
    }
    return labels[frequency as keyof typeof labels] || frequency
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('fr-FR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    })
  }

  const hasDocuments = application.cv_file_path ||
    (application.certifications_file_paths && application.certifications_file_paths.length > 0) ||
    (application.portfolio_file_paths && application.portfolio_file_paths.length > 0)

  return (
    <div className="bg-white rounded-lg border border-gray-200 p-6 hover:shadow-md transition-shadow">
      {/* Header */}
      <div className="flex items-start justify-between mb-4">
        <div className="flex-1">
          <div className="flex items-center gap-3 mb-2">
            <h3 className="text-xl font-semibold text-gray-900">
              {application.first_name} {application.last_name}
            </h3>
            {getStatusBadge(application.status)}
          </div>

          <div className="flex flex-wrap gap-4 text-sm text-gray-600">
            <div className="flex items-center gap-1">
              <User className="w-4 h-4" />
              {application.profession}
            </div>
            <div className="flex items-center gap-1">
              <Clock className="w-4 h-4" />
              {application.years_of_experience} ans d'expérience
            </div>
            <div className="flex items-center gap-1">
              <Calendar className="w-4 h-4" />
              {getWorkFrequencyLabel(application.work_frequency)}
            </div>
          </div>
        </div>

        <div className="text-sm text-gray-500 text-right">
          Soumis le<br />
          {formatDate(application.submitted_at)}
        </div>
      </div>

      {/* Contact Info */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-4 text-sm">
        <div className="flex items-center gap-2 text-gray-700">
          <Mail className="w-4 h-4 text-gray-400" />
          <a href={`mailto:${application.email}`} className="hover:text-button-primary">
            {application.email}
          </a>
        </div>

        <div className="flex items-center gap-2 text-gray-700">
          <Phone className="w-4 h-4 text-gray-400" />
          <a href={`tel:${application.phone}`} className="hover:text-button-primary">
            {application.phone}
          </a>
        </div>

        <div className="flex items-start gap-2 text-gray-700 md:col-span-2">
          <MapPin className="w-4 h-4 text-gray-400 mt-0.5" />
          <span className="line-clamp-1">{application.address}</span>
        </div>
      </div>

      {/* Geographic Zones */}
      {application.geographic_zones && application.geographic_zones.length > 0 && (
        <div className="mb-4">
          <h4 className="text-sm font-medium text-gray-700 mb-2">Zones géographiques:</h4>
          <div className="flex flex-wrap gap-1">
            {application.geographic_zones.slice(0, 5).map((zone, index) => (
              <span key={index} className="px-2 py-1 bg-gray-100 text-gray-700 text-xs rounded">
                {zone}
              </span>
            ))}
            {application.geographic_zones.length > 5 && (
              <span className="px-2 py-1 bg-gray-100 text-gray-500 text-xs rounded">
                +{application.geographic_zones.length - 5} autres
              </span>
            )}
          </div>
        </div>
      )}

      {/* Documents Badge */}
      {hasDocuments && (
        <div className="mb-4">
          <div className="inline-flex items-center gap-2 px-3 py-1 bg-green-50 text-green-700 rounded text-sm">
            <FileText className="w-4 h-4" />
            Documents fournis
            {application.cv_file_path && ' (CV)'}
            {application.certifications_file_paths && application.certifications_file_paths.length > 0 && ' (Certifications)'}
            {application.portfolio_file_paths && application.portfolio_file_paths.length > 0 && ' (Portfolio)'}
          </div>
        </div>
      )}

      {/* Motivation Preview */}
      <div className="mb-4 p-3 bg-gray-50 rounded">
        <h4 className="text-sm font-medium text-gray-700 mb-1">Motivation:</h4>
        <p className="text-sm text-gray-600 line-clamp-2">
          {application.motivation}
        </p>
      </div>

      {/* Interview Info (if scheduled) */}
      {application.status === 'interview_scheduled' && application.interview_date && (
        <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded">
          <div className="flex items-center gap-2 text-blue-800">
            <Calendar className="w-4 h-4" />
            <span className="text-sm font-medium">
              Entretien prévu le {formatDate(application.interview_date)}
            </span>
            {application.interview_mode && (
              <span className="text-xs bg-blue-100 px-2 py-0.5 rounded">
                {application.interview_mode === 'video' ? 'Visio' :
                 application.interview_mode === 'phone' ? 'Téléphone' :
                 'En personne'}
              </span>
            )}
          </div>
        </div>
      )}

      {/* Rejection Info */}
      {application.status === 'rejected' && application.rejection_reason && (
        <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded">
          <h4 className="text-sm font-medium text-red-800 mb-1">Raison du refus:</h4>
          <p className="text-sm text-red-700">{application.rejection_reason}</p>
        </div>
      )}

      {/* Action Buttons */}
      <div className="flex flex-wrap gap-2 pt-4 border-t border-gray-200">
        <Link href={`/admin/contractors/applications/${application.id}`}>
          <Button variant="outline" size="sm">
            Voir détails
          </Button>
        </Link>

        {application.status === 'pending' && (
          <>
            <Button
              variant="outline"
              size="sm"
              onClick={() => onScheduleInterview?.(application.id)}
              className="border-blue-600 text-blue-600 hover:bg-blue-50"
            >
              <Calendar className="w-4 h-4 mr-1" />
              Planifier entretien
            </Button>

            <Button
              variant="outline"
              size="sm"
              onClick={() => onApprove?.(application.id)}
              className="border-green-600 text-green-600 hover:bg-green-50"
            >
              <CheckCircle className="w-4 h-4 mr-1" />
              Approuver
            </Button>

            <Button
              variant="outline"
              size="sm"
              onClick={() => onReject?.(application.id)}
              className="border-red-600 text-red-600 hover:bg-red-50"
            >
              <XCircle className="w-4 h-4 mr-1" />
              Refuser
            </Button>
          </>
        )}

        {application.status === 'interview_scheduled' && (
          <>
            <Button
              variant="outline"
              size="sm"
              onClick={() => onApprove?.(application.id)}
              className="border-green-600 text-green-600 hover:bg-green-50"
            >
              <CheckCircle className="w-4 h-4 mr-1" />
              Approuver
            </Button>

            <Button
              variant="outline"
              size="sm"
              onClick={() => onReject?.(application.id)}
              className="border-red-600 text-red-600 hover:bg-red-50"
            >
              <XCircle className="w-4 h-4 mr-1" />
              Refuser
            </Button>
          </>
        )}

        {/* Delete button - only for rejected applications (FR-020a) */}
        {application.status === 'rejected' && onDelete && (
          <Button
            variant="outline"
            size="sm"
            onClick={() => onDelete(application.id)}
            className="border-red-800 text-red-800 hover:bg-red-100 ml-auto"
          >
            <Trash2 className="w-4 h-4 mr-1" />
            Supprimer définitivement
          </Button>
        )}
      </div>
    </div>
  )
}
