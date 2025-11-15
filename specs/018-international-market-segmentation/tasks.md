# Tasks: International Market Segmentation with Unique Codes

**Input**: Design documents from `/specs/018-international-market-segmentation/`
**Prerequisites**: plan.md, spec.md, data-model.md, contracts/, research.md, quickstart.md

**Tests**: NOT requested - no test tasks generated

**Organization**: Tasks are grouped by user story to enable independent implementation and testing of each story.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (e.g., US1, US2, US3)
- Include exact file paths in descriptions

## Path Conventions

- **Next.js App Router**: `app/`, `components/`, `lib/`, `hooks/`, `types/`
- **Database**: `supabase/migrations/`
- All paths are relative to repository root `/Users/dan/Documents/SOFTWARE/myProjects/simone _v2.1/webclaude/`

---

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Project initialization and database foundation

- [ ] T001 Review existing Next.js 16 project structure and Supabase connection
- [ ] T002 Verify TypeScript 5.x and React 19 configuration in package.json and tsconfig.json
- [ ] T003 [P] Ensure Zod validation library is installed for schema validation

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Database schema and sequences that MUST be complete before ANY user story can be implemented

**⚠️ CRITICAL**: No user story work can begin until this phase is complete

- [ ] T004 Create markets table migration in supabase/migrations/20250112000100_create_markets_table.sql
- [ ] T005 [P] Create client_code_seq and contractor_code_seq sequences in supabase/migrations/20250112000110_create_code_sequences.sql
- [ ] T006 [P] Add client_code column to profiles table in supabase/migrations/20250112000120_add_code_columns.sql
- [ ] T007 [P] Add contractor_code and market_id columns to contractors table in supabase/migrations/20250112000120_add_code_columns.sql
- [ ] T008 Create generate_client_code() trigger function in supabase/migrations/20250112000130_create_code_triggers.sql
- [ ] T009 [P] Create generate_contractor_code() trigger function in supabase/migrations/20250112000130_create_code_triggers.sql
- [ ] T010 Create service_market_availability junction table in supabase/migrations/20250112000150_create_service_market_availability.sql
- [ ] T011 Create base RLS policies for markets table in supabase/migrations/20250112000160_create_market_rls_policies.sql
- [ ] T012 [P] Create migration script to backfill existing client codes in supabase/migrations/20250112000170_migrate_existing_codes.sql
- [ ] T013 Run all database migrations on local development database

**Checkpoint**: Foundation ready - user story implementation can now begin in parallel

---

## Phase 3: User Story 1 - Market Configuration (Priority: P1) 🎯 MVP

**Goal**: Platform administrators can create, read, update, and deactivate geographical markets with appropriate regional settings (currency, timezone, languages)

**Independent Test**: Admin can create a new market through admin interface, and the market stores correct currency, timezone, and language settings. Verifying that market appears in listings confirms basic CRUD operations work.

### Data Layer for User Story 1

- [ ] T014 [P] [US1] Create Market TypeScript type in types/market.ts
- [ ] T015 [P] [US1] Create Zod validation schema for create market in lib/validations/market-schemas.ts
- [ ] T016 [P] [US1] Create Zod validation schema for update market in lib/validations/market-schemas.ts
- [ ] T017 [P] [US1] Create Zod validation schema for list markets query in lib/validations/market-schemas.ts

### API Layer for User Story 1

- [ ] T018 [US1] Implement GET /api/admin/markets endpoint (list all markets) in app/api/admin/markets/route.ts
- [ ] T019 [US1] Implement POST /api/admin/markets endpoint (create market) in app/api/admin/markets/route.ts
- [ ] T020 [US1] Implement GET /api/admin/markets/[id] endpoint in app/api/admin/markets/[id]/route.ts
- [ ] T021 [US1] Implement PUT /api/admin/markets/[id] endpoint (update market) in app/api/admin/markets/[id]/route.ts
- [ ] T022 [US1] Implement DELETE /api/admin/markets/[id] endpoint (soft delete/deactivate) in app/api/admin/markets/[id]/route.ts

### Service Layer for User Story 1

- [ ] T023 [P] [US1] Create marketRepository for database access in lib/repositories/marketRepository.ts
- [ ] T024 [P] [US1] Implement React Query hooks (useMarkets, useMarket, useCreateMarket, useUpdateMarket, useDeleteMarket) in hooks/useMarkets.ts

### UI Layer for User Story 1

