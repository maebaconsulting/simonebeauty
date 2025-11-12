# 🚀 Guide de Déploiement - MVP Authentication

**Date**: 2025-11-07
**Spec**: 001-authentication-system
**Status**: ✅ MVP Ready (Phases 1-5 Complete)

---

## 📋 Prérequis

- [x] Node.js 18+ installé
- [x] pnpm installé (`npm install -g pnpm`)
- [x] Compte Supabase configuré
- [x] Compte Resend pour emails
- [x] Supabase CLI installé (`npm install -g supabase`)

---

## ⚙️ Configuration Initiale

### 1. Variables d'Environnement

Créez `.env.local` à la racine du projet:

```bash
cp .env.local.example .env.local
```

Remplissez les valeurs:

```env
# Supabase - Trouvez ces valeurs dans: Supabase Dashboard > Settings > API
NEXT_PUBLIC_SUPABASE_URL=https://xxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...

# Resend - Obtenez votre clé sur: https://resend.com/api-keys
RESEND_API_KEY=re_xxxxxxxxx

# Environment
NODE_ENV=development
```

### 2. Installation des Dépendances

```bash
cd /Users/dan/Documents/SOFTWARE/myProjects/simone\ _v2.1/webclaude
pnpm install
```

**Packages installés**:
- @supabase/ssr, @supabase/auth-helpers-nextjs
- resend, @react-email/components, @react-email/render
- @tanstack/react-query
- react-hook-form, @hookform/resolvers, zod
- shadcn/ui components (button, input, label, form, card, checkbox)

---

## 🗄️ Configuration Base de Données

### Vérifier les Migrations

Les migrations suivantes ont déjà été appliquées:

```bash
# Vérifier que les tables existent
psql -h db.xpntvajwrjuvsqsmizzb.supabase.co -U postgres -d postgres << EOF
\dt public.profiles;
\dt public.verification_codes;
EOF
```

**Tables créées**:
- ✅ `profiles` (avec colonnes `email_verified`, `last_login_at`)
- ✅ `verification_codes` (codes 6 chiffres temporaires)
- ✅ Trigger `create_profile_on_signup`
- ✅ RLS policies sur toutes les tables

### Si Besoin de Réappliquer les Migrations

```bash
cd supabase/migrations
export PGPASSWORD='MoutBinam@007'

psql -h db.xpntvajwrjuvsqsmizzb.supabase.co -U postgres -d postgres \
  -f 20250107000001_create_profiles_table.sql

psql -h db.xpntvajwrjuvsqsmizzb.supabase.co -U postgres -d postgres \
  -f 20250107000002_create_verification_codes.sql

psql -h db.xpntvajwrjuvsqsmizzb.supabase.co -U postgres -d postgres \
  -f 20250107000003_create_profile_trigger.sql

psql -h db.xpntvajwrjuvsqsmizzb.supabase.co -U postgres -d postgres \
  -f 20250107000004_create_rls_policies.sql
```

---

## 📧 Déploiement de l'Edge Function

### 1. Connecter Supabase CLI

```bash
# Se connecter à votre projet
supabase login

# Lier au projet
supabase link --project-ref xtokgbfbhpzyhmbpmqhm
```

### 2. Déployer la Fonction

```bash
# Déployer send-verification-code
supabase functions deploy send-verification-code

# Configurer la clé Resend
supabase secrets set RESEND_API_KEY=re_your_key_here
```

### 3. Tester l'Edge Function

```bash
# Test basique
curl -i --location --request POST \
  'https://xtokgbfbhpzyhmbpmqhm.supabase.co/functions/v1/send-verification-code' \
  --header 'Authorization: Bearer YOUR_ANON_KEY' \
  --header 'Content-Type: application/json' \
  --data '{"email":"test@example.com","type":"email_verification","userId":"test-uuid"}'
```

---

## 🏃 Lancement du Serveur de Développement

```bash
# Démarrer Next.js
pnpm dev
```

Le serveur démarre sur **http://localhost:3000**

---

## 🧪 Plan de Test MVP

### Test 1: Inscription Complète (US1)

**Objectif**: Vérifier que l'inscription fonctionne de bout en bout

