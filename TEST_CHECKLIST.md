# ✅ Checklist de Test MVP - Authentication System

**Date**: 2025-11-07
**Testeur**: _______________________
**Environment**: [ ] Dev [ ] Staging [ ] Production

---

## 🚀 Quick Start

```bash
# 1. Installer dépendances
pnpm install

# 2. Configurer .env.local
cp .env.local.example .env.local
# Remplir: NEXT_PUBLIC_SUPABASE_URL, NEXT_PUBLIC_SUPABASE_ANON_KEY, RESEND_API_KEY

# 3. Démarrer serveur
pnpm dev

# 4. Ouvrir http://localhost:3000
```

---

## 📋 Tests Fonctionnels

### Test 1: Inscription (US1) - P1 Critical

**URL**: http://localhost:3000/signup

| # | Action | Résultat Attendu | ✅/❌ | Notes |
|---|--------|------------------|-------|-------|
| 1.1 | Ouvrir /signup | Formulaire affiché | [ ] | |
| 1.2 | Remplir prénom: "Jean" | Champ accepté | [ ] | |
| 1.3 | Remplir nom: "Dupont" | Champ accepté | [ ] | |
| 1.4 | Email: votre.email@gmail.com | Validation OK | [ ] | |
| 1.5 | Password: "Test@1234" | Validation OK | [ ] | |
| 1.6 | Confirm: "Test@1234" | Champs matchent | [ ] | |
| 1.7 | Cliquer "S'inscrire" | Loading state | [ ] | |
| 1.8 | Attendre redirect | → /verify-email | [ ] | |
| 1.9 | Checker email | Code reçu < 30s | [ ] | Temps: ___s |
| 1.10 | Copier code 6 chiffres | Ex: 123456 | [ ] | Code: _____ |
| 1.11 | Saisir code | 6 inputs remplis | [ ] | |
| 1.12 | Auto-submit code | Vérification... | [ ] | |
| 1.13 | Attendre redirect | → /dashboard | [ ] | |
| 1.14 | Vérifier dashboard | Email + ID affichés | [ ] | |
| 1.15 | **DATABASE CHECK**: Vérifier noms | `psql ... -c "SELECT first_name, last_name FROM profiles WHERE email='votre.email@gmail.com';"` | [ ] | first_name=Jean, last_name=Dupont |

**Temps Total**: _____ minutes (cible: < 3 min)

**⚠️ CRITICAL**: Step 1.15 vérifie le bugfix - les noms doivent être sauvegardés en database!

---

### Test 2: Vérification Email - Edge Cases

| # | Test | Résultat Attendu | ✅/❌ | Notes |
|---|------|------------------|-------|-------|
| 2.1 | Code invalide | "Code incorrect, 2 tentatives restantes" | [ ] | |
| 2.2 | 2ème mauvais code | "Code incorrect, 1 tentative restante" | [ ] | |
| 2.3 | 3ème mauvais code | "Maximum de tentatives atteint" | [ ] | |
| 2.4 | Cliquer "Renvoyer" | Cooldown 60s actif | [ ] | |
| 2.5 | Attendre 60s | Bouton "Renvoyer" activé | [ ] | |
| 2.6 | Renvoyer code | Nouveau code reçu | [ ] | |
| 2.7 | Saisir nouveau code | Vérification réussie | [ ] | |

---

### Test 3: Connexion (US2) - P1 Critical

**URL**: http://localhost:3000/login

| # | Action | Résultat Attendu | ✅/❌ | Notes |
|---|--------|------------------|-------|-------|
| 3.1 | Se déconnecter si connecté | Redirect /login | [ ] | |
| 3.2 | Ouvrir /login | Formulaire affiché | [ ] | |
| 3.3 | Email: compte créé | Champ rempli | [ ] | |
| 3.4 | Password: correct | Champ rempli | [ ] | |
| 3.5 | Cocher "Se souvenir" | Checkbox cochée | [ ] | |
| 3.6 | Cliquer "Se connecter" | Loading... | [ ] | |
| 3.7 | Attendre redirect | → /dashboard | [ ] | Temps: ___s |
| 3.8 | Vérifier session | Info utilisateur OK | [ ] | |

**Temps Total**: _____ secondes (cible: < 10s)

---

### Test 4: Login - Tests Négatifs

| # | Test | Résultat Attendu | ✅/❌ | Notes |
|---|------|------------------|-------|-------|
| 4.1 | Mauvais password | "Email ou mot de passe incorrect" | [ ] | |
| 4.2 | Email inexistant | "Email ou mot de passe incorrect" | [ ] | |
| 4.3 | 5 tentatives échouées | Rate limit (429) | [ ] | |
| 4.4 | Message rate limit | "Trop de tentatives, réessayez dans 15 min" | [ ] | |
| 4.5 | Attendre 15 min | Login fonctionne à nouveau | [ ] | |

---

