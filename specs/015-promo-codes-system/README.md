# Spec 015: Système de Codes Promotionnels

**Status**: ✅ Backend Implémenté | 🚧 Frontend En Attente
**Created**: 2025-11-07
**Last Updated**: 2025-11-07

## Vue d'Ensemble

Système de codes promotionnels permettant aux administrateurs de créer des campagnes marketing avec codes de réduction. La règle fondamentale est que **la plateforme absorbe 100% du coût des réductions** et **les prestataires reçoivent leur commission complète calculée sur le prix original** (avant réduction).

## Principe Fondamental

```
Commission Prestataire = (Prix Original × Taux) - Frais
                       ≠ (Prix Réduit × Taux)
```

**Exemple concret**:
- Service: 100€
- Code promo: -20€ (20%)
- Client paie: 80€
- **Prestataire reçoit**: Commission sur 100€ (pas 80€)
- **Plateforme absorbe**: 20€

## Documents

### Spec SpecKit Officielle
**[spec.md](./spec.md)** - Spécification complète suivant le template SpecKit avec:
- 5 user stories prioritisées (P1 à P3)
- 34 functional requirements (FR-001 à FR-034)
- 10 success criteria mesurables
- 5 technical constraints
- Dépendances upstream/downstream
- Implementation status (Phase 1 ✅, Phase 2 🚧)

### Documentation Technique Complète

| Document | Description | Audience |
|----------|-------------|----------|
| **[docs/PROMO_CODES_SYSTEM.md](../../docs/PROMO_CODES_SYSTEM.md)** | Guide technique: DB schema, SQL functions, views, triggers, tests, integration guide | Développeurs Backend/Frontend |
| **[docs/PROMO_CODES_SPECIFICATIONS.md](../../docs/PROMO_CODES_SPECIFICATIONS.md)** | Spécifications exhaustives (12 sections): règles métier, impacts systèmes, UI mockups, analytics, sécurité, roadmap | Product Owners, Équipe Métier |
| **[docs/PROMO_CODES_COMPLETE.md](../../docs/PROMO_CODES_COMPLETE.md)** | Résumé exécutif: checklist progression, roadmap Phase 2, métriques succès, quick start | Tous |

## Implementation Status

### ✅ Phase 1: Backend (COMPLETE)

**Migration**: `supabase/migrations/20250107130000_add_promo_codes_system.sql`

**Ce qui a été fait**:
- 2 tables créées: `promo_codes`, `promo_code_usage`
- 1 table étendue: `appointment_bookings` (+3 colonnes)
- 1 fonction de validation: `validate_promo_code()` (logique complète)
- 2 vues financières mises à jour: `contractor_financial_summary`, `contractor_transaction_details`
- 2 triggers: `trg_promo_usage_on_booking`, `trg_promo_usage_on_cancel`
- 3 codes de test: BIENVENUE20, SIMONE10, NOEL2024
- Tests de validation: ✅ Tous scénarios passés

### 🚧 Phase 2: Frontend (TODO)

**Estimation**: 29-39 heures sur 4 sprints

#### Sprint 1 (1 semaine) - Checkout Client
- Champ code promo avec validation temps réel
- Affichage prix original barré vs réduit
- Messages d'erreur explicites
- **Temps**: 6h

#### Sprint 2 (1 semaine) - Admin Gestion
- Formulaire création/édition code promo
- Liste paginée avec filtres
- Toggle actif/inactif
- **Temps**: 16h

#### Sprint 3 (1 semaine) - Admin Analytics + Prestataire
- Dashboard analytics (KPIs, top codes, graphiques)
- Export CSV
- Dashboard prestataire (transparence)
- **Temps**: 12h

#### Sprint 4 (3 jours) - Edge Functions + Sécurité
- Mise à jour `create-payment-intent` (Stripe)
- Rate limiting, captcha, anti-fraude
- Tests E2E
- **Temps**: 8h

## User Stories (Prioritized)

### P1 - MVP Absolu

1. **Client utilise code de bienvenue**: Nouveaux clients peuvent appliquer un code promo de 20% lors de leur première réservation
2. **Admin crée campagne**: L'équipe marketing peut créer des codes promo avec toutes les restrictions (période, limites, services)
3. **Prestataire voit transparence**: Les prestataires comprennent que leur commission est calculée sur le prix original

### P2 - Important

4. **Admin analyse ROI**: L'équipe marketing peut mesurer la performance des campagnes (utilisations, coût, CA, ROI)

### P3 - Nice to Have

5. **Client reçoit erreurs claires**: Messages explicites quand un code est invalide (expiré, épuisé, etc.)

## Règles Métier Critiques

### R1: Commission Prestataire (INVIOLABLE)
```
Commission = (Prix Original × Taux) - Frais
```
**Vérification**: Toutes vues SQL et calculs frontend

### R2: Coût Plateforme
```
Coût Marketing = Montant Réduction
```

### R3: Un Seul Code par Réservation
Pas de cumul de codes promo

### R4: Incrémentation Uses Count
- ON INSERT booking → `uses_count++`
- ON CANCEL booking → `uses_count--`

### R5: Validation Stricte
Ordre: Code existe → Période valide → Limites OK → Utilisateur éligible → Service éligible → Montant minimum OK

## Types de Codes Supportés

| Type | Exemple | Calcul |
|------|---------|--------|
| **Pourcentage** | 20% de réduction | `service_amount × 0.20` |
| **Montant Fixe** | 10€ de réduction | `10.00` |
| **Pourcentage Plafonné** | 30% max 50€ | `MIN(service_amount × 0.30, 50.00)` |

