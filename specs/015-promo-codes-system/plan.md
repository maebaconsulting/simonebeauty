# Implementation Plan: Système de Codes Promotionnels (Frontend)

**Branch**: `015-promo-codes-system` | **Date**: 2025-11-07 | **Spec**: [spec.md](./spec.md)
**Input**: Feature specification from `/specs/015-promo-codes-system/spec.md`
**Status**: ✅ Phase 1 Complete (Backend) | 🚧 Phase 2 Planning (Frontend)

## Summary

Implementation du frontend pour le système de codes promotionnels où la plateforme absorbe le coût de la réduction et les prestataires reçoivent leur commission complète sur le prix original. Le backend est déjà implémenté avec:
- Tables `promo_codes` et `promo_code_usage`
- Fonction `validate_promo_code()` avec validation complète
- Vues financières mises à jour pour commission sur montant original
- Triggers automatiques pour gestion des compteurs

Phase 2 se concentre sur 4 sprints frontend:
1. **Sprint 1**: Interface checkout client avec validation temps réel
2. **Sprint 2**: Dashboard admin - Gestion des codes (CRUD)
3. **Sprint 3**: Dashboard admin - Analytics + Dashboard prestataire
4. **Sprint 4**: Edge Functions Stripe + Sécurité (rate limiting, captcha)

## Technical Context

**Language/Version**: TypeScript 5.x avec Next.js 16 (React 19)
**Primary Dependencies**:
- @tanstack/react-query v5 (data fetching & caching)
- @supabase/ssr v0.7 + @supabase/supabase-js v2.80 (backend integration)
- react-hook-form v7 + zod v4 (validation)
- shadcn/ui (composants UI: Button, Input, Form, Table, Dialog, etc.)
- lucide-react (icônes)
- recharts (graphiques analytics)

**Storage**: Supabase PostgreSQL (backend déjà implémenté)
- Tables: `promo_codes`, `promo_code_usage`, `appointment_bookings` (extended)
- Fonction SQL: `validate_promo_code(code, user_id, service_id, amount)` returns validation result
- Vues: `contractor_financial_summary`, `contractor_transaction_details`

**Testing**: Vitest + @testing-library/react (déjà configuré)
- Test setup complet avec vitest.config.ts
- Tests unitaires (composants, hooks, utilities)
- Tests intégration (flows complets)
- Tests E2E (scenarios utilisateur)

**Target Platform**:
- Web (Next.js App Router, React Server Components)
- Progressive Web App (PWA) ready
- Mobile responsive (mobile-first)

**Performance Goals**:
- Validation code promo: <500ms (FR-009)
- Chargement page checkout: <2s
- API response analytics: <1s
- Render liste codes: <500ms (1000 codes)

**Constraints**:
- Rate limiting: max 5 validations/min (FR-027)
- Captcha après 5 échecs (FR-028)
- Blocage 15min après 10 échecs (FR-029)
- Support 1000 codes actifs simultanément (TC-002)
- Support 10k utilisations/jour (TC-003)

**Scale/Scope**:
- ~15 composants React (PromoCodeInput, PromoCodeForm, PromoCodeList, Analytics, etc.)
- 3-4 hooks custom (usePromoValidation, usePromoCodeMutations, usePromoAnalytics)
- 2 Edge Functions (validate-promo-realtime, regularize-promo-commission)
- 4 sprints (~30h développement)
- 5 user stories (P1: 2, P2: 2, P3: 1)

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

### ✅ ID Strategy Compliance
- **Promo codes** use `BIGINT` auto-increment IDs (not UUID)
- **Foreign keys** reference `promo_codes.id`, `appointment_bookings.id`
- **User references** use UUID only for `auth.users.id` sync
- **Status**: ✅ COMPLIANT - Backend already follows constitution

### ✅ Enum Strategy Compliance
- **Status field** uses `VARCHAR(20)` with CHECK constraint, not ENUM
- **Discount type** uses `VARCHAR(20) CHECK (discount_type IN ('percentage', 'fixed_amount'))`
- **Status**: ✅ COMPLIANT - Backend already follows constitution

### ✅ Naming Conventions
- **Tables**: English snake_case (`promo_codes`, `promo_code_usage`)
- **Columns**: English snake_case (`discount_value`, `uses_count`, `max_uses`)
- **Comments**: French (already in place)
- **UI Labels**: French (will be implemented)
- **Status**: ✅ COMPLIANT - Backend follows, frontend will follow

### ✅ Security-First Architecture
- **RLS Policies**: Already enabled on `promo_codes` and `promo_code_usage`
- **Validation**: Server-side via `validate_promo_code()` function
- **Rate Limiting**: To be implemented in Edge Functions (FR-027-030)
- **Input Sanitization**: To be implemented (FR-031)
- **Status**: ✅ COMPLIANT - RLS done, rate limiting pending (Sprint 4)

