# Tasks: Service d'Urgence Ready to Go

**Feature**: Multi-tier Urgency Pricing with Express (+50%), Rapide (+30%), and Aujourd'hui (+15%)
**Branch**: `013-ready-to-go`
**Created**: 2025-11-07
**Status**: Ready for Implementation

**Input**: Design documents from `/specs/013-ready-to-go/`
- spec.md (34 functional requirements, 5 user stories)
- plan.md (architecture, tech stack, implementation phases)
- data-model.md (6 new tables, 2 table extensions)
- research.md (technical decisions)
- contracts/ (5 OpenAPI specifications)

**Total Tasks**: 195 tasks across 9 phases

---

## Format: `- [ ] [ID] [P?] [Story?] Description`

- **Checkbox**: Always `- [ ]`
- **[ID]**: T001, T002, T003... (sequential)
- **[P]**: Can run in parallel (independent, no blocking dependencies)
- **[Story]**: User story label ([US1], [US2], etc.) - ONLY in user story phases
- **Description**: Clear action with exact file path

---

## Dependencies

**External Specs**:
- **Spec 002 (Availability)**: Extends availability algorithm for urgency filters
- **Spec 003 (Booking Flow)**: Coordinates `appointment_bookings` table, extends payment flow
- **Spec 004 (Payment)**: Extends Stripe PaymentIntent for urgency premiums
- **Spec 007 (Contractor Interface)**: Coordinates `appointment_bookings` tip columns (separate migrations)
- **Spec 008 (Notifications)**: Uses PWA push notification system

**Critical Coordination**:
- `appointment_bookings` has extensions from BOTH spec 007 (tips) and spec 013 (urgency)
- Create SEPARATE migration files for each spec's columns
- Do NOT combine tip and urgency migrations

---

## Phase 1: Setup & Infrastructure (P0)

**Purpose**: Environment configuration and dependencies installation

- [ ] T001 Add GOOGLE_MAPS_API_KEY to .env.local for travel time calculations
- [ ] T002 Add TWILIO_ACCOUNT_SID to .env.local for SMS notifications (Express tier)
- [ ] T003 Add TWILIO_AUTH_TOKEN to .env.local for SMS notifications
- [ ] T004 Add TWILIO_PHONE_NUMBER to .env.local for sender ID
- [ ] T005 Add VAPID_PUBLIC_KEY to .env.local for PWA push notifications
- [ ] T006 Add VAPID_PRIVATE_KEY to .env.local for PWA push notifications
- [ ] T007 [P] Install @googlemaps/google-maps-services-js in package.json
- [ ] T008 [P] Install twilio SDK in package.json for SMS integration
- [ ] T009 [P] Install web-push for PWA notifications in package.json
- [ ] T010 [P] Verify Supabase Edge Functions Deno runtime configured for urgency endpoints

**Checkpoint**: Environment configured, all dependencies installed

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Database schema, RLS policies, base TypeScript types - MUST complete before any user story work

**⚠️ CRITICAL**: No user story implementation can begin until this phase is 100% complete

### Database Migrations (10 files, sequential order)

