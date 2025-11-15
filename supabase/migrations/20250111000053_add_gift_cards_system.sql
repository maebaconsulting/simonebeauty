-- Migration: 20250111000053_add_gift_cards_system.sql
-- Feature: Gift Cards System
-- Description: Add gift cards with platform-absorbed value (contractor keeps full commission)
-- Date: 2025-11-11
-- Business Rule: When a client uses a gift card, the platform absorbs the value.
--                 The contractor receives commission on the ORIGINAL service amount.

-- =============================================================================
-- 1. Create gift_cards table
-- =============================================================================

CREATE TABLE gift_cards (
  id BIGINT PRIMARY KEY GENERATED ALWAYS AS IDENTITY,

  -- Card information
  code VARCHAR(50) NOT NULL UNIQUE,
  description TEXT,

  -- Value
  initial_value DECIMAL(10, 2) NOT NULL CHECK (initial_value > 0),
  current_value DECIMAL(10, 2) NOT NULL CHECK (current_value >= 0),

  -- Ownership
  purchased_by UUID REFERENCES auth.users(id), -- Who bought the gift card
  assigned_to_email VARCHAR(255), -- Who can use it (NULL = anyone with code)
  assigned_to_user UUID REFERENCES auth.users(id), -- Linked user account if registered

  -- Validity period
  valid_from TIMESTAMP DEFAULT NOW(),
  valid_until TIMESTAMP,

  -- Status
  is_active BOOLEAN DEFAULT true,
  is_redeemed BOOLEAN DEFAULT false, -- Fully used

  -- Metadata
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  redeemed_at TIMESTAMP
);

COMMENT ON TABLE gift_cards IS 'Cartes cadeaux avec valeur à la charge de la plateforme';
COMMENT ON COLUMN gift_cards.code IS 'Code unique de la carte cadeau (ex: GIFT-ABC-123-XYZ)';
COMMENT ON COLUMN gift_cards.initial_value IS 'Valeur initiale de la carte en euros';
COMMENT ON COLUMN gift_cards.current_value IS 'Valeur restante de la carte';
COMMENT ON COLUMN gift_cards.purchased_by IS 'Utilisateur qui a acheté la carte cadeau';
COMMENT ON COLUMN gift_cards.assigned_to_email IS 'Email du bénéficiaire (peut être différent de l''acheteur)';
COMMENT ON COLUMN gift_cards.assigned_to_user IS 'ID utilisateur bénéficiaire si inscrit';

-- Indexes
CREATE INDEX idx_gift_cards_code ON gift_cards(code) WHERE is_active = true;
CREATE INDEX idx_gift_cards_active ON gift_cards(is_active, current_value) WHERE current_value > 0;
CREATE INDEX idx_gift_cards_user ON gift_cards(assigned_to_user) WHERE assigned_to_user IS NOT NULL;
CREATE INDEX idx_gift_cards_email ON gift_cards(assigned_to_email) WHERE assigned_to_email IS NOT NULL;

-- =============================================================================
-- 2. Create gift_card_transactions table (tracking)
-- =============================================================================

CREATE TABLE gift_card_transactions (
  id BIGINT PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
  gift_card_id BIGINT NOT NULL REFERENCES gift_cards(id),
  booking_id BIGINT REFERENCES appointment_bookings(id),
  user_id UUID NOT NULL REFERENCES auth.users(id),

  -- Transaction
  transaction_type VARCHAR(20) NOT NULL CHECK (transaction_type IN ('purchase', 'redemption', 'refund')),
  amount DECIMAL(10, 2) NOT NULL,
  balance_before DECIMAL(10, 2) NOT NULL,
  balance_after DECIMAL(10, 2) NOT NULL,

  -- Stripe reference (for purchases/refunds)
  stripe_payment_intent_id VARCHAR(255),

  created_at TIMESTAMP DEFAULT NOW()
);

COMMENT ON TABLE gift_card_transactions IS 'Historique des transactions sur les cartes cadeaux';
COMMENT ON COLUMN gift_card_transactions.transaction_type IS 'Type: purchase (achat), redemption (utilisation), refund (remboursement)';
COMMENT ON COLUMN gift_card_transactions.amount IS 'Montant de la transaction';
COMMENT ON COLUMN gift_card_transactions.balance_before IS 'Solde avant transaction';
COMMENT ON COLUMN gift_card_transactions.balance_after IS 'Solde après transaction';

CREATE INDEX idx_gift_transactions_card ON gift_card_transactions(gift_card_id);
CREATE INDEX idx_gift_transactions_booking ON gift_card_transactions(booking_id) WHERE booking_id IS NOT NULL;
CREATE INDEX idx_gift_transactions_user ON gift_card_transactions(user_id);
CREATE INDEX idx_gift_transactions_type ON gift_card_transactions(transaction_type);

