# Implementation Tasks: Interface Prestataire Complète

**Feature Branch**: `007-contractor-interface` | **Date**: 2025-11-07
**Input**: Design artifacts from `/speckit.plan` workflow

## Task Organization

Tasks are organized by user story priority, with foundational work completing first. Each task follows the format:

```
- [ ] [TXX] [Priority] [Story] Description with file path
```

**Priority Levels**: P0 (blocking), P1 (MVP critical), P2 (important), P3 (nice-to-have)
**Story Codes**: US0-US7 (see spec.md), INFRA (infrastructure), CROSS (cross-cutting)

---

## Phase 1: Setup & Infrastructure (Blocking Prerequisites)

### Database Setup

- [X] [T001] [P0] [INFRA] Create migration 20250107000000_create_specialties.sql with table definition, indexes, RLS policies, and seed data from data-model.md lines 24-79 → `supabase/migrations/`
- [X] [T002] [P0] [INFRA] Create migration 20250107000001_create_contractor_applications.sql with table definition, indexes, RLS policies, and validation trigger from data-model.md lines 84-198 → `supabase/migrations/`
- [X] [T003] [P0] [INFRA] Create migration 20250107000002_create_contractor_onboarding_status.sql with table, computed columns, indexes, RLS, and completion trigger from data-model.md lines 202-290 → `supabase/migrations/`
- [X] [T004] [P0] [INFRA] Create migration 20250107000003_create_contractor_schedules.sql with table, indexes, RLS, and unique constraint from data-model.md lines 294-364 → `supabase/migrations/`
- [X] [T005] [P0] [INFRA] Create migration 20250107000004_create_contractor_unavailabilities.sql with table, indexes, RLS policies from data-model.md lines 368-432 → `supabase/migrations/`
- [X] [T006] [P0] [INFRA] Create migration 20250107000005_create_contractor_profiles.sql with table, junction table contractor_profile_specialties, indexes, RLS from data-model.md lines 510-622 → `supabase/migrations/`
- [X] [T007] [P0] [INFRA] Create migration 20250107000006_create_contractor_services.sql with table, indexes, RLS policies from data-model.md lines 840-903 → `supabase/migrations/`
- [X] [T008] [P0] [INFRA] Create migration 20250107000007_create_contractor_slug_history.sql with table, indexes, RLS, unique constraint from data-model.md lines 626-685 → `supabase/migrations/`
- [X] [T009] [P0] [INFRA] Create migration 20250107000008_create_contractor_slug_analytics.sql with table, indexes, RLS, and aggregated view contractor_slug_stats from data-model.md lines 689-776 → `supabase/migrations/`
- [X] [T010] [P0] [INFRA] Create migration 20250107000009_create_platform_config.sql with table, RLS, and seed data (forbidden_slugs, commission_default, slug_change_limit) from data-model.md lines 780-836 → `supabase/migrations/`
- [X] [T011] [P0] [INFRA] Create migration 20250107000010_create_booking_requests.sql with table, indexes, RLS policies from data-model.md lines 436-506 → `supabase/migrations/`
- [X] [T012] [P0] [INFRA] Create migration 20250107000011_create_service_action_logs.sql with table, indexes, RLS policies from data-model.md lines 1072-1127 → `supabase/migrations/`
- [X] [T013] [P0] [INFRA] Create migration 20250107000012_extend_contractors_table.sql with ALTER TABLE statements adding slug columns, commission settings, Stripe Connect fields, indexes, and triggers (generate_contractor_slug, check_slug_change_limit) from data-model.md lines 907-1038 → `supabase/migrations/`
- [X] [T014] [P0] [INFRA] Create migration 20250107000013_extend_bookings_table.sql with ALTER TABLE statements adding tip columns, stripe_fee_service, and updated status CHECK constraint from data-model.md lines 1042-1067 → `supabase/migrations/`
- [X] [T015] [P0] [INFRA] Create migration 20250107000014_create_financial_views.sql with contractor_financial_summary and contractor_transaction_details views including GRANT and RLS policies from data-model.md lines 1157-1264 → `supabase/migrations/`

### Supabase Storage Setup

- [X] [T016] [P0] [US0] Create Supabase Storage bucket "job-applications" with subdirectories (cv/, certifications/, portfolio/) and RLS policies for authenticated upload and admin read from research.md lines 172-194 → Execute via Supabase Dashboard or CLI
- [X] [T017] [P0] [US4] Create Supabase Storage bucket "contractor-portfolios" with RLS policies for public read and contractor write → Execute via Supabase Dashboard or CLI

### Environment Configuration

- [X] [T018] [P0] [INFRA] Add Stripe Connect environment variables (STRIPE_SECRET_KEY, STRIPE_CONNECT_CLIENT_ID, STRIPE_WEBHOOK_SECRET) to .env.local and document in quickstart.md → `.env.local`
- [X] [T019] [P0] [INFRA] Add frontend URL environment variable (NEXT_PUBLIC_SITE_URL) for Stripe Connect redirects → `.env.local`
- [X] [T020] [P0] [INFRA] Configure Resend API key (RESEND_API_KEY) for email notifications → `.env.local`

---

## Phase 2: User Story 0 - Onboarding Process (P1 - MVP Critical)

### Public Job Application Form (FR-000 to FR-021)

