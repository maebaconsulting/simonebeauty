-- Migration: Add travel time columns to appointment_bookings
-- Task: T066 (Part 1)
-- Feature: 007-contractor-interface
-- Description: Add travel_time_before and travel_time_after columns for storing calculated travel times between consecutive bookings

-- Add travel time columns
ALTER TABLE appointment_bookings
ADD COLUMN IF NOT EXISTS travel_time_before INTEGER, -- Travel time in minutes from previous booking
ADD COLUMN IF NOT EXISTS travel_time_after INTEGER;  -- Travel time in minutes to next booking

-- Add comments for clarity
COMMENT ON COLUMN appointment_bookings.travel_time_before IS 'Calculated travel time in minutes from the previous booking location to this booking location (via Google Distance Matrix API)';
COMMENT ON COLUMN appointment_bookings.travel_time_after IS 'Calculated travel time in minutes from this booking location to the next booking location (via Google Distance Matrix API)';

-- Create index for efficient travel time queries
CREATE INDEX IF NOT EXISTS idx_appointment_bookings_contractor_date_time
ON appointment_bookings (contractor_id, scheduled_date, scheduled_time)
WHERE status NOT IN ('cancelled');
