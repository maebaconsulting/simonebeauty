# Data Model
# Feature 003: Parcours de Réservation Complet

**Date:** 2025-11-07
**Status:** Approved
**Branch:** `003-booking-flow`

---

## Overview

This document defines the complete data model for the booking flow feature. All table and column names follow the project constitution:
- **Names:** English, snake_case
- **IDs:** BIGINT auto-increment (except auth.users UUID references)
- **Enums:** VARCHAR + CHECK constraints (no PostgreSQL ENUMs)
- **Comments:** French SQL comments for business context

**Important Dependencies:**
- **Reads from spec 007:** `contractor_services` (which contractors offer which services)
- **Reads from spec 007:** `contractors.slug` (for direct booking URLs)
- **Writes to spec 007:** `contractor_slug_analytics` (conversion tracking)
- **Depends on spec 002:** Availability calculation algorithm (external)

---

## 1. services

**Purpose:** Catalogue des services disponibles sur la plateforme

```sql
CREATE TABLE services (
  id BIGINT PRIMARY KEY GENERATED ALWAYS AS IDENTITY,

  -- Informations de base
  name VARCHAR(200) NOT NULL,
  slug VARCHAR(200) UNIQUE NOT NULL,
  description TEXT NOT NULL,
  short_description VARCHAR(500),

  -- Catégorie et type
  category VARCHAR(100) NOT NULL CHECK (category IN ('massage', 'beauty', 'hair', 'health', 'wellness', 'other')),
  service_type VARCHAR(50) NOT NULL CHECK (service_type IN ('at_home', 'at_location', 'hybrid')),

  -- Prix et durée
  base_price DECIMAL(10, 2) NOT NULL CHECK (base_price >= 0),
  duration_minutes INT NOT NULL CHECK (duration_minutes > 0),
  buffer_time_minutes INT DEFAULT 15 CHECK (buffer_time_minutes >= 0),

  -- Images
  main_image_url TEXT,
  gallery_image_urls TEXT[],

  -- Disponibilité
  is_active BOOLEAN DEFAULT true,
  is_featured BOOLEAN DEFAULT false,
  display_order INT DEFAULT 0,

  -- B2B
  is_enterprise_ready BOOLEAN DEFAULT false,
  requires_ready_to_go BOOLEAN DEFAULT false,

  -- Métadonnées
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

COMMENT ON TABLE services IS 'Catalogue des services disponibles sur la plateforme (massages, beauté, coiffure, etc.)';
COMMENT ON COLUMN services.slug IS 'Identifiant URL unique du service (ex: massage-suedois-60min)';
COMMENT ON COLUMN services.category IS 'Catégorie principale: massage, beauté, coiffure, santé, bien-être';
COMMENT ON COLUMN services.service_type IS 'Type de service: at_home (à domicile), at_location (au local), hybrid (les deux)';
COMMENT ON COLUMN services.base_price IS 'Prix de base en euros (peut être personnalisé par prestataire via contractor_services)';
COMMENT ON COLUMN services.duration_minutes IS 'Durée du service en minutes';
COMMENT ON COLUMN services.buffer_time_minutes IS 'Temps de battement après le service pour déplacement/préparation';
COMMENT ON COLUMN services.is_featured IS 'Si true, mis en avant sur la page d''accueil';
COMMENT ON COLUMN services.is_enterprise_ready IS 'Si true, disponible pour les clients B2B';
COMMENT ON COLUMN services.requires_ready_to_go IS 'Si true, nécessite un prestataire avec ready_to_go activé (intervention <2h)';

-- Indexes
CREATE INDEX idx_services_active_category ON services(is_active, category);
CREATE INDEX idx_services_slug ON services(slug) WHERE is_active = true;
CREATE INDEX idx_services_featured ON services(is_featured, display_order) WHERE is_active = true;

-- RLS Policies
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
    AND profiles.role = 'admin'
  )
);
```

---

## 2. service_zones

**Purpose:** Zones géographiques couvertes par les services

