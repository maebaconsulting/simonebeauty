# Tasks: Parcours de Réservation Complet

**Feature**: Complete Booking Flow
**Branch**: `003-booking-flow`
**Input**: Design documents from `/specs/003-booking-flow/`
**Prerequisites**: plan.md, spec.md, data-model.md, research.md, contracts/

**Organization**: Tasks are grouped by user story to enable independent implementation and testing of each story.

## Total Tasks: 189

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (e.g., US1, US2, US3)
- Include exact file paths in descriptions

---

## Phase 1: Setup & Infrastructure (P0)

**Purpose**: Project initialization, environment setup, and third-party integrations

- [ ] T001 [P] Initialize Google Cloud Project and enable Google Maps API (Places, Geocoding, Distance Matrix)
- [ ] T002 [P] Configure Google Maps API keys with domain/IP restrictions in .env.local
- [ ] T003 [P] Initialize Stripe account and configure webhook endpoints for booking-flow
- [ ] T004 [P] Add Stripe API keys (test and production) to .env.local
- [ ] T005 [P] Install Google Maps dependencies: @react-google-maps/api in package.json
- [ ] T006 [P] Install Stripe dependencies: @stripe/stripe-js, @stripe/react-stripe-js in package.json
- [ ] T007 [P] Install geospatial dependencies: @turf/turf, @turf/boolean-point-in-polygon in package.json
- [ ] T008 [P] Install form dependencies: react-hook-form, zod, @hookform/resolvers in package.json
- [ ] T009 [P] Create environment variables documentation in specs/003-booking-flow/quickstart.md
- [ ] T010 [P] Configure TanStack Query client in lib/query-client.ts with caching strategies

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Core infrastructure that MUST be complete before ANY user story can be implemented

**CRITICAL**: No user story work can begin until this phase is complete

### Database Schema & Migrations

- [ ] T011 Create services table migration in supabase/migrations/20250107_100_create_services.sql
- [ ] T012 Create service_zones table with PostGIS support in supabase/migrations/20250107_101_create_service_zones.sql
- [ ] T013 Create client_addresses table in supabase/migrations/20250107_102_create_client_addresses.sql
- [ ] T014 Create promo_codes table in supabase/migrations/20250107_103_create_promo_codes.sql
- [ ] T015 Create gift_cards table in supabase/migrations/20250107_104_create_gift_cards.sql
- [ ] T016 Create booking_sessions table in supabase/migrations/20250107_105_create_booking_sessions.sql
- [ ] T017 Extend appointment_bookings table with booking flow columns in supabase/migrations/20250107_106_extend_appointment_bookings.sql
- [ ] T018 Create promo_code_usage table in supabase/migrations/20250107_107_create_promo_code_usage.sql
- [ ] T019 Create gift_card_transactions table in supabase/migrations/20250107_108_create_gift_card_transactions.sql
- [ ] T020 Create availability_notification_requests table in supabase/migrations/20250107_109_create_availability_notifications.sql
- [ ] T021 Create database views (booking_conversion_funnel, promo_code_performance, gift_card_summary) in supabase/migrations/20250107_110_create_booking_views.sql
- [ ] T022 Create seed data for services and service_zones in supabase/migrations/20250107_111_seed_data.sql

### Database Functions & Triggers

- [ ] T023 [P] Create ensure_single_default_address trigger function in supabase/migrations/20250107_102_create_client_addresses.sql
- [ ] T024 [P] Create update_gift_card_balance trigger function in supabase/migrations/20250107_108_create_gift_card_transactions.sql
- [ ] T025 [P] Create increment_promo_code_usage trigger function in supabase/migrations/20250107_107_create_promo_code_usage.sql
- [ ] T026 [P] Create refresh_session_expiration trigger function in supabase/migrations/20250107_105_create_booking_sessions.sql

### RLS Policies

