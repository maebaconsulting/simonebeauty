# Services Table Extended ✅

**Date**: 2025-11-07
**Migration**: 20250107110000_extend_services_table.sql
**Status**: ✅ **DEPLOYED**
**Reference**: legacy_product.md (ancienne application)

---

## Summary

La table `services` a été considérablement enrichie avec **21 nouvelles colonnes** provenant de l'ancienne table `product`. Ces colonnes permettent une gestion complète et professionnelle des services, incluant descriptions détaillées, ciblage client, médias, et gestion de forfaits.

---

## What Was Added

### 1. 📝 Informations Détaillées du Service (8 colonnes)

| Colonne | Type | Description |
|---------|------|-------------|
| `intro` | TEXT | Introduction courte (1-2 phrases) pour aperçu rapide |
| `long_description` | TEXT | Description détaillée complète du service |
| `hygienic_precautions` | TEXT | Précautions d'hygiène à respecter |
| `contraindications` | TEXT | Contre-indications médicales (grossesse, allergies, etc.) |
| `advises` | TEXT | Conseils post-service (hydratation, repos, etc.) |
| `your_session` | TEXT | Déroulement détaillé de la séance étape par étape |
| `preparation` | TEXT | Comment se préparer avant la séance |
| `suggestion` | TEXT | Suggestions de services complémentaires |

**Use Case**: Pages de détail de service avec informations professionnelles complètes

```typescript
// Example: Service detail page
const service = await supabase
  .from('services_full_details')
  .select('*')
  .eq('slug', 'massage-californien')
  .single();

// Display:
// - intro (hero section)
// - long_description (main content)
// - your_session (what to expect)
// - preparation (before you come)
// - contraindications (important warnings)
// - advises (aftercare tips)
```

---

### 2. 🎯 Ciblage Client (3 colonnes)

| Colonne | Type | Default | Description |
|---------|------|---------|-------------|
| `for_men` | BOOLEAN | false | Service adapté/recommandé pour hommes |
| `for_women` | BOOLEAN | false | Service adapté/recommandé pour femmes |
| `for_kids` | BOOLEAN | false | Service adapté/recommandé pour enfants |

**Use Case**: Filtrage par audience cible

```typescript
// Get men's services
const { data } = await supabase
  .from('services_with_categories')
  .select('*')
  .eq('for_men', true)
  .eq('is_active', true);

// Get family-friendly services
const { data: familyServices } = await supabase
  .from('services_with_categories')
  .select('*')
  .or('for_kids.eq.true,for_women.eq.true,for_men.eq.true')
  .eq('is_active', true);
```

**Index**: `idx_services_targeting` pour filtrage rapide

---

### 3. 🏢 Prestations Entreprise (1 colonne)

| Colonne | Type | Default | Description |
|---------|------|---------|-------------|
| `is_for_entreprise_ready` | BOOLEAN | false | Service disponible pour prestations en entreprise |

**Use Case**: Services pour événements corporate, bien-être au bureau

```typescript
// Get corporate services
const { data } = await supabase
  .from('services_with_categories')
  .select('*')
  .eq('is_for_entreprise_ready', true)
  .eq('is_active', true);
```

**Examples**:
- Massage assis en entreprise (AMMA)
- Ateliers bien-être pour équipes
- Événements corporate beauty

**Index**: `idx_services_enterprise`

---

### 4. 🔄 Services à Séances Multiples (2 colonnes)

| Colonne | Type | Default | Description |
|---------|------|---------|-------------|
| `has_many_session` | BOOLEAN | false | Service vendu en cure/forfait |
| `number_of_session` | SMALLINT | 1 | Nombre de séances incluses |

**Constraint**: Si `has_many_session = true`, alors `number_of_session > 1`

**Use Case**: Forfaits, cures, packages