- [X] [T021] [P1] [US0] Create public job application page at app/rejoindre-simone/page.tsx with layout and SEO metadata → `app/rejoindre-simone/page.tsx`
- [X] [T022] [P1] [US0] Create Zod validation schemas for all 5 form steps (PersonalInfoSchema with contractor_type + split address fields, ProfessionalProfileSchema, AvailabilitySchema with calendar dates, MotivationSchema optional, DocumentsSchema) from research.md lines 196-207 → `lib/validations/contractor-application.ts`
- [X] [T023] [P1] [US0] Build multi-step form state machine hook useMultiStepForm with step navigation, form persistence, and progress tracking from research.md lines 45-79 → `lib/hooks/useMultiStepForm.ts`
- [X] [T024] [P1] [US0] Create ApplicationForm component with circular progress indicator (pills 1-5) and step navigation buttons → `components/contractor/ApplicationForm/ApplicationForm.tsx`
- [X] [T025] [P1] [US0] Build Step 1: Personal Info form (first_name, last_name, email, phone, contractor_type radio société/personnel, split address: street_address, city, postal_code, country select) with React Hook Form + Zod validation → `components/contractor/ApplicationForm/Step1PersonalInfo.tsx`
- [X] [T026] [P1] [US0] Build Step 2: Professional Profile form with dynamic specialty selection (watch profession field, filter specialties from database) from research.md lines 88-101 → `components/contractor/ApplicationForm/Step2ProfessionalProfile.tsx`
- [X] [T027] [P1] [US0] Build Step 3: Availability form (geographic zones multi-select, calendar-based date picker for available_dates, work frequency radio) → `components/contractor/ApplicationForm/Step3Availability.tsx`
- [X] [T028] [P1] [US0] Build Step 4: Motivation form with OPTIONAL textarea (min 100 chars validation if provided) and character counter → `components/contractor/ApplicationForm/Step4Motivation.tsx`
- [X] [T029] [P1] [US0] Build Step 5: Documents upload form with file input, validation (types, size 5MB), and upload to Supabase Storage using utility from research.md lines 136-167 → `components/contractor/ApplicationForm/Step5Documents.tsx`
- [X] [T030] [P1] [US0] Create file upload utility uploadFile(file, category) with client-side validation and Supabase Storage integration from research.md lines 136-167 → `lib/supabase/storage-utils.ts`
- [X] [T031] [P1] [US0] Create Edge Function submit-job-application.ts handling form submission, file path storage, backoffice task creation, and email notifications (candidate + admin) per FR-007 to FR-011 from job-application.yaml → `supabase/functions/submit-job-application/index.ts`
- [X] [T032] [P1] [US0] Add form submission success page with confirmation message and next steps explanation → `app/rejoindre-simone/success/page.tsx`

### Admin Job Application Review (FR-012 to FR-021)

- [X] [T033] [P1] [US0] Create admin applications list page at app/admin/contractors/applications/page.tsx with status filters (pending, interview_scheduled, approved, rejected) → `app/admin/contractors/applications/page.tsx`
- [X] [T034] [P1] [US0] Build ApplicationCard component displaying candidate info, documents, and action buttons (view details, schedule interview, approve, reject) → `components/admin/ApplicationCard.tsx`
- [X] [T035] [P1] [US0] Create admin application detail page at app/admin/contractors/applications/[id]/page.tsx with full candidate profile, document viewer, and comment section → `app/admin/contractors/applications/[id]/page.tsx`
- [X] [T036] [P1] [US0] Build interview scheduling modal with date/time picker and mode selection (video, phone, in_person) → `components/admin/ScheduleInterviewModal.tsx`
- [X] [T037] [P1] [US0] Create Edge Function schedule-interview.ts updating application status, sending calendar invite (ICS) to candidate per FR-016 from job-application.yaml → `supabase/functions/schedule-interview/index.ts`
- [X] [T038] [P1] [US0] Build approval modal with contractor account creation form (generates slug, creates auth.users entry, sends credentials email) → `components/admin/ApproveApplicationModal.tsx`
- [X] [T039] [P1] [US0] Create Edge Function approve-contractor-application.ts handling account creation, contractor_onboarding_status initialization, temp password email per FR-017-018 from contractor-onboarding.yaml → `supabase/functions/approve-contractor-application/index.ts`
- [X] [T040] [P1] [US0] Build rejection modal with required reason textarea (min 10 chars) → `components/admin/RejectApplicationModal.tsx`
- [X] [T041] [P1] [US0] Create Edge Function reject-application.ts updating status, archiving, and sending rejection email with reason per FR-019-020 from job-application.yaml → `supabase/functions/reject-application/index.ts`

### Contractor Onboarding Flow (FR-021)

- [X] [T042] [P1] [US0] Create contractor first login detection middleware checking contractor_onboarding_status.is_completed, redirecting incomplete onboarding to /contractor/onboarding → `middleware.ts`
- [X] [T043] [P1] [US0] Create onboarding wizard page at app/contractor/onboarding/page.tsx with progress steps (1. Schedule, 2. Stripe, 3. Profile) → `app/contractor/onboarding/page.tsx`
- [X] [T044] [P1] [US0] Build OnboardingWizard component with step indicator and completion percentage from contractor_onboarding_status → `components/contractor/OnboardingWizard/OnboardingWizard.tsx`
- [X] [T045] [P1] [US0] Build onboarding Step 1: Schedule configuration form (redirect to /contractor/planning with "onboarding mode" flag) → `components/contractor/OnboardingWizard/Step1Schedule.tsx`
- [X] [T046] [P1] [US0] Build onboarding Step 2: Stripe Connect button with redirect to Stripe onboarding, handle return and refresh URLs per research.md lines 236-273 → `components/contractor/OnboardingWizard/Step2StripeConnect.tsx`
- [X] [T047] [P1] [US0] Build onboarding Step 3: Profile completion form (bio, professional_title, years_of_experience, specialty selection) → `components/contractor/OnboardingWizard/Step3Profile.tsx`
- [X] [T048] [P1] [US0] Create Edge Function update-onboarding-step.ts handling individual step completion and updating contractor_onboarding_status booleans from contractor-onboarding.yaml → `supabase/functions/update-onboarding-step/index.ts`

