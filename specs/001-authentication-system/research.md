# Research: Système d'Authentification

**Feature**: 001-authentication-system
**Date**: 2025-11-07
**Phase**: 0 - Technical Research
**Status**: ✅ Complete

## 1. Supabase Auth avec Next.js 16 App Router

### Decision
Utiliser **@supabase/ssr** avec Server Components et Route Handlers.

### Rationale
- Next.js 16 privilégie React Server Components (RSC)
- @supabase/ssr optimisé pour App Router
- Gestion automatique des cookies sécurisés
- Support refresh tokens automatique

### Implementation
```typescript
// lib/supabase/server.ts
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'

export function createClient() {
  const cookieStore = cookies()

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return cookieStore.get(name)?.value
        },
      },
    }
  )
}
```

## 2. Génération Code 6 Chiffres Sécurisé

### Decision
Utiliser **crypto.randomInt()** (Node.js crypto module).

### Rationale
- Cryptographiquement sécurisé (pas Math.random())
- Range 100000-999999 garantit 6 chiffres
- Built-in Node.js (pas de dépendance)

### Implementation
```typescript
import crypto from 'crypto'

function generateVerificationCode(): string {
  return crypto.randomInt(100000, 1000000).toString()
}
```

## 3. Rate Limiting Strategy

### Decision
**Next.js Middleware** pour rate limiting.

### Rationale
- Exécuté avant toute logique (Edge Runtime)
- Cache in-memory pour compteurs
- Pas besoin de Redis pour MVP

### Implementation
```typescript
// middleware.ts
import { NextResponse } from 'next/server'

const rateLimitMap = new Map<string, { count: number, resetAt: number }>()

export function middleware(request: NextRequest) {
  const ip = request.ip || 'unknown'
  const now = Date.now()
  const window = 15 * 60 * 1000 // 15 minutes

  const limit = rateLimitMap.get(ip)

  if (limit && now < limit.resetAt) {
    if (limit.count >= 5) {
      return NextResponse.json(
        { error: 'Trop de tentatives' },
        { status: 429 }
      )
    }
    limit.count++
  } else {
    rateLimitMap.set(ip, { count: 1, resetAt: now + window })
  }

  return NextResponse.next()
}

export const config = {
  matcher: ['/auth/:path*']
}
```

## 4. Session Persistence

### Decision
**HTTP-only cookies** avec expiration 7 jours.

### Rationale
- Plus sécurisé que localStorage (pas accessible JS)
- Supabase Auth gère automatiquement
- Refresh token persist dans cookie sécurisé

### Configuration
```typescript
// Supabase Auth config
{
  auth: {
    flowType: 'pkce',
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: true,
    storage: cookieStorage // HTTP-only cookies
  }
}
```

## 5. Email Templates avec Resend

### Decision
Utiliser **React Email** + **Resend**.

### Rationale
- Templates typesafe avec React
- Resend optimisé pour deliverability
- Support Tailwind CSS dans emails

### Implementation
```typescript
// emails/VerificationCode.tsx
import {
  Html,
  Head,
  Body,
  Container,
  Text,
  Button
} from '@react-email/components'

export function VerificationCodeEmail({ code }: { code: string }) {
  return (
    <Html>
      <Head />
      <Body>
        <Container>
          <Text>Votre code de vérification</Text>
          <Text style={{ fontSize: '32px', fontWeight: 'bold' }}>
            {code}
          </Text>
          <Text>Ce code expire dans 15 minutes.</Text>
        </Container>
      </Body>
    </Html>
  )
}

// Edge Function
import { Resend } from 'resend'
import { VerificationCodeEmail } from './VerificationCode'

const resend = new Resend(Deno.env.get('RESEND_API_KEY'))

await resend.emails.send({
  from: 'Simone Paris <noreply@simoneparis.fr>',
  to: userEmail,
  subject: 'Code de vérification Simone Paris',
  react: VerificationCodeEmail({ code })
})
```

## 6. Verification Code Storage

### Decision
Stocker dans **table PostgreSQL** (pas Redis).

### Rationale
- Simplicité (pas d'infrastructure additionnelle)
- Supabase inclut PostgreSQL
- TTL géré avec timestamp + query

### Schema
```sql
CREATE TABLE verification_codes (
  id BIGINT PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
  user_id UUID NOT NULL REFERENCES auth.users(id),
  code VARCHAR(6) NOT NULL,
  type VARCHAR(20) CHECK (type IN ('email_verification', 'password_reset')),
  attempts INT DEFAULT 0,
  created_at TIMESTAMP DEFAULT NOW(),
  expires_at TIMESTAMP DEFAULT NOW() + INTERVAL '15 minutes'
);

CREATE INDEX idx_verification_codes_user_type
  ON verification_codes(user_id, type, expires_at);
```

## Summary

Toutes les décisions techniques prises :

1. ✅ **Supabase Auth** : @supabase/ssr avec RSC
2. ✅ **Code 6 chiffres** : crypto.randomInt() sécurisé
3. ✅ **Rate limiting** : Next.js Middleware + in-memory
4. ✅ **Sessions** : HTTP-only cookies, 7 jours
5. ✅ **Emails** : React Email + Resend
6. ✅ **Stockage codes** : PostgreSQL table

**Dependencies à installer** :
- @supabase/ssr
- @react-email/components
- resend

**Next Step** : Générer data-model.md et contracts/

---

**Last Updated**: 2025-11-07
**Status**: ✅ Research Complete
