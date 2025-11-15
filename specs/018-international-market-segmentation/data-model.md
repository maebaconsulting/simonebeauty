# Data Model: International Market Segmentation with Unique Codes

**Feature**: 018-international-market-segmentation
**Date**: 2025-11-12
**Status**: Phase 1 Design

## Overview

This document defines the complete database schema for international market segmentation with unique user codes. All designs follow the project constitution principles: BIGINT IDs, VARCHAR enums with CHECK constraints, English snake_case naming with French comments, and security-first RLS architecture.

---

## Entity Relationship Diagram (Textual)

```
markets (1) ──< (M) contractors
markets (M) ──< (M) services via service_market_availability

profiles (1) ──< (1) client_code (via client_code_seq)
contractors (1) ──< (1) contractor_code (via contractor_code_seq)
```

**Key Relationships**:
- Each contractor belongs to exactly ONE market (market_id NOT NULL)
- Each service can be available in MULTIPLE markets (M:M via junction table)
- Each client receives ONE unique code (CLI-XXXXXX format)
- Each contractor receives ONE unique code (CTR-XXXXXX format)

---

## Table Schemas

### 1. markets

**Purpose**: Stores geographical market configuration (currency, timezone, languages)

```sql
CREATE TABLE markets (
  -- Identity
  id BIGINT PRIMARY KEY GENERATED ALWAYS AS IDENTITY,

  -- Core attributes
  name VARCHAR(100) NOT NULL,
  code VARCHAR(10) UNIQUE NOT NULL CHECK (code ~ '^[A-Z]{2,3}$'),

  -- Regional settings
  currency_code VARCHAR(3) NOT NULL CHECK (
    currency_code ~ '^[A-Z]{3}$' AND
    currency_code IN ('EUR', 'CHF', 'USD', 'GBP', 'CAD', 'JPY')
  ),
  timezone VARCHAR(50) NOT NULL CHECK (
    timezone IN (SELECT name FROM pg_timezone_names)
  ),
  supported_languages JSONB NOT NULL DEFAULT '["fr"]' CHECK (
    jsonb_typeof(supported_languages) = 'array'
  ),

  -- Status
  is_active BOOLEAN DEFAULT true,

  -- Audit
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

COMMENT ON TABLE markets IS 'Marchés géographiques où la plateforme opère (FR, BE, CH, ES, DE, etc.)';
COMMENT ON COLUMN markets.code IS 'Code ISO 3166-1 alpha-2 (FR, BE, CH, ES, DE)';
COMMENT ON COLUMN markets.currency_code IS 'Code devise ISO 4217 (EUR, CHF, USD, GBP)';
COMMENT ON COLUMN markets.timezone IS 'Fuseau horaire IANA (Europe/Paris, Europe/Brussels, Europe/Zurich)';
COMMENT ON COLUMN markets.supported_languages IS 'Langues supportées (codes ISO 639-1: fr, en, de, nl, it)';
COMMENT ON COLUMN markets.is_active IS 'Si FALSE, le marché ne peut plus recevoir de nouveaux contractors/clients';

-- Indexes
CREATE INDEX idx_markets_code ON markets(code);
CREATE INDEX idx_markets_is_active ON markets(is_active) WHERE is_active = true;
```

**Constraints**:
- `code`: ISO 3166-1 alpha-2 (2-3 uppercase letters), unique
- `currency_code`: ISO 4217 (3 uppercase letters), whitelisted currencies
- `timezone`: Validated against PostgreSQL's `pg_timezone_names` view
- `supported_languages`: JSONB array of ISO 639-1 codes

**Sample Data**:
```sql
INSERT INTO markets (name, code, currency_code, timezone, supported_languages) VALUES
('France', 'FR', 'EUR', 'Europe/Paris', '["fr", "en"]'),
('Belgium', 'BE', 'EUR', 'Europe/Brussels', '["fr", "nl", "en"]'),
('Switzerland', 'CH', 'CHF', 'Europe/Zurich', '["fr", "de", "it", "en"]'),
('Spain', 'ES', 'EUR', 'Europe/Madrid', '["es", "en"]'),
('Germany', 'DE', 'EUR', 'Europe/Berlin', '["de", "en"]');
```

---