- [ ] T011 Create migration supabase/migrations/20250107140000_platform_urgency_pricing.sql with table platform_urgency_pricing (id BIGINT, urgency_level VARCHAR(20) CHECK IN ('express', 'fast', 'today'), min_minutes INT, max_minutes INT, global_surcharge_percent DECIMAL(5,2), service_id BIGINT NULLABLE, service_surcharge_percent DECIMAL(5,2) NULLABLE, contractor_share_percent DECIMAL(5,2) DEFAULT 50.00, platform_share_percent DECIMAL(5,2) DEFAULT 50.00, is_active BOOLEAN, effective_from TIMESTAMP, effective_until TIMESTAMP NULLABLE, created_at TIMESTAMP, updated_at TIMESTAMP, CONSTRAINT valid_share_split CHECK (contractor_share_percent + platform_share_percent = 100))
- [ ] T012 Add SQL COMMENT statements to platform_urgency_pricing table and all columns in French per constitution
- [ ] T013 Create indexes idx_platform_urgency_pricing_level, idx_platform_urgency_pricing_service, idx_platform_urgency_pricing_effective in 20250107140000_platform_urgency_pricing.sql
- [ ] T014 Create unique index idx_platform_urgency_pricing_unique_global in 20250107140000_platform_urgency_pricing.sql WHERE is_active = true AND service_id IS NULL AND (effective_until IS NULL OR effective_until > NOW())
- [ ] T015 Enable RLS on platform_urgency_pricing with policy "Anyone can view active urgency pricing" FOR SELECT TO public WHERE is_active = true
- [ ] T016 Add RLS policy "Admins can manage urgency pricing" on platform_urgency_pricing FOR ALL TO authenticated USING (profiles.role = 'admin')
- [ ] T017 Insert seed data in 20250107140000_platform_urgency_pricing.sql: Express (0-60min, 50%, 50/50 split), Rapide (60-120min, 30%, 50/50 split), Aujourd'hui (120-240min, 15%, 50/50 split)
- [ ] T018 Create migration supabase/migrations/20250107140100_contractor_urgency_config.sql with table contractor_urgency_config (id BIGINT, contractor_id BIGINT UNIQUE REFERENCES contractors(id), is_enabled BOOLEAN DEFAULT false, availability_slots JSONB DEFAULT '[]'::JSONB, max_urgent_per_week INT DEFAULT 10, current_week_urgent_count INT DEFAULT 0, week_start_date DATE, accepted_postal_codes TEXT[], last_known_location JSONB, last_location_updated_at TIMESTAMP, created_at TIMESTAMP, updated_at TIMESTAMP)
- [ ] T019 Add SQL COMMENT statements to contractor_urgency_config table and all columns in French
- [ ] T020 Create indexes idx_contractor_urgency_config_enabled, idx_contractor_urgency_config_contractor in 20250107140100_contractor_urgency_config.sql
- [ ] T021 Enable RLS on contractor_urgency_config with policy "Contractors can view own urgency config" FOR SELECT WHERE contractor_id IN (SELECT id FROM contractors WHERE profile_uuid = auth.uid())
- [ ] T022 Add RLS policy "Contractors can manage own urgency config" on contractor_urgency_config FOR ALL WHERE contractor_id IN (SELECT id FROM contractors WHERE profile_uuid = auth.uid())
- [ ] T023 Add RLS policy "Admins can view all urgency configs" on contractor_urgency_config FOR SELECT WHERE profiles.role = 'admin'
- [ ] T024 Create trigger function reset_weekly_urgent_counter() in 20250107140100_contractor_urgency_config.sql to reset current_week_urgent_count on Monday
- [ ] T025 Create trigger reset_urgent_counter_weekly BEFORE INSERT OR UPDATE on contractor_urgency_config to execute reset_weekly_urgent_counter()
- [ ] T026 Create migration supabase/migrations/20250107140200_services_urgency_extensions.sql to ALTER TABLE services ADD COLUMN urgency_enabled BOOLEAN DEFAULT true, ADD COLUMN urgency_max_duration_minutes INT CHECK (urgency_max_duration_minutes > 0)
- [ ] T027 Add SQL COMMENT statements to services.urgency_enabled and services.urgency_max_duration_minutes in French
- [ ] T028 Create index idx_services_urgency_enabled in 20250107140200_services_urgency_extensions.sql WHERE urgency_enabled = true AND is_active = true
- [ ] T029 Create migration supabase/migrations/20250107140300_appointment_bookings_urgency_extensions.sql to ALTER TABLE appointment_bookings ADD COLUMN urgency_level VARCHAR(20) CHECK (urgency_level IN ('express', 'fast', 'today')), ADD COLUMN urgency_surcharge_amount DECIMAL(10,2) DEFAULT 0, ADD COLUMN urgency_surcharge_percent DECIMAL(5,2) DEFAULT 0, ADD COLUMN urgency_contractor_bonus DECIMAL(10,2) DEFAULT 0, ADD COLUMN urgency_platform_revenue DECIMAL(10,2) DEFAULT 0, ADD COLUMN urgency_requested_at TIMESTAMP, ADD COLUMN urgency_promised_arrival_start TIMESTAMP, ADD COLUMN urgency_promised_arrival_end TIMESTAMP, ADD COLUMN urgency_actual_arrival_time TIMESTAMP, ADD COLUMN urgency_arrived_on_time BOOLEAN, ADD COLUMN urgency_pricing_config_id BIGINT REFERENCES platform_urgency_pricing(id)
- [ ] T030 Add SQL COMMENT statements to all urgency_* columns in appointment_bookings in French (CRITICAL: separate from spec 007 tip columns)
- [ ] T031 Create indexes idx_appointment_bookings_urgency, idx_appointment_bookings_urgency_contractor in 20250107140300_appointment_bookings_urgency_extensions.sql
- [ ] T032 Create migration supabase/migrations/20250107140400_urgent_notifications.sql with table urgent_notifications (id BIGINT, booking_id BIGINT REFERENCES appointment_bookings(id), contractor_id BIGINT REFERENCES contractors(id), urgency_level VARCHAR(20) CHECK IN ('express', 'fast', 'today'), bonus_amount DECIMAL(10,2), travel_time_minutes INT, departure_time TIMESTAMP, status VARCHAR(50) DEFAULT 'pending' CHECK IN ('pending', 'confirmed', 'refused', 'timeout'), sent_at TIMESTAMP, responded_at TIMESTAMP NULLABLE, push_notification_sent BOOLEAN DEFAULT false, sms_sent BOOLEAN DEFAULT false, email_sent BOOLEAN DEFAULT false, contractor_message TEXT NULLABLE, attempt_number INT DEFAULT 1 CHECK (attempt_number > 0), created_at TIMESTAMP, updated_at TIMESTAMP)
- [ ] T033 Add SQL COMMENT statements to urgent_notifications table and all columns in French
- [ ] T034 Create indexes idx_urgent_notifications_booking, idx_urgent_notifications_contractor, idx_urgent_notifications_pending in 20250107140400_urgent_notifications.sql
- [ ] T035 Enable RLS on urgent_notifications with policy "Contractors can view own urgent notifications" FOR SELECT WHERE contractor_id IN (SELECT id FROM contractors WHERE profile_uuid = auth.uid())
- [ ] T036 Add RLS policy "Contractors can update own urgent notifications" on urgent_notifications FOR UPDATE WHERE contractor_id IN (SELECT id FROM contractors WHERE profile_uuid = auth.uid())
- [ ] T037 Add RLS policy "Admins can view all urgent notifications" on urgent_notifications FOR SELECT WHERE profiles.role = 'admin'
- [ ] T038 Create trigger function set_notification_responded_at() in 20250107140400_urgent_notifications.sql to set responded_at when status changes from 'pending'
- [ ] T039 Create trigger update_urgent_notification_responded_at BEFORE UPDATE on urgent_notifications to execute set_notification_responded_at()
- [ ] T040 Create migration supabase/migrations/20250107140500_urgency_analytics.sql with table urgency_analytics (id BIGINT, booking_id BIGINT NULLABLE REFERENCES appointment_bookings(id), urgency_level VARCHAR(20) CHECK IN ('express', 'fast', 'today'), requested_at TIMESTAMP, service_id BIGINT REFERENCES services(id), client_id UUID REFERENCES profiles(id), assigned_contractor_id BIGINT REFERENCES contractors(id), response_time_seconds INT, contractor_attempts INT DEFAULT 1, status VARCHAR(50) CHECK IN ('success', 'timeout', 'no_contractor', 'client_cancel'), promised_arrival_window_start TIMESTAMP, promised_arrival_window_end TIMESTAMP, actual_arrival_time TIMESTAMP NULLABLE, arrived_on_time BOOLEAN NULLABLE, client_satisfaction_rating INT CHECK (client_satisfaction_rating >= 1 AND client_satisfaction_rating <= 5), client_feedback TEXT NULLABLE, base_price DECIMAL(10,2), surcharge_amount DECIMAL(10,2), contractor_bonus DECIMAL(10,2), platform_revenue DECIMAL(10,2), created_at TIMESTAMP)
- [ ] T041 Add SQL COMMENT statements to urgency_analytics table and all columns in French
- [ ] T042 Create indexes idx_urgency_analytics_urgency_level, idx_urgency_analytics_contractor, idx_urgency_analytics_status, idx_urgency_analytics_booking in 20250107140500_urgency_analytics.sql
- [ ] T043 Enable RLS on urgency_analytics with policy "Contractors can view own urgency analytics" FOR SELECT WHERE assigned_contractor_id IN (SELECT id FROM contractors WHERE profile_uuid = auth.uid())
- [ ] T044 Add RLS policy "Admins can view all urgency analytics" on urgency_analytics FOR SELECT WHERE profiles.role = 'admin'
- [ ] T045 Create migration supabase/migrations/20250107140600_urgency_zone_restrictions.sql with table urgency_zone_restrictions (id BIGINT, zone_type VARCHAR(50) CHECK IN ('postal_code', 'city', 'radius'), zone_value VARCHAR(255), reason TEXT, is_active BOOLEAN DEFAULT true, created_at TIMESTAMP, updated_at TIMESTAMP)
- [ ] T046 Add SQL COMMENT statements to urgency_zone_restrictions table and all columns in French
- [ ] T047 Create indexes idx_urgency_zone_restrictions_type, idx_urgency_zone_restrictions_value in 20250107140600_urgency_zone_restrictions.sql
- [ ] T048 Enable RLS on urgency_zone_restrictions with policy "Anyone can view active zone restrictions" FOR SELECT TO public WHERE is_active = true
- [ ] T049 Add RLS policy "Admins can manage zone restrictions" on urgency_zone_restrictions FOR ALL WHERE profiles.role = 'admin'
- [ ] T050 Create migration supabase/migrations/20250107140700_urgency_views.sql with VIEW urgency_performance_by_tier (urgency_level, total_requests, successful_bookings, timeout_count, no_contractor_count, conversion_rate_percentage, avg_response_time_seconds, median_response_time_seconds, avg_contractor_attempts, arrived_on_time_count, on_time_rate_percentage, avg_satisfaction_rating, total_surcharge_revenue, total_contractor_bonus, total_platform_revenue) GROUP BY urgency_level WHERE requested_at >= NOW() - INTERVAL '30 days'
- [ ] T051 Add SQL COMMENT to urgency_performance_by_tier VIEW in French
- [ ] T052 Create VIEW contractor_urgency_stats in 20250107140700_urgency_views.sql (contractor_id, first_name, last_name, urgency_enabled, max_urgent_per_week, current_week_urgent_count, total_urgent_bookings, successful_bookings, avg_response_time_seconds, on_time_rate, avg_satisfaction_rating, total_bonus_earned, timeout_count, refused_count) FROM contractors LEFT JOIN contractor_urgency_config LEFT JOIN urgency_analytics LEFT JOIN urgent_notifications
- [ ] T053 Add SQL COMMENT to contractor_urgency_stats VIEW in French
- [ ] T054 Create VIEW urgency_revenue_breakdown in 20250107140700_urgency_views.sql (month, urgency_level, booking_count, total_base_price, total_surcharge, total_contractor_bonus, total_platform_revenue, avg_surcharge_per_booking) GROUP BY month, urgency_level WHERE status = 'success'
- [ ] T055 Add SQL COMMENT to urgency_revenue_breakdown VIEW in French
- [ ] T056 GRANT SELECT on urgency_performance_by_tier, contractor_urgency_stats, urgency_revenue_breakdown TO authenticated in 20250107140700_urgency_views.sql
- [ ] T057 Create migration supabase/migrations/20250107140800_urgency_triggers.sql with function increment_contractor_urgent_count() to increment current_week_urgent_count when urgency booking created
- [ ] T058 Create trigger increment_urgent_count_on_booking AFTER INSERT on appointment_bookings FOR EACH ROW WHEN (NEW.urgency_level IS NOT NULL) in 20250107140800_urgency_triggers.sql
- [ ] T059 Create function update_contractor_location_after_booking() in 20250107140800_urgency_triggers.sql to update contractor_urgency_config.last_known_location from service_address_data when booking completed
- [ ] T060 Create trigger update_location_on_booking_complete AFTER UPDATE on appointment_bookings FOR EACH ROW WHEN (NEW.status = 'completed' AND OLD.status != 'completed') in 20250107140800_urgency_triggers.sql
- [ ] T061 Create function create_urgency_analytics_entry() in 20250107140800_urgency_triggers.sql to auto-insert into urgency_analytics when urgency booking created
- [ ] T062 Create trigger create_analytics_on_urgent_booking AFTER INSERT on appointment_bookings FOR EACH ROW WHEN (NEW.urgency_level IS NOT NULL) in 20250107140800_urgency_triggers.sql
- [ ] T063 Create function check_urgency_zone_restriction(client_postal_code VARCHAR, client_city VARCHAR) RETURNS BOOLEAN in 20250107140800_urgency_triggers.sql to verify if zone allowed for Ready to Go

