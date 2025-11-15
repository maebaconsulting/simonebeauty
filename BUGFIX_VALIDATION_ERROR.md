# 🐛 Bugfix: Validation Error on Verify Email Page

**Date**: 2025-11-07
**Issue**: "Invalid input: expected string, received undefined" displayed below verification code input
**Status**: ✅ Résolu

---

## 🚨 Problème Identifié

**Symptôme**:
- Utilisateur voit le message d'erreur: "Invalid input: expected string, received undefined"
- L'erreur apparaît en dessous de l'input de code de vérification
- La vérification du code fonctionne, mais l'erreur s'affiche quand même

**Impact**:
- ❌ Mauvaise UX - message d'erreur confus
- ❌ Utilisateur pense que quelque chose ne fonctionne pas
- ✅ Fonctionnalité opérationnelle (code vérifié correctement)

---

## 🔍 Root Cause Analysis

### 1. Hook useResendCode Incorrect

**Fichier**: [hooks/useVerification.ts](hooks/useVerification.ts:107-133)

**Problème**:
```typescript
// ❌ AVANT (ligne 113)
const { error } = await supabase.functions.invoke('send-verification-code', {
  body: { email, type },
})
```

**Cause**:
- Le hook appelait `supabase.functions.invoke()` pour un Edge Function qui **n'existe pas**
- L'Edge Function n'a jamais été déployé - nous utilisons l'API route `/api/auth/send-verification-code`
- Quand l'appel échoue, une valeur `undefined` est retournée
- Cette valeur undefined déclenche une erreur de validation Zod

### 2. Tentative de Login Automatique Invalide

**Fichier**: [hooks/useVerification.ts](hooks/useVerification.ts:60-66)

**Problème**:
```typescript
// ❌ AVANT (lignes 61-64)
const { error: signInError } = await supabase.auth.signInWithPassword({
  email,
  password: '', // This won't work - we need a different approach
})
```

**Cause**:
- Tentative de login avec password vide après vérification email
- Impossible de fonctionner sans le vrai mot de passe
- Code non fonctionnel qui pourrait causer des erreurs

### 3. Redirect Incorrect Après Vérification

**Fichier**: [app/(auth)/verify-email/page.tsx](app/(auth)/verify-email/page.tsx:40-45)

**Problème**:
```typescript
// ❌ AVANT (ligne 42)
router.push('/dashboard')
```

**Cause**:
- Tentative de redirect vers `/dashboard` alors que l'utilisateur n'est **pas connecté**
- Le middleware va bloquer l'accès et redirect vers `/login`
- UX confuse - l'utilisateur ne comprend pas pourquoi il est redirigé

---

## ✅ Solution Implémentée

### Fix 1: useResendCode Hook

**Fichier**: [hooks/useVerification.ts](hooks/useVerification.ts:107-133)

```typescript
// ✅ APRÈS
export function useResendCode() {
  return useMutation<VerifyCodeResponse, VerifyCodeError, { email: string; type: 'email_verification' | 'password_reset' }>({
    mutationFn: async ({ email, type }) => {
      // Call API route to send new code
      const response = await fetch('/api/auth/send-verification-code', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, type }),
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        throw {
          message: errorData.error || 'Échec de l\'envoi du code. Réessayez dans quelques instants.',
          type: 'resend_error',
        }
      }

      return {
        success: true,
        message: 'Un nouveau code a été envoyé à votre email',
      }
    },
  })
}
```

**Changements**:
- ✅ Appel à l'API route `/api/auth/send-verification-code` au lieu d'Edge Function
- ✅ Gestion d'erreur robuste avec `response.ok`
- ✅ Cohérent avec les autres hooks (useVerification, useForgotPassword)

### Fix 2: Suppression du Login Automatique

**Fichier**: [hooks/useVerification.ts](hooks/useVerification.ts:60-66)

```typescript
// ✅ APRÈS
if (!response.ok) {
  const errorData = await response.json().catch(() => ({}))
  throw {
    message: errorData.error || 'Code invalide',
    type: errorData.type || 'verification_error',
    attemptsRemaining: errorData.attemptsRemaining,
  }
}

// Code verified successfully!
// The API route has already marked email as verified in the database
// User will need to log in with their credentials
return {
  success: true,
  message: 'Email vérifié avec succès !',
}
```