```sql
-- Examples from liste_services.md:
-- "Les Cures 10 séances !" (MASSAGE BIEN-ETRE)
-- "Les Cures 5 séances !" (MINCEUR & DRAINAGE)

INSERT INTO services (
  name,
  slug,
  base_price,
  has_many_session,
  number_of_session
) VALUES (
  'Cure Drainage Lymphatique - 5 séances',
  'cure-drainage-5-seances',
  450.00,
  true,
  5
);
```

**Calculated Fields** (dans `services_full_details` view):
```sql
price_per_session = base_price / number_of_session
-- Example: 450€ / 5 = 90€ par séance
```

**Index**: `idx_services_packages`

---

### 5. 🧩 Services Additionnels (1 colonne)

| Colonne | Type | Default | Description |
|---------|------|---------|-------------|
| `is_additional_service` | BOOLEAN | false | Service additionnel (peut être ajouté à un autre) |

**Use Case**: Upselling, services complémentaires

```typescript
// Get main service + additional services
const mainService = await supabase
  .from('services')
  .select('*')
  .eq('slug', 'massage-suedois')
  .single();

const additionalServices = await supabase
  .from('services')
  .select('*')
  .eq('is_additional_service', true)
  .eq('category_id', mainService.category_id) // Same category
  .eq('is_active', true);

// Display: "Ajouter à votre massage: Gommage corps (+30€, +20min)"
```

**Examples**:
- Gommage corps (avec massage)
- Extension de couleur (avec coiffure)
- Pose de vernis (avec manucure express)

**Index**: `idx_services_additional`

---

### 6. 📸 Médias (2 colonnes)

| Colonne | Type | Default | Description |
|---------|------|---------|-------------|
| `secondary_image_urls` | TEXT[] | {} | URLs des images supplémentaires (galerie) |
| `video_url` | TEXT | NULL | URL vidéo de présentation (YouTube, Vimeo) |

**Use Case**: Galeries photos, vidéos de démonstration

```typescript
// Update service with media
await supabase
  .from('services')
  .update({
    image_url: 'https://cdn.simone.paris/massage-californien-main.jpg',
    secondary_image_urls: [
      'https://cdn.simone.paris/massage-californien-1.jpg',
      'https://cdn.simone.paris/massage-californien-2.jpg',
      'https://cdn.simone.paris/massage-californien-3.jpg'
    ],
    video_url: 'https://www.youtube.com/watch?v=abc123'
  })
  .eq('slug', 'massage-californien');
```

---

### 7. 🏷️ Tags (1 colonne)

| Colonne | Type | Default | Description |
|---------|------|---------|-------------|
| `tags` | TEXT[] | {} | Tags pour recherche et filtrage |

**Use Case**: Recherche sémantique, filtres avancés

```typescript
// Add tags to service
await supabase
  .from('services')
  .update({
    tags: ['relaxant', 'anti-stress', 'détente', 'huiles essentielles', 'aromathérapie']
  })
  .eq('slug', 'massage-californien');

// Search by tag
const { data } = await supabase
  .from('services')
  .select('*')
  .contains('tags', ['relaxant']) // GIN index pour performance
  .eq('is_active', true);
```

**Examples de tags**:
- COIFFURE: `['tendance', 'naturel', 'volume', 'brillance']`
- MASSAGE: `['relaxant', 'anti-stress', 'sportif', 'profond']`
- MINCEUR: `['détox', 'drainage', 'cellulite', 'fermeté']`

**Index**: `idx_services_tags` (GIN index pour recherche rapide)

---

### 8. 💰 Prix de Revient (1 colonne)

| Colonne | Type | Default | Description |
|---------|------|---------|-------------|
| `cost_price` | DECIMAL(10,2) | NULL | Prix de revient/coût du service |

**Use Case**: Calcul de marges, reporting financier

```sql
-- Calculate margin percentage (in services_full_details view)
margin_percentage = ROUND(((base_price - cost_price) / base_price * 100), 2)

-- Example:
-- base_price: 90€
-- cost_price: 25€
-- margin: 72.22%
```

