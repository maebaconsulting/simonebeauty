/**
 * Schedule Validation Logic
 * Task: T051
 * Feature: 007-contractor-interface
 *
 * Prevents overlapping time ranges and validates schedule consistency
 */

import type { ContractorSchedule, TimeRange, DayOfWeek } from '@/types/contractor'

/**
 * Convert HH:MM format to minutes since midnight
 */
export function timeToMinutes(time: string): number {
  const [hours, minutes] = time.split(':').map(Number)
  return hours * 60 + minutes
}

/**
 * Convert HH:MM:SS format to minutes since midnight
 */
export function timeWithSecondsToMinutes(time: string): number {
  const [hours, minutes] = time.split(':').map(Number)
  return hours * 60 + minutes
}

/**
 * Check if two time ranges overlap
 */
export function timeRangesOverlap(
  range1: TimeRange,
  range2: TimeRange
): boolean {
  const start1 = timeToMinutes(range1.start)
  const end1 = timeToMinutes(range1.end)
  const start2 = timeToMinutes(range2.start)
  const end2 = timeToMinutes(range2.end)

  // Check for overlap: ranges overlap if start1 < end2 AND start2 < end1
  return start1 < end2 && start2 < end1
}

/**
 * Validate that a time range is valid (end > start)
 */
export function isValidTimeRange(range: TimeRange): boolean {
  if (!range.start || !range.end) return false

  const start = timeToMinutes(range.start)
  const end = timeToMinutes(range.end)

  return end > start
}

/**
 * Check if a new schedule entry would overlap with existing entries
 * for the same day
 */
export function hasScheduleConflict(
  newEntry: TimeRange,
  existingEntries: ContractorSchedule[],
  excludeId?: number
): { hasConflict: boolean; conflictingEntry?: ContractorSchedule } {
  // Convert new entry to comparable format
  const newRange: TimeRange = {
    start: newEntry.start,
    end: newEntry.end,
  }

  for (const existing of existingEntries) {
    // Skip if this is the entry being edited
    if (excludeId && existing.id === excludeId) continue

    // Skip if not active
    if (!existing.is_active) continue

    // Convert existing entry format (HH:MM:SS) to HH:MM
    const existingRange: TimeRange = {
      start: existing.start_time.substring(0, 5), // "HH:MM:SS" -> "HH:MM"
      end: existing.end_time.substring(0, 5),
    }

    if (timeRangesOverlap(newRange, existingRange)) {
      return {
        hasConflict: true,
        conflictingEntry: existing,
      }
    }
  }

  return { hasConflict: false }
}

/**
 * Validate schedule data before submission
 */
export interface ScheduleValidationError {
  field: string
  message: string
}

export function validateScheduleEntry(
  dayOfWeek: DayOfWeek,
  timeRange: TimeRange,
  existingEntries: ContractorSchedule[],
  excludeId?: number
): ScheduleValidationError[] {
  const errors: ScheduleValidationError[] = []

  // Validate day of week
  if (dayOfWeek < 0 || dayOfWeek > 6) {
    errors.push({
      field: 'day_of_week',
      message: 'Jour de la semaine invalide',
    })
  }

  // Validate time format
  if (!timeRange.start || !timeRange.start.match(/^([0-1][0-9]|2[0-3]):[0-5][0-9]$/)) {
    errors.push({
      field: 'start_time',
      message: 'Format d\'heure de début invalide (HH:MM)',
    })
  }

  if (!timeRange.end || !timeRange.end.match(/^([0-1][0-9]|2[0-3]):[0-5][0-9]$/)) {
    errors.push({
      field: 'end_time',
      message: 'Format d\'heure de fin invalide (HH:MM)',
    })
  }

  // Validate time range
  if (!isValidTimeRange(timeRange)) {
    errors.push({
      field: 'time_range',
      message: 'L\'heure de fin doit être après l\'heure de début',
    })
  }

  // Check for overlaps
  const { hasConflict, conflictingEntry } = hasScheduleConflict(
    timeRange,
    existingEntries,
    excludeId
  )

  if (hasConflict && conflictingEntry) {
    errors.push({
      field: 'time_range',
      message: `Ce créneau chevauche un horaire existant (${conflictingEntry.start_time.substring(0, 5)} - ${conflictingEntry.end_time.substring(0, 5)})`,
    })
  }

  return errors
}

/**
 * Format time from HH:MM:SS to HH:MM
 */
export function formatTimeToDisplay(time: string): string {
  return time.substring(0, 5)
}

/**
 * Format time from HH:MM to HH:MM:SS for database
 */
export function formatTimeForDatabase(time: string): string {
  return `${time}:00`
}

/**
 * Get day name from day of week number
 */
export function getDayName(dayOfWeek: DayOfWeek): string {
  const days = ['Dimanche', 'Lundi', 'Mardi', 'Mercredi', 'Jeudi', 'Vendredi', 'Samedi']
  return days[dayOfWeek]
}

/**
 * Get day of week number from day name (for UI mapping)
 */
export function getDayOfWeek(dayName: string): DayOfWeek {
  const mapping: Record<string, DayOfWeek> = {
    sunday: 0,
    monday: 1,
    tuesday: 2,
    wednesday: 3,
    thursday: 4,
    friday: 5,
    saturday: 6,
  }
  return mapping[dayName.toLowerCase()] || 1
}
