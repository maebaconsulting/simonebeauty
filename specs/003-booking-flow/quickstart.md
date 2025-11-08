# Quickstart Guide
# Feature 003: Parcours de Réservation Complet

**Date:** 2025-11-07
**Branch:** `003-booking-flow`

---

## Prerequisites

Before starting development on this feature, ensure you have:

- Node.js 20+ installed
- Supabase CLI installed (`npm install -g supabase`)
- Access to Supabase project
- Stripe account (test mode) configured
- Google Cloud Platform account with Maps API enabled
- Docker installed (for local Supabase)
- **Spec 007 (contractor-interface) completed** - Required for contractor_services and slug tables
- **Spec 002 (availability algorithm) completed** - Required for slot calculation

---

## 1. Environment Setup

### Clone and Install

```bash
cd /Users/dan/Documents/SOFTWARE/myProjects/simone\ _v2.1/webclaude
git checkout 003-booking-flow
npm install
```

### Environment Variables

Create or update `.env.local`:

```bash
# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key

# Stripe
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_...
STRIPE_SECRET_KEY=sk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...

# Google Maps (REQUIRED for this feature)
NEXT_PUBLIC_GOOGLE_MAPS_API_KEY=AIza...

# Google Places & Geocoding APIs
GOOGLE_PLACES_API_KEY=AIza...
GOOGLE_GEOCODING_API_KEY=AIza...

# Frontend URL
NEXT_PUBLIC_APP_URL=http://localhost:3000

# Email (Resend)
RESEND_API_KEY=re_...
RESEND_FROM_EMAIL=noreply@simone.paris
```

---

## 2. Google Maps API Setup

### Enable Required APIs

1. Go to [Google Cloud Console](https://console.cloud.google.com)
2. Create or select project
3. Enable these APIs:
   - **Places API** (for address autocomplete)
   - **Geocoding API** (for address validation)
   - **Distance Matrix API** (for travel time calculations)
   - **Maps JavaScript API** (for map display)

### Create API Keys

```bash
# Create restricted API keys for security

# Frontend key (restricted to your domain)
- Key name: "Simone Frontend Maps API"
- Application restrictions: HTTP referrers
- Allowed referrers:
  - http://localhost:3000/*
  - https://simone.paris/*
- API restrictions:
  - Maps JavaScript API
  - Places API

# Backend key (restricted to IP)
- Key name: "Simone Backend Maps API"
- Application restrictions: IP addresses
- Allowed IPs: [Your Supabase Edge Function IPs]
- API restrictions:
  - Geocoding API
  - Distance Matrix API
  - Places API
```

### Test API Access

```typescript
// Test script: test-google-maps.ts
async function testGoogleMapsAPI() {
  const response = await fetch(
    `https://maps.googleapis.com/maps/api/geocode/json?address=1600+Amphitheatre+Parkway,+Mountain+View,+CA&key=${process.env.GOOGLE_GEOCODING_API_KEY}`
  );

  const data = await response.json();
  console.log('Geocoding API status:', data.status);
  console.log('Result:', data.results[0]);
}

testGoogleMapsAPI();
```

---

## 3. Local Database Setup

### Start Local Supabase

```bash
# Start local Supabase stack
supabase start
```

### Migration Files to Create

Create these migration files in `supabase/migrations/`:

1. `20250107_100_create_services.sql`
2. `20250107_101_create_service_zones.sql`
3. `20250107_102_create_client_addresses.sql`
4. `20250107_103_create_promo_codes.sql`
5. `20250107_104_create_gift_cards.sql`
6. `20250107_105_create_booking_sessions.sql`
7. `20250107_106_extend_appointment_bookings.sql`
8. `20250107_107_create_promo_code_usage.sql`
9. `20250107_108_create_gift_card_transactions.sql`
10. `20250107_109_create_availability_notifications.sql`
11. `20250107_110_create_booking_views.sql`
12. `20250107_111_seed_services.sql`
13. `20250107_112_seed_service_zones.sql`

Copy SQL from `data-model.md` into these files.

### Run Migrations

```bash
# Apply all migrations
supabase db reset

# Or apply incrementally
supabase migration up

# Check status
supabase migration list
```

### Seed Sample Data

```sql
-- Seed services
INSERT INTO services (name, slug, description, category, service_type, base_price, duration_minutes, is_active, is_featured) VALUES
('Massage Suédois 60min', 'massage-suedois-60min', 'Massage relaxant aux huiles essentielles', 'massage', 'at_home', 80.00, 60, true, true),
('Massage Deep Tissue 90min', 'massage-deep-tissue-90min', 'Massage profond pour tensions musculaires', 'massage', 'at_home', 120.00, 90, true, false),
('Manucure complète', 'manucure-complete', 'Manucure avec pose de vernis semi-permanent', 'beauty', 'at_home', 50.00, 45, true, true),
('Coupe + Brushing femme', 'coupe-brushing-femme', 'Coupe et brushing à domicile', 'hair', 'at_home', 65.00, 60, true, false);

