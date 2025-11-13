-- Migration: Create trigger function for automatic client code generation
-- Feature: 018-international-market-segmentation
-- Date: 2025-01-12

-- Create trigger function
CREATE OR REPLACE FUNCTION generate_client_code()
RETURNS TRIGGER AS $$
BEGIN
  -- Only generate code if not already set
  IF NEW.client_code IS NULL THEN
    NEW.client_code := 'CLI-' || LPAD(nextval('client_code_seq')::TEXT, 6, '0');
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION generate_client_code() IS
'Génère automatiquement un code client unique (CLI-XXXXXX) lors de l''insertion d''un nouveau profil. Utilise la séquence client_code_seq.';

-- Attach trigger to profiles table
DROP TRIGGER IF EXISTS profiles_generate_client_code_trigger ON profiles;

CREATE TRIGGER profiles_generate_client_code_trigger
BEFORE INSERT ON profiles
FOR EACH ROW
EXECUTE FUNCTION generate_client_code();

COMMENT ON TRIGGER profiles_generate_client_code_trigger ON profiles IS
'Trigger BEFORE INSERT qui génère automatiquement le client_code via generate_client_code().';

-- Test trigger with a dry run (commented out for production)
-- DO $$
-- DECLARE
--   test_code VARCHAR(10);
-- BEGIN
--   -- Simulate what the trigger would generate
--   test_code := 'CLI-' || LPAD(currval('client_code_seq')::TEXT + 1, 6, '0');
--   RAISE NOTICE 'Next client code will be: %', test_code;
-- END $$;

-- Verify trigger was created
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM information_schema.triggers
    WHERE event_object_table = 'profiles'
      AND trigger_name = 'profiles_generate_client_code_trigger'
  ) THEN
    RAISE EXCEPTION 'Trigger profiles_generate_client_code_trigger n''a pas été créé';
  END IF;

  RAISE NOTICE 'Trigger generate_client_code créé avec succès sur la table profiles';
END $$;
