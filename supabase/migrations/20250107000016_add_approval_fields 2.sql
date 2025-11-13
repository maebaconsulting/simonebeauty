/**
 * Add Approval Fields to Contractor Applications
 * Task: Fix approval status update issue
 * Feature: 007-contractor-interface
 *
 * Adds missing columns that the approve-contractor-application edge function
 * tries to update but were never created in the original schema.
 */

-- Add approved_at timestamp to track when the application was approved
ALTER TABLE contractor_applications
ADD COLUMN approved_at TIMESTAMP;

-- Add created_contractor_id to link to the contractor record created upon approval
ALTER TABLE contractor_applications
ADD COLUMN created_contractor_id UUID REFERENCES contractors(id) ON DELETE SET NULL;

-- Create index for faster lookups by contractor_id
CREATE INDEX idx_contractor_applications_contractor
ON contractor_applications(created_contractor_id);

-- Add comment for documentation
COMMENT ON COLUMN contractor_applications.approved_at IS 'Timestamp when the application was approved';
COMMENT ON COLUMN contractor_applications.created_contractor_id IS 'Reference to the contractor record created when this application was approved';
