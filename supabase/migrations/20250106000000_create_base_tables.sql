-- Migration: 20250106000000_create_base_tables.sql
-- Feature: Base Platform Schema
-- Description: Create foundational tables required by all features (profiles, contractors, services, appointment_bookings)
-- Date: 2025-11-07

-- =============================================================================
-- 1. profiles (extends auth.users)
-- =============================================================================

CREATE TABLE profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  role VARCHAR(20) CHECK (role IN ('client', 'contractor', 'admin', 'manager', 'staff')) DEFAULT 'client',
  first_name VARCHAR(100),
  last_name VARCHAR(100),
  phone VARCHAR(20),
  avatar_url TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

COMMENT ON TABLE profiles IS 'Profils utilisateurs liés aux comptes auth avec rôles et informations de base';
COMMENT ON COLUMN profiles.id IS 'UUID synchronisé avec auth.users';
COMMENT ON COLUMN profiles.role IS 'Rôle utilisateur: client/contractor/admin/manager/staff';
COMMENT ON COLUMN profiles.is_active IS 'Compte actif ou suspendu';

CREATE INDEX idx_profiles_role ON profiles(role);
CREATE INDEX idx_profiles_active ON profiles(is_active);

ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own profile"
ON profiles FOR SELECT
TO authenticated
USING (id = auth.uid());

CREATE POLICY "Users can update their own profile"
ON profiles FOR UPDATE
TO authenticated
USING (id = auth.uid());

CREATE POLICY "Admins can view all profiles"
ON profiles FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM profiles p
    WHERE p.id = auth.uid()
    AND p.role IN ('admin', 'manager')
  )
);

-- =============================================================================
-- 2. contractors (business entity for service providers)
-- =============================================================================

CREATE TABLE contractors (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  business_name VARCHAR(200),
  siret VARCHAR(14),
  bio TEXT,
  professional_title VARCHAR(100),
  years_of_experience INT,
  is_active BOOLEAN DEFAULT true,
  is_verified BOOLEAN DEFAULT false,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

COMMENT ON TABLE contractors IS 'Prestataires de services avec informations professionnelles';
COMMENT ON COLUMN contractors.id IS 'UUID synchronisé avec auth.users et profiles';
COMMENT ON COLUMN contractors.siret IS 'Numéro SIRET pour prestataires français';
COMMENT ON COLUMN contractors.is_verified IS 'Vérifié par admin après validation documents';

CREATE INDEX idx_contractors_active ON contractors(is_active);
CREATE INDEX idx_contractors_verified ON contractors(is_verified);

ALTER TABLE contractors ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Contractors can view their own data"
ON contractors FOR SELECT
TO authenticated
USING (id = auth.uid());

CREATE POLICY "Contractors can update their own data"
ON contractors FOR UPDATE
TO authenticated
USING (id = auth.uid());

CREATE POLICY "Anyone can view active verified contractors"
ON contractors FOR SELECT
TO public
USING (is_active = true AND is_verified = true);

CREATE POLICY "Admins can manage all contractors"
ON contractors FOR ALL
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM profiles
    WHERE profiles.id = auth.uid()
    AND profiles.role IN ('admin', 'manager')
  )
);

-- =============================================================================
-- 3. services (service catalog)
-- =============================================================================

CREATE TABLE services (
  id BIGINT PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
  name VARCHAR(200) NOT NULL,
  slug VARCHAR(200) UNIQUE NOT NULL,
  category VARCHAR(50) NOT NULL CHECK (category IN ('massage', 'beauty', 'hair', 'health', 'other')),
  description TEXT,
  base_price DECIMAL(10, 2) NOT NULL,
  base_duration_minutes INT NOT NULL,
  image_url TEXT,
  is_active BOOLEAN DEFAULT true,
  display_order INT DEFAULT 0,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

COMMENT ON TABLE services IS 'Catalogue de services disponibles sur la plateforme';
COMMENT ON COLUMN services.slug IS 'Identifiant URL unique (ex: massage-suedois-60min)';
COMMENT ON COLUMN services.base_price IS 'Prix de base en euros (peut être personnalisé par prestataire)';
COMMENT ON COLUMN services.base_duration_minutes IS 'Durée standard en minutes';

CREATE INDEX idx_services_category ON services(category) WHERE is_active = true;
CREATE INDEX idx_services_active ON services(is_active, display_order);
CREATE INDEX idx_services_slug ON services(slug);

ALTER TABLE services ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view active services"
ON services FOR SELECT
TO public
USING (is_active = true);

CREATE POLICY "Admins can manage services"
ON services FOR ALL
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM profiles
    WHERE profiles.id = auth.uid()
    AND profiles.role IN ('admin', 'manager')
  )
);