- [ ] T027 [P] Enable RLS and create policies for services table in supabase/migrations/20250107_100_create_services.sql
- [ ] T028 [P] Enable RLS and create policies for service_zones table in supabase/migrations/20250107_101_create_service_zones.sql
- [ ] T029 [P] Enable RLS and create policies for client_addresses table in supabase/migrations/20250107_102_create_client_addresses.sql
- [ ] T030 [P] Enable RLS and create policies for booking_sessions table in supabase/migrations/20250107_105_create_booking_sessions.sql
- [ ] T031 [P] Enable RLS and create policies for promo_codes table in supabase/migrations/20250107_103_create_promo_codes.sql
- [ ] T032 [P] Enable RLS and create policies for gift_cards table in supabase/migrations/20250107_104_create_gift_cards.sql
- [ ] T033 [P] Enable RLS and create policies for promo_code_usage table in supabase/migrations/20250107_107_create_promo_code_usage.sql
- [ ] T034 [P] Enable RLS and create policies for gift_card_transactions table in supabase/migrations/20250107_108_create_gift_card_transactions.sql
- [ ] T035 [P] Enable RLS and create policies for availability_notification_requests table in supabase/migrations/20250107_109_create_availability_notifications.sql

### TypeScript Types & Schemas

- [ ] T036 [P] Create Service type and Zod schema in lib/types/service.ts
- [ ] T037 [P] Create ServiceZone type and Zod schema in lib/types/service-zone.ts
- [ ] T038 [P] Create ClientAddress type and Zod schema in lib/types/client-address.ts
- [ ] T039 [P] Create BookingSession type and Zod schema in lib/types/booking-session.ts
- [ ] T040 [P] Create PromoCode type and Zod schema in lib/types/promo-code.ts
- [ ] T041 [P] Create GiftCard type and Zod schema in lib/types/gift-card.ts
- [ ] T042 [P] Create AppointmentBooking extended type in lib/types/appointment-booking.ts
- [ ] T043 [P] Create TimeSlot type and Zod schema in lib/types/time-slot.ts
- [ ] T044 [P] Create PricingBreakdown type in lib/types/pricing.ts

### Shared Utilities

- [ ] T045 [P] Create pricing calculator utility in utils/pricing-calculator.ts
- [ ] T046 [P] Create service zone validator with Turf.js in utils/service-zone-validator.ts
- [ ] T047 [P] Create contractor assignment algorithm in utils/contractor-assignment.ts
- [ ] T048 [P] Create slug redirect handler in utils/slug-redirect.ts
- [ ] T049 [P] Create session management utility in utils/session-manager.ts
- [ ] T050 [P] Create date/time formatting utilities in utils/date-helpers.ts

### Supabase Client Configuration

- [ ] T051 Create Supabase client for server components in lib/supabase/server.ts
- [ ] T052 Create Supabase client for client components in lib/supabase/client.ts
- [ ] T053 Create Supabase Edge Function helpers in lib/supabase/edge-functions.ts

**Checkpoint**: Foundation ready - user story implementation can now begin in parallel

---

## Phase 3: US1 - Service Catalog & Address Management (Priority: P1) - MVP

**Goal**: Client can browse services, select one, and enter/select an address (with default pre-fill, Google Places autocomplete, zone validation)

**Independent Test**: Navigate to service catalog, select a service, verify default address is pre-filled, change address using autocomplete, and validate zone coverage

### Models & Data Access for US1

- [ ] T054 [P] [US1] Create Service repository with CRUD operations in lib/repositories/service-repository.ts
- [ ] T055 [P] [US1] Create ServiceZone repository with geospatial queries in lib/repositories/service-zone-repository.ts
- [ ] T056 [P] [US1] Create ClientAddress repository with default address handling in lib/repositories/client-address-repository.ts

### Edge Functions for US1

- [ ] T057 [US1] Implement validate-service-zone Edge Function in supabase/functions/validate-service-zone/index.ts
- [ ] T058 [US1] Add Zod validation schemas for validate-service-zone request/response
- [ ] T059 [US1] Implement rate limiting (20 req/min) for validate-service-zone Edge Function
- [ ] T060 [US1] Add error handling and logging for validate-service-zone Edge Function

### UI Components for US1

