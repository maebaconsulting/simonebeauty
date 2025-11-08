# API Contracts: Système de Codes Promotionnels

**Feature**: 015-promo-codes-system
**Date**: 2025-11-07
**Phase**: 1 - API Contracts Definition
**Status**: 📋 Defined

## Overview

This document defines all API endpoints for the promo codes system, including:
- **Supabase REST API** (direct database queries via PostgREST)
- **Supabase RPC** (SQL function calls)
- **Edge Functions** (custom serverless endpoints)

---

## 1. Validate Promo Code (Real-time)

### Endpoint
```
POST /rest/v1/rpc/validate_promo_code
```

### Purpose
Validate a promo code in real-time during checkout.

### Authentication
Required: JWT Bearer token

### Request Body
```typescript
{
  p_code: string              // Promo code to validate
  p_user_id: string           // UUID of the user
  p_service_id: number        // Service being booked
  p_service_amount: number    // Original service amount
}
```

### Response (200 OK)
```typescript
{
  is_valid: boolean
  promo_id: number | null
  discount_amount: number | null
  final_amount: number | null
  error_message: string | null
}
```

### Error Responses

**400 Bad Request** - Invalid parameters
```json
{
  "error": "Missing required parameter: p_code"
}
```

**429 Too Many Requests** - Rate limit exceeded
```json
{
  "error": "Trop de tentatives. Réessayez dans 1 minute."
}
```

### Example Usage
```typescript
const { data, error } = await supabase.rpc('validate_promo_code', {
  p_code: 'BIENVENUE20',
  p_user_id: user.id,
  p_service_id: 42,
  p_service_amount: 120.00
})

if (data.is_valid) {
  // Apply promo: data.discount_amount, data.final_amount
} else {
  // Show error: data.error_message
}
```

### Business Rules Checked
- Code exists and is active (`is_active = true`)
- Within validity period (`valid_from <= now <= valid_until`)
- Not exhausted (`uses_count < max_uses`)
- User hasn't exceeded per-user limit
- First booking only restriction (if applicable)
- Minimum order amount met
- Service/category eligibility

---

## 2. List Promo Codes (Admin)

### Endpoint
```
GET /rest/v1/promo_codes
```

### Purpose
List all promo codes with filtering and pagination (admin dashboard).

### Authentication
Required: JWT Bearer token + Admin role

### Query Parameters
```typescript
{
  select?: string              // Columns to return (default: *)
  is_active?: boolean          // Filter by active status
  discount_type?: string       // Filter by type (percentage/fixed_amount)
  valid_from?: string          // Filter by start date (gte)
  valid_until?: string         // Filter by end date (lte)
  order?: string               // Sort order (e.g., "created_at.desc")
  offset?: number              // Pagination offset
  limit?: number               // Pagination limit (default: 50, max: 100)
}
```

### Response (200 OK)
```typescript
PromoCode[]  // Array of promo code objects
```

### Headers
- `Content-Range`: Total count for pagination (e.g., `0-49/347`)

### Example Usage
```typescript
// Get active codes, sorted by creation date
const { data, error, count } = await supabase
  .from('promo_codes')
  .select('*', { count: 'exact' })
  .eq('is_active', true)
  .order('created_at', { ascending: false })
  .range(0, 49)

// Total pages = Math.ceil(count / 50)
```

---

## 3. Create Promo Code (Admin)

### Endpoint
```
POST /rest/v1/promo_codes
```

### Purpose
Create a new promo code.

### Authentication
Required: JWT Bearer token + Admin role

### Request Body
```typescript
{
  code: string                         // Required, unique, 4-50 chars, A-Z0-9
  description?: string | null
  discount_type: 'percentage' | 'fixed_amount'  // Required
  discount_value: number               // Required, > 0
  max_discount_amount?: number | null  // For percentage type
  valid_from?: string | null           // ISO timestamp
  valid_until?: string | null          // ISO timestamp
  max_uses?: number | null
  max_uses_per_user?: number           // Default: 1
  first_booking_only?: boolean         // Default: false
  min_order_amount?: number | null
  specific_services?: number[] | null
  specific_categories?: number[] | null
  is_active?: boolean                  // Default: true
}
```

