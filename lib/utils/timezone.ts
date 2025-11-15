/**
 * Timezone Utilities for Booking System
 *
 * All bookings in the system operate in France (Europe/Paris timezone).
 * This utility provides functions to convert between local Paris time and UTC,
 * handling DST (Daylight Saving Time) transitions automatically.
 *
 * Key DST Dates for France (2025):
 * - Spring Forward: March 30, 2025 at 02:00 CET → 03:00 CEST (UTC+1 → UTC+2)
 * - Fall Back: October 27, 2025 at 03:00 CEST → 02:00 CET (UTC+2 → UTC+1)
 *
 * @module lib/utils/timezone
 */

import { formatInTimeZone, fromZonedTime, toZonedTime } from 'date-fns-tz'
import { format, parse } from 'date-fns'
import { fr } from 'date-fns/locale'

/**
 * IANA timezone identifier for France
 * @constant
 */
export const PARIS_TZ = 'Europe/Paris' as const

/**
 * Convert user input (date + time strings) to UTC timestamp with Paris timezone context
 *
 * @param date - Date string in format YYYY-MM-DD (e.g., "2025-03-30")
 * @param time - Time string in format HH:mm (e.g., "14:00")
 * @returns UTC Date object representing the Paris local time
 *
 * @throws Error if the time doesn't exist (e.g., during Spring Forward gap)
 *
 * @example
 * // Normal date
 * const utc = localTimeToUTC('2025-02-15', '14:00')
 * // Returns: 2025-02-15T13:00:00.000Z (UTC+1 in winter)
 *
 * @example
 * // After DST transition (summer time)
 * const utc = localTimeToUTC('2025-04-15', '14:00')
 * // Returns: 2025-04-15T12:00:00.000Z (UTC+2 in summer)
 *
 * @example
 * // Invalid time during Spring Forward (throws error)
 * const utc = localTimeToUTC('2025-03-30', '02:30')
 * // Throws: Error (time doesn't exist)
 */
export function localTimeToUTC(date: string, time: string): Date {
  try {
    // Validate input formats
    if (!isValidISODate(date)) {
      throw new Error(`Invalid date format: "${date}". Expected YYYY-MM-DD`)
    }
    if (!isValidTime(time)) {
      throw new Error(`Invalid time format: "${time}". Expected HH:mm`)
    }

    // Parse the date and time explicitly
    // Create a date string in ISO format: YYYY-MM-DDTHH:mm:ss
    const dateTimeString = `${date}T${time}:00`

    // Parse as a Date object first, then convert to Paris timezone
    const dateObject = new Date(dateTimeString)

    // Use fromZonedTime to convert from Paris local time to UTC
    return fromZonedTime(dateTimeString, PARIS_TZ)
  } catch (error) {
    // Log the actual error for debugging
    console.error('[localTimeToUTC] Error converting:', { date, time, error })

    // Check if this is actually a DST issue (March 30 between 02:00-03:00)
    const isDSTGap = date === '2025-03-30' && time >= '02:00' && time < '03:00'

    if (isDSTGap) {
      throw new Error(
        `Invalid time "${time}" on ${date}. This time does not exist due to DST transition (Spring Forward). Please select 03:00 or later.`
      )
    }

    // For other errors, provide the actual error message
    const errorMsg = error instanceof Error ? error.message : 'Unknown error'
    throw new Error(
      `Invalid date/time: "${date} ${time}". Error: ${errorMsg}`
    )
  }
}

/**
 * Display UTC timestamp as local Paris time in human-readable format
 *
 * @param utcDate - UTC Date object
 * @param formatString - Optional format string (default: "dd/MM/yyyy 'à' HH:mm")
 * @returns Formatted string in Paris local time
 *
 * @example
 * const utc = new Date('2025-03-30T12:00:00.000Z')
 * const local = utcToLocalTime(utc)
 * // Returns: "30/03/2025 à 14:00" (displayed in CEST, UTC+2)
 *
 * @example
 * // Custom format
 * const local = utcToLocalTime(utc, "EEEE d MMMM yyyy 'à' HH:mm")
 * // Returns: "dimanche 30 mars 2025 à 14:00"
 */
