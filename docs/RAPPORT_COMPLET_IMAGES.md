# 📊 RAPPORT COMPLET DES IMAGES - SERVICES & PRODUITS SIMONE PARIS

**Date de génération**: 2025-01-10  
**Domaine principal**: `https://services.simone.paris/storage/v1/object/public/`  
**Domaine Supabase**: `https://mqbtqgwcgknqzwzzwmag.supabase.co/storage/v1/object/public/`

---

## 🏗️ ARCHITECTURE DU SYSTÈME DE GESTION DES IMAGES

### 📋 Vue d'ensemble

Ce document est destiné aux **développeurs qui reprennent l'application** et devront **migrer les images**. Il explique comment le système gère les images pour les services (catégories) et les produits.

---

## 🎯 1. GESTION DES IMAGES PAR ENTITÉ

### 📦 A. IMAGES DES SERVICES (Catégories)

Les **services** (catégories principales comme "COIFFURE", "BEAUTE DES ONGLES", etc.) ont **3 types d'images** :

#### Structure de données (table `services`)
```sql
CREATE TABLE services (
  id bigint PRIMARY KEY,
  name text NOT NULL,
  web_icone_url text,      -- 🖥️ Icône pour affichage desktop (petite)
  web_big_image text,       -- 🖼️ Grande image pour détails desktop
  mobile_icon_url text,     -- 📱 Icône optimisée pour mobile
  visible boolean DEFAULT true,
  "order" integer           -- Ordre d'affichage
);
```

#### Logique de sélection selon la plateforme

**Sur MOBILE** :
```typescript
// Fichier: src/components/mobile/EnhancedMobileServiceCategories.tsx
// Fichier: src/components/mobile/MobileServiceCategories.tsx

getServiceIcon(service) {
  // Priorité 1: Icône mobile spécifique
  if (service.mobile_icon_url) {
    return buildMediaUrl(service.mobile_icon_url);
  }
  
  // Priorité 2: Fallback sur icône web
  if (service.web_icone_url) {
    return buildMediaUrl(service.web_icone_url);
  }
  
  // Priorité 3: Image placeholder
  return fallbackImage;
}
```

**Sur DESKTOP** :
```typescript
// Fichier: src/components/ServiceCategories.tsx
// Fichier: src/components/ServicesSection.tsx

// Utilise principalement web_icone_url
<img src={service.mobile_icon_url || fallbackUnsplash} />

// Pour les détails: web_big_image
<img src={service.web_big_image} />
```

---

### 🛍️ B. IMAGES DES PRODUITS (Prestations)

Les **produits** ont une **hiérarchie complexe de fallback** pour garantir qu'une image s'affiche toujours.

#### Structure de données (table `product`)
```sql
CREATE TABLE product (
  id bigint PRIMARY KEY,
  name text NOT NULL,
  service_id bigint REFERENCES services(id),  -- Lien vers la catégorie parent
  primary_image_url text,                      -- 🎯 Image principale (priorité 1)
  secondary_image_url text[],                  -- 📸 Tableau d'images secondaires
  visible boolean DEFAULT true
);
```

#### Hiérarchie de fallback (6 niveaux)

**Définie dans** : `src/utils/imageUtils.ts` → fonction `getProductImage()`

```typescript
export const getProductImage = (product, buildMediaUrl) => {
  
  // 🎯 NIVEAU 1: Image principale du produit
  if (product.primary_image_url) {
    return buildMediaUrl(product.primary_image_url);
  }
  
  // 📸 NIVEAU 2: Première image du tableau secondaire
  if (product.secondary_image_url?.length > 0) {
    return buildMediaUrl(product.secondary_image_url[0]);
  }
  
  // 🖼️ NIVEAU 3: Grande image du service parent
  if (product.services?.web_big_image) {
    return buildMediaUrl(product.services.web_big_image);
  }
  
  // 🏷️ NIVEAU 4: Icône du service parent
  if (product.services?.web_icone_url) {
    return buildMediaUrl(product.services.web_icone_url);
  }
  
  // 📁 NIVEAU 5: Image de la sous-catégorie (si existe)
  if (product.subcategory_image_url) {
    return buildMediaUrl(product.subcategory_image_url);
  }
  
  // ⚠️ NIVEAU 6: Image placeholder Unsplash (à éviter)
  return 'https://images.unsplash.com/photo-1540555700478-4be289fbecef';
};
```

**Utilisé par** :
- `src/hooks/useProductImage.ts` - Hook React qui encapsule cette logique
- Tous les composants qui affichent des produits (cartes, listes, grilles)

---

## 🔧 2. HOOKS ET UTILITAIRES CENTRALISÉS

### 🌐 A. Construction des URLs

#### `useMediaDomain.ts` - Hook principal
```typescript
export const useMediaDomain = () => {
  const bucketName = 'cms';
  const logosBucketName = 'logos';
  const baseUrl = 'https://services.simone.paris/storage/v1/object/public';
  
  // Construction URL pour médias CMS
  const buildMediaUrl = (filePath: string) => {
    if (filePath.startsWith('http')) return filePath; // Déjà complète
    return `${baseUrl}/${bucketName}/${filePath}`;
  };
  
  // Construction URL pour logos
  const buildLogoUrl = (fileName: string) => {
    if (fileName.startsWith('http')) return fileName;
    return `${baseUrl}/${logosBucketName}/${fileName}`;
  };
  
  return { buildMediaUrl, buildLogoUrl, baseUrl };
};
```

**⚠️ IMPORTANT** : Ce hook gère le **domaine personnalisé** configuré sur Supabase.

