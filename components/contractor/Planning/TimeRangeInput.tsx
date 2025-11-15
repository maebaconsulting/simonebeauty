'use client'

/**
 * TimeRangeInput Component
 * Task: T052
 * Feature: 007-contractor-interface
 *
 * Time range input with validation
 * Displays two time pickers (start and end)
 */

import { useState, useEffect } from 'react'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Clock, AlertCircle } from 'lucide-react'
import type { TimeRange } from '@/types/contractor'

interface TimeRangeInputProps {
  value: TimeRange
  onChange: (value: TimeRange) => void
  label?: string
  error?: string
  disabled?: boolean
}

export function TimeRangeInput({
  value,
  onChange,
  label,
  error,
  disabled = false,
}: TimeRangeInputProps) {
  const [localError, setLocalError] = useState<string | undefined>(error)

  useEffect(() => {
    setLocalError(error)
  }, [error])

  const validateTimeRange = (start: string, end: string): string | undefined => {
    if (!start || !end) return undefined

    // Parse times
    const [startH, startM] = start.split(':').map(Number)
    const [endH, endM] = end.split(':').map(Number)

    if (isNaN(startH) || isNaN(startM) || isNaN(endH) || isNaN(endM)) {
      return 'Format d\'heure invalide'
    }

    const startMinutes = startH * 60 + startM
    const endMinutes = endH * 60 + endM

    if (endMinutes <= startMinutes) {
      return 'L\'heure de fin doit être après l\'heure de début'
    }

    return undefined
  }

  const handleStartChange = (newStart: string) => {
    const validationError = validateTimeRange(newStart, value.end)
    setLocalError(validationError)
    onChange({ ...value, start: newStart })
  }

  const handleEndChange = (newEnd: string) => {
    const validationError = validateTimeRange(value.start, newEnd)
    setLocalError(validationError)
    onChange({ ...value, end: newEnd })
  }

  return (
    <div className="space-y-2">
      {label && (
        <Label className="text-sm font-medium text-gray-700 flex items-center gap-2">
          <Clock className="w-4 h-4" />
          {label}
        </Label>
      )}

      <div className="flex items-center gap-3">
        <div className="flex-1">
          <Input
            type="time"
            value={value.start}
            onChange={(e) => handleStartChange(e.target.value)}
            disabled={disabled}
            className={`${localError ? 'border-red-500 focus:border-red-500 focus:ring-red-500' : ''}`}
          />
        </div>

        <span className="text-gray-500 font-medium">—</span>

        <div className="flex-1">
          <Input
            type="time"
            value={value.end}
            onChange={(e) => handleEndChange(e.target.value)}
            disabled={disabled}
            className={`${localError ? 'border-red-500 focus:border-red-500 focus:ring-red-500' : ''}`}
          />
        </div>
      </div>

      {localError && (
        <div className="flex items-center gap-2 text-sm text-red-600">
          <AlertCircle className="w-4 h-4 flex-shrink-0" />
          <span>{localError}</span>
        </div>
      )}
    </div>
  )
}