```sql
CREATE TABLE service_zones (
  id BIGINT PRIMARY KEY GENERATED ALWAYS AS IDENTITY,

  -- Informations de la zone
  name VARCHAR(200) NOT NULL,
  zone_type VARCHAR(50) CHECK (zone_type IN ('city', 'arrondissement', 'postal_code', 'custom_polygon')),

  -- Données géographiques
  boundary_coordinates JSONB NOT NULL, -- GeoJSON polygon coordinates
  center_lat DECIMAL(10, 8) NOT NULL,
  center_lng DECIMAL(11, 8) NOT NULL,

  -- Codes postaux couverts
  postal_codes TEXT[],

  -- Activation
  is_active BOOLEAN DEFAULT true,

  -- Métadonnées
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

COMMENT ON TABLE service_zones IS 'Zones géographiques où les services peuvent être fournis';
COMMENT ON COLUMN service_zones.boundary_coordinates IS 'Coordonnées du polygone délimitant la zone (format GeoJSON)';
COMMENT ON COLUMN service_zones.zone_type IS 'Type de zone: ville, arrondissement, code postal ou polygone personnalisé';
COMMENT ON COLUMN service_zones.postal_codes IS 'Liste des codes postaux couverts par cette zone';

-- Indexes
CREATE INDEX idx_service_zones_active ON service_zones(is_active);
CREATE INDEX idx_service_zones_coordinates ON service_zones USING GIST (
  ST_GeomFromGeoJSON(boundary_coordinates::TEXT)
);

-- RLS Policies
ALTER TABLE service_zones ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view active service zones"
ON service_zones FOR SELECT
TO public
USING (is_active = true);

CREATE POLICY "Admins can manage service zones"
ON service_zones FOR ALL
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM profiles
    WHERE profiles.id = auth.uid()
    AND profiles.role = 'admin'
  )
);
```

---

## 3. client_addresses

**Purpose:** Adresses enregistrées des clients

```sql
CREATE TABLE client_addresses (
  id BIGINT PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
  client_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,

  -- Type et label
  address_type VARCHAR(50) DEFAULT 'other' CHECK (address_type IN ('home', 'work', 'vacation', 'other')),
  custom_label VARCHAR(100),

  -- Adresse complète
  street_address TEXT NOT NULL,
  address_line_2 TEXT,
  city VARCHAR(100) NOT NULL,
  postal_code VARCHAR(20) NOT NULL,
  country VARCHAR(100) DEFAULT 'France',

  -- Coordonnées GPS (de Google Places)
  latitude DECIMAL(10, 8) NOT NULL,
  longitude DECIMAL(11, 8) NOT NULL,

  -- Google Places
  google_place_id VARCHAR(255),
  formatted_address TEXT,

  -- Paramètres
  is_default BOOLEAN DEFAULT false,
  is_active BOOLEAN DEFAULT true,

  -- Instructions supplémentaires
  delivery_instructions TEXT,

  -- Métadonnées
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

COMMENT ON TABLE client_addresses IS 'Adresses enregistrées des clients pour réservations futures';
COMMENT ON COLUMN client_addresses.address_type IS 'Type d''adresse: home (domicile), work (travail), vacation (vacances), other (autre)';
COMMENT ON COLUMN client_addresses.custom_label IS 'Label personnalisé optionnel (ex: "Chez mes parents", "Maison de campagne")';
COMMENT ON COLUMN client_addresses.is_default IS 'Si true, cette adresse est pré-remplie par défaut lors des nouvelles réservations';
COMMENT ON COLUMN client_addresses.google_place_id IS 'ID Google Places pour référence et validation';
COMMENT ON COLUMN client_addresses.delivery_instructions IS 'Instructions spéciales (code porte, étage, interphone, etc.)';

-- Indexes
CREATE INDEX idx_client_addresses_client ON client_addresses(client_id) WHERE is_active = true;
CREATE INDEX idx_client_addresses_default ON client_addresses(client_id, is_default) WHERE is_active = true;
CREATE INDEX idx_client_addresses_location ON client_addresses(latitude, longitude);

-- RLS Policies
ALTER TABLE client_addresses ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Clients can view own addresses"
ON client_addresses FOR SELECT
TO authenticated
USING (client_id = auth.uid());

CREATE POLICY "Clients can insert own addresses"
ON client_addresses FOR INSERT
TO authenticated
WITH CHECK (client_id = auth.uid());

CREATE POLICY "Clients can update own addresses"
ON client_addresses FOR UPDATE
TO authenticated
USING (client_id = auth.uid());

CREATE POLICY "Clients can delete own addresses"
ON client_addresses FOR DELETE
TO authenticated
USING (client_id = auth.uid());

-- Trigger: Ensure only one default address per client
CREATE OR REPLACE FUNCTION ensure_single_default_address()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.is_default = true THEN
    UPDATE client_addresses
    SET is_default = false
    WHERE client_id = NEW.client_id
    AND id != NEW.id
    AND is_default = true;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER set_single_default_address
BEFORE INSERT OR UPDATE ON client_addresses
FOR EACH ROW EXECUTE FUNCTION ensure_single_default_address();
```

