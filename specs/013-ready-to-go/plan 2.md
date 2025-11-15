# Implementation Plan
# Feature 013: Service d'Urgence Ready to Go

**Date:** 2025-11-07
**Status:** Ready for Implementation
**Branch:** `013-ready-to-go`

---

## Feature Summary

The Ready to Go urgent booking service allows clients to request immediate services with 3 pricing tiers:

- **Express** (<1h): +50% surcharge
- **Rapide** (1h-2h): +30% surcharge
- **Aujourd'hui** (2h-4h): +15% surcharge

Key characteristics:
- **Platform-level pricing configuration**: Admins control surcharges and revenue splits
- **Simple contractor opt-in**: ON/OFF toggle + availability time slots
- **Multi-tier pricing with transparency**: Clients see total price, surcharge, and contractor bonus
- **Priority notifications**: Push + SMS (Express) + Email with 5-minute response window
- **Intelligent availability**: Travel time validation, weekly booking limits, real-time slot checking
- **Comprehensive analytics**: Dashboard with conversion rates, response times, on-time arrival tracking

---

## Technical Context

### Technology Stack

**Frontend:**
- Next.js 16 (React 19, App Router)
- TypeScript (strict mode)
- TanStack Query (data fetching)
- Tailwind CSS v4
- shadcn/ui components

**Backend:**
- Supabase PostgreSQL 14+
- Supabase Edge Functions (Deno runtime)
- Row Level Security (RLS) on all tables

**External Services:**
- Google Distance Matrix API (travel time calculation)
- Twilio/Vonage (SMS notifications for Express tier)
- Resend (email notifications)
- Stripe (payment with urgency premiums)

**Infrastructure:**
- Redis caching (pricing configs, travel times)
- pg_cron (weekly counter reset, notification timeouts)
- PostGIS (geographic calculations)

### Architecture Decisions

1. **On-the-fly Pricing Calculation**: Calculate from platform config on each request for accuracy (vs pre-calculating and caching)
2. **Database-side Availability**: Extend spec 002 algorithm for consistency
3. **Sequential Reassignment**: Try up to 3 contractors one at a time (vs parallel)
4. **Push-First Notifications**: Push → SMS (Express) → Email fallback chain
5. **VARCHAR Status Fields**: No PostgreSQL ENUMs, use CHECK constraints for flexibility

---

## Project Structure

All code follows the project constitution structure:

