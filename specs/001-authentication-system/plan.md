# Implementation Plan: Système d'Authentification Sécurisé

**Branch**: `001-authentication-system` | **Date**: 2025-11-07 | **Spec**: [spec.md](./spec.md)
**Status**: 📋 Planning Complete | Ready for Implementation

## Summary

Implémentation d'un système d'authentification sécurisé pour les **clients uniquement** (les prestataires passent par candidature - spec 007). Le système utilise Supabase Auth avec vérification email par code à 6 chiffres, connexion standard, réinitialisation mot de passe et sessions persistantes (7 jours).

**Approche MVP** :
1. **US1 + US2** (P1) : Inscription + Connexion - Fonctionnalités critiques
2. **US3** (P2) : Sessions persistantes - Amélioration UX
3. **US4** (P2) : Réinitialisation mot de passe - Support

## Technical Context

**Language/Version**: TypeScript 5.x avec Next.js 16 (React 19)

**Primary Dependencies**:
- @supabase/ssr v0.7 + @supabase/supabase-js v2.80 (authentification)
- @supabase/auth-helpers-nextjs (Next.js integration)
- react-hook-form v7 + zod v4 (validation formulaires)
- bcrypt (hashing mot de passe - géré par Supabase)
- Resend (envoi emails codes vérification)

**Storage**: Supabase PostgreSQL
- Table `auth.users` (Supabase Auth - credentials)
- Table `profiles` (public schema - profils utilisateurs)
- Edge Function `send-verification-code` (envoi emails)

**Testing**: Vitest + @testing-library/react (déjà configuré)

**Target Platform**: Web (Next.js App Router, RSC)

**Performance Goals**:
- Temps d'inscription : <3 minutes (SC-001)
- Temps de connexion : <10 secondes (SC-003)
- Réception code email : <30 secondes (SC-008)

**Constraints**:
- Rate limiting : 5 tentatives connexion/15 min (FR-008)
- Session persistante : 7 jours minimum (FR-010)
- Support 10,000 inscriptions simultanées (SC-010)
- Codes vérification : 6 chiffres, 15 min validité, 3 tentatives max

**Scale/Scope**:
- 4 user stories (US1-US4)
- ~10 composants React
- 3-4 hooks custom
- 2 Edge Functions Supabase
- ~20-25 heures développement total

## Constitution Check

### ✅ ID Strategy Compliance
- **auth.users** : UUID (imposé par Supabase Auth) ✅
- **profiles** : UUID (sync avec auth.users) ✅
- Pas d'auto-increment car sync requis avec Supabase Auth
- **Status**: ✅ COMPLIANT - UUID justifié par contrainte technique

### ✅ Enum Strategy Compliance
- **profile_type** : VARCHAR avec CHECK constraint
- **verification_status** : VARCHAR pas ENUM
- **Status**: ✅ COMPLIANT

### ✅ Naming Conventions
- **Tables** : English snake_case (`profiles`, `verification_codes`)
- **Columns** : English (`email_verified`, `created_at`)
- **Comments** : French (documentation métier)
- **UI** : French (labels, messages)
- **Status**: ✅ COMPLIANT

### ✅ Security-First Architecture
- **Supabase Auth** : JWT tokens, refresh tokens
- **Row Level Security** : Policies sur table `profiles`
- **Password hashing** : bcrypt (géré par Supabase)
- **Rate limiting** : Edge Functions + middleware
- **Status**: ✅ COMPLIANT

### ✅ Technology Stack Alignment
- Next.js 16, React 19, TypeScript ✅
- Supabase Auth ✅
- TanStack Query ✅
- shadcn/ui ✅
- Resend (email) ✅
- **Status**: ✅ FULLY COMPLIANT

**GATE RESULT**: ✅ **PASS** - Constitution respectée

## Project Structure

### Documentation