- [ ] T061 [P] [US1] Create ServiceCard component in components/booking/ServiceCard.tsx
- [ ] T062 [P] [US1] Create ServiceSelector component with category filtering in components/booking/ServiceSelector.tsx
- [ ] T063 [US1] Create AddressDisplay component in components/booking/AddressSelector/AddressDisplay.tsx
- [ ] T064 [US1] Create SavedAddressList component in components/booking/AddressSelector/SavedAddressList.tsx
- [ ] T065 [US1] Create AddressAutocomplete component with Google Places in components/booking/AddressSelector/AddressAutocomplete.tsx
- [ ] T066 [US1] Create AddressForm component with save option in components/booking/AddressSelector/AddressForm.tsx
- [ ] T067 [US1] Create AddressSelector main component in components/booking/AddressSelector.tsx
- [ ] T068 [US1] Create OutOfZoneMessage component with notification signup in components/booking/OutOfZoneMessage.tsx

### Custom Hooks for US1

- [ ] T069 [P] [US1] Create useAddressAutocomplete hook in hooks/useAddressAutocomplete.ts
- [ ] T070 [P] [US1] Create useServiceZoneValidation hook in hooks/useServiceZoneValidation.ts
- [ ] T071 [P] [US1] Create useClientAddresses hook with TanStack Query in hooks/useClientAddresses.ts

### Pages & Routes for US1

- [ ] T072 [US1] Create service catalog page in app/services/page.tsx
- [ ] T073 [US1] Create service detail page in app/services/[slug]/page.tsx
- [ ] T074 [US1] Create booking address step page in app/booking/address/page.tsx
- [ ] T075 [US1] Implement service-to-booking navigation flow with session initialization

### Integration & Testing for US1

- [ ] T076 [US1] Integrate Google Places API with error handling and fallback
- [ ] T077 [US1] Test default address pre-fill on address step load
- [ ] T078 [US1] Test address autocomplete with 3-character minimum
- [ ] T079 [US1] Test service zone validation with in-zone and out-of-zone addresses
- [ ] T080 [US1] Test save new address functionality with optional checkbox

**Checkpoint**: US1 complete - service selection and address management fully functional

---

## Phase 4: US2 - Time Slot Selection & Availability (Priority: P1) - MVP

**Goal**: Client selects an available time slot from an interactive calendar showing contractor availability

**Independent Test**: After selecting service and address, verify calendar displays available slots, slots load in <3s, and selection proceeds to next step

### Edge Functions for US2

- [ ] T081 [US2] Implement get-available-slots Edge Function in supabase/functions/get-available-slots/index.ts
- [ ] T082 [US2] Add integration with spec 002 availability algorithm in get-available-slots
- [ ] T083 [US2] Implement contractor filtering by service and location in get-available-slots
- [ ] T084 [US2] Add slot deduplication and sorting logic in get-available-slots
- [ ] T085 [US2] Add Zod validation schemas for get-available-slots request/response
- [ ] T086 [US2] Implement caching strategy (1-minute TTL) for get-available-slots
- [ ] T087 [US2] Add performance monitoring (<3s response time target) for get-available-slots
- [ ] T088 [US2] Implement verify-slot-availability Edge Function for pre-payment check in supabase/functions/verify-slot-availability/index.ts

### Contractor Assignment for US2

- [ ] T089 [US2] Implement weighted scoring algorithm in utils/contractor-assignment.ts
- [ ] T090 [US2] Add distance calculation using Google Distance Matrix API in utils/contractor-assignment.ts
- [ ] T091 [US2] Add workload balancing logic in utils/contractor-assignment.ts
- [ ] T092 [US2] Add specialty matching logic using contractor_services table from spec 007

### UI Components for US2

