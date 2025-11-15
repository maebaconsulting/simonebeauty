# Quickstart Guide
# Feature 013: Service d'Urgence Ready to Go

**Date:** 2025-11-07
**Branch:** `013-ready-to-go`
**Status:** Ready for Implementation

---

## Overview

This guide provides step-by-step instructions to set up and test the Ready to Go urgent booking feature with 3 pricing tiers (Express <1h, Rapide 1h-2h, Aujourd'hui 2h-4h).

---

## Prerequisites

- Supabase project configured
- PostgreSQL 14+ with PostGIS extension
- Node.js 18+ and Deno runtime
- Google Distance Matrix API key
- Twilio/Vonage account for SMS (Express tier)
- Resend API key for emails
- PWA push notifications configured (spec 008)

---

## Environment Variables

Add these to your `.env.local` and Supabase Edge Functions secrets:

```bash
# Google Maps API
GOOGLE_MAPS_API_KEY=your_google_maps_key

# SMS Provider (Twilio or Vonage)
TWILIO_ACCOUNT_SID=your_twilio_sid
TWILIO_AUTH_TOKEN=your_twilio_token
TWILIO_PHONE_NUMBER=+33612345678

# Email Provider
RESEND_API_KEY=your_resend_key

# Push Notifications (if not already set from spec 008)
VAPID_PUBLIC_KEY=your_vapid_public_key
VAPID_PRIVATE_KEY=your_vapid_private_key

# Urgency Configuration
URGENCY_NOTIFICATION_TIMEOUT_SECONDS=300  # 5 minutes
URGENCY_MAX_CONTRACTOR_ATTEMPTS=3
URGENCY_TRAVEL_TIME_CACHE_TTL=3600  # 1 hour
```

---

## Migration Files

Execute migrations in the following order:

### 1. Core Tables (Week 1)

**File:** `supabase/migrations/20251107_001_platform_urgency_pricing.sql`
```sql
-- Create platform_urgency_pricing table
-- See data-model.md for complete schema
```

**File:** `supabase/migrations/20251107_002_contractor_urgency_config.sql`
```sql
-- Create contractor_urgency_config table
-- See data-model.md for complete schema
```

**File:** `supabase/migrations/20251107_003_services_urgency_extensions.sql`
```sql
-- Add urgency columns to services table
ALTER TABLE services ADD COLUMN IF NOT EXISTS urgency_enabled BOOLEAN DEFAULT true;
ALTER TABLE services ADD COLUMN IF NOT EXISTS urgency_max_duration_minutes INT;
```

**File:** `supabase/migrations/20251107_004_appointment_bookings_urgency_extensions.sql`
```sql
-- Add urgency columns to appointment_bookings table
-- IMPORTANT: Coordinate with spec 007 (tip columns already added)
-- See data-model.md for complete schema
```

### 2. Notifications & Analytics (Week 2)

**File:** `supabase/migrations/20251107_005_urgent_notifications.sql`
```sql
-- Create urgent_notifications table
-- See data-model.md for complete schema
```

**File:** `supabase/migrations/20251107_006_urgency_analytics.sql`
```sql
-- Create urgency_analytics table
-- See data-model.md for complete schema
```

**File:** `supabase/migrations/20251107_007_urgency_zone_restrictions.sql`
```sql
-- Create urgency_zone_restrictions table
-- See data-model.md for complete schema
```

### 3. Views & Functions (Week 3)

**File:** `supabase/migrations/20251107_008_urgency_views.sql`
```sql
-- Create dashboard views
-- urgency_performance_by_tier
-- contractor_urgency_stats
-- urgency_revenue_breakdown
-- See data-model.md for complete SQL
```

**File:** `supabase/migrations/20251107_009_urgency_triggers.sql`
```sql
-- Create triggers and functions
-- reset_weekly_urgent_counter()
-- increment_contractor_urgent_count()
-- update_contractor_location_after_booking()
-- create_urgency_analytics_entry()
-- check_urgency_zone_restriction()
-- See data-model.md for complete SQL
```

### 4. Seed Data (Week 1)

**File:** `supabase/migrations/20251107_010_urgency_seed_data.sql`
```sql
-- Seed initial urgency pricing configs
INSERT INTO platform_urgency_pricing (urgency_level, min_minutes, max_minutes, global_surcharge_percent, contractor_share_percent, platform_share_percent) VALUES
('express', 0, 60, 50.00, 50.00, 50.00),
('fast', 60, 120, 30.00, 50.00, 50.00),
('today', 120, 240, 15.00, 50.00, 50.00);

-- Example service-specific override (Coiffure +60% en Express)
-- INSERT INTO platform_urgency_pricing (urgency_level, min_minutes, max_minutes, service_id, service_surcharge_percent, contractor_share_percent, platform_share_percent)
-- SELECT 'express', 0, 60, id, 60.00, 50.00, 50.00
-- FROM services WHERE slug = 'coiffure-complete';
```

---

## Edge Functions Structure

Create the following Edge Functions in `supabase/functions/`:

### 1. Availability Functions

**`supabase/functions/urgency-check-availability/index.ts`**
- Implements `/urgency/check-availability` endpoint
- Checks contractor availability for all 3 tiers
- Calculates travel time via Google Distance Matrix
- Returns available contractors with slots and pricing

**`supabase/functions/urgency-contractor-slots/index.ts`**
- Implements `/urgency/contractor-slots` endpoint
- Gets specific contractor's available slots for urgency tier
- Validates travel time and weekly booking limit

### 2. Pricing Functions

**`supabase/functions/urgency-calculate-pricing/index.ts`**
- Implements `/urgency/calculate-pricing` endpoint
- Calculates surcharge, contractor bonus, platform revenue
- Handles service-specific overrides

**`supabase/functions/urgency-pricing-tiers/index.ts`**
- Implements `/urgency/pricing-tiers` endpoint
- Returns active pricing configurations for all tiers

**`supabase/functions/urgency-simulate-pricing/index.ts`**
- Implements `/urgency/simulate-pricing` endpoint
- Simulates pricing for all 3 tiers simultaneously

### 3. Contractor Configuration Functions

**`supabase/functions/contractor-urgency-config/index.ts`**
- Implements GET/PUT `/contractor/urgency-config` endpoints
- Manage contractor opt-in and availability slots

**`supabase/functions/contractor-urgency-stats/index.ts`**
- Implements `/contractor/urgency-stats` endpoint
- Personal contractor statistics

**`supabase/functions/contractor-urgency-potential-earnings/index.ts`**
- Implements `/contractor/urgency-potential-earnings` endpoint
- Calculate potential bonus earnings by tier

### 4. Notification Functions

**`supabase/functions/urgency-send-notification/index.ts`**
- Implements `/urgency/send-notification` endpoint
- Sends push + SMS (Express) + email notifications
- Schedules timeout check (5 minutes)

**`supabase/functions/urgency-notification-respond/index.ts`**
- Implements `/urgency/notification/{id}/respond` endpoint
- Contractor accepts or refuses urgent booking
- Triggers reassignment if refused

**`supabase/functions/urgency-notification-timeout-handler/index.ts`**
- Background job (scheduled via pg_cron)
- Checks pending notifications older than 5 minutes
- Triggers reassignment for timeouts

**`supabase/functions/urgency-reassign-booking/index.ts`**
- Internal function for reassignment logic
- Tries up to 3 contractors
- Cancels + refunds after 3 failures

### 5. Analytics Functions

**`supabase/functions/admin-urgency-dashboard/index.ts`**
- Implements `/admin/urgency-dashboard` endpoint
- Complete dashboard data (admin only)

**`supabase/functions/admin-urgency-performance-by-tier/index.ts`**
- Implements `/admin/urgency-performance-by-tier` endpoint
- Detailed tier performance metrics

**`supabase/functions/admin-urgency-revenue-breakdown/index.ts`**
- Implements `/admin/urgency-revenue-breakdown` endpoint
- Revenue analysis by period and tier

**`supabase/functions/admin-urgency-contractor-rankings/index.ts`**
- Implements `/admin/urgency-contractor-rankings` endpoint
- Contractor performance rankings

**`supabase/functions/admin-urgency-conversion-funnel/index.ts`**
- Implements `/admin/urgency-conversion-funnel` endpoint
- Booking conversion funnel analysis

---

## Testing Instructions

### 1. Database Setup Testing

```bash
# Run migrations
npx supabase migration up

# Verify tables exist
npx supabase db dump --schema public | grep "CREATE TABLE"

# Check seed data
npx supabase db query "SELECT * FROM platform_urgency_pricing;"
```

**Expected output:**
```
 urgency_level | min_minutes | max_minutes | global_surcharge_percent
---------------+-------------+-------------+-------------------------
 express       |           0 |          60 |                    50.00
 fast          |          60 |         120 |                    30.00
 today         |         120 |         240 |                    15.00
```

### 2. Edge Functions Deployment

```bash
# Deploy all urgency functions
npx supabase functions deploy urgency-check-availability
npx supabase functions deploy urgency-calculate-pricing
npx supabase functions deploy urgency-send-notification
# ... deploy all other functions

# Set secrets
npx supabase secrets set GOOGLE_MAPS_API_KEY=your_key
npx supabase secrets set TWILIO_ACCOUNT_SID=your_sid
# ... set all other secrets
```

### 3. Pricing Calculation Test

```bash
# Test pricing endpoint
curl -X POST https://your-project.supabase.co/functions/v1/urgency/calculate-pricing \
  -H "Authorization: Bearer YOUR_ANON_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "basePrice": 80.00,
    "urgencyLevel": "fast",
    "serviceId": 42
  }'
```

**Expected response:**
```json
{
  "success": true,
  "data": {
    "urgencyLevel": "fast",
    "basePrice": 80.00,
    "surchargePercent": 30.00,
    "surchargeAmount": 24.00,
    "contractorBonus": 12.00,
    "platformRevenue": 12.00,
    "totalPrice": 104.00
  }
}
```

### 4. Contractor Configuration Test

```bash
# Create contractor urgency config
curl -X PUT https://your-project.supabase.co/functions/v1/contractor/urgency-config \
  -H "Authorization: Bearer CONTRACTOR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "isEnabled": true,
    "availabilitySlots": [
      {"day": "monday", "start": "10:00", "end": "18:00"},
      {"day": "tuesday", "start": "10:00", "end": "18:00"},
      {"day": "wednesday", "start": "10:00", "end": "18:00"}
    ],
    "maxUrgentPerWeek": 10
  }'
```

**Expected response:**
```json
{
  "success": true,
  "data": {
    "id": 1,
    "contractorId": 123,
    "isEnabled": true,
    "availabilitySlots": [...],
    "maxUrgentPerWeek": 10,
    "currentWeekUrgentCount": 0
  }
}
```

### 5. Availability Check Test

```bash
# Check urgency availability
curl -X POST https://your-project.supabase.co/functions/v1/urgency/check-availability \
  -H "Authorization: Bearer CLIENT_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "serviceId": 42,
    "clientAddress": {
      "latitude": 48.8566,
      "longitude": 2.3522,
      "postalCode": "75001",
      "city": "Paris"
    }
  }'
```

**Expected response:**
```json
{
  "success": true,
  "data": {
    "express": {
      "urgencyLevel": "express",
      "contractorsAvailable": 2,
      "isAvailable": true,
      "pricing": {
        "surchargePercent": 50.00,
        "surchargeAmount": 40.00,
        "contractorBonus": 20.00,
        "totalPrice": 120.00
      },
      "contractors": [...]
    },
    "fast": {...},
    "today": {...}
  }
}
```

### 6. Notification Test

```bash
# Send urgent notification (admin/system only)
curl -X POST https://your-project.supabase.co/functions/v1/urgency/send-notification \
  -H "Authorization: Bearer ADMIN_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "bookingId": 789,
    "contractorId": 123,
    "urgencyLevel": "fast",
    "bonusAmount": 12.00,
    "travelTimeMinutes": 15,
    "departureTime": "2025-11-07T14:45:00Z"
  }'
```

**Expected:**
- Push notification sent to contractor
- Email sent as backup
- SMS sent if Express tier
- `urgent_notifications` record created with status='pending'

### 7. End-to-End Booking Flow Test

**Manual Testing Steps:**

1. **Client activates urgency mode**
   - Open booking UI
   - Select service (e.g., Massage 60min - 80€)
   - Click "Ready to Go" toggle
   - Verify 3 tier cards displayed with correct pricing

2. **Client selects tier**
   - Click "Rapide (1h-2h)" tier
   - Verify availability check runs
   - Verify available contractors displayed
   - Verify pricing shows: "104€ (+24€ surcharge) | Votre prestataire recevra +12€"

3. **Client confirms booking**
   - Select contractor and slot
   - Confirm payment
   - Verify `appointment_bookings` created with urgency fields
   - Verify `urgency_analytics` entry created

4. **Contractor receives notification**
   - Check push notification received (badge 🏃 RAPIDE)
   - Verify notification shows: "Départ dans 1h30 | Bonus +12€ | Trajet 15 min"
   - Confirm within 5 minutes
   - Verify booking status updated to 'confirmed'

5. **Service completion**
   - Contractor marks service as completed
   - Verify `urgency_actual_arrival_time` recorded
   - Verify `urgency_arrived_on_time` calculated
   - Client rates service
   - Verify satisfaction recorded in `urgency_analytics`

---

## Integration Points

### Spec 007 (Contractor Interface)

**Dependencies:**
- `contractor_services` table (which services contractor offers)
- `contractors.slug` for direct booking URLs
- `contractors` table for contractor data

**Coordination:**
- Ensure `appointment_bookings` tip columns (from spec 007) don't conflict with urgency columns
- Both features extend the same table safely

### Spec 003 (Booking Flow)

**Dependencies:**
- `appointment_bookings` base structure
- `services` table
- `client_addresses` table
- Booking payment flow

**Integration:**
- Urgency mode is an **optional enhancement** of the standard booking flow
- If `urgencyLevel` is NOT NULL, apply urgency pricing and notification logic
- Otherwise, follow standard booking flow

### Spec 002 (Availability Calculation)

**Dependencies:**
- Existing availability calculation algorithm
- `contractor_schedules` table
- `contractor_unavailabilities` table

**Extension:**
- Add urgency-specific filters:
  - Check `contractor_urgency_config.is_enabled`
  - Filter by `availability_slots` matching current day/time
  - Check `current_week_urgent_count < max_urgent_per_week`
  - Validate travel time < tier limit (30 min for Express/Rapide, 45 min for Aujourd'hui)

### Spec 008 (Notifications)

**Dependencies:**
- PWA push notification system
- Push subscription storage

**Extension:**
- Use priority channel for urgent notifications
- Add urgency badges (⚡ EXPRESS, 🏃 RAPIDE, 📅 AUJOURD'HUI)
- Implement 5-minute timeout handling

---

## Troubleshooting

### Issue: No contractors available for any tier

**Check:**
```sql
-- Verify contractors with urgency enabled
SELECT c.id, c.first_name, c.last_name, cuc.is_enabled, cuc.availability_slots
FROM contractors c
JOIN contractor_urgency_config cuc ON cuc.contractor_id = c.id
WHERE cuc.is_enabled = true;
```

**Solution:** At least one contractor must have `is_enabled = true` and `availability_slots` matching the current day/time.

### Issue: Pricing calculation returns incorrect amount

**Check:**
```sql
-- Verify pricing config is active
SELECT * FROM platform_urgency_pricing
WHERE urgency_level = 'fast'
AND is_active = true
AND (effective_until IS NULL OR effective_until > NOW());
```

**Solution:** Ensure one active config exists per tier without `effective_until` in the past.

### Issue: Notification not received by contractor

**Check:**
- Push subscription is active: `SELECT * FROM push_subscriptions WHERE user_id = contractor_profile_uuid;`
- Notification record created: `SELECT * FROM urgent_notifications WHERE contractor_id = X ORDER BY sent_at DESC LIMIT 1;`
- Edge Function logs: `npx supabase functions logs urgency-send-notification`

**Solution:** Verify VAPID keys, check browser notification permissions, ensure email/SMS fallbacks work.

### Issue: Travel time calculation fails

**Check:**
- Google Distance Matrix API key is valid
- API quota not exceeded
- Contractor has `last_known_location` set

**Fallback:** System uses prudent estimate (20km = 30min) if API fails. Check Edge Function logs for API errors.

### Issue: Weekly booking limit not resetting

**Check:**
```sql
-- Verify week_start_date
SELECT contractor_id, current_week_urgent_count, week_start_date
FROM contractor_urgency_config
WHERE is_enabled = true;
```

**Solution:** Trigger `reset_weekly_urgent_counter()` should run on Monday. Manually reset:
```sql
UPDATE contractor_urgency_config
SET current_week_urgent_count = 0, week_start_date = DATE_TRUNC('week', NOW())::DATE
WHERE EXTRACT(DOW FROM NOW()) = 1; -- Monday
```

---

## Performance Optimization

### Caching Strategy

Implement Redis caching for:

1. **Pricing Configs** (TTL: 5 minutes)
   ```typescript
   const cacheKey = `urgency:pricing:${urgencyLevel}:${serviceId}`;
   ```

2. **Contractor Availability** (TTL: 10 minutes)
   ```typescript
   const cacheKey = `urgency:availability:${contractorId}:${date}`;
   ```

3. **Travel Time** (TTL: 60 minutes)
   ```typescript
   const cacheKey = `urgency:travel:${contractorId}:${clientPostalCode}`;
   ```

4. **Weekly Booking Count** (TTL: 15 minutes)
   ```typescript
   const cacheKey = `urgency:weekly-count:${contractorId}:${weekStart}`;
   ```

### Database Indexes

Already created in migrations:
- `idx_platform_urgency_pricing_level` on (urgency_level, is_active)
- `idx_contractor_urgency_config_enabled` on (is_enabled)
- `idx_appointment_bookings_urgency` on (urgency_level, created_at)
- `idx_urgent_notifications_pending` on (status, sent_at)
- `idx_urgency_analytics_urgency_level` on (urgency_level, requested_at)

---

## Next Steps

1. **Week 1:** Deploy database migrations and seed data
2. **Week 2:** Implement and deploy Edge Functions
3. **Week 3:** Build contractor configuration UI
4. **Week 4:** Build client booking UI with urgency mode
5. **Week 5:** Pilot test with 10 contractors and 100 beta clients
6. **Week 6:** Monitor metrics, optimize, full launch

---

**Last Updated:** 2025-11-07
**Maintained By:** Engineering Team
