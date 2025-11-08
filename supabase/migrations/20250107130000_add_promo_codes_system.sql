-- Migration: 20250107130000_add_promo_codes_system.sql
-- Feature: Promo Codes System
-- Description: Add promo codes with platform-absorbed discount (contractor keeps full commission)
-- Date: 2025-11-07
-- Business Rule: When a client uses a promo code, the platform absorbs the discount.
--                 The contractor receives commission on the ORIGINAL service amount,
--                 not the discounted amount. This ensures contractors don't lose money.

-- =============================================================================
-- 1. Create promo_codes table
-- =============================================================================

CREATE TABLE promo_codes (
  id BIGINT PRIMARY KEY GENERATED ALWAYS AS IDENTITY,

  -- Code information
  code VARCHAR(50) NOT NULL UNIQUE,
  description TEXT,

  -- Discount type
  discount_type VARCHAR(20) NOT NULL CHECK (discount_type IN ('percentage', 'fixed_amount')),
  discount_value DECIMAL(10, 2) NOT NULL CHECK (discount_value > 0),

  -- Usage limits
  max_uses INT, -- NULL = unlimited
  uses_count INT DEFAULT 0 NOT NULL,
  max_uses_per_user INT DEFAULT 1,

  -- Validity period
  valid_from TIMESTAMP DEFAULT NOW(),
  valid_until TIMESTAMP,

  -- Restrictions
  min_order_amount DECIMAL(10, 2), -- Minimum order to apply promo
  max_discount_amount DECIMAL(10, 2), -- Cap for percentage discounts
  first_booking_only BOOLEAN DEFAULT false,
  specific_services BIGINT[], -- NULL = all services, or array of service IDs
  specific_categories BIGINT[], -- NULL = all categories, or array of category IDs

  -- Status
  is_active BOOLEAN DEFAULT true,

  -- Metadata
  created_by UUID REFERENCES profiles(id),
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

COMMENT ON TABLE promo_codes IS 'Codes promo avec réduction à la charge de la plateforme';
COMMENT ON COLUMN promo_codes.code IS 'Code promo unique (ex: BIENVENUE20, NOEL2024)';
COMMENT ON COLUMN promo_codes.discount_type IS 'Type de réduction: percentage (%) ou fixed_amount (€)';
COMMENT ON COLUMN promo_codes.discount_value IS 'Valeur de la réduction (20 pour 20% ou 10 pour 10€)';
COMMENT ON COLUMN promo_codes.max_uses IS 'Nombre max d''utilisations totales (NULL = illimité)';
COMMENT ON COLUMN promo_codes.uses_count IS 'Nombre d''utilisations actuelles';
COMMENT ON COLUMN promo_codes.max_uses_per_user IS 'Nombre max d''utilisations par client (défaut: 1)';
COMMENT ON COLUMN promo_codes.min_order_amount IS 'Montant minimum de commande pour appliquer le code';
COMMENT ON COLUMN promo_codes.max_discount_amount IS 'Plafond de réduction pour les % (ex: 20% max 50€)';
COMMENT ON COLUMN promo_codes.first_booking_only IS 'Réservé à la première réservation du client';
COMMENT ON COLUMN promo_codes.specific_services IS 'Array d''IDs de services éligibles (NULL = tous)';
COMMENT ON COLUMN promo_codes.specific_categories IS 'Array d''IDs de catégories éligibles (NULL = toutes)';

-- Indexes
CREATE INDEX idx_promo_codes_code ON promo_codes(code) WHERE is_active = true;
CREATE INDEX idx_promo_codes_active ON promo_codes(is_active, valid_from, valid_until);
CREATE INDEX idx_promo_codes_validity ON promo_codes(valid_from, valid_until) WHERE is_active = true;

-- =============================================================================
-- 2. Create promo_code_usage table (tracking)
-- =============================================================================

CREATE TABLE promo_code_usage (
  id BIGINT PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
  promo_code_id BIGINT NOT NULL REFERENCES promo_codes(id),
  booking_id BIGINT NOT NULL REFERENCES appointment_bookings(id),
  user_id UUID NOT NULL REFERENCES auth.users(id),

  -- Amounts
  original_amount DECIMAL(10, 2) NOT NULL,
  discount_amount DECIMAL(10, 2) NOT NULL,
  final_amount DECIMAL(10, 2) NOT NULL,

  used_at TIMESTAMP DEFAULT NOW(),

  UNIQUE(promo_code_id, booking_id)
);

COMMENT ON TABLE promo_code_usage IS 'Historique d''utilisation des codes promo';
COMMENT ON COLUMN promo_code_usage.original_amount IS 'Montant original avant réduction';
COMMENT ON COLUMN promo_code_usage.discount_amount IS 'Montant de la réduction appliquée (à charge plateforme)';
COMMENT ON COLUMN promo_code_usage.final_amount IS 'Montant final payé par le client';

CREATE INDEX idx_promo_usage_code ON promo_code_usage(promo_code_id);
CREATE INDEX idx_promo_usage_user ON promo_code_usage(user_id);
CREATE INDEX idx_promo_usage_booking ON promo_code_usage(booking_id);

-- =============================================================================
-- 3. Extend appointment_bookings table
-- =============================================================================

ALTER TABLE appointment_bookings
  -- Original service amount (before any discount)
  ADD COLUMN service_amount_original DECIMAL(10, 2),

  -- Promo code information
  ADD COLUMN promo_code_id BIGINT REFERENCES promo_codes(id),
  ADD COLUMN promo_discount_amount DECIMAL(10, 2) DEFAULT 0,

  -- Add constraint: if promo applied, must have original amount
  ADD CONSTRAINT check_promo_amounts CHECK (
    (promo_code_id IS NULL AND promo_discount_amount = 0) OR
    (promo_code_id IS NOT NULL AND service_amount_original IS NOT NULL AND promo_discount_amount > 0)
  );

COMMENT ON COLUMN appointment_bookings.service_amount_original IS 'Montant original du service AVANT réduction promo (pour calcul commission)';
COMMENT ON COLUMN appointment_bookings.promo_code_id IS 'Code promo utilisé (si applicable)';
COMMENT ON COLUMN appointment_bookings.promo_discount_amount IS 'Montant de réduction du code promo (à charge de la plateforme)';

-- Update existing comment for service_amount
COMMENT ON COLUMN appointment_bookings.service_amount IS 'Montant FINAL payé par le client (après réduction promo si applicable)';

CREATE INDEX idx_bookings_promo ON appointment_bookings(promo_code_id) WHERE promo_code_id IS NOT NULL;

-- =============================================================================
-- 4. Update contractor_financial_summary view
-- =============================================================================

-- Drop existing view
DROP VIEW IF EXISTS contractor_financial_summary;

-- Recreate with promo-aware calculations
CREATE VIEW contractor_financial_summary AS
SELECT
  c.id AS contractor_id,

  -- IMPORTANT: Commission is calculated on ORIGINAL amount (before promo discount)
  -- This ensures contractors don't lose money when clients use promo codes
  -- The platform absorbs the discount cost

  -- Revenus services (mois en cours) - based on ORIGINAL amount
  COALESCE(SUM(
    CASE
      WHEN b.status IN ('completed', 'completed_by_contractor')
      AND DATE_TRUNC('month', b.completed_at) = DATE_TRUNC('month', NOW())
      THEN
        -- Use original amount if promo was applied, otherwise use service_amount
        (COALESCE(b.service_amount_original, b.service_amount) -
         (COALESCE(b.service_amount_original, b.service_amount) * c.commission_rate / 100)) -
        (CASE WHEN c.contractor_pays_stripe_fees THEN b.stripe_fee_service ELSE 0 END)
      ELSE 0
    END
  ), 0) AS revenue_service_current_month,

  -- Pourboires (mois en cours) - unchanged
  COALESCE(SUM(
    CASE
      WHEN b.status IN ('completed', 'completed_by_contractor')
      AND DATE_TRUNC('month', b.completed_at) = DATE_TRUNC('month', NOW())
      AND b.tip_amount > 0
      THEN b.tip_amount - b.stripe_fee_tip
      ELSE 0
    END
  ), 0) AS revenue_tips_current_month,

  -- Total net (mois en cours)
  COALESCE(SUM(
    CASE
      WHEN b.status IN ('completed', 'completed_by_contractor')
      AND DATE_TRUNC('month', b.completed_at) = DATE_TRUNC('month', NOW())
      THEN
        -- Commission on ORIGINAL amount
        ((COALESCE(b.service_amount_original, b.service_amount) -
          (COALESCE(b.service_amount_original, b.service_amount) * c.commission_rate / 100)) -
          (CASE WHEN c.contractor_pays_stripe_fees THEN b.stripe_fee_service ELSE 0 END)) +
        (CASE WHEN b.tip_amount > 0 THEN b.tip_amount - b.stripe_fee_tip ELSE 0 END)
      ELSE 0
    END
  ), 0) AS total_net_current_month,

  -- Platform cost for promo codes (mois en cours)
  COALESCE(SUM(
    CASE
      WHEN b.status IN ('completed', 'completed_by_contractor')
      AND DATE_TRUNC('month', b.completed_at) = DATE_TRUNC('month', NOW())
      AND b.promo_code_id IS NOT NULL
      THEN b.promo_discount_amount
      ELSE 0
    END
  ), 0) AS platform_promo_cost_current_month,

  -- Statistiques
  COUNT(CASE WHEN b.status IN ('completed', 'completed_by_contractor') THEN 1 END) AS total_completed_bookings,
  COUNT(CASE WHEN b.status IN ('completed', 'completed_by_contractor') AND b.tip_amount > 0 THEN 1 END) AS total_bookings_with_tips,
  COUNT(CASE WHEN b.promo_code_id IS NOT NULL THEN 1 END) AS total_bookings_with_promo,
  AVG(CASE WHEN b.tip_amount > 0 THEN b.tip_amount ELSE NULL END) AS average_tip_amount,

  -- Taux de tips
  CASE
    WHEN COUNT(CASE WHEN b.status IN ('completed', 'completed_by_contractor') THEN 1 END) > 0
    THEN (COUNT(CASE WHEN b.tip_amount > 0 THEN 1 END)::DECIMAL / COUNT(CASE WHEN b.status IN ('completed', 'completed_by_contractor') THEN 1 END)::DECIMAL) * 100
    ELSE 0
  END AS tip_rate_percentage

FROM contractors c
LEFT JOIN appointment_bookings b ON b.contractor_id = c.id
GROUP BY c.id, c.commission_rate, c.contractor_pays_stripe_fees;

COMMENT ON VIEW contractor_financial_summary IS 'Résumé financier avec gestion des codes promo (commission sur montant original)';
COMMENT ON COLUMN contractor_financial_summary.platform_promo_cost_current_month IS 'Coût total des réductions promo absorbées par la plateforme';

GRANT SELECT ON contractor_financial_summary TO authenticated;

-- =============================================================================
-- 5. Update contractor_transaction_details view
-- =============================================================================

-- Drop existing view
DROP VIEW IF EXISTS contractor_transaction_details;

-- Recreate with promo information
CREATE VIEW contractor_transaction_details AS
SELECT
  b.id AS booking_id,
  b.contractor_id,
  b.completed_at,
  b.client_name,
  b.service_name,

  -- Promo information
  b.promo_code_id,
  pc.code AS promo_code,
  b.service_amount_original,
  b.promo_discount_amount,

  -- Détail service - Commission calculée sur montant ORIGINAL
  COALESCE(b.service_amount_original, b.service_amount) AS service_gross_original,
  b.service_amount AS service_gross_after_promo,
  (COALESCE(b.service_amount_original, b.service_amount) * c.commission_rate / 100) AS service_commission,
  CASE WHEN c.contractor_pays_stripe_fees THEN b.stripe_fee_service ELSE 0 END AS service_stripe_fee,
  (COALESCE(b.service_amount_original, b.service_amount) -
   (COALESCE(b.service_amount_original, b.service_amount) * c.commission_rate / 100) -
   CASE WHEN c.contractor_pays_stripe_fees THEN b.stripe_fee_service ELSE 0 END) AS service_net,

  -- Détail tip
  b.tip_amount AS tip_gross,
  b.stripe_fee_tip AS tip_stripe_fee,
  (b.tip_amount - b.stripe_fee_tip) AS tip_net,

  -- Total
  (COALESCE(b.service_amount_original, b.service_amount) -
   (COALESCE(b.service_amount_original, b.service_amount) * c.commission_rate / 100) -
   CASE WHEN c.contractor_pays_stripe_fees THEN b.stripe_fee_service ELSE 0 END) +
  (b.tip_amount - b.stripe_fee_tip) AS total_net,

  -- Métadonnées
  c.commission_rate,
  c.contractor_pays_stripe_fees

FROM appointment_bookings b
JOIN contractors c ON c.id = b.contractor_id
LEFT JOIN promo_codes pc ON pc.id = b.promo_code_id
WHERE b.status IN ('completed', 'completed_by_contractor')
ORDER BY b.completed_at DESC;

COMMENT ON VIEW contractor_transaction_details IS 'Détail des transactions avec info codes promo (commission sur montant original)';
COMMENT ON COLUMN contractor_transaction_details.service_gross_original IS 'Montant original AVANT promo (base de calcul commission)';
COMMENT ON COLUMN contractor_transaction_details.service_gross_after_promo IS 'Montant APRES promo (payé par client)';
COMMENT ON COLUMN contractor_transaction_details.promo_discount_amount IS 'Réduction promo (à charge plateforme)';

GRANT SELECT ON contractor_transaction_details TO authenticated;

-- =============================================================================
-- 6. RLS Policies for promo_codes
-- =============================================================================

ALTER TABLE promo_codes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view active promo codes"
ON promo_codes FOR SELECT
TO public
USING (is_active = true AND NOW() BETWEEN valid_from AND COALESCE(valid_until, NOW() + INTERVAL '100 years'));

CREATE POLICY "Admins can manage promo codes"
ON promo_codes FOR ALL
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM profiles
    WHERE profiles.id = auth.uid()
    AND profiles.role IN ('admin', 'manager')
  )
);