### TypeScript Types & Shared Utilities

- [ ] T064 [P] Create src/types/urgency.ts with types UrgencyLevel ('express' | 'fast' | 'today'), UrgencyTierConfig, UrgencyPricingBreakdown (basePrice, surchargePercent, surchargeAmount, contractorBonus, platformRevenue, totalPrice), ContractorUrgencyConfig, UrgentNotification, UrgencyAnalytics
- [ ] T065 [P] Create src/lib/utils/urgency-calculations.ts with function calculateUrgencyPricing(basePrice: number, urgencyLevel: UrgencyLevel, serviceId: number, pricingConfig: UrgencyTierConfig): UrgencyPricingBreakdown - implements pricing logic from research.md
- [ ] T066 [P] Create src/lib/utils/travel-time.ts with async function calculateTravelTime(origin: {lat: number, lng: number}, destination: {lat: number, lng: number}): Promise<number> - wrapper for Google Distance Matrix API with 1-hour cache
- [ ] T067 [P] Add fallback logic to calculateTravelTime() to return prudent estimate (20km = 30 min) if Google API fails
- [ ] T068 [P] Create src/lib/utils/urgency-time-windows.ts with function getUrgencyTimeWindow(urgencyLevel: UrgencyLevel): {minMinutes: number, maxMinutes: number, label: string} - returns Express (0-60, "<1h"), Rapide (60-120, "1h-2h"), Aujourd'hui (120-240, "2h-4h")
- [ ] T069 [P] Create src/lib/utils/urgency-badges.ts with function getUrgencyBadge(urgencyLevel: UrgencyLevel): {emoji: string, label: string} - returns Express ("⚡", "EXPRESS"), Rapide ("🏃", "RAPIDE"), Aujourd'hui ("📅", "AUJOURD'HUI")

**Checkpoint**: Foundation ready - ALL user stories can now start in parallel

---

## Phase 3: US1 - Client Urgency Selection (Priority: P1) 🎯 MVP

