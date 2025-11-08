# Research: Système de Codes Promotionnels (Frontend)

**Feature**: 015-promo-codes-system
**Date**: 2025-11-07
**Phase**: 0 - Technical Research
**Status**: ✅ Complete

## Overview

This document captures research decisions for implementing the promo codes frontend. All technical unknowns from the plan have been researched and decided.

---

## 1. TanStack Query Patterns for Promo Validation

### Decision
Use TanStack Query with **optimistic updates disabled** for promo validation to ensure accurate real-time feedback.

### Rationale
- **Validation must be server-authoritative**: Promo code validation involves complex business rules (usage limits, eligibility, dates) that can only be reliably checked server-side
- **No optimistic updates**: Unlike typical CRUD operations, we cannot predict validation results client-side
- **Aggressive caching inappropriate**: Validation results depend on real-time state (uses_count, user history)

### Implementation Pattern

```typescript
// hooks/usePromoValidation.ts
import { useMutation } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase/client'

export function usePromoValidation() {
  return useMutation({
    mutationFn: async ({
      code,
      userId,
      serviceId,
      amount
    }: ValidatePromoParams) => {
      const { data, error } = await supabase.rpc('validate_promo_code', {
        p_code: code.trim().toUpperCase(),
        p_user_id: userId,
        p_service_id: serviceId,
        p_service_amount: amount
      })

      if (error) throw error
      return data
    },
    // No caching - always fresh validation
    gcTime: 0,
    // Retry only on network errors, not validation failures
    retry: (failureCount, error) => {
      return failureCount < 2 && error.message.includes('network')
    }
  })
}
```

**Cache Strategy**:
- **No caching** for validation (gcTime: 0)
- **No retry** on validation errors (business logic failure ≠ network error)
- **Debouncing** handled at component level (500ms)

### Alternatives Considered
- **Optimistic updates**: Rejected - Cannot reliably predict server validation results
- **Query with staleTime**: Rejected - Validation state changes rapidly (uses_count)
- **Client-side validation**: Rejected - Security risk, business rules too complex

---

## 2. Rate Limiting Strategies

### Decision
Implement rate limiting in **Next.js Middleware** for client routes + **Edge Function** for API.

### Rationale
- **Middleware**: Fast, runs before page render, can block requests early
- **Edge Function**: Necessary for Supabase RPC calls (not routed through Next.js)
- **Dual-layer approach**: Defense in depth (frontend + backend)

### Implementation Pattern

**Middleware** (for web routes):
```typescript
// middleware.ts
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { createClient } from '@supabase/ssr'

const rateLimitMap = new Map<string, { count: number, resetAt: number }>()

export async function middleware(request: NextRequest) {
  const { supabase } = createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) return NextResponse.next()

  const key = `promo_${user.id}`
  const now = Date.now()
  const window = 60000 // 1 minute

  const userLimit = rateLimitMap.get(key)

  if (userLimit && now < userLimit.resetAt) {
    if (userLimit.count >= 5) {
      return NextResponse.json(
        { error: 'Trop de tentatives. Réessayez dans 1 minute.' },
        { status: 429 }
      )
    }
    userLimit.count++
  } else {
    rateLimitMap.set(key, { count: 1, resetAt: now + window })
  }

  return NextResponse.next()
}

export const config = {
  matcher: ['/checkout/:path*', '/api/promo/:path*']
}
```

