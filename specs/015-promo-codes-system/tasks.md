# Implementation Tasks: Système de Codes Promotionnels (Frontend)

**Feature**: 015-promo-codes-system
**Branch**: `015-promo-codes-system`
**Date**: 2025-11-07
**Status**: 📋 Ready for Implementation

## Overview

This document contains all implementation tasks for the promo codes frontend, organized by user story for independent delivery. The backend is already complete.

**Total Estimated Time**: 30-40 hours across 4 sprints
**MVP Scope**: User Story 1 (Client checkout with promo validation) - ~6 hours

---

## Task Summary

| Phase | Story | Tasks | Estimated Time | Status |
|-------|-------|-------|----------------|--------|
| Setup | - | 8 tasks | 1h | 🚧 Ready |
| Foundational | - | 5 tasks | 2h | ⏸️ Blocked by Setup |
| User Story 1 (P1) | Client promo checkout | 12 tasks | 6h | ⏸️ Blocked by Foundational |
| User Story 2 (P1) | Admin promo creation | 15 tasks | 16h | ⏸️ Blocked by Foundational |
| User Story 3 (P2) | Contractor transparency | 8 tasks | 4h | ⏸️ Blocked by US1 |
| User Story 4 (P2) | Admin analytics | 10 tasks | 8h | ⏸️ Blocked by US2 |
| User Story 5 (P3) | Error messaging | 6 tasks | 2h | ⏸️ Blocked by US1 |
| Security & Polish | - | 12 tasks | 8h | ⏸️ Blocked by all US |
| **TOTAL** | **5 stories** | **76 tasks** | **~47h** | |

---

## Phase 1: Setup (Infrastructure)

**Goal**: Initialize project structure and install all required dependencies.

**Prerequisites**: None (start here)

**Tasks**:

- [ ] T001 Install additional frontend dependencies: `pnpm add @hcaptcha/react-hcaptcha use-debounce recharts date-fns`
- [ ] T002 [P] Create TypeScript types directory at `types/promo-code.ts` with base interfaces (PromoCode, DiscountType, PromoCodeStatus, PromoValidationResult, AppliedPromo)
- [ ] T003 [P] Create TypeScript types at `types/promo-validation.ts` with validation interfaces (ValidatePromoParams, PromoValidationResult, AppliedPromo)
- [ ] T004 [P] Create TypeScript types at `types/promo-form.ts` with Zod schema (promoCodeFormSchema, PromoCodeFormData)
- [ ] T005 [P] Create TypeScript types at `types/promo-analytics.ts` with analytics interfaces (PromoAnalyticsKPIs, TopPromoCode, PromoUsageChartData, PromoCodePerformance)
- [ ] T006 [P] Create TypeScript types at `types/promo-filters.ts` with filter interfaces (PromoCodeFilters, PaginationParams, PaginatedResponse)
- [ ] T007 [P] Create utility functions at `lib/utils/promo-status.ts` with getPromoCodeStatus() helper
- [ ] T008 [P] Create utility functions at `lib/utils/promo-calculations.ts` with calculateDiscount(), calculateFinalAmount(), calculateROI() helpers

**Acceptance**: All TypeScript types compile without errors, utilities are importable.

---

## Phase 2: Foundational (Shared Infrastructure)

**Goal**: Build shared components and hooks used across multiple user stories.

**Prerequisites**: Phase 1 complete

**Blocking For**: All user stories (US1-US5)

**Tasks**:

- [ ] T009 Create shared PriceDisplay component at `components/shared/PriceDisplay.tsx` to show original vs reduced prices
- [ ] T010 Create shared ErrorMessage component at `components/shared/ErrorMessage.tsx` for validation errors
- [ ] T011 Create Supabase queries module at `lib/supabase/queries/promo-codes.ts` with type-safe query builders
- [ ] T012 Create promo formatting utilities at `lib/utils/promo-formatting.ts` with formatPromoDiscount(), formatPromoStatus()
- [ ] T013 Install and configure shadcn/ui Table component: `npx shadcn@latest add table`

**Acceptance**: Shared components render correctly in isolation, query builders are type-safe.

---

## Phase 3: User Story 1 - Client Promo Checkout (P1)

**User Story**: Un nouveau client utilise un code promotionnel de bienvenue (20% réduction) lors du paiement pour bénéficier de la réduction.

**Why P1**: Fonctionnalité d'acquisition client essentielle. MVP absolu pour le growth.

