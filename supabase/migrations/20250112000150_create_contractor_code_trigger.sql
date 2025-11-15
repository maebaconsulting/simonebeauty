-- Migration: Create trigger function for automatic contractor code generation
-- Feature: 018-international-market-segmentation
-- Date: 2025-01-12

-- Create trigger function
CREATE OR REPLACE FUNCTION generate_contractor_code()
RETURNS TRIGGER AS $$
BEGIN
  -- Only generate code if not already set
  IF NEW.contractor_code IS NULL THEN
    NEW.contractor_code := 'CTR-' || LPAD(nextval('contractor_code_seq')::TEXT, 6, '0');
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION generate_contractor_code() IS
'Génère automatiquement un code prestataire unique (CTR-XXXXXX) lors de l''insertion d''un nouveau prestataire. Utilise la séquence contractor_code_seq.';

-- Attach trigger to contractors table
DROP TRIGGER IF EXISTS contractors_generate_contractor_code_trigger ON contractors;

CREATE TRIGGER contractors_generate_contractor_code_trigger
BEFORE INSERT ON contractors
FOR EACH ROW
EXECUTE FUNCTION generate_contractor_code();

COMMENT ON TRIGGER contractors_generate_contractor_code_trigger ON contractors IS
'Trigger BEFORE INSERT qui génère automatiquement le contractor_code via generate_contractor_code().';

-- Test trigger with a dry run (commented out for production)
-- DO $$
-- DECLARE
--   test_code VARCHAR(10);
-- BEGIN
--   -- Simulate what the trigger would generate
--   test_code := 'CTR-' || LPAD(currval('contractor_code_seq')::TEXT + 1, 6, '0');
--   RAISE NOTICE 'Next contractor code will be: %', test_code;
-- END $$;

-- Verify trigger was created
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM information_schema.triggers
    WHERE event_object_table = 'contractors'
      AND trigger_name = 'contractors_generate_contractor_code_trigger'
  ) THEN
    RAISE EXCEPTION 'Trigger contractors_generate_contractor_code_trigger n''a pas été créé';
  END IF;

  RAISE NOTICE 'Trigger generate_contractor_code créé avec succès sur la table contractors';
END $$;
