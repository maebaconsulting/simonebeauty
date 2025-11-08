# Data Model: Système de Codes Promotionnels

**Feature**: 015-promo-codes-system
**Date**: 2025-11-07
**Phase**: 1 - Data Model Definition
**Status**: ✅ Backend Implemented | 📋 TypeScript Types Defined

## Overview

This document defines all data entities for the promo codes system. The **backend schema is already implemented** in PostgreSQL. This document focuses on defining the **TypeScript types** for frontend consumption.

---

## Backend Entities (Already Implemented)

### 1. PromoCode

**Table**: `promo_codes`
**Purpose**: Stores promo code definitions with business rules

**Columns**:
```sql
id                    BIGINT PRIMARY KEY (auto-increment)
code                  VARCHAR(50) UNIQUE NOT NULL
description           TEXT
discount_type         VARCHAR(20) CHECK (IN ('percentage', 'fixed_amount'))
discount_value        DECIMAL(10, 2) NOT NULL
max_discount_amount   DECIMAL(10, 2)          -- For percentage type
valid_from            TIMESTAMP
valid_until           TIMESTAMP
max_uses              INT
uses_count            INT DEFAULT 0 NOT NULL
max_uses_per_user     INT DEFAULT 1
first_booking_only    BOOLEAN DEFAULT false
min_order_amount      DECIMAL(10, 2)
specific_services     BIGINT[]                -- Service IDs
specific_categories   BIGINT[]                -- Category IDs
is_active             BOOLEAN DEFAULT true
created_at            TIMESTAMP DEFAULT NOW()
updated_at            TIMESTAMP DEFAULT NOW()
```

**Indexes**:
- `idx_promo_codes_code` on (code) - Fast lookup by code
- `idx_promo_codes_active_valid` on (is_active, valid_from, valid_until) - Active codes query

**RLS Policies**:
- Admin: Full access (INSERT, UPDATE, SELECT)
- Authenticated users: SELECT only on active codes
- Public: No access

---

### 2. PromoCodeUsage

**Table**: `promo_code_usage`
**Purpose**: Audit trail of all promo code uses

**Columns**:
```sql
id                BIGINT PRIMARY KEY (auto-increment)
promo_code_id     BIGINT NOT NULL REFERENCES promo_codes(id)
booking_id        BIGINT NOT NULL REFERENCES appointment_bookings(id)
user_id           UUID NOT NULL REFERENCES auth.users(id)
original_amount   DECIMAL(10, 2) NOT NULL
discount_amount   DECIMAL(10, 2) NOT NULL
final_amount      DECIMAL(10, 2) NOT NULL
used_at           TIMESTAMP DEFAULT NOW()

UNIQUE (promo_code_id, booking_id)
```

**Indexes**:
- `idx_promo_usage_promo_code` on (promo_code_id, used_at DESC) - Analytics queries
- `idx_promo_usage_user` on (user_id, used_at DESC) - User history

**RLS Policies**:
- Admin: Full access
- Users: SELECT own usage only
- Contractors: No direct access (via views)

---

### 3. AppointmentBooking (Extended)

**Table**: `appointment_bookings`
**Purpose**: Booking records with promo code information

**New Columns**:
```sql
service_amount_original   DECIMAL(10, 2)   -- Prix avant réduction
promo_code_id             BIGINT REFERENCES promo_codes(id)
promo_discount_amount     DECIMAL(10, 2) DEFAULT 0
```

**Existing Columns** (relevant):
```sql
id                    BIGINT PRIMARY KEY
service_amount        DECIMAL(10, 2)   -- Prix final (après réduction)
contractor_id         BIGINT REFERENCES contractors(id)
client_id             UUID REFERENCES profiles(id)
service_id            BIGINT REFERENCES services(id)
status                VARCHAR(50)
created_at            TIMESTAMP
```

---

## Frontend TypeScript Types

### Core Types

```typescript
// types/promo-code.ts

/**
 * Promo code discount type
 */
export type DiscountType = 'percentage' | 'fixed_amount'

/**
 * Promo code status for UI display
 */
export type PromoCodeStatus = 'active' | 'expired' | 'exhausted' | 'scheduled' | 'inactive'

/**
 * Promo code entity from database
 */
export interface PromoCode {
  id: number
  code: string
  description: string | null
  discount_type: DiscountType
  discount_value: number
  max_discount_amount: number | null
  valid_from: string | null  // ISO timestamp
  valid_until: string | null  // ISO timestamp
  max_uses: number | null
  uses_count: number
  max_uses_per_user: number
  first_booking_only: boolean
  min_order_amount: number | null
  specific_services: number[] | null
  specific_categories: number[] | null
  is_active: boolean
  created_at: string  // ISO timestamp
  updated_at: string  // ISO timestamp
}

/**
 * Promo code usage record
 */
export interface PromoCodeUsage {
  id: number
  promo_code_id: number
  booking_id: number
  user_id: string
  original_amount: number
  discount_amount: number
  final_amount: number
  used_at: string  // ISO timestamp
}

/**
 * Appointment booking with promo information
 */
export interface AppointmentBookingWithPromo {
  id: number
  service_id: number
  contractor_id: number
  client_id: string
  service_amount: number              // Final amount
  service_amount_original: number | null  // Original amount (if promo applied)
  promo_code_id: number | null
  promo_discount_amount: number
  status: string
  created_at: string
  // Relations (if included in query)
  promo_code?: PromoCode
  service?: Service
  contractor?: Contractor
}
```