**Independent Test**: Créer code "BIENVENUE20", l'appliquer lors d'une réservation, vérifier prix réduit de 20%.

**Prerequisites**: Phase 2 complete

**Deliverable**: Clients can enter, validate, and apply promo codes at checkout.

**Tasks**:

- [ ] T014 [US1] Create usePromoValidation hook at `hooks/usePromoValidation.ts` using TanStack Query to call validate_promo_code() RPC
- [ ] T015 [US1] Create PromoCodeInput component at `components/promo-codes/PromoCodeInput.tsx` with debounced validation (500ms) and "Appliquer" button
- [ ] T016 [US1] Create PromoCodeApplied component at `components/promo-codes/PromoCodeApplied.tsx` to display applied promo with "Retirer" button
- [ ] T017 [US1] Install shadcn/ui components needed: `npx shadcn@latest add input button badge`
- [ ] T018 [US1] Create checkout page at `app/(client)/checkout/[bookingId]/page.tsx` integrating PromoCodeInput
- [ ] T019 [US1] Implement promo state management in checkout page (appliedPromo state, onPromoApplied, onPromoRemoved handlers)
- [ ] T020 [US1] Update PriceDisplay component to show original price strikethrough, discount amount, and final price
- [ ] T021 [US1] Add validation error display in PromoCodeInput using ErrorMessage component
- [ ] T022 [US1] Implement rate limiting check (max 5 validations/min) in usePromoValidation hook
- [ ] T023 [US1] Create email confirmation template update at `lib/email/templates/booking-confirmation.tsx` to include promo info
- [ ] T024 [US1] Add promo information to booking creation mutation (service_amount_original, promo_code_id, promo_discount_amount)
- [ ] T025 [US1] Test complete checkout flow: enter code, validate, apply, complete payment with reduced amount

**Acceptance Criteria**:
- ✅ Client can enter promo code "BIENVENUE20" at checkout
- ✅ System validates code in real-time (<500ms)
- ✅ Applied promo shows: original price €100 (strikethrough), discount -€20, final €80
- ✅ Client can remove applied promo and price reverts to €100
- ✅ Invalid codes show clear error messages
- ✅ Rate limiting activates after 5 attempts

---

## Phase 4: User Story 2 - Admin Promo Creation (P1)

**User Story**: L'équipe marketing lance une campagne Saint-Valentin avec code 25% réduction (plafonnée 40€) sur massages duo, valable 01-14 février, max 200 utilisations.

**Why P1**: Sans interface admin, impossible d'utiliser le système. Critique pour autonomie marketing.

**Independent Test**: Créer code via interface admin, vérifier qu'il apparaît dans liste, tenter de l'utiliser côté client.

**Prerequisites**: Phase 2 complete (does NOT depend on US1)

**Deliverable**: Admins can create, list, edit, and manage promo codes.

**Tasks**:

- [ ] T026 [US2] Create usePromoCodeMutations hook at `hooks/usePromoCodeMutations.ts` with create, update, delete, toggle mutations
- [ ] T027 [US2] Install shadcn/ui form components: `npx shadcn@latest add form select switch textarea calendar`
- [ ] T028 [US2] Create PromoCodeForm component at `components/promo-codes/PromoCodeForm.tsx` using react-hook-form + Zod validation
- [ ] T029 [US2] Implement form fields: code (Input), description (Textarea), discount_type (Select), discount_value (Input number)
- [ ] T030 [US2] Implement form fields: max_discount_amount (Input), valid_from/until (Calendar), max_uses (Input)
- [ ] T031 [US2] Implement form fields: max_uses_per_user (Input), first_booking_only (Switch), min_order_amount (Input)
- [ ] T032 [US2] Implement form fields: specific_services (Multi-select), specific_categories (Multi-select), is_active (Switch)
- [ ] T033 [US2] Add form validation: code uniqueness check, discount_value ≤ 100 for percentage, valid_until > valid_from
- [ ] T034 [US2] Create promo code creation page at `app/(admin)/promotions/new/page.tsx` with PromoCodeForm
- [ ] T035 [US2] Create usePromoCodes hook at `hooks/usePromoCodes.ts` to fetch paginated list with filters
- [ ] T036 [US2] Create PromoCodeList component at `components/promo-codes/PromoCodeList.tsx` using shadcn/ui Table
- [ ] T037 [US2] Create PromoCodeFilters component at `components/promo-codes/PromoCodeFilters.tsx` with status/type filters
- [ ] T038 [US2] Create promo codes list page at `app/(admin)/promotions/page.tsx` with PromoCodeList + filters
- [ ] T039 [US2] Add action buttons to list: Edit (opens edit page), Toggle active (optimistic update), Delete (with confirmation)
- [ ] T040 [US2] Create promo code edit page at `app/(admin)/promotions/[id]/edit/page.tsx` pre-filled with existing data