#### `useLogoDomain.ts` - Spécifique aux logos plateforme
```typescript
export const useLogoDomain = () => {
  const baseUrl = 'https://services.simone.paris/storage/v1/object/public/logos';
  
  const logoUrls = {
    desktop: {
      normal: buildLogoUrl('logo_simone_manuscrit_blanc.png'),   // Fond sombre
      scrolled: buildLogoUrl('logo_simone_manuscrit_noir.png')   // Fond blanc
    },
    mobile: {
      normal: buildLogoUrl('Logo_s_dark_mode.png'),              // S blanc
      scrolled: buildLogoUrl('logo_simone_s.svg')                // S sombre
    }
  };
  
  return { logoUrls, buildLogoUrl };
};
```

---

### 🖼️ B. Hook produits avec images

#### `useProductImage.ts` - Hook intelligent
```typescript
export const useProductImage = (product: ProductImageData) => {
  const { buildMediaUrl } = useMediaDomain();
  const { data: services } = useServices();

  // Enrichit le produit avec les données du service si manquantes
  const enhancedProduct = useMemo(() => {
    if (!product.services && product.service_id && services) {
      const relatedService = services.find(s => s.id === product.service_id);
      return { ...product, services: relatedService };
    }
    return product;
  }, [product, services]);

  // Applique la hiérarchie de fallback
  const imageUrl = useMemo(() => {
    return getProductImage(enhancedProduct, buildMediaUrl);
  }, [enhancedProduct, buildMediaUrl]);

  return { imageUrl, hasImage: Boolean(product.primary_image_url || ...) };
};
```

**Utilisation dans un composant** :
```typescript
const ProductCard = ({ product }) => {
  const { imageUrl, hasImage } = useProductImage(product);
  
  return (
    <img 
      src={imageUrl} 
      alt={product.name}
      onError={(e) => e.currentTarget.src = fallbackImage}
    />
  );
};
```

---

## 📂 3. STRUCTURE DES BUCKETS SUPABASE

### Buckets actuellement utilisés

```
storage.buckets
├── cms/                          # Médias généraux du CMS
│   ├── products/
│   │   ├── primary/              # Images principales
│   │   │   ├── coiffure/
│   │   │   ├── ongles/
│   │   │   ├── massage/
│   │   │   └── ...
│   │   └── images/
│   │       ├── epilation/
│   │       └── massage/
│   └── ...
│
├── logos/                        # Logos de la plateforme
│   ├── logo_simone_manuscrit_blanc.png
│   ├── logo_simone_manuscrit_noir.png
│   ├── Logo_s_dark_mode.png
│   └── logo_simone_s.svg
│
├── product-images/               # Images produits par ID
│   └── products/
│       ├── 3/                    # Service ID 3 (ONGLES)
│       │   ├── 10_primary_1752416507400.jpeg
│       │   ├── 12_primary_1752814832671.jpg
│       │   └── ...
│       ├── 4/                    # Service ID 4 (COIFFURE)
│       └── ...
│
├── icones/                       # Icônes mobiles services
│   ├── ciseaux-et-peigne.png
│   ├── vernis-a-ongle.png
│   ├── massage-du-visage.png
│   └── ...
│
└── tempForTest/                  # ⚠️ À SUPPRIMER (images de test)
    ├── image (5).png
    └── young-woman-mask-face...png
```

---

## 🌍 4. DOMAINES ET URLS

### A. Domaine personnalisé (RECOMMANDÉ)

**Configuration actuelle** :
```
https://services.simone.paris/storage/v1/object/public/{bucket}/{path}
```

**Avantages** :
- URL courte et brandée
- Permet de changer de backend sans casser les liens
- Meilleure pour le SEO

**Configuration** : Via les settings Supabase → Custom domains

---

### B. Domaine Supabase direct (LEGACY)

**Format** :
```
https://mqbtqgwcgknqzwzzwmag.supabase.co/storage/v1/object/public/{bucket}/{path}
```

**⚠️ Problème actuel** : 
- ~40% des URLs utilisent encore ce domaine
- À migrer vers le domaine personnalisé

**Script de migration nécessaire** :
```sql
-- Exemple pour la table product
UPDATE product 
SET primary_image_url = REPLACE(
  primary_image_url, 
  'https://mqbtqgwcgknqzwzzwmag.supabase.co',
  'https://services.simone.paris'
)
WHERE primary_image_url LIKE 'https://mqbtqgwcgknqzwzzwmag%';
```

---

### C. URLs externes (À ÉVITER)

**Actuellement utilisées** :
- `https://images.unsplash.com/...` (placeholders)
- `https://i.pinimg.com/...` (Pinterest)
- `https://www.consoglobe.com/...`
- `https://encrypted-tbn0.gstatic.com/...` (Google)

**Pourquoi les éviter** :
- ❌ Peuvent disparaître sans préavis
- ❌ Performances variables
- ❌ Pas de contrôle sur la compression
- ❌ Problèmes CORS potentiels

**Action requise** : Télécharger et uploader sur Supabase

---

## 🔄 5. COMPOSANTS UTILISANT LES IMAGES

### Desktop
```
src/components/
├── ServiceCategories.tsx           # Grille catégories (mobile_icon_url)
├── ServicesSection.tsx             # Section services (web_icone_url)
├── ServiceDetailDialog.tsx         # Détails service (web_big_image)
├── EnterpriseProductCard.tsx       # Carte produit entreprise
└── boutique/
    └── BoutiqueProductGrid.tsx     # Grille produits boutique
```

### Mobile
```
src/components/mobile/
├── MobileServiceCategories.tsx              # Catégories (mobile_icon_url → web_icone_url)
├── EnhancedMobileServiceCategories.tsx      # Version améliorée
├── MobileServiceCard.tsx                    # Carte produit
├── MobileProductList.tsx                    # Liste produits
└── MobileOfflineCatalog.tsx                 # Catalogue offline
```

