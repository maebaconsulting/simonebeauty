'use client'

/**
 * Contractor Planning Page
 * Task: T049
 * Feature: 007-contractor-interface
 * Route: /contractor/planning
 *
 * Allows contractors to configure their weekly work hours
 * Supports onboarding mode via ?onboarding=true query parameter
 */

import { useState } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import { useUser } from '@/hooks/useUser'
import {
  useCurrentContractor,
  useContractorSchedule,
  useCreateScheduleEntry,
  useUpdateScheduleEntry,
  useDeleteScheduleEntry,
} from '@/hooks/useContractorSchedule'
import {
  useContractorUnavailabilities,
  useCreateUnavailability,
  useDeleteUnavailability,
} from '@/hooks/useContractorUnavailability'
import { useWeeklyPlanning } from '@/hooks/useWeeklyPlanning'
import { ScheduleEditor } from '@/components/contractor/Planning/ScheduleEditor'
import { UnavailabilityManager } from '@/components/contractor/Planning/UnavailabilityManager'
import { PlanningCalendar } from '@/components/contractor/Planning/PlanningCalendar'
import type { UnavailabilityFormData } from '@/components/contractor/Planning/AddUnavailabilityModal'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Calendar, ArrowLeft, CheckCircle, AlertCircle, Settings, CalendarDays } from 'lucide-react'
import type { TimeRange, DayOfWeek } from '@/types/contractor'

type TabType = 'configuration' | 'calendar'