- [ ] T093 [P] [US2] Create Calendar component with date navigation in components/booking/SlotPicker/Calendar.tsx
- [ ] T094 [P] [US2] Create TimeSlotGrid component in components/booking/SlotPicker/TimeSlotGrid.tsx
- [ ] T095 [P] [US2] Create TimeSlotCard component in components/booking/SlotPicker/TimeSlotCard.tsx
- [ ] T096 [US2] Create SlotPicker main component in components/booking/SlotPicker.tsx
- [ ] T097 [US2] Create NoSlotsAvailable component with alternative suggestions in components/booking/NoSlotsAvailable.tsx
- [ ] T098 [US2] Create SlotLoadingSkeleton component in components/booking/SlotLoadingSkeleton.tsx

### Custom Hooks for US2

- [ ] T099 [P] [US2] Create useSlotAvailability hook with TanStack Query in hooks/useSlotAvailability.ts
- [ ] T100 [P] [US2] Create useContractorAssignment hook in hooks/useContractorAssignment.ts

### Pages & Routes for US2

- [ ] T101 [US2] Create booking slot selection page in app/booking/slot/page.tsx
- [ ] T102 [US2] Implement slot-to-payment navigation flow with contractor assignment

### Integration & Testing for US2

- [ ] T103 [US2] Test slot availability API with mock data from spec 002
- [ ] T104 [US2] Test calendar renders 30-day horizon correctly
- [ ] T105 [US2] Test slot selection updates booking session
- [ ] T106 [US2] Test contractor assignment algorithm with multiple contractors
- [ ] T107 [US2] Test slot availability verification before payment

**Checkpoint**: US2 complete - time slot selection fully functional

---

## Phase 5: US3 - Contractor Selection (Priority: P2)

**Goal**: Client can view assigned contractor and optionally select alternative contractors

**Independent Test**: After slot selection, verify contractor profile displays, alternative contractors can be viewed, and contractor change works

### UI Components for US3

- [ ] T108 [P] [US3] Create ContractorCard component with profile info in components/booking/ContractorCard.tsx
- [ ] T109 [P] [US3] Create ContractorRating component in components/booking/ContractorRating.tsx
- [ ] T110 [US3] Create ContractorAssignment component in components/booking/ContractorAssignment.tsx
- [ ] T111 [US3] Create AlternativeContractorsList component in components/booking/AlternativeContractorsList.tsx

### Custom Hooks for US3

- [ ] T112 [P] [US3] Create useContractor hook for fetching contractor details in hooks/useContractor.ts
- [ ] T113 [P] [US3] Create useAlternativeContractors hook in hooks/useAlternativeContractors.ts

### Integration for US3

- [ ] T114 [US3] Integrate contractor assignment into slot selection flow
- [ ] T115 [US3] Add contractor change functionality to booking session
- [ ] T116 [US3] Test contractor profile display with ratings and specialties
- [ ] T117 [US3] Test alternative contractors list with up to 3 alternatives

**Checkpoint**: US3 complete - contractor selection functional

---

## Phase 6: US4 - Promo Code Application (Priority: P2)

**Goal**: Client can apply promo codes with validation and real-time discount calculation

**Independent Test**: Enter a valid promo code, verify discount applies correctly, test invalid/expired codes show appropriate errors

### Edge Functions for US4

- [ ] T118 [US4] Implement validate-promo-code Edge Function in supabase/functions/validate-promo-code/index.ts
- [ ] T119 [US4] Add promo code existence and active status check
- [ ] T120 [US4] Add validity date range validation
- [ ] T121 [US4] Add minimum purchase amount validation
- [ ] T122 [US4] Add usage limit (global and per-user) validation
- [ ] T123 [US4] Add service applicability validation
- [ ] T124 [US4] Add first booking only validation
- [ ] T125 [US4] Add discount calculation (percentage and fixed_amount)
- [ ] T126 [US4] Add maximum discount amount enforcement
- [ ] T127 [US4] Add Zod validation schemas for validate-promo-code
- [ ] T128 [US4] Implement rate limiting (10 req/min) for validate-promo-code
- [ ] T129 [US4] Add error handling with user-friendly messages

### UI Components for US4

- [ ] T130 [P] [US4] Create PromoCodeInput component in components/booking/PromoCodeInput.tsx
- [ ] T131 [P] [US4] Create PromoCodeBadge component showing applied discount in components/booking/PromoCodeBadge.tsx