- [ ] T025 [US1] Create MarketList component in components/admin/markets/MarketList.tsx
- [ ] T026 [P] [US1] Create MarketForm component (create/edit) in components/admin/markets/MarketForm.tsx
- [ ] T027 [P] [US1] Create MarketDetailTabs component in components/admin/markets/MarketDetailTabs.tsx
- [ ] T028 [US1] Create markets list page in app/(authenticated)/admin/markets/page.tsx
- [ ] T029 [US1] Create market detail page in app/(authenticated)/admin/markets/[id]/page.tsx
- [ ] T030 [US1] Create market edit page in app/(authenticated)/admin/markets/[id]/edit/page.tsx
- [ ] T031 [US1] Create new market page in app/(authenticated)/admin/markets/new/page.tsx

**Checkpoint**: At this point, User Story 1 should be fully functional - admin can create, view, update, and deactivate markets through the UI

---

## Phase 4: User Story 2 - Automatic Unique Code Generation (Priority: P2)

**Goal**: System automatically assigns unique, sequential codes to clients (CLI-XXXXXX) and contractors (CTR-XXXXXX) upon account creation for administrative and customer service purposes

**Independent Test**: Create new client and contractor accounts and verify that each receives a unique code in the correct format. Codes should be sequential and never duplicate, even under concurrent load.

### Verification for User Story 2

- [ ] T032 [US2] Verify client_code trigger works by inserting test profile in local database
- [ ] T033 [US2] Verify contractor_code trigger works by inserting test contractor in local database
- [ ] T034 [US2] Test concurrent code generation (create 100 clients simultaneously) to verify no duplicates

**Checkpoint**: Code generation is automatic and reliable - no UI needed for this story, it's pure backend functionality

---

## Phase 3: User Story 3 - Code Display in Admin Interface (Priority: P3)

**Goal**: Administrators can see client and contractor unique codes in all listing and detail views for quick identification and reference in customer service tasks

**Independent Test**: View client and contractor lists in admin interface and verify that codes are displayed prominently alongside names and other identifying information

### Data Layer for User Story 3

- [ ] T035 [P] [US3] Create ClientWithCode TypeScript type in types/code.ts
- [ ] T036 [P] [US3] Create ContractorWithCode TypeScript type in types/code.ts
- [ ] T037 [P] [US3] Create Zod schema for client code validation in lib/validations/code-schemas.ts
- [ ] T038 [P] [US3] Create Zod schema for contractor code validation in lib/validations/code-schemas.ts

### API Layer for User Story 3

- [ ] T039 [US3] Extend GET /api/admin/clients endpoint to include client_code in response (may need to update existing endpoint)
- [ ] T040 [US3] Extend GET /api/admin/contractors endpoint to include contractor_code in response (may need to update existing endpoint)
- [ ] T041 [P] [US3] Implement GET /api/admin/clients/:code endpoint (search by code) in app/api/admin/clients/[code]/route.ts
- [ ] T042 [P] [US3] Implement GET /api/admin/contractors/:code endpoint (search by code) in app/api/admin/contractors/[code]/route.ts

### Service Layer for User Story 3

- [ ] T043 [P] [US3] Create useClientByCode React Query hook in hooks/useClientCode.ts
- [ ] T044 [P] [US3] Create useContractorByCode React Query hook in hooks/useContractorCode.ts

### UI Layer for User Story 3

- [ ] T045 [P] [US3] Create CodeDisplay component (copy to clipboard, color-coded) in components/admin/CodeDisplay.tsx
- [ ] T046 [US3] Add client_code column to existing admin clients listing page
- [ ] T047 [US3] Add contractor_code column to existing admin contractors listing page
- [ ] T048 [US3] Add client_code display to existing client detail page
- [ ] T049 [US3] Add contractor_code display to existing contractor detail page
- [ ] T050 [US3] Add code search functionality to admin clients search
- [ ] T051 [US3] Add code search functionality to admin contractors search

**Checkpoint**: Codes are now visible in all admin interfaces - admins can search and reference users by their unique codes

---

## Phase 6: User Story 4 - Contractor Market Assignment (Priority: P4)

**Goal**: Administrators can assign each contractor to a specific market so contractors only see and handle bookings from their designated geographical region

**Independent Test**: Assign contractors to different markets and verify that each contractor is associated with exactly one market, with appropriate validation preventing contractors from being unassigned or assigned to multiple markets

### Data Layer for User Story 4

- [ ] T052 [US4] Verify contractors.market_id column created and NOT NULL constraint in place (from foundational phase)

### RLS Layer for User Story 4

- [ ] T053 [US4] Create RLS policy "Contractors see own market data" in supabase/migrations/20250112000180_update_contractor_rls.sql
- [ ] T054 [US4] Create RLS policy "Admin can manage contractors across markets" in supabase/migrations/20250112000180_update_contractor_rls.sql

