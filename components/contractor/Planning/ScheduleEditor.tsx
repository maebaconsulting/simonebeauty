'use client'

/**
 * ScheduleEditor Component
 * Task: T050
 * Feature: 007-contractor-interface
 *
 * Weekly schedule editor with day-of-week grid
 * Allows adding, editing, and deleting time slots for each day
 */

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { TimeRangeInput } from './TimeRangeInput'
import { Plus, Trash2, Edit2, Check, X, AlertCircle } from 'lucide-react'
import {
  validateScheduleEntry,
  formatTimeToDisplay,
  getDayName,
} from '@/lib/validations/schedule-validation'
import type { ContractorSchedule, TimeRange, DayOfWeek, WeeklySchedule } from '@/types/contractor'

interface ScheduleEditorProps {
  schedule: WeeklySchedule
  onAddEntry: (dayOfWeek: DayOfWeek, timeRange: TimeRange) => Promise<void>
  onUpdateEntry: (id: number, timeRange: TimeRange) => Promise<void>
  onDeleteEntry: (id: number) => Promise<void>
  isLoading?: boolean
}

const DAYS: Array<{ key: keyof WeeklySchedule; label: string; dayOfWeek: DayOfWeek }> = [
  { key: 'monday', label: 'Lundi', dayOfWeek: 1 },
  { key: 'tuesday', label: 'Mardi', dayOfWeek: 2 },
  { key: 'wednesday', label: 'Mercredi', dayOfWeek: 3 },
  { key: 'thursday', label: 'Jeudi', dayOfWeek: 4 },
  { key: 'friday', label: 'Vendredi', dayOfWeek: 5 },
  { key: 'saturday', label: 'Samedi', dayOfWeek: 6 },
  { key: 'sunday', label: 'Dimanche', dayOfWeek: 0 },
]