### ✅ Premium UX Principles
- **Mobile-first**: shadcn/ui composants responsive
- **Load time**: <3s (constitution target)
- **API response**: <1s (constitution target)
- **Status**: ✅ COMPLIANT - Will be verified in testing

### ⚠️ Testing & Quality (To be implemented)
- **Requirement**: Features only complete when tested
- **Current**: Test infrastructure ready (Vitest + RTL)
- **Pending**: Tests to be written during implementation
- **Status**: ⚠️ IN PROGRESS - Will be addressed per sprint

### ✅ Technology Stack Alignment
- **Frontend**: Next.js 16, React 19, TypeScript ✅
- **Data Fetching**: TanStack Query ✅
- **Styling**: Tailwind CSS v4 ✅
- **Components**: shadcn/ui ✅
- **Backend**: Supabase (already implemented) ✅
- **Payments**: Stripe (integration in Sprint 4) ✅
- **Status**: ✅ FULLY COMPLIANT

**GATE RESULT**: ✅ **PASS** - All constitution principles respected. No violations requiring justification.

## Project Structure

### Documentation (this feature)

```text
specs/015-promo-codes-system/
├── spec.md              # Feature specification (COMPLETE)
├── README.md            # Quick overview (COMPLETE)
├── plan.md              # This file (/speckit.plan output)
├── research.md          # Phase 0 - Technical research (will be generated)
├── data-model.md        # Phase 1 - Data entities (will be generated)
├── quickstart.md        # Phase 1 - Developer guide (will be generated)
├── contracts/           # Phase 1 - API contracts (will be generated)
└── tasks.md             # Phase 2 - Implementation tasks (/speckit.tasks command)
```

### Source Code (repository root)

```text
# Web application structure (Next.js 16 App Router)

app/
├── (client)/
│   └── checkout/
│       └── [bookingId]/
│           └── page.tsx              # Sprint 1: Checkout avec promo
├── (admin)/
│   └── promotions/
│       ├── page.tsx                  # Sprint 2: Liste codes
│       ├── new/page.tsx              # Sprint 2: Création code
│       ├── [id]/edit/page.tsx        # Sprint 2: Édition code
│       └── analytics/page.tsx        # Sprint 3: Analytics dashboard
└── (contractor)/
    └── dashboard/
        └── transactions/
            └── [id]/page.tsx         # Sprint 3: Détail transaction

components/
├── ui/                               # shadcn/ui base components
│   ├── button.tsx
│   ├── input.tsx
│   ├── form.tsx
│   ├── table.tsx
│   ├── dialog.tsx
│   ├── badge.tsx
│   ├── card.tsx
│   ├── select.tsx
│   └── ...
├── promo-codes/
│   ├── PromoCodeInput.tsx            # Sprint 1: Client checkout input
│   ├── PromoCodeApplied.tsx          # Sprint 1: Applied promo display
│   ├── PromoCodeForm.tsx             # Sprint 2: Admin creation/edit form
│   ├── PromoCodeList.tsx             # Sprint 2: Admin list with filters
│   ├── PromoCodeFilters.tsx          # Sprint 2: Filter bar
│   ├── PromoCodeAnalytics.tsx        # Sprint 3: Analytics dashboard
│   ├── PromoCodeChart.tsx            # Sprint 3: Usage chart
│   ├── PromoCodeTopCodes.tsx         # Sprint 3: Top codes table
│   └── PromoCodeDetails.tsx          # Sprint 3: Code detail view
├── contractor/
│   └── TransactionPromoInfo.tsx      # Sprint 3: Promo info for contractor
└── shared/
    ├── PriceDisplay.tsx              # Original vs reduced price
    └── ErrorMessage.tsx              # Validation errors

hooks/
├── usePromoValidation.ts             # Sprint 1: Real-time validation
├── usePromoCodeMutations.ts          # Sprint 2: CRUD operations
├── usePromoAnalytics.ts              # Sprint 3: Analytics data
└── useRateLimiting.ts                # Sprint 4: Anti-fraude

lib/
├── supabase/
│   ├── client.ts                     # Supabase client (browser)
│   ├── server.ts                     # Supabase client (server)
│   └── queries/
│       └── promo-codes.ts            # Promo code queries
├── validations/
│   └── promo-code-schema.ts          # Zod schemas
└── utils/
    ├── promo-calculations.ts         # Discount calculations
    └── promo-formatting.ts           # Display formatting

supabase/functions/
├── validate-promo-realtime/          # Sprint 1: Validation endpoint
│   └── index.ts
├── create-payment-intent/            # Sprint 4: Updated with promo
│   └── index.ts
└── regularize-promo-commission/      # Sprint 4: Audit function
    └── index.ts

__tests__/
├── components/
│   └── promo-codes/
│       ├── PromoCodeInput.test.tsx
│       ├── PromoCodeForm.test.tsx
│       └── ...
├── hooks/
│   ├── usePromoValidation.test.ts
│   └── ...
└── integration/
    ├── promo-checkout-flow.test.ts
    ├── promo-admin-crud.test.ts
    └── promo-analytics.test.ts
```