### API Layer for User Story 4

- [ ] T055 [US4] Extend contractor creation endpoint to require market_id (may already exist - verify and add validation)
- [ ] T056 [US4] Extend contractor update endpoint to allow market_id change (in existing contractor edit API)
- [ ] T057 [US4] Add validation to prevent assigning contractors to inactive markets

### UI Layer for User Story 4

- [ ] T058 [US4] Add market_id dropdown to contractor creation form (in existing admin contractor forms)
- [ ] T059 [US4] Add market_id dropdown to contractor edit form (in existing admin contractor forms)
- [ ] T060 [US4] Display assigned market name in contractor listing (add market column to contractor table)
- [ ] T061 [US4] Display assigned market details in contractor detail page
- [ ] T062 [US4] Add market filter to contractor listing page (filter contractors by market dropdown)

**Checkpoint**: Contractors are now assigned to markets - each contractor belongs to exactly one market and can only see data from that market

---

## Phase 7: User Story 5 - Service Multi-Market Availability (Priority: P5)

**Goal**: Administrators can configure which markets each service is available in with market-specific pricing, enabling services to be offered in multiple countries with localized pricing

**Independent Test**: Configure a service to be available in specific markets (e.g., "Haircut" available in FR, BE, CH) with different prices per market, and verify that the service appears correctly for users in those markets

### Data Layer for User Story 5

- [ ] T063 [US5] Verify service_market_availability table exists (from foundational phase)
- [ ] T064 [P] [US5] Create ServiceMarketAvailability TypeScript type in types/market.ts
- [ ] T065 [P] [US5] Create Zod schema for service market pricing in lib/validations/market-schemas.ts

### RLS Layer for User Story 5

- [ ] T066 [US5] Create RLS policy "Public can view available services by market" on service_market_availability table in supabase/migrations/20250112000160_create_market_rls_policies.sql
- [ ] T067 [US5] Create RLS policy "Admins can manage service availability" on service_market_availability table in supabase/migrations/20250112000160_create_market_rls_policies.sql

### API Layer for User Story 5

- [ ] T068 [US5] Implement GET /api/admin/services/:id/markets endpoint (list markets for service) in app/api/admin/services/[id]/markets/route.ts
- [ ] T069 [US5] Implement POST /api/admin/services/:id/markets endpoint (add service to market with pricing) in app/api/admin/services/[id]/markets/route.ts
- [ ] T070 [US5] Implement PUT /api/admin/services/:id/markets/:marketId endpoint (update market-specific pricing) in app/api/admin/services/[id]/markets/[marketId]/route.ts
- [ ] T071 [US5] Implement DELETE /api/admin/services/:id/markets/:marketId endpoint (remove service from market) in app/api/admin/services/[id]/markets/[marketId]/route.ts

### Service Layer for User Story 5

- [ ] T072 [P] [US5] Create useServiceMarkets React Query hook in hooks/useServices.ts

### UI Layer for User Story 5

- [ ] T073 [US5] Create ServiceMarketAvailability component in components/admin/services/ServiceMarketAvailability.tsx
- [ ] T074 [US5] Add market availability tab to existing service edit form (integrate with existing service form)
- [ ] T075 [US5] Display market-specific pricing in service detail page
- [ ] T076 [US5] Update service listing to show available markets count

**Checkpoint**: Services can now be configured for multiple markets - each service shows different prices in different markets

---

## Phase 8: User Story 6 - Market-Filtered Data Access (Priority: P6)

**Goal**: Clients and contractors only see data (services, bookings, contractors) relevant to their market for a localized experience without irrelevant information from other regions

**Independent Test**: Create users in different markets and verify that each user only sees services, contractors, and bookings from their assigned market

### RLS Layer for User Story 6

- [ ] T077 [US6] Create RLS policy "Clients can view own bookings" on appointment_bookings in supabase/migrations/20250112000180_update_contractor_rls.sql
- [ ] T078 [US6] Create RLS policy "Contractors see own market bookings" on appointment_bookings in supabase/migrations/20250112000180_update_contractor_rls.sql
- [ ] T079 [US6] Create RLS policy "Bookings must respect market boundaries" (WITH CHECK) on appointment_bookings in supabase/migrations/20250112000180_update_contractor_rls.sql

### Service Layer for User Story 6

- [ ] T080 [US6] Update service discovery queries to filter by market_id using service_market_availability join
- [ ] T081 [US6] Update contractor discovery queries to filter by market_id
- [ ] T082 [US6] Update booking queries to enforce market boundaries

### UI Layer for User Story 6