```
specs/001-authentication-system/
├── spec.md              # Feature specification (COMPLETE)
├── plan.md              # This file
├── research.md          # Technical research (to generate)
├── data-model.md        # Data entities (to generate)
├── contracts/           # API contracts (to generate)
├── quickstart.md        # Developer guide (to generate)
└── tasks.md             # Implementation tasks (via /speckit.tasks)
```

### Source Code

```
app/
├── (auth)/                          # Auth group (no layout)
│   ├── login/
│   │   └── page.tsx                 # US2: Login page
│   ├── signup/
│   │   └── page.tsx                 # US1: Signup page
│   ├── verify-email/
│   │   └── page.tsx                 # US1: Email verification
│   ├── forgot-password/
│   │   └── page.tsx                 # US4: Password reset
│   └── reset-password/
│       └── page.tsx                 # US4: New password

components/
├── auth/
│   ├── SignupForm.tsx               # US1
│   ├── LoginForm.tsx                # US2
│   ├── VerificationCodeInput.tsx   # US1, US4
│   ├── ForgotPasswordForm.tsx      # US4
│   ├── ResetPasswordForm.tsx       # US4
│   └── SessionProvider.tsx         # US3
└── ui/                              # shadcn/ui components

hooks/
├── useAuth.ts                       # Auth state management
├── useSignup.ts                     # US1: Signup logic
├── useLogin.ts                      # US2: Login logic
├── useVerification.ts               # US1: Code verification
└── usePasswordReset.ts              # US4: Password reset

lib/
├── supabase/
│   ├── client.ts                    # Browser client
│   ├── server.ts                    # Server client
│   └── middleware.ts                # Auth middleware
└── validations/
    └── auth-schemas.ts              # Zod schemas

supabase/functions/
├── send-verification-code/          # US1: Send 6-digit code
│   └── index.ts
└── send-password-reset-code/        # US4: Send reset code
    └── index.ts

middleware.ts                        # Next.js middleware (auth + rate limiting)
```

## Complexity Tracking

> **No violations**

Constitution respectée - pas de justifications nécessaires.

## Phase 0: Research (To Generate)

**Topics**:
1. Supabase Auth best practices avec Next.js 16 App Router
2. Code à 6 chiffres : génération cryptographiquement sécurisée
3. Rate limiting strategies (Edge Functions vs Middleware)
4. Session persistence patterns (cookies vs localStorage)
5. Email templates avec Resend
6. Verification code storage (database vs Redis)

**Output**: `research.md`

## Phase 1: Design & Contracts (To Generate)

### Data Model

**Entities**:
- **auth.users** (Supabase managed)
- **profiles** (application managed)
- **verification_codes** (temporary storage)

### API Contracts

**Endpoints**:
1. POST `/auth/signup` - Inscription
2. POST `/auth/login` - Connexion
3. POST `/auth/verify-email` - Vérification code
4. POST `/auth/resend-code` - Renvoyer code
5. POST `/auth/forgot-password` - Demande reset
6. POST `/auth/reset-password` - Nouveau mot de passe
7. POST `/auth/logout` - Déconnexion
8. GET `/auth/session` - Statut session

**Output**: `data-model.md`, `contracts/`, `quickstart.md`

## Phase 2: Implementation (Via /speckit.tasks)

**Sprints**:
- **Sprint 1** (Week 1) : US1 + US2 (P1) - MVP - ~12h
- **Sprint 2** (Week 2) : US3 (P2) - Sessions - ~4h
- **Sprint 3** (Week 2) : US4 (P2) - Password reset - ~6h

**Total** : ~22 heures

## Next Steps

1. ✅ **Plan Ready**
2. ⏭️ **Generate research.md**
3. ⏭️ **Generate data-model.md, contracts/, quickstart.md**
4. ⏭️ **Run `/speckit.tasks 001` to generate implementation tasks**
5. 🚧 **Implementation**

---

**Last Updated**: 2025-11-07
**Status**: 📋 Plan Complete - Ready for research phase