**Acceptance Criteria**:
- ✅ Admin can create code "VALENTIN25" with all restrictions
- ✅ Form validates: code uniqueness, percentage ≤ 100%, dates coherent
- ✅ Created code appears in list immediately (optimistic update)
- ✅ Admin can filter list by active/inactive, type percentage/fixed
- ✅ Admin can toggle code active/inactive with one click
- ✅ Admin can edit code (only if uses_count = 0)
- ✅ Admin cannot delete code with uses_count > 0

---

## Phase 5: User Story 3 - Contractor Transparency (P2)

**User Story**: Prestataire consulte transactions et voit transparence commission calculée sur prix original malgré code promo client.

**Why P2**: Essentiel pour confiance prestataires. Critique pour satisfaction.

**Independent Test**: Créer réservation avec code promo, vérifier dashboard prestataire affiche commission sur montant original.

**Prerequisites**: US1 complete (needs booking with promo)

**Deliverable**: Contractors see promo info in transactions with commission calculated on original amount.

**Tasks**:

- [ ] T041 [US3] Create TransactionPromoInfo component at `components/contractor/TransactionPromoInfo.tsx` to display promo details
- [ ] T042 [US3] Update contractor transaction detail page at `app/(contractor)/dashboard/transactions/[id]/page.tsx` to fetch and display promo info
- [ ] T043 [US3] Query contractor_transaction_details view with promo columns (service_amount_original, promo_code, promo_discount_amount)
- [ ] T044 [US3] Display breakdown: Prix original (€120), Code promo (BIENVENUE20), Réduction client (-€24), Montant payé (€96), Commission calculée sur €120
- [ ] T045 [US3] Add info tooltip/badge: "Votre commission est toujours calculée sur le prix original. La réduction est prise en charge par la plateforme."
- [ ] T046 [US3] Add filter to contractor transactions list: "Avec code promo uniquement" checkbox
- [ ] T047 [US3] Display promo badge in transactions list for bookings with promo_code_id != null
- [ ] T048 [US3] Update email template for contractor booking notification at `lib/email/templates/contractor-booking-notification.tsx` to include promo transparency note

**Acceptance Criteria**:
- ✅ Contractor opens booking detail with promo applied
- ✅ Sees: Original €120, Client promo -€24, Client paid €96
- ✅ Sees: Commission calculated on €120 (not €96) with clear explanation
- ✅ Contractor can filter transactions to show only those with promos
- ✅ Email notification explains commission calculation when promo used

---

## Phase 6: User Story 4 - Admin Analytics (P2)

**User Story**: Équipe marketing évalue performance codes promo: utilisations, coût plateforme, CA généré, ROI.

**Why P2**: Nécessaire pour optimiser budgets marketing. Important mais pas bloquant lancement.

**Independent Test**: Créer plusieurs codes, simuler utilisations, vérifier KPIs affichés correctement.

**Prerequisites**: US2 complete (needs promo codes created)

**Deliverable**: Admins can view analytics dashboard with KPIs, charts, and export CSV.

**Tasks**:

- [ ] T049 [US4] Create usePromoAnalytics hook at `hooks/usePromoAnalytics.ts` to fetch analytics data with date range
- [ ] T050 [US4] Create get_promo_analytics() SQL function in Supabase (if not exists) to calculate KPIs
- [ ] T051 [US4] Create PromoCodeAnalytics component at `components/promo-codes/PromoCodeAnalytics.tsx` with KPI cards
- [ ] T052 [US4] Display KPIs: Codes actifs, Utilisations totales, Coût total plateforme, CA généré, ROI %
- [ ] T053 [US4] Create PromoCodeChart component at `components/promo-codes/PromoCodeChart.tsx` using Recharts LineChart
- [ ] T054 [US4] Implement date range picker using shadcn/ui Calendar for analytics filtering
- [ ] T055 [US4] Create PromoCodeTopCodes component at `components/promo-codes/PromoCodeTopCodes.tsx` with sortable Table
- [ ] T056 [US4] Display top codes table: Code, Utilisations, Coût total, Coût moyen, Taux conversion (sortable columns)
- [ ] T057 [US4] Create analytics page at `app/(admin)/promotions/analytics/page.tsx` with PromoCodeAnalytics + Chart + TopCodes
- [ ] T058 [US4] Create CSV export API route at `app/api/promo/export/route.ts` with server-side streaming generation (UTF-8 BOM for Excel)