---

## Phase 3: User Story 1 - Planning & Availability (P1 - MVP Critical)

### Schedule Configuration (FR-022)

- [X] [T049] [P1] [US1] Create contractor planning page at app/contractor/planning/page.tsx with weekly calendar view → `app/contractor/planning/page.tsx`
- [X] [T050] [P1] [US1] Build ScheduleEditor component with day-of-week grid (Monday-Sunday), time range inputs (start_time, end_time) per day from data-model.md lines 294-364 → `components/contractor/ScheduleEditor/ScheduleEditor.tsx`
- [X] [T051] [P1] [US1] Create schedule validation logic preventing overlapping time ranges for same day → `lib/validations/schedule-validation.ts`
- [X] [T052] [P1] [US1] Build TimeRangeInput component with time picker (9:00-18:00 format), validation (start < end) → `components/contractor/ScheduleEditor/TimeRangeInput.tsx`
- [X] [T053] [P1] [US1] Create Edge Function create-schedule-entry.ts handling contractor_schedules INSERT with validation per contractor-schedule.yaml → `supabase/functions/create-schedule-entry/index.ts`
- [X] [T054] [P1] [US1] Create Edge Function update-schedule-entry.ts handling contractor_schedules UPDATE per contractor-schedule.yaml → `supabase/functions/update-schedule-entry/index.ts`
- [X] [T055] [P1] [US1] Create Edge Function delete-schedule-entry.ts handling contractor_schedules soft delete (is_active = false) per contractor-schedule.yaml → `supabase/functions/delete-schedule-entry/index.ts`
- [X] [T056] [P1] [US1] Create Edge Function get-contractor-schedule.ts returning weekly schedule for contractor per contractor-schedule.yaml → `supabase/functions/get-contractor-schedule/index.ts`

### Unavailability Management (FR-022, FR-023)

- [X] [T057] [P1] [US1] Build UnavailabilityManager component with list of blocked time slots and "Add" button → `components/contractor/UnavailabilityManager/UnavailabilityManager.tsx`
- [X] [T058] [P1] [US1] Create AddUnavailabilityModal with date range picker, time picker, reason dropdown (vacation, personal, lunch_break, sick, other), and optional recurrence → `components/contractor/AddUnavailabilityModal.tsx`
- [X] [T059] [P1] [US1] Create Edge Function create-unavailability.ts handling contractor_unavailabilities INSERT with date validation per contractor-schedule.yaml → `supabase/functions/create-unavailability/index.ts`
- [X] [T060] [P1] [US1] Create Edge Function delete-unavailability.ts handling contractor_unavailabilities DELETE per contractor-schedule.yaml → `supabase/functions/delete-unavailability/index.ts`
- [X] [T061] [P1] [US1] Create Edge Function get-contractor-unavailabilities.ts returning list with date range filter per contractor-schedule.yaml → `supabase/functions/get-contractor-unavailabilities/index.ts`

### Planning Calendar View (FR-023, FR-024)

- [X] [T062] [P1] [US1] Build PlanningCalendar component with weekly view showing confirmed bookings and unavailabilities → `components/contractor/PlanningCalendar/PlanningCalendar.tsx`
- [X] [T063] [P1] [US1] Integrate Realtime subscription to appointment_bookings table for live updates when new bookings confirmed → `components/contractor/PlanningCalendar/usePlanningRealtime.ts`
- [X] [T064] [P1] [US1] Build BookingCard component for calendar displaying service name, client name, time, address, with color coding by status → `components/contractor/PlanningCalendar/BookingCard.tsx`
- [X] [T065] [P1] [US1] Create Edge Function get-weekly-planning.ts returning contractor schedule + bookings + unavailabilities + travel times for given week per contractor-schedule.yaml → `supabase/functions/get-weekly-planning/index.ts`
- [X] [T066] [P1] [US1] Implement travel time calculation using Google Distance Matrix API between consecutive bookings (FR-024) → `lib/google-maps/distance-matrix.ts`

---

## Phase 4: User Story 2 & 2.1 - Booking Management (P1 - MVP Critical)

### Pending Booking Requests (FR-025 to FR-029)

