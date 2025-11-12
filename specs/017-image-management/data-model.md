# Data Model: Image Management System

**Feature**: 017-image-management
**Created**: 2025-01-11
**Database**: PostgreSQL (Supabase)

## Overview

This document defines the complete database schema for the image management system, including:
- 4 new tables: `service_images`, `product_images`, `product_variants`, `conversation_attachments`
- Updates to existing `platform_config` table
- Row Level Security (RLS) policies
- Indexes for performance
- SQL comments in French for business context

---

## Entity Relationship Diagram

```mermaid
erDiagram
    services ||--o{ service_images : "has"
    products ||--o{ product_images : "has"
    products ||--o{ product_variants : "has"
    product_variants ||--o{ product_images : "has variant-specific"
    conversations ||--o{ conversation_attachments : "contains"
    profiles ||--o{ service_images : "uploaded_by"
    profiles ||--o{ product_images : "uploaded_by"
    profiles ||--o{ conversation_attachments : "uploaded_by"
    profiles ||--o{ conversation_attachments : "moderated_by"

    service_images {
        bigint id PK
        bigint service_id FK
        varchar storage_path
        int display_order
        boolean is_primary
        varchar alt_text
        uuid uploaded_by FK
        timestamptz uploaded_at
        int file_size_bytes
        int width
        int height
        timestamptz deleted_at
    }

    product_images {
        bigint id PK
        bigint product_id FK
        bigint variant_id FK_NULLABLE
        varchar storage_path
        int display_order
        boolean is_primary
        varchar alt_text
        uuid uploaded_by FK
        timestamptz uploaded_at
        int file_size_bytes
        int width
        int height
        timestamptz deleted_at
    }

    product_variants {
        bigint id PK
        bigint product_id FK
        varchar variant_name
        varchar variant_type
        varchar sku
        timestamptz created_at
    }

    conversation_attachments {
        bigint id PK
        bigint conversation_id FK
        bigint booking_id FK_NULLABLE
        uuid uploaded_by_user_id FK
        varchar storage_path
        varchar alt_text
        varchar moderation_status
        uuid moderated_by FK_NULLABLE
        timestamptz moderated_at
        text moderation_reason
        int file_size_bytes
        timestamptz uploaded_at
        timestamptz deleted_at
    }
```

---

## Table Definitions

### 1. `service_images`

**Purpose**: Stores images associated with services (coiffure, ongles, massage, etc.)