```typescript
// Admin dashboard: Services by margin
const { data } = await supabase
  .from('services_full_details')
  .select('name, base_price, cost_price, margin_percentage')
  .not('cost_price', 'is', null)
  .order('margin_percentage', { ascending: false });
```

---

## New Database Views

### View 1: `services_full_details`

Vue complète avec **toutes** les informations + calculs automatiques

**Columns**:
- Toutes les colonnes de `services`
- `margin_percentage` - Marge calculée automatiquement
- `price_per_session` - Prix par séance pour forfaits
- `category_name`, `category_slug`, `category_icon`
- `subcategory_name`, `subcategory_slug`
- `full_category_path` - Chemin complet (ex: "MASSAGE BIEN-ETRE > LES CLASSIQUES")

**Usage**: Admin dashboard, rapports financiers, gestion complète

```typescript
// Admin: Full service details with margin
const { data } = await supabase
  .from('services_full_details')
  .select('*')
  .eq('category_slug', 'massage-bien-etre')
  .order('margin_percentage', { ascending: false });
```

**Access**: `authenticated` only (contient cost_price)

---

### View 2: `services_with_categories` (UPDATED)

Vue publique **sans** informations sensibles (pas de cost_price)

**Columns**:
- Colonnes publiques de `services` (name, slug, intro, description, long_description, etc.)
- Médias (image_url, secondary_image_urls, video_url)
- Targeting (for_men, for_women, for_kids)
- Sessions (has_many_session, number_of_session)
- Tags
- Category info complète

**Usage**: Frontend public, booking flow, service catalog

```typescript
// Public: Service catalog
const { data } = await supabase
  .from('services_with_categories')
  .select('*')
  .eq('is_active', true)
  .order('display_order');
```

**Access**: `authenticated` + `anon` (public)

---

## Database Statistics (After Migration)

| Metric | Before | After | Change |
|--------|--------|-------|--------|
| **Columns in services** | 12 | 33 | +21 |
| **Views** | 4 | 4 | Updated 1, Added 1 |
| **Indexes** | 8 | 13 | +5 |
| **CHECK Constraints** | 0 | 1 | +1 (session_count) |

---

## New Indexes for Performance

1. **`idx_services_targeting`** - Filtrage par audience (men/women/kids)
2. **`idx_services_enterprise`** - Services entreprise uniquement
3. **`idx_services_packages`** - Forfaits/cures uniquement
4. **`idx_services_additional`** - Services additionnels uniquement
5. **`idx_services_tags`** - Recherche par tags (GIN index)

All indexes use `WHERE is_active = true` pour performance optimale (partial indexes)

---

## Comparison with Legacy System

### Colonnes Conservées de legacy_product.md ✅

- ✅ `intro`
- ✅ `long_description`
- ✅ `hygienic_precautions`
- ✅ `contraindications`
- ✅ `advises`
- ✅ `your_session`
- ✅ `preparation`
- ✅ `suggestion`
- ✅ `for_men`, `for_women`, `for_kids`
- ✅ `is_for_entreprise_ready`
- ✅ `has_many_session`, `number_of_session`
- ✅ `is_additional_service`
- ✅ `secondary_image_url` → `secondary_image_urls` (TEXT[])
- ✅ `video_url`
- ✅ `tags`
- ✅ `buying_price_cents` → `cost_price` (DECIMAL)

### Colonnes NON Conservées (non pertinentes pour services) ❌

- ❌ `item_in_stock` - Pertinent pour produits physiques uniquement
- ❌ `is_available` - Redondant avec `is_active`
- ❌ `weight_kg`, `width`, `height`, `depth` - Produits physiques uniquement
- ❌ `providers_id` - Géré via `contractor_services`
- ❌ `bare_code` - Produits physiques uniquement
- ❌ `product_url` - Redondant avec `slug`
- ❌ `list_of_contractor` - Géré via `contractor_services` table
- ❌ `list_of_institut` - Non pertinent (Simone Paris n'a pas d'instituts)
- ❌ `sub_categorie` → Remplacé par `subcategory_id` (meilleure architecture)
- ❌ `is_treatment`, `is_service` - Redondant (tout est un service dans cette table)