- [X] [T067] [P1] [US2] Create contractor reservations page at app/contractor/reservations/page.tsx with tabs: "Pending Requests", "Upcoming", "Past" → `app/contractor/reservations/page.tsx`
- [X] [T068] [P1] [US2] Build BookingRequestCard component displaying client info, service details, date/time, address, price, with Accept/Refuse buttons → `components/contractor/BookingRequestCard.tsx`
- [X] [T069] [P1] [US2] Create Edge Function get-pending-requests.ts returning booking_requests with status='pending' and not expired per contractor-bookings.yaml → `supabase/functions/get-pending-requests/index.ts`
- [X] [T070] [P1] [US2] Build AcceptBookingModal with confirmation message and Stripe payment capture warning → `components/contractor/AcceptBookingModal.tsx`
- [X] [T071] [P1] [US2] Create Edge Function accept-booking-request.ts handling: 1) Update booking_requests.status='accepted', 2) Capture Stripe PaymentIntent, 3) Update appointment_bookings.status='confirmed', 4) Send confirmation email to client per FR-026-027 from contractor-bookings.yaml → `supabase/functions/accept-booking-request/index.ts`
- [X] [T072] [P1] [US2] Build RefuseBookingModal with required reason textarea and optional message to client → `components/contractor/RefuseBookingModal.tsx`
- [X] [T073] [P1] [US2] Create Edge Function refuse-booking-request.ts handling: 1) Update booking_requests.status='refused', 2) Cancel Stripe PaymentIntent, 3) Send notification to client with reason per FR-028 from contractor-bookings.yaml → `supabase/functions/refuse-booking-request/index.ts`
- [X] [T074] [P1] [US2] Create cron Edge Function expire-pending-requests.ts running every hour, setting booking_requests.status='expired' where expires_at < NOW() and status='pending' per FR-029 → `supabase/functions/expire-pending-requests/index.ts`
- [X] [T075] [P1] [US2] Configure Supabase cron job to run expire-pending-requests function hourly → `supabase/functions/expire-pending-requests/cron.yaml`

### Mark Service Completed (FR-029a to FR-029e)

- [X] [T076] [P1] [US2.1] Add "Mark as Completed" button to BookingCard component for bookings with status='in_progress' → `components/contractor/BookingCard.tsx`
- [X] [T077] [P1] [US2.1] Create Edge Function mark-service-completed.ts handling: 1) Update appointment_bookings.status='completed_by_contractor', 2) Insert service_action_logs entry (action_type='completed_by_contractor', performed_by_type='contractor'), 3) Send notification to client per FR-029b-029d from contractor-bookings.yaml → `supabase/functions/mark-service-completed/index.ts`
- [X] [T078] [P1] [US2.1] Add "Awaiting Payment" section to contractor dashboard showing bookings with status='completed_by_contractor' with orange badge → `app/contractor/dashboard/page.tsx`
- [X] [T079] [P1] [US2.1] Create client-side notification when contractor marks service as completed with "Confirm Payment" and "Add Tip" buttons → Handle in existing client notification system

### Upcoming & Past Bookings

- [X] [T080] [P1] [US2] Create Edge Function get-contractor-bookings.ts with filters: status (confirmed, in_progress, completed_by_contractor, completed), date range, pagination per contractor-bookings.yaml → `supabase/functions/get-contractor-bookings/index.ts`
- [X] [T081] [P1] [US2] Build UpcomingBookingsList component with date grouping (Today, Tomorrow, This Week, Later) → `components/contractor/UpcomingBookingsList.tsx`
- [X] [T082] [P1] [US2] Build PastBookingsList component with infinite scroll pagination and status filters → `components/contractor/PastBookingsList.tsx`
- [X] [T083] [P1] [US2] Add booking detail modal with full information (client contact, service details, payment status, action logs) → `components/contractor/BookingDetailModal.tsx`

---

## Phase 5: User Story 5 - Stripe Connect (P1 - MVP Critical)

### Stripe Connect Setup (FR-034 to FR-036)

- [ ] [T084] [P1] [US5] Create contractor payments page at app/contractor/paiements/page.tsx showing Stripe Connect status and configuration button → `app/contractor/paiements/page.tsx`
- [ ] [T085] [P1] [US5] Build StripeConnectButton component with status indicator (not_started: primary CTA, pending: orange badge, completed: green checkmark) per FR-035 from research.md lines 220-273 → `components/contractor/StripeConnectButton.tsx`
- [ ] [T086] [P1] [US5] Create Edge Function create-stripe-connect-account.ts creating Stripe Express account and returning accountLink URL per research.md lines 236-273 from contractor-onboarding.yaml → `supabase/functions/create-stripe-connect-account/index.ts`
- [ ] [T087] [P1] [US5] Create Stripe Connect return page at app/contractor/stripe-return/page.tsx handling successful onboarding redirect → `app/contractor/stripe-return/page.tsx`
- [ ] [T088] [P1] [US5] Create Stripe Connect refresh page at app/contractor/stripe-refresh/page.tsx handling expired/failed onboarding with retry button → `app/contractor/stripe-refresh/page.tsx`
- [ ] [T089] [P1] [US5] Create Edge Function handle-stripe-webhooks.ts listening to account.updated events, updating contractors table fields (stripe_onboarding_status, stripe_charges_enabled, stripe_payouts_enabled) per research.md lines 277-300 → `supabase/functions/handle-stripe-webhooks/index.ts`
- [ ] [T090] [P1] [US5] Configure Stripe webhook endpoint in Stripe Dashboard pointing to Supabase Edge Function URL → Execute via Stripe Dashboard
- [ ] [T091] [P1] [US5] Add Stripe Connect verification check before accepting bookings: throw error if stripe_onboarding_status != 'completed' or stripe_charges_enabled = false per FR-036 from research.md lines 302-319 → Update accept-booking-request Edge Function

---

## Phase 6: User Story 3 - Financial Dashboard (P2 - Important)

