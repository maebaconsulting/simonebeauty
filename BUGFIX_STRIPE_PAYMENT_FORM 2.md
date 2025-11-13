# Correction du formulaire de paiement Stripe

**Date**: 2025-11-11
**Statut**: ✅ Corrigé
**Fichiers modifiés**:
- `components/booking/StripePaymentForm.tsx`
- `app/api/bookings/create/route.ts`
- `app/booking/confirmation/page.tsx`

---

## 🐛 Problèmes identifiés

### Erreurs constatées

```
❌ Unsupported prop change: options.clientSecret is not a mutable property
❌ Failed to load resource: 400 (Bad Request)
❌ Failed to load resource: 401 (Unauthorized)
❌ Unhandled payment Element loaderror
❌ PaymentElement not mounted after retries!
❌ Failed to process payment (lors de la création de réservation)
```

### Causes racines

1. **Bug critique #1** : Le composant `<Elements>` de Stripe ne peut pas changer sa prop `clientSecret` après avoir été monté
   - Quand l'utilisateur appliquait un code promo ou une carte cadeau, le `useEffect` créait un nouveau Payment Intent
   - Cela changeait le `clientSecret`, causant l'erreur Stripe
   - Le PaymentElement ne se montait jamais à cause de cette erreur

2. **Bug critique #2** : L'API `/api/bookings/create` tentait d'accéder à `paymentIntent.id` quand `paymentIntent` était `null`
   - Dans le cas "no-payment-required" (paiement entièrement couvert par promo/gift card), `paymentIntent` est `null`
   - Le code retournait `paymentIntent.id` sans vérifier, causant une erreur "Cannot read property 'id' of null"
   - Cela générait l'erreur "Failed to process payment" côté client

3. **Clés API Stripe invalides** : Les clés dans `.env.local` semblent tronquées
   - Clé publishable: `pk_test_xxxxx...` (trop courte)
   - Clé secrète: `sk_test_xxxxx...` (trop courte)
   - Cela causait les erreurs 401 (Unauthorized)

---

## ✅ Corrections apportées

### 1. Ajout d'une `key` prop au composant `<Elements>`

**Fichier** : `components/booking/StripePaymentForm.tsx` (ligne 580-594)

```typescript
// AVANT (❌ Bug)
<Elements stripe={stripePromise} options={elementsOptions}>
  <PaymentFormInner ... />
</Elements>

// APRÈS (✅ Corrigé)
<Elements
  key={clientSecret}  // ← Force le remontage quand clientSecret change
  stripe={stripePromise}
  options={elementsOptions}
>
  <PaymentFormInner ... />
</Elements>
```

**Impact** : Quand le `clientSecret` change (promo/gift card appliqué), React démonte et remonte complètement le composant `<Elements>` avec le nouveau secret, évitant l'erreur de mutation.

### 2. Ajout d'un listener d'erreurs PaymentElement

**Fichier** : `components/booking/StripePaymentForm.tsx` (ligne 83-104)

```typescript
// Listen for PaymentElement errors
useEffect(() => {
  if (!elements) return

  const paymentElement = elements.getElement('payment')
  if (!paymentElement) return

  const handleElementChange = (event: any) => {
    if (event.error) {
      console.error('[PaymentElement] Error:', event.error)
      setElementError(event.error.message)
    } else {
      setElementError(null)
    }
  }

  paymentElement.on('change', handleElementChange)

  return () => {
    paymentElement.off('change', handleElementChange)
  }
}, [elements])
```

**Impact** : Capture et affiche les erreurs du PaymentElement en temps réel pour un meilleur debugging.

### 3. Affichage des erreurs dans l'UI

**Fichier** : `components/booking/StripePaymentForm.tsx` (ligne 244-256)

```typescript
<CardContent className="space-y-4">
  <PaymentElement />
  {elementError && (
    <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
      <p className="text-sm text-red-800">
        <strong>Erreur:</strong> {elementError}
      </p>
      <p className="text-xs text-red-600 mt-1">
        Vérifiez votre connexion internet ou contactez le support.
      </p>
    </div>
  )}
</CardContent>
```

