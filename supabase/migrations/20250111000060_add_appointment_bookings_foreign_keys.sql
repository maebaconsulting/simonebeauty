-- Add foreign keys for appointment_bookings table relationships

-- Add foreign key for client_id -> profiles(id)
ALTER TABLE appointment_bookings
ADD CONSTRAINT appointment_bookings_client_id_fkey
FOREIGN KEY (client_id)
REFERENCES profiles(id)
ON DELETE CASCADE;

-- Add foreign key for contractor_id -> profiles(id) (if not exists)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'appointment_bookings_contractor_id_fkey'
  ) THEN
    ALTER TABLE appointment_bookings
    ADD CONSTRAINT appointment_bookings_contractor_id_fkey
    FOREIGN KEY (contractor_id)
    REFERENCES profiles(id)
    ON DELETE SET NULL;
  END IF;
END $$;

-- Refresh the schema cache
NOTIFY pgrst, 'reload schema';
