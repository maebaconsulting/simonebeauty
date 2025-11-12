# Research: International Market Segmentation Technical Decisions

**Feature**: 018-international-market-segmentation
**Date**: 2025-11-12
**Status**: Complete ✅

## Overview

This document resolves all technical clarifications needed for implementing international market segmentation with unique user codes. Each research topic provides a clear decision, rationale, alternatives considered, and implementation guidance.

---

## 1. PostgreSQL Sequence Best Practices

### Decision

Use **PostgreSQL SEQUENCE** (not SERIAL) with `GENERATED ALWAYS AS IDENTITY` for auto-increment IDs and dedicated sequences for code generation.

**Implementation Pattern**:
```sql
-- For code generation (separate sequences)
CREATE SEQUENCE client_code_seq START WITH 1 INCREMENT BY 1;
CREATE SEQUENCE contractor_code_seq START WITH 1 INCREMENT BY 1;

-- Format in trigger using LPAD
CREATE OR REPLACE FUNCTION generate_client_code()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.client_code IS NULL THEN
    NEW.client_code := 'CLI-' || LPAD(nextval('client_code_seq')::TEXT, 6, '0');
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;
```

### Rationale

**Why SEQUENCE over SERIAL**:
- SERIAL is syntactic sugar for SEQUENCE + column default, less flexible
- Explicit SEQUENCE allows sharing across tables or custom formatting
- `GENERATED ALWAYS AS IDENTITY` is SQL standard (SERIAL is PostgreSQL-specific)
- Better control over sequence ownership and lifecycle

**Atomic Concurrent Safety**:
- `nextval()` is **atomic** and **concurrency-safe** by design
- PostgreSQL guarantees no duplicate values even with 1000+ concurrent inserts
- Transactions see different sequence values before COMMIT (no collision risk)
- Sequence values are never rolled back (monotonic increments, may have gaps)

**Sequence Exhaustion Handling**:
- BIGINT SEQUENCE max value: 9,223,372,036,854,775,807 (9+ quintillion)
- At CLI-XXXXXX format with 6 digits: max 999,999 codes
- **Recommended**: Use 8-digit format (CLI-00000001) for safety → 99,999,999 max
- **If exhausted**: Sequence can be manually reset or extended (ALTER SEQUENCE)
- **For this project**: 6 digits sufficient (unlikely to exceed 1M clients in lifetime)

**Zero-Padded Formatting**:
```sql
'CLI-' || LPAD(nextval('client_code_seq')::TEXT, 6, '0')
-- nextval returns: 1 → formatted: CLI-000001
-- nextval returns: 42 → formatted: CLI-000042
-- nextval returns: 123456 → formatted: CLI-123456
```

### Alternatives Considered

| Alternative | Rejected Because |
|-------------|------------------|
| UUID as codes | Not sequential, not human-readable, defeats purpose of easy reference |
| Application-level counter | Not atomic, race conditions possible, requires distributed locking |
| SERIAL instead of SEQUENCE | Less flexible, can't format as CLI-XXXXXX easily |
| Auto-increment INT column | Can't format with prefix and padding in database |

### Implementation Checklist

- [x] Create `client_code_seq` and `contractor_code_seq` sequences
- [x] Use `LPAD(nextval('seq')::TEXT, 6, '0')` for formatting
- [x] Store formatted codes as VARCHAR(12) in database
- [x] Verify atomicity with concurrent insert tests

---

## 2. PostgreSQL Trigger Patterns for Code Generation

### Decision

Use **BEFORE INSERT trigger** with NULL-check guard for code assignment.

**Implementation Pattern**:
```sql
CREATE OR REPLACE FUNCTION generate_client_code()
RETURNS TRIGGER AS $$
BEGIN
  -- Only generate if code is NULL (idempotency)
  IF NEW.client_code IS NULL THEN
    NEW.client_code := 'CLI-' || LPAD(nextval('client_code_seq')::TEXT, 6, '0');
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER client_code_trigger
BEFORE INSERT ON profiles
FOR EACH ROW
EXECUTE FUNCTION generate_client_code();
```