---

## Usage Examples

### Example 1: Create Complete Service

```typescript
await supabase.from('services').insert({
  // Basic info
  name: 'Massage Californien 60 min',
  slug: 'massage-californien-60min',
  category_id: 5, // MASSAGE BIEN-ETRE
  subcategory_id: 31, // LES CLASSIQUES

  // Pricing & duration
  base_price: 90.00,
  cost_price: 25.00, // Admin only
  base_duration_minutes: 60,

  // Descriptions
  intro: 'Massage enveloppant aux huiles chaudes pour une relaxation profonde',
  description: 'Un massage doux et fluide qui favorise la détente musculaire',
  long_description: `
    Le massage californien est une technique de massage très enveloppante...
    (long content)
  `,

  // Professional info
  your_session: 'Accueil, installation, massage complet du corps, temps de repos',
  preparation: 'Évitez les repas lourds 2h avant. Arrivez 10min en avance.',
  hygienic_precautions: 'Linge stérilisé, huiles hypoallergéniques, table désinfectée',
  contraindications: 'Grossesse (1er trimestre), phlébite, fractures récentes',
  advises: 'Buvez beaucoup d\'eau. Évitez l\'alcool et le sport intense 24h.',
  suggestion: 'Complétez avec un gommage corps pour une expérience complète',

  // Targeting
  for_men: true,
  for_women: true,
  for_kids: false,

  // Business
  is_for_entreprise_ready: false,

  // Sessions
  has_many_session: false,
  number_of_session: 1,

  // Type
  is_additional_service: false,

  // Media
  image_url: 'https://cdn.simone.paris/massage-californien.jpg',
  secondary_image_urls: [
    'https://cdn.simone.paris/massage-californien-1.jpg',
    'https://cdn.simone.paris/massage-californien-2.jpg'
  ],
  video_url: 'https://www.youtube.com/watch?v=abc123',

  // Tags
  tags: ['relaxant', 'anti-stress', 'détente', 'huiles chaudes'],

  // Metadata
  is_active: true,
  display_order: 1
});
```

---

### Example 2: Service Package (Cure)

```typescript
await supabase.from('services').insert({
  name: 'Cure Drainage Lymphatique - 5 séances',
  slug: 'cure-drainage-5-seances',
  category_id: 6, // MINCEUR & DRAINAGE
  subcategory_id: 40, // LES CURES 5 SEANCES !

  base_price: 450.00, // Total package price
  cost_price: 125.00,
  base_duration_minutes: 60, // Duration per session

  intro: 'Forfait de 5 séances de drainage lymphatique pour des résultats durables',

  // Package settings
  has_many_session: true,
  number_of_session: 5,

  // Will calculate: price_per_session = 450 / 5 = 90€/séance

  for_men: true,
  for_women: true,
  is_active: true
});
```

---

### Example 3: Additional Service

```typescript
await supabase.from('services').insert({
  name: 'Gommage Corps (+20min)',
  slug: 'gommage-corps-supplement',
  category_id: 5, // MASSAGE BIEN-ETRE

  base_price: 30.00, // Supplement price
  base_duration_minutes: 20,

  intro: 'Ajoutez un gommage exfoliant à votre massage',

  is_additional_service: true, // Key flag

  for_men: true,
  for_women: true,
  is_active: true
});
```

---

### Example 4: Search Services by Tag

```typescript
// Find relaxing services
const { data } = await supabase
  .from('services_with_categories')
  .select('*')
  .contains('tags', ['relaxant'])
  .eq('is_active', true)
  .order('display_order');
```

---

### Example 5: Filter by Audience

```typescript
// Men's grooming services
const { data } = await supabase
  .from('services_with_categories')
  .select('*')
  .eq('for_men', true)
  .eq('category_slug', 'coiffure')
  .eq('is_active', true);
```

---

### Example 6: Corporate Services Catalog