**Acceptance Criteria**:
- ✅ Admin sees analytics page with 5 KPI cards
- ✅ KPIs calculated correctly: ROI = ((revenue - cost) / cost) * 100
- ✅ Chart shows promo usage over time (configurable date range)
- ✅ Top codes table sortable by all columns
- ✅ CSV export downloads with correct data and French characters (UTF-8 BOM)
- ✅ Analytics refresh when date range changes

---

## Phase 7: User Story 5 - Error Messaging (P3)

**User Story**: Client tente code promo invalide (expiré, épuisé, montant min non atteint) et reçoit message d'erreur explicite.

**Why P3**: Améliore UX mais pas bloquant. Nice to have pour réduire frustration.

**Independent Test**: Créer différents scénarios d'erreur, vérifier messages clairs et actionnables.

**Prerequisites**: US1 complete (depends on PromoCodeInput component)

**Deliverable**: Clear, actionable error messages for all validation failure scenarios.

**Tasks**:

- [ ] T059 [US5] Enhance ErrorMessage component at `components/shared/ErrorMessage.tsx` with error type variants (error, warning, info)
- [ ] T060 [US5] Map SQL validation errors to French user-friendly messages in usePromoValidation hook
- [ ] T061 [US5] Add error message: "Ce code promo n'existe pas" for code not found
- [ ] T062 [US5] Add error message: "Ce code promo a expiré le {date}" for expired codes with formatted date
- [ ] T063 [US5] Add error message: "Ce code promo a atteint sa limite d'utilisation" for exhausted codes
- [ ] T064 [US5] Add error message: "Montant minimum requis: {min}€ (votre panier: {current}€)" for min order not met

**Acceptance Criteria**:
- ✅ Invalid code "FAKEPROMO" → "Ce code promo n'existe pas"
- ✅ Expired code "NOEL2024" → "Ce code promo a expiré le 31/12/2024"
- ✅ Exhausted code → "Ce code promo a atteint sa limite d'utilisation"
- ✅ Insufficient amount → "Montant minimum requis: 50€ (votre panier: 40€)"
- ✅ Already used by user → "Vous avez déjà utilisé ce code promo"
- ✅ Service not eligible → "Ce code promo n'est pas valable pour ce service"

---

## Phase 8: Security & Polish (Final)

**Goal**: Implement security measures (rate limiting, captcha, fraud detection) and final polish.

**Prerequisites**: All user stories (US1-US5) complete

**Deliverable**: Production-ready system with security hardening and polished UX.

**Tasks**:

- [ ] T065 Create Next.js middleware at `middleware.ts` with rate limiting logic (5 validations/min per user)
- [ ] T066 Implement captcha in PromoCodeInput: show hCaptcha after 5 failed validation attempts
- [ ] T067 Create fraud detection Edge Function at `supabase/functions/detect-fraud-pattern/index.ts`
- [ ] T068 Create promo_validation_log table via migration for fraud pattern detection
- [ ] T069 Implement pattern detection: alert admin if >20 validations/hour or >10 unique codes/hour
- [ ] T070 Create admin alerts system: admin_alerts table + real-time notifications
- [ ] T071 Update create-payment-intent Edge Function at `supabase/functions/create-payment-intent/index.ts` to include promo metadata
- [ ] T072 Add Stripe metadata: service_amount_original, promo_code_id, promo_code, promo_discount_amount, contractor_commission_base
- [ ] T073 Create regularize-promo-commission Edge Function at `supabase/functions/regularize-promo-commission/index.ts` for audit
- [ ] T074 Add input sanitization for promo codes: trim, uppercase, alphanumeric only in all forms
- [ ] T075 Implement loading states and skeleton loaders for all async components (PromoCodeList, Analytics)
- [ ] T076 Add optimistic updates for all admin mutations (create, update, toggle, delete)