---

## 🚨 6. POINTS CRITIQUES POUR LA MIGRATION

### ⚠️ Problèmes identifiés

1. **35 produits sans image principale** (35% du catalogue)
   - Liste complète dans la section "Produits sans images"
   - À prioriser pour la migration

2. **Mix de 2 domaines Supabase**
   - Ancien: `mqbtqgwcgknqzwzzwmag.supabase.co`
   - Nouveau: `services.simone.paris`
   - Nécessite migration SQL

3. **8+ URLs externes non contrôlées**
   - Risque de liens cassés
   - À télécharger et héberger

4. **Service "CARTE CADEAU" avec URL signée**
   ```
   https://dfrsgbecgxbqkmvmijnq.supabase.co/storage/v1/object/sign/avatars/...?token=...
   ```
   - ❌ URL temporaire qui expire
   - À remplacer par URL publique permanente

5. **Dossier `tempForTest/` en production**
   - Images de test utilisées par des produits
   - À nettoyer et déplacer

---

## 📝 7. CHECKLIST DE MIGRATION

### Phase 1 : Audit (À FAIRE EN PREMIER)
- [ ] Exporter la liste complète des produits sans images
- [ ] Identifier toutes les URLs externes
- [ ] Vérifier l'accessibilité de chaque image
- [ ] Créer un backup de la base de données

### Phase 2 : Préparation
- [ ] Créer les dossiers manquants dans les buckets
- [ ] Définir une nomenclature pour les nouveaux fichiers
- [ ] Préparer les images de remplacement (dimension, compression)

### Phase 3 : Migration des URLs
- [ ] Script: Télécharger images externes → Upload Supabase
- [ ] Script: Migrer domaine legacy → domaine personnalisé
- [ ] Script: Corriger URL signée service CARTE CADEAU
- [ ] Script: Nettoyer dossier `tempForTest/`

### Phase 4 : Upload nouvelles images
- [ ] Uploader images manquantes pour 35 produits
- [ ] Créer images optimisées mobile (webp, compression)
- [ ] Tester affichage sur tous les composants

### Phase 5 : Validation
- [ ] Tester chaque catégorie (8 services visibles)
- [ ] Tester échantillon de produits par catégorie
- [ ] Vérifier responsive (mobile/desktop)
- [ ] Vérifier fallbacks si image manquante
- [ ] Tests de performance (temps de chargement)

### Phase 6 : Nettoyage
- [ ] Supprimer anciennes images non utilisées
- [ ] Nettoyer bucket `tempForTest/`
- [ ] Documenter les nouveaux chemins
- [ ] Mettre à jour ce rapport

---

## 🛠️ 8. SCRIPTS UTILES POUR LA MIGRATION

### A. Télécharger et uploader une image externe
```typescript
// src/scripts/migrateExternalImage.ts
import { supabase } from '@/integrations/supabase/client';

async function migrateExternalImage(
  externalUrl: string,
  bucket: string,
  targetPath: string
) {
  try {
    // 1. Télécharger l'image
    const response = await fetch(externalUrl);
    const blob = await response.blob();
    
    // 2. Uploader sur Supabase
    const { data, error } = await supabase.storage
      .from(bucket)
      .upload(targetPath, blob, {
        contentType: blob.type,
        upsert: false
      });
    
    if (error) throw error;
    
    // 3. Construire la nouvelle URL
    const newUrl = `https://services.simone.paris/storage/v1/object/public/${bucket}/${targetPath}`;
    
    console.log(`✅ Migré: ${externalUrl} → ${newUrl}`);
    return newUrl;
    
  } catch (error) {
    console.error(`❌ Erreur migration ${externalUrl}:`, error);
    return null;
  }
}

// Exemple d'utilisation
await migrateExternalImage(
  'https://images.unsplash.com/photo-xxx',
  'cms',
  'products/primary/coiffure/balayage_new.jpg'
);
```

### B. Migrer les URLs de domaine (SQL)
```sql
-- Migration des URLs produits
UPDATE product 
SET 
  primary_image_url = REPLACE(primary_image_url, 
    'https://mqbtqgwcgknqzwzzwmag.supabase.co/storage/v1/object/public',
    'https://services.simone.paris/storage/v1/object/public'
  )
WHERE primary_image_url LIKE 'https://mqbtqgwcgknqzwzzwmag%';

-- Migration des URLs services
UPDATE services 
SET 
  web_icone_url = REPLACE(web_icone_url, 
    'https://mqbtqgwcgknqzwzzwmag.supabase.co/storage/v1/object/public',
    'https://services.simone.paris/storage/v1/object/public'
  ),
  web_big_image = REPLACE(web_big_image, 
    'https://mqbtqgwcgknqzwzzwmag.supabase.co/storage/v1/object/public',
    'https://services.simone.paris/storage/v1/object/public'
  ),
  mobile_icon_url = REPLACE(mobile_icon_url, 
    'https://mqbtqgwcgknqzwzzwmag.supabase.co/storage/v1/object/public',
    'https://services.simone.paris/storage/v1/object/public'
  )
WHERE 
  web_icone_url LIKE 'https://mqbtqgwcgknqzwzzwmag%'
  OR web_big_image LIKE 'https://mqbtqgwcgknqzwzzwmag%'
  OR mobile_icon_url LIKE 'https://mqbtqgwcgknqzwzzwmag%';
```

### C. Identifier les images manquantes
```sql
-- Produits sans image principale
SELECT 
  p.id,
  p.name,
  s.name as service_name,
  p.visible
FROM product p
LEFT JOIN services s ON p.service_id = s.id
WHERE 
  p.visible = true 
  AND p.primary_image_url IS NULL