- [ ] T083 [US6] Update client service browsing to only show services available in client's market (in existing service catalog)
- [ ] T084 [US6] Update client contractor search to only show contractors in client's market (in existing contractor search)
- [ ] T085 [US6] Update contractor booking requests view to only show bookings from contractor's market (in existing contractor dashboard)
- [ ] T086 [US6] Add market filter to admin booking list (admin can see all markets)

**Checkpoint**: All user-facing data is now filtered by market - clients and contractors only see relevant data for their region

---

## Phase 9: Polish & Cross-Cutting Concerns

**Purpose**: Improvements that affect multiple user stories and final validation

### Migration Backfill

- [ ] T087 Create and run migration to backfill existing client codes (if not already done in foundational phase)
- [ ] T088 Create and run migration to backfill existing contractor codes (if not already done in foundational phase)
- [ ] T089 Set NOT NULL constraint on profiles.client_code after backfill
- [ ] T090 Set NOT NULL constraint on contractors.contractor_code after backfill
- [ ] T091 Set NOT NULL constraint on contractors.market_id after market assignment

### Admin Market Statistics

- [ ] T092 [P] Implement GET /api/admin/markets/:id/stats endpoint in app/api/admin/markets/[id]/stats/route.ts
- [ ] T093 [P] Create MarketStatsDisplay component in components/admin/markets/MarketStatsDisplay.tsx
- [ ] T094 Add market statistics to market detail page

### Currency and Timezone Utilities

- [ ] T095 [P] Create formatPrice utility function (Intl.NumberFormat) in lib/utils/currency.ts
- [ ] T096 [P] Create formatDateTime utility with timezone support in lib/utils/timezone.ts
- [ ] T097 Update all price displays to use formatPrice utility
- [ ] T098 Update all datetime displays to use formatDateTime utility with user's market timezone

### Performance Optimization

- [ ] T099 [P] Verify all market_id columns have B-tree indexes (from data-model.md)
- [ ] T100 [P] Verify partial indexes on (market_id, is_active) for contractors and services (from data-model.md)
- [ ] T101 Run EXPLAIN ANALYZE on critical market-filtered queries to verify index usage

### Documentation

- [ ] T102 [P] Update README.md with market segmentation setup instructions
- [ ] T103 [P] Create admin user guide for market management in docs/admin/markets.md
- [ ] T104 Test all scenarios from quickstart.md to validate implementation

### Code Quality

- [ ] T105 [P] Run ESLint and fix any linting errors related to new market code
- [ ] T106 [P] Run TypeScript compiler (tsc --noEmit) and fix any type errors
- [ ] T107 Code review: Check all RLS policies for security vulnerabilities
- [ ] T108 Code review: Verify all API endpoints have proper authentication checks

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No dependencies - can start immediately
- **Foundational (Phase 2)**: Depends on Setup completion - BLOCKS all user stories
- **User Story 1 (Phase 3)**: Depends on Foundational phase completion - No dependencies on other stories
- **User Story 2 (Phase 4)**: Depends on Foundational phase completion - No dependencies on other stories (automatic trigger)
- **User Story 3 (Phase 5)**: Depends on User Story 2 completion (needs codes to exist)
- **User Story 4 (Phase 6)**: Depends on User Story 1 completion (needs markets to exist)
- **User Story 5 (Phase 7)**: Depends on User Story 1 completion (needs markets to exist)
- **User Story 6 (Phase 8)**: Depends on User Stories 4 and 5 completion (needs market assignment and service availability)
- **Polish (Phase 9)**: Depends on all desired user stories being complete

### User Story Dependencies (Visual)

```
Foundation (Phase 2)
    ↓
    ├─→ US1: Market Configuration (P1) 🎯 MVP
    │      ↓
    │      ├─→ US4: Contractor Market Assignment (P4)
    │      │      ↓
    │      │      ├─→ US6: Market-Filtered Data Access (P6)
    │      │      │
    │      └─→ US5: Service Multi-Market Availability (P5)
    │             ↓
    │             └─→ US6: Market-Filtered Data Access (P6)
    │
    └─→ US2: Automatic Code Generation (P2)
           ↓
           └─→ US3: Code Display in Admin (P3)
```

### Within Each User Story

- Data layer (types, schemas) before API layer
- API layer before service layer
- Service layer before UI layer
- Core implementation before integration

### Parallel Opportunities

**Phase 1 (Setup)**: All 3 tasks can run in parallel

**Phase 2 (Foundational)**:
- T005, T006, T007, T009, T012 can run in parallel (different files)
- T008 depends on T005, T006 (needs sequences and columns)
- T010 depends on T004 (needs markets table)