```sql
CREATE TABLE service_images (
  id BIGINT PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
  service_id BIGINT NOT NULL REFERENCES services(id) ON DELETE CASCADE,
  storage_path VARCHAR(500) NOT NULL,
  display_order INT NOT NULL DEFAULT 0,
  is_primary BOOLEAN NOT NULL DEFAULT false,
  alt_text VARCHAR(125) NOT NULL,
  uploaded_by UUID NOT NULL REFERENCES profiles(id),
  uploaded_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  file_size_bytes INT NOT NULL,
  width INT,
  height INT,
  deleted_at TIMESTAMPTZ,

  -- Constraints
  CONSTRAINT service_images_alt_text_length CHECK (LENGTH(alt_text) <= 125),
  CONSTRAINT service_images_file_size_positive CHECK (file_size_bytes > 0),
  CONSTRAINT service_images_dimensions_positive CHECK (
    (width IS NULL AND height IS NULL) OR (width > 0 AND height > 0)
  )
);

-- Comments (French for business context)
COMMENT ON TABLE service_images IS 'Images associées aux services de la plateforme avec métadonnées';
COMMENT ON COLUMN service_images.service_id IS 'Référence au service (coiffure, ongles, etc.)';
COMMENT ON COLUMN service_images.storage_path IS 'Chemin relatif dans le bucket Supabase Storage (ex: services/4/coiffure_123.jpg)';
COMMENT ON COLUMN service_images.display_order IS 'Ordre d''affichage dans la galerie (0 = premier)';
COMMENT ON COLUMN service_images.is_primary IS 'Image principale affichée par défaut (une seule par service)';
COMMENT ON COLUMN service_images.alt_text IS 'Texte alternatif pour accessibilité et SEO (max 125 caractères WCAG)';
COMMENT ON COLUMN service_images.uploaded_by IS 'Utilisateur ayant uploadé l''image (admin/manager)';
COMMENT ON COLUMN service_images.file_size_bytes IS 'Taille du fichier en octets (validation max 5MB)';
COMMENT ON COLUMN service_images.width IS 'Largeur en pixels (extrait après upload)';
COMMENT ON COLUMN service_images.height IS 'Hauteur en pixels (extrait après upload)';
COMMENT ON COLUMN service_images.deleted_at IS 'Date de suppression (soft delete pour récupération)';

-- Indexes
CREATE INDEX idx_service_images_service_id ON service_images(service_id) WHERE deleted_at IS NULL;
CREATE INDEX idx_service_images_display_order ON service_images(service_id, display_order) WHERE deleted_at IS NULL;
CREATE INDEX idx_service_images_is_primary ON service_images(service_id, is_primary) WHERE is_primary = true AND deleted_at IS NULL;
CREATE INDEX idx_service_images_deleted ON service_images(deleted_at) WHERE deleted_at IS NOT NULL;

-- Unique constraint: Only one primary image per service
CREATE UNIQUE INDEX idx_service_images_unique_primary
  ON service_images(service_id)
  WHERE is_primary = true AND deleted_at IS NULL;
```

### 2. `product_images`

**Purpose**: Stores images for e-commerce products and their variants

```sql
CREATE TABLE product_images (
  id BIGINT PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
  product_id BIGINT NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  variant_id BIGINT REFERENCES product_variants(id) ON DELETE CASCADE,
  storage_path VARCHAR(500) NOT NULL,
  display_order INT NOT NULL DEFAULT 0,
  is_primary BOOLEAN NOT NULL DEFAULT false,
  alt_text VARCHAR(125) NOT NULL,
  uploaded_by UUID NOT NULL REFERENCES profiles(id),
  uploaded_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  file_size_bytes INT NOT NULL,
  width INT,
  height INT,
  deleted_at TIMESTAMPTZ,

  -- Constraints
  CONSTRAINT product_images_alt_text_length CHECK (LENGTH(alt_text) <= 125),
  CONSTRAINT product_images_file_size_positive CHECK (file_size_bytes > 0),
  CONSTRAINT product_images_dimensions_positive CHECK (
    (width IS NULL AND height IS NULL) OR (width > 0 AND height > 0)
  )
);

-- Comments
COMMENT ON TABLE product_images IS 'Images des produits e-commerce avec support des variations';
COMMENT ON COLUMN product_images.product_id IS 'Référence au produit';
COMMENT ON COLUMN product_images.variant_id IS 'Référence à la variation (NULL = image du produit principal)';
COMMENT ON COLUMN product_images.storage_path IS 'Chemin relatif dans le bucket (ex: products/123/variant_456_red.jpg)';
COMMENT ON COLUMN product_images.display_order IS 'Ordre d''affichage (0 = premier, scope: product_id + variant_id)';
COMMENT ON COLUMN product_images.is_primary IS 'Image principale (une par produit ou variation)';
COMMENT ON COLUMN product_images.alt_text IS 'Texte alternatif (ex: "Vernis à ongles rouge brillant - Simone Paris")';
COMMENT ON COLUMN product_images.uploaded_by IS 'Admin/manager ayant uploadé l''image';
COMMENT ON COLUMN product_images.file_size_bytes IS 'Taille en octets';
COMMENT ON COLUMN product_images.deleted_at IS 'Soft delete timestamp';

-- Indexes
CREATE INDEX idx_product_images_product_id ON product_images(product_id) WHERE deleted_at IS NULL;
CREATE INDEX idx_product_images_variant_id ON product_images(variant_id) WHERE variant_id IS NOT NULL AND deleted_at IS NULL;
CREATE INDEX idx_product_images_display_order ON product_images(product_id, COALESCE(variant_id, 0), display_order) WHERE deleted_at IS NULL;
CREATE INDEX idx_product_images_deleted ON product_images(deleted_at) WHERE deleted_at IS NOT NULL;

-- Unique constraint: One primary per product (when variant_id IS NULL)
CREATE UNIQUE INDEX idx_product_images_unique_primary_product
  ON product_images(product_id)
  WHERE is_primary = true AND variant_id IS NULL AND deleted_at IS NULL;

-- Unique constraint: One primary per variant
CREATE UNIQUE INDEX idx_product_images_unique_primary_variant
  ON product_images(variant_id)
  WHERE is_primary = true AND variant_id IS NOT NULL AND deleted_at IS NULL;
```