### 2. client_code_seq (Sequence)

**Purpose**: Generates sequential integers for client unique codes

```sql
CREATE SEQUENCE client_code_seq
  START WITH 1
  INCREMENT BY 1
  NO CYCLE
  OWNED BY NONE;

COMMENT ON SEQUENCE client_code_seq IS 'Séquence pour génération de codes uniques clients (CLI-XXXXXX)';
```

**Usage**: Called by trigger on `profiles` table to generate CLI-XXXXXX codes

---

### 3. contractor_code_seq (Sequence)

**Purpose**: Generates sequential integers for contractor unique codes

```sql
CREATE SEQUENCE contractor_code_seq
  START WITH 1
  INCREMENT BY 1
  NO CYCLE
  OWNED BY NONE;

COMMENT ON SEQUENCE contractor_code_seq IS 'Séquence pour génération de codes uniques prestataires (CTR-XXXXXX)';
```

**Usage**: Called by trigger on `contractors` table to generate CTR-XXXXXX codes

---

### 4. profiles (Extended)

**Purpose**: User profiles for clients - extended with unique code column

```sql
-- Add client_code column to existing profiles table
ALTER TABLE profiles
ADD COLUMN client_code VARCHAR(12) UNIQUE;

COMMENT ON COLUMN profiles.client_code IS 'Code unique client format CLI-XXXXXX (auto-généré via trigger)';

-- Index for fast code lookups
CREATE INDEX idx_profiles_client_code ON profiles(client_code);
```

**Format**: `CLI-XXXXXX` where X is a zero-padded digit (e.g., CLI-000001, CLI-000042, CLI-123456)

**Trigger**: Automatically generates code on INSERT (see Triggers section)

**Sample Data**:
```sql
-- After migration:
-- id | email                 | client_code | created_at
-- 1  | alice@example.com     | CLI-000001  | 2025-01-01
-- 2  | bob@example.com       | CLI-000002  | 2025-01-02
-- 42 | charlie@example.com   | CLI-000042  | 2025-02-15
```

---

### 5. contractors (Extended)

**Purpose**: Contractor profiles - extended with unique code and market assignment

```sql
-- Add contractor_code and market_id columns to existing contractors table
ALTER TABLE contractors
ADD COLUMN contractor_code VARCHAR(12) UNIQUE,
ADD COLUMN market_id BIGINT REFERENCES markets(id) ON DELETE RESTRICT;

COMMENT ON COLUMN contractors.contractor_code IS 'Code unique prestataire format CTR-XXXXXX (auto-généré via trigger)';
COMMENT ON COLUMN contractors.market_id IS 'Marché assigné (obligatoire - un prestataire appartient à UN seul marché)';

-- Indexes
CREATE INDEX idx_contractors_contractor_code ON contractors(contractor_code);
CREATE INDEX idx_contractors_market_id ON contractors(market_id);
CREATE INDEX idx_contractors_market_active ON contractors(market_id) WHERE is_active = true;

-- Enforce NOT NULL after backfill migration
-- (Initially nullable, then set NOT NULL after existing data migrated)
```

**Format**: `CTR-XXXXXX` where X is a zero-padded digit (e.g., CTR-000001, CTR-000123)

