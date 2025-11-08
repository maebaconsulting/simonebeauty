-- Migration: 20250107000012_extend_contractors_table.sql
-- Feature: 007 - Contractor Interface
-- Description: Extend contractors table with slug columns, commission settings, Stripe Connect fields, indexes, and triggers
-- Date: 2025-11-07

-- Extensions à la table contractors existante
ALTER TABLE contractors ADD COLUMN IF NOT EXISTS slug VARCHAR(50) UNIQUE NOT NULL DEFAULT '';
ALTER TABLE contractors ADD COLUMN IF NOT EXISTS slug_changes_count INT DEFAULT 0;
ALTER TABLE contractors ADD COLUMN IF NOT EXISTS slug_last_changed_at TIMESTAMP;
ALTER TABLE contractors ADD COLUMN IF NOT EXISTS commission_rate DECIMAL(5, 2) DEFAULT 15.00 CHECK (commission_rate >= 0 AND commission_rate <= 100);
ALTER TABLE contractors ADD COLUMN IF NOT EXISTS contractor_pays_stripe_fees BOOLEAN DEFAULT true;
ALTER TABLE contractors ADD COLUMN IF NOT EXISTS stripe_connect_account_id VARCHAR(255) UNIQUE;
ALTER TABLE contractors ADD COLUMN IF NOT EXISTS stripe_onboarding_status VARCHAR(50) DEFAULT 'not_started' CHECK (stripe_onboarding_status IN ('not_started', 'pending', 'completed'));
ALTER TABLE contractors ADD COLUMN IF NOT EXISTS stripe_charges_enabled BOOLEAN DEFAULT false;
ALTER TABLE contractors ADD COLUMN IF NOT EXISTS stripe_payouts_enabled BOOLEAN DEFAULT false;

COMMENT ON COLUMN contractors.slug IS 'Identifiant unique pour URL de réservation personnalisée (ex: marie-dupont-massage)';
COMMENT ON COLUMN contractors.slug_changes_count IS 'Nombre de modifications du slug (limité à 3 par an)';
COMMENT ON COLUMN contractors.slug_last_changed_at IS 'Date de la dernière modification du slug pour calculer la limite annuelle';
COMMENT ON COLUMN contractors.commission_rate IS 'Taux de commission négocié avec ce prestataire (ex: 15.00 = 15%)';
COMMENT ON COLUMN contractors.contractor_pays_stripe_fees IS 'True si le prestataire paie les frais Stripe, false si la plateforme les absorbe';
COMMENT ON COLUMN contractors.stripe_connect_account_id IS 'ID du compte Stripe Connect pour les paiements directs';
COMMENT ON COLUMN contractors.stripe_onboarding_status IS 'Statut de l''onboarding Stripe: not_started, pending, completed';
COMMENT ON COLUMN contractors.stripe_charges_enabled IS 'True si le compte peut recevoir des paiements (vérification Stripe complète)';
COMMENT ON COLUMN contractors.stripe_payouts_enabled IS 'True si le compte peut recevoir des virements (coordonnées bancaires validées)';

-- Index pour recherche rapide par slug
CREATE INDEX IF NOT EXISTS idx_contractors_slug ON contractors(slug);

-- Trigger: Générer slug automatiquement à la création
CREATE OR REPLACE FUNCTION generate_contractor_slug()
RETURNS TRIGGER AS $$
DECLARE
  base_slug TEXT;
  final_slug TEXT;
  suffix INT := 1;
  slug_exists BOOLEAN;
BEGIN
  -- Si slug déjà défini, ne rien faire
  IF NEW.slug IS NOT NULL AND NEW.slug != '' THEN
    RETURN NEW;
  END IF;

  -- Générer slug de base à partir du nom
  base_slug := LOWER(
    REGEXP_REPLACE(
      REGEXP_REPLACE(
        UNACCENT(CONCAT(NEW.first_name, '-', NEW.last_name)),
        '[^a-z0-9\s-]', '', 'g'
      ),
      '\s+', '-', 'g'
    )
  );

  -- Gérer les slugs trop courts
  IF LENGTH(base_slug) < 3 THEN
    base_slug := base_slug || '-contractor';
  END IF;

  -- Gérer les slugs trop longs
  IF LENGTH(base_slug) > 50 THEN
    base_slug := SUBSTRING(base_slug, 1, 50);
  END IF;

  final_slug := base_slug;

  -- Vérifier l'unicité et ajouter suffixe si nécessaire
  LOOP
    SELECT EXISTS(SELECT 1 FROM contractors WHERE slug = final_slug) INTO slug_exists;
    EXIT WHEN NOT slug_exists;

    suffix := suffix + 1;
    final_slug := base_slug || '-' || suffix;
  END LOOP;

  NEW.slug := final_slug;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER set_contractor_slug
BEFORE INSERT ON contractors
FOR EACH ROW EXECUTE FUNCTION generate_contractor_slug();

-- Trigger: Limiter les changements de slug (3/an)
CREATE OR REPLACE FUNCTION check_slug_change_limit()
RETURNS TRIGGER AS $$
DECLARE
  changes_this_year INT;
  limit_per_year INT;
BEGIN
  -- Si slug n'a pas changé, autoriser
  IF NEW.slug = OLD.slug THEN
    RETURN NEW;
  END IF;

  -- Récupérer la limite depuis platform_config
  SELECT (value)::INT INTO limit_per_year
  FROM platform_config
  WHERE key = 'slug_change_limit_per_year';

  IF limit_per_year IS NULL THEN
    limit_per_year := 3;
  END IF;

  -- Compter les changements cette année
  IF OLD.slug_last_changed_at IS NOT NULL AND
     EXTRACT(YEAR FROM OLD.slug_last_changed_at) = EXTRACT(YEAR FROM NOW()) THEN
    changes_this_year := OLD.slug_changes_count;
  ELSE
    changes_this_year := 0;
  END IF;

  -- Vérifier la limite
  IF changes_this_year >= limit_per_year THEN
    RAISE EXCEPTION 'Limite de changements de slug atteinte (% par an)', limit_per_year;
  END IF;

  -- Mettre à jour les compteurs
  NEW.slug_changes_count := changes_this_year + 1;
  NEW.slug_last_changed_at := NOW();

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER enforce_slug_change_limit
BEFORE UPDATE ON contractors
FOR EACH ROW
WHEN (OLD.slug IS DISTINCT FROM NEW.slug)
EXECUTE FUNCTION check_slug_change_limit();