### Validation Types

```typescript
// types/promo-validation.ts

/**
 * Parameters for promo code validation
 */
export interface ValidatePromoParams {
  code: string
  userId: string
  serviceId: number
  amount: number
}

/**
 * Result from validate_promo_code() SQL function
 */
export interface PromoValidationResult {
  is_valid: boolean
  promo_id: number | null
  discount_amount: number | null
  final_amount: number | null
  error_message: string | null
}

/**
 * Applied promo code state (UI)
 */
export interface AppliedPromo {
  code: string
  promo_id: number
  original_amount: number
  discount_amount: number
  final_amount: number
  discount_type: DiscountType
  discount_value: number
}
```

### Form Types

```typescript
// types/promo-form.ts
import { z } from 'zod'

/**
 * Zod schema for promo code creation/editing
 */
export const promoCodeFormSchema = z.object({
  code: z
    .string()
    .min(4, 'Le code doit contenir au moins 4 caractères')
    .max(50, 'Le code ne peut pas dépasser 50 caractères')
    .regex(/^[A-Z0-9]+$/, 'Le code doit contenir uniquement des lettres majuscules et des chiffres')
    .transform(val => val.toUpperCase()),

  description: z
    .string()
    .max(500, 'La description ne peut pas dépasser 500 caractères')
    .optional(),

  discount_type: z.enum(['percentage', 'fixed_amount'], {
    required_error: 'Veuillez choisir un type de réduction'
  }),

  discount_value: z
    .number()
    .positive('La valeur doit être positive')
    .max(100, 'Le pourcentage ne peut pas dépasser 100%'),

  max_discount_amount: z
    .number()
    .positive('Le montant maximum doit être positif')
    .optional()
    .nullable(),

  valid_from: z.date().optional().nullable(),
  valid_until: z.date().optional().nullable(),

  max_uses: z
    .number()
    .int('Le nombre doit être entier')
    .positive('Le nombre doit être positif')
    .optional()
    .nullable(),

  max_uses_per_user: z
    .number()
    .int('Le nombre doit être entier')
    .positive('Le nombre doit être positif')
    .default(1),

  first_booking_only: z.boolean().default(false),

  min_order_amount: z
    .number()
    .positive('Le montant minimum doit être positif')
    .optional()
    .nullable(),

  specific_services: z.array(z.number()).optional().nullable(),
  specific_categories: z.array(z.number()).optional().nullable(),

  is_active: z.boolean().default(true)
})
.refine(
  data => data.discount_type !== 'percentage' || data.discount_value <= 100,
  {
    message: 'Le pourcentage ne peut pas dépasser 100%',
    path: ['discount_value']
  }
)
.refine(
  data => !data.valid_until || !data.valid_from || data.valid_until > data.valid_from,
  {
    message: 'La date de fin doit être postérieure à la date de début',
    path: ['valid_until']
  }
)

/**
 * Inferred TypeScript type from Zod schema
 */
export type PromoCodeFormData = z.infer<typeof promoCodeFormSchema>
```

### Analytics Types

```typescript
// types/promo-analytics.ts

/**
 * KPIs for analytics dashboard
 */
export interface PromoAnalyticsKPIs {
  active_codes_count: number
  total_uses: number
  total_platform_cost: number
  total_revenue_generated: number
  roi_percentage: number
  average_discount_per_use: number
}

/**
 * Top performing promo code
 */
export interface TopPromoCode {
  code: string
  promo_id: number
  uses_count: number
  total_discount: number
  average_discount: number
  total_revenue: number
  conversion_rate: number  // % of validations that resulted in bookings
}

/**
 * Usage chart data point (aggregated by day)
 */
export interface PromoUsageChartData {
  date: string  // YYYY-MM-DD
  uses_count: number
  total_discount: number
  total_revenue: number
}

/**
 * Detailed code performance
 */
export interface PromoCodePerformance {
  promo_id: number
  code: string
  description: string | null
  discount_type: DiscountType
  discount_value: number
  uses_count: number
  unique_users: number
  total_platform_cost: number
  total_revenue_generated: number
  roi_percentage: number
  average_order_value: number
  conversion_rate: number
  created_at: string
  chart_data: PromoUsageChartData[]
  recent_uses: PromoCodeUsageDetail[]
}

/**
 * Usage detail for code performance view
 */
export interface PromoCodeUsageDetail {
  booking_id: number
  user_email: string
  user_name: string
  service_name: string
  original_amount: number
  discount_amount: number
  final_amount: number
  used_at: string
}
```

### Filter Types