### Test 5: Session Persistante (US3) - P2

| # | Action | Résultat Attendu | ✅/❌ | Notes |
|---|--------|------------------|-------|-------|
| 5.1 | Se connecter | Dashboard accessible | [ ] | |
| 5.2 | **Fermer navigateur complètement** | Navigateur fermé | [ ] | |
| 5.3 | Rouvrir navigateur | Navigateur ouvert | [ ] | |
| 5.4 | Aller /dashboard | Toujours connecté (pas de redirect) | [ ] | |
| 5.5 | Vérifier info | Email + ID affichés | [ ] | |
| 5.6 | Cliquer "Se déconnecter" | Redirect /login | [ ] | |
| 5.7 | Tenter /dashboard | Redirect /login | [ ] | |

---

### Test 6: Protected Routes

| # | Test | Résultat Attendu | ✅/❌ | Notes |
|---|------|------------------|-------|-------|
| 6.1 | **Sans auth**: /dashboard | Redirect → /login | [ ] | |
| 6.2 | **Sans auth**: /profile | Redirect → /login | [ ] | |
| 6.3 | **Avec auth**: /login | Redirect → /dashboard | [ ] | |
| 6.4 | **Avec auth**: /signup | Redirect → /dashboard | [ ] | |

---

### Test 7: Cookies & Sécurité

**DevTools** > Application > Cookies

| # | Cookie | Valeur Attendue | ✅/❌ | Notes |
|---|--------|-----------------|-------|-------|
| 7.1 | HttpOnly | ✅ true | [ ] | |
| 7.2 | Secure | ✅ true (prod) / false (dev) | [ ] | |
| 7.3 | SameSite | Lax | [ ] | |
| 7.4 | Max-Age | 604800 (7 jours) | [ ] | |

---

## 🔒 Tests de Sécurité

### Test 8: Password Strength

| # | Password | Résultat Attendu | ✅/❌ | Notes |
|---|----------|------------------|-------|-------|
| 8.1 | "test" | ❌ Trop court | [ ] | |
| 8.2 | "testtest" | ❌ Pas de majuscule | [ ] | |
| 8.3 | "Testtest" | ❌ Pas de chiffre | [ ] | |
| 8.4 | "Testtest1" | ❌ Pas de spécial | [ ] | |
| 8.5 | "Test@1234" | ✅ Valide | [ ] | |

---

### Test 9: RLS Policies (Database)

**Requête directe à Supabase**:

```sql
-- Vérifier qu'un user ne peut voir que son profil
SELECT * FROM profiles WHERE id != auth.uid();
-- Attendu: 0 lignes

-- Vérifier accès à son profil
SELECT * FROM profiles WHERE id = auth.uid();
-- Attendu: 1 ligne (son profil)
```

| # | Test | Résultat | ✅/❌ | Notes |
|---|------|----------|-------|-------|
| 9.1 | Cannot see other profiles | 0 lignes | [ ] | |
| 9.2 | Can see own profile | 1 ligne | [ ] | |

---

## 📊 Métriques de Performance

| Métrique | Cible | Résultat | ✅/❌ |
|----------|-------|----------|-------|
| Temps signup complet | < 3 min | _____ min | [ ] |
| Temps login | < 10s | _____ s | [ ] |
| Email delivery | < 30s | _____ s | [ ] |
| Session persistence | 7+ jours | _____ jours | [ ] |

---

## 🐛 Bugs Trouvés

| # | Description | Sévérité | Steps to Reproduce | Status |
|---|-------------|----------|-------------------|--------|
| 1 | | [ ] Critique [ ] Majeur [ ] Mineur | | [ ] Open [ ] Fixed |
| 2 | | [ ] Critique [ ] Majeur [ ] Mineur | | [ ] Open [ ] Fixed |
| 3 | | [ ] Critique [ ] Majeur [ ] Mineur | | [ ] Open [ ] Fixed |

---

## ✅ Validation Finale

### Checklist Complète

- [ ] **Tous les tests fonctionnels passés** (Tests 1-6)
- [ ] **Tous les tests sécurité passés** (Tests 7-9)
- [ ] **Métriques de performance atteintes**
- [ ] **Aucun bug critique**
- [ ] **Documentation à jour**

### Décision

- [ ] ✅ **APPROUVÉ** - Ready for production
- [ ] ⚠️ **APPROUVÉ AVEC RÉSERVES** - Minor issues, can deploy
- [ ] ❌ **REJETÉ** - Critical issues, cannot deploy

**Signature**: _______________________
**Date**: _______________________

---

## 📝 Notes Additionnelles

```
[Espace pour notes libres du testeur]





```

---

**Next Steps après validation**:
1. Déployer Edge Function: `supabase functions deploy send-verification-code`
2. Configurer secrets: `supabase secrets set RESEND_API_KEY=xxx`
3. Deploy app: `vercel deploy` ou équivalent
4. Monitor metrics en production