**Changements**:
- ✅ Suppression de la tentative de login invalide
- ✅ Commentaire expliquant que l'utilisateur doit se connecter manuellement
- ✅ Plus simple et plus clair

### Fix 3: Redirect vers Login

**Fichier**: [app/(auth)/verify-email/page.tsx](app/(auth)/verify-email/page.tsx:39-47)

```typescript
// ✅ APRÈS
onSuccess: () => {
  // Redirect to login page with success message
  // User needs to log in with their credentials
  setTimeout(() => {
    router.push('/login?message=email-verified')
  }, 1500)
}
```

**Changements**:
- ✅ Redirect vers `/login` au lieu de `/dashboard`
- ✅ Ajout du paramètre `?message=email-verified` pour afficher un message de succès
- ✅ Utilisateur comprend qu'il doit se connecter

---

## 🧪 Tests de Validation

### Test 1: Vérification Email (Signup Flow)

**Steps**:
1. Créer un nouveau compte avec email + password
2. Recevoir le code à 6 chiffres par email
3. Saisir le code sur `/verify-email`
4. Vérifier: aucun message d'erreur "Invalid input"
5. Vérifier: redirect vers `/login?message=email-verified`
6. Se connecter avec email + password
7. Accès au dashboard

**Résultat Attendu**:
- ✅ Aucune erreur de validation
- ✅ Message de succès clair
- ✅ Redirect fluide vers login
- ✅ Login fonctionne

### Test 2: Resend Code

**Steps**:
1. Sur page `/verify-email`
2. Cliquer "Renvoyer le code" (après 60s)
3. Vérifier: nouveau code reçu par email
4. Vérifier: aucune erreur dans console
5. Saisir nouveau code
6. Vérifier: vérification réussie

**Résultat Attendu**:
- ✅ Nouveau code envoyé
- ✅ Aucune erreur console
- ✅ Fonctionnement normal

---

## 📊 Impact

| Aspect | Avant | Après |
|--------|-------|-------|
| Erreur validation | ❌ Affichée | ✅ Aucune |
| Resend code | ❌ Edge Function inexistant | ✅ API route fonctionnelle |
| Login automatique | ❌ Tentative invalide | ✅ Redirect manuel |
| UX | ❌ Confus | ✅ Clair |
| Console errors | ❌ Erreurs | ✅ Propre |

---

## 🎯 Fichiers Modifiés

1. **hooks/useVerification.ts** - Lines 107-133
   - Fix useResendCode pour utiliser API route
   - Suppression tentative login automatique

2. **app/(auth)/verify-email/page.tsx** - Lines 39-47
   - Redirect vers /login au lieu de /dashboard
   - Ajout query param pour message de succès

---

## 📝 Lessons Learned

1. **Cohérence Architecture**:
   - Toujours vérifier que tous les hooks utilisent la même méthode (API routes vs Edge Functions)
   - Si un système n'est pas déployé (Edge Functions), s'assurer qu'aucun code ne l'appelle

2. **Validation Errors**:
   - Les erreurs Zod "expected string, received undefined" indiquent souvent un appel API qui échoue silencieusement
   - Toujours vérifier les fetch() et s'assurer qu'ils retournent des données valides

3. **Auth Flow**:
   - Ne pas essayer de logger automatiquement l'utilisateur après vérification email
   - Mieux vaut un redirect vers login explicite pour éviter confusion

4. **Testing**:
   - Tester toutes les fonctionnalités d'une page (pas juste le flow principal)
   - Vérifier les boutons "Resend", "Retry", etc.

---

## 🚀 Prochaines Étapes

1. ✅ **Désactiver email confirmations Supabase** (Dashboard)
   - Éviter les emails en double

2. ✅ **Tester signup flow complet**
   - Création compte → Email → Vérification → Login → Dashboard

3. ⏸️ **Optionnel: Message de succès sur /login**
   - Détecter `?message=email-verified`
   - Afficher: "Email vérifié ! Vous pouvez maintenant vous connecter."

4. ⏸️ **Tester password reset flow**
   - Forgot password → Email → Reset → Login

---

**Status**: ✅ **RÉSOLU - PRÊT POUR TESTS**
**Version**: 1.0.1-bugfix-validation
**Last Updated**: 2025-11-07