---

## 4. booking_sessions

**Purpose:** Sessions temporaires de réservation en cours (panier)

```sql
CREATE TABLE booking_sessions (
  id BIGINT PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
  client_id UUID REFERENCES profiles(id) ON DELETE CASCADE,

  -- Session tracking
  session_id VARCHAR(255) UNIQUE NOT NULL, -- Cookie-based session ID

  -- Service sélectionné
  service_id BIGINT REFERENCES services(id),

  -- Adresse sélectionnée
  address_id BIGINT REFERENCES client_addresses(id),
  temporary_address_data JSONB, -- Pour adresses non enregistrées

  -- Créneau sélectionné
  scheduled_start TIMESTAMP,
  scheduled_end TIMESTAMP,

  -- Prestataire assigné
  contractor_id BIGINT REFERENCES contractors(id),
  contractor_slug_locked BOOLEAN DEFAULT false, -- True si réservation via /book/:slug
  slug_analytics_entry_id BIGINT REFERENCES contractor_slug_analytics(id), -- Pour lier à l'analytics

  -- Services additionnels
  additional_service_ids BIGINT[],

  -- Prix et réductions
  base_price DECIMAL(10, 2),
  additional_services_price DECIMAL(10, 2) DEFAULT 0,
  promo_code_id BIGINT REFERENCES promo_codes(id),
  promo_discount DECIMAL(10, 2) DEFAULT 0,
  gift_card_id BIGINT REFERENCES gift_cards(id),
  gift_card_amount DECIMAL(10, 2) DEFAULT 0,
  final_price DECIMAL(10, 2),

  -- Expiration
  expires_at TIMESTAMP DEFAULT NOW() + INTERVAL '30 minutes',

  -- Métadonnées
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

COMMENT ON TABLE booking_sessions IS 'Sessions temporaires de réservation en cours (panier) avec expiration après 30 minutes';
COMMENT ON COLUMN booking_sessions.session_id IS 'Identifiant de session unique (cookie) pour tracking même si client non connecté';
COMMENT ON COLUMN booking_sessions.temporary_address_data IS 'Données d''adresse temporaire pour client en vacances (non enregistrée)';
COMMENT ON COLUMN booking_sessions.contractor_slug_locked IS 'True si réservation via /book/:slug, empêche changement de prestataire';
COMMENT ON COLUMN booking_sessions.slug_analytics_entry_id IS 'Lien vers contractor_slug_analytics pour marquer conversion';
COMMENT ON COLUMN booking_sessions.expires_at IS 'Date d''expiration de la session (30 min après dernière activité)';

-- Indexes
CREATE INDEX idx_booking_sessions_client ON booking_sessions(client_id);
CREATE INDEX idx_booking_sessions_session ON booking_sessions(session_id);
CREATE INDEX idx_booking_sessions_expires ON booking_sessions(expires_at) WHERE expires_at > NOW();

-- RLS Policies
ALTER TABLE booking_sessions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Clients can view own sessions"
ON booking_sessions FOR SELECT
TO authenticated
USING (client_id = auth.uid() OR client_id IS NULL);

CREATE POLICY "Clients can manage own sessions"
ON booking_sessions FOR ALL
TO authenticated
USING (client_id = auth.uid() OR client_id IS NULL);

-- Cleanup job for expired sessions (run every 5 minutes via cron)
-- DELETE FROM booking_sessions WHERE expires_at < NOW();
```