### Revenue Dashboard (FR-030 to FR-033e)

- [ ] [T092] [P2] [US3] Create contractor financial dashboard page at app/contractor/revenus/page.tsx with three-column metrics layout → `app/contractor/revenus/page.tsx`
- [ ] [T093] [P2] [US3] Build FinancialDashboard component displaying three distinct amounts: "Revenue Services: X€ + Tips Received: Y€ = Total: Z€" from contractor_financial_summary view per FR-030 → `components/contractor/FinancialDashboard/FinancialDashboard.tsx`
- [ ] [T094] [P2] [US3] Create Edge Function get-financial-summary.ts querying contractor_financial_summary view for authenticated contractor per contractor-financials.yaml → `supabase/functions/get-financial-summary/index.ts`
- [ ] [T095] [P2] [US3] Build revenue chart component with monthly breakdown (last 6 months) showing services and tips as stacked bars → `components/contractor/FinancialDashboard/RevenueChart.tsx`
- [ ] [T096] [P2] [US3] Build TipsBreakdown component showing: tip rate percentage, average tip amount, total bookings with tips per FR-033c from contractor_financial_summary view → `components/contractor/TipsBreakdown.tsx`

### Transaction History (FR-031, FR-032)

- [ ] [T097] [P2] [US3] Build TransactionHistory component with date range filter, search, and pagination → `components/contractor/TransactionHistory/TransactionHistory.tsx`
- [ ] [T098] [P2] [US3] Create Edge Function get-transaction-history.ts querying contractor_transaction_details view with filters (date range, search) and pagination per contractor-financials.yaml → `supabase/functions/get-transaction-history/index.ts`
- [ ] [T099] [P2] [US3] Build TransactionRow component displaying itemized breakdown: "Service: 100€ - Commission 15€ - Frais Stripe 2.90€ = Net service: 82.10€ | Pourboire: 10€ - Frais Stripe 0.29€ = Net tip: 9.71€ | Total net: 91.81€" per FR-033b → `components/contractor/TransactionHistory/TransactionRow.tsx`
- [ ] [T100] [P2] [US3] Add transaction detail modal with full breakdown including contractor_pays_stripe_fees explanation per FR-033a → `components/contractor/TransactionDetailModal.tsx`
- [ ] [T101] [P2] [US3] Build CSV export button triggering Edge Function with date range parameters → `components/contractor/TransactionHistory/ExportButton.tsx`
- [ ] [T102] [P2] [US3] Create Edge Function export-financial-history.ts generating CSV with columns: Date, Client, Service, Montant Service Brut, Commission, Frais Stripe Service, Net Service, Pourboire, Frais Stripe Tip, Net Tip, Total Net per FR-032 from research.md lines 748-801 → `supabase/functions/export-financial-history/index.ts`

### Contract Terms Display (FR-033e)

- [ ] [T103] [P2] [US3] Create contractor contract page at app/contractor/contrat/page.tsx showing commission rate, stripe fees policy, and tip policy → `app/contractor/contrat/page.tsx`
- [ ] [T104] [P2] [US3] Display prominent notice: "Les pourboires sont transférés à 100% (après frais Stripe)" per FR-033e → `app/contractor/contrat/page.tsx`

### Tip Processing & Notifications (FR-033d)

- [ ] [T105] [P2] [US3] Create Edge Function process-tip.ts handling: 1) Calculate Stripe fee (always deducted from tip), 2) Create Stripe Transfer to contractor Connect account, 3) Update appointment_bookings tip columns, 4) Send notification to contractor per research.md lines 696-746 → `supabase/functions/process-tip/index.ts`
- [ ] [T106] [P2] [US3] Build tip notification component showing: "🎉 Vous avez reçu un pourboire de 15€ de [Client] pour le service du [Date]" per FR-033d → Handle in existing notification system
- [ ] [T107] [P2] [US3] Add real-time subscription to appointment_bookings.tip_amount updates for live notifications → `lib/hooks/useTipNotifications.ts`

---

## Phase 7: User Story 4 - Professional Profile (P2 - Important)

### Profile Editing (FR-037 to FR-039)

- [ ] [T108] [P2] [US4] Create contractor profile page at app/contractor/profil/page.tsx with tabs: "Info", "Portfolio", "Service Area" → `app/contractor/profil/page.tsx`
- [ ] [T109] [P2] [US4] Build ProfileInfoForm component with fields: bio (textarea, 500 char max), professional_title, years_of_experience, specialty multi-select → `components/contractor/ProfileInfoForm.tsx`
- [ ] [T110] [P2] [US4] Create Edge Function update-contractor-profile.ts handling contractor_profiles UPDATE per contractor-onboarding.yaml → `supabase/functions/update-contractor-profile/index.ts`
- [ ] [T111] [P2] [US4] Build PortfolioManager component with image upload (max 10 images), drag-drop reordering, and delete functionality → `components/contractor/PortfolioManager.tsx`
- [ ] [T112] [P2] [US4] Create portfolio image upload utility with validation (image types, 5MB max) and Supabase Storage integration to "contractor-portfolios" bucket → `lib/supabase/portfolio-upload.ts`
- [ ] [T113] [P2] [US4] Build ServiceAreaEditor component with address input (service_area_center), radius slider (5-50km), and postal code multi-select → `components/contractor/ServiceAreaEditor.tsx`
- [ ] [T114] [P2] [US4] Integrate Google Places API for address autocomplete in service_area_center field → `lib/google-maps/places-autocomplete.ts`
- [ ] [T115] [P2] [US4] Build CertificationManager component for uploading diplomas/certifications with admin verification badge display → `components/contractor/CertificationManager.tsx`

