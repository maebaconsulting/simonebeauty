# Implementation Tasks: Système d'Authentification Sécurisé

**Feature**: 001-authentication-system
**Branch**: `001-authentication-system`
**Date**: 2025-11-07
**Status**: 📋 Ready for Implementation

## Overview

Ce document contient toutes les tâches d'implémentation pour le système d'authentification, organisées par user story pour une livraison indépendante.

**Scope**: Authentification **clients uniquement** (prestataires = spec 007)

**Total Estimated Time**: 22-28 hours across 3 sprints
**MVP Scope**: US1 + US2 (Inscription + Connexion) - ~12 hours

---

## Task Summary

| Phase | Story | Tasks | Estimated Time | Status |
|-------|-------|-------|----------------|--------|
| Setup | - | 6 tasks | 1h | 🚧 Ready |
| Foundational | - | 8 tasks | 3h | ⏸️ Blocked by Setup |
| User Story 1 (P1) | Inscription + Vérification | 12 tasks | 6h | ⏸️ MVP |
| User Story 2 (P1) | Connexion Standard | 10 tasks | 6h | ⏸️ MVP |
| User Story 3 (P2) | Session Persistante | 6 tasks | 4h | ⏸️ Post-MVP |
| User Story 4 (P2) | Reset Password | 8 tasks | 6h | ⏸️ Post-MVP |
| Polish & Security | - | 6 tasks | 2h | ⏸️ Final |
| **TOTAL** | **4 stories** | **56 tasks** | **~28h** | |

---

## Phase 1: Setup (Infrastructure)

**Goal**: Installer dépendances et créer structure de base.

**Prerequisites**: None

**Tasks**:

- [X] T001 Installer dépendances Supabase Auth: `pnpm add @supabase/ssr @supabase/auth-helpers-nextjs`
- [X] T002 Installer dépendances email: `pnpm add resend @react-email/components @react-email/render`
- [X] T003 [P] Créer client Supabase browser à `lib/supabase/client.ts` avec createBrowserClient()
- [X] T004 [P] Créer client Supabase server à `lib/supabase/server.ts` avec createServerClient() et cookies
- [X] T005 [P] Créer TypeScript types auth à `types/auth.ts` avec User, Profile, VerificationCode interfaces
- [X] T006 [P] Créer Zod schemas à `lib/validations/auth-schemas.ts` avec signupSchema, loginSchema, passwordSchema

**Acceptance**: Dépendances installées, clients Supabase fonctionnels, types définis.

---

## Phase 2: Foundational (Database & Auth Core)

**Goal**: Configurer base de données et système d'authentification de base.

**Prerequisites**: Phase 1 complete

**Blocking For**: All user stories

**Tasks**:

- [X] T007 Créer migration Supabase `supabase/migrations/[timestamp]_create_profiles_table.sql` avec table profiles (id UUID, email, display_name, profile_type, etc.)
- [X] T008 Créer migration `supabase/migrations/[timestamp]_create_verification_codes.sql` avec table verification_codes (code VARCHAR(6), user_id, type, expires_at, attempts)
- [X] T009 Créer trigger SQL `create_profile_on_signup` pour auto-créer profil lors inscription dans auth.users
- [X] T010 Créer RLS policies sur table profiles: users SELECT own, admins full access
- [X] T011 [P] Créer composant AuthProvider à `components/auth/AuthProvider.tsx` avec Supabase Auth context
- [X] T012 [P] Créer hook useAuth à `hooks/useAuth.ts` retournant { user, session, loading }
- [X] T013 [P] Créer Next.js middleware à `middleware.ts` pour protected routes et rate limiting
- [X] T014 Appliquer migrations Supabase: `supabase db push`

**Acceptance**: Tables créées, RLS actives, AuthProvider disponible, middleware fonctionnel.

---

## Phase 3: User Story 1 - Inscription + Vérification Email (P1)

**User Story**: Nouveau visiteur crée compte CLIENT, reçoit code 6 chiffres par email, vérifie dans 15 min.

**Why P1**: Point d'entrée obligatoire pour tous clients. MVP absolu.

**Independent Test**: S'inscrire → recevoir code email → vérifier → connexion auto.

**Prerequisites**: Phase 2 complete

**Deliverable**: Clients peuvent créer compte et le vérifier par email.

**Tasks**:

