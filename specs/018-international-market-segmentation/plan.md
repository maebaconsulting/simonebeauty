# Implementation Plan: International Market Segmentation with Unique Codes

**Branch**: `018-international-market-segmentation` | **Date**: 2025-11-12 | **Spec**: [spec.md](./spec.md)
**Input**: Feature specification from `/specs/018-international-market-segmentation/spec.md`

## Summary

This feature implements a comprehensive international market segmentation system for the Simone platform, enabling expansion across multiple geographical regions (France, Belgium, Switzerland, etc.) with clear data isolation and localized experiences. The system automatically assigns unique sequential codes to clients (CLI-XXXXXX format) and contractors (CTR-XXXXXX format) using PostgreSQL sequences and triggers. Markets define regional configuration (currency, timezone, languages), contractors are assigned to exactly one market, and services can be offered in multiple markets with market-specific pricing. Row-level security (RLS) policies ensure complete data isolation between markets for non-admin users while allowing administrators full visibility across all regions.

## Technical Context

**Language/Version**: TypeScript 5.x with Next.js 16, React 19
**Primary Dependencies**:
- Supabase PostgreSQL (database with RLS)
- Next.js 16 App Router (frontend framework)
- React Query / TanStack Query (data fetching and cache management)
- shadcn/ui + Tailwind CSS v4 (UI components)
- Zod (validation schemas)

**Storage**: PostgreSQL via Supabase (primary database, sequences, triggers, RLS policies)
**Testing**:
- Vitest (unit tests)
- React Testing Library (component tests)
- Playwright (E2E tests for admin flows)
- Database migration testing (verify sequence integrity, trigger functionality, RLS isolation)

**Target Platform**: Web (Next.js SSR + client components), mobile apps consume same APIs
**Project Type**: Full-stack web application (Next.js monolith with App Router)
**Performance Goals**:
- Market list load < 500ms
- Code generation < 100ms (PostgreSQL sequence performance)
- Admin search by code < 1 second
- Migration of 10K users < 5 minutes

**Constraints**:
- Zero duplicate codes under concurrent loads (atomic sequence operations required)
- Zero data leakage between markets (RLS must be bulletproof)
- Code format must never change (CLI-XXXXXX, CTR-XXXXXX fixed for eternity)
- Backward compatible migration (existing data must receive codes retroactively)

**Scale/Scope**:
- Initial launch: 3-5 markets (FR, BE, CH, ES, DE)
- Expected: 10K clients, 500 contractors across all markets
- Growth potential: 50K+ users, 20+ markets in 5 years
- Admin UI: 8-10 new pages/components for market and code management

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

### ✅ PASSED: Principle 1 - ID Strategy & Data Identity

**Compliance**: This feature correctly uses:
- **Market table**: BIGINT auto-increment ID as primary key
- **Sequences**: PostgreSQL SEQUENCE for atomic code generation (client_code_seq, contractor_code_seq)
- **Existing tables**: Extends profiles (UUID, linked to auth.users) and contractors (BIGINT ID) with VARCHAR code fields
- **No new UUID tables**: All new entities use numeric IDs

**Rationale**: Markets are business entities (not auth-related), so BIGINT ID is appropriate. Code sequences generate integers that are formatted as strings (CLI-000001) for display purposes only.

### ✅ PASSED: Principle 2 - Enum Strategy & Data Types

**Compliance**: Feature uses VARCHAR with CHECK constraints for all status/type fields:
- Market `is_active`: BOOLEAN (not enum)
- No PostgreSQL ENUM types introduced
- Currency codes stored as VARCHAR(3) with CHECK constraint for ISO 4217 codes
- Language codes stored as JSONB array of VARCHAR(2) with validation

**Rationale**: Avoids PostgreSQL ENUMs entirely, using flexible VARCHAR + CHECK constraints for easy schema evolution.

### ✅ PASSED: Principle 3 - Database Naming & Documentation

**Compliance**:
- **Table names**: English snake_case (`markets`, `client_code_seq`, `contractor_code_seq`)
- **Column names**: English snake_case (`currency_code`, `timezone`, `supported_languages`, `client_code`, `contractor_code`, `market_id`)
- **SQL comments**: French (e.g., "Codes uniques séquentiels pour identification clients")
- **Application UI**: French (labels, messages, admin interface)