### Response (201 Created)
```typescript
PromoCode  // The created promo code object
```

### Error Responses

**400 Bad Request** - Validation error
```json
{
  "error": "duplicate key value violates unique constraint \"promo_codes_code_key\"",
  "details": "Key (code)=(BIENVENUE20) already exists."
}
```

**403 Forbidden** - Not admin
```json
{
  "error": "You do not have permission to perform this action"
}
```

### Example Usage
```typescript
const { data, error } = await supabase
  .from('promo_codes')
  .insert({
    code: 'VALENTIN25',
    description: 'Saint-Valentin 2025 - 25% sur massages duo',
    discount_type: 'percentage',
    discount_value: 25,
    max_discount_amount: 40,
    valid_from: '2025-02-01T00:00:00Z',
    valid_until: '2025-02-14T23:59:59Z',
    max_uses: 200,
    max_uses_per_user: 1,
    specific_categories: [5],  // Massage category ID
    is_active: true
  })
  .select()
  .single()
```

---

## 4. Update Promo Code (Admin)

### Endpoint
```
PATCH /rest/v1/promo_codes?id=eq.{id}
```

### Purpose
Update an existing promo code.

### Authentication
Required: JWT Bearer token + Admin role

### Request Body
```typescript
{
  // Same fields as Create, all optional
  description?: string | null
  max_uses?: number | null
  valid_until?: string | null
  is_active?: boolean
  // etc.
}
```

### Response (200 OK)
```typescript
PromoCode  // The updated promo code object
```

### Business Rules
- **Cannot edit** `code` field after creation (immutable)
- **Cannot edit** if `uses_count > 0` (data integrity protection)
- Can only toggle `is_active` to disable temporarily

### Example Usage
```typescript
// Extend validity period
const { data, error } = await supabase
  .from('promo_codes')
  .update({ valid_until: '2025-02-28T23:59:59Z' })
  .eq('id', 42)
  .eq('uses_count', 0)  // Safety check
  .select()
  .single()
```

---

## 5. Delete Promo Code (Admin)

### Endpoint
```
DELETE /rest/v1/promo_codes?id=eq.{id}
```

### Purpose
Delete a promo code (soft delete recommended).

### Authentication
Required: JWT Bearer token + Admin role

### Response (204 No Content)

### Business Rules
- **Cannot delete** if `uses_count > 0` (RLS policy prevents this)
- Recommended: Use `is_active = false` instead of DELETE

### Example Usage
```typescript
// Soft delete (recommended)
const { error } = await supabase
  .from('promo_codes')
  .update({ is_active: false })
  .eq('id', 42)

// Hard delete (only if uses_count = 0)
const { error } = await supabase
  .from('promo_codes')
  .delete()
  .eq('id', 42)
  .eq('uses_count', 0)
```

---

## 6. Get Promo Analytics (Admin)

### Endpoint
```
POST /rest/v1/rpc/get_promo_analytics
```

### Purpose
Get aggregated analytics for promo codes dashboard.

### Authentication
Required: JWT Bearer token + Admin role

### Request Body
```typescript
{
  date_from?: string | null    // ISO timestamp (default: 30 days ago)
  date_to?: string | null      // ISO timestamp (default: now)
}
```

### Response (200 OK)
```typescript
{
  active_codes_count: number
  total_uses: number
  total_platform_cost: number
  total_revenue_generated: number
  roi_percentage: number
  average_discount_per_use: number
  top_codes: {
    code: string
    uses_count: number
    total_discount: number
    average_discount: number
    total_revenue: number
    conversion_rate: number
  }[]
}
```

### Example Usage
```typescript
const { data, error } = await supabase.rpc('get_promo_analytics', {
  date_from: '2025-01-01T00:00:00Z',
  date_to: '2025-01-31T23:59:59Z'
})

console.log(`ROI: ${data.roi_percentage}%`)
console.log(`Top code: ${data.top_codes[0].code}`)
```

---

## 7. Get Promo Code Usage History

### Endpoint
```
GET /rest/v1/promo_code_usage
```