- [X] T015 [US1] Créer Edge Function Supabase à `supabase/functions/send-verification-code/index.ts` avec génération code 6 chiffres crypto.randomInt()
- [X] T016 [US1] Créer email template React à `emails/VerificationCode.tsx` avec @react-email/components
- [X] T017 [US1] Configurer Resend dans Edge Function avec RESEND_API_KEY env var
- [X] T018 [US1] Créer hook useSignup à `hooks/useSignup.ts` avec TanStack Query mutation pour signup + envoi code
- [X] T019 [US1] Créer SignupForm à `components/auth/SignupForm.tsx` avec react-hook-form + Zod validation
- [X] T020 [US1] Ajouter champs formulaire: email (Input), display_name (Input), password (Input type password), confirm_password (Input)
- [X] T021 [US1] Créer page signup à `app/(auth)/signup/page.tsx` avec SignupForm
- [X] T022 [US1] Créer VerificationCodeInput à `components/auth/VerificationCodeInput.tsx` avec 6 inputs pour chaque chiffre
- [X] T023 [US1] Créer hook useVerification à `hooks/useVerification.ts` pour valider code (max 3 tentatives, check expiration)
- [X] T024 [US1] Créer page verify-email à `app/(auth)/verify-email/page.tsx` avec VerificationCodeInput
- [X] T025 [US1] Implémenter logique renvoi code (1 min cooldown) avec bouton "Renvoyer le code"
- [ ] T026 [US1] Tester flow complet: signup → email reçu → code saisi → compte activé → redirect dashboard

**Acceptance Criteria**:
- ✅ Formulaire inscription valide email, nom, mot de passe (8+ chars, 1 maj, 1 chiffre, 1 spécial)
- ✅ Code 6 chiffres envoyé par email en <30 secondes
- ✅ Code valide 15 minutes, 3 tentatives max
- ✅ Compte activé après vérification, connexion auto
- ✅ Possibilité renvoyer code après 1 minute

---

## Phase 4: User Story 2 - Connexion Standard (P1)

**User Story**: Utilisateur inscrit se connecte avec email + mot de passe.

**Why P1**: Critique égal à inscription. Utilisateurs récurrents doivent accéder compte.

**Independent Test**: Se connecter avec credentials valides → redirect dashboard.

**Prerequisites**: Phase 2 complete (indépendant de US1)

**Deliverable**: Utilisateurs peuvent se connecter de manière sécurisée.

**Tasks**:

- [X] T027 [US2] Créer hook useLogin à `hooks/useLogin.ts` avec TanStack Query mutation pour Supabase signInWithPassword()
- [X] T028 [US2] Créer LoginForm à `components/auth/LoginForm.tsx` avec react-hook-form + Zod
- [X] T029 [US2] Ajouter champs: email (Input), password (Input), remember_me (Checkbox optionnel)
- [X] T030 [US2] Créer page login à `app/(auth)/login/page.tsx` avec LoginForm
- [X] T031 [US2] Implémenter rate limiting dans middleware: max 5 tentatives / 15 min par email
- [X] T032 [US2] Ajouter gestion erreurs: message générique "Email ou mot de passe incorrect" (pas révéler si email existe)
- [X] T033 [US2] Implémenter blocage compte temporaire après 5 échecs (15 min cooldown)
- [X] T034 [US2] Ajouter redirection vers verify-email si compte non vérifié lors connexion
- [X] T035 [US2] Implémenter redirection post-login selon role: client → /dashboard, admin → /admin
- [ ] T036 [US2] Tester flow: login credentials valides → redirect correct, login échoué → message erreur, 5 échecs → blocage

**Acceptance Criteria**:
- ✅ Login avec email + mot de passe corrects → accès dashboard
- ✅ Mot de passe incorrect → message générique sans révéler email existence
- ✅ 5 échecs consécutifs → compte bloqué 15 min
- ✅ Compte non vérifié → redirect vers vérification email
- ✅ Redirection appropriée selon rôle utilisateur

---

## Phase 5: User Story 3 - Session Persistante (P2)

**User Story**: Utilisateur connecté ferme navigateur, revient → toujours connecté (7 jours).

**Why P2**: Améliore UX, réduit friction. Important pour rétention mais pas MVP.

**Independent Test**: Connexion → fermer navigateur → rouvrir → toujours connecté.

**Prerequisites**: US2 complete (dépend de login)

**Deliverable**: Sessions persistent 7 jours minimum.

**Tasks**:

- [X] T037 [US3] Configurer Supabase Auth cookies avec maxAge 7 jours dans `lib/supabase/server.ts`
- [X] T038 [US3] Implémenter autoRefreshToken dans AuthProvider pour refresh automatique tokens
- [X] T039 [US3] Créer composant SessionMonitor à `components/auth/SessionMonitor.tsx` pour détecter expiration
- [X] T040 [US3] Créer hook useLogout à `hooks/useLogout.ts` avec invalidation session Supabase
- [X] T041 [US3] Ajouter bouton déconnexion dans layout utilisateur appelant useLogout
- [X] T042 [US3] Implémenter invalidation toutes sessions lors changement mot de passe

