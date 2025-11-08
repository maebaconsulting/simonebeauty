'use client'

/**
 * Step 3: Availability & Geographic Zones
 * Task: T027
 */

import { useForm, Controller } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { AvailabilitySchema, Availability, TimeSlot, DayAvailability } from '@/lib/validations/contractor-application'
import { Button } from '@/components/ui/button'
import { ArrowLeft, Plus, X, Clock } from 'lucide-react'
import { useState } from 'react'

interface Step3Props {
  initialData: Partial<Availability>
  onComplete: (data: Availability) => void
  onPrevious: () => void
}

const PARIS_ARRONDISSEMENTS = Array.from({ length: 20 }, (_, i) => `75${String(i + 1).padStart(3, '0')}`)

const NEARBY_CITIES = [
  'Boulogne-Billancourt',
  'Neuilly-sur-Seine',
  'Levallois-Perret',
  'Issy-les-Moulineaux',
  'Saint-Cloud',
  'Montrouge',
  'Malakoff',
  'Vanves',
  'Clamart',
]

const DAYS_OF_WEEK = [
  { key: 'monday', label: 'Lundi' },
  { key: 'tuesday', label: 'Mardi' },
  { key: 'wednesday', label: 'Mercredi' },
  { key: 'thursday', label: 'Jeudi' },
  { key: 'friday', label: 'Vendredi' },
  { key: 'saturday', label: 'Samedi' },
  { key: 'sunday', label: 'Dimanche' },
] as const

type DayKey = typeof DAYS_OF_WEEK[number]['key']