**Acceptance Criteria**:
- ✅ Rate limiting activates after 5 validations in 1 minute → 429 error
- ✅ Captcha appears after 5 failed attempts, required for subsequent validations
- ✅ Fraud detection logs all validation attempts to promo_validation_log table
- ✅ Admin receives alert when fraud pattern detected (>20 validations/hour)
- ✅ PaymentIntent includes all promo metadata for Stripe audit trail
- ✅ Input sanitization prevents SQL injection and ensures clean data
- ✅ All mutations have optimistic updates (instant UI feedback)

---

## Dependencies & Execution Order

### Critical Path (Sequential)

```
Phase 1 (Setup)
    ↓
Phase 2 (Foundational)
    ↓
    ├─→ US1 (Client Checkout) ──────────────┐
    │                                         ↓
    ├─→ US2 (Admin CRUD) ────────────────┐  US3 (Contractor)
    │                                     ↓       ↓
    │                                    US4    US5
    │                                   (Analytics) (Errors)
    │                                        ↓
    └────────────────────────────────→ Phase 8 (Security)
```

### Parallel Opportunities

**Phase 1 (Setup)**: Tasks T002-T008 are fully parallelizable (different files)

**Phase 2 (Foundational)**: Tasks T009-T010 can run in parallel with T011-T012

**User Stories Parallelization**:
- **US1 + US2 can run in parallel** (no dependencies between them)
- US3 depends on US1 (needs booking with promo)
- US4 depends on US2 (needs promo codes created)
- US5 depends on US1 (enhances PromoCodeInput)

**Within Each User Story**: Many tasks are parallelizable:
- US1: T014-T017 can all run in parallel (different files)
- US2: T027-T033 form field implementations can run in parallel
- US4: T051-T055 component implementations can run in parallel

### Suggested Sprint Breakdown

**Sprint 1 (Week 1)**: Setup + Foundational + US1
- Complete Phase 1 (Setup) - Day 1
- Complete Phase 2 (Foundational) - Day 2
- Complete US1 (Client Checkout) - Days 3-5
- **MVP Deliverable**: Clients can use promo codes at checkout

**Sprint 2 (Week 2-3)**: US2 (Admin CRUD)
- Complete all 15 tasks for US2
- **Deliverable**: Marketing team can create/manage promo codes

**Sprint 3 (Week 4)**: US3 + US4 (Contractor + Analytics)
- US3 (4h) - Days 1-2
- US4 (8h) - Days 3-5
- **Deliverable**: Contractors see transparency + Marketing sees ROI

**Sprint 4 (Week 5)**: US5 + Security + Polish
- US5 (2h) - Day 1
- Phase 8 (8h) - Days 2-5
- **Final Deliverable**: Production-ready promo system

---

## Testing Strategy

### Unit Tests (Optional - implement if time permits)

```typescript
// __tests__/components/promo-codes/PromoCodeInput.test.tsx
- ✅ Validates promo code on blur event
- ✅ Shows discount amount when valid
- ✅ Shows error message when invalid
- ✅ Debounces validation (500ms)
- ✅ Disables input during validation

// __tests__/hooks/usePromoValidation.test.ts
- ✅ Calls validate_promo_code RPC with correct params
- ✅ Returns validation result on success
- ✅ Handles error states correctly
- ✅ Applies rate limiting (gcTime: 0)

// __tests__/utils/promo-calculations.test.ts
- ✅ calculateDiscount() for percentage type
- ✅ calculateDiscount() for fixed_amount type
- ✅ calculateDiscount() respects max_discount_amount
- ✅ calculateROI() formula correct
```

### Integration Tests (Recommended)

```typescript
// __tests__/integration/promo-checkout-flow.test.ts
- ✅ Complete checkout flow with promo code
- ✅ Apply promo → validates → reduces price → payment succeeds
- ✅ Remove promo → price reverts → payment with full amount

// __tests__/integration/promo-admin-crud.test.ts
- ✅ Create promo code → appears in list → toggle active → edit
- ✅ Cannot edit code with uses_count > 0
- ✅ Cannot delete code with uses_count > 0

// __tests__/integration/promo-analytics.test.ts
- ✅ Create codes → simulate uses → verify KPIs calculated correctly
- ✅ Export CSV → verify data integrity and UTF-8 encoding
```

### Manual Test Scenarios (Critical for acceptance)