**Goal**: Client activates Ready to Go mode, selects urgency tier (Express/Rapide/Aujourd'hui), sees transparent pricing with contractor bonus

**Independent Test**: Activate urgency mode, verify 3 tiers displayed with correct prices, select tier, verify only matching slots shown

**Deliverables**: Client can select urgency tier and see transparent pricing breakdown

### Implementation

- [ ] T070 [P] [US1] Create src/components/urgency/TierSelectionCard.tsx - displays one urgency tier (Express/Rapide/Aujourd'hui) with badge, time window, surcharge percentage, total price, contractor bonus, and available contractor count
- [ ] T071 [P] [US1] Create src/components/urgency/UrgencyPricingBreakdown.tsx - transparent pricing display showing base price, surcharge added, contractor bonus amount, total price (uses Tailwind v4 for styling)
- [ ] T072 [US1] Create src/components/urgency/UrgencyModeToggle.tsx - toggle button to activate/deactivate Ready to Go mode in booking flow (auto-disables after booking per FR-007)
- [ ] T073 [US1] Create src/app/(client)/booking/urgency-mode/page.tsx - tier selection page with 3 TierSelectionCard components for Express, Rapide, Aujourd'hui
- [ ] T074 [US1] Create src/hooks/useUrgencyPricing.ts - TanStack Query hook to fetch urgency pricing configs from platform_urgency_pricing (checks service-specific override first, falls back to global)
- [ ] T075 [US1] Implement calculatePricingForAllTiers() in src/hooks/useUrgencyPricing.ts to calculate pricing for all 3 tiers given basePrice and serviceId
- [ ] T076 [US1] Create src/hooks/useAvailableContractorCount.ts - TanStack Query hook to fetch count of available contractors per urgency tier from Edge Function
- [ ] T077 [US1] Integrate TierSelectionCard into src/app/(client)/booking/urgency-mode/page.tsx with pricing data from useUrgencyPricing and counts from useAvailableContractorCount
- [ ] T078 [US1] Add "Aucun prestataire disponible" message with suggestion to try other tiers when count = 0 per FR-008
- [ ] T079 [US1] Create urgency tier state management in src/app/(client)/booking/urgency-mode/page.tsx to store selected urgency_level and pass to availability/calendar page
- [ ] T080 [US1] Create src/app/(client)/booking/urgency-availability/page.tsx - shows available contractors filtered by selected urgency tier with only slots within time window (Express: 0-60min, Rapide: 60-120min, Aujourd'hui: 120-240min)
- [ ] T081 [US1] Filter slots in src/app/(client)/booking/urgency-availability/page.tsx based on selected urgency tier time window per FR-006
- [ ] T082 [US1] Implement auto-disable Ready to Go mode after booking confirmation in src/app/(client)/booking/urgency-confirmation/page.tsx per FR-007

**Checkpoint**: Client can select urgency tier, see transparent pricing, and view filtered availability

---

## Phase 4: US2 - Contractor Urgency Opt-In (Priority: P1) 🎯 MVP

**Goal**: Contractor activates Ready to Go with simple ON/OFF toggle, configures availability time slots, sees potential bonus earnings

**Independent Test**: Contractor enables Ready to Go, sets availability (Mon-Fri 10h-18h), verify slots appear in all 3 urgency tiers for clients

**Deliverables**: Contractor can opt-in to Ready to Go and configure availability

### Models & Services

- [ ] T083 [P] [US2] Create supabase/functions/contractor-urgency-config/index.ts - Edge Function with GET /contractor-urgency-config (fetch contractor's config), PUT /contractor-urgency-config (update is_enabled, availability_slots, max_urgent_per_week)
- [ ] T084 [P] [US2] Implement GET handler in supabase/functions/contractor-urgency-config/index.ts to query contractor_urgency_config by contractor_id from auth.uid()
- [ ] T085 [US2] Implement PUT handler in supabase/functions/contractor-urgency-config/index.ts with validation: availability_slots format [{"day": "monday", "start": "10:00", "end": "18:00"}], max_urgent_per_week > 0
- [ ] T086 [US2] Add RLS check in supabase/functions/contractor-urgency-config/index.ts to ensure contractor can only modify own config
- [ ] T087 [P] [US2] Create supabase/functions/contractor-urgency-stats/index.ts - Edge Function GET /contractor-urgency-stats to return contractor's urgency stats (total bookings, bonus earned, response time, on-time rate) from contractor_urgency_stats VIEW
- [ ] T088 [US2] Implement query in supabase/functions/contractor-urgency-stats/index.ts to SELECT from contractor_urgency_stats WHERE contractor_id = authenticated contractor

### UI Components

- [ ] T089 [P] [US2] Create src/components/urgency/ContractorUrgencyToggle.tsx - ON/OFF toggle for Ready to Go participation with clear explanation of bonus percentages (Express +50%, Rapide +30%, Aujourd'hui +15%)
- [ ] T090 [P] [US2] Create src/components/urgency/AvailabilitySlotsEditor.tsx - UI to configure availability_slots JSON: day selector (Mon-Sun) + start/end time pickers, displays current slots as list
- [ ] T091 [P] [US2] Create src/components/urgency/PotentialEarningsCalculator.tsx - shows estimated bonus earnings based on urgency tier percentages and contractor's average service price
- [ ] T092 [US2] Create src/app/(contractor)/settings/ready-to-go/page.tsx - Ready to Go settings page with ContractorUrgencyToggle, AvailabilitySlotsEditor, max_urgent_per_week slider (default 10), PotentialEarningsCalculator
- [ ] T093 [US2] Create src/hooks/useContractorUrgencyConfig.ts - TanStack Query hook with queries: useGetContractorUrgencyConfig(), mutations: useUpdateContractorUrgencyConfig(data: Partial<ContractorUrgencyConfig>)
- [ ] T094 [US2] Integrate useContractorUrgencyConfig() into src/app/(contractor)/settings/ready-to-go/page.tsx to load current config and handle updates
- [ ] T095 [US2] Add form validation in src/app/(contractor)/settings/ready-to-go/page.tsx: availability_slots must have valid day/start/end, max_urgent_per_week 1-50 range, start < end time
- [ ] T096 [US2] Display success toast in src/app/(contractor)/settings/ready-to-go/page.tsx after successful config update with message "Configuration Ready to Go enregistrée"

### Integration with Availability System

- [ ] T097 [US2] Extend spec 002 availability algorithm in supabase/functions/urgency-check-availability/index.ts to filter contractors WHERE contractor_urgency_config.is_enabled = true
- [ ] T098 [US2] Add time slot check in supabase/functions/urgency-check-availability/index.ts to verify current time is within contractor's availability_slots for their configured days/hours
- [ ] T099 [US2] Add weekly limit check in supabase/functions/urgency-check-availability/index.ts to exclude contractors WHERE current_week_urgent_count >= max_urgent_per_week per FR-014
- [ ] T100 [US2] Implement buffer time logic in supabase/functions/urgency-check-availability/index.ts: minimum 15 minutes after previous booking end + travel time per FR-018

**Checkpoint**: Contractor can opt-in to Ready to Go, set availability, and appear in urgent searches

---

## Phase 5: US3 - Real-Time Availability (Priority: P1) 🎯 MVP

**Goal**: System verifies contractor can honor urgency request by checking travel time, existing bookings, and Ready to Go slots

**Independent Test**: Create scenarios (contractor far away, with conflicting booking, outside slots) and verify correct slot filtering

**Deliverables**: Availability algorithm ensures only realistic urgent slots are shown

### Edge Functions

- [ ] T101 [US3] Create supabase/functions/urgency-check-availability/index.ts - Edge Function POST /urgency-check-availability with params (clientAddress, urgencyLevel, serviceId, serviceDuration) returns list of available contractors with slots
- [ ] T102 [US3] Implement step 1 in urgency-check-availability: get urgency time window (Express: 0-60min, Rapide: 60-120min, Aujourd'hui: 120-240min) from platform_urgency_pricing
- [ ] T103 [US3] Implement step 2: query contractors FROM contractor_urgency_config WHERE is_enabled = true AND current_week_urgent_count < max_urgent_per_week
- [ ] T104 [US3] Implement step 3: filter contractors by availability_slots - check if booking time falls within configured day/hours per FR-019
- [ ] T105 [US3] Implement step 4: calculate travel time for each contractor using last_known_location to clientAddress via calculateTravelTime() from src/lib/utils/travel-time.ts
- [ ] T106 [US3] Implement step 5: filter by travel time limit - Express/Rapide <30 min, Aujourd'hui <45 min per FR-016, FR-017
- [ ] T107 [US3] Implement step 6: check actual slot availability considering existing bookings with 15-minute buffer per FR-018
- [ ] T108 [US3] Implement step 7: return only contractors with available slots within urgency time window
- [ ] T109 [US3] Add error handling in urgency-check-availability for Google Maps API failure - use fallback estimate per research.md
- [ ] T110 [US3] Create supabase/functions/urgency-contractor-slots/index.ts - Edge Function POST /urgency-contractor-slots with params (contractorId, urgencyLevel, serviceId, serviceDuration) returns specific available slots for selected contractor
- [ ] T111 [US3] Implement slot generation logic in urgency-contractor-slots considering urgency time window and existing bookings
- [ ] T112 [US3] Add logging in urgency-check-availability and urgency-contractor-slots for debugging availability issues

### Client Integration

- [ ] T113 [US3] Create src/hooks/useUrgencyAvailability.ts - TanStack Query hook to call urgency-check-availability Edge Function with client address, selected urgency tier, service ID
- [ ] T114 [US3] Integrate useUrgencyAvailability() into src/app/(client)/booking/urgency-availability/page.tsx to fetch and display available contractors
- [ ] T115 [US3] Display contractor list in src/app/(client)/booking/urgency-availability/page.tsx with travel time, estimated arrival window, and available slots
- [ ] T116 [US3] Create src/hooks/useContractorUrgencySlots.ts - TanStack Query hook to fetch specific slots for selected contractor
- [ ] T117 [US3] Integrate useContractorUrgencySlots() when client selects a contractor to show detailed slot picker
- [ ] T118 [US3] Add loading states and error handling in src/app/(client)/booking/urgency-availability/page.tsx for availability checks

**Checkpoint**: System accurately filters contractors by travel time, slots, and limits

---

## Phase 6: US4 - Priority Notifications (Priority: P2)

**Goal**: Send priority notifications to contractors with urgency badge, bonus amount, travel time, 5-minute response window

**Independent Test**: Create urgency booking, verify contractor receives push notification with correct badge and details, test 5-min timeout reassignment

**Deliverables**: Contractors receive priority notifications and can accept/refuse within 5 minutes

### Notification System

- [ ] T119 [US4] Create supabase/functions/urgency-send-notification/index.ts - Edge Function POST /urgency-send-notification with params (bookingId, contractorId, urgencyLevel, bonusAmount, travelTime, departureTime) to send multi-channel notifications
- [ ] T120 [US4] Implement step 1 in urgency-send-notification: create record in urgent_notifications with status='pending', sent_at=NOW()
- [ ] T121 [US4] Implement step 2: format notification content with urgency badge (⚡ EXPRESS, 🏃 RAPIDE, 📅 AUJOURD'HUI) from getUrgencyBadge() in src/lib/utils/urgency-badges.ts
- [ ] T122 [US4] Implement step 3: send push notification using web-push with title, body (departure time, bonus, travel time), actions (Accepter/Refuser) per FR-020, FR-021
- [ ] T123 [US4] Implement step 4: send SMS via Twilio for Express tier only per research.md with message format "⚡ EXPRESS: Départ {time}, Bonus +{amount}€. Accepter: {url}"
- [ ] T124 [US4] Implement step 5: send email via Resend as backup for all tiers with template urgent-booking-notification
- [ ] T125 [US4] Update urgent_notifications record with push_notification_sent, sms_sent, email_sent flags
- [ ] T126 [US4] Implement step 6: schedule timeout check for 5 minutes using Supabase scheduled tasks or pg_cron
- [ ] T127 [US4] Create supabase/functions/urgency-notification-respond/index.ts - Edge Function POST /urgency-notification-respond with params (notificationId, response: 'confirmed' | 'refused', contractorMessage: string optional) to handle contractor response
- [ ] T128 [US4] Implement confirmed response in urgency-notification-respond: update urgent_notifications status='confirmed', responded_at=NOW(), update appointment_bookings status
- [ ] T129 [US4] Implement refused response: update status='refused', log in urgency_analytics, trigger reassignment
- [ ] T130 [US4] Send client notification when contractor confirms per FR-024 with ETA, contractor name/photo
- [ ] T131 [US4] Create supabase/functions/urgency-notification-timeout-handler/index.ts - Background Edge Function to check for pending notifications >5 minutes and trigger reassignment
- [ ] T132 [US4] Implement timeout handler logic: SELECT from urgent_notifications WHERE status='pending' AND sent_at < NOW() - INTERVAL '5 minutes'
- [ ] T133 [US4] Update urgent_notifications status='timeout' in timeout handler and call reassignment function
- [ ] T134 [US4] Create supabase/functions/urgency-reassign-booking/index.ts - Internal Edge Function to reassign booking to next available contractor (try up to 3 contractors per FR-023)
- [ ] T135 [US4] Implement reassignment logic: query next available contractor from urgency-check-availability, call urgency-send-notification, increment attempt_number
- [ ] T136 [US4] Implement cancellation after 3 failed attempts per FR-025: cancel booking, refund payment, send promo code (-10%) to client
- [ ] T137 [US4] Add comprehensive logging in all notification functions for debugging delivery issues

### Contractor UI

- [ ] T138 [P] [US4] Create src/components/urgency/UrgentNotificationBadge.tsx - displays urgency badge with emoji and label (⚡ EXPRESS, 🏃 RAPIDE, 📅 AUJOURD'HUI)
- [ ] T139 [P] [US4] Create src/components/urgency/UrgentNotificationCard.tsx - notification card with badge, departure time, bonus amount, travel time, countdown timer (5 minutes), Accept/Refuse buttons
- [ ] T140 [US4] Create src/app/(contractor)/notifications/urgent/page.tsx - urgent notifications list with UrgentNotificationCard for each pending notification
- [ ] T141 [US4] Create src/hooks/useUrgentNotifications.ts - TanStack Query hook with queries: useGetPendingUrgentNotifications(), mutations: useRespondToUrgentNotification(notificationId, response, message)
- [ ] T142 [US4] Integrate useUrgentNotifications() into src/app/(contractor)/notifications/urgent/page.tsx to display pending notifications
- [ ] T143 [US4] Implement countdown timer in UrgentNotificationCard showing remaining time out of 5 minutes
- [ ] T144 [US4] Implement Accept button handler in UrgentNotificationCard to call useRespondToUrgentNotification with response='confirmed'
- [ ] T145 [US4] Implement Refuse button handler with optional text input for contractor_message
- [ ] T146 [US4] Add real-time subscription in src/app/(contractor)/notifications/urgent/page.tsx to listen for new urgent_notifications via Supabase Realtime
- [ ] T147 [US4] Display notification history (confirmed/refused/timeout) in separate section of src/app/(contractor)/notifications/urgent/page.tsx

**Checkpoint**: Contractors receive priority notifications and system handles timeouts/reassignments

---

## Phase 7: US5 - Urgency Analytics (Priority: P2)

**Goal**: Track urgency booking performance, contractor stats, revenue breakdown for admin dashboard

**Independent Test**: Create urgency bookings, verify data logged in urgency_analytics, contractor_urgency_stats VIEW shows correct stats

**Deliverables**: Comprehensive analytics for urgency bookings accessible to contractors and admins

### Edge Functions

- [ ] T148 [US5] Create supabase/functions/urgency-analytics/index.ts - Edge Function GET /urgency-analytics/performance-by-tier to return data from urgency_performance_by_tier VIEW
- [ ] T149 [US5] Implement query in urgency-analytics to SELECT * FROM urgency_performance_by_tier with optional date range filter
- [ ] T150 [US5] Create supabase/functions/urgency-analytics/revenue-breakdown/index.ts - Edge Function GET /urgency-analytics/revenue-breakdown to return data from urgency_revenue_breakdown VIEW
- [ ] T151 [US5] Implement query to SELECT * FROM urgency_revenue_breakdown with optional month filter
- [ ] T152 [US5] Create supabase/functions/urgency-analytics/contractor-rankings/index.ts - Edge Function GET /urgency-analytics/contractor-rankings to return top contractors by urgency bookings, on-time rate, satisfaction
- [ ] T153 [US5] Implement query in contractor-rankings to SELECT from contractor_urgency_stats ORDER BY total_urgent_bookings DESC, on_time_rate DESC LIMIT 20
- [ ] T154 [US5] Add RLS checks in all analytics Edge Functions: contractors can only view own stats, admins can view all

### Contractor Dashboard

- [ ] T155 [P] [US5] Create src/components/urgency/UrgencyStatsCard.tsx - displays contractor's personal urgency stats (total bookings this month, bonus earned, avg response time, on-time rate)
- [ ] T156 [P] [US5] Create src/components/urgency/UrgencyEarningsChart.tsx - line chart showing monthly urgency bonus earnings using Recharts or similar
- [ ] T157 [US5] Create src/app/(contractor)/dashboard/urgency-stats/page.tsx - contractor urgency stats dashboard with UrgencyStatsCard and UrgencyEarningsChart
- [ ] T158 [US5] Create src/hooks/useContractorUrgencyAnalytics.ts - TanStack Query hook to fetch contractor's personal urgency analytics from contractor-urgency-stats Edge Function
- [ ] T159 [US5] Integrate useContractorUrgencyAnalytics() into src/app/(contractor)/dashboard/urgency-stats/page.tsx to display stats
- [ ] T160 [US5] Display "Revenus bonus urgence ce mois: +{amount}€ ({count} interventions)" per FR-014 acceptance scenario 8

**Checkpoint**: Contractors can view their urgency stats and earnings

---

## Phase 8: US6 - Admin Configuration (Priority: P2)

**Goal**: Platform admins can configure urgency pricing tiers, view analytics dashboard, manage zone restrictions

**Independent Test**: Admin modifies Express surcharge from 50% to 55%, verify new clients see updated pricing

**Deliverables**: Admin can manage urgency configuration and view comprehensive analytics

### Admin Edge Functions

- [ ] T161 [US6] Create supabase/functions/admin-urgency-pricing/index.ts - Edge Function GET /admin-urgency-pricing to fetch all pricing configs, POST /admin-urgency-pricing to create new config, PUT /admin-urgency-pricing/:id to update
- [ ] T162 [US6] Implement GET handler in admin-urgency-pricing to SELECT * FROM platform_urgency_pricing WHERE is_active = true OR effective_until >= NOW() - INTERVAL '30 days'
- [ ] T163 [US6] Implement POST handler to archive current config (set is_active=false, effective_until=NOW()), insert new config with effective_from=NOW()
- [ ] T164 [US6] Add validation in POST handler: contractor_share_percent + platform_share_percent = 100, surcharge_percent >= 0, min_minutes < max_minutes
- [ ] T165 [US6] Implement PUT handler for service-specific overrides: allow admin to set service_id and service_surcharge_percent per FR-030
- [ ] T166 [US6] Add audit logging in admin-urgency-pricing for all config changes (who, what, when)
- [ ] T167 [US6] Create supabase/functions/admin-urgency-dashboard/index.ts - Edge Function GET /admin-urgency-dashboard to return comprehensive dashboard data (performance by tier, revenue breakdown, contractor rankings, recent bookings)
- [ ] T168 [US6] Implement dashboard query to combine data from urgency_performance_by_tier, urgency_revenue_breakdown, contractor_urgency_stats VIEWs
- [ ] T169 [US6] Create supabase/functions/admin-urgency-zone-restrictions/index.ts - Edge Function GET/POST/DELETE /admin-urgency-zone-restrictions to manage urgency_zone_restrictions table per FR-033
- [ ] T170 [US6] Implement zone restriction validation: zone_type IN ('postal_code', 'city', 'radius'), zone_value format check

### Admin UI

- [ ] T171 [P] [US6] Create src/components/urgency/admin/TierConfigPanel.tsx - displays one urgency tier configuration with editable fields (global_surcharge_percent, contractor_share_percent, is_active toggle)
- [ ] T172 [P] [US6] Create src/components/urgency/admin/ServiceOverrideForm.tsx - form to add service-specific surcharge override (select service, enter override_percent, reason)
- [ ] T173 [P] [US6] Create src/components/urgency/admin/UrgencyDashboardWidget.tsx - reusable widget component for dashboard metrics (total requests, conversion rate, revenue, etc.)
- [ ] T174 [US6] Create src/app/(admin)/ready-to-go/pricing-config/page.tsx - pricing configuration page with 3 TierConfigPanel components (Express, Rapide, Aujourd'hui) and ServiceOverrideForm
- [ ] T175 [US6] Create src/hooks/useAdminUrgencyPricing.ts - TanStack Query hook with queries: useGetUrgencyPricingConfigs(), mutations: useUpdateUrgencyPricing(urgencyLevel, config), useAddServiceOverride(serviceId, urgencyLevel, surchargePercent, reason)
- [ ] T176 [US6] Integrate useAdminUrgencyPricing() into src/app/(admin)/ready-to-go/pricing-config/page.tsx to load and update configs
- [ ] T177 [US6] Add form validation in pricing-config page: surcharge_percent 0-200%, contractor_share 0-100%, platform_share auto-calculated
- [ ] T178 [US6] Display audit log in pricing-config page showing last 20 config changes with timestamp, admin name, changes made
- [ ] T179 [US6] Create src/app/(admin)/ready-to-go/dashboard/page.tsx - admin urgency analytics dashboard with multiple UrgencyDashboardWidget components
- [ ] T180 [US6] Create src/hooks/useAdminUrgencyDashboard.ts - TanStack Query hook to fetch dashboard data from admin-urgency-dashboard Edge Function
- [ ] T181 [US6] Integrate useAdminUrgencyDashboard() into dashboard page to display: volume by tier, conversion rate, avg response time, on-time rate, revenue breakdown per FR-034
- [ ] T182 [US6] Add charts to admin dashboard: line chart (bookings per day by tier), pie chart (revenue split contractor/platform), bar chart (top 10 contractors by bookings)
- [ ] T183 [US6] Create src/app/(admin)/ready-to-go/contractor-rankings/page.tsx - contractor performance rankings with sortable table (total bookings, on-time rate, avg satisfaction, timeout rate)
- [ ] T184 [US6] Create src/app/(admin)/ready-to-go/zone-restrictions/page.tsx - zone restrictions management with table of current restrictions and add/remove forms
- [ ] T185 [US6] Implement add zone restriction form: select zone_type (postal_code/city/radius), enter zone_value, reason text
- [ ] T186 [US6] Implement remove zone restriction: set is_active=false on selected restriction

**Checkpoint**: Admin can configure pricing, view analytics, and manage zone restrictions

---

## Phase 9: Polish & Cross-Cutting Concerns

**Purpose**: Performance optimization, error handling, documentation across all user stories

- [ ] T187 [P] Implement Redis caching for pricing configs in src/lib/utils/urgency-calculations.ts with 5-minute TTL per research.md
- [ ] T188 [P] Implement Redis caching for travel times in src/lib/utils/travel-time.ts with 60-minute TTL per research.md
- [ ] T189 [P] Implement cache invalidation in admin-urgency-pricing Edge Function when pricing config updated
- [ ] T190 [P] Add comprehensive error handling to all urgency Edge Functions with clear error messages (French for client-facing)
- [ ] T191 [P] Add structured logging to all critical operations: booking created, notification sent, timeout occurred, reassignment triggered, cancellation after 3 attempts
- [ ] T192 [P] Implement performance monitoring for urgency-check-availability Edge Function target <2s per plan.md
- [ ] T193 [P] Implement performance monitoring for urgency-calculate-pricing target <500ms per plan.md
- [ ] T194 [P] Run quickstart.md validation: verify all migrations apply cleanly, seed data loads, Edge Functions deploy, UI pages render
- [ ] T195 [P] Update specs/013-ready-to-go/quickstart.md with any missing setup steps or troubleshooting discovered during implementation

**Checkpoint**: All performance targets met, error handling comprehensive, system production-ready

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No dependencies - start immediately
- **Foundational (Phase 2)**: Depends on Setup - **BLOCKS ALL user stories**
- **US1, US2, US3 (Phases 3-5)**: All depend on Foundational completion - can run in parallel (P1 priority)
- **US4, US5, US6 (Phases 6-8)**: Depend on Foundational - can run in parallel (P2 priority)
- **Polish (Phase 9)**: Depends on all implemented user stories

### User Story Dependencies

- **US1 (Client Selection)**: Independent - reads platform_urgency_pricing
- **US2 (Contractor Opt-In)**: Independent - writes contractor_urgency_config
- **US3 (Availability)**: Depends on US2 (needs contractor_urgency_config) - extends spec 002 algorithm
- **US4 (Notifications)**: Depends on US1+US2+US3 (needs bookings created) - writes urgent_notifications
- **US5 (Analytics)**: Depends on US1+US2+US3+US4 (needs data to analyze) - reads urgency_analytics
- **US6 (Admin Config)**: Independent - manages platform_urgency_pricing

### MVP Strategy (Week 1-3)

**MVP = US1 + US2 + US3 + US4**

1. Complete Phase 1: Setup
2. Complete Phase 2: Foundational (CRITICAL - 100% before user stories)
3. Complete Phase 3: US1 (Client tier selection)
4. Complete Phase 4: US2 (Contractor opt-in)
5. Complete Phase 5: US3 (Availability validation)
6. Complete Phase 6: US4 (Priority notifications)
7. **STOP and VALIDATE**: Test complete urgent booking flow end-to-end
8. Deploy to production with 10 pilot contractors

**Incremental Delivery After MVP**:
- Week 4: Add US5 (Analytics for contractors)
- Week 5: Add US6 (Admin dashboard and configuration)
- Week 6: Add Phase 9 (Polish and optimization)

### Parallel Execution Example

```bash
# After Foundational phase complete:

# US1 Team:
Task: "Create TierSelectionCard.tsx"
Task: "Create UrgencyPricingBreakdown.tsx"
Task: "Create urgency-mode page"

# US2 Team (parallel):
Task: "Create contractor-urgency-config Edge Function"
Task: "Create ContractorUrgencyToggle.tsx"
Task: "Create ready-to-go settings page"

# US3 Team (parallel, but needs US2 contractor_urgency_config data):
Task: "Create urgency-check-availability Edge Function"
Task: "Implement travel time calculation"
Task: "Create useUrgencyAvailability hook"
```

### Within Each User Story

- Models/Migrations before services
- Edge Functions before UI components
- Hooks before page integration
- Core implementation before integration
- Story complete before next priority

---

## Parallel Opportunities

All tasks marked [P] can run simultaneously:

**Phase 1 (Setup)**: T007, T008, T009, T010 - parallel dependency installation

**Phase 2 (Foundational)**: T064, T065, T066, T067, T068, T069 - parallel TypeScript types and utilities

**Phase 3 (US1)**: T070, T071 - parallel UI component creation

**Phase 4 (US2)**: T083, T084, T087, T089, T090, T091 - parallel Edge Functions and UI components

**Phase 6 (US4)**: T138, T139 - parallel notification UI components

**Phase 7 (US5)**: T155, T156 - parallel analytics UI components

**Phase 8 (US6)**: T171, T172, T173 - parallel admin UI components

**Phase 9 (Polish)**: T187, T188, T189, T190, T191, T192, T193, T194, T195 - all parallel optimization tasks

---

## Critical Migration Coordination

**⚠️ IMPORTANT: Coordinate with spec 007**

The `appointment_bookings` table has extensions from:
- **Spec 007**: tip_amount, tip_transfer_id, tip_status (tips feature)
- **Spec 013**: urgency_level, urgency_surcharge_amount, urgency_contractor_bonus, etc. (urgency feature)

**Action Required**:
- Create SEPARATE migration files for each spec
- Spec 007 migration: `20250107HHMMSS_add_tips_to_bookings.sql` (if not already created)
- Spec 013 migration: `20250107140300_appointment_bookings_urgency_extensions.sql` (T029 in this file)
- Do NOT combine them into a single migration
- Each spec manages its own columns independently

**Sample Migration Structure**:

```sql
-- Spec 013 Migration: 20250107140300_appointment_bookings_urgency_extensions.sql
ALTER TABLE appointment_bookings
  ADD COLUMN IF NOT EXISTS urgency_level VARCHAR(20) CHECK (urgency_level IN ('express', 'fast', 'today')),
  ADD COLUMN IF NOT EXISTS urgency_surcharge_amount DECIMAL(10,2) DEFAULT 0,
  ADD COLUMN IF NOT EXISTS urgency_surcharge_percent DECIMAL(5,2) DEFAULT 0,
  ADD COLUMN IF NOT EXISTS urgency_contractor_bonus DECIMAL(10,2) DEFAULT 0,
  ADD COLUMN IF NOT EXISTS urgency_platform_revenue DECIMAL(10,2) DEFAULT 0,
  ADD COLUMN IF NOT EXISTS urgency_requested_at TIMESTAMP,
  ADD COLUMN IF NOT EXISTS urgency_promised_arrival_start TIMESTAMP,
  ADD COLUMN IF NOT EXISTS urgency_promised_arrival_end TIMESTAMP,
  ADD COLUMN IF NOT EXISTS urgency_actual_arrival_time TIMESTAMP,
  ADD COLUMN IF NOT EXISTS urgency_arrived_on_time BOOLEAN,
  ADD COLUMN IF NOT EXISTS urgency_pricing_config_id BIGINT REFERENCES platform_urgency_pricing(id);

COMMENT ON COLUMN appointment_bookings.urgency_level IS 'Palier d''urgence: express (<1h), fast (1h-2h), today (2h-4h). NULL si réservation standard';
-- Add remaining COMMENT statements for all urgency_* columns
```

---

## Success Metrics (Post-Implementation)

**Technical Performance** (measured in Phase 9):
- Availability API: <2s response time (P95)
- Pricing API: <500ms response time (P95)
- Notification delivery: <10s push, <30s SMS, <60s email
- Database queries: All <1s with proper indexes

**Business KPIs** (measure after 6 months):
- Contractor adoption: 25% activate Ready to Go
- Booking volume: 8% of total bookings are urgent
- Conversion rate: 85% urgent requests complete successfully
- On-time arrival: 95% Express, 90% Rapide, 85% Aujourd'hui
- Client satisfaction: >4.5/5 across all tiers
- Revenue impact: +12% platform revenue from urgency premiums

---

## Notes

- **[P] marker**: Tasks that can run in parallel (different files, no dependencies)
- **[Story] label**: Maps task to specific user story (US1, US2, etc.) for traceability
- **File paths**: All paths are absolute, follow Next.js 16 App Router structure
- **Naming**: English file/function names, French SQL comments per constitution
- **Testing**: Run independent tests per user story at each checkpoint
- **Commits**: Commit after each task or logical group of [P] tasks
- **Constitution**: BIGINT IDs, VARCHAR+CHECK (no ENUMs), RLS on ALL tables
- **Dependencies**: Coordinates with specs 002, 003, 004, 007, 008

---

**Last Updated**: 2025-11-07
**Total Tasks**: 195
**Estimated Duration**: 6 weeks (MVP in 3 weeks)
**Status**: Ready for Implementation