-- =============================================================================
-- 7. RLS Policies for promo_code_usage
-- =============================================================================

ALTER TABLE promo_code_usage ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own promo usage"
ON promo_code_usage FOR SELECT
TO authenticated
USING (user_id = auth.uid());

CREATE POLICY "Admins can view all promo usage"
ON promo_code_usage FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM profiles
    WHERE profiles.id = auth.uid()
    AND profiles.role IN ('admin', 'manager')
  )
);

CREATE POLICY "System can insert promo usage"
ON promo_code_usage FOR INSERT
TO authenticated
WITH CHECK (user_id = auth.uid());

-- =============================================================================
-- 8. Helper function to validate and apply promo code
-- =============================================================================

CREATE OR REPLACE FUNCTION validate_promo_code(
  p_code VARCHAR(50),
  p_user_id UUID,
  p_service_id BIGINT,
  p_service_amount DECIMAL(10, 2)
)
RETURNS TABLE (
  is_valid BOOLEAN,
  promo_id BIGINT,
  discount_amount DECIMAL(10, 2),
  final_amount DECIMAL(10, 2),
  error_message TEXT
) AS $$
DECLARE
  v_promo promo_codes%ROWTYPE;
  v_user_usage_count INT;
  v_is_first_booking BOOLEAN;
  v_service_category_id BIGINT;
  v_discount DECIMAL(10, 2);