1. Ouvrir http://localhost:3000/signup
2. Remplir le formulaire:
   - Prénom: `Jean`
   - Nom: `Dupont`
   - Email: `votre.email@example.com` (utilisez un vrai email)
   - Mot de passe: `Test@1234` (respecte les critères)
   - Confirmer mot de passe: `Test@1234`
3. Cliquer "S'inscrire"
4. **Attendre redirect vers /verify-email**
5. **Checker votre email** (devrait arriver en < 30 secondes)
6. Saisir le code à 6 chiffres
7. **Vérifier redirect automatique vers /dashboard**

**✅ Critères de succès**:
- Code reçu par email en < 30s
- Code accepté
- Redirect vers dashboard
- Session active (voir email + ID dans dashboard)

**❌ Tests négatifs**:
- Mauvais code → message "Code incorrect, X tentatives restantes"
- Code expiré (après 15 min) → message "Code expiré"
- 3 tentatives échouées → message "Maximum de tentatives atteint"

---

### Test 2: Connexion Standard (US2)

**Objectif**: Vérifier que le login fonctionne

1. Si déjà connecté, cliquer "Se déconnecter" dans le header
2. Aller sur http://localhost:3000/login
3. Saisir email et mot de passe du compte créé
4. Cliquer "Se connecter"
5. **Vérifier redirect vers /dashboard**

**✅ Critères de succès**:
- Login réussi avec credentials valides
- Redirect vers dashboard
- Email affiché correctement

**❌ Tests négatifs**:
- Mauvais mot de passe → "Email ou mot de passe incorrect" (générique)
- Email non vérifié → redirect vers /verify-email
- 5 tentatives échouées → rate limit (429)

---

### Test 3: Session Persistante (US3)

**Objectif**: Vérifier que la session persiste