### Profile Completeness Tracking

- [ ] [T116] [P2] [US4] Calculate profile_completeness_percentage based on filled fields (bio, professional_title, portfolio_image_paths.length, certifications, service_area) and update contractor_profiles → Create database function
- [ ] [T117] [P2] [US4] Display profile completeness progress bar on contractor dashboard encouraging completion → `components/contractor/ProfileCompletenessBar.tsx`

---

## Phase 8: User Story 7 - Slug Management (P2 - Important)

### Slug Display & Copy (FR-046 to FR-048, FR-054)

- [ ] [T118] [P2] [US7] Create contractor slug page at app/contractor/profil/slug/page.tsx showing current slug, full URL, changes remaining, and modification button → `app/contractor/profil/slug/page.tsx`
- [ ] [T119] [P2] [US7] Build SlugDisplay component with: current slug badge, full URL display (simone.paris/book/[slug]), "Copy Link" button with clipboard API and toast feedback per FR-054 → `components/contractor/SlugDisplay.tsx`
- [ ] [T120] [P2] [US7] Display changes remaining counter from contractors.slug_changes_count and slug_last_changed_at (reset annually) per FR-058 → `components/contractor/SlugDisplay.tsx`

### Slug Modification (FR-049 to FR-053)

- [ ] [T121] [P2] [US7] Build SlugEditor component with text input, real-time validation, availability indicator (✓ Available, ✗ Taken, ✗ Forbidden), and Save button per FR-049-051 → `components/contractor/SlugEditor.tsx`
- [ ] [T122] [P2] [US7] Create useSlugValidation hook with debounced validation (500ms) calling Edge Function per research.md lines 403-429 → `lib/hooks/useSlugValidation.ts`
- [ ] [T123] [P2] [US7] Implement client-side slug normalization: lowercase, remove accents, replace spaces with hyphens, allow only a-z0-9-, min 3 max 50 chars per FR-050, FR-052 from research.md lines 338-384 → `lib/utils/slug-generator.ts`
- [ ] [T124] [P2] [US7] Create Edge Function check-slug-availability.ts validating: 1) Format (regex), 2) Uniqueness (database query), 3) Not in forbidden_slugs list, returning { available: boolean, reason?: string } per FR-051, FR-053 from contractor-slug.yaml → `supabase/functions/check-slug-availability/index.ts`
- [ ] [T125] [P2] [US7] Create Edge Function update-contractor-slug.ts handling: 1) Validate change limit (max 3/year), 2) Update contractors.slug, 3) Insert contractor_slug_history entry (30-day expiration), 4) Increment slug_changes_count per FR-055-058 from contractor-slug.yaml → `supabase/functions/update-contractor-slug/index.ts`
- [ ] [T126] [P2] [US7] Display error modal when change limit reached showing next available date per FR-058 → `components/contractor/SlugLimitReachedModal.tsx`

### Slug Redirections (FR-055 to FR-057)

- [ ] [T127] [P2] [US7] Create Next.js middleware for /book/[slug] route handling: 1) Check contractors.slug match, 2) Check contractor_slug_history for old slug redirect (HTTP 301), 3) 404 if expired/not found per FR-056-057 from research.md lines 514-550 → `app/book/[slug]/middleware.ts`
- [ ] [T128] [P2] [US7] Create custom 404 page for expired slugs with message: "Ce prestataire a modifié son lien. Veuillez le contacter pour obtenir le nouveau lien." per FR-057 → `app/book/404-slug-expired/page.tsx`
- [ ] [T129] [P2] [US7] Create cron Edge Function cleanup-expired-slug-history.ts running daily to DELETE expired entries (expires_at < NOW()) → `supabase/functions/cleanup-expired-slug-history/index.ts`
- [ ] [T130] [P2] [US7] Configure Supabase cron job to run cleanup-expired-slug-history daily at 3am → `supabase/functions/cleanup-expired-slug-history/cron.yaml`
- [ ] [T131] [P2] [US7] Store contractor_id in booking session (not slug) to prevent conflicts during slug change mid-booking per FR-059 → Update booking session logic

### Slug Analytics (FR-060 to FR-062)

- [ ] [T132] [P2] [US7] Create Edge Function track-slug-visit.ts recording contractor_slug_analytics entry with: slug_used, referrer, user_agent, ip_address, session_id (30min cookie) per FR-060 from research.md lines 453-476 → `supabase/functions/track-slug-visit/index.ts`
- [ ] [T133] [P2] [US7] Integrate track-slug-visit call on /book/[slug] page load → `app/book/[slug]/page.tsx`
- [ ] [T134] [P2] [US7] Create Edge Function mark-slug-conversion.ts updating contractor_slug_analytics.converted=true, booking_id, conversion_timestamp when booking confirmed per research.md lines 478-489 → `supabase/functions/mark-slug-conversion/index.ts`
- [ ] [T135] [P2] [US7] Build SlugAnalytics component displaying: total visits, visits last 30 days, conversion rate, top referrers from contractor_slug_stats view per FR-062 → `components/contractor/SlugAnalytics.tsx`
- [ ] [T136] [P2] [US7] Create Edge Function get-slug-analytics.ts querying contractor_slug_stats view and detailed analytics per contractor-slug.yaml → `supabase/functions/get-slug-analytics/index.ts`

