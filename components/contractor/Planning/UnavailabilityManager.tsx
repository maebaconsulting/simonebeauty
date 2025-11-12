'use client'

/**
 * UnavailabilityManager Component
 * Task: T057
 * Feature: 007-contractor-interface
 *
 * Displays and manages contractor unavailability periods
 */

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { AddUnavailabilityModal, type UnavailabilityFormData } from './AddUnavailabilityModal'
import { Plus, Trash2, Calendar, Clock, AlertCircle, Ban } from 'lucide-react'
import type { ContractorUnavailability, UnavailabilityReason } from '@/types/contractor'
import { format, parseISO } from 'date-fns'
import { fr } from 'date-fns/locale'

interface UnavailabilityManagerProps {
  unavailabilities: ContractorUnavailability[]
  onAdd: (data: UnavailabilityFormData) => Promise<void>
  onDelete: (id: number) => Promise<void>
  isLoading?: boolean
}

const REASON_LABELS: Record<UnavailabilityReason, string> = {
  vacation: 'Congés',
  sick: 'Maladie',
  lunch_break: 'Pause déjeuner',
  personal: 'Personnel',
  other: 'Autre',
}

const REASON_COLORS: Record<UnavailabilityReason, { bg: string; text: string; border: string }> = {
  vacation: { bg: 'bg-blue-50', text: 'text-blue-700', border: 'border-blue-200' },
  sick: { bg: 'bg-red-50', text: 'text-red-700', border: 'border-red-200' },
  lunch_break: { bg: 'bg-orange-50', text: 'text-orange-700', border: 'border-orange-200' },
  personal: { bg: 'bg-purple-50', text: 'text-purple-700', border: 'border-purple-200' },
  other: { bg: 'bg-gray-50', text: 'text-gray-700', border: 'border-gray-200' },
}

