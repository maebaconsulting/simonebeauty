-- Migration: Replace available_dates with weekly_availability
-- Feature: 007-contractor-interface
-- Date: 2025-11-08
-- Description:
--   - Remove available_dates (calendar date ranges)
--   - Add weekly_availability (day-of-week schedule with shifts and breaks)
--   - Structure: {day: {available, shifts: [{start, end}], breaks: [{start, end}]}}

-- ============================================================================
-- STEP 1: Drop old available_dates column
-- ============================================================================

ALTER TABLE contractor_applications
DROP COLUMN IF EXISTS available_dates;

-- ============================================================================
-- STEP 2: Add weekly_availability JSONB column
-- ============================================================================

ALTER TABLE contractor_applications
ADD COLUMN weekly_availability JSONB;

COMMENT ON COLUMN contractor_applications.weekly_availability IS
'Disponibilités hebdomadaires au format JSON:
{
  "monday": {
    "available": true,
    "shifts": [
      {"start": "09:00", "end": "12:00"},
      {"start": "14:00", "end": "18:00"}
    ],
    "breaks": [
      {"start": "10:30", "end": "10:45"}
    ]
  },
  "tuesday": { ... },
  "wednesday": { ... },
  "thursday": { ... },
  "friday": { ... },
  "saturday": { ... },
  "sunday": { ... }
}

- available: boolean indiquant si le prestataire est disponible ce jour
- shifts: tableau de créneaux horaires (format HH:mm)
- breaks: tableau de pauses (format HH:mm), optionnel';

-- ============================================================================
-- STEP 3: Create validation function for weekly_availability
-- ============================================================================

CREATE OR REPLACE FUNCTION validate_weekly_availability(data JSONB)
RETURNS BOOLEAN AS $$
DECLARE
  day_name TEXT;
  valid_days TEXT[] := ARRAY['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'];
BEGIN
  -- Allow NULL
  IF data IS NULL THEN
    RETURN TRUE;
  END IF;

  -- Check that all keys are valid day names
  FOR day_name IN SELECT jsonb_object_keys(data) LOOP
    IF NOT (day_name = ANY(valid_days)) THEN
      RAISE EXCEPTION 'Invalid day name: %. Must be one of: %', day_name, array_to_string(valid_days, ', ');
    END IF;
  END LOOP;

  -- Additional validation could be added here (time format, overlaps, etc.)

  RETURN TRUE;
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- STEP 4: Add check constraint using validation function
-- ============================================================================

ALTER TABLE contractor_applications
ADD CONSTRAINT check_weekly_availability_format
CHECK (validate_weekly_availability(weekly_availability));

-- ============================================================================
-- Verification queries (for manual testing)
-- ============================================================================

-- Verify table structure
-- SELECT column_name, data_type, is_nullable, column_default
-- FROM information_schema.columns
-- WHERE table_name = 'contractor_applications' AND column_name = 'weekly_availability';

-- Test validation function
-- SELECT validate_weekly_availability('{"monday": {"available": true, "shifts": [{"start": "09:00", "end": "17:00"}]}}'::jsonb);
