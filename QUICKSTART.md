# ⚡ Quick Start Guide - MVP Authentication

**Time to launch**: ~5 minutes

---

## 🚀 Lancement Rapide

### 1. Cloner & Installer (2 min)

```bash
cd /Users/dan/Documents/SOFTWARE/myProjects/simone\ _v2.1/webclaude

# Installer dépendances
pnpm install
```

### 2. Configurer Environment (1 min)

```bash
# Copier le template
cp .env.local.example .env.local

# Éditer avec vos valeurs
nano .env.local
```

**Valeurs nécessaires**:
```env
NEXT_PUBLIC_SUPABASE_URL=https://xtokgbfbhpzyhmbpmqhm.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=<votre_anon_key>
RESEND_API_KEY=<votre_resend_key>
```

**Où trouver ces clés**:
- **Supabase**: Dashboard > Settings > API
- **Resend**: https://resend.com/api-keys

### 3. Déployer Edge Function (2 min)

```bash
# Connecter Supabase CLI
supabase login
supabase link --project-ref xtokgbfbhpzyhmbpmqhm

# Déployer fonction email
supabase functions deploy send-verification-code

# Configurer clé Resend
supabase secrets set RESEND_API_KEY=re_xxx
```

### 4. Lancer l'App (30s)

```bash
pnpm dev
```

**🎉 App disponible sur**: http://localhost:3000

---

## ✅ Test Rapide (3 min)

### Flow Complet

1. **Signup**: http://localhost:3000/signup
   - Créer compte avec votre email
   - Recevoir code par email
   - Vérifier code

2. **Dashboard**: Auto-redirect vers /dashboard
   - Voir vos infos
   - Session active

3. **Logout**: Cliquer "Se déconnecter"
   - Redirect vers /login

4. **Login**: Se reconnecter
   - Accès immédiat au dashboard

---

## 📊 Status Check

Vérifier que tout fonctionne:

```bash
# Backend
curl http://localhost:3000/api/health

# Supabase connexion
psql -h db.xpntvajwrjuvsqsmizzb.supabase.co -U postgres -c "SELECT 1;"

# Edge Function
curl https://xtokgbfbhpzyhmbpmqhm.supabase.co/functions/v1/send-verification-code
```

---

## 🎯 Features Disponibles

### ✅ Implémenté (MVP)
- [x] Inscription avec email/password
- [x] Vérification email (code 6 chiffres)
- [x] Connexion standard
- [x] Sessions persistantes (7 jours)
- [x] Déconnexion
- [x] Protected routes
- [x] Rate limiting
- [x] RLS policies

### ⏸️ À Implémenter (Post-MVP)
- [x] Password reset (✅ Completed)
- [ ] Audit logging
- [ ] Admin panel
- [ ] 2FA (future)

---

## 🛠️ Feature 007: Contractor Interface

### Additional Environment Variables

Pour activer l'interface prestataire complète, configurez ces variables supplémentaires:

#### Stripe Connect (Obligatoire pour les paiements prestataires)

```env
# Stripe Connect Client ID
# Dashboard → Settings → Connect → Get Client ID
STRIPE_CONNECT_CLIENT_ID=ca_YOUR_CLIENT_ID_HERE

# Webhook Secret for Connect events
# Dashboard → Developers → Webhooks
# URL: https://YOUR_PROJECT_REF.supabase.co/functions/v1/handle-stripe-webhooks
# Events: account.updated, account.application.authorized
STRIPE_WEBHOOK_SECRET=whsec_YOUR_WEBHOOK_SECRET_HERE
```

#### URL Frontend (Déjà configuré)

```env
NEXT_PUBLIC_SITE_URL=http://localhost:3000  # ✅ Configured
```

#### Resend API (Déjà configuré)

```env
RESEND_API_KEY=re_j84bXep9_HW6spBe6mSF5i4LRsEoWzfbr  # ✅ Configured
```

### Storage Buckets

Les buckets Supabase Storage suivants ont été configurés:

✅ **job-applications** (Private)
- Utilisé pour: CV, certifications, portfolio des candidatures
- Upload: Authenticated users
- Read: Admin only

✅ **contractor-portfolios** (Public)
- Utilisé pour: Photos de portfolio des prestataires
- Upload: Contractors only (to their own folder)
- Read: Public

**Vérification des buckets**:
```bash
node scripts/check-007-migrations.mjs
```

### Database Migrations (007)

Les 15 migrations pour l'interface prestataire ont été appliquées:
- ✅ T001-T015: Tables core (specialties, contractor_profiles, bookings, etc.)
- ✅ T016-T017: Storage buckets configurés
- ✅ T018-T020: Variables d'environnement

---

## 🔥 Troubleshooting Rapide

### "Cannot connect to Supabase"
```bash
# Vérifier .env.local
cat .env.local | grep SUPABASE

# Test connexion
curl $NEXT_PUBLIC_SUPABASE_URL/rest/v1/
```

### "Email not sent"
```bash
# Vérifier secret Resend
supabase secrets list

# Test Resend API
curl -X POST https://api.resend.com/emails \
  -H "Authorization: Bearer $RESEND_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{"from":"test@test.com","to":"you@email.com","subject":"Test","html":"<p>Test</p>"}'
```

### "Rate limit not working"
- Vérifier que `middleware.ts` existe
- Check matcher config inclut `/auth/*`
- Restart dev server

---

## 📚 Documentation

- **Guide complet**: [DEPLOYMENT_GUIDE.md](./DEPLOYMENT_GUIDE.md)
- **Tests**: [TEST_CHECKLIST.md](./TEST_CHECKLIST.md)
- **Spec technique**: [specs/001-authentication-system/](./specs/001-authentication-system/)
- **Roadmap**: [IMPLEMENTATION_ROADMAP.md](./IMPLEMENTATION_ROADMAP.md)

---

## 🎉 Ready!

Votre système d'authentification MVP est maintenant opérationnel.

**Next steps**:
1. Tester avec TEST_CHECKLIST.md
2. Inviter beta testers
3. Monitorer métriques
4. Itérer selon feedback

**Support**: Voir DEPLOYMENT_GUIDE.md section Troubleshooting

---

**Status**: ✅ MVP Ready
**Version**: 1.0.0-mvp
**Last Updated**: 2025-11-07