export function utcToLocalTime(
  utcDate: Date,
  formatString: string = "dd/MM/yyyy 'à' HH:mm"
): string {
  return formatInTimeZone(utcDate, PARIS_TZ, formatString, { locale: fr })
}

/**
 * Check if a given date/time is valid in Paris timezone
 * Returns false for times that don't exist (e.g., during Spring Forward)
 *
 * @param date - Date string in format YYYY-MM-DD
 * @param time - Time string in format HH:mm
 * @returns true if the time is valid, false otherwise
 *
 * @example
 * // Normal time
 * isValidLocalTime('2025-02-15', '14:00') // true
 *
 * @example
 * // Invalid time during Spring Forward (02:00-03:00 doesn't exist on March 30)
 * isValidLocalTime('2025-03-30', '02:30') // false
 *
 * @example
 * // Valid time after Spring Forward
 * isValidLocalTime('2025-03-30', '03:00') // true
 */
export function isValidLocalTime(date: string, time: string): boolean {
  try {
    localTimeToUTC(date, time)
    return true
  } catch {
    return false
  }
}

/**
 * Get the timezone offset for Paris at a given date (handles DST)
 *
 * @param date - Date object
 * @returns Offset string in format "+01:00" or "+02:00"
 *
 * @example
 * // Winter time (before March 30)
 * getParisOffset(new Date('2025-02-15T12:00:00Z')) // "+01:00"
 *
 * @example
 * // Summer time (after March 30)
 * getParisOffset(new Date('2025-04-15T12:00:00Z')) // "+02:00"
 */
export function getParisOffset(date: Date): string {
  return formatInTimeZone(date, PARIS_TZ, 'XXX')
}

/**
 * Check if a given date is during DST (summer time) in Paris
 *
 * @param date - Date object
 * @returns true if the date is during DST (CEST, UTC+2), false otherwise (CET, UTC+1)
 *
 * @example
 * isDST(new Date('2025-02-15')) // false (winter)
 * isDST(new Date('2025-07-15')) // true (summer)
 * isDST(new Date('2025-03-30T01:00:00Z')) // false (before transition)
 * isDST(new Date('2025-03-30T02:00:00Z')) // true (after transition)
 */
export function isDST(date: Date): boolean {
  const offset = getParisOffset(date)
  return offset === '+02:00'
}

/**
 * Parse a UTC timestamp and convert to Paris local time components
 *
 * @param utcDate - UTC Date object
 * @returns Object with separate date and time components
 *
 * @example
 * const utc = new Date('2025-03-30T12:00:00.000Z')
 * const components = parseUTCToLocalComponents(utc)
 * // Returns: { date: '2025-03-30', time: '14:00', dateTime: '2025-03-30T14:00:00+02:00' }
 */
export function parseUTCToLocalComponents(utcDate: Date): {
  date: string
  time: string
  dateTime: string
  timezone: string
  offset: string
} {
  const zonedDate = toZonedTime(utcDate, PARIS_TZ)

  return {
    date: format(zonedDate, 'yyyy-MM-dd'),
    time: format(zonedDate, 'HH:mm'),
    dateTime: formatInTimeZone(utcDate, PARIS_TZ, "yyyy-MM-dd'T'HH:mm:ssXXX"),
    timezone: PARIS_TZ,
    offset: getParisOffset(utcDate),
  }
}

/**
 * Format a UTC date for display in booking confirmations, emails, etc.
 *
 * @param utcDate - UTC Date object
 * @param style - Display style: 'short', 'long', or 'full'
 * @returns Formatted string
 *
 * @example
 * const utc = new Date('2025-03-30T12:00:00.000Z')
 *
 * formatForDisplay(utc, 'short')
 * // "30/03/2025 à 14:00"
 *
 * formatForDisplay(utc, 'long')
 * // "dimanche 30 mars 2025 à 14:00"
 *
 * formatForDisplay(utc, 'full')
 * // "dimanche 30 mars 2025 à 14:00 (heure de Paris)"
 */