### Custom Hooks for US4

- [ ] T132 [US4] Create usePromoCode hook with debounced validation in hooks/usePromoCode.ts

### Integration for US4

- [ ] T133 [US4] Integrate promo code input into pricing summary
- [ ] T134 [US4] Update booking session with promo code details
- [ ] T135 [US4] Test promo code validation with various scenarios (valid, expired, minimum purchase, usage limit)
- [ ] T136 [US4] Test promo code removal and re-application

**Checkpoint**: US4 complete - promo code application functional

---

## Phase 7: US5 - Gift Card Application (Priority: P2)

**Goal**: Client can apply gift card balance with validation and real-time balance deduction

**Independent Test**: Enter a valid gift card code, verify balance applies correctly, test partial balance usage

### Edge Functions for US5

- [ ] T137 [US5] Implement validate-gift-card Edge Function in supabase/functions/validate-gift-card/index.ts
- [ ] T138 [US5] Add gift card existence and active status check
- [ ] T139 [US5] Add validity date range validation
- [ ] T140 [US5] Add balance availability check
- [ ] T141 [US5] Add assigned_to user verification
- [ ] T142 [US5] Add balance calculation (full or partial usage)
- [ ] T143 [US5] Add Zod validation schemas for validate-gift-card
- [ ] T144 [US5] Implement rate limiting (10 req/min) for validate-gift-card
- [ ] T145 [US5] Add error handling with user-friendly messages

### UI Components for US5

- [ ] T146 [P] [US5] Create GiftCardInput component in components/booking/GiftCardInput.tsx
- [ ] T147 [P] [US5] Create GiftCardBadge component showing applied balance in components/booking/GiftCardBadge.tsx

### Custom Hooks for US5

- [ ] T148 [US5] Create useGiftCard hook with debounced validation in hooks/useGiftCard.ts

### Integration for US5

- [ ] T149 [US5] Integrate gift card input into pricing summary
- [ ] T150 [US5] Update booking session with gift card details
- [ ] T151 [US5] Implement order of application (promo first, then gift card) in pricing calculator
- [ ] T152 [US5] Test gift card validation with various scenarios (valid, expired, insufficient balance)
- [ ] T153 [US5] Test combined promo code + gift card application

**Checkpoint**: US5 complete - gift card application functional

---

## Phase 8: US6 - Payment & Booking Confirmation (Priority: P1) - MVP

**Goal**: Client completes payment via Stripe pre-authorization and receives booking confirmation

**Independent Test**: Submit payment with test card, verify pre-authorization succeeds, booking is created with correct status, and confirmation email is sent

### Edge Functions for US6

- [ ] T154 [US6] Implement create-booking-payment Edge Function in supabase/functions/create-booking-payment/index.ts
- [ ] T155 [US6] Add final price calculation with promo and gift card in create-booking-payment
- [ ] T156 [US6] Add Stripe PaymentIntent creation with capture_method: manual
- [ ] T157 [US6] Add booking creation in appointment_bookings table
- [ ] T158 [US6] Add promo_code_usage record creation if promo applied
- [ ] T159 [US6] Add gift_card_transaction record creation if gift card applied
- [ ] T160 [US6] Add contractor_slug_analytics conversion tracking if booked via slug
- [ ] T161 [US6] Add Zod validation schemas for create-booking-payment
- [ ] T162 [US6] Add error handling for payment failures
- [ ] T163 [US6] Implement capture-booking-payment Edge Function in supabase/functions/capture-booking-payment/index.ts
- [ ] T164 [US6] Add Stripe webhook handler in app/api/webhooks/stripe/route.ts

### UI Components for US6

- [ ] T165 [P] [US6] Create PricingSummary component in components/booking/PricingSummary.tsx
- [ ] T166 [P] [US6] Create PaymentForm component with Stripe Elements in components/booking/PaymentForm.tsx
- [ ] T167 [P] [US6] Create BookingConfirmation component in components/booking/BookingConfirmation.tsx
- [ ] T168 [US6] Create payment page in app/booking/payment/page.tsx
- [ ] T169 [US6] Create confirmation page in app/booking/confirmation/page.tsx

