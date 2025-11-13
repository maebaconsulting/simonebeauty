-- =====================================================
-- Migration: Create Client Payment Methods
-- Description: Manages client saved payment methods (credit cards, etc.)
-- Constitutional Compliance: Principle 1 (BIGINT IDs), Principle 2 (VARCHAR + CHECK)
-- =====================================================

-- Create client_payment_methods table
CREATE TABLE IF NOT EXISTS public.client_payment_methods (
  id BIGSERIAL PRIMARY KEY,
  client_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,

  -- Stripe payment method ID
  stripe_payment_method_id VARCHAR(255) NOT NULL UNIQUE,

  -- Payment method type
  payment_type VARCHAR(50) NOT NULL DEFAULT 'card' CHECK (payment_type IN ('card', 'bank_account', 'paypal')),

  -- Card details (for display purposes only - actual details stored in Stripe)
  card_brand VARCHAR(50), -- visa, mastercard, amex, etc.
  card_last4 VARCHAR(4),
  card_exp_month INTEGER CHECK (card_exp_month BETWEEN 1 AND 12),
  card_exp_year INTEGER CHECK (card_exp_year >= 2024),

  -- Bank account details (for display only)
  bank_name VARCHAR(255),
  bank_account_last4 VARCHAR(4),

  -- PayPal details
  paypal_email VARCHAR(255),

  -- Billing address
  billing_address_line1 VARCHAR(500),
  billing_address_line2 VARCHAR(500),
  billing_city VARCHAR(255),
  billing_postal_code VARCHAR(20),
  billing_country VARCHAR(2) DEFAULT 'FR', -- ISO 3166-1 alpha-2

  -- Status and preferences
  is_default BOOLEAN NOT NULL DEFAULT false,
  is_active BOOLEAN NOT NULL DEFAULT true,

  -- Metadata
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  last_used_at TIMESTAMPTZ
);

-- Create indexes for performance
CREATE INDEX idx_client_payment_methods_client_id
  ON public.client_payment_methods(client_id);

CREATE INDEX idx_client_payment_methods_stripe_id
  ON public.client_payment_methods(stripe_payment_method_id);

CREATE INDEX idx_client_payment_methods_default
  ON public.client_payment_methods(client_id, is_default)
  WHERE is_default = true AND is_active = true;

CREATE INDEX idx_client_payment_methods_active
  ON public.client_payment_methods(client_id, is_active)
  WHERE is_active = true;

-- Create updated_at trigger
CREATE OR REPLACE FUNCTION update_client_payment_methods_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_client_payment_methods_updated_at
  BEFORE UPDATE ON public.client_payment_methods
  FOR EACH ROW
  EXECUTE FUNCTION update_client_payment_methods_updated_at();

-- Create function to ensure only one default payment method per client
CREATE OR REPLACE FUNCTION ensure_single_default_payment_method()
RETURNS TRIGGER AS $$
BEGIN
  -- If setting this payment method as default
  IF NEW.is_default = true AND NEW.is_active = true THEN
    -- Unset all other default payment methods for this client
    UPDATE public.client_payment_methods
    SET is_default = false
    WHERE client_id = NEW.client_id
      AND id != NEW.id
      AND is_default = true;
  END IF;

  -- If this is the first payment method for the client, make it default
  IF NOT EXISTS (
    SELECT 1 FROM public.client_payment_methods
    WHERE client_id = NEW.client_id
      AND is_active = true
      AND id != NEW.id
  ) THEN
    NEW.is_default = true;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_ensure_single_default_payment_method
  BEFORE INSERT OR UPDATE ON public.client_payment_methods
  FOR EACH ROW
  EXECUTE FUNCTION ensure_single_default_payment_method();

-- Enable Row Level Security
ALTER TABLE public.client_payment_methods ENABLE ROW LEVEL SECURITY;

-- RLS Policies

-- Policy: Clients can view their own payment methods
CREATE POLICY "Clients can view own payment methods"
  ON public.client_payment_methods
  FOR SELECT
  TO authenticated
  USING (auth.uid() = client_id);

-- Policy: Clients can insert their own payment methods
CREATE POLICY "Clients can insert own payment methods"
  ON public.client_payment_methods
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = client_id);

-- Policy: Clients can update their own payment methods
CREATE POLICY "Clients can update own payment methods"
  ON public.client_payment_methods
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = client_id)
  WITH CHECK (auth.uid() = client_id);

-- Policy: Clients can delete (deactivate) their own payment methods
CREATE POLICY "Clients can delete own payment methods"
  ON public.client_payment_methods
  FOR DELETE
  TO authenticated
  USING (auth.uid() = client_id);

-- Policy: Admin can view all payment methods
CREATE POLICY "Admin can view all payment methods"
  ON public.client_payment_methods
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  );

-- Add helpful comments
COMMENT ON TABLE public.client_payment_methods IS 'Stores client payment methods (Stripe payment method IDs) for recurring payments';
COMMENT ON COLUMN public.client_payment_methods.stripe_payment_method_id IS 'Stripe PaymentMethod ID (pm_xxx)';
COMMENT ON COLUMN public.client_payment_methods.card_last4 IS 'Last 4 digits of card number (for display only)';
COMMENT ON COLUMN public.client_payment_methods.is_default IS 'Whether this is the default payment method for the client';
COMMENT ON COLUMN public.client_payment_methods.is_active IS 'Whether this payment method is active (soft delete)';
COMMENT ON COLUMN public.client_payment_methods.billing_country IS 'ISO 3166-1 alpha-2 country code';
