# Quickstart Guide: Système de Codes Promotionnels

**Feature**: 015-promo-codes-system
**Date**: 2025-11-07
**Audience**: Frontend Developers
**Status**: 📋 Ready for Implementation

## Overview

This guide helps developers quickly implement promo code features. The backend is **already implemented** - this focuses on frontend integration.

---

## Table of Contents

1. [Prerequisites](#prerequisites)
2. [Quick Examples](#quick-examples)
3. [Common Patterns](#common-patterns)
4. [Testing](#testing)
5. [Troubleshooting](#troubleshooting)

---

## Prerequisites

### 1. Dependencies Installed

Ensure these packages are installed (already done in infrastructure setup):

```bash
pnpm add @tanstack/react-query @supabase/ssr @supabase/supabase-js
pnpm add react-hook-form @hookform/resolvers zod
pnpm add use-debounce recharts date-fns

# For Sprint 4
pnpm add @hcaptcha/react-hcaptcha
```

### 2. Environment Variables

```.env.local
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
NEXT_PUBLIC_HCAPTCHA_SITE_KEY=your-hcaptcha-site-key  # Sprint 4
```

### 3. Supabase Client Setup

```typescript
// lib/supabase/client.ts (already exists)
import { createBrowserClient } from '@supabase/ssr'

export const supabase = createBrowserClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)
```

---

## Quick Examples

### Example 1: Add Promo Code Input to Checkout (Sprint 1)

**Goal**: Allow clients to enter and validate promo codes during checkout.

**Step 1**: Create the validation hook

```typescript
// hooks/usePromoValidation.ts
import { useMutation } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase/client'
import type { PromoValidationResult } from '@/types/promo-code'

export function usePromoValidation() {
  return useMutation({
    mutationFn: async ({
      code,
      userId,
      serviceId,
      amount
    }: {
      code: string
      userId: string
      serviceId: number
      amount: number
    }): Promise<PromoValidationResult> => {
      const { data, error } = await supabase.rpc('validate_promo_code', {
        p_code: code.trim().toUpperCase(),
        p_user_id: userId,
        p_service_id: serviceId,
        p_service_amount: amount
      })

      if (error) throw error
      return data
    },
    gcTime: 0  // No caching - always fresh validation
  })
}
```

**Step 2**: Create the input component

```typescript
// components/promo-codes/PromoCodeInput.tsx
'use client'

import { useState } from 'react'
import { useDebouncedCallback } from 'use-debounce'
import { usePromoValidation } from '@/hooks/usePromoValidation'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Loader2 } from 'lucide-react'
import type { AppliedPromo } from '@/types/promo-code'

interface PromoCodeInputProps {
  userId: string
  serviceId: number
  serviceAmount: number
  onPromoApplied: (promo: AppliedPromo) => void
}

export function PromoCodeInput({
  userId,
  serviceId,
  serviceAmount,
  onPromoApplied
}: PromoCodeInputProps) {
  const [code, setCode] = useState('')
  const [validationResult, setValidationResult] = useState<any>(null)

  const { mutate: validate, isPending, error } = usePromoValidation()

  const debouncedValidate = useDebouncedCallback((value: string) => {
    if (!value.trim()) return

    validate(
      { code: value, userId, serviceId, amount: serviceAmount },
      {
        onSuccess: (result) => {
          setValidationResult(result)
        }
      }
    )
  }, 500)

  const handleApply = () => {
    if (validationResult?.is_valid) {
      onPromoApplied({
        code: code.toUpperCase(),
        promo_id: validationResult.promo_id,
        original_amount: serviceAmount,
        discount_amount: validationResult.discount_amount,
        final_amount: validationResult.final_amount,
        discount_type: 'percentage',  // Get from DB if needed
        discount_value: 0
      })
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
          className="flex-1"
        />
        <Button
          onClick={handleApply}
          disabled={!validationResult?.is_valid || isPending}
        >
          {isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Appliquer'}
        </Button>
      </div>

      {validationResult && !validationResult.is_valid && (
        <p className="text-sm text-destructive">
          {validationResult.error_message}
        </p>
      )}

      {validationResult?.is_valid && (
        <p className="text-sm text-green-600">
          ✓ Vous économisez {validationResult.discount_amount}€
        </p>
      )}
    </div>
  )
}
```

**Step 3**: Use in checkout page

```typescript
// app/(client)/checkout/[bookingId]/page.tsx
'use client'

import { useState } from 'react'
import { PromoCodeInput } from '@/components/promo-codes/PromoCodeInput'
import type { AppliedPromo } from '@/types/promo-code'

export default function CheckoutPage({ params }: { params: { bookingId: string } }) {
  const [appliedPromo, setAppliedPromo] = useState<AppliedPromo | null>(null)

  const serviceAmount = 120.00  // Get from booking data
  const finalAmount = appliedPromo?.final_amount || serviceAmount

  return (
    <div>
      <h1>Paiement</h1>

      {/* Service details */}
      <div className="space-y-2">
        {appliedPromo && (
          <div className="flex justify-between text-muted-foreground line-through">
            <span>Prix original</span>
            <span>{appliedPromo.original_amount}€</span>
          </div>
        )}

        {appliedPromo && (
          <div className="flex justify-between text-green-600">
            <span>Code promo ({appliedPromo.code})</span>
            <span>-{appliedPromo.discount_amount}€</span>
          </div>
        )}

        <div className="flex justify-between font-bold text-lg">
          <span>Total à payer</span>
          <span>{finalAmount}€</span>
        </div>
      </div>

      {/* Promo code input */}
      {!appliedPromo && (
        <PromoCodeInput
          userId={user.id}
          serviceId={service.id}
          serviceAmount={serviceAmount}
          onPromoApplied={setAppliedPromo}
        />
      )}

      {appliedPromo && (
        <Button
          variant="ghost"
          onClick={() => setAppliedPromo(null)}
        >
          Retirer le code promo
        </Button>
      )}

      {/* Payment form */}
      {/* ... */}
    </div>
  )
}
```

---

### Example 2: Create Promo Code Form (Sprint 2)

**Goal**: Allow admins to create new promo codes.

**Step 1**: Create the mutation hook

```typescript
// hooks/usePromoCodeMutations.ts
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase/client'
import type { PromoCode, PromoCodeFormData } from '@/types/promo-code'

export function useCreatePromoCode() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (formData: PromoCodeFormData): Promise<PromoCode> => {
      const { data, error } = await supabase
        .from('promo_codes')
        .insert({
          code: formData.code,
          description: formData.description,
          discount_type: formData.discount_type,
          discount_value: formData.discount_value,
          max_discount_amount: formData.max_discount_amount,
          valid_from: formData.valid_from?.toISOString(),
          valid_until: formData.valid_until?.toISOString(),
          max_uses: formData.max_uses,
          max_uses_per_user: formData.max_uses_per_user,
          first_booking_only: formData.first_booking_only,
          min_order_amount: formData.min_order_amount,
          specific_services: formData.specific_services,
          specific_categories: formData.specific_categories,
          is_active: formData.is_active
        })
        .select()
        .single()

      if (error) throw error
      return data
    },
    onSuccess: () => {
      // Invalidate promo codes list
      queryClient.invalidateQueries({ queryKey: ['promo-codes'] })
    }
  })
}
```

**Step 2**: Create the form component

```typescript
// components/promo-codes/PromoCodeForm.tsx
'use client'

import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { promoCodeFormSchema, type PromoCodeFormData } from '@/types/promo-form'
import { useCreatePromoCode } from '@/hooks/usePromoCodeMutations'
import { Button } from '@/components/ui/button'
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage
} from '@/components/ui/form'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Select } from '@/components/ui/select'
import { Switch } from '@/components/ui/switch'

export function PromoCodeForm() {
  const { mutate: createPromo, isPending } = useCreatePromoCode()

  const form = useForm<PromoCodeFormData>({
    resolver: zodResolver(promoCodeFormSchema),
    defaultValues: {
      discount_type: 'percentage',
      max_uses_per_user: 1,
      first_booking_only: false,
      is_active: true
    }
  })

  const onSubmit = (data: PromoCodeFormData) => {
    createPromo(data, {
      onSuccess: () => {
        form.reset()
        // Show success toast
      }
    })
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        {/* Code */}
        <FormField
          control={form.control}
          name="code"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Code promo *</FormLabel>
              <FormControl>
                <Input
                  placeholder="BIENVENUE20"
                  {...field}
                  onChange={(e) => field.onChange(e.target.value.toUpperCase())}
                />
              </FormControl>
              <FormDescription>
                4-50 caractères, lettres majuscules et chiffres uniquement
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* Description */}
        <FormField
          control={form.control}
          name="description"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Description</FormLabel>
              <FormControl>
                <Textarea
                  placeholder="Code de bienvenue pour nouveaux clients"
                  {...field}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* Discount Type */}
        <FormField
          control={form.control}
          name="discount_type"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Type de réduction *</FormLabel>
              <Select onValueChange={field.onChange} defaultValue={field.value}>
                <option value="percentage">Pourcentage</option>
                <option value="fixed_amount">Montant fixe</option>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* Discount Value */}
        <FormField
          control={form.control}
          name="discount_value"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Valeur de la réduction *</FormLabel>
              <FormControl>
                <Input
                  type="number"
                  step="0.01"
                  {...field}
                  onChange={(e) => field.onChange(parseFloat(e.target.value))}
                />
              </FormControl>
              <FormDescription>
                {form.watch('discount_type') === 'percentage' ? 'En %' : 'En €'}
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* ... More fields (validity dates, limits, etc.) ... */}

        <Button type="submit" disabled={isPending}>
          {isPending ? 'Création...' : 'Créer le code promo'}
        </Button>
      </form>
    </Form>
  )
}
```

---

### Example 3: Display Analytics Dashboard (Sprint 3)

**Goal**: Show promo code performance metrics to admins.

```typescript
// components/promo-codes/PromoCodeAnalytics.tsx
'use client'

import { useQuery } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase/client'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import type { PromoAnalyticsKPIs } from '@/types/promo-analytics'

export function PromoCodeAnalytics() {
  const { data, isLoading } = useQuery({
    queryKey: ['promo-analytics'],
    queryFn: async (): Promise<PromoAnalyticsKPIs> => {
      const { data, error } = await supabase.rpc('get_promo_analytics', {
        date_from: null,
        date_to: null
      })

      if (error) throw error
      return data
    }
  })

  if (isLoading) {
    return <Skeleton className="h-[200px]" />
  }

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      <Card>
        <CardHeader>
          <CardTitle className="text-sm font-medium">Codes actifs</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{data?.active_codes_count || 0}</div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-sm font-medium">Utilisations totales</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{data?.total_uses || 0}</div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-sm font-medium">Coût plateforme</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">
            {data?.total_platform_cost.toFixed(2) || 0}€
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-sm font-medium">ROI</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-green-600">
            {data?.roi_percentage.toFixed(1) || 0}%
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
```

---

## Common Patterns

### Pattern 1: Formatting Promo Display

```typescript
// lib/utils/promo-formatting.ts

export function formatPromoDiscount(
  discountType: 'percentage' | 'fixed_amount',
  discountValue: number
): string {
  if (discountType === 'percentage') {
    return `${discountValue}%`
  } else {
    return `${discountValue.toFixed(2)}€`
  }
}

export function formatPromoStatus(status: PromoCodeStatus): {
  label: string
  color: string
} {
  switch (status) {
    case 'active':
      return { label: 'Actif', color: 'green' }
    case 'expired':
      return { label: 'Expiré', color: 'red' }
    case 'exhausted':
      return { label: 'Épuisé', color: 'orange' }
    case 'scheduled':
      return { label: 'Programmé', color: 'blue' }
    case 'inactive':
      return { label: 'Inactif', color: 'gray' }
  }
}
```

### Pattern 2: Optimistic UI Updates

```typescript
// hooks/usePromoCodeMutations.ts

export function useTogglePromoActive() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({ id, isActive }: { id: number, isActive: boolean }) => {
      const { data, error } = await supabase
        .from('promo_codes')
        .update({ is_active: !isActive })
        .eq('id', id)
        .select()
        .single()

      if (error) throw error
      return data
    },
    onMutate: async ({ id, isActive }) => {
      // Cancel ongoing queries
      await queryClient.cancelQueries({ queryKey: ['promo-codes'] })

      // Snapshot previous value
      const previousPromoCodes = queryClient.getQueryData(['promo-codes'])

      // Optimistically update
      queryClient.setQueryData(['promo-codes'], (old: PromoCode[]) =>
        old.map(promo =>
          promo.id === id ? { ...promo, is_active: !isActive } : promo
        )
      )

      return { previousPromoCodes }
    },
    onError: (err, variables, context) => {
      // Rollback on error
      queryClient.setQueryData(['promo-codes'], context?.previousPromoCodes)
    },
    onSettled: () => {
      // Refetch to ensure sync
      queryClient.invalidateQueries({ queryKey: ['promo-codes'] })
    }
  })
}
```

---

## Testing

### Unit Test Example

```typescript
// __tests__/components/PromoCodeInput.test.tsx
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { PromoCodeInput } from '@/components/promo-codes/PromoCodeInput'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'

const queryClient = new QueryClient({
  defaultOptions: { queries: { retry: false } }
})

const wrapper = ({ children }: { children: React.ReactNode }) => (
  <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
)

describe('PromoCodeInput', () => {
  it('validates promo code on blur', async () => {
    const onPromoApplied = vi.fn()

    render(
      <PromoCodeInput
        userId="user-123"
        serviceId={42}
        serviceAmount={120}
        onPromoApplied={onPromoApplied}
      />,
      { wrapper }
    )

    const input = screen.getByPlaceholderText('Code promo')
    await userEvent.type(input, 'BIENVENUE20')
    await userEvent.tab()  // Trigger blur

    await waitFor(() => {
      expect(screen.getByText(/Vous économisez/)).toBeInTheDocument()
    })
  })

  it('shows error message for invalid code', async () => {
    render(<PromoCodeInput {...props} />, { wrapper })

    const input = screen.getByPlaceholderText('Code promo')
    await userEvent.type(input, 'INVALID')
    await userEvent.tab()

    await waitFor(() => {
      expect(screen.getByText(/Ce code promo n'existe pas/)).toBeInTheDocument()
    })
  })
})
```

---

## Troubleshooting

### Problem: "validate_promo_code" function not found

**Solution**: Ensure backend migration is applied:
```bash
supabase db push
```

### Problem: Rate limit error (429)

**Solution**: User exceeded 5 validations/minute. Wait 60 seconds or implement captcha.

### Problem: Promo code validates but doesn't apply discount

**Solution**: Check that:
1. `is_active = true`
2. Current date within `valid_from` and `valid_until`
3. `uses_count < max_uses`
4. User hasn't exceeded `max_uses_per_user`
5. Service is eligible (check `specific_services` and `specific_categories`)

### Problem: Commission calculated incorrectly

**Solution**: Verify `contractor_financial_summary` view uses `COALESCE(service_amount_original, service_amount)` for commission base.

---

## Next Steps

1. ✅ **Read this guide**
2. ⏭️ **Run `/speckit.tasks 015-promo-codes-system`** to generate implementation tasks
3. 🚧 **Implement Sprint 1** (Checkout client)
4. 🚧 **Implement Sprint 2** (Admin CRUD)
5. 🚧 **Implement Sprint 3** (Analytics + Contractor)
6. 🚧 **Implement Sprint 4** (Edge Functions + Security)

---

## Resources

- **Spec**: [spec.md](./spec.md)
- **Plan**: [plan.md](./plan.md)
- **Research**: [research.md](./research.md)
- **Data Model**: [data-model.md](./data-model.md)
- **API Contracts**: [contracts/api-contracts.md](./contracts/api-contracts.md)
- **Technical Guide**: [../../docs/PROMO_CODES_SYSTEM.md](../../docs/PROMO_CODES_SYSTEM.md)

---

**Last Updated**: 2025-11-07
**Status**: ✅ Quickstart Complete - Ready for /speckit.tasks
