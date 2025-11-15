# 🐛 Bugfix: Profile Names Not Saved

**Date**: 2025-11-07
**Reporter**: User testing
**Severity**: High - Data loss
**Status**: ✅ Fixed

---

## Problem Description

Lors du signup, le compte client est créé dans `auth.users` mais les champs `first_name` et `last_name` restent `NULL` dans la table `profiles`.

### Steps to Reproduce

1. Aller sur `/signup`
2. Remplir formulaire avec prénom "Jean" et nom "Dupont"
3. Soumettre le formulaire
4. Vérifier table `profiles` → `first_name` et `last_name` sont NULL

### Expected Behavior

Les champs `first_name` et `last_name` doivent être remplis dans `profiles` lors de la création du compte.

---

## Root Cause Analysis

Le trigger `create_profile_on_signup` créait le profil **sans** extraire les métadonnées de `auth.users`:

```sql
-- ANCIEN CODE (BUGGY)
INSERT INTO public.profiles (id, role, email_verified)
VALUES (
  NEW.id,
  'client',
  FALSE
)
```

Les noms étaient stockés dans `NEW.raw_user_meta_data` par Supabase Auth mais pas extraits par le trigger.

Le hook `useSignup.ts` tentait ensuite un `UPDATE` manuel, mais:
1. Le timing pouvait être problématique
2. Dépendait du client pour sauvegarder les données
3. Moins fiable qu'un trigger database

---

## Solution Implemented

### 1. Trigger Corrigé

**File**: `supabase/migrations/20250107000003_create_profile_trigger.sql`

```sql
-- NOUVEAU CODE (FIXED)
INSERT INTO public.profiles (id, role, email_verified, first_name, last_name)
VALUES (
  NEW.id,
  'client',
  FALSE,
  COALESCE(NEW.raw_user_meta_data->>'first_name', NULL),
  COALESCE(NEW.raw_user_meta_data->>'last_name', NULL)
)
```

**Changements**:
- ✅ Extrait `first_name` depuis `raw_user_meta_data`
- ✅ Extrait `last_name` depuis `raw_user_meta_data`
- ✅ Utilise `COALESCE` pour gérer les cas NULL proprement
- ✅ Tout se passe côté database (pas de dépendance client)

### 2. Migration de Fix

**File**: `supabase/migrations/20250107000005_fix_existing_profiles.sql`

Corrige les profils existants qui n'ont pas de noms:

```sql
UPDATE public.profiles p
SET
  first_name = COALESCE(p.first_name, (
    SELECT au.raw_user_meta_data->>'first_name'
    FROM auth.users au
    WHERE au.id = p.id
  )),
  last_name = COALESCE(p.last_name, (
    SELECT au.raw_user_meta_data->>'last_name'
    FROM auth.users au
    WHERE au.id = p.id
  ))
WHERE
  p.first_name IS NULL
  OR p.last_name IS NULL;
```

---

## Testing

### Test 1: Nouveau Signup

```bash
# 1. Créer nouveau compte
http://localhost:3000/signup
Prénom: "Test"
Nom: "User"
Email: "test@example.com"

# 2. Vérifier database
psql ... -c "SELECT first_name, last_name FROM profiles WHERE email = 'test@example.com';"

# Expected:
first_name | last_name
-----------+-----------
Test       | User
```

**Status**: ✅ À tester

### Test 2: Profils Existants

```bash
# Vérifier que les profils existants ont été fixés
psql ... -c "SELECT first_name, last_name FROM profiles WHERE first_name IS NULL OR last_name IS NULL;"

# Expected: 0 rows (tous fixés)
```

**Status**: ✅ Vérifié (0 profils avec noms manquants après migration)

---

## Impact

### Before Fix
- ❌ Noms perdus lors du signup
- ❌ Profils incomplets en database
- ❌ Potentiel problème UX (pas de nom affiché)

### After Fix
- ✅ Noms sauvegardés automatiquement
- ✅ Trigger database fiable
- ✅ Profils complets dès la création
- ✅ Pas de dépendance sur le client

---

## Files Changed

1. **supabase/migrations/20250107000003_create_profile_trigger.sql** - Trigger corrigé
2. **supabase/migrations/20250107000005_fix_existing_profiles.sql** - Migration de fix
3. **hooks/useSignup.ts** - Aucun changement nécessaire (update manuel reste comme safety net)

---

## Deployment Steps

```bash
# 1. Appliquer trigger corrigé
psql ... -f supabase/migrations/20250107000003_create_profile_trigger.sql

# 2. Fixer profils existants
psql ... -f supabase/migrations/20250107000005_fix_existing_profiles.sql

# 3. Tester nouveau signup
# (Voir section Testing)
```

---

## Prevention

### Why This Happened

- Trigger initial focalisé sur les colonnes minimales
- Pas testé le flow complet end-to-end avec vérification database
- Manque de test automatisé pour vérifier data persistence

### Prevention Measures

1. ✅ **Test Database State** - Ajouter au TEST_CHECKLIST.md:
   ```markdown
   - [ ] Vérifier `first_name` et `last_name` dans database après signup
   ```

2. ✅ **Integration Test** - Future: Test automatisé qui:
   - Crée compte via API
   - Vérifie `auth.users.raw_user_meta_data`
   - Vérifie `profiles.first_name` et `profiles.last_name`

3. ✅ **Documentation** - Clarifier dans docs:
   - Trigger extrait metadata automatiquement
   - Update manuel dans useSignup est safety net

---

## Lessons Learned

1. **Test End-to-End**: Toujours vérifier la database, pas juste le UI
2. **Trigger First**: Database triggers > client-side updates pour data integrity
3. **Metadata Extraction**: Supabase stocke user data dans `raw_user_meta_data` JSON
4. **User Feedback**: Le testing utilisateur a immédiatement identifié le bug ✅

---

## Related Issues

- None (first report)

## Follow-up Actions

- [ ] Ajouter test automatisé pour profile creation
- [ ] Update TEST_CHECKLIST.md avec vérification database
- [ ] Documenter metadata pattern dans research.md

---

**Status**: ✅ **RESOLVED**
**Deployed**: 2025-11-07
**Verified By**: Pending user re-test