**Phase 3 (US1)**:
- T014, T015, T016, T017 can run in parallel (types and schemas)
- T023, T024, T026, T027 can run in parallel (service layer and some UI components)

**Phase 5 (US3)**:
- T035, T036, T037, T038 can run in parallel (types and schemas)
- T041, T042 can run in parallel (API endpoints)
- T043, T044 can run in parallel (hooks)
- T045 can be built independently

**Phase 7 (US5)**:
- T064, T065 can run in parallel (types and schemas)
- T072 can be built independently

**Phase 9 (Polish)**:
- T092, T093, T095, T096, T099, T100, T102, T103, T105, T106 can all run in parallel

---

## Parallel Example: User Story 1

```bash
# Launch types and schemas together:
Task T014: "Create Market TypeScript type in types/market.ts"
Task T015: "Create Zod validation schema for create market in lib/validations/market-schemas.ts"
Task T016: "Create Zod validation schema for update market in lib/validations/market-schemas.ts"
Task T017: "Create Zod validation schema for list markets query in lib/validations/market-schemas.ts"

# Later, launch repository and hooks together:
Task T023: "Create marketRepository for database access in lib/repositories/marketRepository.ts"
Task T024: "Implement React Query hooks in hooks/useMarkets.ts"

# Launch independent UI components together:
Task T026: "Create MarketForm component in components/admin/markets/MarketForm.tsx"
Task T027: "Create MarketDetailTabs component in components/admin/markets/MarketDetailTabs.tsx"
```

---

## Implementation Strategy

### MVP First (User Story 1 Only)

1. Complete Phase 1: Setup → 3 tasks
2. Complete Phase 2: Foundational → 10 tasks (CRITICAL - blocks all stories)
3. Complete Phase 3: User Story 1 → 18 tasks
4. **STOP and VALIDATE**: Test market CRUD operations independently
5. Deploy/demo market management functionality

**Total MVP Tasks: 31 tasks**

### Incremental Delivery

1. **Foundation** (Phase 1+2): 13 tasks → Database ready ✅
2. **MVP** (Phase 3): +18 tasks → Market management working ✅
3. **Code Generation** (Phase 4): +3 tasks → Automatic codes working ✅
4. **Code Display** (Phase 5): +17 tasks → Codes visible in admin ✅
5. **Market Assignment** (Phase 6): +11 tasks → Contractors assigned to markets ✅
6. **Multi-Market Services** (Phase 7): +14 tasks → Services have market-specific pricing ✅
7. **Data Filtering** (Phase 8): +10 tasks → Complete market segmentation ✅
8. **Polish** (Phase 9): +22 tasks → Production ready ✅

### Parallel Team Strategy

With 3 developers after Foundation complete:

1. Team completes Setup + Foundational together (13 tasks)
2. Once Foundational is done:
   - **Developer A**: User Story 1 (Market Configuration) → 18 tasks
   - **Developer B**: User Story 2 (Code Generation - verify only) → 3 tasks, then help with US1
   - **Developer C**: Start preparing types/schemas for US3-US6
3. After US1 complete:
   - **Developer A**: User Story 4 (Contractor Assignment) → 11 tasks
   - **Developer B**: User Story 3 (Code Display) → 17 tasks
   - **Developer C**: User Story 5 (Multi-Market Services) → 14 tasks
4. Final sprint: US6 + Polish together

---

## Notes

- **[P]** tasks = different files, no dependencies, can run in parallel
- **[Story]** label maps task to specific user story for traceability
- Each user story should be independently completable and testable
- Commit after each task or logical group
- Stop at any checkpoint to validate story independently
- **NO TESTS**: Tests were not requested in spec.md, so no test tasks generated
- All database changes require migrations (never modify database directly)
- All API routes must check authentication and authorization (admin/manager only for market management)
- RLS policies are critical for security - review carefully before deploying

---

## Total Task Count

- **Phase 1 (Setup)**: 3 tasks
- **Phase 2 (Foundational)**: 10 tasks
- **Phase 3 (US1)**: 18 tasks
- **Phase 4 (US2)**: 3 tasks
- **Phase 5 (US3)**: 17 tasks
- **Phase 6 (US4)**: 11 tasks
- **Phase 7 (US5)**: 14 tasks
- **Phase 8 (US6)**: 10 tasks
- **Phase 9 (Polish)**: 22 tasks

**TOTAL: 108 tasks**

**Parallel Opportunities**: 45+ tasks can run in parallel across different phases

**MVP Scope**: Phases 1-3 (31 tasks) deliver basic market management

**Full Feature**: All 108 tasks deliver complete international market segmentation with unique codes