**Market Assignment**:
- `market_id`: Foreign key to `markets(id)`, NOT NULL (after migration)
- Each contractor belongs to exactly one market
- Cascade behavior: `ON DELETE RESTRICT` (can't delete market with assigned contractors)

**Trigger**: Automatically generates code on INSERT (see Triggers section)

**Sample Data**:
```sql
-- After migration:
-- id | business_name         | contractor_code | market_id | is_active
-- 1  | Marie's Salon         | CTR-000001      | 1 (FR)    | true
-- 2  | Brussels Beauty       | CTR-000002      | 2 (BE)    | true
-- 3  | Zurich Wellness       | CTR-000003      | 3 (CH)    | true
```

---

### 6. service_market_availability (Junction Table)

**Purpose**: Many-to-many relationship between services and markets with market-specific pricing

```sql
CREATE TABLE service_market_availability (
  -- Composite primary key
  service_id BIGINT REFERENCES services(id) ON DELETE CASCADE,
  market_id BIGINT REFERENCES markets(id) ON DELETE CASCADE,
  PRIMARY KEY (service_id, market_id),

  -- Market-specific pricing (overrides service.base_price)
  price_cents INTEGER CHECK (price_cents >= 0),
  currency_code VARCHAR(3),

  -- Market-specific configuration
  is_available BOOLEAN DEFAULT true,
  custom_description TEXT,

  -- Audit
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

COMMENT ON TABLE service_market_availability IS 'Services disponibles par marché avec tarification locale';
COMMENT ON COLUMN service_market_availability.price_cents IS 'Prix en centimes pour ce marché (NULL = utilise base_price du service)';
COMMENT ON COLUMN service_market_availability.currency_code IS 'Devise pour ce marché (doit correspondre à markets.currency_code)';

-- Indexes
CREATE INDEX idx_sma_service_id ON service_market_availability(service_id);
CREATE INDEX idx_sma_market_id ON service_market_availability(market_id);
CREATE INDEX idx_sma_available ON service_market_availability(market_id, is_available) WHERE is_available = true;

-- Constraint: currency must match market's currency
ALTER TABLE service_market_availability
ADD CONSTRAINT fk_sma_currency_matches_market
CHECK (
  currency_code = (SELECT currency_code FROM markets WHERE id = market_id)
);
```

**Pricing Logic**:
- If `price_cents` IS NOT NULL: Use market-specific price
- If `price_cents` IS NULL: Fall back to `services.base_price`
- Currency must match the market's currency (enforced via CHECK constraint)

**Sample Data**:
```sql
-- Service 1 (Haircut) available in FR, BE, CH with different prices
INSERT INTO service_market_availability (service_id, market_id, price_cents, currency_code) VALUES
(1, 1, 3500, 'EUR'),  -- €35.00 in France
(1, 2, 3200, 'EUR'),  -- €32.00 in Belgium
(1, 3, 4500, 'CHF');  -- CHF 45.00 in Switzerland
```

---

## Triggers

### 1. generate_client_code() - BEFORE INSERT on profiles

**Purpose**: Automatically generate CLI-XXXXXX code for new clients

```sql
CREATE OR REPLACE FUNCTION generate_client_code()
RETURNS TRIGGER AS $$
BEGIN
  -- Only generate if code is NULL (idempotency guard)
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

COMMENT ON FUNCTION generate_client_code() IS 'Génère automatiquement un code unique client format CLI-XXXXXX';
```

**Behavior**:
- Executes BEFORE INSERT (can modify NEW.client_code before write)
- Only generates code if `client_code` IS NULL (allows manual override)
- Format: `CLI-` + zero-padded 6-digit number (CLI-000001, CLI-000042)
- Atomic: `nextval()` is concurrency-safe (no duplicates even with 1000+ simultaneous inserts)

---

### 2. generate_contractor_code() - BEFORE INSERT on contractors

**Purpose**: Automatically generate CTR-XXXXXX code for new contractors

```sql
CREATE OR REPLACE FUNCTION generate_contractor_code()
RETURNS TRIGGER AS $$
BEGIN
  -- Only generate if code is NULL (idempotency guard)
  IF NEW.contractor_code IS NULL THEN
    NEW.contractor_code := 'CTR-' || LPAD(nextval('contractor_code_seq')::TEXT, 6, '0');
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER contractor_code_trigger
BEFORE INSERT ON contractors
FOR EACH ROW
EXECUTE FUNCTION generate_contractor_code();

COMMENT ON FUNCTION generate_contractor_code() IS 'Génère automatiquement un code unique prestataire format CTR-XXXXXX';
```

**Behavior**: Identical to client trigger, uses `contractor_code_seq` for CTR-XXXXXX format

---

### 3. update_updated_at() - BEFORE UPDATE on markets

**Purpose**: Automatically update `updated_at` timestamp on market changes

```sql
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at := NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER markets_updated_at_trigger
BEFORE UPDATE ON markets
FOR EACH ROW
EXECUTE FUNCTION update_updated_at();

-- Apply to service_market_availability as well
CREATE TRIGGER sma_updated_at_trigger
BEFORE UPDATE ON service_market_availability
FOR EACH ROW
EXECUTE FUNCTION update_updated_at();
```

---

## Indexes Summary

| Table | Index | Type | Purpose | Where Clause |
|-------|-------|------|---------|--------------|
| markets | `idx_markets_code` | B-tree | Fast lookup by market code | - |
| markets | `idx_markets_is_active` | Partial | Active markets only | `is_active = true` |
| profiles | `idx_profiles_client_code` | B-tree | Fast search by client code | - |
| contractors | `idx_contractors_contractor_code` | B-tree | Fast search by contractor code | - |
| contractors | `idx_contractors_market_id` | B-tree | Filter contractors by market | - |
| contractors | `idx_contractors_market_active` | Partial | Active contractors per market | `is_active = true` |
| service_market_availability | `idx_sma_service_id` | B-tree | Services in a market | - |
| service_market_availability | `idx_sma_market_id` | B-tree | Markets for a service | - |
| service_market_availability | `idx_sma_available` | Partial | Available services per market | `is_available = true` |

**Performance Impact**:
- All indexes support RLS policy filtering (market_id predicates)
- Partial indexes reduce size and improve write performance
- B-tree indexes enable <1s search times even with 10K+ records (SC-008)

---

## Constraints Summary

| Table | Constraint | Type | Enforces |
|-------|-----------|------|----------|
| markets | `markets_pkey` | PRIMARY KEY | Unique id |
| markets | `markets_code_key` | UNIQUE | Unique market codes (FR, BE, CH) |
| markets | `markets_code_check` | CHECK | ISO 3166-1 format (^[A-Z]{2,3}$) |
| markets | `markets_currency_code_check` | CHECK | ISO 4217 + whitelist (EUR, CHF, etc.) |
| markets | `markets_timezone_check` | CHECK | Valid IANA timezone |
| markets | `markets_supported_languages_check` | CHECK | JSONB array type |
| profiles | `profiles_client_code_key` | UNIQUE | No duplicate client codes |
| contractors | `contractors_contractor_code_key` | UNIQUE | No duplicate contractor codes |
| contractors | `contractors_market_id_fkey` | FOREIGN KEY | Valid market reference |
| service_market_availability | `sma_pkey` | PRIMARY KEY | One price per service-market pair |
| service_market_availability | `sma_service_id_fkey` | FOREIGN KEY | Valid service reference |
| service_market_availability | `sma_market_id_fkey` | FOREIGN KEY | Valid market reference |
| service_market_availability | `sma_price_cents_check` | CHECK | Non-negative prices |
| service_market_availability | `fk_sma_currency_matches_market` | CHECK | Currency matches market |

**Foreign Key Cascade Behavior**:
- `contractors.market_id`: `ON DELETE RESTRICT` (can't delete market with contractors)
- `service_market_availability`: `ON DELETE CASCADE` (remove availability if service/market deleted)

---

## Data Types Rationale

| Column | Type | Why Not Alternatives |
|--------|------|---------------------|
| markets.id | BIGINT | Constitution Principle 1: BIGINT for business entities |
| markets.code | VARCHAR(10) | ISO codes are variable length (FR=2, EUR could be 3) |
| markets.currency_code | VARCHAR(3) | ISO 4217 fixed 3 characters, not INTEGER |
| markets.timezone | VARCHAR(50) | IANA identifiers are strings (Europe/Paris) |
| markets.supported_languages | JSONB | Flexible array storage, faster than separate table for small lists |
| markets.is_active | BOOLEAN | Constitution Principle 2: no ENUMs for status |
| markets.created_at | TIMESTAMPTZ | Always UTC, timezone-aware |
| profiles.client_code | VARCHAR(12) | 'CLI-' (4) + 6 digits + buffer = 12 chars max |
| contractors.contractor_code | VARCHAR(12) | 'CTR-' (4) + 6 digits + buffer = 12 chars max |
| contractors.market_id | BIGINT | Foreign key to markets(id) |
| service_market_availability.price_cents | INTEGER | Precision (no float rounding), fast arithmetic |

---

## Migration Order

**IMPORTANT**: Migrations must be executed in this exact order to avoid FK constraint violations.

1. `20250112000100_create_markets_table.sql` - Create markets table
2. `20250112000110_create_code_sequences.sql` - Create client/contractor code sequences
3. `20250112000120_add_code_columns.sql` - Add client_code to profiles (nullable)
4. `20250112000130_create_code_triggers.sql` - Create triggers for automatic code generation
5. `20250112000140_add_market_assignment.sql` - Add market_id to contractors (nullable initially)
6. `20250112000150_create_service_market_availability.sql` - Create junction table
7. `20250112000160_create_market_rls_policies.sql` - Enable RLS and create policies
8. `20250112000170_migrate_existing_codes.sql` - Backfill codes for existing users (set NOT NULL)
9. `20250112000180_update_contractor_rls.sql` - Update contractor RLS with market filtering

**Why This Order**:
- Markets must exist before adding FK to contractors
- Code sequences must exist before triggers reference them
- Triggers must exist before backfill migration runs
- Codes must be backfilled before setting NOT NULL constraint
- RLS policies reference market_id column (must exist first)

---

## Sample Queries

### Query 1: Get all services available in a specific market with pricing

```sql
SELECT
  s.id,
  s.name,
  s.slug,
  COALESCE(sma.price_cents, s.base_price) AS price_cents,
  COALESCE(sma.currency_code, m.currency_code) AS currency_code
FROM services s
JOIN service_market_availability sma ON s.id = sma.service_id
JOIN markets m ON sma.market_id = m.id
WHERE sma.market_id = 1 -- France
  AND sma.is_available = true
  AND s.is_active = true;
```

### Query 2: Search clients by code

```sql
SELECT
  id,
  email,
  client_code,
  first_name,
  last_name,
  created_at
FROM profiles
WHERE client_code = 'CLI-000042';
```

### Query 3: Get all contractors in a market

```sql
SELECT
  c.id,
  c.business_name,
  c.contractor_code,
  c.professional_title,
  m.name AS market_name,
  m.code AS market_code
FROM contractors c
JOIN markets m ON c.market_id = m.id
WHERE c.market_id = 1 -- France
  AND c.is_active = true
ORDER BY c.created_at DESC;
```

### Query 4: Get market configuration for display

```sql
SELECT
  id,
  name,
  code,
  currency_code,
  timezone,
  supported_languages,
  is_active
FROM markets
WHERE is_active = true
ORDER BY name;
```

### Query 5: Check if service is available in contractor's market

```sql
SELECT EXISTS (
  SELECT 1
  FROM service_market_availability sma
  JOIN contractors c ON sma.market_id = c.market_id
  WHERE sma.service_id = $1 -- service ID
    AND c.id = $2 -- contractor ID
    AND sma.is_available = true
) AS is_available;
```

---

## Performance Benchmarks

**Target Performance** (from plan.md success criteria):

| Operation | Target | Achieved Via |
|-----------|--------|--------------|
| Market list load | <500ms | Partial index on is_active |
| Code generation | <100ms | PostgreSQL SEQUENCE (atomic) |
| Admin search by code | <1s | B-tree indexes on client_code, contractor_code |
| Migration of 10K users | <5 min | Batched updates in migration script |

**RLS Overhead**:
- With indexes: ~5-10ms per query on small datasets
- With partial indexes on `market_id + is_active`: <50ms on 10K+ rows
- Admin bypass policy: 0ms overhead (short-circuits filtering)

---

## Validation

**Schema Compliance**:
- ✅ Constitution Principle 1: All IDs are BIGINT (markets.id)
- ✅ Constitution Principle 2: No PostgreSQL ENUMs (VARCHAR + CHECK constraints)
- ✅ Constitution Principle 3: English snake_case, French comments
- ✅ Constitution Principle 4: RLS enabled on all tables (see rls-policies.md)

**Data Integrity**:
- ✅ All foreign keys enforced (contractors.market_id → markets.id)
- ✅ Unique constraints prevent duplicate codes
- ✅ CHECK constraints validate ISO codes (currency, timezone, language)
- ✅ Triggers ensure codes never NULL after insert

**Backward Compatibility**:
- ✅ Extends existing tables (profiles, contractors) - no breaking changes
- ✅ New columns initially nullable (migration backfills before NOT NULL)
- ✅ Existing queries still work (new columns optional)

---

**Next Steps**: See `contracts/` for API specifications and `quickstart.md` for developer guide.