**Acceptance Criteria**:
- ✅ Session persiste 7+ jours sans reconnexion
- ✅ Fermer/rouvrir navigateur → toujours connecté
- ✅ Déconnexion explicite → session invalidée immédiatement
- ✅ Changement mot de passe → toutes sessions invalidées sauf courante

---

## Phase 6: User Story 4 - Réinitialisation Mot de Passe (P2)

**User Story**: Utilisateur oublie mot de passe, le réinitialise via code email.

**Why P2**: Important pour récupération compte mais pas critique MVP (support peut aider temporairement).

**Independent Test**: Demander reset → recevoir code → créer nouveau mot de passe.

**Prerequisites**: Phase 2 complete (indépendant autres US)

**Deliverable**: Utilisateurs peuvent réinitialiser mot de passe de manière autonome.

**Tasks**:

- [ ] T043 [US4] Créer Edge Function à `supabase/functions/send-password-reset-code/index.ts` similaire à verification code
- [ ] T044 [US4] Créer email template à `emails/PasswordResetCode.tsx` avec code 6 chiffres
- [ ] T045 [US4] Créer hook usePasswordReset à `hooks/usePasswordReset.ts` avec étapes: request → verify → reset
- [ ] T046 [US4] Créer ForgotPasswordForm à `components/auth/ForgotPasswordForm.tsx` avec input email
- [ ] T047 [US4] Créer page forgot-password à `app/(auth)/forgot-password/page.tsx`
- [ ] T048 [US4] Réutiliser VerificationCodeInput pour saisie code reset
- [ ] T049 [US4] Créer ResetPasswordForm à `components/auth/ResetPasswordForm.tsx` avec new_password, confirm_password
- [ ] T050 [US4] Créer page reset-password à `app/(auth)/reset-password/page.tsx`

