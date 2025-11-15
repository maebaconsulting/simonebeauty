# Implementation Tasks: Gestion des Fuseaux Horaires

**Feature Branch**: `016-timezone-management` | **Date**: 2025-11-10
**Input**: Spec alignée SpecKit avec scenarios de test

## Task Organization

Tasks are organized by implementation phase with dependencies clearly marked. Each task follows the format:

```
- [ ] [TXX] [Priority] [Story] Description with file path
```

**Priority Levels**: P0 (blocking), P1 (MVP critical), P2 (important), P3 (nice-to-have)
**Story Codes**: US1-US5 (see spec.md), INFRA (infrastructure), TEST (testing)

---

## Phase 1: Database Migration (Week 1, Days 1-2) - BLOCKING

### Backup & Safety

- [ ] [T001] [P0] [INFRA] Create full backup of `appointment_bookings` table using pg_dump before any migration → `backups/appointment_bookings_backup_YYYYMMDD.sql`
- [ ] [T002] [P0] [INFRA] Create backup of `contractor_schedules` table → `backups/contractor_schedules_backup_YYYYMMDD.sql`
- [ ] [T003] [P0] [INFRA] Create backup of `contractor_unavailabilities` table → `backups/contractor_unavailabilities_backup_YYYYMMDD.sql`

### Schema Changes

- [ ] [T004] [P0] [US5] Create migration `20250111000030_add_timezone_columns.sql` adding `scheduled_datetime TIMESTAMPTZ` and `booking_timezone VARCHAR(50)` to `appointment_bookings` table per spec.md Technical Requirements section → `supabase/migrations/20250111000030_add_timezone_columns.sql`
- [ ] [T005] [P0] [US5] Create migration log table `timezone_migration_log` with columns: id, booking_id, old_scheduled_date, old_scheduled_time, new_scheduled_datetime, migration_status, error_message, migrated_at per spec.md Technical Requirements → `supabase/migrations/20250111000031_create_migration_log.sql`
- [ ] [T006] [P0] [US5] Create migration script `20250111000032_migrate_booking_times.sql` populating `scheduled_datetime` from existing `scheduled_date + scheduled_time` with timezone 'Europe/Paris', logging all conversions to migration_log table per spec.md User Story 5 → `supabase/migrations/20250111000032_migrate_booking_times.sql`
- [ ] [T007] [P0] [US5] Verify migration success: run SQL query comparing count of migrated rows vs total rows, spot-check 10 random bookings manually, ensure 100% migration rate → Document results in `MIGRATION_REPORT.md`
- [ ] [T008] [P0] [INFRA] Create migration `20250111000033_set_datetime_not_null.sql` making `scheduled_datetime` NOT NULL after successful data migration (only run if T007 passes) → `supabase/migrations/20250111000033_set_datetime_not_null.sql`

**CHECKPOINT**: All data migrated successfully with 0 failures before proceeding to Phase 2

---

## Phase 2: Backend Infrastructure (Week 1, Days 3-4)

### Dependencies Installation

- [ ] [T009] [P0] [INFRA] Install `date-fns-tz@^3.2.0` in main project via `pnpm add date-fns-tz` → Update `package.json`
- [ ] [T010] [P0] [INFRA] Install `date-fns-tz` in Edge Functions by adding to shared deno imports → `supabase/functions/_shared/deps.ts`

### Utility Functions

- [ ] [T011] [P1] [US1] Create timezone utility file with functions: `localTimeToUTC(date, time)`, `utcToLocalTime(utcDate)`, `isValidLocalTime(date, time)`, `getParisOffset(date)` per spec.md Technical Requirements → `lib/utils/timezone.ts`
- [ ] [T012] [P1] [US1] Add JSDoc documentation to all timezone utility functions with examples and DST edge case warnings → `lib/utils/timezone.ts`
- [ ] [T013] [P1] [TEST] Create unit tests for timezone utilities covering: Spring Forward (30 March 2025), Fall Back (27 October 2025), invalid times (02:30 on 30 March), normal dates per spec.md Testing Strategy → `__tests__/timezone.test.ts`
- [ ] [T014] [P1] [TEST] Run unit tests and verify 100% pass rate before proceeding to Edge Function updates → Execute `npm test`

---

## Phase 3: Edge Functions Updates (Week 1, Days 4-5)

### Fix Existing Edge Functions