**Structure Decision**: Web application (Next.js App Router) with clear separation of concerns:
- **Routes**: Organized by user role ((client), (admin), (contractor))
- **Components**: Feature-based organization (promo-codes/, contractor/, shared/)
- **Hooks**: Centralized business logic for reusability
- **Tests**: Mirror source structure for easy navigation
- Backend logic lives in Edge Functions (Deno runtime) for serverless execution

## Complexity Tracking

> **No violations - This section intentionally left empty**

All constitution checks passed. No complexity justifications required.

## Phase 0: Research (To be generated)

**Objective**: Resolve any technical unknowns and research best practices.

**Topics to Research**:
1. **TanStack Query patterns** for promo code validation (optimistic updates, cache invalidation)
2. **Rate limiting strategies** in Next.js (middleware vs Edge Functions)
3. **Captcha integration** (hCaptcha vs reCAPTCHA for Supabase)
4. **Real-time validation UX** (debouncing, loading states, error recovery)
5. **Recharts patterns** for analytics (responsive charts, date range pickers)
6. **Stripe metadata** best practices (promo code information in PaymentIntent)
7. **CSV export** in Next.js (client-side vs server-side generation)
8. **Anti-fraud patterns** (fingerprinting, pattern detection)

**Output**: `research.md` with decisions, rationale, and alternatives considered.

## Phase 1: Design & Contracts (To be generated)

### Data Model (`data-model.md`)

**Entities** (backend already implemented):
- **PromoCode**: code, description, discount_type, discount_value, max_discount_amount, valid_from, valid_until, max_uses, uses_count, max_uses_per_user, first_booking_only, min_order_amount, specific_services[], specific_categories[], is_active
- **PromoCodeUsage**: promo_code_id, booking_id, user_id, original_amount, discount_amount, final_amount, used_at
- **AppointmentBooking** (extended): service_amount_original, promo_code_id, promo_discount_amount

**Client-Side Types** (TypeScript interfaces to be defined):
```typescript
// Type definitions will be in research.md with full validation schemas
```

### API Contracts (`contracts/`)

**Contracts to define**:
1. **POST /functions/v1/validate-promo-realtime** (Sprint 1)
2. **GET /rest/v1/promo_codes** (Sprint 2 - liste admin)
3. **POST /rest/v1/promo_codes** (Sprint 2 - création)
4. **PATCH /rest/v1/promo_codes?id=eq.{id}** (Sprint 2 - édition)
5. **GET /rest/v1/promo_code_usage** (Sprint 3 - analytics)
6. **POST /functions/v1/create-payment-intent** (Sprint 4 - updated)

**Output**: OpenAPI/TypeScript schemas in `contracts/` directory.

### Quickstart (`quickstart.md`)

**Developer guide** covering:
- How to add a promo code input to a new page
- How to validate a promo code
- How to display promo information
- How to test promo code flows
- How to query analytics data
- Common troubleshooting scenarios

## Phase 2: Implementation (Via /speckit.tasks)

**NOT GENERATED BY THIS COMMAND**. After Phase 0 and Phase 1 are complete, run:

```bash
/speckit.tasks 015-promo-codes-system
```

This will generate `tasks.md` with:
- 4 sprints broken down into actionable tasks
- Dependencies between tasks
- Estimated time per task
- Acceptance criteria per task
- Testing requirements

**Estimated Total Time**: 29-39 hours
- Sprint 1 (Checkout): 6h
- Sprint 2 (Admin CRUD): 16h
- Sprint 3 (Analytics + Contractor): 12h
- Sprint 4 (Edge Functions + Security): 8h

## Next Steps

1. ✅ **Phase 0**: Generate `research.md` (research technical unknowns)
2. ✅ **Phase 1**: Generate `data-model.md`, `contracts/`, `quickstart.md`
3. ⏭️ **Phase 2**: Run `/speckit.tasks 015-promo-codes-system` to generate implementation tasks
4. 🚧 **Implementation**: Execute tasks sprint by sprint
5. 🧪 **Testing**: Write and run tests per sprint
6. ✅ **Validation**: Verify all success criteria (SC-001 to SC-010)

---

**Last Updated**: 2025-11-07
**Status**: 📋 Plan Ready - Proceed to /speckit.tasks to generate implementation tasks
**Backend**: ✅ Production Ready
**Frontend**: 🚧 Sprint Planning Phase