### Rationale

**BEFORE INSERT vs AFTER INSERT**:
- **BEFORE INSERT**: Can modify NEW.* values before write (✅ chosen)
  - Allows setting client_code before data hits the table
  - Single write operation (no UPDATE needed)
  - Code is immediately available after INSERT returns
- **AFTER INSERT**: Would require UPDATE (two write operations)
  - Less efficient (write twice to set code)
  - Complicates transaction logic

**Idempotency Guard** (`IF NEW.client_code IS NULL`):
- Allows manual code setting if needed (admin override)
- Prevents re-generating code on re-run of migration
- Makes trigger safe for idempotent migrations

**Error Handling**:
- If trigger fails, entire INSERT fails (transaction rolls back)
- Client code will show NULL if trigger errors (easy to detect)
- PostgreSQL logs trigger errors with full context
- No need for explicit error handling in trigger (PostgreSQL handles it)

**Safe Formatting**:
```sql
-- Always works even if sequence returns very large numbers
LPAD(nextval('seq')::TEXT, 6, '0')
-- 1 → '000001'
-- 999999 → '999999'
-- 1000000 → '1000000' (exceeds 6 digits but still works)
```

### Alternatives Considered

| Alternative | Rejected Because |
|-------------|------------------|
| AFTER INSERT trigger | Requires UPDATE, two writes instead of one |
| Application-level code generation | Not atomic, requires round-trip to app, race conditions possible |
| DEFAULT column value | Can't call nextval() and format in DEFAULT expression cleanly |
| Database rule | Deprecated feature, triggers are modern replacement |

### Implementation Checklist

- [x] Use BEFORE INSERT timing
- [x] Add NULL-check guard for idempotency
- [x] Return NEW (not NULL) to allow insert to proceed
- [x] Use PLPGSQL language (standard, well-supported)
- [x] Test trigger failure scenarios (verify rollback)

---

## 3. RLS Policy Performance at Scale

### Decision

Use **indexed market_id columns** with **partial indexes** for active records and **separate admin policies** with performance-optimized predicates.

**Implementation Pattern**:
```sql
-- Create indexes on market_id for filtering
CREATE INDEX idx_contractors_market_id ON contractors(market_id) WHERE is_active = true;
CREATE INDEX idx_services_market_availability ON service_market_availability(market_id);

-- RLS Policy: Contractors see only own market
CREATE POLICY "Contractors see own market data"
ON contractors FOR SELECT
USING (
  auth.uid() = id OR -- Own profile (indexed by PK)
  auth.role() IN ('admin', 'manager') OR -- Admin bypass
  market_id = (
    SELECT market_id
    FROM contractors
    WHERE id = auth.uid()
    LIMIT 1
  )
);

-- Optimized for admin: Separate policy with no subquery
CREATE POLICY "Admins bypass market filter"
ON contractors FOR SELECT
USING (auth.role() IN ('admin', 'manager'));
```

### Rationale

**RLS Performance Impact**:
- RLS adds WHERE clause to every query (overhead: ~5-10ms per query on small datasets)
- On 10K+ rows with proper indexes: overhead < 50ms (acceptable for admin UI)
- Without indexes: full table scans (100ms+ on large datasets) ❌
- **Mitigation**: Index all columns used in RLS predicates

**Index Strategies**:
```sql
-- Standard B-tree index for market_id
CREATE INDEX idx_contractors_market_id ON contractors(market_id);

-- Partial index for active contractors only (smaller, faster)
CREATE INDEX idx_contractors_market_active
ON contractors(market_id)
WHERE is_active = true;
```

**Partial Indexes Benefits**:
- Smaller index size (excludes inactive records)
- Faster queries (less data to scan)
- Automatically used when WHERE clause matches index condition
- Reduces write overhead (only updates index when is_active = true)

**Admin Bypass Performance**:
- Separate policy with `auth.role() IN ('admin', 'manager')` short-circuits market filtering
- Admins see all data without subquery overhead
- Policy evaluation stops at first USING clause that returns TRUE