```typescript
// types/promo-filters.ts

/**
 * Filters for admin promo code list
 */
export interface PromoCodeFilters {
  search?: string  // Search by code or description
  status?: PromoCodeStatus
  discount_type?: DiscountType
  date_from?: Date
  date_to?: Date
  sort_by?: 'created_at' | 'uses_count' | 'code' | 'valid_until'
  sort_order?: 'asc' | 'desc'
}

/**
 * Pagination params
 */
export interface PaginationParams {
  page: number
  per_page: number
}

/**
 * Paginated response
 */
export interface PaginatedResponse<T> {
  data: T[]
  total_count: number
  page: number
  per_page: number
  total_pages: number
}
```

---

## Computed Fields & Helpers

### Status Computation

```typescript
// lib/utils/promo-status.ts

/**
 * Compute promo code status from database fields
 */
export function getPromoCodeStatus(promo: PromoCode): PromoCodeStatus {
  if (!promo.is_active) return 'inactive'

  const now = new Date()

  // Check if scheduled (not started yet)
  if (promo.valid_from && new Date(promo.valid_from) > now) {
    return 'scheduled'
  }

  // Check if expired
  if (promo.valid_until && new Date(promo.valid_until) < now) {
    return 'expired'
  }

  // Check if exhausted
  if (promo.max_uses && promo.uses_count >= promo.max_uses) {
    return 'exhausted'
  }

  return 'active'
}
```

### Discount Calculation

```typescript
// lib/utils/promo-calculations.ts

/**
 * Calculate discount amount based on promo code rules
 */
export function calculateDiscount(
  promo: PromoCode,
  serviceAmount: number
): number {
  if (promo.discount_type === 'percentage') {
    const discount = (serviceAmount * promo.discount_value) / 100

    // Apply max discount cap if defined
    if (promo.max_discount_amount) {
      return Math.min(discount, promo.max_discount_amount)
    }

    return discount
  } else {
    // Fixed amount - cannot exceed service amount
    return Math.min(promo.discount_value, serviceAmount)
  }
}

/**
 * Calculate final amount after discount
 */
export function calculateFinalAmount(
  originalAmount: number,
  discountAmount: number
): number {
  return Math.max(0, originalAmount - discountAmount)
}

/**
 * Calculate ROI percentage
 */
export function calculateROI(
  revenueGenerated: number,
  platformCost: number
): number {
  if (platformCost === 0) return 0
  return ((revenueGenerated - platformCost) / platformCost) * 100
}
```

---

## Relationships

```
promo_codes (1) ──< (N) promo_code_usage
promo_codes (1) ──< (N) appointment_bookings

promo_code_usage (N) >── (1) appointment_bookings
promo_code_usage (N) >── (1) auth.users (client)

appointment_bookings (N) >── (1) services
appointment_bookings (N) >── (1) contractors
appointment_bookings (N) >── (1) profiles (client)
```

---

## State Transitions

### Promo Code Lifecycle

```
[CREATED]
   ↓
   is_active = true, valid_from > now
   ↓
[SCHEDULED] ───→ Admin sets is_active = false ───→ [INACTIVE]
   ↓
   valid_from <= now <= valid_until
   ↓
[ACTIVE] ───────→ Admin sets is_active = false ───→ [INACTIVE]
   ↓                ↓
   uses_count >= max_uses  OR  now > valid_until
   ↓                ↓
[EXHAUSTED]    [EXPIRED]
```

---

## Validation Rules Summary

| Field | Rule | Error Message |
|-------|------|---------------|
| `code` | 4-50 chars, A-Z0-9 only, unique | "Le code doit contenir uniquement des lettres majuscules et des chiffres" |
| `discount_value` | > 0, ≤ 100 if percentage | "Le pourcentage ne peut pas dépasser 100%" |
| `max_discount_amount` | > 0 if defined | "Le montant maximum doit être positif" |
| `valid_until` | > valid_from | "La date de fin doit être postérieure à la date de début" |
| `max_uses` | > 0 if defined | "Le nombre doit être positif" |
| `max_uses_per_user` | > 0 | "Le nombre doit être positif" |
| `min_order_amount` | > 0 if defined | "Le montant minimum doit être positif" |

---

## Database Views (Already Implemented)

### contractor_financial_summary

**Purpose**: Aggregate contractor earnings with promo-aware commission calculation

**Key Logic**:
```sql
-- Commission calculated on ORIGINAL amount (before promo discount)
SUM(
  COALESCE(service_amount_original, service_amount) *
  (100 - commission_rate) / 100
) AS revenue_service
```

### contractor_transaction_details

**Purpose**: Transaction details with promo information for contractor dashboard

**Columns**:
- `booking_id`
- `service_amount` (final amount paid)
- `service_amount_original` (amount before promo)
- `promo_code` (code used, if any)
- `promo_discount_amount`
- `contractor_commission` (calculated on original amount)

---

## Next Steps

1. ✅ **Types Defined**: All TypeScript types and Zod schemas ready
2. ✅ **Validation Rules**: Client-side validation mirrors backend constraints
3. ⏭️ **API Contracts**: Generate OpenAPI/TypeScript schemas in `contracts/`
4. ⏭️ **Quickstart Guide**: Developer guide for using these types

---

**Last Updated**: 2025-11-07
**Status**: ✅ Data Model Complete - Ready for API Contracts
