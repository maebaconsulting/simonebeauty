/**
 * Unit Tests for Timezone Utilities
 *
 * These tests verify correct handling of timezone conversions, especially
 * around DST (Daylight Saving Time) transitions in France.
 *
 * Key DST Dates for France (2025):
 * - Spring Forward: March 30, 2025 at 02:00 CET → 03:00 CEST (UTC+1 → UTC+2)
 * - Fall Back: October 27, 2025 at 03:00 CEST → 02:00 CET (UTC+2 → UTC+1)
 */

import { describe, it, expect } from 'vitest'
import {
  localTimeToUTC,
  utcToLocalTime,
  isValidLocalTime,
  getParisOffset,
  isDST,
  parseUTCToLocalComponents,
  formatForDisplay,
  getValidTime,
  calculateDuration,
  isValidISODate,
  isValidTime,
  PARIS_TZ,
} from '@/lib/utils/timezone'

describe('Timezone Utilities', () => {
  describe('localTimeToUTC', () => {
    it('should convert winter time correctly (UTC+1)', () => {
      // February 15, 2025 at 14:00 Paris (CET) = 13:00 UTC
      const utc = localTimeToUTC('2025-02-15', '14:00')
      expect(utc.toISOString()).toBe('2025-02-15T13:00:00.000Z')
    })

    it('should convert summer time correctly (UTC+2)', () => {
      // July 15, 2025 at 14:00 Paris (CEST) = 12:00 UTC
      const utc = localTimeToUTC('2025-07-15', '14:00')
      expect(utc.toISOString()).toBe('2025-07-15T12:00:00.000Z')
    })

    it('should handle Spring Forward transition correctly', () => {
      // March 30, 2025 at 14:00 CEST (after transition) = 12:00 UTC
      const utc = localTimeToUTC('2025-03-30', '14:00')
      expect(utc.toISOString()).toBe('2025-03-30T12:00:00.000Z')
    })

    it('should handle Fall Back transition correctly', () => {
      // October 27, 2025 at 14:00 CET (after transition) = 13:00 UTC
      const utc = localTimeToUTC('2025-10-27', '14:00')
      expect(utc.toISOString()).toBe('2025-10-27T13:00:00.000Z')
    })

    it('should throw error for invalid time during Spring Forward gap', () => {
      // March 30, 2025 at 02:30 doesn't exist (Spring Forward gap: 02:00-03:00)
      expect(() => localTimeToUTC('2025-03-30', '02:30')).toThrow()
    })

    it('should accept time at Spring Forward boundary (03:00)', () => {
      // March 30, 2025 at 03:00 CEST = 01:00 UTC
      const utc = localTimeToUTC('2025-03-30', '03:00')
      expect(utc.toISOString()).toBe('2025-03-30T01:00:00.000Z')
    })
  })

  describe('utcToLocalTime', () => {
    it('should format winter time correctly', () => {
      const utc = new Date('2025-02-15T13:00:00.000Z')
      const local = utcToLocalTime(utc)
      expect(local).toBe('15/02/2025 à 14:00')
    })

    it('should format summer time correctly', () => {
      const utc = new Date('2025-07-15T12:00:00.000Z')
      const local = utcToLocalTime(utc)
      expect(local).toBe('15/07/2025 à 14:00')
    })

    it('should format time after Spring Forward transition', () => {
      // 12:00 UTC on March 30 = 14:00 CEST (not 13:00 CET)
      const utc = new Date('2025-03-30T12:00:00.000Z')
      const local = utcToLocalTime(utc)
      expect(local).toBe('30/03/2025 à 14:00')
    })

    it('should accept custom format strings', () => {
      const utc = new Date('2025-02-15T13:00:00.000Z')
      const local = utcToLocalTime(utc, 'yyyy-MM-dd HH:mm')
      expect(local).toBe('2025-02-15 14:00')
    })
  })

  describe('isValidLocalTime', () => {
    it('should return true for normal times', () => {
      expect(isValidLocalTime('2025-02-15', '14:00')).toBe(true)
      expect(isValidLocalTime('2025-07-15', '14:00')).toBe(true)
    })

    it('should return false for times in Spring Forward gap', () => {
      // March 30, 2025: 02:00-03:00 doesn't exist
      expect(isValidLocalTime('2025-03-30', '02:00')).toBe(false)
      expect(isValidLocalTime('2025-03-30', '02:15')).toBe(false)
      expect(isValidLocalTime('2025-03-30', '02:30')).toBe(false)
      expect(isValidLocalTime('2025-03-30', '02:59')).toBe(false)
    })

    it('should return true for time after Spring Forward gap', () => {
      expect(isValidLocalTime('2025-03-30', '03:00')).toBe(true)
      expect(isValidLocalTime('2025-03-30', '03:01')).toBe(true)
    })

    it('should return true for time before Spring Forward gap', () => {
      expect(isValidLocalTime('2025-03-30', '01:59')).toBe(true)
    })

    it('should return true for ambiguous times during Fall Back', () => {
      // October 27, 2025: 02:00-03:00 exists twice
      // date-fns-tz uses first occurrence by default
      expect(isValidLocalTime('2025-10-27', '02:30')).toBe(true)
    })
  })

  describe('getParisOffset', () => {
    it('should return +01:00 for winter time', () => {
      const date = new Date('2025-02-15T12:00:00Z')
      expect(getParisOffset(date)).toBe('+01:00')
    })

    it('should return +02:00 for summer time', () => {
      const date = new Date('2025-07-15T12:00:00Z')
      expect(getParisOffset(date)).toBe('+02:00')
    })

    it('should return +02:00 after Spring Forward', () => {
      const date = new Date('2025-03-30T12:00:00Z')
      expect(getParisOffset(date)).toBe('+02:00')
    })

    it('should return +01:00 after Fall Back', () => {
      const date = new Date('2025-10-27T12:00:00Z')
      expect(getParisOffset(date)).toBe('+01:00')
    })
  })

  describe('isDST', () => {
    it('should return false for winter time', () => {
      expect(isDST(new Date('2025-02-15T12:00:00Z'))).toBe(false)
      expect(isDST(new Date('2025-12-15T12:00:00Z'))).toBe(false)
    })

    it('should return true for summer time', () => {
      expect(isDST(new Date('2025-07-15T12:00:00Z'))).toBe(true)
      expect(isDST(new Date('2025-08-15T12:00:00Z'))).toBe(true)
    })

    it('should handle Spring Forward transition', () => {
      // Before transition (01:00 UTC = 02:00 CET)
      expect(isDST(new Date('2025-03-30T00:59:00Z'))).toBe(false)

      // After transition (01:00 UTC = 03:00 CEST)
      expect(isDST(new Date('2025-03-30T01:01:00Z'))).toBe(true)
    })

    it('should handle Fall Back transition', () => {
      // Before transition (01:00 UTC = 03:00 CEST)
      expect(isDST(new Date('2025-10-26T23:59:00Z'))).toBe(true)

      // After transition (02:00 UTC = 03:00 CET)
      expect(isDST(new Date('2025-10-27T02:01:00Z'))).toBe(false)
    })
  })

  describe('parseUTCToLocalComponents', () => {
    it('should parse winter time correctly', () => {
      const utc = new Date('2025-02-15T13:00:00.000Z')
      const components = parseUTCToLocalComponents(utc)

      expect(components.date).toBe('2025-02-15')
      expect(components.time).toBe('14:00')
      expect(components.timezone).toBe(PARIS_TZ)
      expect(components.offset).toBe('+01:00')
    })

    it('should parse summer time correctly', () => {
      const utc = new Date('2025-07-15T12:00:00.000Z')
      const components = parseUTCToLocalComponents(utc)

      expect(components.date).toBe('2025-07-15')
      expect(components.time).toBe('14:00')
      expect(components.timezone).toBe(PARIS_TZ)
      expect(components.offset).toBe('+02:00')
    })
  })

  describe('formatForDisplay', () => {
    const utc = new Date('2025-03-30T12:00:00.000Z')

    it('should format with short style', () => {
      expect(formatForDisplay(utc, 'short')).toBe('30/03/2025 à 14:00')
    })

    it('should format with long style', () => {
      const formatted = formatForDisplay(utc, 'long')
      expect(formatted).toContain('30')
      expect(formatted).toContain('mars')
      expect(formatted).toContain('2025')
      expect(formatted).toContain('14:00')
    })

    it('should format with full style', () => {
      const formatted = formatForDisplay(utc, 'full')
      expect(formatted).toContain('heure de Paris')
    })

    it('should default to short style', () => {
      expect(formatForDisplay(utc)).toBe('30/03/2025 à 14:00')
    })
  })

  describe('getValidTime', () => {
    it('should return original time for valid times', () => {
      expect(getValidTime('2025-02-15', '14:00')).toBe('14:00')
      expect(getValidTime('2025-03-30', '14:00')).toBe('14:00')
    })

    it('should return 03:00 for times in Spring Forward gap', () => {
      expect(getValidTime('2025-03-30', '02:00')).toBe('03:00')
      expect(getValidTime('2025-03-30', '02:15')).toBe('03:00')
      expect(getValidTime('2025-03-30', '02:30')).toBe('03:00')
      expect(getValidTime('2025-03-30', '02:59')).toBe('03:00')
    })

    it('should return original time for boundary times', () => {
      expect(getValidTime('2025-03-30', '01:59')).toBe('01:59')
      expect(getValidTime('2025-03-30', '03:00')).toBe('03:00')
    })
  })

  describe('calculateDuration', () => {
    it('should calculate duration correctly for normal times', () => {
      const start = new Date('2025-02-15T13:00:00Z') // 14:00 Paris
      const end = new Date('2025-02-15T17:00:00Z')   // 18:00 Paris
      expect(calculateDuration(start, end)).toBe(240) // 4 hours = 240 minutes
    })

    it('should calculate duration correctly across Spring Forward', () => {
      // Service from 23:00 March 29 to 03:00 March 30
      // Clock jumps from 02:00 to 03:00, but service is still 4 hours local time
      const start = new Date('2025-03-29T22:00:00Z') // 23:00 CET
      const end = new Date('2025-03-30T01:00:00Z')   // 03:00 CEST
      // Only 3 UTC hours elapsed, but 4 hours local time
      expect(calculateDuration(start, end)).toBe(240) // 4 hours local time
    })

    it('should calculate duration correctly across Fall Back', () => {
      // Service from 23:00 October 26 to 03:00 October 27
      // Clock goes back from 03:00 to 02:00, so 4 hours local time = 5 UTC hours
      const start = new Date('2025-10-26T22:00:00Z') // 00:00 CEST (October 27)
      const end = new Date('2025-10-27T03:00:00Z')   // 04:00 CET (October 27)
      // 5 UTC hours elapsed, but only 4 hours local time displayed
      expect(calculateDuration(start, end)).toBe(300) // 5 hours UTC = 300 minutes
    })
  })

  describe('isValidISODate', () => {
    it('should validate correct ISO dates', () => {
      expect(isValidISODate('2025-02-15')).toBe(true)
      expect(isValidISODate('2025-12-31')).toBe(true)
      expect(isValidISODate('2025-01-01')).toBe(true)
    })

    it('should reject invalid ISO dates', () => {
      expect(isValidISODate('2025-13-01')).toBe(false) // Invalid month
      expect(isValidISODate('2025-02-30')).toBe(false) // Invalid day
      expect(isValidISODate('15/02/2025')).toBe(false) // Wrong format
      expect(isValidISODate('2025-2-15')).toBe(false)  // Missing zero padding
      expect(isValidISODate('not-a-date')).toBe(false)
    })
  })

  describe('isValidTime', () => {
    it('should validate correct time strings', () => {
      expect(isValidTime('00:00')).toBe(true)
      expect(isValidTime('12:30')).toBe(true)
      expect(isValidTime('23:59')).toBe(true)
      expect(isValidTime('14:00')).toBe(true)
    })

    it('should reject invalid time strings', () => {
      expect(isValidTime('24:00')).toBe(false) // Invalid hour
      expect(isValidTime('12:60')).toBe(false) // Invalid minute
      expect(isValidTime('2:30')).toBe(false)  // Missing zero padding
      expect(isValidTime('12:5')).toBe(false)  // Missing zero padding
      expect(isValidTime('12')).toBe(false)    // Missing minutes
      expect(isValidTime('not-a-time')).toBe(false)
    })
  })

  describe('Integration: Booking Flow Scenario', () => {
    it('should handle complete booking flow for DST transition day', () => {
      // User selects March 30, 2025 at 14:00 (after Spring Forward)
      const userDate = '2025-03-30'
      const userTime = '14:00'

      // 1. Validate the time is valid
      expect(isValidLocalTime(userDate, userTime)).toBe(true)

      // 2. Convert to UTC for storage
      const utc = localTimeToUTC(userDate, userTime)
      expect(utc.toISOString()).toBe('2025-03-30T12:00:00.000Z')

      // 3. Verify it's in DST
      expect(isDST(utc)).toBe(true)
      expect(getParisOffset(utc)).toBe('+02:00')

      // 4. Format for display in confirmation email
      const displayShort = formatForDisplay(utc, 'short')
      expect(displayShort).toBe('30/03/2025 à 14:00')

      // 5. Parse back to components
      const components = parseUTCToLocalComponents(utc)
      expect(components.date).toBe('2025-03-30')
      expect(components.time).toBe('14:00')
    })

    it('should prevent booking invalid time during Spring Forward', () => {
      const userDate = '2025-03-30'
      const userTime = '02:30' // Doesn't exist

      // 1. Validate fails
      expect(isValidLocalTime(userDate, userTime)).toBe(false)

      // 2. Get valid alternative
      const validTime = getValidTime(userDate, userTime)
      expect(validTime).toBe('03:00')

      // 3. Use the valid time instead
      const utc = localTimeToUTC(userDate, validTime)
      expect(utc.toISOString()).toBe('2025-03-30T01:00:00.000Z')
    })
  })
})