-- Seed service zones (Paris arrondissements)
INSERT INTO service_zones (name, zone_type, boundary_coordinates, center_lat, center_lng, postal_codes, is_active) VALUES
('Paris 1er', 'arrondissement', '{"type":"Polygon","coordinates":[[[2.3285,48.8606],[2.3429,48.8606],[2.3429,48.8702],[2.3285,48.8702],[2.3285,48.8606]]]}', 48.8650, 2.3357, ARRAY['75001'], true),
('Paris 2e', 'arrondissement', '{"type":"Polygon","coordinates":[[[2.3320,48.8650],[2.3520,48.8650],[2.3520,48.8750],[2.3320,48.8750],[2.3320,48.8650]]]}', 48.8700, 2.3420, ARRAY['75002'], true);

-- Seed promo codes
INSERT INTO promo_codes (code, description, discount_type, discount_value, minimum_purchase_amount, valid_until, usage_limit, is_active) VALUES
('WELCOME10', 'Réduction de 10% pour nouveaux clients', 'percentage', 10, NULL, NOW() + INTERVAL '6 months', 1000, true),
('NOEL2024', 'Réduction de 15€ pour Noël', 'fixed_amount', 15, 50, '2024-12-31 23:59:59', NULL, true),
('VIP20', 'Réduction de 20% pour clients VIP', 'percentage', 20, 100, NULL, NULL, true);
```

---

## 4. Edge Functions Development

### Edge Functions Structure

```
supabase/functions/
├── get-available-slots/
│   └── index.ts
├── validate-promo-code/
│   └── index.ts
├── validate-gift-card/
│   └── index.ts
├── create-booking-payment/
│   └── index.ts
├── verify-slot-availability/
│   └── index.ts
├── capture-booking-payment/
│   └── index.ts
├── validate-service-zone/
│   └── index.ts
├── track-slug-visit/ (shared with spec 007)
│   └── index.ts
├── mark-slug-conversion/ (shared with spec 007)
│   └── index.ts
└── cleanup-expired-sessions/ (cron job)
    └── index.ts
```

### Key Edge Functions

#### get-available-slots

```typescript
// supabase/functions/get-available-slots/index.ts
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

serve(async (req) => {
  const supabaseClient = createClient(
    Deno.env.get('SUPABASE_URL') ?? '',
    Deno.env.get('SUPABASE_ANON_KEY') ?? '',
  );

  const { serviceId, addressLat, addressLng, startDate, endDate, contractorId } = await req.json();

  // 1. Get service details
  const { data: service } = await supabaseClient
    .from('services')
    .select('duration_minutes, buffer_time_minutes')
    .eq('id', serviceId)
    .single();

  // 2. Get contractors offering this service (or specific contractor if slug booking)
  let contractors;
  if (contractorId) {
    const { data } = await supabaseClient
      .from('contractors')
      .select('*, contractor_services!inner(*)')
      .eq('id', contractorId)
      .eq('contractor_services.service_id', serviceId)
      .eq('contractor_services.is_active', true)
      .single();
    contractors = [data];
  } else {
    const { data } = await supabaseClient
      .from('contractor_services')
      .select('contractor:contractors(*)')
      .eq('service_id', serviceId)
      .eq('is_active', true);
    contractors = data.map(cs => cs.contractor);
  }

  // 3. Call spec 002 availability algorithm for each contractor
  const allSlots = [];
  for (const contractor of contractors) {
    const slots = await calculateAvailability({
      contractorId: contractor.id,
      duration: service.duration_minutes,
      addressLat,
      addressLng,
      startDate,
      endDate,
    });
    allSlots.push(...slots);
  }

  // 4. Deduplicate and sort
  const sortedSlots = allSlots.sort((a, b) =>
    new Date(a.start).getTime() - new Date(b.start).getTime()
  );

  return new Response(
    JSON.stringify({ slots: sortedSlots }),
    { headers: { 'Content-Type': 'application/json' } }
  );
});
```

#### validate-promo-code

```typescript
// supabase/functions/validate-promo-code/index.ts
serve(async (req) => {
  const supabaseClient = createClient(
    Deno.env.get('SUPABASE_URL') ?? '',
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
  );

  const { code, userId, cartTotal, serviceIds } = await req.json();

  // Validation logic from research.md
  const { data: promo, error } = await supabaseClient
    .from('promo_codes')
    .select('*')
    .eq('code', code.toUpperCase())
    .eq('is_active', true)
    .single();

  if (error || !promo) {
    return new Response(
      JSON.stringify({ valid: false, message: 'Code promo invalide' }),
      { status: 400, headers: { 'Content-Type': 'application/json' } }
    );
  }

  // Check validity, usage limits, etc. (see research.md for full logic)

  return new Response(
    JSON.stringify({ valid: true, discount, message: `Réduction de ${discount}€ appliquée` }),
    { headers: { 'Content-Type': 'application/json' } }
  );
});
```

### Deploy Edge Functions

```bash
# Deploy all functions
supabase functions deploy

