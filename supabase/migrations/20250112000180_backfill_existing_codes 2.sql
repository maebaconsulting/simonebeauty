-- Migration: Backfill existing profiles and contractors with unique codes
-- Feature: 018-international-market-segmentation
-- Date: 2025-01-12

-- This migration assigns codes to existing records WITHOUT codes
-- It's idempotent: can be run multiple times safely

DO $$
DECLARE
  client_count INTEGER := 0;
  contractor_count INTEGER := 0;
  next_client_seq INTEGER;
  next_contractor_seq INTEGER;
BEGIN
  -- Step 1: Backfill client codes for profiles WITHOUT codes
  -- Order by created_at for consistent assignment
  WITH numbered_clients AS (
    SELECT
      id,
      ROW_NUMBER() OVER (ORDER BY created_at, id) AS row_num
    FROM profiles
    WHERE client_code IS NULL
  )
  UPDATE profiles
  SET client_code = 'CLI-' || LPAD(numbered_clients.row_num::TEXT, 6, '0')
  FROM numbered_clients
  WHERE profiles.id = numbered_clients.id;

  -- Count how many clients were updated
  GET DIAGNOSTICS client_count = ROW_COUNT;

  -- Step 2: Update client_code_seq to next available value
  IF client_count > 0 THEN
    next_client_seq := client_count + 1;
    PERFORM setval('client_code_seq', next_client_seq, false);
    RAISE NOTICE 'Assigned % client codes, next sequence value: %', client_count, next_client_seq;
  ELSE
    RAISE NOTICE 'No client codes to backfill (all profiles already have codes)';
  END IF;

  -- Step 3: Backfill contractor codes for contractors WITHOUT codes
  -- Order by created_at for consistent assignment
  WITH numbered_contractors AS (
    SELECT
      id,
      ROW_NUMBER() OVER (ORDER BY created_at, id) AS row_num
    FROM contractors
    WHERE contractor_code IS NULL
  )
  UPDATE contractors
  SET contractor_code = 'CTR-' || LPAD(numbered_contractors.row_num::TEXT, 6, '0')
  FROM numbered_contractors
  WHERE contractors.id = numbered_contractors.id;

  -- Count how many contractors were updated
  GET DIAGNOSTICS contractor_count = ROW_COUNT;

  -- Step 4: Update contractor_code_seq to next available value
  IF contractor_count > 0 THEN
    next_contractor_seq := contractor_count + 1;
    PERFORM setval('contractor_code_seq', next_contractor_seq, false);
    RAISE NOTICE 'Assigned % contractor codes, next sequence value: %', contractor_count, next_contractor_seq;
  ELSE
    RAISE NOTICE 'No contractor codes to backfill (all contractors already have codes)';
  END IF;

  -- Step 5: Assign default market_id to contractors WITHOUT market assignment
  -- Default to France (market_id = 1) for existing contractors
  UPDATE contractors
  SET market_id = 1
  WHERE market_id IS NULL
    AND EXISTS (SELECT 1 FROM markets WHERE id = 1 AND code = 'FR');

  RAISE NOTICE 'Assigned default market (FR) to contractors without market_id';

  -- Summary
  RAISE NOTICE 'Backfill complete: % clients, % contractors', client_count, contractor_count;
END $$;

-- Verify backfill results
DO $$
DECLARE
  profiles_without_code INTEGER;
  contractors_without_code INTEGER;
  contractors_without_market INTEGER;
BEGIN
  SELECT COUNT(*) INTO profiles_without_code
  FROM profiles
  WHERE client_code IS NULL;

  SELECT COUNT(*) INTO contractors_without_code
  FROM contractors
  WHERE contractor_code IS NULL;

  SELECT COUNT(*) INTO contractors_without_market
  FROM contractors
  WHERE market_id IS NULL;

  IF profiles_without_code > 0 THEN
    RAISE WARNING '% profiles still without client_code!', profiles_without_code;
  END IF;

  IF contractors_without_code > 0 THEN
    RAISE WARNING '% contractors still without contractor_code!', contractors_without_code;
  END IF;

  IF contractors_without_market > 0 THEN
    RAISE WARNING '% contractors still without market_id!', contractors_without_market;
  END IF;

  IF profiles_without_code = 0 AND contractors_without_code = 0 AND contractors_without_market = 0 THEN
    RAISE NOTICE 'Backfill verification passed: all records have codes and market assignments';
  END IF;
END $$;