**Acceptance Criteria**:
- ✅ Demande reset → code envoyé (même si email n'existe pas - éviter énumération)
- ✅ Code valide 15 min, saisie code correct → formulaire nouveau mot de passe
- ✅ Nouveau mot de passe valide → mise à jour + connexion auto
- ✅ Tous anciens codes reset invalidés après succès

---

## Phase 7: Polish & Security (Final)

**Goal**: Finaliser sécurité et expérience utilisateur.

**Prerequisites**: All user stories complete

**Tasks**:

- [ ] T051 Implémenter détection bruteforce: alerter admin si >20 tentatives login/heure même IP
- [ ] T052 Ajouter logging sécurité: logger toutes tentatives login échouées avec IP, timestamp, email dans table audit_logs
- [ ] T053 Créer page désactivation compte admin à `app/(admin)/users/[id]/page.tsx` avec bouton "Désactiver compte"
- [ ] T054 Implémenter invalidation session immédiate lors désactivation compte par admin
- [ ] T055 Ajouter indicateurs visuels sécurité: force mot de passe (barre couleur), dernière connexion affichée
- [ ] T056 Optimiser performance: ajouter loading skeletons, optimistic updates, error boundaries

**Acceptance Criteria**:
- ✅ Bruteforce détecté et alerté
- ✅ Audit trail complet des actions auth
- ✅ Admin peut désactiver comptes instantanément
- ✅ UX polie avec feedback visuel

---

## Dependencies & Execution Order

### Critical Path (Sequential)

```
Phase 1 (Setup)
    ↓
Phase 2 (Foundational) ← Blocking pour tous
    ↓
    ├─→ US1 (Signup) ─────────────────┐
    │                                   │
    ├─→ US2 (Login) ──────────────┐   │
    │                              ↓   ↓
    │                             US3 (Session)
    │                              ↓
    ├─→ US4 (Password Reset) ─────┤
    │                              ↓
    └────────────────────→ Phase 7 (Polish)
```

### Parallel Opportunities

**Phase 1 (Setup)**: T003-T006 totalement parallèles (fichiers différents)

**Phase 2 (Foundational)**: T011-T013 parallèles (composants indépendants)

**User Stories**:
- **US1, US2, US4 peuvent run en parallèle** (aucune dépendance entre eux)
- US3 dépend de US2 (besoin login pour tester sessions)
- Après US2 complète, US3 peut commencer

**Within US1**: T015-T017 (Edge Function setup) parallèles avec T018-T020 (React components)

---

## Suggested Sprint Breakdown

**Sprint 1 (Week 1)**: MVP - US1 + US2
- Days 1-2: Phase 1 (Setup) + Phase 2 (Foundational)
- Days 3-4: US1 (Signup + Verification)
- Day 5: US2 (Login)
- **MVP Deliverable**: Clients peuvent s'inscrire et se connecter ✅

**Sprint 2 (Week 2)**: Post-MVP - US3 + US4
- Days 1-2: US3 (Sessions persistantes)
- Days 3-4: US4 (Password reset)
- Day 5: Phase 7 (Polish & Security)
- **Final Deliverable**: Système auth production-ready ✅

---

## Testing Strategy

### Manual Test Scenarios (Critical)

**MVP Test (US1 + US2)**:
1. Ouvrir `/signup` → remplir formulaire → submit
2. Vérifier email reçu avec code 6 chiffres
3. Saisir code dans `/verify-email` → compte activé
4. Déconnexion
5. Aller `/login` → saisir credentials → accès dashboard

**Session Test (US3)**:
1. Login → fermer navigateur → rouvrir → toujours connecté
2. Click "Déconnexion" → redirect login → session terminée

**Password Reset Test (US4)**:
1. `/forgot-password` → saisir email → submit
2. Email reçu avec code
3. Saisir code → accès formulaire nouveau mot de passe
4. Créer nouveau mot de passe → connexion auto

### Integration Tests (Recommended)

```typescript
// __tests__/auth/signup-flow.test.ts
- ✅ Complete signup flow success
- ✅ Invalid email rejected
- ✅ Weak password rejected
- ✅ Code expiration after 15 min
- ✅ Max 3 verification attempts

// __tests__/auth/login-flow.test.ts
- ✅ Login with valid credentials
- ✅ Login with invalid password
- ✅ Rate limiting after 5 attempts
- ✅ Redirect to verify-email if not verified
```

---

## Implementation Tips

### Security Best Practices

1. **Never log passwords** - même en dev mode
2. **Generic error messages** - ne pas révéler si email existe
3. **Rate limiting strict** - 5 tentatives / 15 min max
4. **Codes cryptographically secure** - crypto.randomInt() pas Math.random()
5. **HTTP-only cookies** - pas de tokens en localStorage

### Code Organization

```
components/auth/       # Auth-specific components
  ├── SignupForm.tsx
  ├── LoginForm.tsx
  ├── VerificationCodeInput.tsx
  └── AuthProvider.tsx

hooks/                 # Auth business logic
  ├── useAuth.ts
  ├── useSignup.ts
  ├── useLogin.ts
  └── useVerification.ts

app/(auth)/           # Auth pages (no layout)
  ├── login/
  ├── signup/
  ├── verify-email/
  └── forgot-password/
```

### Common Pitfalls

1. **Oublier RLS policies** → données exposées
2. **Cacher cookies côté client** → XSS vulnérability
3. **Pas de rate limiting** → bruteforce attacks
4. **Révéler email existence** → enumeration attack
5. **Oublier trigger create profile** → auth.users sans profile

---

## Rollout Strategy

### Phase 1: Internal Testing (MVP)
- Déployer US1 + US2 en staging
- Tester avec équipe interne (10 comptes test)
- Vérifier emails arrivent, codes fonctionnent
- Monitor logs pour erreurs

### Phase 2: Beta Testing
- Déployer en production avec feature flag
- Inviter 50 beta testers
- Monitorer taux complétion signup
- Collecter feedback UX

### Phase 3: Full Launch
- Activer pour tous utilisateurs
- Monitor métriques (SC-001 à SC-010)
- Support prêt pour tickets auth

---

## Success Metrics (Post-Launch)

| Metric | Target | Measurement |
|--------|--------|-------------|
| Temps inscription | <3 min | SC-001: Signup → verified |
| Taux complétion signup | 75%+ | SC-002: Started / Completed |
| Temps connexion | <10s | SC-003: Click login → dashboard |
| Session persistence | 7+ jours | SC-004: No reconnect needed |
| Passwords hashed | 100% | SC-005: Audit database |
| Reset success rate | >90% | SC-006: Initiated / Completed |
| Bruteforce blocked | 100% | SC-007: Auto-block after 5 attempts |
| Code email delivery | <30s | SC-008: p95 latency |
| Support tickets reduction | -60% | SC-009: vs. before launch |
| Concurrent signups | 10,000+ | SC-010: Load test |

---

**Last Updated**: 2025-11-07
**Status**: ✅ Tasks Ready - Begin with Phase 1 (Setup)
**Next Action**: Execute T001-T006 to setup auth infrastructure