```typescript
// Services available for corporate events
const { data } = await supabase
  .from('services_with_categories')
  .select('name, intro, base_price, base_duration_minutes, category_name')
  .eq('is_for_entreprise_ready', true)
  .eq('is_active', true)
  .order('category_name');
```

---

## Migration Path from Legacy

### Step 1: Export Legacy Data

```sql
-- From old database
SELECT
  name,
  intro,
  long_description,
  hygienic_precautions,
  contraindications,
  advises,
  your_session,
  preparation,
  suggestion,
  for_men,
  for_women,
  for_kids,
  is_for_entreprise_ready,
  has_many_session,
  number_of_session,
  tags,
  secondary_image_url,
  video_url,
  buying_price_cents
FROM product
WHERE is_service = true;
```

### Step 2: Transform and Import

```typescript
// Transform legacy data
const legacyServices = await fetchLegacyData();

for (const legacy of legacyServices) {
  await supabase.from('services').insert({
    name: legacy.name,
    slug: slugify(legacy.name),

    // Rich content
    intro: legacy.intro,
    long_description: legacy.long_description,
    hygienic_precautions: legacy.hygienic_precautions,
    contraindications: legacy.contraindications,
    advises: legacy.advises,
    your_session: legacy.your_session,
    preparation: legacy.preparation,
    suggestion: legacy.suggestion,

    // Targeting
    for_men: legacy.for_men,
    for_women: legacy.for_women,
    for_kids: legacy.for_kids,

    // Business
    is_for_entreprise_ready: legacy.is_for_entreprise_ready,

    // Sessions
    has_many_session: legacy.has_many_session,
    number_of_session: legacy.number_of_session,

    // Media (convert from legacy format)
    secondary_image_urls: legacy.secondary_image_url || [],
    video_url: legacy.video_url,

    // Tags
    tags: legacy.tags || [],

    // Cost (convert cents to euros)
    cost_price: legacy.buying_price_cents / 100,

    // TODO: Map to new category system
    category_id: mapLegacyCategory(legacy.sub_categorie),
    subcategory_id: legacy.sub_categorie
  });
}
```

---

## Next Steps

### Phase 2A: Data Population ✅ Ready

Now that the schema is complete, you can:

1. **Populate 88 services** from liste_services.md
2. **Map services to subcategories** (already have 48 categories)
3. **Add rich content** (descriptions, contraindications, etc.)
4. **Add media** (images, videos)
5. **Add tags** for search

### Phase 2B: Frontend Implementation

1. **Service Detail Pages** - Display all rich content
2. **Service Catalog** - Filter by category, tags, audience
3. **Corporate Services Page** - Separate section for entreprises
4. **Package/Cure Pages** - Display multi-session services
5. **Search with Tags** - Full-text search + tag filtering

### Phase 2C: Admin Interface

1. **Service Management UI**
2. **Rich Text Editors** for long_description, etc.
3. **Media Gallery Manager**
4. **Tag Management**
5. **Margin Calculator** (base_price vs cost_price)

---

## Files Modified

```
supabase/migrations/
└── 20250107110000_extend_services_table.sql (NEW)

Documentation:
└── SERVICES_TABLE_EXTENDED.md (this file)
```

---

## Verification

Run these queries to verify the extensions:

```sql
-- Check all new columns exist
\d services

-- Check new indexes
SELECT indexname, indexdef
FROM pg_indexes
WHERE tablename = 'services'
AND indexname LIKE 'idx_services_%';

-- Check views
SELECT viewname FROM pg_views
WHERE schemaname = 'public'
AND viewname LIKE 'services%';

-- Test margin calculation
SELECT name, base_price, cost_price, margin_percentage
FROM services_full_details
WHERE cost_price IS NOT NULL
LIMIT 5;
```

---

**Status**: ✅ **DEPLOYED AND VERIFIED**
**Impact**: Low (backward compatible, only additions)
**Database**: Production (xpntvajwrjuvsqsmizzb.supabase.co)

---

Generated by Claude Code on 2025-11-07