- [ ] [T015] [P1] [US2] Update `accept-booking-request/index.ts` replacing reference to non-existent `scheduled_at` with `scheduled_datetime`, import `utcToZonedTime` from date-fns-tz, convert to Paris time for notification email per spec.md Backend Changes → `supabase/functions/accept-booking-request/index.ts`
- [ ] [T016] [P1] [US2] Update `refuse-booking-request/index.ts` with same fix as T015 → `supabase/functions/refuse-booking-request/index.ts`
- [ ] [T017] [P1] [US2] Update `mark-service-completed/index.ts` to use `scheduled_datetime` instead of `scheduled_date + scheduled_time` → `supabase/functions/mark-service-completed/index.ts`
- [ ] [T018] [P1] [US2] Create new Edge Function `send-booking-reminders/index.ts` calculating reminder times using `date-fns-tz`, sending reminders at correct local times (J-1 at 20:00 Paris time) per spec.md User Story 2 scenario 2 → `supabase/functions/send-booking-reminders/index.ts`
- [ ] [T019] [P1] [US3] Update `get-weekly-planning/index.ts` to handle DST transitions when calculating weekly availability slots, ensuring no slots are lost or duplicated during transitions per spec.md User Story 3 scenario 4 → `supabase/functions/get-weekly-planning/index.ts`

### Deploy Edge Functions

- [ ] [T020] [P0] [INFRA] Deploy all updated Edge Functions to Supabase via `supabase functions deploy` → Execute command
- [ ] [T021] [P1] [TEST] Test each Edge Function manually using curl/Postman with test booking IDs, verify correct timezone handling → Document results in `EDGE_FUNCTION_TEST_RESULTS.md`

---

## Phase 4: Frontend Updates (Week 2, Days 1-3)

### Booking Flow - Service Selection

- [ ] [T022] [P1] [US1] Update timeslot selection page `app/(authenticated)/booking/timeslot/page.tsx` to use timezone utilities when submitting selected time, convert user input to UTC with Paris timezone context per spec.md User Story 1 → `app/(authenticated)/booking/timeslot/page.tsx`
- [ ] [T023] [P1] [US1] Add timezone validation in timeslot form: check if selected time is valid (not during Spring Forward gap 02:00-03:00 on 30 March) using `isValidLocalTime()` utility per spec.md Edge Case 1 → `app/(authenticated)/booking/timeslot/page.tsx`
- [ ] [T024] [P1] [US1] Display user-friendly error message if invalid time selected: "Cette heure n'existe pas en raison du passage à l'heure d'été. Veuillez sélectionner 03:00 ou ultérieur" per spec.md Edge Case 1 → `app/(authenticated)/booking/timeslot/page.tsx`

### Booking Flow - Confirmation & Display

- [ ] [T025] [P1] [US1] Update confirmation page `app/(authenticated)/booking/confirmation/page.tsx` to display times using `utcToLocalTime()` utility, showing formatted local time (dd/MM/yyyy à HH:mm) per spec.md User Story 1 scenario 4 → `app/(authenticated)/booking/confirmation/page.tsx`
- [ ] [T026] [P1] [US4] Update client bookings list `app/(authenticated)/client/bookings/page.tsx` to display all booking times in local Paris time with consistent formatting → `app/(authenticated)/client/bookings/page.tsx`

### Contractor Dashboard

- [ ] [T027] [P1] [US2] Update contractor dashboard `app/(authenticated)/contractor/dashboard/page.tsx` to display all booking times in local Paris time, ensuring times remain consistent across DST transitions per spec.md User Story 2 scenario 3 → `app/(authenticated)/contractor/dashboard/page.tsx`
- [ ] [T028] [P1] [US2] Update pending requests list `components/contractor/PendingRequestsList.tsx` to display booking times with timezone context → `components/contractor/PendingRequestsList.tsx`
- [ ] [T029] [P1] [US2] Update upcoming bookings list `components/contractor/UpcomingBookingsList.tsx` to display times using timezone utilities → `components/contractor/UpcomingBookingsList.tsx`

### Contractor Schedule Configuration

- [ ] [T030] [P1] [US3] Update schedule editor `components/contractor/Planning/ScheduleEditor.tsx` to use timezone-aware calculations when saving schedule times, converting to UTC with Paris timezone per spec.md User Story 3 → `components/contractor/Planning/ScheduleEditor.tsx`
- [ ] [T031] [P1] [US3] Update unavailability modal `components/contractor/Planning/AddUnavailabilityModal.tsx` fixing bug at lines 147-154 where `startDateTime.setHours()` incorrectly uses browser timezone instead of Paris timezone per previous analysis → `components/contractor/Planning/AddUnavailabilityModal.tsx`

### Admin Dashboard