**Edge Function** (for Supabase RPC):
```typescript
// supabase/functions/validate-promo-realtime/index.ts
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const rateLimitStore = new Map()

Deno.serve(async (req) => {
  const { code, userId, serviceId, amount } = await req.json()

  // Rate limiting
  const key = `promo_${userId}`
  const now = Date.now()
  const limit = rateLimitStore.get(key) || { count: 0, resetAt: now + 60000 }

  if (now < limit.resetAt && limit.count >= 5) {
    return new Response(
      JSON.stringify({
        is_valid: false,
        error_message: 'Trop de tentatives. Réessayez dans 1 minute.'
      }),
      { status: 429, headers: { 'Content-Type': 'application/json' } }
    )
  }

  // Update counter
  rateLimitStore.set(key, {
    count: now < limit.resetAt ? limit.count + 1 : 1,
    resetAt: now < limit.resetAt ? limit.resetAt : now + 60000
  })

  // Call validation
  const supabase = createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
  )

  const { data, error } = await supabase.rpc('validate_promo_code', {
    p_code: code,
    p_user_id: userId,
    p_service_id: serviceId,
    p_service_amount: amount
  })

  return new Response(JSON.stringify(data), {
    headers: { 'Content-Type': 'application/json' }
  })
})
```

### Alternatives Considered
- **Redis**: Rejected - Adds infrastructure complexity, Supabase doesn't include Redis
- **Database table**: Rejected - Too slow for rate limiting (need in-memory)
- **Client-only**: Rejected - Easily bypassed

---

## 3. Captcha Integration

### Decision
Use **hCaptcha** with Next.js integration.

### Rationale
- **Privacy-focused**: Better GDPR compliance than reCAPTCHA
- **No Google dependency**: Aligns with Supabase ecosystem philosophy
- **Invisible mode available**: Can show captcha only after 5 failed attempts
- **Free tier generous**: 1M requests/month

### Implementation Pattern

```typescript
// components/promo-codes/PromoCodeInput.tsx
import HCaptcha from '@hcaptcha/react-hcaptcha'
import { useState } from 'react'

export function PromoCodeInput() {
  const [showCaptcha, setShowCaptcha] = useState(false)
  const [captchaToken, setCaptchaToken] = useState<string | null>(null)
  const [failureCount, setFailureCount] = useState(0)

  const validatePromo = useMutation({
    mutationFn: async (code: string) => {
      const payload = {
        code,
        userId,
        serviceId,
        amount,
        ...(captchaToken && { captcha_token: captchaToken })
      }

      const response = await fetch('/api/promo/validate', {
        method: 'POST',
        body: JSON.stringify(payload)
      })

      if (!response.ok) throw new Error()
      return response.json()
    },
    onError: () => {
      setFailureCount(prev => prev + 1)
      if (failureCount >= 4) {
        setShowCaptcha(true)
      }
    },
    onSuccess: () => {
      setFailureCount(0)
      setShowCaptcha(false)
      setCaptchaToken(null)
    }
  })

  return (
    <div>
      <Input
        placeholder="Code promo"
        onBlur={(e) => validatePromo.mutate(e.target.value)}
      />

      {showCaptcha && (
        <HCaptcha
          sitekey={process.env.NEXT_PUBLIC_HCAPTCHA_SITE_KEY}
          onVerify={(token) => setCaptchaToken(token)}
        />
      )}
    </div>
  )
}
```

**Package**: `@hcaptcha/react-hcaptcha`
**Env vars**: `NEXT_PUBLIC_HCAPTCHA_SITE_KEY`, `HCAPTCHA_SECRET_KEY`

### Alternatives Considered
- **reCAPTCHA**: Rejected - Privacy concerns, Google dependency
- **Turnstile (Cloudflare)**: Rejected - Requires Cloudflare infrastructure
- **Custom solution**: Rejected - Reinventing the wheel, maintenance burden

---

## 4. Real-time Validation UX

### Decision
**Debounced validation** on blur + manual "Appliquer" button for explicit confirmation.

### Rationale
- **Blur event**: Validates when user leaves input (reduces API calls vs onChange)
- **Debouncing**: 500ms delay prevents API spam if user quickly tabs through
- **Explicit button**: Clear user action for applying promo (better UX than auto-apply)
- **Loading state**: Shows validation in progress (spinner + disabled state)
- **Error recovery**: Allows user to retry without re-typing entire code

### Implementation Pattern

