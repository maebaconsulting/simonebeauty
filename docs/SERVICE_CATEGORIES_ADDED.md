# Service Categories System Added

**Date**: 2025-11-07
**Migration**: 20250107100000_add_service_categories.sql
**Status**: ✅ **DEPLOYED**

---

## Summary

Added a hierarchical category system for services based on [liste_services.md](liste_services.md). The new system supports **categories** and **subcategories** with a flexible parent/child relationship.

---

## What Was Added

### 1. New Table: `service_categories`

Hierarchical table with parent/child relationships:

```sql
CREATE TABLE service_categories (
  id BIGINT PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
  parent_id BIGINT REFERENCES service_categories(id), -- NULL for main categories
  name VARCHAR(100) NOT NULL,
  slug VARCHAR(100) NOT NULL UNIQUE,
  icon VARCHAR(50), -- Emoji (💇, 💅, etc.)
  description TEXT,
  display_order INT DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);
```

**Features**:
- ✅ Self-referencing (parent_id → id) for hierarchy
- ✅ Unique slugs for URL routing
- ✅ Emoji icons for visual display
- ✅ Display order for sorting
- ✅ Active/inactive flag
- ✅ RLS enabled (public read, admin write)

### 2. Extended Table: `services`

Added two new columns:

```sql
ALTER TABLE services
  ADD COLUMN category_id BIGINT REFERENCES service_categories(id),
  ADD COLUMN subcategory_id BIGINT REFERENCES service_categories(id);
```

**Migration Strategy**:
- ✅ Old `category` column kept for backward compatibility (marked as DEPRECATED)
- ✅ CHECK constraint removed for flexibility
- ✅ Existing services mapped to new main categories

### 3. New View: `services_with_categories`

Helper view that joins services with full category information:

```sql
CREATE VIEW services_with_categories AS
SELECT
  s.*,
  cat.name AS category_name,
  cat.slug AS category_slug,
  cat.icon AS category_icon,
  subcat.name AS subcategory_name,
  subcat.slug AS subcategory_slug,
  CASE
    WHEN subcat.name IS NOT NULL THEN cat.name || ' > ' || subcat.name
    ELSE cat.name
  END AS full_category_path
FROM services s
LEFT JOIN service_categories cat ON s.category_id = cat.id
LEFT JOIN service_categories subcat ON s.subcategory_id = subcat.id;
```

**Usage**:
```sql
-- Get all services in COIFFURE category with subcategory details
SELECT * FROM services_with_categories
WHERE category_slug = 'coiffure';

-- Get services in LA COUPE subcategory
SELECT * FROM services_with_categories
WHERE subcategory_slug = 'coiffure-la-coupe';
```

---

## Seed Data

### 8 Main Categories (from liste_services.md)

| ID | Name | Slug | Icon | Services | Subcategories |
|----|------|------|------|----------|---------------|
| 1 | COIFFURE | coiffure | 💇 | 20 | 8 |
| 2 | BEAUTE DES ONGLES | beaute-des-ongles | 💅 | 16 | 6 |
| 3 | LE VISAGE | le-visage | 🌸 | 5 | 5 |
| 4 | LE REGARD | le-regard | 👁️ | 6 | 3 |
| 5 | MASSAGE BIEN-ETRE | massage-bien-etre | 💆 | 15 | 6 |
| 6 | MINCEUR & DRAINAGE | minceur-drainage | 🏃 | 13 | 6 |
| 7 | EPILATION | epilation | 🪒 | 10 | 5 |
| 8 | MAQUILLAGE | maquillage | 💄 | 3 | 1 |

**Total**: 88 services across 48 categories (8 main + 40 subcategories)

### 40 Subcategories

**COIFFURE** (8 subcategories):
- BALAYAGE
- BRUSHING
- COIFFAGES
- COULEUR
- ENTRETIEN DES CHEVEUX
- LA COUPE
- LISSAGE ET SOINS
- TECHNIQUES

**BEAUTE DES ONGLES** (6 subcategories):
- DELUXE RITUEL KURE BAZAAR
- FORFAIT MAINS / PIEDS
- LES MAINS
- LES PIEDS
- MANI EXPRESS
- PEDI EXPRESS

**LE VISAGE** (5 subcategories):
- 10 ANS DE MOINS
- BELLE PEAU
- CORPS & VISAGE
- DU GALBE !
- VISAGE TONIQUE

**LE REGARD** (3 subcategories):
- CILS DE BICHE
- LES COMBOS
- SOURCILS PARFAITS