### Custom Hooks for US6

- [ ] T170 [US6] Create useBookingPayment hook in hooks/useBookingPayment.ts

### Integration & Testing for US6

- [ ] T171 [US6] Integrate Stripe Elements with payment form
- [ ] T172 [US6] Test pre-authorization with Stripe test cards
- [ ] T173 [US6] Test slot verification before payment
- [ ] T174 [US6] Test booking creation with all pricing components
- [ ] T175 [US6] Test promo_code_usage record creation
- [ ] T176 [US6] Test gift_card_transaction record creation
- [ ] T177 [US6] Test payment failure handling with retry logic
- [ ] T178 [US6] Test confirmation email sending (via Resend integration)

**Checkpoint**: US6 complete - payment and booking confirmation functional

---

## Phase 9: US7 - Booking Session Management (Priority: P1) - MVP

**Goal**: Booking session persists throughout flow with 30-minute expiration and automatic cleanup

**Independent Test**: Start booking, verify session persists across steps, wait 30 minutes and verify session expires

### Session Management

- [ ] T179 [P] [US7] Create booking session repository in lib/repositories/booking-session-repository.ts
- [ ] T180 [P] [US7] Implement session creation on service selection
- [ ] T181 [US7] Implement session update on address selection
- [ ] T182 [US7] Implement session update on slot selection
- [ ] T183 [US7] Implement session update on promo/gift card application
- [ ] T184 [US7] Implement session expiration refresh on activity

### Edge Functions for US7

- [ ] T185 [US7] Implement cleanup-expired-sessions Edge Function (cron) in supabase/functions/cleanup-expired-sessions/index.ts
- [ ] T186 [US7] Configure cron job to run every 5 minutes via Supabase

### Custom Hooks for US7

- [ ] T187 [US7] Create useBookingSession hook in hooks/useBookingSession.ts

### Integration & Testing for US7

- [ ] T188 [US7] Test session creation and persistence across booking flow
- [ ] T189 [US7] Test session expiration after 30 minutes
- [ ] T190 [US7] Test session cleanup cron job
- [ ] T191 [US7] Test session recovery on page refresh

**Checkpoint**: US7 complete - session management functional

---

## Phase 10: US8 - Contractor Slug Booking (Priority: P2)

**Goal**: Client can book directly via contractor personalized URL with pre-filtered services and availability

**Independent Test**: Access /book/:contractor_slug, verify contractor profile displays, services are filtered, and booking proceeds with locked contractor

### Slug Management

- [ ] T192 [P] [US8] Implement slug redirect check using contractor_slug_history from spec 007 in utils/slug-redirect.ts
- [ ] T193 [P] [US8] Implement slug analytics tracking using contractor_slug_analytics from spec 007

### UI Components for US8

- [ ] T194 [P] [US8] Create ContractorProfileHeader component in components/booking/ContractorProfileHeader.tsx
- [ ] T195 [P] [US8] Create ContractorUnavailablePage component in components/booking/ContractorUnavailablePage.tsx
- [ ] T196 [US8] Create contractor slug booking page in app/book/[slug]/page.tsx
- [ ] T197 [US8] Create custom 404 page for expired slugs in app/book/[slug]/not-found.tsx

### Integration & Testing for US8

- [ ] T198 [US8] Integrate contractor_services filtering from spec 007
- [ ] T199 [US8] Implement contractor_id storage in session (not slug)
- [ ] T200 [US8] Implement contractor lock (no change allowed) for slug bookings
- [ ] T201 [US8] Implement analytics entry creation on slug visit
- [ ] T202 [US8] Implement analytics conversion marking on booking completion
- [ ] T203 [US8] Test slug redirect for changed slugs (301 redirect within 30 days)
- [ ] T204 [US8] Test expired slug redirect (404 after 30 days)
- [ ] T205 [US8] Test invalid slug handling (404 with search suggestions)
- [ ] T206 [US8] Test inactive contractor handling (unavailable message)
- [ ] T207 [US8] Test pre-selected service via ?service= query parameter
- [ ] T208 [US8] Test contractor without availability (notification form)
- [ ] T209 [US8] Test complete booking flow via slug with conversion tracking