**Examples**:
```sql
CREATE TABLE markets (
  id BIGINT PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
  name VARCHAR(100) NOT NULL,
  code VARCHAR(10) UNIQUE NOT NULL, -- ISO 3166-1 alpha-2
  currency_code VARCHAR(3) NOT NULL CHECK (currency_code ~ '^[A-Z]{3}$'),
  timezone VARCHAR(50) NOT NULL,
  supported_languages JSONB NOT NULL DEFAULT '["fr"]',
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

COMMENT ON TABLE markets IS 'Marchés géographiques où la plateforme opère (FR, BE, CH, etc.)';
COMMENT ON COLUMN markets.currency_code IS 'Code devise ISO 4217 (EUR, CHF, USD)';
COMMENT ON COLUMN markets.timezone IS 'Fuseau horaire IANA (Europe/Paris, Europe/Brussels)';
```

### ✅ PASSED: Principle 4 - Security-First Architecture

**Compliance**:
- RLS enabled on all new/modified tables (`markets`, profiles with codes, contractors with market_id)
- "Zero trust" principle: explicit permissions only
- Admins can view all markets (bypass RLS with `auth.role() = 'admin'`)
- Contractors can only see data from their assigned market
- Clients can only see services/contractors from their market
- JWT validation enforced via Supabase Auth
- No sensitive data exposed to client (sequences managed server-side)

**RLS Policies Example**:
```sql
-- Markets: Public read for active markets, admin full access
CREATE POLICY "Public can view active markets"
ON markets FOR SELECT
USING (is_active = true);

CREATE POLICY "Admins can manage markets"
ON markets FOR ALL
USING (auth.role() = 'admin' OR auth.role() = 'manager');

-- Contractors: Only see data from own market
CREATE POLICY "Contractors see own market data"
ON contractors FOR SELECT
USING (
  auth.uid() = id OR -- Own profile
  auth.role() IN ('admin', 'manager') OR -- Admins see all
  market_id = (SELECT market_id FROM contractors WHERE id = auth.uid()) -- Same market
);
```

### ✅ PASSED: Principle 13 - Multilingual Architecture (i18n)

**Compliance**:
- Market `supported_languages` field stores array of ISO 639-1 codes
- Translations table already exists for translating market names/descriptions
- Admin can configure which languages each market supports
- User language detection based on market + user preference
- French fallback always available (default language)

**Architecture Alignment**:
- Market names use `name_key` (e.g., 'market_france') → translations table
- Centraliz

ed translation management via existing `translations` table
- No hardcoded text in migrations

### ⚠️ ADVISORY: Principle 14 - Data Integrity

**Note**: This feature doesn't directly impact specialty-category alignment, but ensures market-service relationships are properly enforced via foreign keys and junction tables.

**Compliance**:
- Market-service relationship uses junction table `service_market_availability` with proper FKs
- Market-contractor relationship uses direct FK `contractors.market_id REFERENCES markets(id)`
- All relationships enforce referential integrity via PostgreSQL constraints

### ✅ PASSED: Technology Stack Alignment