**MASSAGE BIEN-ETRE** (6 subcategories):
- ADDICT (j'ai une table chez moi!)
- A PARTAGER ✌️ : LE AMMA ASSIS
- AU NIRVANA
- LES CLASSIQUES
- LES CURES 10 SEANCES !
- LES THEMATIQUES

**MINCEUR & DRAINAGE** (6 subcategories):
- FOCUS FERMETE
- LE DRAINAGE
- LE REMODELAGE
- LES CURES 5 SEANCES !
- MINCEUR
- UNE SEANCE SUR MESURE

**EPILATION** (5 subcategories):
- A LA CIRE
- FORFAIT DEMI-JAMBES
- FORFAIT JAMBES ENTIERES
- MAILLOT XL
- UNE ZONE

**MAQUILLAGE** (1 subcategory):
- MAQUILLAGE

---

## Database Statistics (After Migration)

| Metric | Count |
|--------|-------|
| **Total Categories** | 48 (8 main + 40 sub) |
| **Tables Modified** | 1 (services) |
| **Tables Added** | 1 (service_categories) |
| **Views Added** | 1 (services_with_categories) |
| **RLS Policies** | 2 (read public, write admin) |
| **Indexes** | 5 (parent, active, slug, category, subcategory) |

---

## Usage Examples

### Frontend: Display Categories Menu

```typescript
// Get all main categories with subcategory count
const categories = await supabase
  .from('service_categories')
  .select(`
    id,
    name,
    slug,
    icon,
    subcategories:service_categories!parent_id(count)
  `)
  .is('parent_id', null)
  .eq('is_active', true)
  .order('display_order');
```

### Frontend: Display Services by Category

```typescript
// Get services in a specific category with full details
const { data } = await supabase
  .from('services_with_categories')
  .select('*')
  .eq('category_slug', 'coiffure')
  .eq('is_active', true)
  .order('display_order');

// Result includes: category_name, category_icon, subcategory_name, full_category_path
```

### Backend: Create New Service with Category

```typescript
await supabase
  .from('services')
  .insert({
    name: 'Coupe Femme + Brush',
    slug: 'coupe-femme-brush',
    category_id: 1, // COIFFURE
    subcategory_id: 14, // LA COUPE
    base_price: 86.00,
    base_duration_minutes: 60,
    is_active: true
  });
```

### Admin: Add New Category

```typescript
// Add new main category
await supabase
  .from('service_categories')
  .insert({
    name: 'NOUVELLE CATEGORIE',
    slug: 'nouvelle-categorie',
    icon: '✨',
    parent_id: null,
    display_order: 9
  });

// Add new subcategory under existing category
await supabase
  .from('service_categories')
  .insert({
    name: 'NOUVELLE SOUS-CATEGORIE',
    slug: 'coiffure-nouvelle-sous-categorie',
    parent_id: 1, // COIFFURE
    display_order: 9
  });
```

---

## Backward Compatibility

### ✅ Old Code Still Works

The old `category` VARCHAR column is **kept** and marked as DEPRECATED:

```sql
-- Old code (still works)
SELECT * FROM services WHERE category = 'massage';

-- New code (recommended)
SELECT * FROM services WHERE category_id = 5; -- MASSAGE BIEN-ETRE
```

### Migration Path for Existing Code

**Option 1**: Keep using old `category` column (deprecated but functional)
**Option 2**: Update queries to use `category_id` and `subcategory_id`
**Option 3**: Use the new `services_with_categories` view for full details

---

## Next Steps

### Phase 2: Data Migration (Optional)

If you want to fully migrate away from the old `category` column:

1. **Update all 88 services** with correct `subcategory_id` values
2. **Update frontend code** to use new columns
3. **Create migration** to drop old `category` column
4. **Update specs 003, 007, 013** documentation

### Admin Interface Required

Create admin UI for:
- ✅ View category hierarchy
- ✅ Add/edit/delete categories
- ✅ Reorder categories (drag & drop)
- ✅ Assign services to categories
- ✅ Bulk update service categories

---

## Files Modified

```
supabase/migrations/
└── 20250107100000_add_service_categories.sql (NEW)

Documentation:
└── SERVICE_CATEGORIES_ADDED.md (this file)
```

---

## Verification

Run these queries to verify the system:

```sql
-- Count categories
SELECT COUNT(*) as total_categories,
       COUNT(CASE WHEN parent_id IS NULL THEN 1 END) as main_categories,
       COUNT(CASE WHEN parent_id IS NOT NULL THEN 1 END) as subcategories
FROM service_categories;

-- Show hierarchy
SELECT
  COALESCE(parent.name, cat.name) as category,
  CASE WHEN cat.parent_id IS NOT NULL THEN '  └─ ' || cat.name ELSE cat.name END as item,
  cat.slug,
  cat.icon
FROM service_categories cat
LEFT JOIN service_categories parent ON cat.parent_id = parent.id
ORDER BY COALESCE(parent.display_order, cat.display_order), cat.parent_id NULLS FIRST, cat.display_order;
```

---

**Status**: ✅ **DEPLOYED AND VERIFIED**
**Impact**: Low (backward compatible)
**Database**: Production (xpntvajwrjuvsqsmizzb.supabase.co)

---

Generated by Claude Code on 2025-11-07