export function ScheduleEditor({
  schedule,
  onAddEntry,
  onUpdateEntry,
  onDeleteEntry,
  isLoading = false,
}: ScheduleEditorProps) {
  const [addingDay, setAddingDay] = useState<DayOfWeek | null>(null)
  const [editingId, setEditingId] = useState<number | null>(null)
  const [newTimeRange, setNewTimeRange] = useState<TimeRange>({ start: '09:00', end: '17:00' })
  const [editTimeRange, setEditTimeRange] = useState<TimeRange>({ start: '09:00', end: '17:00' })
  const [validationErrors, setValidationErrors] = useState<string[]>([])

  const handleStartAdd = (dayOfWeek: DayOfWeek) => {
    setAddingDay(dayOfWeek)
    setNewTimeRange({ start: '09:00', end: '17:00' })
    setValidationErrors([])
  }

  const handleCancelAdd = () => {
    setAddingDay(null)
    setValidationErrors([])
  }

  const handleSaveAdd = async (dayOfWeek: DayOfWeek) => {
    // Get existing entries for this day
    const dayKey = DAYS.find((d) => d.dayOfWeek === dayOfWeek)?.key
    const existingEntries = dayKey ? schedule[dayKey] : []

    // Validate
    const errors = validateScheduleEntry(dayOfWeek, newTimeRange, existingEntries)

    if (errors.length > 0) {
      setValidationErrors(errors.map((e) => e.message))
      return
    }

    try {
      await onAddEntry(dayOfWeek, newTimeRange)
      setAddingDay(null)
      setValidationErrors([])
    } catch (error) {
      console.error('Error adding schedule entry:', error)
      setValidationErrors(['Erreur lors de l\'ajout du créneau'])
    }
  }

  const handleStartEdit = (entry: ContractorSchedule) => {
    setEditingId(entry.id)
    setEditTimeRange({
      start: formatTimeToDisplay(entry.start_time),
      end: formatTimeToDisplay(entry.end_time),
    })
    setValidationErrors([])
  }

  const handleCancelEdit = () => {
    setEditingId(null)
    setValidationErrors([])
  }

  const handleSaveEdit = async (entry: ContractorSchedule) => {
    // Get existing entries for this day
    const dayKey = DAYS.find((d) => d.dayOfWeek === entry.day_of_week)?.key
    const existingEntries = dayKey ? schedule[dayKey] : []

    // Validate
    const errors = validateScheduleEntry(
      entry.day_of_week,
      editTimeRange,
      existingEntries,
      entry.id
    )

    if (errors.length > 0) {
      setValidationErrors(errors.map((e) => e.message))
      return
    }

    try {
      await onUpdateEntry(entry.id, editTimeRange)
      setEditingId(null)
      setValidationErrors([])
    } catch (error) {
      console.error('Error updating schedule entry:', error)
      setValidationErrors(['Erreur lors de la modification du créneau'])
    }
  }

  const handleDelete = async (id: number) => {
    if (!confirm('Êtes-vous sûr de vouloir supprimer ce créneau ?')) {
      return
    }

    try {
      await onDeleteEntry(id)
    } catch (error) {
      console.error('Error deleting schedule entry:', error)
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold text-gray-900">
          Horaires hebdomadaires
        </h3>
        <p className="text-sm text-gray-600">
          Configurez vos disponibilités par jour
        </p>
      </div>

      {validationErrors.length > 0 && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <div className="flex items-start gap-2">
            <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
            <div className="flex-1">
              <h4 className="font-semibold text-red-900 mb-1">Erreur de validation</h4>
              <ul className="list-disc list-inside text-sm text-red-700 space-y-1">
                {validationErrors.map((error, index) => (
                  <li key={index}>{error}</li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      )}

      <div className="space-y-3">
        {DAYS.map((day) => (
          <Card key={day.key} className="p-4">
            <div className="space-y-3">
              {/* Day header */}
              <div className="flex items-center justify-between">
                <h4 className="font-semibold text-gray-900">{day.label}</h4>
                {!isLoading && addingDay !== day.dayOfWeek && (
                  <Button
                    onClick={() => handleStartAdd(day.dayOfWeek)}
                    variant="outline"
                    size="sm"
                    className="text-button-primary hover:text-button-primary/90"
                  >
                    <Plus className="w-4 h-4 mr-1" />
                    Ajouter un créneau
                  </Button>
                )}
              </div>

              {/* Existing entries */}
              {schedule[day.key].length > 0 && (
                <div className="space-y-2">
                  {schedule[day.key].map((entry) => (
                    <div
                      key={entry.id}
                      className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg"
                    >
                      {editingId === entry.id ? (
                        <>
                          <div className="flex-1">
                            <TimeRangeInput
                              value={editTimeRange}
                              onChange={setEditTimeRange}
                            />
                          </div>
                          <div className="flex gap-2">
                            <Button
                              onClick={() => handleSaveEdit(entry)}
                              size="sm"
                              variant="default"
                              className="bg-green-600 hover:bg-green-700"
                              disabled={isLoading}
                            >
                              <Check className="w-4 h-4" />
                            </Button>
                            <Button
                              onClick={handleCancelEdit}
                              size="sm"
                              variant="outline"
                              disabled={isLoading}
                            >
                              <X className="w-4 h-4" />
                            </Button>
                          </div>
                        </>
                      ) : (
                        <>
                          <div className="flex-1">
                            <span className="font-medium text-gray-900">
                              {formatTimeToDisplay(entry.start_time)} - {formatTimeToDisplay(entry.end_time)}
                            </span>
                            {!entry.is_active && (
                              <span className="ml-2 text-xs text-gray-500">(Inactif)</span>
                            )}
                          </div>
                          <div className="flex gap-2">
                            <Button
                              onClick={() => handleStartEdit(entry)}
                              size="sm"
                              variant="ghost"
                              disabled={isLoading}
                            >
                              <Edit2 className="w-4 h-4" />
                            </Button>
                            <Button
                              onClick={() => handleDelete(entry.id)}
                              size="sm"
                              variant="ghost"
                              className="text-red-600 hover:text-red-700 hover:bg-red-50"
                              disabled={isLoading}
                            >
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </div>
                        </>
                      )}
                    </div>
                  ))}
                </div>
              )}

              {/* Add new entry form */}
              {addingDay === day.dayOfWeek && (
                <div className="flex items-start gap-3 p-3 bg-blue-50 rounded-lg border border-blue-200">
                  <div className="flex-1">
                    <TimeRangeInput
                      value={newTimeRange}
                      onChange={setNewTimeRange}
                      label="Nouveau créneau"
                    />
                  </div>
                  <div className="flex gap-2 mt-7">
                    <Button
                      onClick={() => handleSaveAdd(day.dayOfWeek)}
                      size="sm"
                      variant="default"
                      className="bg-button-primary hover:bg-button-primary/90"
                      disabled={isLoading}
                    >
                      <Check className="w-4 h-4" />
                    </Button>
                    <Button
                      onClick={handleCancelAdd}
                      size="sm"
                      variant="outline"
                      disabled={isLoading}
                    >
                      <X className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              )}

              {/* Empty state */}
              {schedule[day.key].length === 0 && addingDay !== day.dayOfWeek && (
                <p className="text-sm text-gray-500 italic">
                  Aucun créneau configuré
                </p>
              )}
            </div>
          </Card>
        ))}
      </div>

      <div className="bg-gray-50 rounded-lg p-4 text-sm text-gray-600">
        <p>
          💡 <strong>Astuce :</strong> Vous pouvez ajouter plusieurs créneaux par jour (par exemple: matin et après-midi). Les créneaux ne doivent pas se chevaucher.
        </p>
      </div>
    </div>
  )
}