BEGIN
  -- Get promo code
  SELECT * INTO v_promo FROM promo_codes
  WHERE code = p_code
  AND is_active = true
  AND NOW() BETWEEN valid_from AND COALESCE(valid_until, NOW() + INTERVAL '100 years')
  LIMIT 1;

  -- Check if promo exists
  IF v_promo.id IS NULL THEN
    RETURN QUERY SELECT false, NULL::BIGINT, 0::DECIMAL, p_service_amount, 'Code promo invalide ou expiré';
    RETURN;
  END IF;

  -- Check max uses (global)
  IF v_promo.max_uses IS NOT NULL AND v_promo.uses_count >= v_promo.max_uses THEN
    RETURN QUERY SELECT false, NULL::BIGINT, 0::DECIMAL, p_service_amount, 'Ce code promo a atteint sa limite d''utilisation';
    RETURN;
  END IF;

  -- Check max uses per user
  SELECT COUNT(*) INTO v_user_usage_count
  FROM promo_code_usage
  WHERE promo_code_id = v_promo.id AND user_id = p_user_id;

  IF v_user_usage_count >= v_promo.max_uses_per_user THEN
    RETURN QUERY SELECT false, NULL::BIGINT, 0::DECIMAL, p_service_amount, 'Vous avez déjà utilisé ce code promo';
    RETURN;
  END IF;

  -- Check first booking only
  IF v_promo.first_booking_only THEN
    SELECT EXISTS(
      SELECT 1 FROM appointment_bookings
      WHERE client_id = p_user_id
      AND status IN ('completed', 'completed_by_contractor')
    ) INTO v_is_first_booking;

    IF v_is_first_booking THEN
      RETURN QUERY SELECT false, NULL::BIGINT, 0::DECIMAL, p_service_amount, 'Ce code est réservé à votre première réservation';
      RETURN;
    END IF;
  END IF;

  -- Check minimum order amount
  IF v_promo.min_order_amount IS NOT NULL AND p_service_amount < v_promo.min_order_amount THEN
    RETURN QUERY SELECT false, NULL::BIGINT, 0::DECIMAL, p_service_amount,
      FORMAT('Montant minimum requis: %s€', v_promo.min_order_amount);
    RETURN;
  END IF;

  -- Check specific services
  IF v_promo.specific_services IS NOT NULL AND array_length(v_promo.specific_services, 1) > 0 THEN
    IF NOT (p_service_id = ANY(v_promo.specific_services)) THEN
      RETURN QUERY SELECT false, NULL::BIGINT, 0::DECIMAL, p_service_amount, 'Ce code ne s''applique pas à ce service';
      RETURN;
    END IF;
  END IF;

  -- Check specific categories
  IF v_promo.specific_categories IS NOT NULL AND array_length(v_promo.specific_categories, 1) > 0 THEN
    SELECT category_id INTO v_service_category_id FROM services WHERE id = p_service_id;
    IF NOT (v_service_category_id = ANY(v_promo.specific_categories)) THEN
      RETURN QUERY SELECT false, NULL::BIGINT, 0::DECIMAL, p_service_amount, 'Ce code ne s''applique pas à cette catégorie';
      RETURN;
    END IF;
  END IF;

  -- Calculate discount
  IF v_promo.discount_type = 'percentage' THEN
    v_discount := (p_service_amount * v_promo.discount_value / 100);
    -- Apply max discount cap if specified
    IF v_promo.max_discount_amount IS NOT NULL AND v_discount > v_promo.max_discount_amount THEN
      v_discount := v_promo.max_discount_amount;
    END IF;
  ELSE -- fixed_amount
    v_discount := v_promo.discount_value;
    -- Cannot discount more than service amount
    IF v_discount > p_service_amount THEN
      v_discount := p_service_amount;
    END IF;
  END IF;

  -- Return valid result
  RETURN QUERY SELECT
    true,
    v_promo.id,
    v_discount,
    (p_service_amount - v_discount),
    NULL::TEXT;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMENT ON FUNCTION validate_promo_code IS 'Valide un code promo et calcule la réduction (la plateforme absorbe le coût)';