# Or deploy individually
supabase functions deploy get-available-slots
supabase functions deploy validate-promo-code
```

---

## 5. Frontend Development

### Install Required Packages

```bash
npm install @react-google-maps/api
npm install @stripe/stripe-js @stripe/react-stripe-js
npm install date-fns
npm install @turf/turf # For geospatial calculations
```

### Key Routes to Implement

```
Client Routes:
- /services - Service catalog
- /services/[slug] - Service detail page (start booking)
- /booking/address - Address selection step
- /booking/slot - Time slot selection
- /booking/addons - Additional services (optional)
- /booking/payment - Payment form
- /booking/confirmation - Booking confirmed

Contractor Slug Booking:
- /book/[slug] - Direct contractor booking page
- /book/[slug]?service=[service_slug] - Pre-select service

Client Dashboard:
- /my-bookings - Booking history
- /my-addresses - Saved addresses management
```

### Component Structure

```
src/components/booking/
├── ServiceSelector.tsx
├── AddressSelector.tsx
│   ├── AddressAutocomplete.tsx
│   ├── SavedAddressList.tsx
│   └── AddressForm.tsx
├── SlotPicker.tsx
│   ├── Calendar.tsx
│   └── TimeSlotGrid.tsx
├── ContractorAssignment.tsx
│   ├── ContractorCard.tsx
│   └── AlternativeContractorsList.tsx
├── PromoCodeInput.tsx
├── GiftCardInput.tsx
├── PricingSummary.tsx
├── PaymentForm.tsx
└── BookingConfirmation.tsx
```

### Test the Booking Flow

1. Navigate to http://localhost:3000/services
2. Select "Massage Suédois 60min"
3. Click "Réserver maintenant"
4. Address step:
   - Should see default address pre-filled (if exists)
   - Try "Changer d'adresse"
   - Try adding new address with autocomplete
5. Slot step:
   - Should load in <3 seconds
   - Select a time slot
   - Verify contractor assignment
6. Payment step:
   - Try promo code: "WELCOME10"
   - Try gift card (if you created one)
   - Use Stripe test card: 4242 4242 4242 4242
7. Confirmation page should show booking details

---

## 6. Testing Scenarios

### Test Address Autocomplete

```typescript
// Test Google Places Autocomplete
// 1. Type "15 rue" (3 characters minimum)
// 2. Should see suggestions within 500ms
// 3. Select an address
// 4. Should populate all fields (street, city, postal code, coordinates)
```

### Test Service Zone Validation

```sql
-- Create test data: address outside service zone
INSERT INTO client_addresses (client_id, street_address, city, postal_code, latitude, longitude)
VALUES (
  'your-test-user-id',
  '1 Place de la Concorde',
  'Lyon',
  '69001',
  45.7640,
  4.8357
);

-- Try booking: should show "Adresse hors zone de service"
```

### Test Promo Code Validation

```bash
# Test valid code
curl -X POST http://localhost:54321/functions/v1/validate-promo-code \
  -H "Authorization: Bearer YOUR_ANON_KEY" \
  -d '{"code":"WELCOME10","userId":"user-id","cartTotal":80,"serviceIds":[1]}'

# Expected: {"valid":true,"discount":8,"message":"Réduction de 8€ appliquée"}

# Test expired code
curl -X POST http://localhost:54321/functions/v1/validate-promo-code \
  -H "Authorization: Bearer YOUR_ANON_KEY" \
  -d '{"code":"EXPIRED","userId":"user-id","cartTotal":80,"serviceIds":[1]}'