```
simone-paris-platform/
├── src/
│   ├── app/
│   │   ├── (client)/
│   │   │   ├── booking/
│   │   │   │   ├── urgency-mode/           # Urgency tier selection
│   │   │   │   ├── urgency-availability/   # Available contractors
│   │   │   │   └── urgency-confirmation/   # Booking confirmation with premium
│   │   ├── (contractor)/
│   │   │   ├── settings/
│   │   │   │   └── ready-to-go/            # Contractor opt-in configuration
│   │   │   ├── dashboard/
│   │   │   │   └── urgency-stats/          # Personal urgency statistics
│   │   │   └── notifications/
│   │   │       └── urgent/                 # Urgent booking notifications
│   │   └── (admin)/
│   │       └── ready-to-go/
│   │           ├── dashboard/              # Analytics dashboard
│   │           ├── pricing-config/         # Tier configuration
│   │           └── contractor-rankings/    # Performance rankings
│   ├── components/
│   │   ├── urgency/
│   │   │   ├── TierSelectionCard.tsx       # Tier cards (Express/Rapide/Aujourd'hui)
│   │   │   ├── UrgencyPricingBreakdown.tsx # Price transparency display
│   │   │   ├── UrgentNotificationBadge.tsx # Badge with urgency level
│   │   │   └── ContractorUrgencyToggle.tsx # Opt-in toggle
│   │   └── ui/                             # shadcn/ui components
│   ├── hooks/
│   │   ├── useUrgencyAvailability.ts       # Check urgency availability
│   │   ├── useUrgencyPricing.ts            # Calculate urgency pricing
│   │   ├── useContractorUrgencyConfig.ts   # Manage contractor config
│   │   └── useUrgentNotifications.ts       # Handle urgent notifications
│   ├── lib/
│   │   ├── supabase/
│   │   │   ├── client.ts
│   │   │   └── server.ts
│   │   └── utils/
│   │       ├── urgency-calculations.ts     # Pricing calculation logic
│   │       └── travel-time.ts              # Google Distance Matrix wrapper
│   └── types/
│       └── urgency.ts                      # TypeScript types for urgency
├── supabase/
│   ├── migrations/
│   │   ├── 20251107_001_platform_urgency_pricing.sql
│   │   ├── 20251107_002_contractor_urgency_config.sql
│   │   ├── 20251107_003_services_urgency_extensions.sql
│   │   ├── 20251107_004_appointment_bookings_urgency_extensions.sql
│   │   ├── 20251107_005_urgent_notifications.sql
│   │   ├── 20251107_006_urgency_analytics.sql
│   │   ├── 20251107_007_urgency_zone_restrictions.sql
│   │   ├── 20251107_008_urgency_views.sql
│   │   ├── 20251107_009_urgency_triggers.sql
│   │   └── 20251107_010_urgency_seed_data.sql
│   └── functions/
│       ├── urgency-check-availability/
│       │   └── index.ts
│       ├── urgency-calculate-pricing/
│       │   └── index.ts
│       ├── urgency-send-notification/
│       │   └── index.ts
│       ├── urgency-notification-respond/
│       │   └── index.ts
│       ├── urgency-notification-timeout-handler/
│       │   └── index.ts
│       ├── urgency-reassign-booking/
│       │   └── index.ts
│       ├── contractor-urgency-config/
│       │   └── index.ts
│       ├── contractor-urgency-stats/
│       │   └── index.ts
│       ├── admin-urgency-dashboard/
│       │   └── index.ts
│       └── admin-urgency-performance-by-tier/
│           └── index.ts
└── specs/
    └── 013-ready-to-go/
        ├── spec.md                         # Feature specification (DONE)
        ├── plan.md                         # This file
        ├── research.md                     # Technical research (DONE)
        ├── data-model.md                   # Database schema (DONE)
        ├── quickstart.md                   # Setup guide (DONE)
        └── contracts/                      # OpenAPI specs (DONE)
            ├── urgency-availability.yaml
            ├── urgency-pricing.yaml
            ├── contractor-urgency.yaml
            ├── urgency-notifications.yaml
            └── urgency-analytics.yaml
```

---

## Constitutional Compliance Check

### 1. ID Strategy ✅
- BIGINT auto-increment for: `platform_urgency_pricing`, `contractor_urgency_config`, `urgent_notifications`, `urgency_analytics`, `urgency_zone_restrictions`
- UUID only for `auth.users` references (contractor_id → `profiles.id`)

### 2. Enum Strategy ✅
- No PostgreSQL ENUMs
- VARCHAR with CHECK constraints for:
  - `urgency_level` CHECK IN ('express', 'fast', 'today')
  - `status` CHECK IN ('pending', 'confirmed', 'refused', 'timeout')
  - `zone_type` CHECK IN ('postal_code', 'city', 'radius')

### 3. Naming & Documentation ✅
- **Table names:** English, snake_case (e.g., `platform_urgency_pricing`, `urgent_notifications`)
- **Column names:** English, snake_case (e.g., `urgency_level`, `contractor_share_percent`)
- **SQL comments:** French for all business-critical columns
- **UI labels:** French (e.g., "Express (<1h)", "Rapide (1h-2h)")

### 4. Security-First Architecture ✅
- RLS enabled on ALL tables
- Policies:
  - Public: Read active pricing configs and zone restrictions
  - Contractors: Read/write own urgency config and notifications
  - Clients: Read availability and pricing
  - Admins: Full access to all tables and analytics

### 5. Premium User Experience ✅
- Mobile-first responsive design for urgency tier selection
- Clear pricing transparency (total, surcharge, contractor bonus visible)
- Real-time availability checks (<2s response time)
- Priority push notifications (<10s delivery)
- Progressive enhancement (works without push notifications via SMS/email)