```typescript
// components/promo-codes/PromoCodeInput.tsx
import { useState, useCallback } from 'react'
import { useDebouncedCallback } from 'use-debounce'
import { usePromoValidation } from '@/hooks/usePromoValidation'

export function PromoCodeInput({
  onPromoApplied
}: {
  onPromoApplied: (promo: PromoValidationResult) => void
}) {
  const [code, setCode] = useState('')
  const [validationResult, setValidationResult] = useState<PromoValidationResult | null>(null)

  const { mutate: validate, isPending, error } = usePromoValidation()

  const debouncedValidate = useDebouncedCallback((value: string) => {
    if (!value.trim()) return

    validate(
      { code: value, userId, serviceId, amount },
      {
        onSuccess: (result) => {
          setValidationResult(result)
        }
      }
    )
  }, 500)

  const handleApply = () => {
    if (validationResult?.is_valid) {
      onPromoApplied(validationResult)
    }
  }

  return (
    <div className="space-y-2">
      <div className="flex gap-2">
        <Input
          value={code}
          onChange={(e) => {
            setCode(e.target.value.toUpperCase())
            setValidationResult(null)
          }}
          onBlur={(e) => debouncedValidate(e.target.value)}
          placeholder="Code promo"
          disabled={isPending}
        />
        <Button
          onClick={handleApply}
          disabled={!validationResult?.is_valid || isPending}
        >
          {isPending ? <Loader2 className="animate-spin" /> : 'Appliquer'}
        </Button>
      </div>

      {validationResult && !validationResult.is_valid && (
        <p className="text-sm text-destructive">
          {validationResult.error_message}
        </p>
      )}

      {validationResult?.is_valid && (
        <p className="text-sm text-green-600">
          ✓ Vous économisez {formatCurrency(validationResult.discount_amount)}
        </p>
      )}
    </div>
  )
}
```

**Package**: `use-debounce` (for debouncedCallback)

### Alternatives Considered
- **onChange validation**: Rejected - Too many API calls, poor UX
- **Auto-apply on valid**: Rejected - User loses control, confusing
- **No debouncing**: Rejected - API spam, poor performance

---

## 5. Recharts Patterns for Analytics

### Decision
Use **Recharts** with responsive container + date range picker from shadcn/ui.

### Rationale
- **Recharts**: Well-maintained, TypeScript-first, composable API
- **Responsive**: ResponsiveContainer adapts to screen size
- **Accessible**: Built-in ARIA labels, keyboard navigation
- **Theme-aware**: Works with shadcn/ui color system

### Implementation Pattern

```typescript
// components/promo-codes/PromoCodeChart.tsx
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer
} from 'recharts'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { DateRangePicker } from '@/components/ui/date-range-picker'

export function PromoCodeChart({ codeId }: { codeId: number }) {
  const [dateRange, setDateRange] = useState({
    from: subDays(new Date(), 30),
    to: new Date()
  })

  const { data } = useQuery({
    queryKey: ['promo-usage-chart', codeId, dateRange],
    queryFn: async () => {
      const { data } = await supabase
        .from('promo_code_usage')
        .select('used_at, discount_amount')
        .eq('promo_code_id', codeId)
        .gte('used_at', dateRange.from.toISOString())
        .lte('used_at', dateRange.to.toISOString())
        .order('used_at')

      // Aggregate by day
      return aggregateByDay(data)
    }
  })

  return (
    <Card>
      <CardHeader>
        <CardTitle>Utilisation dans le temps</CardTitle>
        <DateRangePicker
          value={dateRange}
          onChange={setDateRange}
        />
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={300}>
          <LineChart data={data}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="date" />
            <YAxis />
            <Tooltip />
            <Line
              type="monotone"
              dataKey="uses"
              stroke="hsl(var(--primary))"
              strokeWidth={2}
            />
          </LineChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  )
}
```

**Packages**:
- `recharts` (charts)
- `date-fns` (date manipulation)
- shadcn/ui `DateRangePicker` component