# Expected: {"valid":false,"message":"Ce code promo a expiré"}
```

### Test Slot Availability Race Condition

```typescript
// Simulate two users booking same slot
// User 1: Start payment for slot at 2024-11-07 14:00
// User 2: Start payment for same slot
// Expected: Second user should see "Ce créneau vient d'être réservé"
```

### Test Contractor Slug Booking

1. Create test contractor with slug:
```sql
INSERT INTO contractors (profile_uuid, first_name, last_name, slug)
VALUES ('profile-uuid', 'Marie', 'Dupont', 'marie-dupont-massage');
```

2. Add services to contractor:
```sql
INSERT INTO contractor_services (contractor_id, service_id, is_active)
VALUES (1, 1, true), (1, 2, true);
```

3. Navigate to http://localhost:3000/book/marie-dupont-massage
4. Should see:
   - Marie's profile header
   - Only her services (filtered)
   - Only her availability in calendar
   - No option to change contractor

4. Complete booking and verify:
```sql
-- Check analytics tracking
SELECT * FROM contractor_slug_analytics
WHERE contractor_id = 1
ORDER BY visited_at DESC
LIMIT 1;

-- After payment, check conversion
SELECT converted, booking_id FROM contractor_slug_analytics
WHERE session_id = 'your-session-id';
```

### Test Slug Redirect

1. Change contractor slug:
```sql
UPDATE contractors SET slug = 'marie-massage-paris' WHERE id = 1;
```

2. Visit old URL: http://localhost:3000/book/marie-dupont-massage
3. Should redirect (301) to: http://localhost:3000/book/marie-massage-paris

4. Wait 30 days (or manually expire):
```sql
UPDATE contractor_slug_history
SET expires_at = NOW() - INTERVAL '1 day'
WHERE old_slug = 'marie-dupont-massage';
```

5. Visit old URL again
6. Should see 404 page with message

---

## 7. Common Issues & Solutions

### Issue: Google Maps API returns "REQUEST_DENIED"

**Solution:**
- Check API key is valid
- Verify API is enabled in Google Cloud Console
- Check billing is enabled
- Verify domain restrictions match localhost:3000

### Issue: Slot availability returns empty array

**Solution:**
- Verify spec 002 availability algorithm is working
- Check contractor has configured schedules
- Ensure contractor has no conflicting bookings
- Check service zones include the address

### Issue: Promo code always invalid

**Solution:**
```sql
-- Check promo code exists and is active
SELECT * FROM promo_codes WHERE UPPER(code) = 'WELCOME10';

-- Check validity dates
SELECT code, valid_from, valid_until, is_active FROM promo_codes;

-- Verify usage limits not exceeded
SELECT usage_count, usage_limit FROM promo_codes WHERE code = 'WELCOME10';
```

### Issue: Payment pre-authorization fails

**Solution:**
- Use Stripe test card: 4242 4242 4242 4242
- Check Stripe webhook is receiving events
- Verify payment_intent creation in Edge Function
- Check Stripe logs for errors

### Issue: Session expires too quickly

**Solution:**
```sql
-- Check session expiration trigger is working
SELECT id, expires_at, updated_at FROM booking_sessions
WHERE session_id = 'your-session-id';

-- Manually extend for testing
UPDATE booking_sessions
SET expires_at = NOW() + INTERVAL '1 hour'
WHERE session_id = 'your-session-id';
```

---

## 8. Performance Optimization

### Enable Caching

```typescript
// TanStack Query caching configuration
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 60000, // 1 minute for slots
      cacheTime: 300000, // 5 minutes
      refetchOnWindowFocus: false,
    },
  },
});
```

### Optimize Database Queries

```sql
-- Analyze query performance
EXPLAIN ANALYZE
SELECT * FROM contractor_services cs
JOIN contractors c ON c.id = cs.contractor_id
WHERE cs.service_id = 1 AND cs.is_active = true;

-- Add missing indexes if needed
CREATE INDEX IF NOT EXISTS idx_contractor_services_lookup
ON contractor_services(service_id, is_active)
INCLUDE (contractor_id);
```

### Lazy Load Components

```typescript
// Lazy load heavy components
const SlotPicker = lazy(() => import('./SlotPicker'));
const PaymentForm = lazy(() => import('./PaymentForm'));

// Use Suspense
<Suspense fallback={<Loading />}>
  <SlotPicker />
</Suspense>
```

---

## 9. Monitoring & Logging

### Track Key Metrics

```typescript
// Log booking funnel progress
function trackBookingStep(step: string, data: any) {
  console.log(`[Booking Flow] Step: ${step}`, data);

  // Send to analytics
  if (typeof window !== 'undefined' && window.gtag) {
    window.gtag('event', 'booking_step', {
      step,
      service_id: data.serviceId,
      contractor_id: data.contractorId,
    });
  }
}
```

### Monitor Edge Function Performance

```bash
# View function logs
supabase functions logs get-available-slots --tail