---

## 5. promo_codes

**Purpose:** Codes promotionnels avec conditions et limites

```sql
CREATE TABLE promo_codes (
  id BIGINT PRIMARY KEY GENERATED ALWAYS AS IDENTITY,

  -- Code
  code VARCHAR(50) UNIQUE NOT NULL,
  description TEXT,

  -- Type de réduction
  discount_type VARCHAR(20) NOT NULL CHECK (discount_type IN ('percentage', 'fixed_amount')),
  discount_value DECIMAL(10, 2) NOT NULL CHECK (discount_value > 0),

  -- Conditions d'application
  minimum_purchase_amount DECIMAL(10, 2),
  maximum_discount_amount DECIMAL(10, 2),

  -- Validité temporelle
  valid_from TIMESTAMP DEFAULT NOW(),
  valid_until TIMESTAMP,

  -- Limites d'utilisation
  usage_limit INT, -- NULL = illimité
  usage_count INT DEFAULT 0,
  usage_limit_per_user INT DEFAULT 1,

  -- Applicabilité
  service_ids BIGINT[], -- NULL = tous les services
  first_booking_only BOOLEAN DEFAULT false,

  -- Statut
  is_active BOOLEAN DEFAULT true,

  -- Métadonnées
  created_by UUID REFERENCES profiles(id),
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

COMMENT ON TABLE promo_codes IS 'Codes promotionnels avec conditions et limites d''utilisation';
COMMENT ON COLUMN promo_codes.code IS 'Code unique à saisir par le client (ex: WELCOME10, NOEL2024)';
COMMENT ON COLUMN promo_codes.discount_type IS 'Type de réduction: percentage (pourcentage) ou fixed_amount (montant fixe)';
COMMENT ON COLUMN promo_codes.discount_value IS 'Valeur de la réduction (ex: 10 pour 10% ou 5 pour 5€)';
COMMENT ON COLUMN promo_codes.minimum_purchase_amount IS 'Montant minimum d''achat pour activer le code (NULL = pas de minimum)';
COMMENT ON COLUMN promo_codes.maximum_discount_amount IS 'Montant maximum de réduction applicable (NULL = pas de limite)';
COMMENT ON COLUMN promo_codes.usage_limit IS 'Nombre total d''utilisations autorisées (NULL = illimité)';
COMMENT ON COLUMN promo_codes.usage_limit_per_user IS 'Nombre d''utilisations par client (défaut: 1)';
COMMENT ON COLUMN promo_codes.service_ids IS 'IDs des services auxquels le code s''applique (NULL = tous)';
COMMENT ON COLUMN promo_codes.first_booking_only IS 'Si true, code réservé aux nouveaux clients';

-- Indexes
CREATE INDEX idx_promo_codes_code ON promo_codes(UPPER(code)) WHERE is_active = true;
CREATE INDEX idx_promo_codes_validity ON promo_codes(valid_from, valid_until) WHERE is_active = true;

-- RLS Policies
ALTER TABLE promo_codes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view active promo codes"
ON promo_codes FOR SELECT
TO public
USING (is_active = true AND (valid_until IS NULL OR valid_until > NOW()));

CREATE POLICY "Admins can manage promo codes"
ON promo_codes FOR ALL
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM profiles
    WHERE profiles.id = auth.uid()
    AND profiles.role = 'admin'
  )
);
```

---

## 6. promo_code_usage

**Purpose:** Historique d'utilisation des codes promo par utilisateur

```sql
CREATE TABLE promo_code_usage (
  id BIGINT PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
  promo_code_id BIGINT NOT NULL REFERENCES promo_codes(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  booking_id BIGINT NOT NULL REFERENCES appointment_bookings(id) ON DELETE CASCADE,

  -- Détails de l'utilisation
  discount_applied DECIMAL(10, 2) NOT NULL,
  original_amount DECIMAL(10, 2) NOT NULL,
  final_amount DECIMAL(10, 2) NOT NULL,

  -- Métadonnées
  used_at TIMESTAMP DEFAULT NOW()
);

COMMENT ON TABLE promo_code_usage IS 'Historique d''utilisation des codes promo pour audit et limites par utilisateur';
COMMENT ON COLUMN promo_code_usage.discount_applied IS 'Montant de la réduction effectivement appliquée (en euros)';

-- Indexes
CREATE INDEX idx_promo_code_usage_code ON promo_code_usage(promo_code_id);
CREATE INDEX idx_promo_code_usage_user ON promo_code_usage(user_id);

-- RLS Policies
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
    AND profiles.role = 'admin'
  )
);
```