**Compliance**:
- Frontend: Next.js 16, React 19, TypeScript, TanStack Query, Tailwind CSS v4, shadcn/ui ✅
- Backend: Supabase PostgreSQL, Supabase Auth, Edge Functions (Deno) ✅
- Design System: Coral primary color (#dd6055), HSL tokens, 8px border radius ✅
- Code Quality: TypeScript strict mode, Zod validation, ESLint, Prettier ✅

**No new dependencies introduced** - uses existing stack.

### ✅ PASSED: SpecKit Development Workflow

**Compliance**:
- Following `/speckit.plan` → `/speckit.tasks` → `/speckit.implement` workflow
- Constitution read from `.specify/memory/constitution.md`
- All generated artifacts comply with constitutional principles
- Violations flagged and justified in Complexity Tracking section

### 🎯 OVERALL GATE STATUS: ✅ PASSED

No constitutional violations. Feature aligns perfectly with project architecture, naming conventions, security model, and technology stack. Ready to proceed to Phase 0 research.

## Project Structure

### Documentation (this feature)

```text
specs/018-international-market-segmentation/
├── spec.md              # Feature specification (already created)
├── plan.md              # This file (/speckit.plan command output)
├── research.md          # Phase 0 output (next step)
├── data-model.md        # Phase 1 output
├── quickstart.md        # Phase 1 output
├── contracts/           # Phase 1 output (API contracts)
│   ├── markets-api.md   # REST endpoints for markets CRUD
│   ├── codes-api.md     # Code generation and migration endpoints
│   └── rls-policies.md  # Complete RLS policy definitions
├── checklists/
│   └── requirements.md  # Specification quality validation (already created)
└── tasks.md             # Phase 2 output (/speckit.tasks command - NOT created by /speckit.plan)
```

### Source Code (repository root)

```text
# Next.js App Router Structure (existing)
app/
├── (authenticated)/
│   └── admin/
│       └── markets/           # NEW: Market management pages
│           ├── page.tsx       # Markets list
│           ├── [id]/
│           │   ├── page.tsx   # Market detail
│           │   └── edit/
│           │       └── page.tsx # Market edit form
│           └── new/
│               └── page.tsx   # Create market form
│
├── api/
│   └── admin/
│       └── markets/           # NEW: Market CRUD API routes
│           ├── route.ts       # GET /api/admin/markets, POST
│           └── [id]/
│               └── route.ts   # GET, PUT, DELETE /api/admin/markets/:id
│
components/
├── admin/
│   └── markets/               # NEW: Market management components
│       ├── MarketForm.tsx     # Market create/edit form
│       ├── MarketList.tsx     # Markets listing table
│       ├── MarketDetailTabs.tsx # Market detail view
│       └── CodeDisplay.tsx    # Component to display CLI/CTR codes
│
├── client/                    # MODIFIED: Show only own market data
│   └── (...existing components updated with market filtering)
│
└── contractor/                # MODIFIED: Show only own market data
    └── (...existing components updated with market filtering)
│
hooks/
├── useMarkets.ts              # NEW: React Query hooks for markets CRUD
├── useClientCode.ts           # NEW: Hook to fetch/display client codes
└── useContractorCode.ts       # NEW: Hook to fetch/display contractor codes
│
lib/
├── repositories/
│   └── marketRepository.ts    # NEW: Market data access layer
│
├── validations/
│   └── market-schemas.ts      # NEW: Zod schemas for market validation
│
└── supabase/
    └── market-utils.ts        # NEW: Market-specific Supabase helpers
│
supabase/
└── migrations/
    ├── 20250112000100_create_markets_table.sql
    ├── 20250112000110_create_code_sequences.sql
    ├── 20250112000120_add_code_columns.sql
    ├── 20250112000130_create_code_triggers.sql
    ├── 20250112000140_add_market_assignment.sql
    ├── 20250112000150_create_service_market_availability.sql
    ├── 20250112000160_create_market_rls_policies.sql
    ├── 20250112000170_migrate_existing_codes.sql
    └── 20250112000180_update_contractor_rls.sql
│
types/
└── market.ts                  # NEW: TypeScript types for markets, codes
```

**Structure Decision**: Using Next.js 16 App Router monolith structure (existing pattern). Market management follows existing admin panel conventions with dedicated routes under `/app/(authenticated)/admin/`. API routes use REST pattern consistent with existing `/app/api/admin/` structure. Database migrations follow existing numbering convention (timestamp-based). No new major directories introduced - extends existing patterns.

## Complexity Tracking

> **No violations** - all constitutional principles followed. This section intentionally left empty.

| Violation | Why Needed | Simpler Alternative Rejected Because |
|-----------|------------|-------------------------------------|
| N/A       | N/A        | N/A                                 |

---

## Implementation Phases

This plan stops after Phase 1 (Design & Contracts). Phase 2 (Task Generation) is handled by `/speckit.tasks` command.

### Phase 0: Outline & Research

**Output**: `research.md` with all technical clarifications resolved

**Research Tasks**:

1. **PostgreSQL Sequence Best Practices**
   - Research atomic sequence operations under concurrent load
   - Document sequence exhaustion handling (what happens at 999999?)
   - Find best practices for zero-padded formatting (CLI-000001 vs CLI-1)
   - Determine if SEQUENCE or SERIAL is better for this use case

2. **PostgreSQL Trigger Patterns for Code Generation**
   - Research BEFORE INSERT vs AFTER INSERT trigger timing
   - Document how to safely format sequence integers as VARCHAR
   - Find patterns for idempotent triggers (handle re-runs gracefully)
   - Determine error handling strategies if trigger fails

3. **RLS Policy Performance at Scale**
   - Research RLS performance impact on large datasets (10K+ rows)
   - Document index strategies for market_id filtering
   - Find best practices for admin bypass policies (performance considerations)
   - Determine if partial indexes improve filtered queries

4. **Migration Strategy for Existing Data**
   - Research safe patterns for adding NOT NULL columns to populated tables
   - Document backfilling strategies (online vs offline migration)
   - Find best practices for assigning codes to existing users (by creation date)
   - Determine rollback strategy if migration fails mid-way

5. **Market-Specific Currency Handling**
   - Research currency code validation (ISO 4217 list)
   - Document price storage patterns (cents vs decimal for multi-currency)
   - Find best practices for displaying prices in correct currency
   - Determine exchange rate handling (if needed for cross-market comparisons)

6. **Timezone Management Best Practices**
   - Research IANA timezone identifier validation
   - Document server-side vs client-side timezone conversion
   - Find best practices for storing timestamps (always UTC, convert on display)
   - Determine how to handle DST transitions in booking system

### Phase 1: Design & Contracts

**Prerequisites**: `research.md` complete with all clarifications resolved

**Outputs**:
- `data-model.md` - Complete database schema design
- `contracts/markets-api.md` - REST API endpoints for markets
- `contracts/codes-api.md` - Code generation and display APIs
- `contracts/rls-policies.md` - Complete RLS policy specifications
- `quickstart.md` - Developer guide for working with markets and codes
- Agent context updated via `.specify/scripts/bash/update-agent-context.sh`

**Tasks**:

1. **Extract and Model Database Entities** → `data-model.md`
   - Markets table schema (from FR-001)
   - Client code sequence (from FR-002, FR-005)
   - Contractor code sequence (from FR-003, FR-005)
   - Profiles table extension (client_code column from FR-002, FR-011)
   - Contractors table extension (contractor_code, market_id columns from FR-003, FR-007, FR-012)
   - Service-market junction table (from FR-008, FR-014)
   - Indexes for performance (market_id, code lookups from SC-008)
   - Constraints and validation rules (unique codes, FK relationships from FR-004, FR-007)
   - Trigger definitions (code assignment from FR-006)

2. **Generate API Contracts** → `contracts/markets-api.md`
   - Admin Markets CRUD endpoints:
     - `GET /api/admin/markets` - List all markets (paginated, filterable)
     - `POST /api/admin/markets` - Create new market (from User Story 1)
     - `GET /api/admin/markets/:id` - Get market details
     - `PUT /api/admin/markets/:id` - Update market (from User Story 1)
     - `DELETE /api/admin/markets/:id` - Soft delete market (from FR-017)
   - Code Display endpoints:
     - `GET /api/admin/clients?search={code}` - Search clients by code (from User Story 3)
     - `GET /api/admin/contractors?search={code}` - Search contractors by code (from User Story 3)
   - Migration endpoints (admin only):
     - `POST /api/admin/migrations/assign-codes` - Trigger code backfill (from FR-016)

3. **Define RLS Policies** → `contracts/rls-policies.md`
   - Markets table policies (public read active, admin full access from FR-009, FR-018)
   - Profiles table policies (market-filtered reads from User Story 6)
   - Contractors table policies (own market only from User Story 4, FR-007)
   - Services table policies (market availability filtering from User Story 5)
   - Bookings table policies (cross-check client and contractor markets)

4. **Create Developer Quickstart** → `quickstart.md`
   - How to create a new market (admin workflow)
   - How to assign contractors to markets (admin workflow)
   - How to configure services for markets (admin workflow)
   - How to query users by unique codes (admin workflow)
   - How to test RLS policies locally (developer workflow)
   - How to run migrations and verify code assignment (developer workflow)

5. **Update Agent Context**
   - Run `.specify/scripts/bash/update-agent-context.sh claude`
   - Add new technologies: PostgreSQL SEQUENCE, TRIGGER, RLS patterns
   - Update CLAUDE.md with market management conventions
   - Preserve manual additions between markers

---

**End of /speckit.plan Command Output**

This plan document provides the complete technical foundation for implementing international market segmentation. The next step is to execute research (Phase 0) to resolve all technical clarifications, followed by detailed design (Phase 1) to generate data models and API contracts.

**Next Command**: Phase 0 research will be executed automatically as part of this `/speckit.plan` command. Phase 2 tasks will be generated via `/speckit.tasks` command after plan review.