**Checkpoint**: US8 complete - contractor slug booking functional

---

## Phase 11: Polish & Cross-Cutting Concerns

**Purpose**: Improvements that affect multiple user stories

### Documentation

- [ ] T210 [P] Update quickstart.md with complete setup instructions in specs/003-booking-flow/quickstart.md
- [ ] T211 [P] Document API contracts in specs/003-booking-flow/contracts/
- [ ] T212 [P] Add inline code comments in French for all business logic
- [ ] T213 [P] Create deployment checklist in specs/003-booking-flow/deployment.md

### Performance Optimization

- [ ] T214 [P] Implement ISR caching (5 min) for service catalog pages
- [ ] T215 [P] Add React.lazy for heavy components (SlotPicker, PaymentForm)
- [ ] T216 [P] Optimize Google Maps script loading (load on-demand)
- [ ] T217 [P] Add debouncing (300ms) for address autocomplete
- [ ] T218 [P] Add debouncing (500ms) for promo code validation
- [ ] T219 [P] Verify all database indexes are created correctly
- [ ] T220 [P] Run Lighthouse performance audit (target >90 score)

### Error Handling & Logging

- [ ] T221 [P] Implement global error boundary for booking flow in app/booking/error.tsx
- [ ] T222 [P] Add comprehensive error logging for all Edge Functions
- [ ] T223 [P] Add user-friendly error messages for all failure scenarios
- [ ] T224 [P] Implement retry logic for transient failures (network, API)

### Security Hardening

- [ ] T225 [P] Verify all RLS policies are correctly implemented and tested
- [ ] T226 [P] Implement rate limiting for all Edge Functions
- [ ] T227 [P] Add input sanitization for all user inputs
- [ ] T228 [P] Verify Stripe webhook signature validation
- [ ] T229 [P] Add CSRF protection for all forms
- [ ] T230 [P] Verify Google Maps API key restrictions

### Testing & Validation

- [ ] T231 [P] Run end-to-end test for complete booking flow (service to confirmation)
- [ ] T232 [P] Test booking flow with all edge cases from spec.md
- [ ] T233 [P] Test concurrent bookings race condition handling
- [ ] T234 [P] Test session expiration during booking
- [ ] T235 [P] Test payment failure scenarios
- [ ] T236 [P] Test mobile responsiveness for all booking pages
- [ ] T237 [P] Verify accessibility (WCAG 2.1 AA) for all booking components
- [ ] T238 [P] Run quickstart.md validation with fresh environment

### Analytics & Monitoring

- [ ] T239 [P] Implement booking funnel analytics tracking
- [ ] T240 [P] Add performance monitoring for critical paths (<3s slot load, <2s payment)
- [ ] T241 [P] Set up alerts for booking failures and payment errors
- [ ] T242 [P] Verify contractor_slug_analytics tracking for conversions

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No dependencies - can start immediately
- **Foundational (Phase 2)**: Depends on Setup completion - BLOCKS all user stories
- **User Stories (Phase 3-10)**: All depend on Foundational phase completion
  - US1, US2, US6, US7 are MVP (P1) - must complete for minimum viable product
  - US3, US4, US5, US8 are enhancements (P2) - can be added incrementally
- **Polish (Phase 11)**: Depends on all desired user stories being complete

### User Story Dependencies

- **US1 (P1)**: Can start after Foundational - No dependencies on other stories
- **US2 (P1)**: Can start after Foundational - Integrates with US1 (address) but independently testable
- **US3 (P2)**: Can start after Foundational - Enhances US2 (slot selection) but optional
- **US4 (P2)**: Can start after Foundational - Adds to payment flow but optional
- **US5 (P2)**: Can start after Foundational - Adds to payment flow but optional
- **US6 (P1)**: Can start after Foundational - Integrates US1+US2+US4+US5 but independently testable
- **US7 (P1)**: Can start after Foundational - Supports all stories but can be tested independently
- **US8 (P2)**: Can start after Foundational - Uses US1+US2+US6 but has unique entry point