-- =============================================================================
-- 3. Extend appointment_bookings table
-- =============================================================================

ALTER TABLE appointment_bookings
  -- Gift card information
  ADD COLUMN IF NOT EXISTS gift_card_id BIGINT REFERENCES gift_cards(id),
  ADD COLUMN IF NOT EXISTS gift_card_code VARCHAR(50),
  ADD COLUMN IF NOT EXISTS gift_card_amount DECIMAL(10, 2) DEFAULT 0;

COMMENT ON COLUMN appointment_bookings.gift_card_id IS 'Carte cadeau utilisée (si applicable)';
COMMENT ON COLUMN appointment_bookings.gift_card_code IS 'Code de la carte cadeau utilisée';
COMMENT ON COLUMN appointment_bookings.gift_card_amount IS 'Montant de carte cadeau appliqué (à charge de la plateforme)';

CREATE INDEX idx_bookings_gift_card ON appointment_bookings(gift_card_id) WHERE gift_card_id IS NOT NULL;

-- =============================================================================
-- 4. Extend booking_sessions table
-- =============================================================================

ALTER TABLE booking_sessions
  ADD COLUMN IF NOT EXISTS gift_card_code VARCHAR(50),
  ADD COLUMN IF NOT EXISTS gift_card_amount DECIMAL(10, 2) DEFAULT 0;

COMMENT ON COLUMN booking_sessions.gift_card_code IS 'Code de carte cadeau saisie';
COMMENT ON COLUMN booking_sessions.gift_card_amount IS 'Montant de carte cadeau à appliquer';

-- =============================================================================
-- 5. RLS Policies for gift_cards
-- =============================================================================

ALTER TABLE gift_cards ENABLE ROW LEVEL SECURITY;

-- Users can view their own gift cards (purchased or assigned)
CREATE POLICY "Users can view own gift cards"
ON gift_cards FOR SELECT
TO authenticated
USING (
  purchased_by = auth.uid() OR
  assigned_to_user = auth.uid() OR
  assigned_to_email = (SELECT email FROM auth.users WHERE id = auth.uid())
);

-- Admins can view all gift cards
CREATE POLICY "Admins can view all gift cards"
ON gift_cards FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM profiles
    WHERE profiles.id = auth.uid()
    AND profiles.role IN ('admin', 'manager')
  )
);

-- Admins can manage gift cards
CREATE POLICY "Admins can manage gift cards"
ON gift_cards FOR ALL
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM profiles
    WHERE profiles.id = auth.uid()
    AND profiles.role IN ('admin', 'manager')
  )
);

-- =============================================================================
-- 6. RLS Policies for gift_card_transactions
-- =============================================================================

ALTER TABLE gift_card_transactions ENABLE ROW LEVEL SECURITY;

-- Users can view transactions for their gift cards
CREATE POLICY "Users can view own gift card transactions"
ON gift_card_transactions FOR SELECT
TO authenticated
USING (
  user_id = auth.uid() OR
  EXISTS (
    SELECT 1 FROM gift_cards gc
    WHERE gc.id = gift_card_transactions.gift_card_id
    AND (gc.purchased_by = auth.uid() OR gc.assigned_to_user = auth.uid())
  )
);

-- Admins can view all transactions
CREATE POLICY "Admins can view all gift card transactions"
ON gift_card_transactions FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM profiles
    WHERE profiles.id = auth.uid()
    AND profiles.role IN ('admin', 'manager')
  )
);

-- System can insert transactions
CREATE POLICY "System can create gift card transactions"
ON gift_card_transactions FOR INSERT
TO authenticated
WITH CHECK (user_id = auth.uid());

-- =============================================================================
-- 7. Helper function to validate and apply gift card
-- =============================================================================

CREATE OR REPLACE FUNCTION validate_gift_card(
  p_code VARCHAR(50),
  p_user_id UUID,
  p_user_email VARCHAR(255),
  p_amount_to_apply DECIMAL(10, 2)
)
RETURNS TABLE (
  is_valid BOOLEAN,
  gift_card_id BIGINT,
  available_amount DECIMAL(10, 2),
  amount_to_apply DECIMAL(10, 2),
  error_message TEXT
) AS $$
DECLARE
  v_gift_card gift_cards%ROWTYPE;
  v_applicable_amount DECIMAL(10, 2);