# Check for errors
supabase functions logs get-available-slots --filter "ERROR"
```

### Database Monitoring

```sql
-- Check booking session activity
SELECT
  DATE_TRUNC('hour', created_at) AS hour,
  COUNT(*) AS sessions_created,
  COUNT(final_price) AS completed_bookings,
  AVG(EXTRACT(EPOCH FROM (updated_at - created_at))) AS avg_duration_seconds
FROM booking_sessions
WHERE created_at >= NOW() - INTERVAL '24 hours'
GROUP BY DATE_TRUNC('hour', created_at)
ORDER BY hour DESC;

-- Check slot availability performance
SELECT
  contractor_id,
  COUNT(*) AS availability_checks,
  AVG(response_time_ms) AS avg_response_time
FROM availability_check_logs
WHERE created_at >= NOW() - INTERVAL '1 hour'
GROUP BY contractor_id
HAVING AVG(response_time_ms) > 3000; -- Alert if >3s
```

---

## 10. Deployment Checklist

Before deploying to production:

- [ ] All migrations tested locally
- [ ] All Edge Functions deployed and tested
- [ ] Google Maps API keys configured (restricted)
- [ ] Stripe webhooks configured
- [ ] Service zones defined for production cities
- [ ] Services catalog populated
- [ ] Test bookings completed end-to-end
- [ ] Promo codes created and tested
- [ ] Gift cards system tested
- [ ] Slug booking flow tested
- [ ] Slug redirects working
- [ ] Address autocomplete works in production domain
- [ ] Slot availability loads in <3 seconds
- [ ] Payment flow tested with real cards (test mode)
- [ ] Email confirmations sent successfully
- [ ] RLS policies tested for all tables
- [ ] Performance tested (Lighthouse score >90)
- [ ] Mobile responsive design verified
- [ ] Analytics tracking verified

---

## 11. Useful Commands

### Database Queries

```sql
-- View all active bookings
SELECT
  b.id,
  b.service_name,
  b.scheduled_start,
  b.final_price,
  b.payment_status,
  c.first_name || ' ' || c.last_name AS contractor_name,
  p.email AS client_email
FROM appointment_bookings b
JOIN contractors c ON c.id = b.contractor_id
JOIN profiles p ON p.id = b.client_id
WHERE b.status IN ('pending', 'confirmed')
ORDER BY b.scheduled_start;

-- Check promo code usage
SELECT
  pc.code,
  pc.usage_count,
  pc.usage_limit,
  COUNT(pcu.id) AS actual_usage,
  SUM(pcu.discount_applied) AS total_discount_given
FROM promo_codes pc
LEFT JOIN promo_code_usage pcu ON pcu.promo_code_id = pc.id
GROUP BY pc.id, pc.code, pc.usage_count, pc.usage_limit;

-- View booking conversion funnel
SELECT * FROM booking_conversion_funnel
WHERE date >= CURRENT_DATE - INTERVAL '7 days'
ORDER BY date DESC;

-- Check gift card balances
SELECT * FROM gift_card_summary
WHERE status != 'fully_used'
AND valid_until > NOW()
ORDER BY current_balance DESC;
```

### Edge Functions

```bash
# Deploy specific function
supabase functions deploy get-available-slots

# Test function locally
supabase functions serve get-available-slots --env-file .env.local

# View logs
supabase functions logs get-available-slots --tail

# Delete function
supabase functions delete get-available-slots
```

### Stripe CLI

```bash
# Test payment intent
stripe payment_intents create \
  --amount=8000 \
  --currency=eur \
  --capture-method=manual

# List recent payment intents
stripe payment_intents list --limit=10

# Capture payment intent
stripe payment_intents capture pi_xxxxx
```

---

## 12. Resources

### Documentation

- [Google Places API](https://developers.google.com/maps/documentation/places/web-service)
- [Stripe PaymentIntents](https://stripe.com/docs/payments/payment-intents)
- [Turf.js Geospatial](https://turfjs.org/)
- [React Google Maps](https://react-google-maps-api-docs.netlify.app/)

### Internal Docs

- Constitution: `/.specify/constitution.md`
- Feature Spec: `/specs/003-booking-flow/spec.md`
- Data Model: `/specs/003-booking-flow/data-model.md`
- Research: `/specs/003-booking-flow/research.md`
- API Contracts: `/specs/003-booking-flow/contracts/`

### Dependencies

- **Spec 007:** contractor_services, contractor slugs, slug analytics
- **Spec 002:** Availability calculation algorithm

---

**Last Updated:** 2025-11-07
**Version:** 1.0