### Critical Path (MVP)

```
Setup (Phase 1)
  ↓
Foundational (Phase 2) ← BLOCKING
  ↓
US1 (Service + Address) ← MVP
  ↓
US2 (Time Slots) ← MVP
  ↓
US7 (Session Management) ← MVP
  ↓
US6 (Payment) ← MVP
  ↓
Polish (Phase 11)
```

### Parallel Opportunities

- All Setup tasks can run in parallel
- All Foundational database migrations can run in parallel (within correct order)
- All RLS policies (T027-T035) can run in parallel
- All TypeScript types (T036-T044) can run in parallel
- All shared utilities (T045-T050) can run in parallel
- Once Foundational complete, US1, US3, US4, US5, US7, US8 can start in parallel (if team capacity allows)
- Within each user story, tasks marked [P] can run in parallel
- All Polish tasks (T210-T242) can run in parallel

---

## Implementation Strategy

### MVP First (US1 + US2 + US6 + US7 Only)

1. Complete Phase 1: Setup (T001-T010)
2. Complete Phase 2: Foundational (T011-T053) - CRITICAL BLOCKING
3. Complete Phase 3: US1 - Service & Address (T054-T080)
4. Complete Phase 4: US2 - Time Slots (T081-T107)
5. Complete Phase 9: US7 - Session Management (T179-T191)
6. Complete Phase 8: US6 - Payment (T154-T178)
7. Complete Phase 11: Polish (minimum viable polish tasks)
8. STOP and VALIDATE: Test complete booking flow end-to-end
9. Deploy MVP and gather feedback

### Incremental Delivery

1. **Foundation** (Phase 1 + 2) → Database and infrastructure ready
2. **MVP** (US1 + US2 + US6 + US7) → Basic booking flow works → Deploy/Demo
3. **Enhancement 1** (US4 - Promo Codes) → Marketing capabilities → Deploy/Demo
4. **Enhancement 2** (US5 - Gift Cards) → Additional payment options → Deploy/Demo
5. **Enhancement 3** (US3 - Contractor Selection) → Improved UX → Deploy/Demo
6. **Enhancement 4** (US8 - Slug Booking) → Marketing and acquisition → Deploy/Demo
7. **Polish** (Phase 11) → Production-ready optimization → Final Deploy

### Parallel Team Strategy

With 2 developers:

1. **Together**: Complete Phase 1 (Setup) + Phase 2 (Foundational)
2. **Once Foundational complete**:
   - **Developer A**: US1 (Service & Address) → US2 (Time Slots)
   - **Developer B**: US7 (Session Management) → US6 (Payment)
3. **Integration**: Test US1+US2+US6+US7 together (MVP)
4. **Parallel enhancements**:
   - **Developer A**: US4 (Promo) → US5 (Gift Card)
   - **Developer B**: US3 (Contractor Selection) → US8 (Slug Booking)
5. **Together**: Phase 11 (Polish) and final testing

---

## Notes

- All table/column names in English (snake_case) per constitution
- All IDs use BIGINT (except auth.users UUID references) per constitution
- All status fields use VARCHAR + CHECK constraints (no ENUMs) per constitution
- All SQL comments in French for business context per constitution
- RLS enabled on ALL tables per constitution
- File/function names in English, code comments in French per constitution
- [P] tasks = different files, no dependencies, can run in parallel
- [Story] label maps task to specific user story for traceability
- Each user story should be independently completable and testable
- Commit after each task or logical group of related tasks
- Stop at any checkpoint to validate story independently
- Total estimated effort: 3-4 weeks for 1 senior full-stack developer
- Dependencies on spec 002 (availability algorithm) must be resolved before US2
- Dependencies on spec 007 (contractor_services, slug tables) must be resolved before US8