### 3. `product_variants`

**Purpose**: Stores product variations (color, size, etc.) with their own images

```sql
CREATE TABLE product_variants (
  id BIGINT PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
  product_id BIGINT NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  variant_name VARCHAR(100) NOT NULL,
  variant_type VARCHAR(50) NOT NULL,
  sku VARCHAR(100),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  -- Constraints
  CONSTRAINT product_variants_variant_name_not_empty CHECK (LENGTH(TRIM(variant_name)) > 0),
  CONSTRAINT product_variants_variant_type_check CHECK (
    variant_type IN ('color', 'size', 'material', 'style', 'other')
  )
);

-- Comments
COMMENT ON TABLE product_variants IS 'Variations des produits (couleur, taille, etc.) avec images spécifiques';
COMMENT ON COLUMN product_variants.product_id IS 'Référence au produit parent';
COMMENT ON COLUMN product_variants.variant_name IS 'Nom de la variation (ex: "Rouge", "Large", "Coton")';
COMMENT ON COLUMN product_variants.variant_type IS 'Type de variation (color, size, material, style, other)';
COMMENT ON COLUMN product_variants.sku IS 'Stock Keeping Unit (code produit unique, optionnel)';

-- Indexes
CREATE INDEX idx_product_variants_product_id ON product_variants(product_id);
CREATE INDEX idx_product_variants_sku ON product_variants(sku) WHERE sku IS NOT NULL;

-- Unique constraint: Prevent duplicate variant names within a product
CREATE UNIQUE INDEX idx_product_variants_unique_name
  ON product_variants(product_id, variant_type, variant_name);
```

### 4. `conversation_attachments`

**Purpose**: Stores user-generated content (UGC) images uploaded in conversation threads with moderation workflow

