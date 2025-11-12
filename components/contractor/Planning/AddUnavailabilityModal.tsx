'use client'

/**
 * AddUnavailabilityModal Component
 * Task: T058
 * Feature: 007-contractor-interface
 *
 * Modal for adding unavailability periods with date/time pickers
 */

import { useState } from 'react'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Calendar } from '@/components/ui/calendar'
import { Calendar as CalendarIcon, Clock, AlertCircle } from 'lucide-react'
import type { UnavailabilityReason, RecurrencePattern } from '@/types/contractor'
import { format } from 'date-fns'
import { fr } from 'date-fns/locale'

interface AddUnavailabilityModalProps {
  open: boolean
  onClose: () => void
  onSubmit: (data: UnavailabilityFormData) => Promise<void>
  isLoading?: boolean
}

export interface UnavailabilityFormData {
  start_datetime: string // ISO 8601
  end_datetime: string // ISO 8601
  reason?: string
  reason_type: UnavailabilityReason
  is_recurring: boolean
  recurrence_pattern?: RecurrencePattern
  recurrence_end_date?: string // YYYY-MM-DD
}

const REASON_TYPES: Array<{ value: UnavailabilityReason; label: string }> = [
  { value: 'vacation', label: 'Congés' },
  { value: 'sick', label: 'Maladie' },
  { value: 'lunch_break', label: 'Pause déjeuner' },
  { value: 'personal', label: 'Personnel' },
  { value: 'other', label: 'Autre' },
]

const RECURRENCE_PATTERNS: Array<{ value: RecurrencePattern; label: string }> = [
  { value: 'daily', label: 'Quotidien' },
  { value: 'weekly', label: 'Hebdomadaire' },
  { value: 'monthly', label: 'Mensuel' },
]