- [ ] [T032] [P2] [US4] Update admin bookings list page to display both local time and UTC time in separate columns, add timezone column showing "Europe/Paris", add visual indicator for bookings on DST transition days (30 March, 27 October) per spec.md User Story 4 scenario 1 → `app/admin/bookings/page.tsx`
- [ ] [T033] [P2] [US4] Add CSV export functionality including columns: `scheduled_date`, `scheduled_time_local`, `scheduled_time_utc`, `timezone`, `is_dst_aware` per spec.md User Story 4 scenario 2 → `app/admin/bookings/export.ts`
- [ ] [T034] [P2] [US4] Create admin timezone diagnostic tool page showing detailed timezone info for any booking ID (creation time, timezone context, UTC timestamp, local time, DST status) per spec.md User Story 4 scenario 4 → `app/admin/timezone-debug/page.tsx`

---

## Phase 5: Comprehensive Testing (Week 2, Days 4-5)

### E2E Tests - Critical Scenarios

- [ ] [T035] [P1] [TEST] Create E2E test "Client books on DST Spring Forward day (30 March 2025 at 14:00)" verifying time stored as 12:00 UTC, displayed as 14:00 CEST, contractor notification shows 14:00 per spec.md User Story 1 scenario 2 → `__tests__/e2e/timezone-spring-forward.spec.ts`
- [ ] [T036] [P1] [TEST] Create E2E test "Client books on DST Fall Back day (27 October 2025 at 14:00)" verifying time stored as 13:00 UTC, displayed as 14:00 CET per spec.md User Story 1 scenario 5 → `__tests__/e2e/timezone-fall-back.spec.ts`
- [ ] [T037] [P1] [TEST] Create E2E test "Client books before DST transition for date after transition" creating booking on 15 Feb for 30 April at 09:00, verifying correct UTC offset applied (07:00 UTC for summer) per spec.md User Story 3 scenario 3 → `__tests__/e2e/timezone-cross-transition.spec.ts`
- [ ] [T038] [P1] [TEST] Create E2E test "Contractor configures weekly schedule during DST transition week" verifying no slots lost or duplicated per spec.md User Story 3 scenario 4 → `__tests__/e2e/timezone-schedule-dst.spec.ts`
- [ ] [T039] [P1] [TEST] Create E2E test "Client attempts to book invalid time (02:30 on 30 March)" verifying error message displayed and 03:00 suggested per spec.md Edge Case 1 → `__tests__/e2e/timezone-invalid-time.spec.ts`

### E2E Tests - Edge Cases

- [ ] [T040] [P2] [TEST] Create E2E test for Edge Case 2 "Ambiguous time during Fall Back" (27 Oct at 02:30) verifying first occurrence used per spec.md Edge Case 2 → `__tests__/e2e/timezone-ambiguous-time.spec.ts`
- [ ] [T041] [P2] [TEST] Create E2E test for Edge Case 3 "Service crossing DST transition" (4h service from 23:00 on 29 March) verifying end time calculated correctly per spec.md Edge Case 3 → `__tests__/e2e/timezone-service-crossing-dst.spec.ts`
- [ ] [T042] [P2] [TEST] Create E2E test for Edge Case 4 "Booking modification after DST transition" verifying no time shift per spec.md Edge Case 4 → `__tests__/e2e/timezone-modify-after-dst.spec.ts`
- [ ] [T043] [P2] [TEST] Create E2E test for Edge Case 6 "Service crossing midnight" (3h service 22:00-01:00) verifying date change handled correctly per spec.md Edge Case 6 → `__tests__/e2e/timezone-cross-midnight.spec.ts`

### Manual Testing Checklist

- [ ] [T044] [P1] [TEST] Manual test: Create booking on 30 March 2025 at 14:00, verify contractor receives notification email with "14:00" (not 13:00 or 12:00), verify booking displays correctly in contractor dashboard → Document results
- [ ] [T045] [P1] [TEST] Manual test: Create booking on 27 October 2025 at 14:00, verify no time shift occurs, verify reminder sent at correct time → Document results
- [ ] [T046] [P1] [TEST] Manual test: Configure contractor schedule on 29 March, verify available slots calculated correctly for 30 March (after DST) → Document results
- [ ] [T047] [P1] [TEST] Manual test: Verify all existing bookings (migrated data) display correct times without shifts → Spot-check 20 random bookings

---

## Phase 6: Deployment & Monitoring (Week 3)

### Pre-Deployment Checks

- [ ] [T048] [P0] [INFRA] Run full test suite (unit + E2E) and verify 100% pass rate → Execute `npm run test:all`
- [ ] [T049] [P0] [INFRA] Review migration log table for any failed migrations, manually fix any failures → Check `timezone_migration_log` table
- [ ] [T050] [P0] [INFRA] Create deployment checklist with rollback plan in case of critical issues → Document in `DEPLOYMENT_CHECKLIST.md`

### Deployment