### Alternatives Considered
- **Chart.js**: Rejected - Not React-native, imperative API
- **Victory**: Rejected - Larger bundle size, less TypeScript support
- **D3.js**: Rejected - Too low-level, steeper learning curve

---

## 6. Stripe Metadata Best Practices

### Decision
Store promo code information in **PaymentIntent metadata** with structured keys.

### Rationale
- **Audit trail**: Metadata persists in Stripe for accounting
- **Webhook access**: Available in webhook events for reconciliation
- **No PII**: Metadata can include code ID, not sensitive user data
- **Searchable**: Can query Stripe API by metadata

### Implementation Pattern

```typescript
// supabase/functions/create-payment-intent/index.ts
const paymentIntent = await stripe.paymentIntents.create({
  amount: finalAmount * 100, // Reduced amount
  currency: 'eur',
  customer: customerId,
  capture_method: 'manual',
  metadata: {
    booking_id: bookingId,
    contractor_id: contractorId,
    service_id: serviceId,
    // Promo code metadata
    service_amount_original: originalAmount,
    promo_code_id: promoCodeId,
    promo_code: promoCode,
    promo_discount_amount: discountAmount,
    promo_discount_type: discountType,
    // Commission calculated on original amount
    contractor_commission_base: originalAmount
  }
})
```

**Metadata keys**:
- `service_amount_original`: Prix avant réduction
- `promo_code_id`: ID du code promo
- `promo_code`: Code promo utilisé (string)
- `promo_discount_amount`: Montant de la réduction
- `promo_discount_type`: "percentage" ou "fixed_amount"
- `contractor_commission_base`: Montant sur lequel la commission est calculée

### Alternatives Considered
- **Custom fields**: Rejected - Not available in Stripe API
- **Description field**: Rejected - Unstructured, hard to parse
- **External DB only**: Rejected - Loses Stripe audit trail

---

## 7. CSV Export Implementation

### Decision
**Server-side generation** via API route with streaming response.

### Rationale
- **Large datasets**: Admin may export 10k+ usage records
- **Memory efficient**: Stream to response, don't load all in memory
- **Security**: Server validates permissions before export
- **Encoding**: UTF-8 BOM for Excel compatibility (French characters)

### Implementation Pattern

```typescript
// app/api/promo/export/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET(request: NextRequest) {
  const supabase = createClient()

  // Verify admin role
  const { data: { user } } = await supabase.auth.getUser()
  if (!user || user.role !== 'admin') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { data } = await supabase
    .from('promo_code_usage')
    .select(`
      used_at,
      promo_codes(code, description),
      profiles(email, full_name),
      appointment_bookings(service_id),
      original_amount,
      discount_amount,
      final_amount
    `)
    .order('used_at', { ascending: false })

  // Generate CSV
  const csv = [
    // UTF-8 BOM for Excel
    '\uFEFF',
    // Header
    'Date,Code,Utilisateur,Email,Service,Montant Original,Réduction,Montant Final\n',
    // Rows
    ...data.map(row =>
      `${row.used_at},${row.promo_codes.code},${row.profiles.full_name},${row.profiles.email},${row.service_id},${row.original_amount},${row.discount_amount},${row.final_amount}\n`
    )
  ].join('')

  return new NextResponse(csv, {
    headers: {
      'Content-Type': 'text/csv; charset=utf-8',
      'Content-Disposition': `attachment; filename="promo-codes-export-${new Date().toISOString()}.csv"`
    }
  })
}
```

### Alternatives Considered
- **Client-side generation**: Rejected - Memory issues with large datasets
- **JSON download**: Rejected - Not Excel-friendly for business users
- **Third-party service**: Rejected - Adds dependency, cost

---

## 8. Anti-Fraud Patterns

### Decision
**Multi-layer approach**: Rate limiting + Captcha + Pattern detection + Admin alerts.

### Rationale
- **Defense in depth**: No single layer is perfect
- **User experience**: Most users never see fraud detection
- **Escalation**: Progressive friction (rate limit → captcha → block → alert)