export function AddUnavailabilityModal({
  open,
  onClose,
  onSubmit,
  isLoading = false,
}: AddUnavailabilityModalProps) {
  const [startDate, setStartDate] = useState<Date | undefined>(new Date())
  const [endDate, setEndDate] = useState<Date | undefined>(new Date())
  const [startTime, setStartTime] = useState('09:00')
  const [endTime, setEndTime] = useState('17:00')
  const [reasonType, setReasonType] = useState<UnavailabilityReason>('vacation')
  const [reason, setReason] = useState('')
  const [isRecurring, setIsRecurring] = useState(false)
  const [recurrencePattern, setRecurrencePattern] = useState<RecurrencePattern>('weekly')
  const [recurrenceEndDate, setRecurrenceEndDate] = useState<Date | undefined>()
  const [errors, setErrors] = useState<string[]>([])
  const [showStartCalendar, setShowStartCalendar] = useState(false)
  const [showEndCalendar, setShowEndCalendar] = useState(false)
  const [showRecurrenceCalendar, setShowRecurrenceCalendar] = useState(false)

  const handleReset = () => {
    setStartDate(new Date())
    setEndDate(new Date())
    setStartTime('09:00')
    setEndTime('17:00')
    setReasonType('vacation')
    setReason('')
    setIsRecurring(false)
    setRecurrencePattern('weekly')
    setRecurrenceEndDate(undefined)
    setErrors([])
  }

  const handleClose = () => {
    handleReset()
    onClose()
  }

  const validateForm = (): boolean => {
    const newErrors: string[] = []

    if (!startDate) {
      newErrors.push('La date de début est requise')
    }

    if (!endDate) {
      newErrors.push('La date de fin est requise')
    }

    if (startDate && endDate && startDate > endDate) {
      newErrors.push('La date de fin doit être après la date de début')
    }

    // Combine date and time
    if (startDate && endDate) {
      const startDateTime = new Date(startDate)
      const [startH, startM] = startTime.split(':').map(Number)
      startDateTime.setHours(startH, startM, 0, 0)

      const endDateTime = new Date(endDate)
      const [endH, endM] = endTime.split(':').map(Number)
      endDateTime.setHours(endH, endM, 0, 0)

      if (endDateTime <= startDateTime) {
        newErrors.push('La date/heure de fin doit être après la date/heure de début')
      }
    }

    if (isRecurring && !recurrenceEndDate) {
      newErrors.push('Pour une indisponibilité récurrente, veuillez spécifier une date de fin de récurrence')
    }

    if (isRecurring && recurrenceEndDate && endDate && recurrenceEndDate < endDate) {
      newErrors.push('La date de fin de récurrence doit être après la date de fin de l\'indisponibilité')
    }

    setErrors(newErrors)
    return newErrors.length === 0
  }

  const handleSubmit = async () => {
    if (!validateForm()) {
      return
    }

    if (!startDate || !endDate) return

    // Build ISO 8601 datetime strings
    const startDateTime = new Date(startDate)
    const [startH, startM] = startTime.split(':').map(Number)
    startDateTime.setHours(startH, startM, 0, 0)

    const endDateTime = new Date(endDate)
    const [endH, endM] = endTime.split(':').map(Number)
    endDateTime.setHours(endH, endM, 0, 0)

    const formData: UnavailabilityFormData = {
      start_datetime: startDateTime.toISOString(),
      end_datetime: endDateTime.toISOString(),
      reason: reason.trim() || undefined,
      reason_type: reasonType,
      is_recurring: isRecurring,
      recurrence_pattern: isRecurring ? recurrencePattern : undefined,
      recurrence_end_date: isRecurring && recurrenceEndDate
        ? format(recurrenceEndDate, 'yyyy-MM-dd')
        : undefined,
    }

    try {
      await onSubmit(formData)
      handleClose()
    } catch (error) {
      console.error('Error submitting unavailability:', error)
      setErrors(['Erreur lors de l\'enregistrement'])
    }
  }

  return (
    <Dialog open={open} onOpenChange={(isOpen) => !isOpen && handleClose()}>
      <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <CalendarIcon className="w-5 h-5 text-purple-600" />
            Ajouter une indisponibilité
          </DialogTitle>
          <DialogDescription>
            Bloquez un créneau pour congés, rendez-vous personnel, ou autre raison
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Errors */}
          {errors.length > 0 && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4">
              <div className="flex items-start gap-2">
                <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
                <div className="flex-1">
                  <h4 className="font-semibold text-red-900 mb-1">Erreurs de validation</h4>
                  <ul className="list-disc list-inside text-sm text-red-700 space-y-1">
                    {errors.map((error, index) => (
                      <li key={index}>{error}</li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>
          )}

          {/* Reason Type */}
          <div className="space-y-2">
            <Label>Type d'indisponibilité *</Label>
            <select
              value={reasonType}
              onChange={(e) => setReasonType(e.target.value as UnavailabilityReason)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
            >
              {REASON_TYPES.map((type) => (
                <option key={type.value} value={type.value}>
                  {type.label}
                </option>
              ))}
            </select>
          </div>

          {/* Start Date & Time */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Date de début *</Label>
              <div className="relative">
                <Button
                  variant="outline"
                  onClick={() => setShowStartCalendar(!showStartCalendar)}
                  className="w-full justify-start text-left font-normal"
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {startDate ? format(startDate, 'PPP', { locale: fr }) : 'Sélectionner'}
                </Button>
                {showStartCalendar && (
                  <div className="absolute z-50 mt-2 bg-white border rounded-md shadow-lg">
                    <Calendar
                      mode="single"
                      selected={startDate}
                      onSelect={(date) => {
                        setStartDate(date)
                        setShowStartCalendar(false)
                      }}
                      locale={fr}
                    />
                  </div>
                )}
              </div>
            </div>

            <div className="space-y-2">
              <Label>Heure de début *</Label>
              <div className="relative">
                <Clock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
                <Input
                  type="time"
                  value={startTime}
                  onChange={(e) => setStartTime(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
          </div>

          {/* End Date & Time */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Date de fin *</Label>
              <div className="relative">
                <Button
                  variant="outline"
                  onClick={() => setShowEndCalendar(!showEndCalendar)}
                  className="w-full justify-start text-left font-normal"
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {endDate ? format(endDate, 'PPP', { locale: fr }) : 'Sélectionner'}
                </Button>
                {showEndCalendar && (
                  <div className="absolute z-50 mt-2 bg-white border rounded-md shadow-lg">
                    <Calendar
                      mode="single"
                      selected={endDate}
                      onSelect={(date) => {
                        setEndDate(date)
                        setShowEndCalendar(false)
                      }}
                      locale={fr}
                    />
                  </div>
                )}
              </div>
            </div>

            <div className="space-y-2">
              <Label>Heure de fin *</Label>
              <div className="relative">
                <Clock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
                <Input
                  type="time"
                  value={endTime}
                  onChange={(e) => setEndTime(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
          </div>

          {/* Reason */}
          <div className="space-y-2">
            <Label>Motif (optionnel)</Label>
            <Input
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="Ex: Vacances en famille, RDV médical..."
              maxLength={255}
            />
            <p className="text-xs text-gray-500">{reason.length}/255 caractères</p>
          </div>

          {/* Recurring */}
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="isRecurring"
                checked={isRecurring}
                onChange={(e) => setIsRecurring(e.target.checked)}
                className="w-4 h-4 text-purple-600 border-gray-300 rounded focus:ring-purple-500"
              />
              <Label htmlFor="isRecurring" className="cursor-pointer">
                Indisponibilité récurrente
              </Label>
            </div>

            {isRecurring && (
              <div className="ml-6 space-y-4 border-l-2 border-purple-200 pl-4">
                <div className="space-y-2">
                  <Label>Fréquence</Label>
                  <select
                    value={recurrencePattern}
                    onChange={(e) => setRecurrencePattern(e.target.value as RecurrencePattern)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
                  >
                    {RECURRENCE_PATTERNS.map((pattern) => (
                      <option key={pattern.value} value={pattern.value}>
                        {pattern.label}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="space-y-2">
                  <Label>Fin de récurrence *</Label>
                  <div className="relative">
                    <Button
                      variant="outline"
                      onClick={() => setShowRecurrenceCalendar(!showRecurrenceCalendar)}
                      className="w-full justify-start text-left font-normal"
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {recurrenceEndDate ? format(recurrenceEndDate, 'PPP', { locale: fr }) : 'Sélectionner'}
                    </Button>
                    {showRecurrenceCalendar && (
                      <div className="absolute z-50 mt-2 bg-white border rounded-md shadow-lg">
                        <Calendar
                          mode="single"
                          selected={recurrenceEndDate}
                          onSelect={(date) => {
                            setRecurrenceEndDate(date)
                            setShowRecurrenceCalendar(false)
                          }}
                          locale={fr}
                        />
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={handleClose} disabled={isLoading}>
            Annuler
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={isLoading}
            className="bg-button-primary hover:bg-button-primary/90"
          >
            {isLoading ? 'Enregistrement...' : 'Enregistrer'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