## Restrictions Disponibles

- **Temporelles**: `valid_from`, `valid_until`
- **Utilisation**: `max_uses` (global), `max_uses_per_user`
- **Commerciales**: `min_order_amount`, `first_booking_only`
- **Services**: `specific_services[]`, `specific_categories[]`

## Database Schema Overview

```sql
-- Table principale
CREATE TABLE promo_codes (
  id BIGINT PRIMARY KEY,
  code VARCHAR(50) UNIQUE NOT NULL,
  discount_type VARCHAR(20), -- 'percentage' | 'fixed_amount'
  discount_value DECIMAL(10, 2),
  max_discount_amount DECIMAL(10, 2),
  max_uses INT,
  uses_count INT DEFAULT 0,
  max_uses_per_user INT DEFAULT 1,
  valid_from TIMESTAMP,
  valid_until TIMESTAMP,
  -- ... autres colonnes
);

-- Table de traçabilité
CREATE TABLE promo_code_usage (
  id BIGINT PRIMARY KEY,
  promo_code_id BIGINT REFERENCES promo_codes(id),
  booking_id BIGINT REFERENCES appointment_bookings(id),
  user_id UUID,
  original_amount DECIMAL(10, 2),
  discount_amount DECIMAL(10, 2),
  final_amount DECIMAL(10, 2),
  used_at TIMESTAMP
);

-- Extension booking
ALTER TABLE appointment_bookings ADD COLUMN
  service_amount_original DECIMAL(10, 2),
  promo_code_id BIGINT REFERENCES promo_codes(id),
  promo_discount_amount DECIMAL(10, 2);
```

## API Key Function

```typescript
// Validation RPC
const { data } = await supabase.rpc('validate_promo_code', {
  p_code: 'BIENVENUE20',
  p_user_id: userId,
  p_service_id: serviceId,
  p_service_amount: 100.00
});

// Returns:
// {
//   is_valid: true,
//   promo_id: 1,
//   discount_amount: 20.00,
//   final_amount: 80.00,
//   error_message: null
// }
```

## Success Metrics

**À 1 mois**:
- 15% réservations avec code promo
- Taux conversion >25%
- 0 erreur calcul commission

**À 3 mois**:
- 20% réservations avec code promo
- ROI >400%
- 30% rétention clients promo

**À 6 mois**:
- 25% réservations avec code promo
- ROI >500%
- 40% rétention clients promo

## Dependencies

### Upstream (Required)
- Spec 007: Interface Prestataire (dashboard)
- Spec 003: Booking Flow (checkout)
- Spec 004: Stripe Payment (PaymentIntent)
- Spec 005: Admin Backoffice (gestion codes)

### Downstream (Will use)
- Spec 011: Gift Cards (cumul ?)
- Spec 012: B2B Features (codes entreprises)
- Email Marketing System

## Quick Start Developers

### 1. Lire la doc (ordre recommandé)
1. Ce README (vue d'ensemble)
2. [spec.md](./spec.md) (spec SpecKit complète)
3. [docs/PROMO_CODES_SYSTEM.md](../../docs/PROMO_CODES_SYSTEM.md) (guide technique)

### 2. Tester en local
```bash
# Vérifier tables
supabase db pull

# Tester fonction
psql -c "SELECT * FROM validate_promo_code('BIENVENUE20', 'user-uuid'::UUID, 1, 100.00);"
```

### 3. Commencer par le checkout
**Fichier**: `app/booking/checkout/page.tsx`

```typescript
const [promoCode, setPromoCode] = useState('');
const [promoData, setPromoData] = useState(null);

const handleApplyPromo = async () => {
  const { data } = await supabase.rpc('validate_promo_code', {
    p_code: promoCode,
    p_user_id: userId,
    p_service_id: serviceId,
    p_service_amount: serviceAmount
  });

  if (data[0].is_valid) {
    setPromoData(data[0]);
  } else {
    setError(data[0].error_message);
  }
};
```

## Testing

### Codes de Test Disponibles

| Code | Type | Valeur | Restriction |
|------|------|--------|-------------|
| **BIENVENUE20** | percentage | 20% | first_booking_only |
| **SIMONE10** | fixed_amount | 10€ | max 1000 uses |
| **NOEL2024** | percentage | 30% max 50€ | max 500 uses |

### Scénarios de Test

1. **Validation réussie**: Code BIENVENUE20 sur 100€ → 80€
2. **Code expiré**: Tenter code avec `valid_until` passée
3. **Code épuisé**: Tenter code avec `uses_count >= max_uses`
4. **Déjà utilisé**: Client tente 2× même code
5. **Montant minimum**: Code avec `min_order_amount=50€` sur panier 40€
6. **Service non éligible**: Code restreint aux massages sur un soin visage

## Support

- **Questions techniques**: Voir [PROMO_CODES_SYSTEM.md](../../docs/PROMO_CODES_SYSTEM.md)
- **Questions métier**: Voir [PROMO_CODES_SPECIFICATIONS.md](../../docs/PROMO_CODES_SPECIFICATIONS.md)
- **Vue d'ensemble**: Voir [PROMO_CODES_COMPLETE.md](../../docs/PROMO_CODES_COMPLETE.md)

---

**Version**: 1.0
**Last Updated**: 2025-11-07
**Status**: ✅ Backend Production Ready | 🚧 Frontend Sprint Planning Required