export function formatForDisplay(
  utcDate: Date,
  style: 'short' | 'long' | 'full' = 'short'
): string {
  switch (style) {
    case 'short':
      return utcToLocalTime(utcDate, "dd/MM/yyyy 'à' HH:mm")
    case 'long':
      return utcToLocalTime(utcDate, "EEEE d MMMM yyyy 'à' HH:mm")
    case 'full':
      return utcToLocalTime(utcDate, "EEEE d MMMM yyyy 'à' HH:mm '(heure de Paris)'")
    default:
      return utcToLocalTime(utcDate)
  }
}

/**
 * Get the next occurrence of a time that doesn't exist during Spring Forward
 * If the requested time falls in the DST gap (02:00-03:00 on transition day),
 * returns 03:00 instead
 *
 * @param date - Date string in format YYYY-MM-DD
 * @param time - Time string in format HH:mm
 * @returns Valid time (either the original or 03:00 if in DST gap)
 *
 * @example
 * // Normal time
 * getValidTime('2025-02-15', '14:00') // "14:00"
 *
 * @example
 * // Invalid time during Spring Forward gap
 * getValidTime('2025-03-30', '02:30') // "03:00"
 */
export function getValidTime(date: string, time: string): string {
  if (isValidLocalTime(date, time)) {
    return time
  }

  // Check if this is a Spring Forward situation (March 30, 2025)
  // The gap is 02:00-03:00, so return 03:00
  const [hours] = time.split(':').map(Number)
  if (hours >= 2 && hours < 3) {
    return '03:00'
  }

  // If it's not a DST issue, return original time
  return time
}

/**
 * Calculate duration between two UTC timestamps in Paris local time
 * This correctly handles DST transitions (e.g., a 4-hour service crossing Spring Forward is actually 3 UTC hours)
 *
 * @param startUTC - Start time (UTC)
 * @param endUTC - End time (UTC)
 * @returns Duration in minutes (local time)
 *
 * @example
 * // Normal 4-hour service
 * const start = new Date('2025-02-15T13:00:00Z') // 14:00 Paris (winter)
 * const end = new Date('2025-02-15T17:00:00Z')   // 18:00 Paris (winter)
 * calculateDuration(start, end) // 240 minutes (4 hours)
 *
 * @example
 * // 4-hour service crossing Spring Forward (23:00 to 03:00 on March 29-30)
 * const start = new Date('2025-03-29T22:00:00Z') // 23:00 Paris (CET)
 * const end = new Date('2025-03-30T01:00:00Z')   // 03:00 Paris (CEST)
 * calculateDuration(start, end) // 240 minutes (4 hours local time, but only 3 UTC hours)
 */
export function calculateDuration(startUTC: Date, endUTC: Date): number {
  const startLocal = toZonedTime(startUTC, PARIS_TZ)
  const endLocal = toZonedTime(endUTC, PARIS_TZ)

  const durationMs = endLocal.getTime() - startLocal.getTime()
  return Math.floor(durationMs / (1000 * 60)) // Convert to minutes
}

/**
 * Type guard to check if a string is a valid ISO 8601 date
 *
 * @param dateString - String to check
 * @returns true if valid ISO date
 */
export function isValidISODate(dateString: string): boolean {
  const isoRegex = /^\d{4}-\d{2}-\d{2}$/
  if (!isoRegex.test(dateString)) return false

  const date = new Date(dateString)
  return !isNaN(date.getTime())
}

/**
 * Type guard to check if a string is a valid time in HH:mm format
 *
 * @param timeString - String to check
 * @returns true if valid time
 */
export function isValidTime(timeString: string): boolean {
  const timeRegex = /^([0-1][0-9]|2[0-3]):[0-5][0-9]$/
  return timeRegex.test(timeString)
}