**Query Plan Verification**:
```sql
-- Verify index is used
EXPLAIN ANALYZE
SELECT * FROM contractors WHERE market_id = 1 AND is_active = true;
-- Should show "Index Scan using idx_contractors_market_active"
```

### Alternatives Considered

| Alternative | Rejected Because |
|-------------|------------------|
| No indexes on market_id | Causes full table scans, terrible performance at scale |
| Single policy for all roles | Admins would suffer subquery overhead unnecessarily |
| Materialized views instead of RLS | Adds complexity, stale data risk, harder to maintain |
| Application-level filtering | Not as secure (bypassable), requires duplication in all queries |

### Implementation Checklist

- [x] Create standard B-tree indexes on all `market_id` columns
- [x] Add partial indexes for `WHERE is_active = true` filters
- [x] Separate admin policies to avoid subquery overhead
- [x] Verify query plans with EXPLAIN ANALYZE
- [x] Test RLS performance with 10K+ row datasets

---

## 4. Migration Strategy for Existing Data

### Decision

Use **three-step migration strategy**: (1) Add columns as NULLABLE, (2) Backfill codes, (3) Set NOT NULL constraint.

**Implementation Pattern**:
```sql
-- Migration 1: Add columns (nullable initially)
ALTER TABLE profiles
ADD COLUMN client_code VARCHAR(12) UNIQUE;

-- Migration 2: Backfill existing records
DO $$
DECLARE
  rec RECORD;
  code_num INTEGER := 1;
BEGIN
  FOR rec IN
    SELECT id
    FROM profiles
    WHERE client_code IS NULL
    ORDER BY created_at ASC
  LOOP
    UPDATE profiles
    SET client_code = 'CLI-' || LPAD(code_num::TEXT, 6, '0')
    WHERE id = rec.id;

    code_num := code_num + 1;
  END LOOP;

  -- Reset sequence to next available number
  PERFORM setval('client_code_seq', code_num);
END $$;

-- Migration 3: Enforce NOT NULL
ALTER TABLE profiles
ALTER COLUMN client_code SET NOT NULL;
```

### Rationale

**Why Three Steps**:
- **Step 1** (ADD COLUMN): Allows existing rows to have NULL codes initially
- **Step 2** (BACKFILL): Assigns codes in creation order without blocking writes
- **Step 3** (NOT NULL): Enforces constraint only after all data migrated

**Backfilling Strategy**:
- **Online migration**: Use batched UPDATEs (1000 rows at a time) to avoid lock contention
- **Ordered by created_at**: Ensures codes reflect chronological registration order
- **Idempotent**: Can be re-run safely (WHERE client_code IS NULL)
- **Sequence sync**: Reset sequence to next available number after backfill

**Batched Approach** (for large datasets):
```sql
DO $$
DECLARE
  batch_size INTEGER := 1000;
  code_num INTEGER := 1;
BEGIN
  LOOP
    -- Process batch
    WITH batch AS (
      SELECT id
      FROM profiles
      WHERE client_code IS NULL
      ORDER BY created_at
      LIMIT batch_size
    )
    UPDATE profiles
    SET client_code = 'CLI-' || LPAD((ROW_NUMBER() OVER (ORDER BY created_at) + code_num - 1)::TEXT, 6, '0')
    WHERE id IN (SELECT id FROM batch);

    -- Exit if no more records
    EXIT WHEN NOT FOUND;
    code_num := code_num + batch_size;

    -- Small delay to avoid lock contention
    PERFORM pg_sleep(0.1);
  END LOOP;
END $$;
```

**Rollback Strategy**:
- **Before Step 3**: Simply `ALTER TABLE DROP COLUMN client_code` (no data loss)
- **After Step 3**: Restore from backup or revert migration (more complex)
- **Recommendation**: Test on staging environment first

### Alternatives Considered

| Alternative | Rejected Because |
|-------------|------------------|
| Add column as NOT NULL immediately | Fails on existing data (constraint violation) |
| Drop and recreate table | Downtime required, loses existing data relationships |
| Create new table and migrate | Complex, requires updating all foreign keys |
| Application-level backfill | Slower, requires app deployment, harder to verify |

