# 🔧 Configuration Email Verification - Instructions Critiques

**Date**: 2025-11-07
**Problème**: Supabase envoie ses propres emails de confirmation au lieu de nos codes personnalisés

---

## 🚨 Problème Identifié

Vous recevez l'email "Confirm your signup" de Supabase au lieu du code à 6 chiffres personnalisé.

**Cause**: Supabase a l'option "Enable email confirmations" activée par défaut.

---

## ✅ Solution - Étapes Obligatoires

### Étape 1: Désactiver l'Email de Confirmation Supabase

1. **Ouvrez le Dashboard Supabase**:
   - URL: https://supabase.com/dashboard/project/xpntvajwrjuvsqsmizzb/auth/settings

2. **Trouvez la section "Email"**:
   - Cherchez **"Enable email confirmations"**
   - **DÉSACTIVEZ** cette option (toggle OFF)

3. **Sauvegardez** les changements

### Étape 2: Redémarrer le Serveur Dev

```bash
cd /Users/dan/Documents/SOFTWARE/myProjects/simone\ _v2.1/webclaude

# Si le serveur tourne, arrêtez-le (Ctrl+C)

# Relancez
pnpm dev
```

### Étape 3: Nettoyer les Comptes Test

Les comptes créés pendant les tests sont dans un état "waiting confirmation". Nettoyons-les:

```bash
PGPASSWORD='MoutBinam@007' psql -h db.xpntvajwrjuvsqsmizzb.supabase.co -U postgres -d postgres -c "
-- Voir les comptes non confirmés
SELECT id, email, email_confirmed_at, created_at
FROM auth.users
WHERE email_confirmed_at IS NULL
ORDER BY created_at DESC;
"
```

**Pour supprimer les comptes test** (si nécessaire):
```bash
PGPASSWORD='MoutBinam@007' psql -h db.xpntvajwrjuvsqsmizzb.supabase.co -U postgres -d postgres -c "
-- Supprimer les comptes test non confirmés (ATTENTION: adapte l'email)
DELETE FROM auth.users
WHERE email = 'votre-email-test@example.com'
AND email_confirmed_at IS NULL;
"
```

### Étape 4: Test Complet

Après avoir désactivé l'email confirmation Supabase:

1. Allez sur http://localhost:3000/signup
2. Créez un compte avec un nouvel email
3. **Vous devriez maintenant**:
   - ✅ Être redirigé vers /verify-email
   - ✅ Recevoir un email avec un **code à 6 chiffres**
   - ✅ Pouvoir saisir le code et accéder au dashboard

---

## 🔍 Vérification Que Ça Fonctionne

### Test de l'API Route

Testez que l'API route fonctionne:

```bash
# Remplacez USER_ID par un vrai UUID d'un compte existant
curl -X POST http://localhost:3000/api/auth/send-verification-code \
  -H "Content-Type: application/json" \
  -d '{
    "email":"votre-email@example.com",
    "type":"email_verification",
    "userId":"VOTRE_USER_ID_ICI"
  }'
```

**Résultat attendu**: `{"success":true,"message":"Verification code sent successfully","expiresAt":"..."}`

### Vérifier le Code en Database

Après avoir créé un compte:

```bash
PGPASSWORD='MoutBinam@007' psql -h db.xpntvajwrjuvsqsmizzb.supabase.co -U postgres -d postgres -c "
-- Voir les codes de vérification récents
SELECT user_id, code, type, attempts, created_at, expires_at
FROM verification_codes
ORDER BY created_at DESC
LIMIT 5;
"
```

Vous devriez voir le code à 6 chiffres généré.

---

## 📋 Checklist Finale

Avant de tester à nouveau:

- [ ] ✅ "Enable email confirmations" **DÉSACTIVÉ** dans Supabase Dashboard
- [ ] ✅ Serveur dev **redémarré** (`pnpm dev`)
- [ ] ✅ Comptes test **supprimés** (optionnel)
- [ ] ✅ API route accessible sur http://localhost:3000/api/auth/send-verification-code
- [ ] ✅ Variables d'environnement présentes:
  - `NEXT_PUBLIC_SUPABASE_URL`
  - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
  - `SUPABASE_SERVICE_ROLE_KEY`
  - `RESEND_API_KEY`

---

## 🐛 Troubleshooting

### Problème: "Failed to store verification code"

**Cause**: RLS policies ou foreign key constraint

**Solution**: Vérifier que l'utilisateur existe dans `auth.users`:
```sql
SELECT id, email FROM auth.users WHERE email = 'votre-email@example.com';
```

### Problème: "Failed to send email"

**Cause**: Clé Resend invalide ou email "from" non vérifié

**Solution temporaire**: Resend test domain
- L'API route utilise `onboarding@resend.dev` (domaine de test Resend)
- Fonctionne sans configuration supplémentaire
- Pour production: configurer votre domaine dans Resend

### Problème: Email toujours de Supabase

**Cause**: L'option "Enable email confirmations" est toujours activée

**Solution**:
1. Vérifier dans Dashboard > Auth > Settings
2. Rafraîchir la page du dashboard
3. Attendre 1-2 minutes pour que le changement se propage
4. Créer un nouveau compte (pas réutiliser un ancien email)

---

## 📊 Flow Attendu Après Configuration

```
1. User remplit formulaire /signup
   ↓
2. useSignup.ts crée compte Supabase (sans email auto)
   ↓
3. Trigger DB crée profil avec first_name/last_name
   ↓
4. API route /api/auth/send-verification-code appelée
   ↓
5. Code 6 chiffres généré et stocké en DB
   ↓
6. Email envoyé via Resend avec le code
   ↓
7. User reçoit email avec code
   ↓
8. User saisit code sur /verify-email
   ↓
9. Code vérifié, email_verified=true
   ↓
10. Redirect vers /dashboard
```

---

## 📞 Support

Si le problème persiste après avoir suivi ces étapes:

1. **Vérifier les logs du serveur dev** pour voir les erreurs
2. **Vérifier la console browser** (DevTools) pour les erreurs réseau
3. **Vérifier la table verification_codes** pour voir si les codes sont créés
4. **Tester l'API route directement** avec curl

---

**Status**: ⚠️ **ACTION REQUISE**
**Next Step**: Désactiver "Enable email confirmations" dans Supabase Dashboard

**Last Updated**: 2025-11-07