-- =============================================================================
-- 9. Seed some example promo codes
-- =============================================================================

INSERT INTO promo_codes (
  code,
  description,
  discount_type,
  discount_value,
  max_uses,
  max_uses_per_user,
  min_order_amount,
  first_booking_only,
  valid_from,
  valid_until,
  is_active
) VALUES
-- Welcome promo for new users
(
  'BIENVENUE20',
  'Réduction de 20% sur votre première réservation',
  'percentage',
  20,
  NULL, -- unlimited total uses
  1, -- once per user
  50.00, -- minimum 50€
  true, -- first booking only
  NOW(),
  NOW() + INTERVAL '1 year',
  true
),
-- Fixed amount promo
(
  'SIMONE10',
  'Réduction de 10€ sur toute réservation',
  'fixed_amount',
  10,
  1000, -- max 1000 uses
  3, -- 3 times per user
  40.00, -- minimum 40€
  false,
  NOW(),
  NOW() + INTERVAL '6 months',
  true
),
-- Percentage with cap
(
  'NOEL2024',
  'Promo de Noël: 30% de réduction (max 50€)',
  'percentage',
  30,
  500,
  1,
  100.00,
  false,
  NOW(),
  NOW() + INTERVAL '1 month',
  true
);

-- Log seeding
DO $$
BEGIN
  RAISE NOTICE '✅ Promo codes system created with 3 example codes';
END $$;