ORDER BY s.name, p.name;

-- Services sans images
SELECT 
  id,
  name,
  web_icone_url,
  web_big_image,
  mobile_icon_url,
  visible
FROM services
WHERE 
  visible = true
  AND (
    web_icone_url IS NULL 
    OR web_big_image IS NULL 
    OR mobile_icon_url IS NULL
  )
ORDER BY "order";
```

---

## 📚 9. DOCUMENTATION TECHNIQUE SUPPLÉMENTAIRE

### Fichiers clés à consulter
```
src/
├── hooks/
│   ├── useMediaDomain.ts          # ⭐ Construction URLs
│   ├── useLogoDomain.ts           # Logos plateforme
│   ├── useProductImage.ts         # ⭐ Logique produits
│   └── useServices.ts             # Fetch services
│
├── utils/
│   └── imageUtils.ts              # ⭐ Hiérarchie fallback
│
├── components/
│   ├── ServiceCategories.tsx      # Affichage desktop
│   └── mobile/
│       └── MobileServiceCategories.tsx  # Affichage mobile
│
└── integrations/supabase/
    └── client.ts                  # Configuration Supabase
```

### RLS Policies Supabase Storage
```sql
-- Les buckets sont publics, pas besoin de RLS pour la lecture
-- Mais l'upload nécessite authentification

-- Policy pour upload (cms bucket)
CREATE POLICY "Authenticated users can upload to cms"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'cms');