---

## 7. gift_cards

**Purpose:** Cartes cadeaux avec solde utilisable

```sql
CREATE TABLE gift_cards (
  id BIGINT PRIMARY KEY GENERATED ALWAYS AS IDENTITY,

  -- Code unique
  code VARCHAR(50) UNIQUE NOT NULL,

  -- Montants
  initial_balance DECIMAL(10, 2) NOT NULL CHECK (initial_balance > 0),
  current_balance DECIMAL(10, 2) NOT NULL CHECK (current_balance >= 0),
  currency VARCHAR(3) DEFAULT 'EUR',

  -- Validité
  valid_from TIMESTAMP DEFAULT NOW(),
  valid_until TIMESTAMP NOT NULL, -- 12 mois standard, 24 mois B2B

  -- Ownership
  purchased_by UUID REFERENCES profiles(id),
  assigned_to UUID REFERENCES profiles(id), -- Peut être offerte

  -- Type
  card_type VARCHAR(50) DEFAULT 'standard' CHECK (card_type IN ('standard', 'corporate')),
  corporate_logo_url TEXT, -- Pour cartes B2B personnalisées

  -- Statut
  is_active BOOLEAN DEFAULT true,

  -- Métadonnées
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

COMMENT ON TABLE gift_cards IS 'Cartes cadeaux avec solde utilisable sur la plateforme (standard 12 mois, B2B 24 mois)';
COMMENT ON COLUMN gift_cards.code IS 'Code unique de la carte cadeau (ex: GIFT-XXXX-YYYY-ZZZZ)';
COMMENT ON COLUMN gift_cards.current_balance IS 'Solde restant après utilisation partielle';
COMMENT ON COLUMN gift_cards.assigned_to IS 'Utilisateur à qui la carte est destinée (peut être différent de purchased_by)';
COMMENT ON COLUMN gift_cards.card_type IS 'Type: standard (12 mois) ou corporate (24 mois, logo personnalisé)';
COMMENT ON COLUMN gift_cards.corporate_logo_url IS 'URL du logo personnalisé pour cartes cadeaux B2B';

-- Indexes
CREATE INDEX idx_gift_cards_code ON gift_cards(UPPER(code)) WHERE is_active = true;
CREATE INDEX idx_gift_cards_assigned ON gift_cards(assigned_to) WHERE is_active = true;

-- RLS Policies
ALTER TABLE gift_cards ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view assigned gift cards"
ON gift_cards FOR SELECT
TO authenticated
USING (assigned_to = auth.uid() OR purchased_by = auth.uid());

CREATE POLICY "Admins can manage gift cards"
ON gift_cards FOR ALL
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM profiles
    WHERE profiles.id = auth.uid()
    AND profiles.role = 'admin'
  )
);
```

---

## 8. gift_card_transactions

**Purpose:** Historique d'utilisation des cartes cadeaux

```sql
CREATE TABLE gift_card_transactions (
  id BIGINT PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
  gift_card_id BIGINT NOT NULL REFERENCES gift_cards(id) ON DELETE CASCADE,
  booking_id BIGINT NOT NULL REFERENCES appointment_bookings(id) ON DELETE CASCADE,

  -- Montants
  amount_used DECIMAL(10, 2) NOT NULL CHECK (amount_used > 0),
  balance_before DECIMAL(10, 2) NOT NULL,
  balance_after DECIMAL(10, 2) NOT NULL,

  -- Métadonnées
  transaction_date TIMESTAMP DEFAULT NOW()
);

COMMENT ON TABLE gift_card_transactions IS 'Historique d''utilisation des cartes cadeaux pour audit et traçabilité';
COMMENT ON COLUMN gift_card_transactions.amount_used IS 'Montant déduit du solde pour cette réservation';

-- Indexes
CREATE INDEX idx_gift_card_transactions_card ON gift_card_transactions(gift_card_id);
CREATE INDEX idx_gift_card_transactions_booking ON gift_card_transactions(booking_id);

-- RLS Policies
ALTER TABLE gift_card_transactions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own gift card transactions"
ON gift_card_transactions FOR SELECT
TO authenticated
USING (
  gift_card_id IN (
    SELECT id FROM gift_cards
    WHERE assigned_to = auth.uid() OR purchased_by = auth.uid()
  )
);
```