export default function ContractorPlanningPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const isOnboarding = searchParams?.get('onboarding') === 'true'

  const [activeTab, setActiveTab] = useState<TabType>('configuration')
  const [weekDate, setWeekDate] = useState(new Date())

  const { user, isLoading: userLoading } = useUser()
  const { data: contractor, isLoading: contractorLoading } = useCurrentContractor()
  const { data: schedule, isLoading: scheduleLoading, error: scheduleError } = useContractorSchedule(
    contractor?.id || null
  )
  const { data: unavailabilities = [], isLoading: unavailabilitiesLoading } = useContractorUnavailabilities(
    contractor?.id || null
  )
  const {
    data: weeklyPlanning,
    isLoading: planningLoading,
    weekStart,
    weekEnd,
    refetch: refetchPlanning,
  } = useWeeklyPlanning(contractor?.id || null, weekDate)

  const createEntry = useCreateScheduleEntry()
  const updateEntry = useUpdateScheduleEntry()
  const deleteEntry = useDeleteScheduleEntry()

  const createUnavailability = useCreateUnavailability()
  const deleteUnavailability = useDeleteUnavailability()

  const isLoading = userLoading || contractorLoading || scheduleLoading || unavailabilitiesLoading
  const hasSchedule = schedule && Object.values(schedule).some((day) => day.length > 0)

  // Handler functions for CRUD operations
  const handleAddEntry = async (dayOfWeek: DayOfWeek, timeRange: TimeRange) => {
    if (!contractor) {
      throw new Error('Contractor not found')
    }

    await createEntry.mutateAsync({
      contractorId: contractor.id,
      dayOfWeek,
      timeRange,
    })
  }

  const handleUpdateEntry = async (scheduleId: number, timeRange: TimeRange) => {
    if (!contractor) {
      throw new Error('Contractor not found')
    }

    await updateEntry.mutateAsync({
      contractorId: contractor.id,
      scheduleId,
      timeRange,
    })
  }

  const handleDeleteEntry = async (scheduleId: number) => {
    if (!contractor) {
      throw new Error('Contractor not found')
    }

    await deleteEntry.mutateAsync({
      contractorId: contractor.id,
      scheduleId,
    })
  }

  // Unavailability handlers
  const handleAddUnavailability = async (data: UnavailabilityFormData) => {
    if (!contractor) {
      throw new Error('Contractor not found')
    }

    await createUnavailability.mutateAsync({
      contractor_id: contractor.id,
      start_datetime: data.start_datetime,
      end_datetime: data.end_datetime,
      reason: data.reason,
      reason_type: data.reason_type,
      is_recurring: data.is_recurring,
      recurrence_pattern: data.recurrence_pattern,
      recurrence_end_date: data.recurrence_end_date,
    })
  }

  const handleDeleteUnavailability = async (unavailabilityId: number) => {
    if (!contractor) {
      throw new Error('Contractor not found')
    }

    await deleteUnavailability.mutateAsync({
      contractorId: contractor.id,
      unavailabilityId,
    })
  }

  const handleCompleteOnboarding = () => {
    if (!hasSchedule) {
      alert('Veuillez configurer au moins un créneau avant de continuer')
      return
    }
    router.push('/contractor/onboarding')
  }

  // Loading state
  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-purple-100 rounded-full mb-4 animate-pulse">
            <Calendar className="w-8 h-8 text-purple-600" />
          </div>
          <p className="text-gray-600 font-medium">Chargement de votre planning...</p>
        </div>
      </div>
    )
  }

  // Error: Not a contractor
  if (!contractor) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <Card className="max-w-md w-full p-8">
          <div className="text-center">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-red-100 rounded-full mb-4">
              <AlertCircle className="w-8 h-8 text-red-600" />
            </div>
            <h1 className="text-2xl font-bold text-gray-900 mb-2">
              Accès refusé
            </h1>
            <p className="text-gray-600 mb-6">
              Cette page est réservée aux prestataires. Votre compte n'a pas encore été approuvé ou vous n'avez pas soumis de candidature.
            </p>
            <div className="space-y-3">
              <Button
                onClick={() => router.push('/rejoindre-simone')}
                className="w-full bg-button-primary hover:bg-button-primary/90"
              >
                Postuler comme prestataire
              </Button>
              <Button
                onClick={() => router.push('/')}
                variant="outline"
                className="w-full"
              >
                Retour à l'accueil
              </Button>
            </div>
          </div>
        </Card>
      </div>
    )
  }

  // Error loading schedule
  if (scheduleError) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <Card className="max-w-md w-full p-8">
          <div className="text-center">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-red-100 rounded-full mb-4">
              <AlertCircle className="w-8 h-8 text-red-600" />
            </div>
            <h1 className="text-2xl font-bold text-gray-900 mb-2">
              Erreur de chargement
            </h1>
            <p className="text-gray-600 mb-6">
              Impossible de charger votre planning. Veuillez réessayer.
            </p>
            <Button
              onClick={() => window.location.reload()}
              className="w-full bg-button-primary hover:bg-button-primary/90"
            >
              Réessayer
            </Button>
          </div>
        </Card>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="container mx-auto px-4">
        {/* Header */}
        <div className="mb-8">
          {!isOnboarding && (
            <Button
              onClick={() => router.back()}
              variant="ghost"
              className="mb-4 text-gray-600 hover:text-gray-900"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Retour
            </Button>
          )}

          <div className="bg-white rounded-lg p-6 shadow-sm">
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <div className="flex items-center gap-3 mb-2">
                  <div className="inline-flex items-center justify-center w-12 h-12 bg-purple-100 rounded-lg">
                    <Calendar className="w-6 h-6 text-purple-600" />
                  </div>
                  <h1 className="font-playfair text-3xl font-bold text-gray-900">
                    {isOnboarding ? 'Configuration de vos horaires' : 'Planning & Disponibilités'}
                  </h1>
                </div>
                <p className="text-gray-600 ml-15">
                  {isOnboarding
                    ? 'Définissez vos horaires de travail hebdomadaires pour commencer à recevoir des demandes de réservation'
                    : 'Gérez vos horaires de travail et vos indisponibilités'}
                </p>
              </div>
              {hasSchedule && !isOnboarding && (
                <div className="flex items-center gap-2 bg-green-50 px-4 py-2 rounded-lg">
                  <CheckCircle className="w-5 h-5 text-green-600" />
                  <span className="text-sm font-medium text-green-900">Horaires configurés</span>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Onboarding notice */}
        {isOnboarding && (
          <Card className="mb-6 p-6 bg-blue-50 border-blue-200">
            <h3 className="font-semibold text-blue-900 mb-2">
              Première étape de votre configuration
            </h3>
            <p className="text-blue-800 text-sm">
              Ces horaires représentent vos disponibilités générales. Vous pourrez ensuite bloquer des créneaux spécifiques pour vos congés ou indisponibilités ponctuelles.
            </p>
          </Card>
        )}

        {/* Tabs (not shown during onboarding) */}
        {!isOnboarding && (
          <div className="mb-6">
            <div className="border-b border-gray-200">
              <nav className="-mb-px flex space-x-8">
                <button
                  onClick={() => setActiveTab('configuration')}
                  className={`${
                    activeTab === 'configuration'
                      ? 'border-purple-500 text-purple-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  } whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm flex items-center gap-2`}
                >
                  <Settings className="w-4 h-4" />
                  Configuration
                </button>
                <button
                  onClick={() => setActiveTab('calendar')}
                  className={`${
                    activeTab === 'calendar'
                      ? 'border-purple-500 text-purple-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  } whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm flex items-center gap-2`}
                >
                  <CalendarDays className="w-4 h-4" />
                  Vue Planning
                </button>
              </nav>
            </div>
          </div>
        )}

        {/* Configuration Tab */}
        {(isOnboarding || activeTab === 'configuration') && (
          <>
            {/* Schedule Editor */}
            <Card className="p-6 mb-6">
              {schedule && (
                <ScheduleEditor
                  schedule={schedule}
                  onAddEntry={handleAddEntry}
                  onUpdateEntry={handleUpdateEntry}
                  onDeleteEntry={handleDeleteEntry}
                  isLoading={createEntry.isPending || updateEntry.isPending || deleteEntry.isPending}
                />
              )}
            </Card>

            {/* Unavailability Manager (not shown during onboarding) */}
            {!isOnboarding && (
              <Card className="p-6">
                <UnavailabilityManager
                  unavailabilities={unavailabilities}
                  onAdd={handleAddUnavailability}
                  onDelete={handleDeleteUnavailability}
                  isLoading={createUnavailability.isPending || deleteUnavailability.isPending}
                />
              </Card>
            )}
          </>
        )}

        {/* Calendar Tab */}
        {!isOnboarding && activeTab === 'calendar' && (
          <Card className="p-6">
            <PlanningCalendar
              bookings={weeklyPlanning?.bookings || []}
              weekStart={weekStart}
              weekEnd={weekEnd}
              onWeekChange={setWeekDate}
              isLoading={planningLoading}
              onRefresh={() => refetchPlanning()}
            />
          </Card>
        )}

        {/* Onboarding footer */}
        {isOnboarding && (
          <div className="mt-8 flex justify-end gap-4">
            <Button
              onClick={() => router.push('/')}
              variant="outline"
            >
              Annuler
            </Button>
            <Button
              onClick={handleCompleteOnboarding}
              className="bg-button-primary hover:bg-button-primary/90"
              disabled={!hasSchedule}
            >
              Continuer vers l'étape suivante
            </Button>
          </div>
        )}

        {/* Help section */}
        {!isOnboarding && (
          <Card className="mt-6 p-6 bg-gray-50">
            <h3 className="font-semibold text-gray-900 mb-3">
              Besoin d'aide ?
            </h3>
            <div className="space-y-2 text-sm text-gray-600">
              <p>
                • <strong>Créneaux multiples :</strong> Vous pouvez ajouter plusieurs créneaux par jour (ex: matin et après-midi séparés par une pause déjeuner)
              </p>
              <p>
                • <strong>Modification :</strong> Cliquez sur l'icône crayon pour modifier un créneau existant
              </p>
              <p>
                • <strong>Suppression :</strong> Cliquez sur l'icône corbeille pour supprimer définitivement un créneau
              </p>
              <p>
                • <strong>Indisponibilités :</strong> Rendez-vous dans la section "Indisponibilités" pour bloquer des créneaux spécifiques (congés, rendez-vous personnels, etc.)
              </p>
            </div>
          </Card>
        )}
      </div>
    </div>
  )
}