**Impact** : Les utilisateurs voient maintenant les erreurs Stripe au lieu d'un formulaire silencieusement cassé.

### 4. Message d'erreur amélioré

**Fichier** : `components/booking/StripePaymentForm.tsx` (ligne 160-166)

```typescript
if (!paymentElement) {
  console.error('[Payment] PaymentElement not mounted after retries!')
  console.error('[Payment] This usually indicates invalid Stripe API keys or network issues')
  setIsProcessing(false)
  onError('Le formulaire de paiement n\'a pas pu se charger. Cela peut indiquer un problème de configuration Stripe ou de connexion. Veuillez rafraîchir la page ou contacter le support.')
  return
}
```

**Impact** : Message plus clair indiquant la probable cause (clés API invalides).

### 5. Correction de l'erreur "Failed to process payment" 🆕

**Fichier** : `app/api/bookings/create/route.ts` (ligne 427-435)

```typescript
// AVANT (❌ Bug)
return NextResponse.json({
  success: true,
  booking_id: booking.id,
  payment_intent_id: paymentIntent.id,  // ← Erreur si paymentIntent est null
  payment_intent_client_secret: paymentIntent.client_secret,
  stripe_customer_id: stripeCustomer.id,
  message: 'Booking created successfully with payment pre-authorization',
}, { status: 201 });

// APRÈS (✅ Corrigé)
return NextResponse.json({
  success: true,
  booking: booking,
  booking_id: booking.id,
  payment_intent_id: paymentIntent?.id || null,  // ← Optional chaining
  payment_intent_client_secret: paymentIntent?.client_secret || null,
  stripe_customer_id: stripeCustomer.id,
  message: paymentIntent
    ? 'Booking created successfully with payment pre-authorization'
    : 'Booking created successfully - fully covered by promo/gift card',
}, { status: 201 });
```

**Impact** : Gère correctement le cas où le paiement est entièrement couvert par un code promo ou une carte cadeau (montant = 0€).

### 6. Robustesse de la page de confirmation 🆕

**Fichier** : `app/booking/confirmation/page.tsx` (ligne 131)

```typescript
// AVANT
setBookingId(data.booking?.id || null)

// APRÈS (✅ Plus robuste)
setBookingId(data.booking?.id || data.booking_id || null)
```

**Impact** : Fallback pour assurer la compatibilité avec différentes structures de réponse API.

---

## 🔧 Action requise : Vérifier les clés Stripe

Les clés Stripe dans votre `.env.local` semblent incomplètes. Veuillez les vérifier :

### Obtenir vos vraies clés Stripe (mode test)