---

## 9. appointment_bookings (Extensions)

**Purpose:** Extensions à la table existante pour le flux de réservation

```sql
-- Extensions nécessaires pour le booking flow
ALTER TABLE appointment_bookings ADD COLUMN IF NOT EXISTS service_id BIGINT REFERENCES services(id);
ALTER TABLE appointment_bookings ADD COLUMN IF NOT EXISTS service_name VARCHAR(200);
ALTER TABLE appointment_bookings ADD COLUMN IF NOT EXISTS service_duration_minutes INT;

-- Adresse de service
ALTER TABLE appointment_bookings ADD COLUMN IF NOT EXISTS service_address_id BIGINT REFERENCES client_addresses(id);
ALTER TABLE appointment_bookings ADD COLUMN IF NOT EXISTS service_address_data JSONB; -- Pour adresses temporaires

-- Prix et réductions
ALTER TABLE appointment_bookings ADD COLUMN IF NOT EXISTS base_price DECIMAL(10, 2);
ALTER TABLE appointment_bookings ADD COLUMN IF NOT EXISTS additional_services_price DECIMAL(10, 2) DEFAULT 0;
ALTER TABLE appointment_bookings ADD COLUMN IF NOT EXISTS promo_code_id BIGINT REFERENCES promo_codes(id);
ALTER TABLE appointment_bookings ADD COLUMN IF NOT EXISTS promo_discount DECIMAL(10, 2) DEFAULT 0;
ALTER TABLE appointment_bookings ADD COLUMN IF NOT EXISTS gift_card_id BIGINT REFERENCES gift_cards(id);
ALTER TABLE appointment_bookings ADD COLUMN IF NOT EXISTS gift_card_amount DECIMAL(10, 2) DEFAULT 0;
ALTER TABLE appointment_bookings ADD COLUMN IF NOT EXISTS final_price DECIMAL(10, 2);

-- Paiement Stripe
ALTER TABLE appointment_bookings ADD COLUMN IF NOT EXISTS stripe_payment_intent_id VARCHAR(255);
ALTER TABLE appointment_bookings ADD COLUMN IF NOT EXISTS payment_status VARCHAR(50) DEFAULT 'pending' CHECK (payment_status IN ('pending', 'authorized', 'captured', 'failed', 'refunded'));

-- Tracking slug booking
ALTER TABLE appointment_bookings ADD COLUMN IF NOT EXISTS booked_via_contractor_slug BOOLEAN DEFAULT false;
ALTER TABLE appointment_bookings ADD COLUMN IF NOT EXISTS contractor_slug_used VARCHAR(50);

COMMENT ON COLUMN appointment_bookings.service_address_data IS 'Adresse du service en format JSON si adresse temporaire (client en vacances)';
COMMENT ON COLUMN appointment_bookings.promo_discount IS 'Montant de réduction appliqué par le code promo (en euros)';
COMMENT ON COLUMN appointment_bookings.gift_card_amount IS 'Montant déduit du solde de la carte cadeau (en euros)';
COMMENT ON COLUMN appointment_bookings.final_price IS 'Prix final payé après réductions (base + additionnels - promo - carte cadeau)';
COMMENT ON COLUMN appointment_bookings.payment_status IS 'Statut du paiement Stripe: pending, authorized (pré-autorisé), captured (capturé), failed, refunded';
COMMENT ON COLUMN appointment_bookings.booked_via_contractor_slug IS 'True si réservation effectuée via /book/:slug (marketing tracking)';
```

---

## 10. availability_notification_requests

**Purpose:** Demandes de notification quand un prestataire a de nouvelles disponibilités