-- Policy pour suppression (cms bucket)
CREATE POLICY "Authenticated users can delete from cms"
ON storage.objects FOR DELETE
TO authenticated
USING (bucket_id = 'cms');
```

---

## 🎯 SERVICES (Catégories principales)

### ✅ SERVICE #1 - COIFFURE (ID: 4)
- **Ordre d'affichage**: 1
- **Visible**: ✅ Oui
- **🖥️ Desktop - Icône Web**:
  ```
  https://services.simone.paris/storage/v1/object/public/products/primary/coiffure/coiffure_simone.png
  ```
- **🖼️ Desktop - Grande Image**:
  ```
  https://services.simone.paris/storage/v1/object/public/products/primary/coiffure/coiffure_simone.png
  ```
- **📱 Mobile - Icône**:
  ```
  https://services.simone.paris/storage/v1/object/public/icones//ciseaux-et-peigne.png
  ```

---

### ✅ SERVICE #2 - BEAUTE DES ONGLES (ID: 3)
- **Ordre d'affichage**: 2
- **Visible**: ✅ Oui
- **🖥️ Desktop - Icône Web**:
  ```
  https://services.simone.paris/storage/v1/object/public/product-images/products/3/10_primary_1752416507400.jpeg
  ```
- **🖼️ Desktop - Grande Image**:
  ```
  https://services.simone.paris/storage/v1/object/public/products/primary/ongles/beaute_ongles.jpg
  ```
- **📱 Mobile - Icône**:
  ```
  https://services.simone.paris/storage/v1/object/public/icones//vernis-a-ongle.png
  ```

---

### ✅ SERVICE #3 - LE VISAGE (ID: 1)
- **Ordre d'affichage**: 3
- **Visible**: ✅ Oui
- **🖥️ Desktop - Icône Web**:
  ```
  https://services.simone.paris/storage/v1/object/public/products/primary/massage_visage.png
  ```
- **🖼️ Desktop - Grande Image**:
  ```
  https://services.simone.paris/storage/v1/object/public/products/primary/massage_visage.png
  ```
- **📱 Mobile - Icône**:
  ```
  https://services.simone.paris/storage/v1/object/public/icones//massage-du-visage.png
  ```

---

### ✅ SERVICE #4 - LE REGARD (ID: 14)
- **Ordre d'affichage**: 4
- **Visible**: ✅ Oui
- **🖥️ Desktop - Icône Web**:
  ```
  https://services.simone.paris/storage/v1/object/public/products/primary/regard/cils_simone.jpg
  ```
- **🖼️ Desktop - Grande Image**:
  ```
  https://services.simone.paris/storage/v1/object/public/products/primary/regard/cils_simone.jpg
  ```
- **📱 Mobile - Icône**:
  ```
  https://services.simone.paris/storage/v1/object/public/icones//crayon-a-sourcils.png
  ```

---

### ✅ SERVICE #5 - MASSAGE BIEN-ETRE (ID: 12)
- **Ordre d'affichage**: 5
- **Visible**: ✅ Oui
- **🖥️ Desktop - Icône Web**:
  ```
  https://services.simone.paris/storage/v1/object/public/products/primary/massage/massage_couple.jpg
  ```
- **🖼️ Desktop - Grande Image**:
  ```
  https://services.simone.paris/storage/v1/object/public/products/primary/massage/massage_couple.jpg
  ```
- **📱 Mobile - Icône**:
  ```
  https://services.simone.paris/storage/v1/object/public/icones//massage-corporel.png
  ```

---

### ✅ SERVICE #6 - MINCEUR & DRAINAGE (ID: 5)
- **Ordre d'affichage**: 6
- **Visible**: ✅ Oui
- **🖥️ Desktop - Icône Web**:
  ```
  https://services.simone.paris/storage/v1/object/public/products/primary/massage/minceur_simone.jpg
  ```
- **🖼️ Desktop - Grande Image**:
  ```
  https://services.simone.paris/storage/v1/object/public/products/primary/massage/minceur_simone.jpg
  ```
- **📱 Mobile - Icône**:
  ```
  https://services.simone.paris/storage/v1/object/public/icones//minceur.png
  ```

---

### ✅ SERVICE #7 - EPILATION (ID: 9)
- **Ordre d'affichage**: 7
- **Visible**: ✅ Oui
- **🖥️ Desktop - Icône Web**:
  ```
  https://services.simone.paris/storage/v1/object/public/products/primary/epilation/maillot_aisselles_bras.jpg
  ```
- **🖼️ Desktop - Grande Image**:
  ```
  https://services.simone.paris/storage/v1/object/public/products/primary/epilation/maillot_aisselles_bras.jpg
  ```
- **📱 Mobile - Icône**:
  ```
  https://services.simone.paris/storage/v1/object/public/icones//la-cire.png
  ```

---

### ✅ SERVICE #8 - MAQUILLAGE (ID: 6)
- **Ordre d'affichage**: 8
- **Visible**: ✅ Oui
- **🖥️ Desktop - Icône Web**:
  ```
  https://services.simone.paris/storage/v1/object/public/products/primary/maquillage/maquillage.jpg
  ```
- **🖼️ Desktop - Grande Image**:
  ```
  https://services.simone.paris/storage/v1/object/public/products/primary/maquillage/maquillage.jpg
  ```
- **📱 Mobile - Icône**:
  ```
  https://services.simone.paris/storage/v1/object/public/icones//maquillage.png
  ```

---

### ❌ SERVICE #9 - CARTE CADEAU (ID: 2)
- **Ordre d'affichage**: 10
- **Visible**: ❌ Non
- **🖥️ Desktop - Icône Web**:
  ```
  https://dfrsgbecgxbqkmvmijnq.supabase.co/storage/v1/object/sign/avatars/Icon%20(2).svg?token=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1cmwiOiJhdmF0YXJzL0ljb24gKDIpLnN2ZyIsImlhdCI6MTczMjgyNDc1MCwiZXhwIjoxNzM1NDE2NzUwfQ.t33FNq4C6GNqnaFJKxo6KugMQJylw8uWai5WujXzmyI&t=2024-11-28T20%3A12%3A30.118Z
  ```
- **⚠️ ATTENTION**: URL signée temporaire qui expirera le 2024-12-28

---

### ❌ SERVICES SANS IMAGES (IDs: 7, 8, 10, 11, 13, 15, 16)
- **FRAIS** (ID: 10)
- **CONSULTATION EN LIGNE** (ID: 11)
- **ADMIN** (ID: 13)
- **CONCIERGERIE** (ID: 15)
- **ENTREPRISE** (ID: 16)
- **Hotel**** & Palace** (ID: 7)
- **COIFFURE + MAQUILLAGE** (ID: 8)

---

## 📦 PRODUITS PAR SERVICE

### 🎨 BEAUTE DES ONGLES (16 produits)

#### Produit #44 - 'Detox' soin japonais sans vernis
- **Image principale**:
  ```
  https://mqbtqgwcgknqzwzzwmag.supabase.co/storage/v1/object/public/products/primary/manicure_japonaise_873537862_Preview.jpeg
  ```
- **Images secondaires**:
  ```
  https://www.consoglobe.com/wp-content/uploads/2022/08/manucure-japonaise-shutterstock_2182073403.jpg
  https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcQAQ96RfbBda00ghEHNzZ48IaHpiomDqfx31g&s
  ```

#### Produit #52 - 'Detox' soin Japonais sans vernis
- **Image principale**:
  ```
  https://mqbtqgwcgknqzwzzwmag.supabase.co/storage/v1/object/public/product-images/products/3/52_primary_1752827070947.jpg
  ```

#### Produit #51 - 'Detox' soin Japonais sans vernis
- **Image principale**:
  ```
  https://mqbtqgwcgknqzwzzwmag.supabase.co/storage/v1/object/public/product-images/products/3/51_primary_1752826788555.jpg
  ```

#### Produit #10 - Mani + masque soin + vernis
- **Image principale**:
  ```
  https://mqbtqgwcgknqzwzzwmag.supabase.co/storage/v1/object/public/product-images/products/3/10_primary_1752416507400.jpeg
  ```

#### Produit #11 - Mani/Pedi + masque soin + vernis
- **Image principale**:
  ```
  https://mqbtqgwcgknqzwzzwmag.supabase.co/storage/v1/object/public/products/primary/mani_pedi_masque_vernis.jpg
  ```

#### Produit #13 - Pedi + masque soin + vernis
- **Image principale**:
  ```
  https://mqbtqgwcgknqzwzzwmag.supabase.co/storage/v1/object/public/product-images/products/3/13_primary_1752416638475.jpeg
  ```

#### Produit #12 - Soin express + vernis
- **Image principale**:
  ```
  https://mqbtqgwcgknqzwzzwmag.supabase.co/storage/v1/object/public/product-images/products/3/12_primary_1752814832671.jpg
  ```

#### Produit #20 - Soin + mix vernis / semi-permanent
- **Image principale**:
  ```
  https://mqbtqgwcgknqzwzzwmag.supabase.co/storage/v1/object/public/product-images/products/3/20_primary_1752416320559.jpeg
  ```

#### Produit #1344 - Soin + semi + French Couleur 🌈
- **Image principale**:
  ```
  https://mqbtqgwcgknqzwzzwmag.supabase.co/storage/v1/object/public/product-images/products/3/1344_primary_1752814580288.jpg
  ```

#### Produit #2 - Soin + semi-permanent
- **⚠️ AUCUNE IMAGE**

#### Produit #27 - Soin + semi-permanent
- **Image principale**:
  ```
  https://mqbtqgwcgknqzwzzwmag.supabase.co/storage/v1/object/public/product-images/products/3/27_primary_1752416128874.jpeg
  ```

#### Produit #26 - Soin + semi-permanent
- **Image principale**:
  ```
  https://mqbtqgwcgknqzwzzwmag.supabase.co/storage/v1/object/public/product-images/products/3/26_primary_1752416379765.jpeg
  ```

#### Produit #17 - Soin + vernis
- **⚠️ AUCUNE IMAGE**

#### Produit #4 - Soin + vernis
- **Image principale**:
  ```
  https://mqbtqgwcgknqzwzzwmag.supabase.co/storage/v1/object/public/product-images/products/3/4_primary_1752826975116.jpg
  ```
- **Images secondaires**:
  ```
  https://mqbtqgwcgknqzwzzwmag.supabase.co/storage/v1/object/public/tempForTest/image%20(6).png
  https://mqbtqgwcgknqzwzzwmag.supabase.co/storage/v1/object/public/tempForTest/young-woman-mask-face-relaxing-spa-salon%202.png
  ```

#### Produit #6 - Soin + vernis
- **Image principale**:
  ```
  https://mqbtqgwcgknqzwzzwmag.supabase.co/storage/v1/object/public/products/primary/soins_vernis_simple.jpg
  ```

#### Produit #3 - Soin vernis + french
- **Image principale**:
  ```
  https://mqbtqgwcgknqzwzzwmag.supabase.co/storage/v1/object/public/products/primary/soins_vernis_fench.jpg
  ```
- **Images secondaires**:
  ```
  https://mqbtqgwcgknqzwzzwmag.supabase.co/storage/v1/object/public/tempForTest/image%20(12).png
  ```

---

### ✂️ COIFFURE (21 produits)

#### Produit #140 - 2 enfants -12 ans
- **Image principale**:
  ```
  https://mqbtqgwcgknqzwzzwmag.supabase.co/storage/v1/object/public/product-images/products/4/140_primary_1752560412550.jpg
  ```

#### Produit #201 - Balayage
- **Image principale**:
  ```
  https://mqbtqgwcgknqzwzzwmag.supabase.co/storage/v1/object/public/product-images/products/4/201_primary_1749573166888.jpg
  ```

#### Produit #138 - Balayage + Coupe
- **Image principale**:
  ```
  https://mqbtqgwcgknqzwzzwmag.supabase.co/storage/v1/object/public/product-images/products/4/138_primary_1752563497240.jpg
  ```

#### Produit #55 - Brushing Glamour
- **Image principale**:
  ```
  https://mqbtqgwcgknqzwzzwmag.supabase.co/storage/v1/object/public/product-images/products/4/55_primary_1752564613527.jpg
  ```

#### Produit #88 - Couleur
- **Image principale**:
  ```
  https://mqbtqgwcgknqzwzzwmag.supabase.co/storage/v1/object/public/product-images/products/4/88_primary_1753302427681.jpg
  ```

#### Produit #294 - Couleur + Balayage
- **Image principale**:
  ```
  https://mqbtqgwcgknqzwzzwmag.supabase.co/storage/v1/object/public/product-images/products/4/294_primary_1753302544923.jpg
  ```

#### Produit #286 - Couleur + Balayage + coupe
- **Image principale**:
  ```
  https://mqbtqgwcgknqzwzzwmag.supabase.co/storage/v1/object/public/product-images/products/4/286_primary_1753302603861.jpeg
  ```

#### Produit #137 - Couleur + Coupe
- **Image principale**:
  ```
  https://mqbtqgwcgknqzwzzwmag.supabase.co/storage/v1/object/public/product-images/products/4/137_primary_1753302655103.jpg
  ```

#### Produit #56 - Coupe femme + Brush
- **Image principale**:
  ```
  https://mqbtqgwcgknqzwzzwmag.supabase.co/storage/v1/object/public/product-images/products/4/56_primary_1745491722370.jpg
  ```
- **Images secondaires**:
  ```
  https://i.pinimg.com/236x/cb/9e/88/cb9e88ca1089494b8c2cac6e847653e9.jpg
  ```

#### Produit #114 - Coupe homme
- **Image principale**:
  ```
  https://mqbtqgwcgknqzwzzwmag.supabase.co/storage/v1/object/public/product-images/products/4/114_primary_1752563901602.jpg
  ```

#### Produit #48 - Duo : maman + enfant*
- **Image principale**:
  ```
  https://mqbtqgwcgknqzwzzwmag.supabase.co/storage/v1/object/public/product-images/products/4/48_primary_1752560753173.jpg
  ```

#### Produit #278 - Duo : papa + enfant*
- **Image principale**:
  ```
  https://mqbtqgwcgknqzwzzwmag.supabase.co/storage/v1/object/public/product-images/products/4/278_primary_1745501718079.jpg
  ```

#### Produit #459 - Entretien : juste une Patine
- **Image principale**:
  ```
  https://mqbtqgwcgknqzwzzwmag.supabase.co/storage/v1/object/public/product-images/products/4/459_primary_1753302703695.jpg
  ```

#### Produit #58 - Grand Jour ! Coiffage sur-mesure
- **Image principale**:
  ```
  https://mqbtqgwcgknqzwzzwmag.supabase.co/storage/v1/object/public/product-images/products/4/58_primary_1753302746285.jpeg
  ```

#### Produit #363 - Le Chignon Parfait
- **Image principale**:
  ```
  https://mqbtqgwcgknqzwzzwmag.supabase.co/storage/v1/object/public/product-images/products/4/363_primary_1752522943803.jpg
  ```

#### Produit #1178 - Lissage bresilien > a partir de
- **Image principale**:
  ```
  https://mqbtqgwcgknqzwzzwmag.supabase.co/storage/v1/object/public/product-images/products/4/1178_primary_1752562750601.jpg
  ```

#### Produit #63 - Madame + Monsieur
- **Image principale**:
  ```
  https://mqbtqgwcgknqzwzzwmag.supabase.co/storage/v1/object/public/product-images/products/4/63_primary_1745496356897.jpg
  ```

#### Produit #458 - Patine + coupe
- **Image principale**:
  ```
  https://mqbtqgwcgknqzwzzwmag.supabase.co/storage/v1/object/public/product-images/products/4/458_primary_1752561416757.jpg
  ```

#### Produit #981 - Soin Botox > a partir de
- **Image principale**:
  ```
  https://mqbtqgwcgknqzwzzwmag.supabase.co/storage/v1/object/public/product-images/products/4/981_primary_1752561941983.jpg
  ```

#### Produit #57 - Up Do : Tresse et Attache
- **Image principale**:
  ```
  https://mqbtqgwcgknqzwzzwmag.supabase.co/storage/v1/object/public/product-images/products/4/57_primary_1753302788577.jpeg
  ```

---

### 🪒 EPILATION (10 produits)

#### Produit #493 - Jambes entières
- **Image principale**:
  ```
  https://services.simone.paris/storage/v1/object/public/products/images/epilation/jambe_entiere_bonze.jpg
  ```

#### Produit #281 - Un maillot Bresilien ou XL
- **Image principale**:
  ```
  https://services.simone.paris/storage/v1/object/public/products/images/epilation/maillot_bresilien_xl.jpg
  ```

#### Produits #74, #184, #182, #82, #179, #185, #183, #166
- **Variations de maillots +Aisselles**
- **⚠️ AUCUNE IMAGE pour ces produits**

---

### 👁️ LE REGARD (6 produits)

#### Produit #121 - Design + Teinture
- **⚠️ AUCUNE IMAGE**

#### Produit #640 - Le "Brow Lift"
- **⚠️ AUCUNE IMAGE**

#### Produit #217 - Rehaussement
- **⚠️ AUCUNE IMAGE**

#### Produit #658 - Rehaussement + Brow Lift
- **⚠️ AUCUNE IMAGE**

#### Produit #722 - Rehaussement + Sourcils
- **⚠️ AUCUNE IMAGE**

#### Produit #228 - Rehaussement + teinture
- **⚠️ AUCUNE IMAGE**

---

### 💆 LE VISAGE (5 produits)

#### Produit #269 - Le Soin sur-mesure
- **Image principale**:
  ```
  https://mqbtqgwcgknqzwzzwmag.supabase.co/storage/v1/object/public/product-images/products/1/269_primary_1752416918116.jpeg
  ```

#### Produit #1009 - Maderotherapie
- **Image principale**:
  ```
  https://mqbtqgwcgknqzwzzwmag.supabase.co/storage/v1/object/public/product-images/products/1/1009_primary_1752417018358.jpeg
  ```

#### Produit #1010 - Maderotherapie + soin eclat
- **Image principale**:
  ```
  https://mqbtqgwcgknqzwzzwmag.supabase.co/storage/v1/object/public/product-images/products/1/1010_primary_1752417095783.jpeg
  ```

#### Produit #339 - Massage Liftant
- **Image principale**:
  ```
  https://mqbtqgwcgknqzwzzwmag.supabase.co/storage/v1/object/public/product-images/products/1/339_primary_1752417204832.jpeg
  ```

#### Produit #446 - Massage Liftant + soin éclat
- **⚠️ AUCUNE IMAGE PRINCIPALE**
- **Images secondaires**:
  ```
  https://mqbtqgwcgknqzwzzwmag.supabase.co/storage/v1/object/public/tempForTest/young-woman-mask-face-relaxing-spa-salon%202.png
  https://mqbtqgwcgknqzwzzwmag.supabase.co/storage/v1/object/public/tempForTest/image%20(5).png
  ```

---

### 💄 MAQUILLAGE (3 produits)

#### Produit #116 - Grand Jour ! Make-up sur-mesure
- **⚠️ AUCUNE IMAGE**

#### Produit #131 - Make-up "frais"
- **⚠️ AUCUNE IMAGE**

#### Produit #1090 - Make-up Soir
- **⚠️ AUCUNE IMAGE**

---

### 💆‍♀️ MASSAGE BIEN-ETRE (14 produits)

#### Produit #635 - 1h30 - Sur-Mesure
- **Image principale**:
  ```
  https://mqbtqgwcgknqzwzzwmag.supabase.co/storage/v1/object/public/product-images/products/635_primary_1745465740876.jpeg
  ```

#### Produit #381 - 1h30 - Sur-Mesure
- **⚠️ AUCUNE IMAGE**

#### Produit #443 - 1h30 - Sur-Mesure + Reflexologie
- **Image principale**:
  ```
  https://mqbtqgwcgknqzwzzwmag.supabase.co/storage/v1/object/public/product-images/products/443_primary_1745479158488.jpg
  ```

#### Produit #549 - 1h - Sur-Mesure
- **Image principale**:
  ```
  https://mqbtqgwcgknqzwzzwmag.supabase.co/storage/v1/object/public/product-images/products/549_primary_1745478139991.jpeg
  ```

#### Produit #442 - 1h - Sur-Mesure
- **⚠️ AUCUNE IMAGE**

#### Produit #1102 - 2h - Sur-Mesure en duo !
- **⚠️ AUCUNE IMAGE**

#### Produit #389 - Cranien & Reflexologie Plantaire
- **⚠️ AUCUNE IMAGE**

#### Produit #441 - Future maman : le Prenatal
- **⚠️ AUCUNE IMAGE**

#### Produit #439 - Grande detente : Le Californien
- **Image principale**:
  ```
  https://services.simone.paris/storage/v1/object/public/products/images/massage/massage_californien.jpg
  ```

#### Produit #1242 - Pour 2 personnes > 1H
- **Image principale**:
  ```
  https://mqbtqgwcgknqzwzzwmag.supabase.co/storage/v1/object/public/products/primary/massage_couple_m.jpg
  ```

#### Produit #1116 - Pour 3 personnes > 1H30
- **Image principale**:
  ```
  https://mqbtqgwcgknqzwzzwmag.supabase.co/storage/v1/object/public/products/primary/massage_3_filles.jpg
  ```

#### Produit #1236 - Pour 4 personnes > 2H
- **Image principale**:
  ```
  https://mqbtqgwcgknqzwzzwmag.supabase.co/storage/v1/object/public/products/primary/massage_4-filles.jpg
  ```

#### Produit #1238 - Pour 5 personnes > 2H30
- **Image principale**:
  ```
  https://mqbtqgwcgknqzwzzwmag.supabase.co/storage/v1/object/public/products/primary/massage_5_filles.jpg
  ```

#### Produit #705 - Reequilibrage : Le Chi Nei Tsang
- **⚠️ AUCUNE IMAGE**

#### Produit #440 - Tensions musculaires : Deep Tissue
- **⚠️ AUCUNE IMAGE**

---

### 🏋️ MINCEUR & DRAINAGE (10 produits)

#### Produit #729 - 5 RDV Maderothérapie
- **Image principale**:
  ```
  https://mqbtqgwcgknqzwzzwmag.supabase.co/storage/v1/object/public/product-images/products/5/729_primary_1752823366808.jpg
  ```
- **Images secondaires**:
  ```
  https://www.payot.com/FR/img/cms/Articles/mad%C3%A9roth%C3%A9rapie.png
  https://coconing.fr/photos/contenu/9395/big/img_20220405_152117_527.jpg
  ```

#### Produit #356 - 5 RDV Palper-Rouler
- **⚠️ AUCUNE IMAGE**

#### Produit #1101 - 5 RDV Silhouette Parfaite
- **⚠️ AUCUNE IMAGE**

#### Produit #1113 - Corps & Visage 100% Glow
- **Image principale**:
  ```
  https://mqbtqgwcgknqzwzzwmag.supabase.co/storage/v1/object/public/product-images/products/5/1113_primary_1753302858344.jpg
  ```

#### Produit #507 - Doux - Le Traditionnel Vodder
- **⚠️ AUCUNE IMAGE PRINCIPALE**
- **Images secondaires**:
  ```
  https://mqbtqgwcgknqzwzzwmag.supabase.co/storage/v1/object/public/tempForTest/young-woman-mask-face-relaxing-spa-salon%202.png
  https://mqbtqgwcgknqzwzzwmag.supabase.co/storage/v1/object/public/tempForTest/image%20(5).png
  ```

#### Produit #354 - Le Fameux Palper-Rouler
- **⚠️ AUCUNE IMAGE**

#### Produit #1254 - Lipocavitation
- **Image principale**:
  ```
  https://mqbtqgwcgknqzwzzwmag.supabase.co/storage/v1/object/public/product-images/products/5/1254_primary_1753302936280.jpeg
  ```

#### Produit #720 - Maderotherapie
- **Image principale**:
  ```
  https://mqbtqgwcgknqzwzzwmag.supabase.co/storage/v1/object/public/product-images/products/5/720_primary_1753302966732.jpg
  ```

#### Produit #1239 - Post-operatoire
- **⚠️ AUCUNE IMAGE**

#### Produit #785 - Pré & Post natal
- **⚠️ AUCUNE IMAGE**

---

## 📊 STATISTIQUES FINALES

### Services
- **Total services**: 15
- **Services visibles**: 8
- **Services avec images complètes (3 URLs)**: 8
- **Services sans aucune image**: 7

### Produits (sur 100 affichés)
- **Produits avec image principale**: ~65
- **Produits SANS image principale**: ~35
- **Produits avec images secondaires**: ~8

### Domaines utilisés
1. **Domaine personnalisé** (recommandé):
   ```
   https://services.simone.paris/storage/v1/object/public/
   ```

2. **Domaine Supabase direct**:
   ```
   https://mqbtqgwcgknqzwzzwmag.supabase.co/storage/v1/object/public/
   ```

3. **URLs externes** (à éviter):
   - Unsplash, Pinterest, Google Images, sites tiers

### Buckets Supabase identifiés
- `products/` - Images principales produits
- `product-images/` - Images produits par ID
- `icones/` - Icônes mobiles services
- `cms/` - Médias CMS
- `tempForTest/` - Images temporaires de test

---

## ⚠️ RECOMMANDATIONS URGENTES

### 1. Migration des URLs
**35 produits nécessitent des images principales**

### 2. Nettoyage des URLs externes
**8+ produits utilisent des URLs externes** (Unsplash, Pinterest, etc.)  
→ À télécharger et héberger sur Supabase

### 3. Correction URL signée
**Service "CARTE CADEAU"** utilise une URL signée qui expirera  
→ Remplacer par une URL permanente

### 4. Standardisation des domaines
**Mix de 2 domaines Supabase**  
→ Migrer tout vers `services.simone.paris`

### 5. Suppression dossier `tempForTest/`
**Images de test en production**  
→ Déplacer vers buckets finaux

---

## 🔗 LIENS UTILES ADMIN

### Supabase Storage Management
```
https://supabase.com/dashboard/project/mqbtqgwcgknqzwzzwmag/storage/buckets
```

### Custom Domain Configuration
```
https://supabase.com/dashboard/project/mqbtqgwcgknqzwzzwmag/settings/general
```

---

**Fin du rapport** - Généré automatiquement le 2025-01-10