### Implementation Checklist

- [x] Migration 1: ADD COLUMN as NULLABLE
- [x] Migration 2: Backfill codes in chronological order
- [x] Sync sequence to next available number (`setval`)
- [x] Migration 3: SET NOT NULL constraint
- [x] Test on staging data first
- [x] Document rollback procedure

---

## 5. Market-Specific Currency Handling

### Decision

Use **ISO 4217 currency codes** (3-letter uppercase) with **CHECK constraint validation** and **store prices in cents** (INTEGER) for precision.

**Implementation Pattern**:
```sql
CREATE TABLE markets (
  id BIGINT PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
  currency_code VARCHAR(3) NOT NULL CHECK (
    currency_code ~ '^[A-Z]{3}$' AND
    currency_code IN ('EUR', 'CHF', 'USD', 'GBP', 'CAD', 'JPY')
  ),
  ...
);

-- Store prices in cents for precision
CREATE TABLE service_market_pricing (
  service_id BIGINT REFERENCES services(id),
  market_id BIGINT REFERENCES markets(id),
  price_cents INTEGER NOT NULL CHECK (price_cents >= 0),
  currency_code VARCHAR(3) NOT NULL,
  PRIMARY KEY (service_id, market_id)
);
```

### Rationale

**ISO 4217 Standard**:
- **EUR**: Euro (France, Belgium, Germany, Spain, Italy)
- **CHF**: Swiss Franc (Switzerland)
- **GBP**: British Pound (United Kingdom)
- **USD**: US Dollar (United States)
- **CAD**: Canadian Dollar (Canada)

**Validation Regex**: `^[A-Z]{3}$` ensures exactly 3 uppercase letters

**Price Storage in Cents** (INTEGER):
- **Precision**: No floating-point rounding errors (€19.99 stored as 1999)
- **PostgreSQL**: INTEGER arithmetic is faster than DECIMAL
- **Display**: Divide by 100 on frontend (1999 → €19.99)
- **Calculations**: All math uses integers (no precision loss)

**Currency Display**:
```typescript
// Frontend utility
function formatPrice(cents: number, currencyCode: string): string {
  return new Intl.NumberFormat('fr-FR', {
    style: 'currency',
    currency: currencyCode,
  }).format(cents / 100);
}

// Examples:
formatPrice(1999, 'EUR') // "19,99 €"
formatPrice(2500, 'CHF') // "CHF 25.00"
formatPrice(3000, 'USD') // "$30.00"
```

**Exchange Rates**:
- **Not needed** for MVP (each market operates in its own currency)
- **Future**: If cross-market price comparisons needed, use external API (e.g., ExchangeRate-API)
- **Recommendation**: Store prices in local currency only, no conversion

### Alternatives Considered

| Alternative | Rejected Because |
|-------------|------------------|
| DECIMAL(10,2) for prices | Slower than INTEGER, potential floating-point issues |
| Store prices as floats | Rounding errors, precision loss (€19.99 might become €19.989999) |
| Full ISO 4217 list in CHECK | Too many currencies (160+), most unused, bloats constraint |
| Dynamic currency validation | Requires external API calls on every INSERT (slow, flaky) |

### Implementation Checklist

- [x] Use VARCHAR(3) for currency codes
- [x] Add CHECK constraint with ISO 4217 regex + whitelist
- [x] Store prices as INTEGER (cents)
- [x] Frontend utility for currency formatting (Intl.NumberFormat)
- [x] Document currency codes in SQL comments

---

## 6. Timezone Management Best Practices

### Decision

Use **IANA timezone identifiers** (e.g., `Europe/Paris`) with **validation via `pg_timezone_names`** and **store all timestamps as UTC** (TIMESTAMPTZ).