```sql
CREATE TABLE availability_notification_requests (
  id BIGINT PRIMARY KEY GENERATED ALWAYS AS IDENTITY,

  -- Demandeur
  client_email VARCHAR(255) NOT NULL,
  client_id UUID REFERENCES profiles(id), -- NULL si client non connecté

  -- Prestataire concerné
  contractor_id BIGINT NOT NULL REFERENCES contractors(id) ON DELETE CASCADE,

  -- Statut
  status VARCHAR(50) DEFAULT 'pending' CHECK (status IN ('pending', 'notified', 'expired')),

  -- Dates
  requested_at TIMESTAMP DEFAULT NOW(),
  notified_at TIMESTAMP,
  expires_at TIMESTAMP DEFAULT NOW() + INTERVAL '30 days'
);

COMMENT ON TABLE availability_notification_requests IS 'Demandes de notification email quand un prestataire sans disponibilité en aura de nouvelles';
COMMENT ON COLUMN availability_notification_requests.client_email IS 'Email de notification (même si client non connecté)';
COMMENT ON COLUMN availability_notification_requests.status IS 'Statut: pending (en attente), notified (notifié), expired (expiré après 30 jours)';

-- Indexes
CREATE INDEX idx_availability_notifications_contractor ON availability_notification_requests(contractor_id, status);
CREATE INDEX idx_availability_notifications_pending ON availability_notification_requests(status, expires_at) WHERE status = 'pending';

-- RLS Policies
ALTER TABLE availability_notification_requests ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Clients can view own notification requests"
ON availability_notification_requests FOR SELECT
TO authenticated
USING (client_id = auth.uid());

CREATE POLICY "Anyone can insert notification requests"
ON availability_notification_requests FOR INSERT
TO public
WITH CHECK (true);

-- Cleanup job for expired requests (run daily via cron)
-- DELETE FROM availability_notification_requests WHERE expires_at < NOW();
```

---

## Relationships Summary

```
services
  ↓ (many-to-many via contractor_services from spec 007)
contractors
  ↓ (1-to-many)
appointment_bookings
  ├─→ client_addresses (many-to-1)
  ├─→ promo_codes (many-to-1)
  ├─→ promo_code_usage (1-to-1)
  ├─→ gift_cards (many-to-1)
  └─→ gift_card_transactions (1-to-1)

profiles (clients)
  ├─→ client_addresses (1-to-many)
  ├─→ booking_sessions (1-to-many)
  ├─→ gift_cards (1-to-many)
  └─→ appointment_bookings (1-to-many)

booking_sessions
  ├─→ services (many-to-1)
  ├─→ client_addresses (many-to-1)
  ├─→ contractors (many-to-1)
  ├─→ promo_codes (many-to-1)
  ├─→ gift_cards (many-to-1)
  └─→ contractor_slug_analytics (many-to-1, from spec 007)

contractor_slug_analytics (from spec 007)
  ← booking_sessions (1-to-1 for tracking)
  ← appointment_bookings (1-to-1 for conversion)
```

---

## Database Views for Booking Analytics