### Implementation Pattern

**Pattern Detection** (Edge Function):
```typescript
// supabase/functions/detect-fraud-pattern/index.ts
const FRAUD_THRESHOLDS = {
  MAX_VALIDATIONS_PER_HOUR: 20,
  MAX_UNIQUE_CODES_PER_HOUR: 10,
  MAX_FAILURES_PER_HOUR: 15
}

async function detectFraudPattern(userId: string): Promise<FraudAlert | null> {
  const oneHourAgo = new Date(Date.now() - 3600000)

  const { data } = await supabase
    .from('promo_validation_log')
    .select('*')
    .eq('user_id', userId)
    .gte('created_at', oneHourAgo.toISOString())

  const totalValidations = data.length
  const uniqueCodes = new Set(data.map(d => d.code)).size
  const failures = data.filter(d => !d.is_valid).length

  if (totalValidations > FRAUD_THRESHOLDS.MAX_VALIDATIONS_PER_HOUR) {
    return {
      type: 'EXCESSIVE_VALIDATIONS',
      severity: 'HIGH',
      details: `${totalValidations} validations in 1 hour`
    }
  }

  if (uniqueCodes > FRAUD_THRESHOLDS.MAX_UNIQUE_CODES_PER_HOUR) {
    return {
      type: 'CODE_BRUTE_FORCE',
      severity: 'CRITICAL',
      details: `${uniqueCodes} unique codes tested in 1 hour`
    }
  }

  if (failures > FRAUD_THRESHOLDS.MAX_FAILURES_PER_HOUR) {
    return {
      type: 'REPEATED_FAILURES',
      severity: 'MEDIUM',
      details: `${failures} failures in 1 hour`
    }
  }

  return null
}

// Alert admin
async function sendFraudAlert(alert: FraudAlert, userId: string) {
  await supabase
    .from('admin_alerts')
    .insert({
      type: 'FRAUD_DETECTION',
      severity: alert.severity,
      message: `Fraud pattern detected for user ${userId}: ${alert.type}`,
      details: alert.details,
      user_id: userId
    })

  // Optional: Send email to admin via Resend
}
```

**Logging Table**:
```sql
CREATE TABLE promo_validation_log (
  id BIGINT PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
  user_id UUID NOT NULL REFERENCES auth.users(id),
  code VARCHAR(50) NOT NULL,
  is_valid BOOLEAN NOT NULL,
  error_message TEXT,
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_validation_log_user_time ON promo_validation_log(user_id, created_at DESC);
```

### Alternatives Considered
- **IP-based blocking**: Rejected - VPNs bypass, false positives
- **Device fingerprinting**: Rejected - Privacy concerns, GDPR issues
- **Machine learning**: Rejected - Overkill for current scale

---

## Summary

All technical unknowns have been researched and decided. Key decisions:

1. ✅ **TanStack Query**: No caching, no optimistic updates, server-authoritative validation
2. ✅ **Rate Limiting**: Dual-layer (Middleware + Edge Function), in-memory store
3. ✅ **Captcha**: hCaptcha, invisible mode, shown after 5 failures
4. ✅ **Validation UX**: Debounced (500ms), blur event, explicit apply button
5. ✅ **Analytics Charts**: Recharts, responsive, date range picker
6. ✅ **Stripe Metadata**: Structured keys for promo info, audit trail
7. ✅ **CSV Export**: Server-side streaming, UTF-8 BOM for Excel
8. ✅ **Anti-Fraud**: Multi-layer (rate limit + captcha + pattern + alerts)

**Dependencies to Install**:
- `@hcaptcha/react-hcaptcha` (captcha)
- `use-debounce` (debouncing)
- `recharts` (charts)
- `date-fns` (date manipulation)

**Next Step**: Generate `data-model.md`, `contracts/`, and `quickstart.md` (Phase 1).

---

**Last Updated**: 2025-11-07
**Status**: ✅ Research Complete - Ready for Phase 1 Design