- [ ] [T051] [P0] [INFRA] Deploy database migrations to production Supabase instance → Execute `supabase db push`
- [ ] [T052] [P0] [INFRA] Verify migration success in production: check row counts, spot-check bookings → Query production DB
- [ ] [T053] [P0] [INFRA] Deploy updated Edge Functions to production → Execute `supabase functions deploy`
- [ ] [T054] [P0] [INFRA] Deploy frontend updates to Vercel → Execute `git push origin 016-timezone-management` (triggers Vercel deploy)
- [ ] [T055] [P1] [INFRA] Monitor Vercel deployment logs for any timezone-related errors → Check Vercel dashboard

### Post-Deployment Validation

- [ ] [T056] [P1] [TEST] Create test booking in production for 30 March 2025 at 14:00, verify all steps work correctly → Use test account
- [ ] [T057] [P1] [TEST] Verify contractor receives notification at correct time in production → Check test contractor email
- [ ] [T058] [P1] [TEST] Verify admin dashboard displays timezone info correctly in production → Check admin panel
- [ ] [T059] [P1] [INFRA] Set up error monitoring alert for any timezone conversion errors in Edge Functions → Configure Sentry/logging

### Monitoring (First 2 Weeks)

- [ ] [T060] [P1] [INFRA] Monitor support tickets daily for any timezone-related complaints → Track in `TIMEZONE_MONITORING.md`
- [ ] [T061] [P1] [INFRA] Check `timezone_migration_log` table weekly for any late failures → Run SQL query
- [ ] [T062] [P1] [INFRA] Collect contractor feedback via email survey: "Did you receive notifications at the correct time?" → Send survey
- [ ] [T063] [P2] [INFRA] Analyze Sentry logs for any timezone conversion errors → Review Sentry dashboard

---

## Phase 7: Cleanup & Documentation (Week 4+)

### Data Cleanup (After 1 Month Stable Operation)

- [ ] [T064] [P3] [INFRA] Create migration `20250211000034_drop_old_time_columns.sql` dropping deprecated columns `scheduled_date` and `scheduled_time` from `appointment_bookings` (only if zero issues reported) per spec.md Technical Requirements → `supabase/migrations/20250211000034_drop_old_time_columns.sql`
- [ ] [T065] [P3] [INFRA] Remove old timezone conversion code and feature flags → Clean up codebase

### Documentation

- [ ] [T066] [P2] [INFRA] Create user-facing documentation explaining how timezone handling works, including DST transitions → `docs/TIMEZONE_HANDLING.md`
- [ ] [T067] [P2] [INFRA] Update API documentation with timezone requirements for all booking-related endpoints → `docs/API.md`
- [ ] [T068] [P2] [INFRA] Document migration process and lessons learned for future reference → `docs/MIGRATION_LESSONS.md`
- [ ] [T069] [P2] [INFRA] Update quickstart guide with timezone setup instructions for new developers → `QUICKSTART.md`

---

## Success Metrics & Validation

**Metrics to Track (See spec.md Success Metrics)**:
- Timezone-related support tickets: Target 0-1 per week (from 5-10/week baseline)
- Incorrect notification times: Target 0% (from ~15% baseline)
- DST transition incidents: Target 0 (from multiple incidents per year)
- Migration success rate: Target 100%

**Validation Criteria**:
- [ ] All acceptance scenarios from spec.md pass in production
- [ ] Zero support tickets related to timezone issues for 2 consecutive weeks
- [ ] All E2E tests pass consistently
- [ ] Contractor feedback survey shows >95% satisfaction with notification timing

---

## Dependencies & Blockers

**External Dependencies**:
- `date-fns-tz@^3.2.0` library (T009, T010)
- Supabase database access for migrations (T004-T008)

**Internal Dependencies**:
- Phase 1 MUST complete before Phase 2 (data migration blocking)
- Phase 2 MUST complete before Phase 3 (utilities needed for Edge Functions)
- Phase 3 MUST complete before Phase 4 (backend must be ready for frontend)
- Phases 1-4 MUST complete before Phase 5 (testing requires full implementation)

**Risk Mitigation**:
- Backups created before migration (T001-T003)
- Old columns kept for 1 month as rollback mechanism
- Migration log tracks all conversions for debugging (T005)
- Comprehensive testing before production deployment (Phase 5)

---

## Notes

- **Critical Dates**: DST transitions in 2025 are 30 March (Spring Forward) and 27 October (Fall Back)
- **Timezone Assumption**: All services in France use `Europe/Paris` timezone
- **Testing Priority**: Focus E2E tests on DST transition dates (30 March, 27 October 2025)
- **Deployment Window**: Ideally deploy BEFORE 30 March 2025 to catch first DST transition
- **Rollback Plan**: If critical issues, can revert to old columns and disable new timezone code via feature flag
