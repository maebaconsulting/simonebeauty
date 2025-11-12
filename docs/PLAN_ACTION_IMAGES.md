# 📋 PLAN D'ACTION - AMÉLIORATION GESTION DES IMAGES

**Date**: 2025-01-11
**Objectif**: Optimiser l'expérience utilisateur en résolvant les problèmes d'images manquantes et en standardisant la gestion des médias

---

## 🎯 RÉSUMÉ EXÉCUTIF

### Problèmes Identifiés
- ✅ **35 produits (35%)** sans image principale
- ✅ **Mix de 2 domaines** (ancien et nouveau Supabase)
- ✅ **8+ URLs externes** non contrôlées (risque de liens cassés)
- ✅ **URL signée temporaire** pour service "CARTE CADEAU"
- ✅ **Dossier tempForTest/** avec images de test en production

### Impact UX
- ❌ Placeholders visuels sur produits populaires
- ❌ Incohérence visuelle (mix de sources)
- ❌ Risque de liens cassés (URLs externes)
- ❌ Temps de chargement variable

### Solution Proposée
✨ **Migration complète vers domaine unifié** `services.simone.paris`
✨ **Composants React optimisés** avec fallback intelligent
✨ **Scripts automatiques** de migration et audit
✨ **Plan de priorisation** basé sur la visibilité

---

## 📊 PHASE 1: AUDIT INITIAL (FAIT ✅)

### Scripts Créés

#### 1. Script d'Audit (`scripts/audit-missing-images.ts`)
**Fonctionnalités**:
- Identifie tous les produits sans images
- Liste les services avec images manquantes
- Génère un rapport JSON + CSV
- Calcule les priorités (HIGH/MEDIUM/LOW)
- Produit des recommandations automatiques

**Usage**:
```bash
npx tsx scripts/audit-missing-images.ts
```

**Output**:
- `docs/audit-images-[timestamp].json` - Rapport complet
- `docs/produits-sans-images-[timestamp].csv` - Liste prioritaire

#### 2. Script de Migration (`scripts/migrate-external-images.ts`)
**Fonctionnalités**:
- Détecte automatiquement les URLs externes
- Télécharge les images depuis Unsplash, Pinterest, etc.
- Upload sur Supabase avec naming cohérent
- Met à jour la base de données
- Génère un rapport de migration

**Usage**:
```bash
# Dry-run (simulation)
DRY_RUN=true npx tsx scripts/migrate-external-images.ts

# Exécution réelle
npx tsx scripts/migrate-external-images.ts
```

---

## 🔧 PHASE 2: NORMALISATION DES URLS (1 jour)

### Étape 2.1: Backup Base de Données
```bash
# Via Supabase CLI
supabase db dump -f backup-before-migration.sql

# Ou via interface web
# Dashboard → Database → Backups → Create backup
```

### Étape 2.2: Migration SQL des Domaines
```sql
-- ========================================
-- MIGRATION DOMAINES - SCRIPT COMPLET
-- ========================================

-- 1. Produits - primary_image_url
UPDATE product
SET primary_image_url = REPLACE(
  primary_image_url,
  'https://mqbtqgwcgknqzwzzwmag.supabase.co/storage/v1/object/public',
  'https://services.simone.paris/storage/v1/object/public'
)
WHERE primary_image_url LIKE 'https://mqbtqgwcgknqzwzzwmag%';

-- 2. Produits - secondary_image_url (array)
UPDATE product
SET secondary_image_url = ARRAY(
  SELECT REPLACE(
    url,
    'https://mqbtqgwcgknqzwzzwmag.supabase.co/storage/v1/object/public',
    'https://services.simone.paris/storage/v1/object/public'
  )
  FROM unnest(secondary_image_url) AS url
)
WHERE secondary_image_url IS NOT NULL
  AND EXISTS (
    SELECT 1
    FROM unnest(secondary_image_url) AS url
    WHERE url LIKE 'https://mqbtqgwcgknqzwzzwmag%'
  );

-- 3. Services - toutes les colonnes d'images
UPDATE services
SET
  web_icone_url = REPLACE(
    web_icone_url,
    'https://mqbtqgwcgknqzwzzwmag.supabase.co/storage/v1/object/public',
    'https://services.simone.paris/storage/v1/object/public'
  ),
  web_big_image = REPLACE(
    web_big_image,
    'https://mqbtqgwcgknqzwzzwmag.supabase.co/storage/v1/object/public',
    'https://services.simone.paris/storage/v1/object/public'
  ),
  mobile_icon_url = REPLACE(
    mobile_icon_url,
    'https://mqbtqgwcgknqzwzzwmag.supabase.co/storage/v1/object/public',
    'https://services.simone.paris/storage/v1/object/public'
  )
WHERE
  web_icone_url LIKE 'https://mqbtqgwcgknqzwzzwmag%'
  OR web_big_image LIKE 'https://mqbtqgwcgknqzwzzwmag%'
  OR mobile_icon_url LIKE 'https://mqbtqgwcgknqzwzzwmag%';

-- 4. Vérification post-migration
SELECT
  'Products' as table_name,
  COUNT(*) as total,
  COUNT(CASE WHEN primary_image_url LIKE 'https://services.simone.paris%' THEN 1 END) as migrated,
  COUNT(CASE WHEN primary_image_url LIKE 'https://mqbtqgwcgknqzwzzwmag%' THEN 1 END) as legacy_remaining,
  COUNT(CASE WHEN primary_image_url IS NULL THEN 1 END) as null_count
FROM product

UNION ALL

SELECT
  'Services',
  COUNT(*),
  COUNT(CASE WHEN web_icone_url LIKE 'https://services.simone.paris%' THEN 1 END),
  COUNT(CASE WHEN web_icone_url LIKE 'https://mqbtqgwcgknqzwzzwmag%' THEN 1 END),
  COUNT(CASE WHEN web_icone_url IS NULL THEN 1 END)
FROM services;
```

### Étape 2.3: Correction URL Signée CARTE CADEAU
```sql
-- Remplacer l'URL signée temporaire par une URL permanente
UPDATE services
SET web_icone_url = 'https://services.simone.paris/storage/v1/object/public/icones/carte-cadeau.svg'
WHERE id = 2 AND name = 'CARTE CADEAU';

-- Note: Uploader d'abord l'icône sur Supabase si elle n'existe pas
```

---

## 📥 PHASE 3: MIGRATION DES IMAGES EXTERNES (2-3 jours)

### Étape 3.1: Exécuter le Script de Migration
```bash
# 1. Audit initial
npx tsx scripts/audit-missing-images.ts

# 2. Migration (avec rapport)
npx tsx scripts/migrate-external-images.ts
```

### Étape 3.2: Vérification Manuelle
Après la migration automatique, vérifier:
- [ ] Qualité des images téléchargées
- [ ] Dimensions appropriées (min 800x600px)
- [ ] Compression acceptable (< 200KB)
- [ ] Aucun lien cassé

### Étape 3.3: Nettoyage du Bucket tempForTest
```bash
# Via Supabase CLI
supabase storage rm tempForTest/*

# Puis supprimer le bucket
supabase storage delete-bucket tempForTest
```

---

## 🖼️ PHASE 4: UPLOAD DES IMAGES MANQUANTES (3-5 jours)

### Priorisation

#### **PRIORITÉ 1: Services Visibles (8 services)**
Ces images apparaissent sur la page d'accueil → Impact UX maximal

1. **COIFFURE** (ID: 4) - ✅ Complet
2. **BEAUTE DES ONGLES** (ID: 3) - ✅ Complet
3. **LE VISAGE** (ID: 1) - ✅ Complet
4. **LE REGARD** (ID: 14) - ✅ Complet
5. **MASSAGE BIEN-ETRE** (ID: 12) - ✅ Complet
6. **MINCEUR & DRAINAGE** (ID: 5) - ✅ Complet
7. **EPILATION** (ID: 9) - ✅ Complet
8. **MAQUILLAGE** (ID: 6) - ✅ Complet

#### **PRIORITÉ 2: Produits Visibles Sans Images**

**Par catégorie** (voir rapport CSV pour la liste complète):

1. **LE REGARD** (6 produits sans images)
   - Design + Teinture
   - Le "Brow Lift"
   - Rehaussement (4 variantes)

2. **MAQUILLAGE** (3 produits sans images)
   - Grand Jour ! Make-up sur-mesure
   - Make-up "frais"
   - Make-up Soir

3. **EPILATION** (8 produits sans images)
   - Variantes de maillots + Aisselles

4. **MASSAGE BIEN-ETRE** (7 produits sans images)
5. **MINCEUR** (5 produits sans images)

### Recommandations par Image

**Dimensions recommandées**:
- Services (icônes): 256x256px (SVG si possible)
- Services (grandes images): 1200x800px
- Produits (principales): 800x600px
- Mobile (icônes): 128x128px

**Format**:
- Préférer WebP (meilleure compression)
- Fallback JPG pour compatibilité
- PNG pour icônes avec transparence

**Compression**:
- Utiliser TinyPNG ou Squoosh
- Target: < 150KB par image
- Qualité: 85%

---

## ⚛️ PHASE 5: INTÉGRATION DU COMPOSANT OPTIMISÉ (1 jour)

### Étape 5.1: Remplacer les Composants Existants

**Avant** (ancien code):
```tsx
// Ancien composant avec gestion manuelle
<img
  src={product.primary_image_url || fallback}
  alt={product.name}
  onError={(e) => e.currentTarget.src = fallback}
/>
```

**Après** (nouveau composant):
```tsx
import { OptimizedImage } from '@/components/shared/OptimizedImage'

<OptimizedImage
  product={product}
  alt={product.name}
  aspectRatio="landscape"
  priority={false}
  className="rounded-lg"
/>
```

### Étape 5.2: Composants à Migrer

- [ ] `src/components/ServiceCategories.tsx`
- [ ] `src/components/mobile/MobileServiceCategories.tsx`
- [ ] `src/components/mobile/MobileServiceCard.tsx`
- [ ] `src/components/boutique/BoutiqueProductGrid.tsx`
- [ ] `src/components/EnterpriseProductCard.tsx`

### Étape 5.3: Tests

**Checklist de tests**:
- [ ] Images chargent correctement (happy path)
- [ ] Fallback fonctionne si image 404
- [ ] Placeholder s'affiche si aucune image
- [ ] Lazy loading actif (scroll)
- [ ] Performance acceptable (< 3s LCP)
- [ ] Mobile responsive
- [ ] SEO (alt text, dimensions)

---

## 📈 PHASE 6: MONITORING & OPTIMISATION (Continu)

### Métriques à Suivre

1. **Couverture des Images**
   ```sql
   -- Taux de produits avec images
   SELECT
     COUNT(CASE WHEN primary_image_url IS NOT NULL THEN 1 END) * 100.0 / COUNT(*) as coverage_percent
   FROM product
   WHERE visible = true;
   ```

2. **Performance**
   - LCP (Largest Contentful Paint) < 2.5s
   - CLS (Cumulative Layout Shift) < 0.1
   - Taille moyenne des images < 150KB

3. **Erreurs**
   - Logs Vercel/Next.js pour 404 sur images
   - Sentry pour erreurs client-side

### Optimisations Futures

1. **CDN avec Cache**
   - Configurer Cloudflare/Vercel CDN
   - Headers Cache-Control optimaux
   - Invalidation cache automatique

2. **Format Next-Gen**
   - Conversion automatique WebP
   - Support AVIF pour browsers modernes
   - Fallback JPG/PNG

3. **Responsive Images**
   - Générer plusieurs tailles (thumbnail, medium, large)
   - Utiliser srcset/sizes
   - Art direction avec `<picture>`

---

## ✅ CHECKLIST COMPLÈTE

### Préparation
- [ ] Backup base de données
- [ ] Vérifier accès Supabase Storage
- [ ] Installer dépendances scripts (`npm install`)

### Migration URLs
- [ ] Exécuter migration SQL (domaines)
- [ ] Vérifier résultats (query de vérification)
- [ ] Corriger URL signée CARTE CADEAU
- [ ] Tester affichage frontend

### Migration Images Externes
- [ ] Exécuter script audit
- [ ] Analyser rapport
- [ ] Exécuter script migration
- [ ] Vérifier qualité images migrées

### Upload Images Manquantes
- [ ] Préparer images services (8 prioritaires)
- [ ] Uploader images produits HIGH priority
- [ ] Uploader images produits MEDIUM priority
- [ ] Optimiser compression/dimensions

### Intégration Composants
- [ ] Remplacer composants services
- [ ] Remplacer composants produits
- [ ] Tests visuels (mobile + desktop)
- [ ] Tests performance (Lighthouse)

### Nettoyage
- [ ] Supprimer dossier tempForTest
- [ ] Archiver anciens scripts
- [ ] Documenter changements
- [ ] Créer guide maintenance

---

## 📚 DOCUMENTATION TECHNIQUE

### Structure des Buckets Recommandée

```
storage/
├── cms/                    # Médias généraux
│   └── ...
│
├── product-images/         # ⭐ BUCKET PRINCIPAL PRODUITS
│   └── products/
│       ├── 1/             # Par service_id
│       │   ├── {product_id}_{name}_{timestamp}.jpg
│       │   └── ...
│       ├── 3/
│       ├── 4/
│       └── ...
│
├── icones/                 # ⭐ ICÔNES SERVICES
│   ├── coiffure.svg
│   ├── ongles.svg
│   └── ...
│
└── logos/                  # Logos plateforme
    └── ...
```

### Convention de Nommage

**Produits**:
```
{product_id}_{sanitized_name}_{timestamp}.{ext}

Exemples:
- 10_mani_masque_vernis_1752416507400.jpeg
- 56_coupe_femme_brush_1745491722370.jpg
```

**Services**:
```
{service_name_slug}.{ext}

Exemples:
- coiffure.svg
- beaute-ongles.png
- massage-bien-etre.jpg
```

### Hooks Disponibles

```typescript
// 1. Construction URLs
import { useMediaDomain } from '@/hooks/useMediaDomain'
const { buildMediaUrl, baseUrl } = useMediaDomain()

// 2. Images produits avec fallback
import { useProductImage } from '@/hooks/useProductImage'
const { imageUrl, hasImage } = useProductImage(product)

// 3. Logos plateforme
import { useLogoDomain } from '@/hooks/useLogoDomain'
const { logoUrls } = useLogoDomain()
```

---

## 🎯 TIMELINE ESTIMÉE

| Phase | Durée | Responsable | Dépendances |
|-------|-------|-------------|-------------|
| 1. Audit | 2h | Dev | - |
| 2. Normalisation URLs | 1 jour | Dev | Phase 1 |
| 3. Migration externes | 2-3 jours | Dev | Phase 2 |
| 4. Upload manquantes | 3-5 jours | Designer + Dev | Phase 3 |
| 5. Intégration composants | 1 jour | Dev | Phase 4 |
| 6. Tests & validation | 1 jour | QA | Phase 5 |

**TOTAL**: ~9-12 jours ouvrés

---

## 💡 RECOMMANDATIONS SUPPLÉMENTAIRES

### Court Terme
1. ✅ Exécuter audit immédiatement
2. ✅ Prioriser services visibles (impact page d'accueil)
3. ✅ Utiliser composant OptimizedImage dès maintenant
4. ⚠️ Monitorer erreurs 404 sur images

### Moyen Terme
1. Établir process d'upload pour nouveaux produits
2. Automatiser compression images (CI/CD)
3. Implémenter lazy loading agressif
4. A/B test différents placeholders

### Long Terme
1. Migration vers CDN dédié (Cloudflare Images)
2. Génération automatique de thumbnails
3. Support multi-format (WebP/AVIF)
4. Image optimization à la volée

---

## 🔗 RESSOURCES

### Scripts
- `scripts/audit-missing-images.ts` - Audit complet
- `scripts/migrate-external-images.ts` - Migration automatique

### Composants
- `components/shared/OptimizedImage.tsx` - Composant React optimisé

### Hooks
- `hooks/useMediaDomain.ts` - Construction URLs
- `hooks/useProductImage.ts` - Images produits
- `hooks/useLogoDomain.ts` - Logos plateforme

### Utils
- `utils/imageUtils.ts` - Hiérarchie fallback

### Documentation
- `docs/RAPPORT_COMPLET_IMAGES.md` - Analyse complète système actuel
- `docs/PLAN_ACTION_IMAGES.md` - Ce document

---

**Dernière mise à jour**: 2025-01-11
**Version**: 1.0
**Auteur**: Équipe Dev Simone Paris