### Purpose
Get usage history for a specific promo code (admin analytics).

### Authentication
Required: JWT Bearer token + Admin role

### Query Parameters
```typescript
{
  promo_code_id: number        // Filter by promo code ID
  select?: string              // Join with related tables
  order?: string               // Sort order
  offset?: number
  limit?: number
}
```

### Response (200 OK)
```typescript
PromoCodeUsage[]
```

### Example Usage
```typescript
// Get all uses for a specific code with user details
const { data, error } = await supabase
  .from('promo_code_usage')
  .select(`
    *,
    promo_codes(code, description),
    profiles(email, full_name),
    appointment_bookings(service_id, services(name))
  `)
  .eq('promo_code_id', 42)
  .order('used_at', { ascending: false })
```

---

## 8. Export Promo Usage (CSV)

### Endpoint
```
GET /api/promo/export
```

### Purpose
Export all promo code usages to CSV file.

### Authentication
Required: JWT Bearer token + Admin role

### Query Parameters
```typescript
{
  date_from?: string           // ISO date (YYYY-MM-DD)
  date_to?: string             // ISO date (YYYY-MM-DD)
  promo_code_id?: number       // Filter by specific code
}
```

### Response (200 OK)
```
Content-Type: text/csv; charset=utf-8
Content-Disposition: attachment; filename="promo-codes-export-2025-01-07.csv"

Date,Code,Utilisateur,Email,Service,Montant Original,Réduction,Montant Final
2025-01-07 10:30:00,BIENVENUE20,Marie Dupont,marie@example.com,42,120.00,24.00,96.00
...
```

### Example Usage
```typescript
// Trigger download
const response = await fetch('/api/promo/export?date_from=2025-01-01', {
  headers: {
    'Authorization': `Bearer ${session.access_token}`
  }
})

const blob = await response.blob()
const url = URL.createObjectURL(blob)
const a = document.createElement('a')
a.href = url
a.download = 'promo-codes-export.csv'
a.click()
```

---

## 9. Create Payment Intent with Promo (Edge Function)

### Endpoint
```
POST /functions/v1/create-payment-intent
```

### Purpose
Create Stripe PaymentIntent with promo code information.

### Authentication
Required: JWT Bearer token

### Request Body
```typescript
{
  booking_id: number
  service_id: number
  contractor_id: number
  service_amount: number           // Final amount (after promo)
  service_amount_original?: number // Original amount (if promo applied)
  promo_code_id?: number | null
  promo_discount_amount?: number
  // ... other payment fields
}
```

### Response (200 OK)
```typescript
{
  client_secret: string
  payment_intent_id: string
  amount: number                   // Final amount (reduced)
  metadata: {
    booking_id: number
    contractor_id: number
    service_id: number
    service_amount_original?: number
    promo_code_id?: number
    promo_code?: string
    promo_discount_amount?: number
    contractor_commission_base: number  // Original amount
  }
}
```

### Example Usage
```typescript
const response = await fetch('/functions/v1/create-payment-intent', {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${session.access_token}`,
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    booking_id: 123,
    service_id: 42,
    contractor_id: 7,
    service_amount: 96.00,           // After 20% discount
    service_amount_original: 120.00,
    promo_code_id: 5,
    promo_discount_amount: 24.00
  })
})

const { client_secret } = await response.json()

// Use with Stripe.js
const { error } = await stripe.confirmCardPayment(client_secret)
```

---

## 10. Contractor Transaction Details (View)

### Endpoint
```
GET /rest/v1/contractor_transaction_details
```

### Purpose
Get transaction details with promo information for contractor dashboard.

### Authentication
Required: JWT Bearer token + Contractor role

### Query Parameters
```typescript
{
  contractor_id: number        // Filter by contractor ID
  select?: string
  order?: string
}
```

### Response (200 OK)
```typescript
{
  booking_id: number
  client_name: string
  service_name: string
  service_amount: number              // Final amount paid
  service_amount_original: number     // Original amount (before promo)
  promo_code: string | null
  promo_discount_amount: number
  contractor_commission: number       // Commission on ORIGINAL amount
  commission_rate: number
  booking_date: string
  status: string
}[]
```

### Example Usage
```typescript
const { data, error } = await supabase
  .from('contractor_transaction_details')
  .select('*')
  .eq('contractor_id', user.contractor_id)
  .order('booking_date', { ascending: false })
  .limit(50)