BEGIN
  -- Get gift card
  SELECT * INTO v_gift_card FROM gift_cards
  WHERE code = p_code
  AND is_active = true
  AND NOT is_redeemed
  AND NOW() BETWEEN valid_from AND COALESCE(valid_until, NOW() + INTERVAL '100 years')
  AND current_value > 0
  LIMIT 1;

  -- Check if gift card exists
  IF v_gift_card.id IS NULL THEN
    RETURN QUERY SELECT false, NULL::BIGINT, 0::DECIMAL, 0::DECIMAL, 'Carte cadeau invalide, expirée ou déjà utilisée';
    RETURN;
  END IF;

  -- Check if user is authorized (if card is assigned)
  IF v_gift_card.assigned_to_email IS NOT NULL THEN
    IF LOWER(v_gift_card.assigned_to_email) != LOWER(p_user_email) THEN
      RETURN QUERY SELECT false, NULL::BIGINT, 0::DECIMAL, 0::DECIMAL, 'Cette carte cadeau est attribuée à une autre personne';
      RETURN;
    END IF;
  END IF;

  IF v_gift_card.assigned_to_user IS NOT NULL THEN
    IF v_gift_card.assigned_to_user != p_user_id THEN
      RETURN QUERY SELECT false, NULL::BIGINT, 0::DECIMAL, 0::DECIMAL, 'Cette carte cadeau est attribuée à un autre compte';
      RETURN;
    END IF;
  END IF;

  -- Calculate applicable amount (cannot exceed gift card balance or requested amount)
  v_applicable_amount := LEAST(v_gift_card.current_value, p_amount_to_apply);

  -- Return valid result
  RETURN QUERY SELECT
    true,
    v_gift_card.id,
    v_gift_card.current_value,
    v_applicable_amount,
    NULL::TEXT;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMENT ON FUNCTION validate_gift_card IS 'Valide une carte cadeau et calcule le montant applicable (la plateforme absorbe le coût)';

-- =============================================================================
-- 8. Function to apply gift card to booking
-- =============================================================================

CREATE OR REPLACE FUNCTION apply_gift_card_to_booking(
  p_gift_card_id BIGINT,
  p_booking_id BIGINT,
  p_user_id UUID,
  p_amount DECIMAL(10, 2)
)
RETURNS TABLE (
  success BOOLEAN,
  new_balance DECIMAL(10, 2),
  error_message TEXT
) AS $$
DECLARE
  v_current_balance DECIMAL(10, 2);
BEGIN
  -- Get current balance with lock
  SELECT current_value INTO v_current_balance
  FROM gift_cards
  WHERE id = p_gift_card_id
  FOR UPDATE;

  -- Verify sufficient balance
  IF v_current_balance < p_amount THEN
    RETURN QUERY SELECT false, v_current_balance, 'Solde insuffisant sur la carte cadeau';
    RETURN;
  END IF;

  -- Deduct amount
  UPDATE gift_cards
  SET current_value = current_value - p_amount,
      updated_at = NOW(),
      is_redeemed = (current_value - p_amount = 0),
      redeemed_at = CASE WHEN (current_value - p_amount = 0) THEN NOW() ELSE redeemed_at END
  WHERE id = p_gift_card_id;

  -- Record transaction
  INSERT INTO gift_card_transactions (
    gift_card_id,
    booking_id,
    user_id,
    transaction_type,
    amount,
    balance_before,
    balance_after
  ) VALUES (
    p_gift_card_id,
    p_booking_id,
    p_user_id,
    'redemption',
    p_amount,
    v_current_balance,
    v_current_balance - p_amount
  );

  RETURN QUERY SELECT true, (v_current_balance - p_amount), NULL::TEXT;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMENT ON FUNCTION apply_gift_card_to_booking IS 'Applique une carte cadeau à une réservation et met à jour le solde';

-- =============================================================================
-- 9. Seed some example gift cards for testing
-- =============================================================================

INSERT INTO gift_cards (
  code,
  description,
  initial_value,
  current_value,
  valid_from,
  valid_until,
  is_active
) VALUES
-- Test gift card 50€
(
  'GIFT-TEST-50-EUR',
  'Carte cadeau de test 50€',
  50.00,
  50.00,
  NOW(),
  NOW() + INTERVAL '1 year',
  true
),
-- Test gift card 100€
(
  'GIFT-TEST-100-EUR',
  'Carte cadeau de test 100€',
  100.00,
  100.00,
  NOW(),
  NOW() + INTERVAL '1 year',
  true
),
-- Partially used gift card
(
  'GIFT-PARTIAL-75-EUR',
  'Carte cadeau partiellement utilisée',
  100.00,
  75.00,
  NOW(),
  NOW() + INTERVAL '1 year',
  true
);

-- Log seeding
DO $$
BEGIN
  RAISE NOTICE '✅ Gift cards system created with 3 test cards';
END $$;
