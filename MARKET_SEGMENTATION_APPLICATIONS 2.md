# Market Segmentation - Contractor Applications Integration

## ✅ Implémentation Complète

La segmentation de marché est maintenant **intégrée au flux de candidature** des prestataires.

## 🔄 Flux Complet

```
┌─────────────────────────────┐
│ Candidature Publique        │
│ /rejoindre-simone           │
│ ✅ market_id = 1 (défaut)   │
└─────────────────────────────┘
              ↓
┌─────────────────────────────┐
│ contractor_applications     │
│ ✅ market_id: NOT NULL      │
│ ✅ Default: France (id=1)   │
│ ✅ Index: market + status   │
└─────────────────────────────┘
              ↓ (approbation admin)
┌─────────────────────────────┐
│ Edge Function Approval      │
│ ✅ Transfère market_id      │
└─────────────────────────────┘
              ↓
┌─────────────────────────────┐
│ contractors                 │
│ ✅ market_id hérité         │
│ ✅ contractor_code généré   │
└─────────────────────────────┘
```

## 📊 Changements Base de Données

### Migration 20250112000270_add_market_to_applications.sql

```sql
-- Ajout de la colonne
ALTER TABLE contractor_applications
ADD COLUMN market_id BIGINT REFERENCES markets(id);

-- Index de performance
CREATE INDEX idx_contractor_applications_market
ON contractor_applications(market_id, status, submitted_at DESC);

-- Backfill des données existantes (5 applications → France)
UPDATE contractor_applications SET market_id = 1 WHERE market_id IS NULL;

-- Contrainte NOT NULL
ALTER TABLE contractor_applications ALTER COLUMN market_id SET NOT NULL;

-- Valeur par défaut
ALTER TABLE contractor_applications ALTER COLUMN market_id SET DEFAULT 1;
```

**Résultat :**
- ✅ 5 applications existantes migrées vers marché France
- ✅ Toutes les nouvelles applications ont market_id = 1 par défaut
- ✅ Impossible de créer une application sans marché

## 💻 Changements Code

### 1. Type TypeScript (types/contractor.ts)

```typescript
export interface ContractorApplication {
  id: number
  market_id: number // ✅ Nouveau champ obligatoire
  // ... autres champs
}
```

### 2. Edge Function (supabase/functions/approve-contractor-application/index.ts)

```typescript
// AVANT
.insert({
  id: authUser.user.id,
  slug_changes_count: 0,
})

// APRÈS
.insert({
  id: authUser.user.id,
  market_id: application.market_id, // ✅ Transfert du marché
  slug_changes_count: 0,
})
```

## 🎯 Fonctionnalités Activées

### Pour les Admins

1. **Filtrage par marché**
   - Les candidatures peuvent être filtrées par market_id
   - Utile quand plusieurs marchés sont actifs (FR, BE, CH, etc.)

2. **Traçabilité complète**
   ```sql
   -- Voir toutes les candidatures pour un marché
   SELECT * FROM contractor_applications WHERE market_id = 1;

   -- Statistiques par marché
   SELECT m.name, COUNT(ca.id) as applications
   FROM markets m
   LEFT JOIN contractor_applications ca ON m.id = ca.market_id
   GROUP BY m.id, m.name;
   ```

3. **Approbation automatique**
   - Le market_id est transféré automatiquement lors de l'approbation
   - Pas besoin de sélection manuelle du marché

### Pour le Système

1. **Cohérence des données**
   - Chaque application est liée à UN seul marché
   - Chaque contractor approuvé hérite du marché de sa candidature

2. **Préparation pour l'expansion**
   - Infrastructure prête pour BE, CH, ES, etc.
   - Formulaire peut être adapté pour détecter le pays/marché

3. **Performance**
   - Index optimisé : `(market_id, status, submitted_at DESC)`
   - Requêtes rapides par marché et statut

## 🚀 Prochaines Étapes (Optionnel)

### Phase 1: Détection Automatique du Marché

```typescript
// Dans le formulaire de candidature
const detectMarket = async (ipAddress: string) => {
  // Géolocalisation IP → pays → market_id
  const country = await getCountryFromIP(ipAddress);
  const market = await getMarketByCountry(country);
  return market.id;
};
```

### Phase 2: Sélecteur de Marché

```tsx
// Ajouter au formulaire si besoin
<select name="market_id">
  <option value="1">France</option>
  <option value="2">Belgique</option>
  <option value="3">Suisse</option>
</select>
```

### Phase 3: Validation Étendue

```typescript
// Vérifier que le marché est actif
const validateMarket = async (market_id: number) => {
  const market = await getMarket(market_id);
  if (!market.is_active) {
    throw new Error('Ce marché n\'accepte pas de nouvelles candidatures');
  }
};
```

## 📋 État Actuel

| Composant | Status | Notes |
|-----------|--------|-------|
| Migration DB | ✅ Appliquée | 5 applications → France |
| Type TypeScript | ✅ Mis à jour | market_id: number |
| Edge Function | 🔄 En cours de déploiement | Transfère market_id |
| Formulaire Public | ⏸️ Non modifié | Utilise défaut (France) |
| Interface Admin | ✅ Prêt | Peut filtrer par market_id |

## ✅ Tests de Validation

### 1. Vérifier l'assignation par défaut
```sql
-- Créer une candidature sans spécifier market_id
INSERT INTO contractor_applications (first_name, last_name, email, phone, ...)
VALUES ('Test', 'User', 'test@example.com', '0123456789', ...);

-- Vérifier que market_id = 1
SELECT market_id FROM contractor_applications WHERE email = 'test@example.com';
-- Attendu: market_id = 1
```

### 2. Tester l'approbation
```typescript
// Approuver une candidature
await approveApplication(applicationId);

// Vérifier que le contractor a le même market_id
const application = await getApplication(applicationId);
const contractor = await getContractor(application.created_contractor_id);

assert(contractor.market_id === application.market_id);
```

### 3. Vérifier le filtrage admin
```typescript
// Filtrer les candidatures par marché
const franceApplications = await getApplications({ market_id: 1 });
// Toutes doivent avoir market_id = 1
```

## 🎉 Bénéfices

1. **Scalabilité** : Prêt pour l'expansion internationale
2. **Cohérence** : Aucun contractor sans marché assigné
3. **Traçabilité** : Toute candidature liée à un marché précis
4. **Performance** : Index optimisé pour requêtes par marché
5. **Simplicité** : Valeur par défaut (France) évite erreurs

---

**Commit:** 21dff1b
**Date:** 2025-01-12
**Feature:** 018-international-market-segmentation