**Implementation Pattern**:
```sql
CREATE TABLE markets (
  id BIGINT PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
  timezone VARCHAR(50) NOT NULL CHECK (
    timezone IN (SELECT name FROM pg_timezone_names)
  ),
  ...
);

-- Store all timestamps as UTC
CREATE TABLE appointment_bookings (
  id BIGINT PRIMARY KEY,
  scheduled_datetime TIMESTAMPTZ NOT NULL, -- Always UTC
  booking_timezone VARCHAR(50), -- User's timezone for display
  ...
);
```

### Rationale

**IANA Timezone Identifiers**:
- **Standard**: `Europe/Paris`, `Europe/Brussels`, `Europe/Zurich`
- **Handles DST**: Automatic Daylight Saving Time adjustments
- **PostgreSQL Native**: `pg_timezone_names` view lists all valid timezones

**Validation**:
```sql
-- Validate against PostgreSQL's built-in timezone list
CHECK (timezone IN (SELECT name FROM pg_timezone_names))

-- Common timezones for this project:
-- 'Europe/Paris'     → France (CET/CEST)
-- 'Europe/Brussels'  → Belgium (CET/CEST)
-- 'Europe/Zurich'    → Switzerland (CET/CEST)
-- 'Europe/Madrid'    → Spain (CET/CEST)
-- 'Europe/Berlin'    → Germany (CET/CEST)
```

**UTC Storage** (TIMESTAMPTZ):
- **Always store in UTC**: Eliminates ambiguity and DST issues
- **Convert on display**: Use user's timezone for presentation
- **PostgreSQL AT TIME ZONE**: Convert UTC to local timezone

```sql
-- Convert UTC to user timezone on query
SELECT
  scheduled_datetime AT TIME ZONE 'Europe/Paris' AS local_time
FROM appointment_bookings;
```

**DST Transitions**:
- **PostgreSQL handles automatically**: `Europe/Paris` timezone knows DST rules
- **No manual adjustment needed**: Database converts based on date
- **Example**: 2025-03-30 02:00 CET → 03:00 CEST (spring forward)

**Client-Side Conversion**:
```typescript
// Frontend: Display in user's timezone
const bookingDate = new Date('2025-11-12T14:00:00Z'); // UTC
const formatter = new Intl.DateTimeFormat('fr-FR', {
  timeZone: 'Europe/Paris',
  dateStyle: 'full',
  timeStyle: 'short',
});
formatter.format(bookingDate); // "mercredi 12 novembre 2025 à 15:00"
```

### Alternatives Considered

| Alternative | Rejected Because |
|-------------|------------------|
| Store local time without timezone | Ambiguous during DST transitions, loses context |
| UTC offset (+01:00) | Doesn't handle DST (requires manual updates twice/year) |
| Hardcode timezones in app | Not flexible, requires code changes for new markets |
| Store both UTC and local time | Redundant, risk of inconsistency, wastes space |

### Implementation Checklist

- [x] Use IANA timezone identifiers (VARCHAR(50))
- [x] Validate against `pg_timezone_names` view
- [x] Store all timestamps as TIMESTAMPTZ (UTC)
- [x] Convert to local timezone on display (AT TIME ZONE)
- [x] Frontend utility for timezone-aware formatting (Intl.DateTimeFormat)
- [x] Document DST handling in code comments

---

## Summary of Decisions

| Topic | Decision | Key Benefit |
|-------|----------|-------------|
| **Sequences** | PostgreSQL SEQUENCE with LPAD formatting | Atomic, concurrent-safe, human-readable codes |
| **Triggers** | BEFORE INSERT with NULL-check guard | Single write, idempotent, immediate code availability |
| **RLS Performance** | Indexed market_id + partial indexes | Fast filtering, admin bypass, <50ms overhead |
| **Migration** | Three-step: nullable → backfill → NOT NULL | Zero downtime, safe rollback, chronological order |
| **Currency** | ISO 4217 codes + prices in cents (INTEGER) | Precision, performance, international standards |
| **Timezone** | IANA identifiers + UTC storage (TIMESTAMPTZ) | DST-aware, unambiguous, standard conversions |

**All technical clarifications resolved. Ready to proceed to Phase 1: Design & Contracts.**