export function Step3Availability({ initialData, onComplete, onPrevious }: Step3Props) {
  const {
    register,
    handleSubmit,
    control,
    watch,
    setValue,
    formState: { errors, isValid },
  } = useForm<Availability>({
    resolver: zodResolver(AvailabilitySchema),
    defaultValues: initialData,
    mode: 'onChange',
  })

  const weeklyAvailability = watch('weekly_availability') || {}

  const toggleDay = (day: DayKey) => {
    const current = weeklyAvailability[day]
    if (current?.available) {
      // Disable day
      setValue(`weekly_availability.${day}`, { available: false, shifts: [] }, { shouldValidate: true })
    } else {
      // Enable day with default shift
      setValue(`weekly_availability.${day}`, {
        available: true,
        shifts: [{ start: '09:00', end: '17:00' }],
        breaks: []
      }, { shouldValidate: true })
    }
  }

  const addShift = (day: DayKey) => {
    const current = weeklyAvailability[day]
    if (!current) return

    const newShifts = [...(current.shifts || []), { start: '09:00', end: '17:00' }]
    setValue(`weekly_availability.${day}.shifts`, newShifts, { shouldValidate: true })
  }

  const removeShift = (day: DayKey, index: number) => {
    const current = weeklyAvailability[day]
    if (!current) return

    const newShifts = current.shifts.filter((_, i) => i !== index)
    setValue(`weekly_availability.${day}.shifts`, newShifts, { shouldValidate: true })
  }

  const addBreak = (day: DayKey) => {
    const current = weeklyAvailability[day]
    if (!current) return

    const newBreaks = [...(current.breaks || []), { start: '12:00', end: '13:00' }]
    setValue(`weekly_availability.${day}.breaks`, newBreaks, { shouldValidate: true })
  }

  const removeBreak = (day: DayKey, index: number) => {
    const current = weeklyAvailability[day]
    if (!current) return

    const newBreaks = (current.breaks || []).filter((_, i) => i !== index)
    setValue(`weekly_availability.${day}.breaks`, newBreaks, { shouldValidate: true })
  }

  return (
    <form onSubmit={handleSubmit(onComplete)} className="space-y-6">
      <div>
        <h2 className="text-xl font-semibold text-gray-900 mb-4">
          Disponibilités et zones
        </h2>
        <p className="text-gray-600 mb-6">
          Où et quand souhaitez-vous intervenir ?
        </p>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Zones géographiques * (minimum 1)
        </label>

        <div className="space-y-4">
          <div>
            <p className="text-sm font-medium text-gray-600 mb-2">Arrondissements de Paris</p>
            <Controller
              name="geographic_zones"
              control={control}
              render={({ field }) => (
                <div className="grid grid-cols-5 gap-2 max-h-40 overflow-y-auto border border-gray-200 rounded-lg p-3">
                  {PARIS_ARRONDISSEMENTS.map((arr) => (
                    <label key={arr} className="flex items-center space-x-1 cursor-pointer hover:bg-gray-50 p-1 rounded text-sm">
                      <input
                        type="checkbox"
                        value={arr}
                        checked={field.value?.includes(arr) || false}
                        onChange={(e) => {
                          const current = field.value || []
                          if (e.target.checked) {
                            field.onChange([...current, arr])
                          } else {
                            field.onChange(current.filter(z => z !== arr))
                          }
                        }}
                        className="w-3 h-3 text-button-primary border-gray-300 rounded focus:ring-button-primary"
                      />
                      <span className="text-xs">{arr.slice(2)}</span>
                    </label>
                  ))}
                </div>
              )}
            />
          </div>

          <div>
            <p className="text-sm font-medium text-gray-600 mb-2">Villes proches</p>
            <Controller
              name="geographic_zones"
              control={control}
              render={({ field }) => (
                <div className="grid md:grid-cols-2 gap-2 border border-gray-200 rounded-lg p-3">
                  {NEARBY_CITIES.map((city) => (
                    <label key={city} className="flex items-center space-x-2 cursor-pointer hover:bg-gray-50 p-2 rounded">
                      <input
                        type="checkbox"
                        value={city}
                        checked={field.value?.includes(city) || false}
                        onChange={(e) => {
                          const current = field.value || []
                          if (e.target.checked) {
                            field.onChange([...current, city])
                          } else {
                            field.onChange(current.filter(z => z !== city))
                          }
                        }}
                        className="w-4 h-4 text-button-primary border-gray-300 rounded focus:ring-button-primary"
                      />
                      <span className="text-sm text-gray-700">{city}</span>
                    </label>
                  ))}
                </div>
              )}
            />
          </div>
        </div>

        {errors.geographic_zones && (
          <p className="mt-1 text-sm text-red-600">{errors.geographic_zones.message}</p>
        )}
      </div>

      <div>
        <label htmlFor="work_frequency" className="block text-sm font-medium text-gray-700 mb-1">
          Fréquence de travail souhaitée *
        </label>
        <select
          {...register('work_frequency')}
          id="work_frequency"
          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-button-primary focus:border-transparent"
        >
          <option value="">Sélectionnez...</option>
          <option value="full_time">Temps plein</option>
          <option value="part_time">Temps partiel</option>
          <option value="occasional">Occasionnel</option>
        </select>
        {errors.work_frequency && (
          <p className="mt-1 text-sm text-red-600">{errors.work_frequency.message}</p>
        )}
      </div>

      {/* Weekly Availability Schedule */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Horaires hebdomadaires <span className="text-gray-500 font-normal">(optionnel)</span>
        </label>
        <p className="text-sm text-gray-600 mb-4">
          Indiquez vos disponibilités par jour de la semaine avec horaires de début/fin et pauses
        </p>

        <div className="space-y-4 border border-gray-200 rounded-lg p-4">
          {DAYS_OF_WEEK.map((day) => {
            const dayData = weeklyAvailability[day.key]
            const isAvailable = dayData?.available || false

            return (
              <div key={day.key} className="border-b border-gray-100 last:border-0 pb-4 last:pb-0">
                {/* Day toggle */}
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-3">
                    <input
                      type="checkbox"
                      id={`day-${day.key}`}
                      checked={isAvailable}
                      onChange={() => toggleDay(day.key)}
                      className="w-4 h-4 text-button-primary border-gray-300 rounded focus:ring-button-primary"
                    />
                    <label
                      htmlFor={`day-${day.key}`}
                      className={`text-sm font-medium cursor-pointer ${isAvailable ? 'text-gray-900' : 'text-gray-500'}`}
                    >
                      {day.label}
                    </label>
                  </div>
                </div>

                {/* Shifts and breaks (shown when day is enabled) */}
                {isAvailable && dayData && (
                  <div className="ml-7 space-y-3">
                    {/* Shifts */}
                    <div>
                      <p className="text-xs font-medium text-gray-600 mb-2">Créneaux</p>
                      {dayData.shifts.map((shift, idx) => (
                        <div key={idx} className="flex items-center gap-2 mb-2">
                          <Clock className="h-4 w-4 text-gray-400" />
                          <input
                            type="time"
                            value={shift.start}
                            onChange={(e) => {
                              const newShifts = [...dayData.shifts]
                              newShifts[idx] = { ...shift, start: e.target.value }
                              setValue(`weekly_availability.${day.key}.shifts`, newShifts, { shouldValidate: true })
                            }}
                            className="px-2 py-1 text-sm border border-gray-300 rounded focus:ring-2 focus:ring-button-primary focus:border-transparent"
                          />
                          <span className="text-gray-500">à</span>
                          <input
                            type="time"
                            value={shift.end}
                            onChange={(e) => {
                              const newShifts = [...dayData.shifts]
                              newShifts[idx] = { ...shift, end: e.target.value }
                              setValue(`weekly_availability.${day.key}.shifts`, newShifts, { shouldValidate: true })
                            }}
                            className="px-2 py-1 text-sm border border-gray-300 rounded focus:ring-2 focus:ring-button-primary focus:border-transparent"
                          />
                          {dayData.shifts.length > 1 && (
                            <button
                              type="button"
                              onClick={() => removeShift(day.key, idx)}
                              className="text-red-600 hover:text-red-800"
                            >
                              <X className="h-4 w-4" />
                            </button>
                          )}
                        </div>
                      ))}
                      {dayData.shifts.length < 5 && (
                        <button
                          type="button"
                          onClick={() => addShift(day.key)}
                          className="text-sm text-button-primary hover:text-button-primary/80 flex items-center gap-1 mt-1"
                        >
                          <Plus className="h-3 w-3" />
                          Ajouter un créneau
                        </button>
                      )}
                    </div>

                    {/* Breaks */}
                    <div>
                      <p className="text-xs font-medium text-gray-600 mb-2">Pauses</p>
                      {dayData.breaks && dayData.breaks.length > 0 ? (
                        dayData.breaks.map((breakSlot, idx) => (
                          <div key={idx} className="flex items-center gap-2 mb-2">
                            <Clock className="h-4 w-4 text-gray-400" />
                            <input
                              type="time"
                              value={breakSlot.start}
                              onChange={(e) => {
                                const newBreaks = [...(dayData.breaks || [])]
                                newBreaks[idx] = { ...breakSlot, start: e.target.value }
                                setValue(`weekly_availability.${day.key}.breaks`, newBreaks, { shouldValidate: true })
                              }}
                              className="px-2 py-1 text-sm border border-gray-300 rounded focus:ring-2 focus:ring-button-primary focus:border-transparent"
                            />
                            <span className="text-gray-500">à</span>
                            <input
                              type="time"
                              value={breakSlot.end}
                              onChange={(e) => {
                                const newBreaks = [...(dayData.breaks || [])]
                                newBreaks[idx] = { ...breakSlot, end: e.target.value }
                                setValue(`weekly_availability.${day.key}.breaks`, newBreaks, { shouldValidate: true })
                              }}
                              className="px-2 py-1 text-sm border border-gray-300 rounded focus:ring-2 focus:ring-button-primary focus:border-transparent"
                            />
                            <button
                              type="button"
                              onClick={() => removeBreak(day.key, idx)}
                              className="text-red-600 hover:text-red-800"
                            >
                              <X className="h-4 w-4" />
                            </button>
                          </div>
                        ))
                      ) : (
                        <p className="text-xs text-gray-500 italic">Aucune pause</p>
                      )}
                      {(!dayData.breaks || dayData.breaks.length < 3) && (
                        <button
                          type="button"
                          onClick={() => addBreak(day.key)}
                          className="text-sm text-button-primary hover:text-button-primary/80 flex items-center gap-1 mt-1"
                        >
                          <Plus className="h-3 w-3" />
                          Ajouter une pause
                        </button>
                      )}
                    </div>
                  </div>
                )}
              </div>
            )
          })}
        </div>

        {errors.weekly_availability && (
          <p className="mt-1 text-sm text-red-600">{errors.weekly_availability.message as string}</p>
        )}
      </div>

      <div className="flex justify-between pt-4">
        <Button
          type="button"
          onClick={onPrevious}
          variant="outline"
          className="px-6 py-3 rounded-full"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Retour
        </Button>
        <Button
          type="submit"
          disabled={!isValid}
          className="px-8 py-3 bg-button-primary hover:bg-button-primary/90 text-white rounded-full"
        >
          Continuer
        </Button>
      </div>
    </form>
  )
}