-- =============================================================================
-- 4. appointment_bookings (booking/reservation records)
-- =============================================================================

CREATE TABLE appointment_bookings (
  id BIGINT PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
  client_id UUID REFERENCES auth.users(id),
  contractor_id UUID REFERENCES contractors(id),
  service_id BIGINT REFERENCES services(id),

  -- Scheduling
  scheduled_date DATE NOT NULL,
  scheduled_time TIME NOT NULL,
  duration_minutes INT NOT NULL,

  -- Address
  service_address TEXT NOT NULL,
  service_city VARCHAR(100),
  service_postal_code VARCHAR(10),
  service_latitude DECIMAL(10, 8),
  service_longitude DECIMAL(11, 8),

  -- Pricing
  service_amount DECIMAL(10, 2) NOT NULL,

  -- Status
  status VARCHAR(50) CHECK (status IN ('pending', 'confirmed', 'in_progress', 'completed', 'cancelled')) DEFAULT 'pending',

  -- Client info (cached for historical records)
  client_name VARCHAR(200),
  client_phone VARCHAR(20),
  client_email VARCHAR(255),

  -- Service info (cached for historical records)
  service_name VARCHAR(200),

  -- Payment
  stripe_payment_intent_id VARCHAR(100),

  -- Timestamps
  completed_at TIMESTAMP,
  cancelled_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

COMMENT ON TABLE appointment_bookings IS 'Réservations de services avec planning et détails';
COMMENT ON COLUMN appointment_bookings.status IS 'État: pending/confirmed/in_progress/completed/cancelled';
COMMENT ON COLUMN appointment_bookings.service_amount IS 'Montant total du service en euros';
COMMENT ON COLUMN appointment_bookings.stripe_payment_intent_id IS 'ID Stripe PaymentIntent pour gestion paiement';

CREATE INDEX idx_bookings_client ON appointment_bookings(client_id);
CREATE INDEX idx_bookings_contractor ON appointment_bookings(contractor_id);
CREATE INDEX idx_bookings_service ON appointment_bookings(service_id);
CREATE INDEX idx_bookings_status ON appointment_bookings(status);
CREATE INDEX idx_bookings_scheduled ON appointment_bookings(scheduled_date, scheduled_time);
CREATE INDEX idx_bookings_contractor_date ON appointment_bookings(contractor_id, scheduled_date);

ALTER TABLE appointment_bookings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Clients can view their own bookings"
ON appointment_bookings FOR SELECT
TO authenticated
USING (client_id = auth.uid());

CREATE POLICY "Contractors can view their assigned bookings"
ON appointment_bookings FOR SELECT
TO authenticated
USING (contractor_id = auth.uid());

CREATE POLICY "Clients can create bookings"
ON appointment_bookings FOR INSERT
TO authenticated
WITH CHECK (client_id = auth.uid());

CREATE POLICY "Contractors can update their assigned bookings"
ON appointment_bookings FOR UPDATE
TO authenticated
USING (contractor_id = auth.uid());

CREATE POLICY "Admins can view all bookings"
ON appointment_bookings FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM profiles
    WHERE profiles.id = auth.uid()
    AND profiles.role IN ('admin', 'manager', 'staff')
  )
);

CREATE POLICY "Admins can manage all bookings"
ON appointment_bookings FOR ALL
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM profiles
    WHERE profiles.id = auth.uid()
    AND profiles.role IN ('admin', 'manager')
  )
);

-- =============================================================================
-- Seed Data
-- =============================================================================

-- Sample services (can be customized later)
INSERT INTO services (name, slug, category, description, base_price, base_duration_minutes, display_order) VALUES
('Massage Suédois 60min', 'massage-suedois-60min', 'massage', 'Massage relaxant aux huiles essentielles', 80.00, 60, 1),
('Massage Deep Tissue 60min', 'massage-deep-tissue-60min', 'massage', 'Massage profond pour tensions musculaires', 90.00, 60, 2),
('Massage Californien 90min', 'massage-californien-90min', 'massage', 'Massage doux et enveloppant', 120.00, 90, 3),
('Soin du Visage', 'soin-du-visage', 'beauty', 'Nettoyage, gommage et hydratation', 70.00, 60, 4),
('Manucure Complète', 'manucure-complete', 'beauty', 'Soin des ongles avec vernis', 35.00, 45, 5),
('Coupe Femme', 'coupe-femme', 'hair', 'Coupe et brushing', 45.00, 60, 6),
('Coupe Homme', 'coupe-homme', 'hair', 'Coupe classique', 25.00, 30, 7),
('Coloration', 'coloration', 'hair', 'Coloration complète avec soin', 80.00, 120, 8);