1. Allez sur [Stripe Dashboard](https://dashboard.stripe.com/test/apikeys)
2. Connectez-vous à votre compte
3. Dans **Developers → API keys**, copiez :
   - **Publishable key** (commence par `pk_test_51...` - environ 107 caractères)
   - **Secret key** (commence par `sk_test_51...` - environ 107 caractères)

### Remplacez dans `.env.local`

```bash
# Dans .env.local (lignes 23-24)
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_51XxXxXxXxXxXxXxXxXxXxXxXxXxXxXxXxXx...
STRIPE_SECRET_KEY=sk_test_51XxXxXxXxXxXxXxXxXxXxXxXxXxXxXxXxXx...
```

### Redémarrez le serveur

```bash
# Arrêtez le serveur (Ctrl+C)
pnpm dev
```

---

## 🧪 Tests à effectuer

### 1. Test de base (sans promo/gift card)

```
✓ Aller sur /booking/services
✓ Sélectionner un service
✓ Choisir une adresse
✓ Choisir un créneau horaire
✓ Page de confirmation : cliquer "Continuer vers le paiement"
✓ Vérifier que le PaymentElement se charge correctement
✓ Remplir les informations de carte test : 4242 4242 4242 4242
✓ Date d'expiration future, CVC 123
✓ Cliquer "Payer XX.XX €"
✓ Vérifier que le paiement réussit
✓ Vérifier la redirection vers /client/bookings
```

### 2. Test avec code promo

```
✓ Répéter le test de base jusqu'à la page de paiement
✓ Entrer un code promo valide dans le champ "Code promo"
✓ Cliquer "Appliquer"
✓ Vérifier que le montant se met à jour
✓ Vérifier que le PaymentElement se remonte correctement (pas d'erreur)
✓ Remplir les informations de carte
✓ Vérifier que le paiement réussit avec le montant réduit
```

### 3. Test avec carte cadeau

```
✓ Répéter le test de base jusqu'à la page de paiement
✓ Entrer un code carte cadeau valide
✓ Cliquer "Appliquer"
✓ Vérifier que le montant se met à jour
✓ Vérifier que le PaymentElement se remonte correctement
✓ Remplir les informations de carte
✓ Vérifier que le paiement réussit
```

### 4. Test paiement entièrement couvert

```
✓ Créer un code promo 100% ou une carte cadeau couvrant le montant total
✓ Appliquer le code/carte
✓ Vérifier que le message "Paiement entièrement couvert !" apparaît
✓ Vérifier que le PaymentElement disparaît (montant = 0€)
✓ Cliquer "Confirmer la réservation"
✓ Vérifier que la réservation se crée sans passer par Stripe
```

---

## 📋 Checklist de vérification

- [x] Bug `clientSecret` mutable corrigé avec `key` prop
- [x] Listener d'erreurs PaymentElement ajouté
- [x] Affichage des erreurs dans l'UI
- [x] Message d'erreur amélioré pour debugging
- [ ] **ACTION REQUISE** : Vérifier et remplacer les clés Stripe dans `.env.local`
- [ ] **ACTION REQUISE** : Redémarrer le serveur après modification
- [ ] **ACTION REQUISE** : Tester le flux de paiement complet

---

## 📝 Cartes de test Stripe

Pour tester les paiements, utilisez ces cartes de test :

| Carte | Numéro | Résultat |
|-------|--------|----------|
| Succès | `4242 4242 4242 4242` | Paiement réussit |
| Décliné | `4000 0000 0000 0002` | Carte déclinée |
| 3D Secure | `4000 0027 6000 3184` | Authentification 3DS requise |

- **Date d'expiration** : N'importe quelle date future (ex: 12/25)
- **CVC** : N'importe quel nombre à 3 chiffres (ex: 123)
- **Code postal** : N'importe quel code (ex: 75001)

---

## 🔍 Debugging

Si le problème persiste après avoir remplacé les clés :

1. **Vider le cache du navigateur** : Cmd+Shift+R (Mac) ou Ctrl+Shift+R (Windows)
2. **Vérifier la console** : Ouvrir DevTools → Console
3. **Vérifier les logs** :
   ```
   [Stripe] Loading Stripe with publishable key: pk_test_51...
   [Payment] Submit started
   [Payment] clientSecret: pi_xxx_secret_xxx
   [Payment] PaymentElement mounted: true
   ```
4. **Vérifier Network** : DevTools → Network → Filtrer "stripe" → Vérifier 200 OK

### Erreurs courantes

| Erreur | Cause | Solution |
|--------|-------|----------|
| 401 Unauthorized | Clés API invalides | Vérifier `.env.local`, redémarrer serveur |
| 400 Bad Request | clientSecret invalide | Vérifier que le Payment Intent se crée correctement |
| PaymentElement not mounted | Stripe.js bloqué | Vérifier connexion, désactiver bloqueurs de pub |

---

## 📚 Documentation

- [Stripe Elements Documentation](https://stripe.com/docs/stripe-js/react)
- [Payment Element Reference](https://stripe.com/docs/payments/payment-element)
- [Test Cards](https://stripe.com/docs/testing)
- [API Keys](https://stripe.com/docs/keys)

---

**Corrigé par** : Claude Code
**Version** : 1.0
**Dernière mise à jour** : 2025-11-11