```sql
CREATE TABLE conversation_attachments (
  id BIGINT PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
  conversation_id BIGINT NOT NULL REFERENCES conversations(id) ON DELETE CASCADE,
  booking_id BIGINT REFERENCES bookings(id) ON DELETE SET NULL,
  uploaded_by_user_id UUID NOT NULL REFERENCES profiles(id),
  storage_path VARCHAR(500) NOT NULL,
  alt_text VARCHAR(125),
  moderation_status VARCHAR(50) NOT NULL DEFAULT 'pending',
  moderated_by UUID REFERENCES profiles(id),
  moderated_at TIMESTAMPTZ,
  moderation_reason TEXT,
  file_size_bytes INT NOT NULL,
  uploaded_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  deleted_at TIMESTAMPTZ,

  -- Constraints
  CONSTRAINT conversation_attachments_alt_text_length CHECK (
    alt_text IS NULL OR LENGTH(alt_text) <= 125
  ),
  CONSTRAINT conversation_attachments_moderation_status_check CHECK (
    moderation_status IN ('pending', 'approved', 'rejected', 'under_review')
  ),
  CONSTRAINT conversation_attachments_file_size_positive CHECK (file_size_bytes > 0),
  CONSTRAINT conversation_attachments_moderation_logic CHECK (
    (moderation_status = 'pending' AND moderated_by IS NULL AND moderated_at IS NULL) OR
    (moderation_status != 'pending' AND moderated_by IS NOT NULL AND moderated_at IS NOT NULL)
  )
);

-- Comments
COMMENT ON TABLE conversation_attachments IS 'Photos uploadées par les clients dans les conversations avec workflow de modération';
COMMENT ON COLUMN conversation_attachments.conversation_id IS 'Référence à la conversation (thread de messages)';
COMMENT ON COLUMN conversation_attachments.booking_id IS 'Référence optionnelle à la réservation associée';
COMMENT ON COLUMN conversation_attachments.uploaded_by_user_id IS 'Client ayant uploadé la photo';
COMMENT ON COLUMN conversation_attachments.storage_path IS 'Chemin dans le bucket (ex: conversations/789/photo_123.jpg)';
COMMENT ON COLUMN conversation_attachments.alt_text IS 'Texte alternatif (généré automatiquement si vide)';
COMMENT ON COLUMN conversation_attachments.moderation_status IS 'Statut: pending, approved, rejected, under_review';
COMMENT ON COLUMN conversation_attachments.moderated_by IS 'Admin/manager ayant modéré';
COMMENT ON COLUMN conversation_attachments.moderated_at IS 'Date de modération';
COMMENT ON COLUMN conversation_attachments.moderation_reason IS 'Raison du rejet (si rejected)';
COMMENT ON COLUMN conversation_attachments.deleted_at IS 'Soft delete (utilisé pour contenu inapproprié)';

-- Indexes
CREATE INDEX idx_conversation_attachments_conversation_id ON conversation_attachments(conversation_id) WHERE deleted_at IS NULL;
CREATE INDEX idx_conversation_attachments_user_id ON conversation_attachments(uploaded_by_user_id) WHERE deleted_at IS NULL;
CREATE INDEX idx_conversation_attachments_moderation_status ON conversation_attachments(moderation_status, uploaded_at DESC) WHERE deleted_at IS NULL;
CREATE INDEX idx_conversation_attachments_moderated_by ON conversation_attachments(moderated_by) WHERE moderated_by IS NOT NULL;
CREATE INDEX idx_conversation_attachments_deleted ON conversation_attachments(deleted_at) WHERE deleted_at IS NOT NULL;
```

### 5. `platform_config` (Updates to Existing Table)

**Purpose**: Add configuration keys for image management settings

```sql
-- Table already exists, add new configuration rows
INSERT INTO platform_config (config_key, config_value, description, updated_at, updated_by)
VALUES
  ('max_file_size_mb', '5', 'Taille maximale des fichiers image en MB', NOW(), NULL),
  ('max_images_per_entity', '10', 'Nombre maximal d''images par service/produit/conversation', NOW(), NULL),
  ('storage_quota_alert_percent', '80', 'Pourcentage de quota de stockage déclenchant une alerte', NOW(), NULL),
  ('ugc_moderation_required', 'true', 'Activer la modération obligatoire des photos UGC', NOW(), NULL),
  ('alt_text_generation_enabled', 'true', 'Activer la génération automatique d''alt-text via IA', NOW(), NULL)
ON CONFLICT (config_key) DO UPDATE SET
  config_value = EXCLUDED.config_value,
  description = EXCLUDED.description,
  updated_at = EXCLUDED.updated_at;
```

---

## Row Level Security (RLS) Policies

### service_images

```sql
-- Enable RLS
ALTER TABLE service_images ENABLE ROW LEVEL SECURITY;

-- Policy: Admins and managers can do everything
CREATE POLICY "Admins and managers full access on service_images"
  ON service_images
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
        AND profiles.role IN ('admin', 'manager')
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
        AND profiles.role IN ('admin', 'manager')
    )
  );

-- Policy: Everyone can view non-deleted service images
CREATE POLICY "Public can view service images"
  ON service_images
  FOR SELECT
  TO authenticated, anon
  USING (deleted_at IS NULL);
```

