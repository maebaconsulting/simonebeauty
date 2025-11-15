-- Migration: Create sequences for client and contractor unique codes
-- Feature: 018-international-market-segmentation
-- Date: 2025-01-12

-- Create sequence for client codes (CLI-XXXXXX)
CREATE SEQUENCE IF NOT EXISTS client_code_seq
  START WITH 1
  INCREMENT BY 1
  NO MINVALUE
  NO MAXVALUE
  CACHE 1;

COMMENT ON SEQUENCE client_code_seq IS
'Séquence pour génération automatique des codes clients (CLI-XXXXXX). Utilise nextval() dans trigger.';

-- Create sequence for contractor codes (CTR-XXXXXX)
CREATE SEQUENCE IF NOT EXISTS contractor_code_seq
  START WITH 1
  INCREMENT BY 1
  NO MINVALUE
  NO MAXVALUE
  CACHE 1;

COMMENT ON SEQUENCE contractor_code_seq IS
'Séquence pour génération automatique des codes prestataires (CTR-XXXXXX). Utilise nextval() dans trigger.';

-- Verify sequences were created
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_sequences WHERE schemaname = 'public' AND sequencename = 'client_code_seq') THEN
    RAISE EXCEPTION 'client_code_seq n''a pas été créée';
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_sequences WHERE schemaname = 'public' AND sequencename = 'contractor_code_seq') THEN
    RAISE EXCEPTION 'contractor_code_seq n''a pas été créée';
  END IF;

  RAISE NOTICE 'Séquences créées avec succès: client_code_seq, contractor_code_seq';
END $$;
