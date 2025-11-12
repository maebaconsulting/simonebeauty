# Technical Research
# Feature 013: Service d'Urgence Ready to Go

**Date:** 2025-11-07
**Status:** Research Complete
**Branch:** `013-ready-to-go`

---

## Overview

This document outlines the technical research and decisions for implementing the Ready to Go urgent booking service with 3 pricing tiers (Express <1h, Rapide 1h-2h, Aujourd'hui 2h-4h). The system features platform-level pricing configuration and simple contractor opt-in.

---

## 1. Multi-Tier Urgency Pricing Implementation

### Problem Statement
Need to implement a flexible 3-tier pricing system that:
- Applies different surcharges based on urgency level (Express +50%, Rapide +30%, Aujourd'hui +15%)
- Splits revenue between contractor bonus and platform revenue
- Allows service-specific overrides (e.g., Coiffure Express +60% instead of global +50%)
- Is configured at platform level by admins, not by contractors

### Research Findings

**Approach 1: Calculate pricing on-the-fly from base service price**
- Pros: Always accurate, no stale data, simple data model
- Cons: Requires calculation on every request, complex for service-specific overrides
- Decision: ✅ **SELECTED** - Best for maintainability and accuracy

**Approach 2: Pre-calculate and cache pricing tiers**
- Pros: Fast read performance
- Cons: Cache invalidation complexity, risk of stale data, more storage
- Decision: ❌ Rejected - Premature optimization

### Technical Solution

**Database Structure:**
```sql
-- Platform-level configuration
CREATE TABLE platform_urgency_pricing (
  id BIGINT PRIMARY KEY,
  urgency_level VARCHAR(20) CHECK (urgency_level IN ('express', 'fast', 'today')),
  min_minutes INT, -- 0, 60, 120
  max_minutes INT, -- 60, 120, 240
  global_surcharge_percent DECIMAL(5,2), -- 50.00, 30.00, 15.00
  contractor_share_percent DECIMAL(5,2), -- 50.00 (contractor gets 50% of surcharge)
  platform_share_percent DECIMAL(5,2), -- 50.00 (platform keeps 50%)
  is_active BOOLEAN,
  effective_from TIMESTAMP,
  effective_until TIMESTAMP
);

-- Service-specific overrides
ALTER TABLE platform_urgency_pricing ADD COLUMN service_id BIGINT REFERENCES services(id);
ALTER TABLE platform_urgency_pricing ADD COLUMN service_surcharge_percent DECIMAL(5,2);
```

**Calculation Logic:**
```typescript
function calculateUrgencyPricing(
  basePrice: number,
  urgencyLevel: 'express' | 'fast' | 'today',
  serviceId: number
): UrgencyPricingBreakdown {
  // 1. Fetch pricing config (check service-specific first, fallback to global)
  const config = await db
    .from('platform_urgency_pricing')
    .select('*')
    .eq('urgency_level', urgencyLevel)
    .eq('is_active', true)
    .or(`service_id.is.null,service_id.eq.${serviceId}`)
    .order('service_id', { ascending: false }) // Prefer service-specific
    .limit(1)
    .single();

  // 2. Calculate surcharge
  const surchargePercent = config.service_surcharge_percent || config.global_surcharge_percent;
  const surchargeAmount = basePrice * (surchargePercent / 100);

  // 3. Split surcharge
  const contractorBonus = surchargeAmount * (config.contractor_share_percent / 100);
  const platformRevenue = surchargeAmount * (config.platform_share_percent / 100);

  // 4. Calculate total
  const totalPrice = basePrice + surchargeAmount;

  return {
    basePrice,
    surchargePercent,
    surchargeAmount,
    contractorBonus,
    platformRevenue,
    totalPrice,
  };
}
```

**Performance Considerations:**
- Cache pricing configs in Redis with 5-minute TTL
- Invalidate cache on admin config updates
- Query optimization: Index on (urgency_level, is_active, service_id)

---

## 2. Real-Time Availability Calculation for Urgent Bookings

### Problem Statement
Need to verify contractor availability in real-time considering:
- Existing bookings with buffer time
- Travel time to client address (<30 min for Express/Rapide, <45 min for Aujourd'hui)
- Contractor's Ready to Go time slots
- Maximum urgent bookings per week limit

### Research Findings

**Approach 1: Database-side availability calculation**
- Pros: Single source of truth, consistent with spec 002
- Cons: Complex SQL queries, limited flexibility
- Decision: ✅ **SELECTED** - Consistency with existing availability system

**Approach 2: Application-side calculation with caching**
- Pros: Easier to test and debug
- Cons: Risk of inconsistency with booking flow
- Decision: ❌ Rejected - Would diverge from spec 002 patterns

### Technical Solution

**Edge Function: `check-urgency-availability`**

```typescript
// Input: clientAddress, urgencyLevel, serviceId, serviceDuration
// Output: List of available contractors with slots

async function checkUrgencyAvailability(params: {
  clientAddress: Address;
  urgencyLevel: 'express' | 'fast' | 'today';
  serviceId: number;
  serviceDuration: number;
}) {
  // 1. Get urgency time window
  const now = new Date();
  const { minMinutes, maxMinutes } = await getUrgencyWindow(params.urgencyLevel);
  const windowStart = addMinutes(now, minMinutes);
  const windowEnd = addMinutes(now, maxMinutes);

  // 2. Find contractors with Ready to Go enabled for this time
  const contractors = await db
    .from('contractor_urgency_config')
    .select(`
      *,
      contractor:contractors(*)
    `)
    .eq('is_enabled', true)
    .filter('availability_slots', 'cs', JSON.stringify([{
      day: getDayOfWeek(now),
      // Check if current time is within any slot
    }]));

  // 3. Check weekly urgency booking limit
  const contractorsWithinLimit = await filterByWeeklyLimit(contractors);

  // 4. Calculate travel time for each contractor
  const contractorsWithTravel = await Promise.all(
    contractorsWithinLimit.map(async (c) => {
      const travelTime = await calculateTravelTime(
        c.contractor.last_known_location,
        params.clientAddress
      );
      return { ...c, travelTime };
    })
  );

  // 5. Filter by travel time limit
  const maxTravelTime = params.urgencyLevel === 'today' ? 45 : 30;
  const nearbyContractors = contractorsWithTravel.filter(
    (c) => c.travelTime <= maxTravelTime
  );

  // 6. Check actual availability considering existing bookings
  const availableSlots = await Promise.all(
    nearbyContractors.map(async (c) => {
      const slots = await findAvailableSlots({
        contractorId: c.contractor_id,
        startWindow: windowStart,
        endWindow: windowEnd,
        serviceDuration: params.serviceDuration,
        bufferTime: 15, // Minimum 15 minutes buffer
      });
      return { contractor: c, slots };
    })
  );

  // 7. Return only contractors with available slots
  return availableSlots.filter((a) => a.slots.length > 0);
}
```

**Travel Time Calculation:**
- Use Google Distance Matrix API
- Cache results for 1 hour (travel patterns don't change rapidly)
- Fallback: 20km = 30 minutes if API fails
- Store last known contractor location (from last completed booking address)

**Buffer Time Logic:**
- Minimum 15 minutes between bookings for urgent services
- Accounts for: end of previous booking + travel time + 5-minute preparation

---

## 3. Contractor Notification System for Urgent Requests

### Problem Statement
Need to send priority notifications to contractors when:
- Urgent booking is created
- Clear urgency level badge (⚡ EXPRESS, 🏃 RAPIDE, 📅 AUJOURD'HUI)
- Show bonus amount, travel time, departure time
- 5-minute response window before reassignment

### Research Findings

**Notification Channels:**
1. **Push Notifications (Priority)** - Via PWA/Mobile App
   - Pros: Instant delivery, high visibility
   - Cons: Requires user permission
   - Decision: ✅ Primary channel

2. **SMS (Fallback)** - Via Twilio
   - Pros: Guaranteed delivery
   - Cons: Cost per SMS
   - Decision: ✅ For Express tier only

3. **Email** - Via Resend
   - Pros: Free, permanent record
   - Cons: Slower, lower open rate
   - Decision: ✅ Always send as backup

### Technical Solution

**Edge Function: `send-urgent-notification`**

```typescript
async function sendUrgentNotification(booking: UrgentBooking) {
  const { contractorId, urgencyLevel, bonusAmount, travelTime, departureTime } = booking;

  const contractor = await getContractor(contractorId);

  // 1. Create notification record
  const notification = await db.from('urgent_notifications').insert({
    booking_id: booking.id,
    contractor_id: contractorId,
    urgency_level: urgencyLevel,
    bonus_amount: bonusAmount,
    travel_time_minutes: travelTime,
    sent_at: new Date(),
    status: 'pending',
  }).select().single();

  // 2. Format notification content
  const badge = {
    express: '⚡ EXPRESS',
    fast: '🏃 RAPIDE',
    today: '📅 AUJOURD\'HUI',
  }[urgencyLevel];

  const message = {
    title: `${badge} - Nouvelle demande urgente`,
    body: `Départ dans ${formatDuration(departureTime)} | Bonus +${bonusAmount}€ | Trajet ${travelTime} min`,
    data: {
      bookingId: booking.id,
      urgencyLevel,
      bonusAmount,
      travelTime,
      notificationId: notification.id,
    },
    actions: [
      { action: 'accept', title: 'Accepter' },
      { action: 'refuse', title: 'Refuser' },
    ],
  };

  // 3. Send push notification
  try {
    await sendPushNotification(contractor.push_subscription, message);
  } catch (error) {
    console.error('Push notification failed:', error);
  }

  // 4. Send SMS for Express tier
  if (urgencyLevel === 'express') {
    await sendSMS(contractor.phone,
      `${badge}: Départ ${formatDuration(departureTime)}, Bonus +${bonusAmount}€. ` +
      `Accepter: ${getAcceptURL(booking.id)}`
    );
  }

  // 5. Send email backup
  await sendEmail({
    to: contractor.email,
    subject: `${badge} - Nouvelle demande urgente`,
    template: 'urgent-booking-notification',
    data: { booking, contractor, message },
  });

  // 6. Schedule timeout check (5 minutes)
  await scheduleTimeoutCheck(notification.id, 5 * 60 * 1000);
}

async function scheduleTimeoutCheck(notificationId: number, delayMs: number) {
  // Use Supabase Edge Functions with Deno.cron or pg_cron
  await db.from('scheduled_tasks').insert({
    task_type: 'check_urgent_notification_timeout',
    task_data: { notificationId },
    scheduled_for: new Date(Date.now() + delayMs),
  });
}

async function handleNotificationTimeout(notificationId: number) {
  const notification = await db
    .from('urgent_notifications')
    .select('*')
    .eq('id', notificationId)
    .single();

  if (notification.status === 'pending') {
    // Mark as timeout
    await db
      .from('urgent_notifications')
      .update({ status: 'timeout', responded_at: new Date() })
      .eq('id', notificationId);

    // Reassign to next available contractor
    const booking = await getBooking(notification.booking_id);
    await reassignUrgentBooking(booking);
  }
}
```

**Reassignment Logic:**
- Try up to 3 contractors sequentially
- After 3 timeouts/refusals: Cancel booking, refund + 10% promo code
- Log all attempts in urgency_analytics table

---

## 4. Analytics and Tracking for Urgent Bookings

### Problem Statement
Need to track:
- Conversion rate by urgency tier
- Average response time by contractor
- Success rate (booking completed within promised time)
- Revenue breakdown (contractor bonus vs platform revenue)
- Client satisfaction by urgency level

### Technical Solution

**Logging Strategy:**
```sql
CREATE TABLE urgency_analytics (
  id BIGINT PRIMARY KEY,
  booking_id BIGINT REFERENCES appointment_bookings(id),
  urgency_level VARCHAR(20),
  requested_at TIMESTAMP,
  assigned_contractor_id UUID,
  response_time_seconds INT, -- Time to accept
  contractor_attempts INT, -- How many contractors were tried
  status VARCHAR(50), -- 'success', 'timeout', 'no_contractor', 'client_cancel'
  actual_arrival_time TIMESTAMP,
  promised_arrival_window_start TIMESTAMP,
  promised_arrival_window_end TIMESTAMP,
  arrived_on_time BOOLEAN, -- Within promised window
  client_satisfaction_rating INT, -- 1-5 stars
  created_at TIMESTAMP
);
```

**Metrics Calculated:**
```typescript
// Dashboard queries
const metrics = {
  // Conversion by tier
  conversionByTier: `
    SELECT
      urgency_level,
      COUNT(*) as total_requests,
      COUNT(CASE WHEN status = 'success' THEN 1 END) as successful,
      ROUND(100.0 * COUNT(CASE WHEN status = 'success' THEN 1 END) / COUNT(*), 2) as conversion_rate
    FROM urgency_analytics
    WHERE requested_at >= NOW() - INTERVAL '30 days'
    GROUP BY urgency_level
  `,

  // Average response time
  avgResponseTime: `
    SELECT
      urgency_level,
      AVG(response_time_seconds) as avg_response_seconds,
      PERCENTILE_CONT(0.5) WITHIN GROUP (ORDER BY response_time_seconds) as median_response_seconds
    FROM urgency_analytics
    WHERE status = 'success'
    GROUP BY urgency_level
  `,

  // On-time arrival rate
  onTimeRate: `
    SELECT
      urgency_level,
      COUNT(*) as total_completed,
      COUNT(CASE WHEN arrived_on_time = true THEN 1 END) as arrived_on_time,
      ROUND(100.0 * COUNT(CASE WHEN arrived_on_time = true THEN 1 END) / COUNT(*), 2) as on_time_rate
    FROM urgency_analytics
    WHERE status = 'success' AND actual_arrival_time IS NOT NULL
    GROUP BY urgency_level
  `,

  // Revenue breakdown
  revenueBreakdown: `
    SELECT
      DATE_TRUNC('month', ab.created_at) as month,
      ab.urgency_level,
      COUNT(*) as booking_count,
      SUM(ab.urgency_surcharge_amount) as total_surcharge,
      SUM(ab.urgency_contractor_bonus) as total_contractor_bonus,
      SUM(ab.urgency_platform_revenue) as total_platform_revenue
    FROM appointment_bookings ab
    WHERE ab.urgency_level IS NOT NULL
      AND ab.status IN ('completed', 'completed_by_contractor')
    GROUP BY DATE_TRUNC('month', ab.created_at), ab.urgency_level
    ORDER BY month DESC, ab.urgency_level
  `,
};
```

---

## 5. Platform-Level Urgency Configuration

### Problem Statement
Admins need a UI to:
- Configure global surcharge percentages for each tier
- Set contractor/platform revenue split
- Add service-specific overrides
- Enable/disable tiers globally
- View performance dashboard

### Technical Solution

**Admin UI Components:**

1. **Tier Configuration Panel**
   ```typescript
   interface TierConfig {
     urgencyLevel: 'express' | 'fast' | 'today';
     label: string; // "Express (<1h)", "Rapide (1h-2h)", etc.
     minMinutes: number;
     maxMinutes: number;
     globalSurchargePercent: number; // Editable
     contractorSharePercent: number; // Editable (default 50%)
     platformSharePercent: number; // Auto-calculated (100 - contractorShare)
     isActive: boolean; // Toggle
     effectiveFrom: Date;
   }
   ```

2. **Service-Specific Override Form**
   ```typescript
   interface ServiceOverride {
     serviceId: number;
     serviceName: string;
     urgencyLevel: 'express' | 'fast' | 'today';
     overrideSurchargePercent: number;
     reason: string; // "Coiffure nécessite plus de matériel"
   }
   ```

3. **Dashboard Widgets**
   - Volume by tier (last 30 days)
   - Conversion rate by tier
   - Average surcharge amount
   - Total revenue (contractor + platform)
   - Satisfaction rating by tier

**Edge Function: `admin-update-urgency-pricing`**
```typescript
async function updateUrgencyPricing(
  urgencyLevel: string,
  config: Partial<TierConfig>
) {
  // 1. Validate admin permission
  const user = await getCurrentUser();
  if (user.role !== 'admin') {
    throw new Error('Unauthorized');
  }

  // 2. Validate revenue split
  if (config.contractorSharePercent) {
    if (config.contractorSharePercent < 0 || config.contractorSharePercent > 100) {
      throw new Error('Invalid contractor share percentage');
    }
  }

  // 3. Archive current config
  const currentConfig = await db
    .from('platform_urgency_pricing')
    .select('*')
    .eq('urgency_level', urgencyLevel)
    .eq('is_active', true)
    .is('service_id', null)
    .single();

  if (currentConfig) {
    await db
      .from('platform_urgency_pricing')
      .update({
        is_active: false,
        effective_until: new Date(),
      })
      .eq('id', currentConfig.id);
  }

  // 4. Create new config
  const newConfig = await db
    .from('platform_urgency_pricing')
    .insert({
      urgency_level: urgencyLevel,
      min_minutes: config.minMinutes ?? currentConfig.min_minutes,
      max_minutes: config.maxMinutes ?? currentConfig.max_minutes,
      global_surcharge_percent: config.globalSurchargePercent ?? currentConfig.global_surcharge_percent,
      contractor_share_percent: config.contractorSharePercent ?? currentConfig.contractor_share_percent,
      platform_share_percent: 100 - (config.contractorSharePercent ?? currentConfig.contractor_share_percent),
      is_active: true,
      effective_from: new Date(),
    })
    .select()
    .single();

  // 5. Invalidate cache
  await invalidatePricingCache();

  return newConfig;
}
```

---

## 6. Integration Points

### Dependency Map

**Spec 007 (Contractor Interface):**
- Reads: `contractor_services` (which services contractor offers)
- Writes: `contractor_urgency_config` (new table for opt-in)

**Spec 003 (Booking Flow):**
- Reads: `appointment_bookings` base structure
- Writes: New columns (urgency_level, urgency_surcharge_amount, etc.)
- Extends: Payment flow to handle urgency premiums

**Spec 002 (Availability Calculation):**
- Uses: Existing availability algorithm
- Extends: Add urgency-specific filters (travel time, Ready to Go slots)

**Spec 004 (Payment):**
- Extends: Stripe payment flow to split urgency bonus to contractor

**Spec 008 (Notifications):**
- Uses: PWA push notification system
- Adds: Priority notification channel for urgent bookings

### Data Flow

```
Client selects urgency tier
  ↓
Calculate pricing (platform_urgency_pricing)
  ↓
Check contractor availability (contractor_urgency_config + spec 002)
  ↓
Display available slots with pricing breakdown
  ↓
Client confirms booking
  ↓
Create appointment_bookings with urgency fields
  ↓
Send urgent notification (urgent_notifications)
  ↓
Contractor accepts (5-min window)
  ↓
Log analytics (urgency_analytics)
  ↓
Complete booking
  ↓
Split payment: base → contractor, bonus → contractor, platform fee
```

---

## 7. Performance & Scalability

### Bottlenecks Identified

1. **Travel Time Calculation**
   - Problem: Google Distance Matrix API calls are slow (200-500ms)
   - Solution: Cache contractor → client travel times for 1 hour
   - Optimization: Pre-calculate common routes during off-peak

2. **Availability Queries**
   - Problem: Complex SQL with multiple JOINs
   - Solution: Index on (contractor_id, start_datetime, end_datetime) for bookings
   - Optimization: Materialize contractor availability windows (refresh hourly)

3. **Notification Delivery**
   - Problem: Sequential notification attempts cause delays
   - Solution: Parallel notification dispatch (push + email + SMS)
   - Optimization: Pre-load contractor preferences to skip unavailable channels

### Caching Strategy

```typescript
const cacheKeys = {
  pricingConfig: 'urgency:pricing:{urgencyLevel}:{serviceId}', // TTL: 5 min
  contractorAvailability: 'urgency:availability:{contractorId}:{date}', // TTL: 10 min
  travelTime: 'urgency:travel:{contractorId}:{clientPostalCode}', // TTL: 60 min
  weeklyBookingCount: 'urgency:weekly-count:{contractorId}:{weekStart}', // TTL: 15 min
};
```

---

## 8. Testing Strategy

### Unit Tests

1. **Pricing Calculation**
   - Test global surcharge
   - Test service-specific override
   - Test contractor/platform split
   - Test rounding edge cases

2. **Availability Logic**
   - Test time window filtering
   - Test travel time exclusion
   - Test weekly limit enforcement
   - Test buffer time calculation

3. **Notification Routing**
   - Test channel selection by tier
   - Test timeout handling
   - Test reassignment logic

### Integration Tests

1. **Complete Booking Flow**
   - Client selects Express tier
   - System calculates pricing
   - System finds available contractor
   - Notification sent
   - Contractor accepts
   - Booking completed
   - Payment split correctly

2. **Edge Cases**
   - No contractors available → Show message
   - All contractors timeout → Cancel + refund
   - Contractor cancels after accept → Reassign
   - Service override not found → Use global

### Load Tests

- **Scenario 1:** 100 concurrent urgency availability checks
  - Target: <2s response time
  - Metrics: Database connections, API calls, cache hit rate

- **Scenario 2:** 50 urgent notifications sent simultaneously
  - Target: All delivered within 10s
  - Metrics: Notification queue depth, delivery confirmation rate

---

## 9. Security Considerations

### Access Control

1. **Pricing Configuration**
   - Only admins can modify urgency pricing
   - Audit log for all pricing changes
   - RLS policy: `profiles.role = 'admin'`

2. **Contractor Urgency Config**
   - Contractors can only edit their own config
   - RLS policy: `contractor.profile_uuid = auth.uid()`

3. **Booking Creation**
   - Validate urgency pricing server-side (don't trust client)
   - Verify contractor actually has urgency enabled
   - Check weekly booking limit before assignment

### Data Validation

```typescript
// Server-side validation
function validateUrgentBooking(booking: BookingRequest) {
  // 1. Verify urgency tier is active
  const config = await getPricingConfig(booking.urgencyLevel);
  if (!config.is_active) {
    throw new Error('Urgency tier not available');
  }

  // 2. Verify contractor has urgency enabled
  const contractorConfig = await getContractorUrgencyConfig(booking.contractorId);
  if (!contractorConfig.is_enabled) {
    throw new Error('Contractor not available for urgent bookings');
  }

  // 3. Recalculate pricing (don't trust client-sent price)
  const calculatedPrice = await calculateUrgencyPricing(
    booking.basePrice,
    booking.urgencyLevel,
    booking.serviceId
  );
  if (Math.abs(calculatedPrice.totalPrice - booking.totalPrice) > 0.01) {
    throw new Error('Price mismatch');
  }

  // 4. Verify time window
  const now = new Date();
  const bookingTime = new Date(booking.scheduledStart);
  const minutesUntil = (bookingTime.getTime() - now.getTime()) / 1000 / 60;

  if (minutesUntil < config.min_minutes || minutesUntil > config.max_minutes) {
    throw new Error('Booking time outside urgency window');
  }

  return true;
}
```

---

## 10. Rollout Plan

### Phase 1: Platform Configuration (Week 1)
- Migrate urgency pricing tables
- Seed initial configs (Express 50%, Rapide 30%, Aujourd'hui 15%)
- Build admin configuration UI
- Test pricing calculation

### Phase 2: Contractor Opt-In (Week 2)
- Migrate contractor_urgency_config table
- Build contractor settings UI
- Test availability filtering
- Invite 10 pilot contractors

### Phase 3: Client Booking Flow (Week 3)
- Add urgency tier selection to booking UI
- Implement availability check with urgency filters
- Test end-to-end booking flow
- Soft launch to 100 beta clients

### Phase 4: Notifications & Analytics (Week 4)
- Implement urgent notification system
- Build analytics dashboard
- Test reassignment logic
- Monitor pilot metrics

### Phase 5: Full Launch (Week 5)
- Enable for all contractors (opt-in)
- Enable for all clients
- Monitor conversion rates
- Optimize based on data

---

## 11. Monitoring & Alerts

### Key Metrics

```typescript
const alerts = {
  // Critical alerts
  noContractorsAvailable: {
    condition: 'urgency_analytics.status = "no_contractor" count > 10 in 1 hour',
    action: 'Notify on-call admin + SMS',
    severity: 'critical',
  },

  lowConversionRate: {
    condition: 'conversion_rate < 60% for any tier in last 24h',
    action: 'Email ops team',
    severity: 'warning',
  },

  highTimeoutRate: {
    condition: 'timeout_rate > 30% for any tier in last 2 hours',
    action: 'Check notification system + Slack alert',
    severity: 'warning',
  },

  // Performance alerts
  slowAvailabilityCheck: {
    condition: 'P95 response time > 3s for urgency availability API',
    action: 'Check database performance + cache hit rate',
    severity: 'warning',
  },
};
```

### Logging

```typescript
// Structured logs for debugging
logger.info('urgency_booking_created', {
  bookingId,
  urgencyLevel,
  surchargeAmount,
  contractorId,
  travelTime,
  responseTime: Date.now() - startTime,
});

logger.warn('urgency_contractor_timeout', {
  notificationId,
  contractorId,
  urgencyLevel,
  attemptNumber,
});

logger.error('urgency_booking_failed', {
  bookingId,
  reason: 'no_contractor_available',
  attemptsCount: 3,
  urgencyLevel,
});
```

---

## Decision Summary

| Decision | Selected Approach | Rationale |
|----------|------------------|-----------|
| Pricing Calculation | On-the-fly from platform config | Accuracy, maintainability |
| Availability Check | Database-side with spec 002 algorithm | Consistency with existing system |
| Notification Priority | Push → SMS (Express) → Email | Balance speed and cost |
| Timeout Handling | Sequential reassignment (max 3) | Simple, predictable |
| Analytics Storage | Dedicated urgency_analytics table | Clean separation, easy queries |
| Admin Configuration | Platform-level with service overrides | Flexible, scalable |
| Contractor Opt-In | Simple ON/OFF + time slots | Low barrier to entry |
| Travel Time | Google Distance Matrix with cache | Accurate, cost-effective |

---

**Last Updated:** 2025-11-07
**Reviewed By:** Technical Lead
**Status:** Approved for Implementation
