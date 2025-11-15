# Build Security Guide

**Date:** 15 novembre 2025
**Version:** 1.0
**Objectif:** Prévenir les erreurs de build Vercel et sécuriser le pipeline CI/CD

---

## 📋 Table des Matières

1. [Vue d'ensemble](#vue-densemble)
2. [Les 4 erreurs critiques](#les-4-erreurs-critiques)
3. [Scripts de validation](#scripts-de-validation)
4. [Utilisation](#utilisation)
5. [Intégration CI/CD](#intégration-cicd)
6. [Bonnes pratiques](#bonnes-pratiques)
7. [Résolution de problèmes](#résolution-de-problèmes)

---

## Vue d'ensemble

Ce système de sécurisation des builds a été créé suite au déploiement Vercel Preview qui a rencontré 4 types d'erreurs majeures. Ces outils garantissent que les erreurs sont détectées **avant le push** plutôt que lors du build Vercel.

### Couches de sécurité

```
┌─────────────────────────────────────┐
│     Pre-commit Hook (Husky)         │ ← Validation avant chaque commit
├─────────────────────────────────────┤
│     Scripts de validation locaux    │ ← Exécution manuelle
├─────────────────────────────────────┤
│     GitHub Actions CI/CD            │ ← Validation automatique sur PR/push
├─────────────────────────────────────┤
│     Vercel Build                    │ ← Dernier rempart
└─────────────────────────────────────┘
```

### Technologies utilisées

- **Husky**: Git hooks pour validation pre-commit
- **ts-node**: Exécution des scripts TypeScript
- **GitHub Actions**: CI/CD automatisé
- **ESLint**: Linting et règles de code

---

## Les 4 erreurs critiques

### 1. ❌ Initialisation Stripe/Twilio au build-time

**Problème:**
Les SDKs externes (Stripe, Twilio) étaient initialisés au chargement du module, avant que les variables d'environnement runtime soient disponibles.

**Erreur Vercel:**
```
Error: STRIPE_SECRET_KEY is not set in environment variables
at /vercel/path0/.next/server/app/api/admin/bookings/[id]/capture/route.js
```

**❌ Code incorrect:**
```typescript
// lib/stripe/config.ts
import Stripe from 'stripe'

// DANGER: Initialisé au moment du chargement du module
export const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2025-10-29.clover',
})
```

**✅ Code correct (lazy initialization):**
```typescript
// lib/stripe/config.ts
import Stripe from 'stripe'

let stripeInstance: Stripe | null = null

function getStripeInstance(): Stripe {
  if (stripeInstance) {
    return stripeInstance
  }

  if (!process.env.STRIPE_SECRET_KEY) {
    throw new Error('STRIPE_SECRET_KEY is not set in environment variables')
  }

  stripeInstance = new Stripe(process.env.STRIPE_SECRET_KEY, {
    apiVersion: '2025-10-29.clover',
    typescript: true,
  })

  return stripeInstance
}

export const stripe = new Proxy({} as Stripe, {
  get: (_target, prop) => {
    const instance = getStripeInstance()
    const value = instance[prop as keyof Stripe]
    return typeof value === 'function' ? value.bind(instance) : value
  },
})
```

**Détection:**
Script `validate-lazy-init.ts` détecte les initialisations au top-level.

---

### 2. ❌ useSearchParams() sans Suspense Boundary

**Problème:**
Next.js 13+ exige que `useSearchParams()` soit wrappé dans un composant `<Suspense>` pour permettre le streaming et le rendu partiel.

**Erreur Vercel:**
```
Error: useSearchParams() should be wrapped in a suspense boundary
Failed to collect page data for:
  - /reset-password
  - /verify-email
  - /booking/address
```

**❌ Code incorrect:**
```typescript
// app/reset-password/page.tsx
'use client'

import { useSearchParams } from 'next/navigation'

export default function ResetPasswordPage() {
  const searchParams = useSearchParams() // ❌ Pas de Suspense
  const email = searchParams.get('email')

  return <div>Reset password for {email}</div>
}
```

**✅ Code correct:**
```typescript
// app/reset-password/page.tsx
'use client'

import { Suspense } from 'react'
import { useSearchParams } from 'next/navigation'

function ResetPasswordContent() {
  const searchParams = useSearchParams() // ✅ Dans un composant séparé
  const email = searchParams.get('email')

  return <div>Reset password for {email}</div>
}

export default function ResetPasswordPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center">
        <p>Chargement...</p>
      </div>
    }>
      <ResetPasswordContent />
    </Suspense>
  )
}
```

**Détection:**
Script `validate-suspense.ts` vérifie que tous les composants utilisant `useSearchParams()` sont wrappés.

---

### 3. ❌ API Routes sans Dynamic Export

**Problème:**
Les routes API utilisant `cookies()`, `headers()` ou `request.url` doivent être rendues dynamiquement.

**Erreur Vercel:**
```
Error: Route /api/test-promo couldn't be rendered statically because it used request.url
Error: Route /api/contractor/stats couldn't be rendered statically because it used cookies
```

**❌ Code incorrect:**
```typescript
// app/api/test-promo/route.ts
import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  const url = request.url // ❌ Utilise request.url sans export dynamic
  // ...
}
```

**✅ Code correct:**
```typescript
// app/api/test-promo/route.ts
import { NextRequest, NextResponse } from 'next/server'

// ✅ Déclare la route comme dynamique
export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  const url = request.url // ✅ OK maintenant
  // ...
}
```

**Détection:**
Script `validate-api-routes.ts` détecte les routes utilisant cookies/request.url sans export dynamic.

---

### 4. ❌ Secrets hardcodés dans le code

**Problème:**
Secrets (clés API, tokens) hardcodés dans le code sont détectés par GitHub Push Protection et représentent un risque de sécurité.

**Erreur GitHub:**
```
remote: - GITHUB PUSH PROTECTION
remote: - Stripe Test API Secret Key
remote: commit: 5b95679
remote: path: scripts/configure-vercel-preview-env.sh:39
```

**❌ Code incorrect:**
```bash
# scripts/setup.sh
STRIPE_SECRET_KEY="sk_test_51ABC123..." # ❌ Secret hardcodé
```

**✅ Code correct:**
```bash
# scripts/setup.sh
STRIPE_SECRET_KEY="${STRIPE_SECRET_KEY}" # ✅ Lecture depuis env var
```

```typescript
// lib/config.ts
export const config = {
  stripe: {
    secretKey: process.env.STRIPE_SECRET_KEY, // ✅ Depuis env var
  }
}
```

**Détection:**
Script `detect-secrets.ts` scanne le code pour détecter les patterns de secrets.

---

## Scripts de validation

### 1. `validate-api-routes.ts`

**Objectif:** Vérifie que toutes les API routes utilisant `cookies()` ou `request.url` exportent `dynamic = 'force-dynamic'`

**Utilisation:**
```bash
pnpm run validate:api-routes
```

**Output:**
```
🔍 Validating API Routes...

Found 42 API routes

✅ All API routes are valid!
```

---

### 2. `validate-suspense.ts`

**Objectif:** Vérifie que tous les composants utilisant `useSearchParams()` sont wrappés dans `<Suspense>`

**Utilisation:**
```bash
pnpm run validate:suspense
```

**Output:**
```
🔍 Validating Suspense Boundaries...

Found 18 page files

✅ All pages with useSearchParams() are properly wrapped!
```

---

### 3. `validate-lazy-init.ts`

**Objectif:** Détecte les initialisations de SDK au top-level (Stripe, Twilio, OpenAI)

**Utilisation:**
```bash
pnpm run validate:lazy-init
```

**Output:**
```
🔍 Validating Lazy Initialization Patterns...

Checking 156 files

✅ All SDK initializations use lazy pattern!
```

---

### 4. `validate-env-vars.ts`

**Objectif:** Vérifie que toutes les variables d'environnement requises sont définies

**Utilisation:**
```bash
pnpm run validate:env
```

**Output:**
```
🔍 Validating Environment Variables...

✅ All environment variables are valid!
```

---

### 5. `detect-secrets.ts`

**Objectif:** Scanne le code pour détecter les secrets hardcodés

**Utilisation:**
```bash
pnpm run validate:secrets
```

**Output:**
```
🔍 Scanning for Hardcoded Secrets...

✅ No hardcoded secrets detected!
```

---

## Utilisation

### Validation locale (avant commit)

```bash
# Exécuter toutes les validations
pnpm run validate

# Ou individuellement
pnpm run validate:api-routes
pnpm run validate:suspense
pnpm run validate:lazy-init
pnpm run validate:env
pnpm run validate:secrets
```

### Pre-commit hook automatique

Le hook Husky s'exécute automatiquement avant chaque commit :

```bash
git add .
git commit -m "feat: nouvelle fonctionnalité"

# Output:
# 🔒 Running pre-commit security checks...
#
# 📘 Type checking...
# ✅ No type errors
#
# 🔍 Linting...
# ✅ No linting errors
#
# 🛣️  Validating API routes...
# ✅ All API routes valid
#
# ... etc ...
#
# ✅ All pre-commit checks passed!
```

### Contourner les hooks (⚠️ déconseillé)

```bash
# Uniquement en cas d'urgence
git commit --no-verify -m "fix: urgent hotfix"
```

---

## Intégration CI/CD

### GitHub Actions

Le workflow `.github/workflows/build-validation.yml` s'exécute automatiquement sur :

- Push vers `main`, `develop`, ou branches `feature/**`
- Pull requests vers `main` ou `develop`

**Étapes de validation:**

1. 🔐 Détection de secrets hardcodés
2. 📘 Type check TypeScript
3. 🔍 Linting ESLint
4. 🛣️ Validation API routes
5. ⏸️ Validation Suspense boundaries
6. ⚡ Validation lazy initialization
7. 🧪 Tests unitaires
8. 🏗️ Build Next.js

### Configuration des secrets GitHub

Pour le workflow CI/CD, configurez les secrets dans GitHub :

```
Settings → Secrets and variables → Actions → New repository secret
```

Secrets requis :
- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY`
- `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY`
- `STRIPE_SECRET_KEY`
- `RESEND_API_KEY`
- `RESEND_FROM_EMAIL`
- `NEXT_PUBLIC_GOOGLE_MAPS_API_KEY`

---

## Bonnes pratiques

### ✅ DO: Pattern Lazy Initialization

```typescript
// Pour tout SDK externe
let sdkInstance: SDK | null = null

function getSDK(): SDK {
  if (sdkInstance) return sdkInstance
  if (!process.env.SDK_KEY) throw new Error('SDK_KEY missing')
  sdkInstance = new SDK(process.env.SDK_KEY)
  return sdkInstance
}

export const sdk = new Proxy({} as SDK, {
  get: (_target, prop) => {
    const inst = getSDK()
    const value = inst[prop as keyof SDK]
    return typeof value === 'function' ? value.bind(inst) : value
  },
})
```

### ✅ DO: Suspense Pattern

```typescript
// Pattern standard pour useSearchParams()
import { Suspense } from 'react'
import { useSearchParams } from 'next/navigation'

function PageContent() {
  const searchParams = useSearchParams()
  return <div>{/* ... */}</div>
}

export default function Page() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <PageContent />
    </Suspense>
  )
}
```

### ✅ DO: Dynamic API Routes

```typescript
// Toujours ajouter en haut des routes API utilisant cookies/request
export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  const { cookies } = await import('next/headers')
  // ...
}
```

### ✅ DO: Variables d'environnement

```typescript
// ✅ Toujours via process.env
const apiKey = process.env.API_KEY

// ✅ Avec validation
if (!process.env.API_KEY) {
  throw new Error('API_KEY is required')
}
```

### ❌ DON'T: Hardcoded Secrets

```typescript
// ❌ JAMAIS de secrets hardcodés
const apiKey = 'sk_live_abc123...' // GitHub Push Protection va bloquer !

// ❌ JAMAIS de credentials dans le code
const config = {
  password: 'mypassword123' // Risque de sécurité !
}
```

---

## Résolution de problèmes

### Erreur: "ts-node: command not found"

```bash
# Installer ts-node globalement
pnpm add -D ts-node

# Ou utiliser via pnpm exec
pnpm exec ts-node scripts/validate-api-routes.ts
```

### Erreur: "Husky hook not executing"

```bash
# Réinitialiser Husky
rm -rf .husky
npx husky init
chmod +x .husky/pre-commit

# Réinstaller les dépendances
pnpm install
```

### Erreur: "GitHub Actions failing on secrets"

Les placeholders sont acceptés dans le workflow. Si le build échoue :

1. Vérifiez que les secrets sont configurés dans GitHub
2. Vérifiez les noms des secrets dans le workflow
3. Assurez-vous que les valeurs placeholder sont valides

### Validation manuelle avant push

```bash
# Exécuter la même séquence que le pre-commit hook
pnpm exec tsc --noEmit && \
pnpm run lint && \
pnpm run validate:api-routes && \
pnpm run validate:suspense && \
pnpm run validate:lazy-init && \
pnpm run validate:secrets
```

---

## Checklist avant Push

- [ ] Type check passe (`pnpm exec tsc --noEmit`)
- [ ] Linting passe (`pnpm run lint`)
- [ ] Validations passent (`pnpm run validate`)
- [ ] Tests passent (`pnpm test`)
- [ ] Build local réussit (`pnpm run build`)
- [ ] Pas de secrets hardcodés
- [ ] Variables d'environnement documentées dans `.env.local.example`

---

## Références

### Documentation créée suite au déploiement Vercel Preview

- [VERCEL_PREVIEW_VERIFICATION.md](./VERCEL_PREVIEW_VERIFICATION.md) - Rapport complet du déploiement Preview
- [.github/workflows/build-validation.yml](./.github/workflows/build-validation.yml) - Workflow CI/CD
- [.husky/pre-commit](./.husky/pre-commit) - Hook pre-commit

### Documentation externe

- [Next.js Dynamic Rendering](https://nextjs.org/docs/app/building-your-application/rendering/server-components#dynamic-rendering)
- [Next.js Suspense](https://nextjs.org/docs/app/building-your-application/routing/loading-ui-and-streaming)
- [Vercel Environment Variables](https://vercel.com/docs/projects/environment-variables)
- [GitHub Actions](https://docs.github.com/en/actions)
- [Husky Git Hooks](https://typicode.github.io/husky/)

---

**Dernière mise à jour:** 15 novembre 2025
**Auteur:** Claude Code
**Version:** 1.0

🤖 Généré avec [Claude Code](https://claude.com/claude-code)