### Admin Slug Management (FR-063 to FR-065)

- [ ] [T137] [P2] [US7] Add "Force Slug Change" button to admin contractor detail page with required reason modal per FR-063 → `app/admin/contractors/[id]/page.tsx`
- [ ] [T138] [P2] [US7] Create Edge Function admin-force-slug-change.ts bypassing change limit, resetting slug to [first-name]-[last-name], setting contractor_slug_history.changed_by_admin=true, sending notification email per FR-063-064 → `supabase/functions/admin-force-slug-change/index.ts`
- [ ] [T139] [P2] [US7] Create admin forbidden slugs management page at app/admin/platform-config/forbidden-slugs/page.tsx with add/remove functionality updating platform_config table per FR-065 → `app/admin/platform-config/forbidden-slugs/page.tsx`

---

## Phase 9: User Story 6 - Notifications (P2 - Important)

### Notification System (FR-040 to FR-045)

- [ ] [T140] [P2] [US6] Create contractor notification center page at app/contractor/notifications/page.tsx with list, filters (type, read/unread), and mark all as read button → `app/contractor/notifications/page.tsx`
- [ ] [T141] [P2] [US6] Build NotificationCard component displaying type icon, title, message, timestamp, and action link → `components/contractor/NotificationCard.tsx`
- [ ] [T142] [P2] [US6] Integrate Supabase Realtime subscription to notifications table for live updates → `lib/hooks/useNotifications.ts`
- [ ] [T143] [P2] [US6] Create notification badge component in contractor layout header showing unread count → `app/contractor/layout.tsx`
- [ ] [T144] [P2] [US6] Create Edge Function send-contractor-notification.ts handling: 1) Insert notifications table, 2) Send email (Resend), 3) Send SMS (Twilio) based on preferences per FR-040-042 → `supabase/functions/send-contractor-notification/index.ts`
- [ ] [T145] [P2] [US6] Build notification preferences page at app/contractor/settings/notifications/page.tsx with toggles per channel (email, SMS, push) and per event type → `app/contractor/settings/notifications/page.tsx`
- [ ] [T146] [P2] [US6] Create Edge Function for J-1 booking reminders cron job sending SMS with address and client details per FR-041 → `supabase/functions/send-booking-reminders/index.ts`
- [ ] [T147] [P2] [US6] Configure Supabase cron job to run send-booking-reminders daily at 10am → `supabase/functions/send-booking-reminders/cron.yaml`

---

## Phase 10: Cross-Cutting Concerns & Polish

### Contractor Dashboard

- [ ] [T148] [P1] [CROSS] Create main contractor dashboard at app/contractor/dashboard/page.tsx with key metrics: pending requests count, upcoming bookings today, revenue this month, profile completeness → `app/contractor/dashboard/page.tsx`
- [ ] [T149] [P1] [CROSS] Build quick action cards: "New Requests" (count + CTA), "Today's Schedule" (list), "Awaiting Payment" (count), "Update Profile" (if incomplete) → `components/contractor/DashboardCards.tsx`
- [ ] [T150] [P2] [CROSS] Add performance metrics widget displaying: total bookings, acceptance rate, average rating (once reviews implemented) per FR-045 → `components/contractor/PerformanceMetrics.tsx`

### Contractor Layout & Navigation

- [ ] [T151] [P1] [CROSS] Create contractor layout at app/contractor/layout.tsx with sidebar navigation: Dashboard, Reservations, Planning, Revenues, Profile, Settings → `app/contractor/layout.tsx`
- [ ] [T152] [P1] [CROSS] Build responsive sidebar component with mobile hamburger menu and active state indicators → `components/contractor/ContractorSidebar.tsx`
- [ ] [T153] [P2] [CROSS] Add contractor-specific header with notification bell, profile dropdown (Settings, Logout) → `components/contractor/ContractorHeader.tsx`

### Authentication & Access Control