### product_images

```sql
-- Enable RLS
ALTER TABLE product_images ENABLE ROW LEVEL SECURITY;

-- Policy: Admins and managers can do everything
CREATE POLICY "Admins and managers full access on product_images"
  ON product_images
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
        AND profiles.role IN ('admin', 'manager')
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
        AND profiles.role IN ('admin', 'manager')
    )
  );

-- Policy: Everyone can view non-deleted product images
CREATE POLICY "Public can view product images"
  ON product_images
  FOR SELECT
  TO authenticated, anon
  USING (deleted_at IS NULL);
```

### product_variants

```sql
-- Enable RLS
ALTER TABLE product_variants ENABLE ROW LEVEL SECURITY;

-- Policy: Admins and managers can manage variants
CREATE POLICY "Admins and managers full access on product_variants"
  ON product_variants
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
        AND profiles.role IN ('admin', 'manager')
    )
  );

-- Policy: Everyone can view variants
CREATE POLICY "Public can view product_variants"
  ON product_variants
  FOR SELECT
  TO authenticated, anon
  USING (true);
```

### conversation_attachments

```sql
-- Enable RLS
ALTER TABLE conversation_attachments ENABLE ROW LEVEL SECURITY;

-- Policy: Users can upload attachments to their own conversations
CREATE POLICY "Users can insert attachments to own conversations"
  ON conversation_attachments
  FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM conversations c
      INNER JOIN bookings b ON c.booking_id = b.id
      WHERE c.id = conversation_attachments.conversation_id
        AND b.client_id = auth.uid()
    )
  );

-- Policy: Users can view attachments in their own conversations (approved only)
CREATE POLICY "Users can view approved attachments in own conversations"
  ON conversation_attachments
  FOR SELECT
  TO authenticated
  USING (
    deleted_at IS NULL
    AND moderation_status = 'approved'
    AND EXISTS (
      SELECT 1 FROM conversations c
      INNER JOIN bookings b ON c.booking_id = b.id
      WHERE c.id = conversation_attachments.conversation_id
        AND (b.client_id = auth.uid() OR b.contractor_id = auth.uid())
    )
  );

-- Policy: Admins/managers can view all attachments (for moderation)
CREATE POLICY "Admins can view all conversation attachments"
  ON conversation_attachments
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
        AND profiles.role IN ('admin', 'manager')
    )
  );

-- Policy: Admins/managers can update attachments (for moderation)
CREATE POLICY "Admins can moderate conversation attachments"
  ON conversation_attachments
  FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
        AND profiles.role IN ('admin', 'manager')
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
        AND profiles.role IN ('admin', 'manager')
    )
  );
```

---

## Triggers & Functions

### 1. Auto-generate alt-text on insert (if empty)