export function UnavailabilityManager({
  unavailabilities,
  onAdd,
  onDelete,
  isLoading = false,
}: UnavailabilityManagerProps) {
  const [isModalOpen, setIsModalOpen] = useState(false)

  const handleAdd = async (data: UnavailabilityFormData) => {
    await onAdd(data)
    setIsModalOpen(false)
  }

  const handleDelete = async (id: number) => {
    if (!confirm('Êtes-vous sûr de vouloir supprimer cette indisponibilité ?')) {
      return
    }

    await onDelete(id)
  }

  // Sort unavailabilities by start date (upcoming first)
  const sortedUnavailabilities = [...unavailabilities].sort((a, b) => {
    return new Date(a.start_datetime).getTime() - new Date(b.start_datetime).getTime()
  })

  // Split into upcoming and past
  const now = new Date()
  const upcomingUnavailabilities = sortedUnavailabilities.filter(
    (u) => new Date(u.end_datetime) >= now
  )
  const pastUnavailabilities = sortedUnavailabilities.filter(
    (u) => new Date(u.end_datetime) < now
  )

  const formatDateTime = (dateTimeString: string) => {
    try {
      const date = parseISO(dateTimeString)
      return format(date, 'PPP à HH:mm', { locale: fr })
    } catch (error) {
      return dateTimeString
    }
  }

  const formatDate = (dateTimeString: string) => {
    try {
      const date = parseISO(dateTimeString)
      return format(date, 'PPP', { locale: fr })
    } catch (error) {
      return dateTimeString
    }
  }

  const formatTime = (dateTimeString: string) => {
    try {
      const date = parseISO(dateTimeString)
      return format(date, 'HH:mm')
    } catch (error) {
      return dateTimeString
    }
  }

  const renderUnavailabilityCard = (unavailability: ContractorUnavailability, isPast: boolean = false) => {
    const colors = REASON_COLORS[unavailability.reason_type]

    return (
      <Card
        key={unavailability.id}
        className={`p-4 ${isPast ? 'opacity-60' : ''}`}
      >
        <div className="flex items-start gap-4">
          {/* Icon */}
          <div className={`flex-shrink-0 w-12 h-12 rounded-lg ${colors.bg} flex items-center justify-center`}>
            <Ban className={`w-6 h-6 ${colors.text}`} />
          </div>

          {/* Content */}
          <div className="flex-1 min-w-0">
            {/* Header */}
            <div className="flex items-start justify-between gap-2 mb-2">
              <div>
                <div className="flex items-center gap-2 flex-wrap">
                  <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${colors.bg} ${colors.text} border ${colors.border}`}>
                    {REASON_LABELS[unavailability.reason_type]}
                  </span>
                  {unavailability.is_recurring && (
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-purple-50 text-purple-700 border border-purple-200">
                      Récurrent
                    </span>
                  )}
                  {isPast && (
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-600">
                      Passé
                    </span>
                  )}
                </div>
                {unavailability.reason && (
                  <p className="text-sm font-medium text-gray-900 mt-1">
                    {unavailability.reason}
                  </p>
                )}
              </div>

              {!isPast && (
                <Button
                  onClick={() => handleDelete(unavailability.id)}
                  size="sm"
                  variant="ghost"
                  className="text-red-600 hover:text-red-700 hover:bg-red-50 flex-shrink-0"
                  disabled={isLoading}
                >
                  <Trash2 className="w-4 h-4" />
                </Button>
              )}
            </div>

            {/* Dates */}
            <div className="space-y-1.5">
              <div className="flex items-center gap-2 text-sm text-gray-600">
                <Calendar className="w-4 h-4 flex-shrink-0" />
                <span>
                  Du {formatDate(unavailability.start_datetime)} au {formatDate(unavailability.end_datetime)}
                </span>
              </div>
              <div className="flex items-center gap-2 text-sm text-gray-600">
                <Clock className="w-4 h-4 flex-shrink-0" />
                <span>
                  {formatTime(unavailability.start_datetime)} - {formatTime(unavailability.end_datetime)}
                </span>
              </div>

              {/* Recurrence info */}
              {unavailability.is_recurring && unavailability.recurrence_pattern && (
                <div className="text-xs text-purple-600 mt-2">
                  Récurrence {unavailability.recurrence_pattern === 'daily' ? 'quotidienne' :
                             unavailability.recurrence_pattern === 'weekly' ? 'hebdomadaire' : 'mensuelle'}
                  {unavailability.recurrence_end_date && (
                    <> jusqu'au {format(parseISO(unavailability.recurrence_end_date), 'PPP', { locale: fr })}</>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      </Card>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold text-gray-900">
            Indisponibilités
          </h3>
          <p className="text-sm text-gray-600 mt-1">
            Bloquez des créneaux pour congés, rendez-vous ou autres raisons
          </p>
        </div>
        <Button
          onClick={() => setIsModalOpen(true)}
          className="bg-button-primary hover:bg-button-primary/90"
          disabled={isLoading}
        >
          <Plus className="w-4 h-4 mr-2" />
          Ajouter
        </Button>
      </div>

      {/* Upcoming Unavailabilities */}
      {upcomingUnavailabilities.length > 0 && (
        <div className="space-y-3">
          <h4 className="text-sm font-medium text-gray-700">
            À venir ({upcomingUnavailabilities.length})
          </h4>
          <div className="space-y-3">
            {upcomingUnavailabilities.map((unavailability) =>
              renderUnavailabilityCard(unavailability)
            )}
          </div>
        </div>
      )}

      {/* Past Unavailabilities */}
      {pastUnavailabilities.length > 0 && (
        <div className="space-y-3">
          <h4 className="text-sm font-medium text-gray-700">
            Passées ({pastUnavailabilities.length})
          </h4>
          <div className="space-y-3">
            {pastUnavailabilities.slice(0, 5).map((unavailability) =>
              renderUnavailabilityCard(unavailability, true)
            )}
          </div>
          {pastUnavailabilities.length > 5 && (
            <p className="text-xs text-gray-500 text-center">
              ... et {pastUnavailabilities.length - 5} autre(s) indisponibilité(s) passée(s)
            </p>
          )}
        </div>
      )}

      {/* Empty state */}
      {unavailabilities.length === 0 && (
        <Card className="p-12">
          <div className="text-center">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-gray-100 rounded-full mb-4">
              <Calendar className="w-8 h-8 text-gray-400" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              Aucune indisponibilité
            </h3>
            <p className="text-gray-600 mb-6 max-w-md mx-auto">
              Vous n'avez pas encore configuré d'indisponibilités. Utilisez cette fonctionnalité pour bloquer des créneaux pour vos congés, rendez-vous personnels, ou pauses.
            </p>
            <Button
              onClick={() => setIsModalOpen(true)}
              className="bg-button-primary hover:bg-button-primary/90"
            >
              <Plus className="w-4 h-4 mr-2" />
              Ajouter ma première indisponibilité
            </Button>
          </div>
        </Card>
      )}

      {/* Help section */}
      <div className="bg-blue-50 rounded-lg p-4 text-sm text-blue-800">
        <p>
          💡 <strong>Astuce :</strong> Les indisponibilités bloquent votre planning pour empêcher les réservations. Utilisez-les pour vos congés, rendez-vous médicaux, pauses déjeuner récurrentes, etc.
        </p>
      </div>

      {/* Add Modal */}
      <AddUnavailabilityModal
        open={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSubmit={handleAdd}
        isLoading={isLoading}
      />
    </div>
  )
}