```

---

## Rate Limiting

All endpoints respect the following rate limits:

| Endpoint | Limit | Window | Action on Exceed |
|----------|-------|--------|------------------|
| `validate_promo_code` | 5 requests | 1 minute | 429 + Captcha after 5 failures |
| Promo CRUD (admin) | 100 requests | 1 minute | 429 |
| Analytics | 20 requests | 1 minute | 429 |
| Export CSV | 5 requests | 5 minutes | 429 |

---

## Error Codes

| Code | Meaning | Example |
|------|---------|---------|
| 200 | Success | Request completed successfully |
| 201 | Created | Promo code created |
| 204 | No Content | Delete successful |
| 400 | Bad Request | Invalid parameters, validation error |
| 401 | Unauthorized | Missing or invalid JWT token |
| 403 | Forbidden | Insufficient permissions (not admin) |
| 404 | Not Found | Promo code doesn't exist |
| 409 | Conflict | Duplicate code |
| 429 | Too Many Requests | Rate limit exceeded |
| 500 | Internal Server Error | Server-side error |

---

## TypeScript Client Types

```typescript
// lib/api/promo-codes.ts

import { supabase } from '@/lib/supabase/client'
import type {
  PromoCode,
  PromoCodeUsage,
  PromoValidationResult,
  PromoAnalyticsKPIs
} from '@/types/promo-code'

export const promoCodesApi = {
  /**
   * Validate a promo code
   */
  async validate(params: {
    code: string
    userId: string
    serviceId: number
    amount: number
  }): Promise<PromoValidationResult> {
    const { data, error } = await supabase.rpc('validate_promo_code', {
      p_code: params.code,
      p_user_id: params.userId,
      p_service_id: params.serviceId,
      p_service_amount: params.amount
    })

    if (error) throw error
    return data
  },

  /**
   * List promo codes (admin)
   */
  async list(filters?: {
    isActive?: boolean
    offset?: number
    limit?: number
  }): Promise<{ data: PromoCode[], count: number }> {
    let query = supabase
      .from('promo_codes')
      .select('*', { count: 'exact' })

    if (filters?.isActive !== undefined) {
      query = query.eq('is_active', filters.isActive)
    }

    query = query.range(
      filters?.offset || 0,
      (filters?.offset || 0) + (filters?.limit || 50) - 1
    )

    const { data, error, count } = await query

    if (error) throw error
    return { data: data || [], count: count || 0 }
  },

  /**
   * Create promo code (admin)
   */
  async create(promo: Partial<PromoCode>): Promise<PromoCode> {
    const { data, error } = await supabase
      .from('promo_codes')
      .insert(promo)
      .select()
      .single()

    if (error) throw error
    return data
  },

  /**
   * Update promo code (admin)
   */
  async update(id: number, updates: Partial<PromoCode>): Promise<PromoCode> {
    const { data, error } = await supabase
      .from('promo_codes')
      .update(updates)
      .eq('id', id)
      .select()
      .single()

    if (error) throw error
    return data
  },

  /**
   * Get analytics (admin)
   */
  async getAnalytics(dateRange?: {
    from: Date
    to: Date
  }): Promise<PromoAnalyticsKPIs> {
    const { data, error } = await supabase.rpc('get_promo_analytics', {
      date_from: dateRange?.from.toISOString(),
      date_to: dateRange?.to.toISOString()
    })

    if (error) throw error
    return data
  }
}
```

---

## Next Steps

1. ✅ **API Contracts Defined**: All endpoints documented
2. ✅ **TypeScript Client**: Helper functions for type-safe API calls
3. ⏭️ **Quickstart Guide**: Developer guide for implementing features
4. ⏭️ **Implementation**: Generate tasks.md with /speckit.tasks

---

**Last Updated**: 2025-11-07
**Status**: ✅ API Contracts Complete - Ready for Quickstart Guide