```sql
CREATE OR REPLACE FUNCTION generate_fallback_alt_text()
RETURNS TRIGGER AS $$
BEGIN
  -- For service_images
  IF TG_TABLE_NAME = 'service_images' AND (NEW.alt_text IS NULL OR NEW.alt_text = '') THEN
    SELECT CONCAT(s.name, ' - Simone Paris')
    INTO NEW.alt_text
    FROM services s
    WHERE s.id = NEW.service_id;
  END IF;

  -- For product_images
  IF TG_TABLE_NAME = 'product_images' AND (NEW.alt_text IS NULL OR NEW.alt_text = '') THEN
    IF NEW.variant_id IS NOT NULL THEN
      -- Variant image: include variant name
      SELECT CONCAT(p.name, ' - ', pv.variant_name, ' - Simone Paris')
      INTO NEW.alt_text
      FROM products p
      INNER JOIN product_variants pv ON pv.product_id = p.id
      WHERE p.id = NEW.product_id AND pv.id = NEW.variant_id;
    ELSE
      -- Product image
      SELECT CONCAT(p.name, ' - Simone Paris')
      INTO NEW.alt_text
      FROM products p
      WHERE p.id = NEW.product_id;
    END IF;
  END IF;

  -- For conversation_attachments
  IF TG_TABLE_NAME = 'conversation_attachments' AND (NEW.alt_text IS NULL OR NEW.alt_text = '') THEN
    NEW.alt_text := 'Photo client - Simone Paris';
  END IF;

  -- Truncate to 125 chars
  NEW.alt_text := SUBSTRING(NEW.alt_text, 1, 125);

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Triggers
CREATE TRIGGER service_images_auto_alt_text
  BEFORE INSERT OR UPDATE ON service_images
  FOR EACH ROW
  EXECUTE FUNCTION generate_fallback_alt_text();

CREATE TRIGGER product_images_auto_alt_text
  BEFORE INSERT OR UPDATE ON product_images
  FOR EACH ROW
  EXECUTE FUNCTION generate_fallback_alt_text();

CREATE TRIGGER conversation_attachments_auto_alt_text
  BEFORE INSERT OR UPDATE ON conversation_attachments
  FOR EACH ROW
  EXECUTE FUNCTION generate_fallback_alt_text();
```

### 2. Enforce max images per entity

```sql
CREATE OR REPLACE FUNCTION check_max_images_limit()
RETURNS TRIGGER AS $$
DECLARE
  max_images INT;
  current_count INT;
BEGIN
  -- Get max limit from platform_config
  SELECT config_value::INT INTO max_images
  FROM platform_config
  WHERE config_key = 'max_images_per_entity';

  IF max_images IS NULL THEN
    max_images := 10; -- Default fallback
  END IF;

  -- Count existing images for this entity
  IF TG_TABLE_NAME = 'service_images' THEN
    SELECT COUNT(*) INTO current_count
    FROM service_images
    WHERE service_id = NEW.service_id AND deleted_at IS NULL;
  ELSIF TG_TABLE_NAME = 'product_images' THEN
    SELECT COUNT(*) INTO current_count
    FROM product_images
    WHERE product_id = NEW.product_id
      AND COALESCE(variant_id, 0) = COALESCE(NEW.variant_id, 0)
      AND deleted_at IS NULL;
  END IF;

  IF current_count >= max_images THEN
    RAISE EXCEPTION 'Maximum number of images (%) reached for this entity', max_images;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Triggers
CREATE TRIGGER service_images_check_limit
  BEFORE INSERT ON service_images
  FOR EACH ROW
  EXECUTE FUNCTION check_max_images_limit();

CREATE TRIGGER product_images_check_limit
  BEFORE INSERT ON product_images
  FOR EACH ROW
  EXECUTE FUNCTION check_max_images_limit();
```

---

## Migration Strategy

1. **Create tables** in dependency order:
   - `product_variants` (referenced by product_images)
   - `service_images`
   - `product_images`
   - `conversation_attachments`

2. **Create indexes** immediately after each table

3. **Enable RLS** and create policies

4. **Create triggers** and functions

5. **Insert platform_config** defaults

6. **Verify** with test queries

---

## Performance Considerations

1. **Indexes**: All foreign keys indexed, composite indexes for common queries
2. **Soft Delete**: `deleted_at` indexed for cleanup jobs
3. **Partitioning**: Not needed at current scale (~3500 images)
4. **Query Optimization**: Use `WHERE deleted_at IS NULL` in all queries to leverage partial indexes

---

## Backup & Recovery

- Soft delete allows 30-day recovery window
- Physical backups via Supabase automatic daily backups
- Consider snapshot before bulk operations (migrations, cleanups)

---

**Status**: Ready for implementation
**Migration Files**: See [plan.md](./plan.md) for migration file list
**Next Step**: Generate API contracts in `contracts/` directory
