# Developer Quickstart: International Market Segmentation

**Feature**: 018-international-market-segmentation
**Date**: 2025-11-12
**Audience**: Developers implementing or testing market segmentation features

## Overview

This guide helps developers quickly understand and work with international market segmentation, unique user codes, and market-based RLS policies. Follow these workflows to implement, test, and debug the feature.

---

## Table of Contents

1. [Local Development Setup](#local-development-setup)
2. [Creating Markets](#creating-markets)
3. [Assigning Contractors to Markets](#assigning-contractors-to-markets)
4. [Testing Unique Code Generation](#testing-unique-code-generation)
5. [Configuring Services for Markets](#configuring-services-for-markets)
6. [Testing RLS Policies](#testing-rls-policies)
7. [Running Migrations](#running-migrations)
8. [Troubleshooting](#troubleshooting)

---

## Local Development Setup

### 1. Database Connection

Ensure your `.env.local` has the Supabase connection configured:

```bash
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
```

### 2. Apply Migrations

Run all migrations in order:

```bash
cd supabase

# Connect to database
psql -h db.xpntvajwrjuvsqsmizzb.supabase.co -U postgres -d postgres

# Run migrations in order
\i migrations/20250112000100_create_markets_table.sql
\i migrations/20250112000110_create_code_sequences.sql
\i migrations/20250112000120_add_code_columns.sql
\i migrations/20250112000130_create_code_triggers.sql
\i migrations/20250112000140_add_market_assignment.sql
\i migrations/20250112000150_create_service_market_availability.sql
\i migrations/20250112000160_create_market_rls_policies.sql
\i migrations/20250112000170_migrate_existing_codes.sql
\i migrations/20250112000180_update_contractor_rls.sql
```

### 3. Verify Setup

```sql
-- Check markets table exists
\dt markets

-- Check sequences exist
\ds *code*

-- Check triggers exist
SELECT tgname FROM pg_trigger WHERE tgname LIKE '%code%';

-- Check RLS enabled
SELECT tablename, rowsecurity FROM pg_tables WHERE tablename IN ('markets', 'contractors', 'profiles');
```

---

## Creating Markets

### Via SQL (Quick Setup)

```sql
INSERT INTO markets (name, code, currency_code, timezone, supported_languages) VALUES
('France', 'FR', 'EUR', 'Europe/Paris', '["fr", "en"]'),
('Belgium', 'BE', 'EUR', 'Europe/Brussels', '["fr', 'nl", "en"]'),
('Switzerland', 'CH', 'CHF', 'Europe/Zurich', '["fr", "de", "it", "en"]'),
('Spain', 'ES', 'EUR', 'Europe/Madrid', '["es", "en"]'),
('Germany', 'DE', 'EUR', 'Europe/Berlin', '["de", "en"]');
```

### Via Admin UI (Next.js)

1. Log in as admin: `http://localhost:3000/admin`
2. Navigate to Markets: `http://localhost:3000/admin/markets`
3. Click "Create Market"
4. Fill form:
   - Name: "Switzerland"
   - Code: "CH" (2-3 uppercase letters)
   - Currency: "CHF" (dropdown)
   - Timezone: "Europe/Zurich" (autocomplete)
   - Languages: ["fr", "de", "it", "en"] (multi-select)
   - Active: true (checkbox)
5. Submit

### Via API (cURL)

```bash
curl -X POST http://localhost:3000/api/admin/markets \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_ADMIN_TOKEN" \
  -d '{
    "name": "Switzerland",
    "code": "CH",
    "currency_code": "CHF",
    "timezone": "Europe/Zurich",
    "supported_languages": ["fr", "de", "it", "en"],
    "is_active": true
  }'
```

### Validation

```sql
-- Check market was created
SELECT * FROM markets WHERE code = 'CH';

-- Check RLS allows public read
SET ROLE anon;
SELECT name, code FROM markets WHERE is_active = true;
-- Should see all active markets

RESET ROLE;
```

---

## Assigning Contractors to Markets

### Via SQL (Bulk Assignment)

```sql
-- Assign existing contractors to France market
UPDATE contractors
SET market_id = (SELECT id FROM markets WHERE code = 'FR')
WHERE id IN (1, 2, 3);

-- Verify assignment
SELECT id, business_name, contractor_code, market_id FROM contractors WHERE id IN (1, 2, 3);
```

### Via Admin UI

1. Navigate to Contractor Profile: `http://localhost:3000/admin/contractors/1/edit`
2. Select Market dropdown: "France (FR)"
3. Save

**Note**: After migration, `market_id` is NOT NULL (required field)

### Validation

```sql
-- Check contractor assigned to market
SELECT
  c.id,
  c.business_name,
  c.contractor_code,
  c.market_id,
  m.name AS market_name,
  m.code AS market_code
FROM contractors c
JOIN markets m ON c.market_id = m.id
WHERE c.id = 1;

-- Check RLS filters by market (simulate contractor view)
SET ROLE authenticated;
SET request.jwt.claim.sub TO 'contractor-uuid-france';
SELECT id, business_name FROM contractors WHERE market_id = 2; -- Belgium
-- Expected: Empty result (contractor can't see other markets)

RESET ROLE;
```

---

## Testing Unique Code Generation

### Test Client Code Generation

```sql
-- Insert new client (trigger should auto-generate code)
INSERT INTO profiles (id, email, role)
VALUES (gen_random_uuid(), 'test@example.com', 'client')
RETURNING id, client_code, email;

-- Expected output:
-- id        | client_code | email
-- uuid-here | CLI-000001  | test@example.com
```

### Test Contractor Code Generation

```sql
-- Insert new contractor (trigger should auto-generate code)
INSERT INTO contractors (business_name, market_id, is_active)
VALUES ('Test Salon', 1, true)
RETURNING id, contractor_code, business_name;

-- Expected output:
-- id | contractor_code | business_name
-- 1  | CTR-000001      | Test Salon
```

### Test Code Uniqueness

```sql
-- Insert multiple clients concurrently (simulate load)
BEGIN;
INSERT INTO profiles (id, email, role)
SELECT gen_random_uuid(), 'client' || i || '@example.com', 'client'
FROM generate_series(1, 100) AS i;
COMMIT;

-- Check all have unique sequential codes
SELECT client_code, COUNT(*) FROM profiles GROUP BY client_code HAVING COUNT(*) > 1;
-- Expected: Empty result (no duplicates)

-- Check codes are sequential
SELECT client_code FROM profiles ORDER BY created_at LIMIT 10;
-- Expected: CLI-000001, CLI-000002, ..., CLI-000010
```

### Test Idempotency (Manual Code Override)

```sql
-- Insert with manual code (trigger should NOT override)
INSERT INTO profiles (id, email, role, client_code)
VALUES (gen_random_uuid(), 'vip@example.com', 'client', 'CLI-999999')
RETURNING id, client_code;

-- Expected: CLI-999999 (not auto-generated)

-- Next auto-generated code should skip 999999
INSERT INTO profiles (id, email, role)
VALUES (gen_random_uuid(), 'next@example.com', 'client')
RETURNING client_code;

-- Expected: CLI-000101 (next in sequence, not CLI-999999)
```

---

## Configuring Services for Markets

### Add Service to Multiple Markets with Pricing

```sql
-- Service 1 (Haircut) available in France, Belgium, Switzerland
INSERT INTO service_market_availability (service_id, market_id, price_cents, currency_code) VALUES
(1, (SELECT id FROM markets WHERE code = 'FR'), 3500, 'EUR'),  -- €35.00
(1, (SELECT id FROM markets WHERE code = 'BE'), 3200, 'EUR'),  -- €32.00
(1, (SELECT id FROM markets WHERE code = 'CH'), 4500, 'CHF');  -- CHF 45.00
```

### Verify Service Availability

```sql
-- Get all services available in France
SELECT
  s.id,
  s.name,
  COALESCE(sma.price_cents, s.base_price) AS price_cents,
  COALESCE(sma.currency_code, m.currency_code) AS currency_code
FROM services s
JOIN service_market_availability sma ON s.id = sma.service_id
JOIN markets m ON sma.market_id = m.id
WHERE m.code = 'FR' AND sma.is_available = true;
```

### Test Market-Specific Pricing

```sql
-- Client in France sees EUR price
SELECT
  s.name,
  sma.price_cents,
  sma.currency_code
FROM services s
JOIN service_market_availability sma ON s.id = sma.service_id
WHERE sma.market_id = (SELECT id FROM markets WHERE code = 'FR')
  AND s.id = 1;

-- Expected: 3500 cents, EUR (€35.00)

-- Client in Switzerland sees CHF price
SELECT
  s.name,
  sma.price_cents,
  sma.currency_code
FROM services s
JOIN service_market_availability sma ON s.id = sma.service_id
WHERE sma.market_id = (SELECT id FROM markets WHERE code = 'CH')
  AND s.id = 1;

-- Expected: 4500 cents, CHF (CHF 45.00)
```

---

## Testing RLS Policies

### Setup Test Users

```sql
-- Create test contractor in France
INSERT INTO contractors (id, business_name, market_id, is_active)
VALUES ('contractor-france-uuid', 'France Salon', (SELECT id FROM markets WHERE code = 'FR'), true)
RETURNING id, contractor_code;

-- Create test contractor in Belgium
INSERT INTO contractors (id, business_name, market_id, is_active)
VALUES ('contractor-belgium-uuid', 'Belgium Spa', (SELECT id FROM markets WHERE code = 'BE'), true)
RETURNING id, contractor_code;

-- Create test admin
INSERT INTO profiles (id, email, role)
VALUES ('admin-uuid', 'admin@example.com', 'admin');
```

### Test 1: Contractor Can Only See Own Market

```sql
-- Simulate France contractor logged in
SET ROLE authenticated;
SET request.jwt.claim.sub TO 'contractor-france-uuid';

-- Should see France contractors (including self)
SELECT business_name, market_id FROM contractors WHERE market_id = (SELECT id FROM markets WHERE code = 'FR');
-- Expected: France Salon (and other France contractors)

-- Should NOT see Belgium contractors
SELECT business_name, market_id FROM contractors WHERE market_id = (SELECT id FROM markets WHERE code = 'BE');
-- Expected: Empty result

RESET ROLE;
```

### Test 2: Admin Sees All Markets

```sql
-- Simulate admin logged in
SET ROLE authenticated;
SET request.jwt.claim.sub TO 'admin-uuid';
SET request.jwt.claim.role TO 'admin';

-- Should see all contractors across all markets
SELECT business_name, market_id FROM contractors;
-- Expected: All contractors (France, Belgium, etc.)

-- Should see inactive markets
SELECT name FROM markets WHERE is_active = false;
-- Expected: All inactive markets (if any)

RESET ROLE;
```

### Test 3: Client Cannot See Other Clients' Codes

```sql
-- Create two clients
INSERT INTO profiles (id, email, role)
VALUES
  ('client-1-uuid', 'client1@example.com', 'client'),
  ('client-2-uuid', 'client2@example.com', 'client');

-- Simulate client 1 logged in
SET ROLE authenticated;
SET request.jwt.claim.sub TO 'client-1-uuid';

-- Should see own code
SELECT client_code FROM profiles WHERE id = 'client-1-uuid';
-- Expected: CLI-000XXX (own code)

-- Should NOT see other client's code
SELECT client_code FROM profiles WHERE id = 'client-2-uuid';
-- Expected: Empty result

RESET ROLE;
```

### Test 4: Booking Respects Market Boundaries

```sql
-- Try to create booking with contractor from different market
-- (Should fail if client and contractor markets don't match)
SET ROLE authenticated;
SET request.jwt.claim.sub TO 'client-1-uuid';
SET request.jwt.claim.role TO 'client';

-- Attempt booking with Belgium contractor (should be allowed by policy, but app logic should validate)
INSERT INTO appointment_bookings (client_id, contractor_id, service_id, scheduled_datetime)
VALUES (
  'client-1-uuid',
  'contractor-belgium-uuid',
  1,
  NOW() + INTERVAL '1 day'
);

-- Check if booking was created
SELECT * FROM appointment_bookings WHERE client_id = 'client-1-uuid';

RESET ROLE;
```

**Note**: Application logic should validate market compatibility before creating bookings.

---

## Running Migrations

### Initial Migration (New Database)

```bash
# Apply all migrations in sequence
./scripts/apply-migrations.sh

# OR manually
psql $DATABASE_URL -f supabase/migrations/20250112000100_create_markets_table.sql
psql $DATABASE_URL -f supabase/migrations/20250112000110_create_code_sequences.sql
# ... (continue with all migrations)
```

### Backfill Existing Data

```bash
# Run code backfill migration
psql $DATABASE_URL -f supabase/migrations/20250112000170_migrate_existing_codes.sql

# Verify all users have codes
psql $DATABASE_URL -c "SELECT COUNT(*) AS total, COUNT(client_code) AS with_code FROM profiles;"
-- Expected: total = with_code

psql $DATABASE_URL -c "SELECT COUNT(*) AS total, COUNT(contractor_code) AS with_code FROM contractors;"
-- Expected: total = with_code
```

### Rollback Migration (Emergency)

```sql
-- Drop triggers
DROP TRIGGER IF EXISTS client_code_trigger ON profiles;
DROP TRIGGER IF EXISTS contractor_code_trigger ON contractors;

-- Drop functions
DROP FUNCTION IF EXISTS generate_client_code();
DROP FUNCTION IF EXISTS generate_contractor_code();

-- Remove columns (WARNING: data loss)
ALTER TABLE profiles DROP COLUMN IF EXISTS client_code;
ALTER TABLE contractors DROP COLUMN IF EXISTS contractor_code;
ALTER TABLE contractors DROP COLUMN IF EXISTS market_id;

-- Drop tables
DROP TABLE IF EXISTS service_market_availability;
DROP TABLE IF EXISTS markets;

-- Drop sequences
DROP SEQUENCE IF EXISTS client_code_seq;
DROP SEQUENCE IF EXISTS contractor_code_seq;
```

---

## Troubleshooting

### Issue 1: Trigger Not Generating Codes

**Symptom**: New client/contractor inserted but `client_code` or `contractor_code` is NULL

**Debug**:
```sql
-- Check if trigger exists
SELECT tgname, tgenabled FROM pg_trigger WHERE tgname = 'client_code_trigger';

-- Check if function exists
\df generate_client_code

-- Check sequence value
SELECT last_value FROM client_code_seq;

-- Test trigger manually
INSERT INTO profiles (id, email, role)
VALUES (gen_random_uuid(), 'debug@example.com', 'client')
RETURNING client_code;
```

**Fix**:
```sql
-- Recreate trigger
CREATE TRIGGER client_code_trigger
BEFORE INSERT ON profiles
FOR EACH ROW
EXECUTE FUNCTION generate_client_code();
```

---

### Issue 2: RLS Blocking Admin Access

**Symptom**: Admin cannot see all markets/contractors

**Debug**:
```sql
-- Check RLS status
SELECT tablename, rowsecurity FROM pg_tables WHERE tablename = 'markets';

-- Check admin role
SET ROLE authenticated;
SET request.jwt.claim.role TO 'admin';
SELECT auth.role(); -- Should return 'admin'

-- Check policy grants
SELECT * FROM pg_policies WHERE tablename = 'markets';
```

**Fix**:
```sql
-- Ensure admin bypass policy exists
CREATE POLICY "Admins can manage markets"
ON markets FOR ALL
USING (auth.role() = 'admin' OR auth.role() = 'manager');
```

---

### Issue 3: Duplicate Codes Generated

**Symptom**: Multiple users have the same code (e.g., two clients with CLI-000042)

**Debug**:
```sql
-- Check for duplicates
SELECT client_code, COUNT(*) FROM profiles GROUP BY client_code HAVING COUNT(*) > 1;

-- Check sequence is in sync
SELECT last_value FROM client_code_seq;
SELECT MAX(CAST(SUBSTRING(client_code FROM 5) AS INTEGER)) FROM profiles;
-- last_value should be >= max code number
```

**Fix**:
```sql
-- Reset sequence to max code + 1
SELECT setval('client_code_seq', (
  SELECT COALESCE(MAX(CAST(SUBSTRING(client_code FROM 5) AS INTEGER)), 0) + 1
  FROM profiles
  WHERE client_code IS NOT NULL
));
```

---

### Issue 4: Service Not Appearing in Market

**Symptom**: Service configured for market but not showing in service catalog

**Debug**:
```sql
-- Check service_market_availability
SELECT * FROM service_market_availability WHERE service_id = 1 AND market_id = (SELECT id FROM markets WHERE code = 'FR');

-- Check is_available flag
SELECT is_available FROM service_market_availability WHERE service_id = 1 AND market_id = (SELECT id FROM markets WHERE code = 'FR');

-- Check RLS policy
SET ROLE anon;
SELECT * FROM service_market_availability WHERE market_id = (SELECT id FROM markets WHERE code = 'FR');
RESET ROLE;
```

**Fix**:
```sql
-- Set service as available
UPDATE service_market_availability
SET is_available = true
WHERE service_id = 1 AND market_id = (SELECT id FROM markets WHERE code = 'FR');
```

---

## Performance Testing

### Load Test Code Generation

```sql
-- Generate 10,000 clients with unique codes
DO $$
BEGIN
  FOR i IN 1..10000 LOOP
    INSERT INTO profiles (id, email, role)
    VALUES (gen_random_uuid(), 'loadtest' || i || '@example.com', 'client');
  END LOOP;
END $$;

-- Verify all unique
SELECT COUNT(DISTINCT client_code) AS unique_codes, COUNT(*) AS total FROM profiles;
-- Expected: unique_codes = total

-- Check sequence performance (< 100ms per insert)
EXPLAIN ANALYZE
INSERT INTO profiles (id, email, role)
VALUES (gen_random_uuid(), 'perf@example.com', 'client');
```

### Test RLS Query Performance

```sql
-- Test contractor query with market filter (should use index)
EXPLAIN ANALYZE
SELECT * FROM contractors WHERE market_id = 1 AND is_active = true;
-- Expected: Index Scan using idx_contractors_market_active

-- Test admin bypass (should be fast, no filtering overhead)
SET request.jwt.claim.role TO 'admin';
EXPLAIN ANALYZE
SELECT * FROM contractors WHERE market_id = 1;
-- Expected: Fast query plan (Index Scan or Seq Scan depending on data size)
```

---

## Next Steps

- **API Integration**: See [contracts/markets-api.md](./contracts/markets-api.md) for REST API usage
- **Code Search**: See [contracts/codes-api.md](./contracts/codes-api.md) for client/contractor search
- **RLS Details**: See [contracts/rls-policies.md](./contracts/rls-policies.md) for complete security policies
- **Data Model**: See [data-model.md](./data-model.md) for full schema documentation
- **Task Implementation**: Run `/speckit.tasks` to generate actionable implementation tasks

---

**Happy coding! 🚀**