- [ ] [T154] [P1] [CROSS] Create contractor-specific login page at app/(auth)/contractor/login/page.tsx separate from client login → `app/(auth)/contractor/login/page.tsx`
- [ ] [T155] [P1] [CROSS] Implement middleware protecting /contractor/* routes checking auth.uid() matches contractors.profile_uuid → `middleware.ts`
- [ ] [T156] [P1] [CROSS] Add role check in middleware redirecting non-contractors from contractor routes → `middleware.ts`

### Error Handling & Validation

- [ ] [T157] [P2] [CROSS] Create global error boundary for contractor routes with user-friendly error messages → `app/contractor/error.tsx`
- [ ] [T158] [P2] [CROSS] Implement optimistic UI updates with rollback for critical actions (accept/refuse booking, mark completed) → Integrate in TanStack Query mutations
- [ ] [T159] [P2] [CROSS] Add form validation error messages in French for all user inputs → Review all form components

### Performance Optimization

- [ ] [T160] [P2] [CROSS] Implement React Query caching strategy for contractor data with 60-second stale time → `lib/react-query/contractor-queries.ts`
- [ ] [T161] [P2] [CROSS] Add loading skeletons for all list views (bookings, transactions, notifications) → Create reusable skeleton components
- [ ] [T162] [P2] [CROSS] Optimize database queries with proper indexes (all defined in migrations, verify performance) → Review and test query performance
- [ ] [T163] [P2] [CROSS] Implement infinite scroll pagination for transaction history and past bookings → Use TanStack Query infinite queries

### Testing

- [ ] [T164] [P2] [CROSS] Write E2E test for contractor onboarding flow (application → approval → first login → onboarding steps) using Playwright from tests/e2e/contractor-onboarding.spec.ts → `tests/e2e/contractor-onboarding.spec.ts`
- [ ] [T165] [P2] [CROSS] Write E2E test for booking acceptance flow (pending request → accept → payment capture → confirmation) using Playwright from tests/e2e/contractor-bookings.spec.ts → `tests/e2e/contractor-bookings.spec.ts`
- [ ] [T166] [P2] [CROSS] Write E2E test for slug management (view → modify → validation → redirect) using Playwright from tests/e2e/contractor-slug.spec.ts → `tests/e2e/contractor-slug.spec.ts`
- [ ] [T167] [P2] [CROSS] Write unit tests for slug generation algorithm covering edge cases (short names, special chars, conflicts) → `tests/unit/slug-generator.test.ts`
- [ ] [T168] [P2] [CROSS] Write unit tests for financial calculations (commission, Stripe fees, tips) → `tests/unit/financial-calculations.test.ts`
- [ ] [T169] [P3] [CROSS] Write API contract tests validating Edge Functions against OpenAPI specs in contracts/ directory → `tests/integration/edge-functions/`

### Documentation

- [ ] [T170] [P3] [CROSS] Document contractor onboarding process for support team → `docs/contractor-onboarding-guide.md`
- [ ] [T171] [P3] [CROSS] Create contractor FAQ covering common questions (slug changes, tips, payment timing, schedule conflicts) → `docs/contractor-faq.md`
- [ ] [T172] [P3] [CROSS] Document Edge Functions with JSDoc comments including authentication requirements and error codes → Review all Edge Functions

---

## Dependency Graph

### Critical Path (Must Complete in Order)

```
Phase 1 (Database Setup)
  ↓
Phase 2 (Onboarding) → Phase 5 (Stripe Connect)
  ↓                          ↓
Phase 3 (Planning)    Phase 4 (Bookings)
  ↓                          ↓
Phase 6 (Financials) ← ←  ←  ←
```

### Parallel Execution Opportunities

After Phase 1 completes, these can be worked on in parallel:
- **Phase 7 (Profile)** - Independent of other features
- **Phase 8 (Slug)** - Independent of other features
- **Phase 9 (Notifications)** - Can integrate once other features complete

**Phase 10 (Cross-Cutting)** requires most other phases complete but individual tasks can be interleaved.

---

## Story Completion Order

**Recommended implementation order for maximum value delivery:**

1. ✅ **Phase 1: Infrastructure** (Blocking - all stories depend on this)
2. 🔵 **US0: Onboarding** (P1 - no contractors without this)
3. 🔵 **US5: Stripe Connect** (P1 - blocks payments)
4. 🔵 **US1: Planning** (P1 - blocks availability calculation)
5. 🔵 **US2: Bookings** (P1 - core business flow)
6. 🟡 **US3: Financials** (P2 - important for contractor satisfaction)
7. 🟡 **US7: Slug** (P2 - marketing feature)
8. 🟡 **US4: Profile** (P2 - improves conversions)
9. 🟡 **US6: Notifications** (P2 - enhances UX)
10. 🟢 **Phase 10: Polish** (P2-P3 - quality improvements)

---

## Success Metrics per Story

### US0 - Onboarding
- ✅ 100% of applications create backoffice tasks
- ✅ Approved contractors receive credentials email within 1 minute
- ✅ 95% of contractors complete onboarding within 7 days (SC-004)

### US1 - Planning
- ✅ Contractors configure schedule in <5 minutes (SC-001)
- ✅ Planning view loads in <1 second (SC-005)
- ✅ 0% scheduling conflicts (SC-007)

### US2 - Bookings
- ✅ Average response time <2 hours (SC-002)
- ✅ Acceptance rate ≥75% (SC-003)
- ✅ 100% payment capture success on accept

### US3 - Financials
- ✅ Dashboard loads in <1 second
- ✅ 80% weekly active usage (SC-006)
- ✅ CSV exports complete in <3 seconds

### US5 - Stripe Connect
- ✅ 95% complete setup within 7 days (SC-004)
- ✅ 100% blocked from accepting bookings until verified

### US7 - Slug
- ✅ Real-time validation responds in <500ms
- ✅ 301 redirects work for 30 days
- ✅ Conversion tracking accurate to 99%

---

## Estimated Complexity

**Total Tasks**: 172
- **P0 (Blocking)**: 20 tasks - Database setup, environment config
- **P1 (MVP Critical)**: 77 tasks - Core contractor workflows
- **P2 (Important)**: 69 tasks - Enhanced features and UX
- **P3 (Nice-to-have)**: 6 tasks - Documentation and advanced testing

**Estimated Timeline** (assuming 2 developers):
- Phase 1: 3-4 days (blocking)
- Phases 2-5: 2-3 weeks (MVP features)
- Phases 6-9: 2 weeks (enhanced features)
- Phase 10: 1 week (polish)

**Total**: 5-6 weeks for full implementation

---

**Generated**: 2025-11-07
**Next Step**: Begin Phase 1 database migrations, then implement stories in priority order
**Review**: Technical Lead approval recommended before starting implementation