```sql
-- View: booking_conversion_funnel
-- Analyse du tunnel de conversion du parcours de réservation
CREATE VIEW booking_conversion_funnel AS
SELECT
  DATE_TRUNC('day', created_at) AS date,
  COUNT(*) AS total_sessions,
  COUNT(service_id) AS selected_service,
  COUNT(address_id) AS selected_address,
  COUNT(scheduled_start) AS selected_slot,
  COUNT(contractor_id) AS assigned_contractor,
  COUNT(final_price) AS reached_payment
FROM booking_sessions
WHERE created_at >= NOW() - INTERVAL '30 days'
GROUP BY DATE_TRUNC('day', created_at)
ORDER BY date DESC;

COMMENT ON VIEW booking_conversion_funnel IS 'Analyse du tunnel de conversion étape par étape du parcours de réservation';

-- View: promo_code_performance
-- Performance des codes promo
CREATE VIEW promo_code_performance AS
SELECT
  pc.id,
  pc.code,
  pc.discount_type,
  pc.discount_value,
  pc.usage_count,
  pc.usage_limit,
  COUNT(pcu.id) AS actual_usage_count,
  COALESCE(SUM(pcu.discount_applied), 0) AS total_discount_given,
  COALESCE(AVG(pcu.discount_applied), 0) AS avg_discount_per_use,
  CASE
    WHEN pc.usage_count > 0
    THEN (COUNT(pcu.id)::DECIMAL / pc.usage_count::DECIMAL) * 100
    ELSE 0
  END AS conversion_rate_percentage
FROM promo_codes pc
LEFT JOIN promo_code_usage pcu ON pcu.promo_code_id = pc.id
GROUP BY pc.id, pc.code, pc.discount_type, pc.discount_value, pc.usage_count, pc.usage_limit;

COMMENT ON VIEW promo_code_performance IS 'Statistiques de performance des codes promotionnels';

-- View: gift_card_summary
-- Résumé des cartes cadeaux
CREATE VIEW gift_card_summary AS
SELECT
  gc.id,
  gc.code,
  gc.card_type,
  gc.initial_balance,
  gc.current_balance,
  gc.initial_balance - gc.current_balance AS total_spent,
  COUNT(gct.id) AS transaction_count,
  gc.valid_until,
  CASE
    WHEN gc.valid_until < NOW() THEN 'expired'
    WHEN gc.current_balance = 0 THEN 'fully_used'
    WHEN gc.current_balance > 0 AND gc.current_balance < gc.initial_balance THEN 'partially_used'
    ELSE 'unused'
  END AS status
FROM gift_cards gc
LEFT JOIN gift_card_transactions gct ON gct.gift_card_id = gc.id
GROUP BY gc.id, gc.code, gc.card_type, gc.initial_balance, gc.current_balance, gc.valid_until;

COMMENT ON VIEW gift_card_summary IS 'Résumé de l''état des cartes cadeaux (solde, utilisation, expiration)';

GRANT SELECT ON booking_conversion_funnel TO authenticated;
GRANT SELECT ON promo_code_performance TO authenticated;
GRANT SELECT ON gift_card_summary TO authenticated;
```

---

## Migration Order

When implementing this data model, follow this order to respect foreign key constraints:

1. `services` (no dependencies)
2. `service_zones` (no dependencies)
3. `client_addresses` (references profiles)
4. `promo_codes` (references profiles for created_by)
5. `gift_cards` (references profiles)
6. `booking_sessions` (references services, client_addresses, contractors, promo_codes, gift_cards, contractor_slug_analytics from spec 007)
7. `appointment_bookings` (extensions - requires existing table, references services, client_addresses, promo_codes, gift_cards)
8. `promo_code_usage` (references promo_codes, profiles, appointment_bookings)
9. `gift_card_transactions` (references gift_cards, appointment_bookings)
10. `availability_notification_requests` (references contractors, profiles)
11. Create views: `booking_conversion_funnel`, `promo_code_performance`, `gift_card_summary`

---

## Critical Triggers & Functions

```sql
-- Function: Update gift card balance on transaction
CREATE OR REPLACE FUNCTION update_gift_card_balance()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE gift_cards
  SET
    current_balance = NEW.balance_after,
    updated_at = NOW()
  WHERE id = NEW.gift_card_id;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_gift_card_on_transaction
AFTER INSERT ON gift_card_transactions
FOR EACH ROW EXECUTE FUNCTION update_gift_card_balance();

-- Function: Increment promo code usage count
CREATE OR REPLACE FUNCTION increment_promo_code_usage()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE promo_codes
  SET
    usage_count = usage_count + 1,
    updated_at = NOW()
  WHERE id = NEW.promo_code_id;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER increment_promo_usage_on_booking
AFTER INSERT ON promo_code_usage
FOR EACH ROW EXECUTE FUNCTION increment_promo_code_usage();

-- Function: Update booking session expiration on activity
CREATE OR REPLACE FUNCTION refresh_session_expiration()
RETURNS TRIGGER AS $$
BEGIN
  NEW.expires_at = NOW() + INTERVAL '30 minutes';
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER refresh_session_on_update
BEFORE UPDATE ON booking_sessions
FOR EACH ROW EXECUTE FUNCTION refresh_session_expiration();
```

---

**Last Updated:** 2025-11-07
**Status:** Approved for Implementation