### 6. Intelligent Booking System ✅
- Extends spec 002 availability algorithm
- Integrates constraints:
  - Contractor Ready to Go enabled
  - Within availability time slots
  - Travel time < tier limit (30 min for Express/Rapide, 45 min for Aujourd'hui)
  - Weekly booking limit not exceeded
  - No conflicting existing bookings

### 7. API-First Backend ✅
- All business logic in Edge Functions (Deno)
- TypeScript for type safety
- Error handling with clear messages
- Logging for critical operations (notification sent, timeout, reassignment)

### 8. Payment Flow Integrity ✅
- Extends existing Stripe payment flow
- Pre-authorize total amount (base price + urgency premium)
- Capture on service completion
- Split payment:
  - Base price → contractor (minus commission)
  - Urgency contractor bonus → contractor
  - Urgency platform revenue → platform

### 9. Multi-Role Architecture ✅
- **Clients:** Select urgency tier, view pricing, book urgent services
- **Contractors:** Opt-in to Ready to Go, set availability, receive priority notifications, view urgency stats
- **Admins:** Configure pricing tiers, view analytics dashboard, manage zone restrictions

### 10. Testing & Quality Assurance ✅
- Acceptance criteria defined in spec.md (5 user stories, 38 scenarios)
- Test cases for:
  - Unit: Pricing calculation, availability logic, notification routing
  - Integration: End-to-end booking flow, reassignment, timeout handling
  - Load: 100 concurrent availability checks, 50 simultaneous notifications
- Performance targets: <2s availability check, <1s pricing calculation

---

## Dependencies

### Spec 007 (Contractor Interface)
- **Reads:** `contractor_services`, `contractors.slug`, `contractors` table
- **Coordinates:** `appointment_bookings` tip columns (ensure no conflicts)
- **Status:** Approved, must be implemented first

### Spec 003 (Booking Flow)
- **Reads:** `appointment_bookings`, `services`, `client_addresses`
- **Extends:** Payment flow to handle urgency premiums
- **Status:** Approved, urgency is optional enhancement

### Spec 002 (Availability Calculation)
- **Uses:** Existing availability algorithm
- **Extends:** Add urgency-specific filters (travel time, Ready to Go slots)
- **Status:** Approved, algorithm is foundation

### Spec 004 (Payment)
- **Extends:** Stripe PaymentIntent to include urgency premium
- **Coordinates:** Payment split (base + bonus + commission)
- **Status:** Approved, payment flow must support premiums

### Spec 008 (Notifications)
- **Uses:** PWA push notification system
- **Extends:** Priority notification channel for urgent bookings
- **Status:** Approved, push infrastructure required

---

## Implementation Phases

### Phase 1: Platform Configuration (Week 1)
**Goal:** Set up database schema and admin configuration

**Tasks:**
1. Run migrations for core tables:
   - `platform_urgency_pricing`
   - `contractor_urgency_config`
   - `services` urgency extensions
   - `appointment_bookings` urgency extensions
2. Seed initial pricing configs (Express 50%, Rapide 30%, Aujourd'hui 15%)
3. Build admin pricing configuration UI:
   - View current tier configs
   - Edit global surcharge percentages
   - Add service-specific overrides
   - Toggle tier activation
4. Deploy `urgency-calculate-pricing` Edge Function
5. Test pricing calculation with various scenarios

**Deliverables:**
- Database schema deployed to production
- Admin can modify tier pricing configs
- Pricing calculation API functional

### Phase 2: Contractor Opt-In (Week 2)
**Goal:** Enable contractors to activate Ready to Go

**Tasks:**
1. Run migrations for notifications and analytics tables:
   - `urgent_notifications`
   - `urgency_analytics`
   - `urgency_zone_restrictions`
2. Build contractor settings UI:
   - Ready to Go ON/OFF toggle
   - Availability slots configuration (days + hours)
   - Weekly limit slider
   - Potential earnings calculator
3. Deploy contractor config Edge Functions:
   - `contractor-urgency-config` (GET/PUT)
   - `contractor-urgency-stats` (GET)
   - `contractor-urgency-potential-earnings` (POST)
4. Invite 10 pilot contractors
5. Test opt-in flow and config management

**Deliverables:**
- Contractor can activate Ready to Go
- Contractor can configure availability slots
- 10 pilot contractors enrolled

### Phase 3: Client Booking Flow (Week 3)
**Goal:** Allow clients to book urgent services

**Tasks:**
1. Build urgency mode UI components:
   - Urgency mode toggle in booking flow
   - Tier selection cards (Express/Rapide/Aujourd'hui)
   - Pricing breakdown display (total, surcharge, contractor bonus)
   - Available contractors list with urgency slots
2. Deploy availability Edge Functions:
   - `urgency-check-availability` (POST)
   - `urgency-contractor-slots` (POST)
3. Integrate travel time calculation (Google Distance Matrix)
4. Extend booking confirmation to handle urgency premiums
5. Test end-to-end booking flow with pilot contractors

**Deliverables:**
- Client can select urgency tier
- Client can see available contractors with pricing
- Client can complete urgent booking
- Payment includes urgency premium

### Phase 4: Notifications & Analytics (Week 4)
**Goal:** Priority notifications and admin dashboard

**Tasks:**
1. Deploy notification Edge Functions:
   - `urgency-send-notification` (POST)
   - `urgency-notification-respond` (POST)
   - `urgency-notification-timeout-handler` (background)
   - `urgency-reassign-booking` (internal)
2. Build contractor notification UI:
   - Urgent notification card with badge
   - Accept/Refuse buttons with 5-minute countdown
   - Notification history list
3. Implement reassignment logic (try 3 contractors)
4. Set up pg_cron for timeout checks
5. Build admin analytics dashboard:
   - Performance by tier (conversion, response time, on-time rate)
   - Revenue breakdown (surcharges, bonuses, platform revenue)
   - Contractor rankings (most bookings, best acceptance rate)
6. Deploy analytics Edge Functions:
   - `admin-urgency-dashboard` (GET)
   - `admin-urgency-performance-by-tier` (GET)
   - `admin-urgency-revenue-breakdown` (GET)
   - `admin-urgency-contractor-rankings` (GET)
7. Test notification flow and analytics accuracy

**Deliverables:**
- Contractors receive priority notifications
- 5-minute timeout triggers reassignment
- Admin can view comprehensive analytics
- Metrics tracked: conversion, response time, satisfaction, revenue

### Phase 5: Pilot & Optimization (Week 5)
**Goal:** Test with real users and optimize

**Tasks:**
1. Soft launch to 100 beta clients
2. Monitor key metrics:
   - Conversion rate by tier (target: >60%)
   - Response time (target: <3 min)
   - On-time arrival rate (target: >90%)
   - Client satisfaction (target: >4.5/5)
3. Collect feedback from clients and contractors
4. Optimize:
   - Adjust pricing if conversion too low
   - Improve notification copy if response time high
   - Add contractor incentives if supply low
5. Implement caching:
   - Redis for pricing configs (5 min TTL)
   - Redis for travel times (60 min TTL)
   - Redis for contractor availability (10 min TTL)
6. Load test:
   - 100 concurrent availability checks
   - 50 simultaneous notifications
7. Fix bugs and refine UX based on feedback

**Deliverables:**
- 100 beta clients tested urgency mode
- Metrics meeting targets or action plan to improve
- Performance optimized (caching, indexes)
- Bug fixes and UX improvements deployed

### Phase 6: Full Launch (Week 6)
**Goal:** Launch to all users

**Tasks:**
1. Enable Ready to Go for all contractors (opt-in)
2. Enable urgency mode for all clients
3. Marketing campaign:
   - Email to clients announcing Ready to Go
   - Email to contractors explaining benefits
   - Social media posts highlighting urgency tiers
4. Monitor production metrics daily
5. Set up alerts:
   - No contractors available > 10 times/hour → Notify admin
   - Conversion rate < 60% → Email ops team
   - Timeout rate > 30% → Check notification system
6. Create runbook for common issues
7. Train support team on Ready to Go features

**Deliverables:**
- Ready to Go available to all users
- Marketing campaign launched
- Alerts configured
- Support team trained

---

## Success Metrics

### Technical Performance
- **Availability API:** <2s response time (P95)
- **Pricing API:** <500ms response time (P95)
- **Notification delivery:** <10s (push), <30s (SMS), <60s (email)
- **Database queries:** All <1s (with proper indexes)

### Business KPIs (6 months)
- **Contractor adoption:** 25% of contractors activate Ready to Go
- **Booking volume:** 8% of total bookings are urgent
- **Conversion rate:** 85% of urgent requests result in completed bookings
- **On-time arrival:** 95% Express, 90% Rapide, 85% Aujourd'hui
- **Client satisfaction:** >4.5/5 across all tiers
- **Revenue impact:** +12% platform revenue from urgency premiums

### Operational Metrics
- **Response time:** <3 min Express, <5 min Rapide, <8 min Aujourd'hui
- **Timeout rate:** <15% (contractors not responding within 5 min)
- **Reassignment success:** >85% find contractor within 3 attempts
- **Weekly booking distribution:** Contractors average 3-5 urgent bookings/week

---

## Risk Assessment

### High Risk
1. **Insufficient contractor supply**
   - **Mitigation:** Pilot with 10 contractors first, adjust pricing if needed, add contractor incentives
   - **Contingency:** Launch with "Aujourd'hui" tier only until supply increases

2. **Notification delivery failures**
   - **Mitigation:** Multi-channel (push + SMS + email), test thoroughly in pilot
   - **Contingency:** Manual assignment by admin if automated notifications fail

### Medium Risk
3. **Travel time calculation inaccurate**
   - **Mitigation:** Use Google Distance Matrix API, fallback to prudent estimate if API fails
   - **Contingency:** Manual verification by contractor before accepting

4. **Client confusion with 3 tiers**
   - **Mitigation:** Clear labels, pricing transparency, show contractor bonus to build trust
   - **Contingency:** Add tooltips, onboarding tutorial, simplified 2-tier version

### Low Risk
5. **Database performance degradation**
   - **Mitigation:** Proper indexes, caching strategy, load testing
   - **Contingency:** Increase Supabase plan, optimize queries

6. **Pricing config errors**
   - **Mitigation:** Admin UI validation, test calculations, audit log
   - **Contingency:** Rollback to previous config, manual price adjustments

---

## Monitoring & Alerts

### Critical Alerts (Immediate Action)
- No contractors available for 10+ urgent requests in 1 hour → Notify admin via SMS
- Notification system failure (0 sent in 10 min) → Page on-call engineer
- Payment capture failure rate >5% → Notify finance team

### Warning Alerts (Review within 1 hour)
- Conversion rate < 60% for any tier in last 24h → Email ops team
- Timeout rate > 30% for any tier → Check notification delivery
- Travel time API failure rate > 10% → Investigate Google Maps API status

### Monitoring Dashboards
1. **Real-time Operational Dashboard:**
   - Current urgent bookings in progress
   - Pending notifications (awaiting contractor response)
   - Availability by tier (contractors available now)

2. **Daily Performance Dashboard:**
   - Conversion rate by tier (last 7 days trend)
   - Response time distribution
   - On-time arrival rate

3. **Weekly Business Dashboard:**
   - Revenue breakdown (surcharges, bonuses, platform revenue)
   - Contractor rankings (top 10 performers)
   - Client satisfaction trends

---

## Documentation

### For Developers
- [x] `research.md` - Technical decisions and architecture
- [x] `data-model.md` - Complete database schema with examples
- [x] `quickstart.md` - Setup and testing instructions
- [x] OpenAPI contracts - API specifications for all endpoints

### For Users
- [ ] Client help article: "How to book an urgent service with Ready to Go"
- [ ] Contractor help article: "Earning more with Ready to Go urgent bookings"
- [ ] FAQ: "Understanding urgency pricing tiers"

### For Support Team
- [ ] Runbook: "Troubleshooting Ready to Go issues"
- [ ] Script: "Handling client complaints about urgency pricing"
- [ ] Script: "Helping contractors optimize their Ready to Go settings"

---

## Post-Launch Iterations

### V1.1 (1 month after launch)
- Add contractor performance badges (e.g., "Top Ready to Go Pro")
- Implement dynamic pricing based on demand (surge pricing lite)
- Add client notification preferences (SMS opt-in for non-Express tiers)

### V1.2 (3 months after launch)
- Predictive analytics: Suggest contractors to activate Ready to Go during high-demand periods
- Client loyalty program: Discounts on urgency surcharges for frequent users
- Contractor scheduling: Auto-activate Ready to Go during configured high-availability periods

### V2.0 (6 months after launch)
- "Super Express" tier (<30 min, +70% surcharge)
- Automated contractor routing: System assigns optimal contractor based on location + performance
- Real-time contractor GPS tracking during urgent bookings

---

## Approval & Sign-Off

- [ ] **Product Lead:** Feature scope approved
- [ ] **Engineering Lead:** Technical architecture approved
- [ ] **Database Lead:** Schema design approved
- [ ] **Security Lead:** RLS policies and access control approved
- [ ] **Finance Lead:** Pricing model and revenue split approved
- [ ] **Operations Lead:** Notification strategy and support plan approved

---

**Last Updated:** 2025-11-07
**Version:** 1.0
**Status:** Ready for Implementation