**Test 3A: Fermer/Rouvrir Navigateur**
1. Se connecter au dashboard
2. **Fermer complètement le navigateur** (pas juste l'onglet)
3. Rouvrir le navigateur
4. Aller sur http://localhost:3000/dashboard
5. **Vérifier que vous êtes toujours connecté** (pas de redirect vers login)

**Test 3B: Déconnexion**
1. Depuis le dashboard
2. Cliquer "Se déconnecter" dans le header
3. **Vérifier redirect vers /login**
4. Essayer d'accéder /dashboard
5. **Vérifier redirect vers /login** (session invalide)

**✅ Critères de succès**:
- Session persiste après fermeture navigateur
- Logout fonctionne immédiatement
- Impossible d'accéder dashboard après logout

---

### Test 4: Vérification des Cookies

**Objectif**: Vérifier la configuration des cookies de session

1. Ouvrir DevTools (F12)
2. Onglet "Application" > "Cookies"
3. Chercher les cookies Supabase (commencent par `sb-`)

**✅ Vérifier**:
- `HttpOnly`: ✅ activé
- `Secure`: ✅ en production
- `SameSite`: `Lax`
- `Max-Age`: 604800 (7 jours)

---

### Test 5: Rate Limiting (Sécurité)

**Objectif**: Vérifier que le rate limiting fonctionne

1. Aller sur /login
2. Entrer 5 fois un mauvais mot de passe
3. **Vérifier message d'erreur** après 5 tentatives
4. Attendre 15 minutes OU changer d'IP
5. Réessayer → devrait fonctionner

**✅ Critères de succès**:
- Blocage après 5 tentatives échouées
- Message clair: "Trop de tentatives..."
- Déblocage après 15 minutes

---

### Test 6: Protected Routes (Middleware)

**Objectif**: Vérifier que les routes sont protégées

**Sans être connecté**:
1. Essayer d'accéder http://localhost:3000/dashboard
2. **Vérifier redirect automatique vers /login**

**En étant connecté**:
1. Essayer d'accéder http://localhost:3000/login
2. **Vérifier redirect automatique vers /dashboard**

**✅ Critères de succès**:
- Routes protégées inaccessibles sans auth
- Pages auth inaccessibles si déjà connecté

---

## 📊 Checklist de Validation MVP

### Fonctionnalités Core
- [ ] ✅ Inscription avec email/password
- [ ] ✅ Vérification email (code 6 chiffres)
- [ ] ✅ Connexion standard
- [ ] ✅ Session persistante (7 jours)
- [ ] ✅ Déconnexion
- [ ] ✅ Protected routes (middleware)

### Sécurité
- [ ] ✅ Rate limiting (5/15min)
- [ ] ✅ Passwords hashés (Supabase bcrypt)
- [ ] ✅ HTTP-only cookies
- [ ] ✅ RLS policies actives
- [ ] ✅ Generic error messages
- [ ] ✅ Codes cryptographiquement sécurisés

### UX
- [ ] ✅ Validation formulaires (Zod)
- [ ] ✅ Messages d'erreur clairs
- [ ] ✅ Loading states
- [ ] ✅ Auto-redirect après actions
- [ ] ✅ Resend code (60s cooldown)
- [ ] ✅ Session monitor (warning)

---

## 🐛 Troubleshooting

### Problème: "Email not sent"

**Cause**: Clé Resend non configurée ou invalide

**Solution**:
```bash
# Vérifier que la clé est set
supabase secrets list

# Si absente, la configurer
supabase secrets set RESEND_API_KEY=re_xxx
```

### Problème: "Session expired immediately"

**Cause**: Cookies mal configurés

**Solution**: Vérifier dans `lib/supabase/server.ts`:
- `maxAge: SESSION_MAX_AGE` est présent
- `httpOnly: true` est présent
- `secure` est activé en production

### Problème: "Rate limit not working"

**Cause**: Middleware config

**Solution**: Vérifier `middleware.ts`:
- Le matcher inclut `/auth/*` et `/api/auth/*`
- Rate limit map est bien initialisé

### Problème: "Verification codes not found"

**Cause**: Table ou RLS policy

**Solution**:
```bash
# Vérifier que la table existe
psql ... -c "\d public.verification_codes;"

# Vérifier RLS policies
psql ... -c "\dp public.verification_codes;"
```

---

## 📈 Monitoring Post-Déploiement

### Métriques à Surveiller

**Performance**:
- Temps signup complet: < 3 minutes (SC-001)
- Temps connexion: < 10 secondes (SC-003)
- Réception email: < 30 secondes (SC-008)

**Succès**:
- Taux complétion signup: > 75% (SC-002)
- Taux succès password reset: > 90% (SC-006)

**Sécurité**:
- 100% passwords hashés (SC-005)
- 100% bruteforce bloqués (SC-007)

### Logs à Vérifier

**Supabase Dashboard > Logs**:
- Edge Function invocations
- Auth events (signup, login, logout)
- Erreurs serveur

**Application Logs**:
```bash
# En développement
pnpm dev | grep -i error

# Vérifier erreurs auth spécifiquement
pnpm dev | grep -i "auth error"
```

---

## 🎯 Next Steps Après Validation

### Si Tests Réussis ✅

1. **Déployer en staging/production**:
   ```bash
   # Vercel
   vercel deploy

   # Ou autre plateforme
   pnpm build && pnpm start
   ```

2. **Monitorer les premiers utilisateurs**:
   - Suivre métriques de succès
   - Collecter feedback UX
   - Identifier pain points

3. **Implémenter Phases 6-7** (optionnel):
   - Phase 6: Password Reset (8 tasks, 6h)
   - Phase 7: Polish & Security (6 tasks, 2h)

### Si Problèmes Détectés ❌

1. **Documenter le bug**:
   - Steps to reproduce
   - Expected vs actual behavior
   - Browser/environment info

2. **Fixer et retester**:
   - Identifier la cause
   - Implémenter le fix
   - Re-run les tests concernés

3. **Mettre à jour la doc**:
   - Ajouter au troubleshooting
   - Update checklist si nécessaire

---

## 📞 Support

**Documentation**:
- Spec: `specs/001-authentication-system/spec.md`
- Tasks: `specs/001-authentication-system/tasks.md`
- Research: `specs/001-authentication-system/research.md`

**Ressources Externes**:
- Supabase Auth: https://supabase.com/docs/guides/auth
- Next.js 16: https://nextjs.org/docs
- Resend API: https://resend.com/docs

---

**Status**: 🚀 **READY FOR DEPLOYMENT**
**Last Updated**: 2025-11-07
**MVP Completion**: 71% (40/56 tasks)