**US1 Acceptance Test**:
1. Navigate to checkout with €100 service
2. Enter code "BIENVENUE20"
3. Verify: "Vous économisez 20€" displayed
4. Click "Appliquer"
5. Verify: Original €100 strikethrough, Final €80 bold
6. Complete payment
7. Verify: Database has service_amount_original=100, promo_discount_amount=20

**US2 Acceptance Test**:
1. Login as admin → Navigate to Promotions → New
2. Fill form: VALENTIN25, 25%, max €40, category Massage, dates 01-14 Feb, max 200 uses
3. Click "Créer"
4. Verify: Code appears in list immediately
5. Client attempts to use VALENTIN25 → validates successfully
6. Admin toggles code inactive
7. Client attempts VALENTIN25 → "Ce code promo est inactif"

---

## Implementation Tips

### Code Organization

```
components/promo-codes/     # Feature-specific components
  ├── PromoCodeInput.tsx    # US1
  ├── PromoCodeApplied.tsx  # US1
  ├── PromoCodeForm.tsx     # US2
  ├── PromoCodeList.tsx     # US2
  ├── PromoCodeFilters.tsx  # US2
  ├── PromoCodeAnalytics.tsx # US4
  ├── PromoCodeChart.tsx    # US4
  └── PromoCodeTopCodes.tsx # US4

hooks/                      # Centralized business logic
  ├── usePromoValidation.ts        # US1
  ├── usePromoCodeMutations.ts     # US2
  ├── usePromoCodes.ts             # US2
  ├── usePromoAnalytics.ts         # US4
  └── useRateLimiting.ts           # Phase 8

lib/utils/                  # Pure functions
  ├── promo-status.ts
  ├── promo-calculations.ts
  └── promo-formatting.ts
```

### Performance Optimizations

- **TanStack Query caching**: Set gcTime=0 for validation (always fresh), use default caching for list/analytics
- **Debouncing**: 500ms for validation input to reduce API calls
- **Optimistic updates**: All admin mutations for instant feedback
- **Pagination**: Admin list with limit=50, load more on scroll
- **Lazy loading**: Analytics charts only load when tab visible

### Common Pitfalls to Avoid

1. **Don't cache validation results** - Always validate fresh (uses_count changes rapidly)
2. **Don't forget UTF-8 BOM** - CSV export needs BOM for Excel French characters
3. **Don't validate on onChange** - Use onBlur + debounce to reduce API spam
4. **Don't calculate commission client-side** - Trust backend views (contractor_financial_summary)
5. **Don't skip input sanitization** - Always trim, uppercase, and validate alphanumeric

---

## Rollout Strategy

### Phase 1: Internal Testing (MVP - US1 only)
- Deploy US1 to staging
- Test with internal team using test promo codes
- Verify payment flow works end-to-end
- Monitor for errors/performance issues

### Phase 2: Admin Tools (US2)
- Deploy US2 to production
- Train marketing team on promo code creation
- Create initial promo codes for launch campaign

### Phase 3: Contractor Transparency (US3)
- Deploy US3 to production
- Communicate to contractors about promo system
- Monitor support tickets for confusion

### Phase 4: Analytics & Optimization (US4 + US5)
- Deploy US4 + US5 to production
- Marketing team monitors ROI
- Iterate on error messages based on user feedback

### Phase 5: Security Hardening (Phase 8)
- Deploy security features (rate limiting, captcha, fraud detection)
- Monitor for fraud attempts
- Fine-tune thresholds based on real usage

---

## Success Metrics (Post-Launch)

Track these metrics to validate implementation success:

| Metric | Target | Measurement |
|--------|--------|-------------|
| Promo adoption rate | 15% of bookings use promo within 1 month | Query: promo_code_id IS NOT NULL |
| Conversion rate with promo | >25% (vs <20% without) | A/B test: with/without promo codes |
| ROI | >400% (4€ CA per 1€ cost) | Formula: (revenue - cost) / cost * 100 |
| CAC via promos | <20€ per new client | Cost per first booking with promo |
| Validation speed | <500ms for 95% of requests | p95 latency from validate_promo_code() |
| Contractor satisfaction | >90% understand commission calculation | Quarterly survey |
| Support tickets | <2% of promo uses result in tickets | Tickets tagged "promo code" |
| Error rate | <1% validation errors (excluding user errors) | Monitor API error logs |

---

**Last Updated**: 2025-11-07
**Status**: ✅ Tasks Ready - Begin Implementation with Phase 1 (Setup)
**Next Action**: Execute tasks T001-T008 to complete infrastructure setup
