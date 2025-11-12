# Data Model
# Feature 013: Service d'Urgence Ready to Go

**Date:** 2025-11-07
**Status:** Approved
**Branch:** `013-ready-to-go`

---

## Overview

This document defines the complete data model for the Ready to Go urgent booking feature with 3 pricing tiers. All table and column names follow the project constitution:
- **Names:** English, snake_case
- **IDs:** BIGINT auto-increment (except auth.users UUID references)
- **Enums:** VARCHAR + CHECK constraints (no PostgreSQL ENUMs)
- **Comments:** French SQL comments for business context

**Important Dependencies:**
- **Coordinates with spec 007:** `appointment_bookings` tip columns (avoid conflicts)
- **Coordinates with spec 003:** `appointment_bookings` base structure and booking flow
- **Depends on spec 002:** Availability calculation algorithm (extended for urgency)

---

## 1. platform_urgency_pricing

**Purpose:** Configuration tarifaire des paliers d'urgence au niveau plateforme

```sql
CREATE TABLE platform_urgency_pricing (
  id BIGINT PRIMARY KEY GENERATED ALWAYS AS IDENTITY,

  -- Niveau d'urgence
  urgency_level VARCHAR(20) NOT NULL CHECK (urgency_level IN ('express', 'fast', 'today')),

  -- Fenêtre temporelle
  min_minutes INT NOT NULL CHECK (min_minutes >= 0), -- 0, 60, 120
  max_minutes INT NOT NULL CHECK (max_minutes > min_minutes), -- 60, 120, 240

  -- Surcharge globale
  global_surcharge_percent DECIMAL(5, 2) NOT NULL CHECK (global_surcharge_percent >= 0), -- 50.00, 30.00, 15.00

  -- Exception par service (optionnel)
  service_id BIGINT REFERENCES services(id) ON DELETE CASCADE,
  service_surcharge_percent DECIMAL(5, 2) CHECK (service_surcharge_percent >= 0),

  -- Répartition des revenus
  contractor_share_percent DECIMAL(5, 2) NOT NULL DEFAULT 50.00 CHECK (contractor_share_percent >= 0 AND contractor_share_percent <= 100),
  platform_share_percent DECIMAL(5, 2) NOT NULL DEFAULT 50.00 CHECK (platform_share_percent >= 0 AND platform_share_percent <= 100),

  -- Activation
  is_active BOOLEAN DEFAULT true,

  -- Validité temporelle
  effective_from TIMESTAMP DEFAULT NOW(),
  effective_until TIMESTAMP,

  -- Métadonnées
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),

  -- Contrainte: contractor_share + platform_share = 100
  CONSTRAINT valid_share_split CHECK (contractor_share_percent + platform_share_percent = 100)
);

COMMENT ON TABLE platform_urgency_pricing IS 'Configuration des paliers tarifaires Ready to Go au niveau plateforme';
COMMENT ON COLUMN platform_urgency_pricing.urgency_level IS 'Palier: express (<1h), fast (1h-2h), today (2h-4h)';
COMMENT ON COLUMN platform_urgency_pricing.min_minutes IS 'Délai minimum en minutes depuis maintenant (0 pour Express, 60 pour Rapide, 120 pour Aujourd''hui)';
COMMENT ON COLUMN platform_urgency_pricing.max_minutes IS 'Délai maximum en minutes depuis maintenant (60 pour Express, 120 pour Rapide, 240 pour Aujourd''hui)';
COMMENT ON COLUMN platform_urgency_pricing.global_surcharge_percent IS 'Surcharge globale en pourcentage (50% pour Express, 30% pour Rapide, 15% pour Aujourd''hui)';
COMMENT ON COLUMN platform_urgency_pricing.service_id IS 'Si renseigné, cette config s''applique uniquement à ce service (surcharge spécifique ex: Coiffure +60%)';
COMMENT ON COLUMN platform_urgency_pricing.service_surcharge_percent IS 'Surcharge spécifique pour ce service (prioritaire sur global_surcharge_percent)';
COMMENT ON COLUMN platform_urgency_pricing.contractor_share_percent IS 'Pourcentage de la surcharge qui va au prestataire (bonus, défaut: 50%)';
COMMENT ON COLUMN platform_urgency_pricing.platform_share_percent IS 'Pourcentage de la surcharge qui va à la plateforme (défaut: 50%)';
COMMENT ON COLUMN platform_urgency_pricing.is_active IS 'Si false, le palier n''est plus disponible pour de nouvelles réservations';
COMMENT ON COLUMN platform_urgency_pricing.effective_from IS 'Date à partir de laquelle cette config est valide';
COMMENT ON COLUMN platform_urgency_pricing.effective_until IS 'Date jusqu''à laquelle cette config est valide (NULL = indéfinie)';

-- Indexes
CREATE INDEX idx_platform_urgency_pricing_level ON platform_urgency_pricing(urgency_level, is_active) WHERE is_active = true;
CREATE INDEX idx_platform_urgency_pricing_service ON platform_urgency_pricing(service_id, urgency_level) WHERE service_id IS NOT NULL AND is_active = true;
CREATE INDEX idx_platform_urgency_pricing_effective ON platform_urgency_pricing(effective_from, effective_until) WHERE is_active = true;

-- Unique constraint: One active global config per urgency level at a time
CREATE UNIQUE INDEX idx_platform_urgency_pricing_unique_global ON platform_urgency_pricing(urgency_level)
WHERE is_active = true AND service_id IS NULL AND (effective_until IS NULL OR effective_until > NOW());

-- RLS Policies
ALTER TABLE platform_urgency_pricing ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view active urgency pricing"
ON platform_urgency_pricing FOR SELECT
TO public
USING (is_active = true AND (effective_until IS NULL OR effective_until > NOW()));

CREATE POLICY "Admins can manage urgency pricing"
ON platform_urgency_pricing FOR ALL
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM profiles
    WHERE profiles.id = auth.uid()
    AND profiles.role = 'admin'
  )
);

-- Seed initial configurations
INSERT INTO platform_urgency_pricing (urgency_level, min_minutes, max_minutes, global_surcharge_percent, contractor_share_percent, platform_share_percent) VALUES
('express', 0, 60, 50.00, 50.00, 50.00),
('fast', 60, 120, 30.00, 50.00, 50.00),
('today', 120, 240, 15.00, 50.00, 50.00);
```

---

## 2. contractor_urgency_config

**Purpose:** Configuration Ready to Go des prestataires (opt-in simplifié)

```sql
CREATE TABLE contractor_urgency_config (
  id BIGINT PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
  contractor_id BIGINT UNIQUE NOT NULL REFERENCES contractors(id) ON DELETE CASCADE,

  -- Activation
  is_enabled BOOLEAN DEFAULT false,

  -- Plages horaires d'intervention rapide
  availability_slots JSONB NOT NULL DEFAULT '[]'::JSONB,
  -- Format: [{"day": "monday", "start": "10:00", "end": "18:00"}, ...]
  -- day: monday, tuesday, wednesday, thursday, friday, saturday, sunday

  -- Limite de missions urgentes
  max_urgent_per_week INT DEFAULT 10 CHECK (max_urgent_per_week > 0),
  current_week_urgent_count INT DEFAULT 0,
  week_start_date DATE, -- Pour réinitialiser le compteur chaque semaine

  -- Zones géographiques acceptées (optionnel)
  accepted_postal_codes TEXT[], -- NULL = toutes zones

  -- Dernière position connue pour calcul de trajet
  last_known_location JSONB, -- {lat: 48.8566, lng: 2.3522}
  last_location_updated_at TIMESTAMP,

  -- Métadonnées
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

COMMENT ON TABLE contractor_urgency_config IS 'Configuration Ready to Go des prestataires avec opt-in simple ON/OFF et plages horaires';
COMMENT ON COLUMN contractor_urgency_config.is_enabled IS 'True si le prestataire participe au service Ready to Go';
COMMENT ON COLUMN contractor_urgency_config.availability_slots IS 'Plages horaires où le prestataire accepte les interventions urgentes (format JSON)';
COMMENT ON COLUMN contractor_urgency_config.max_urgent_per_week IS 'Nombre maximum de missions urgentes acceptables par semaine (défaut: 10)';
COMMENT ON COLUMN contractor_urgency_config.current_week_urgent_count IS 'Compteur de missions urgentes acceptées cette semaine';
COMMENT ON COLUMN contractor_urgency_config.week_start_date IS 'Date du début de la semaine courante pour réinitialiser le compteur';
COMMENT ON COLUMN contractor_urgency_config.accepted_postal_codes IS 'Codes postaux acceptés pour interventions urgentes (NULL = tous)';
COMMENT ON COLUMN contractor_urgency_config.last_known_location IS 'Dernière position connue du prestataire pour calcul de trajet (JSON {lat, lng})';

-- Indexes
CREATE INDEX idx_contractor_urgency_config_enabled ON contractor_urgency_config(is_enabled) WHERE is_enabled = true;
CREATE INDEX idx_contractor_urgency_config_contractor ON contractor_urgency_config(contractor_id);

-- RLS Policies
ALTER TABLE contractor_urgency_config ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Contractors can view own urgency config"
ON contractor_urgency_config FOR SELECT
TO authenticated
USING (
  contractor_id IN (
    SELECT id FROM contractors WHERE profile_uuid = auth.uid()
  )
);

CREATE POLICY "Contractors can manage own urgency config"
ON contractor_urgency_config FOR ALL
TO authenticated
USING (
  contractor_id IN (
    SELECT id FROM contractors WHERE profile_uuid = auth.uid()
  )
);

CREATE POLICY "Admins can view all urgency configs"
ON contractor_urgency_config FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM profiles
    WHERE profiles.id = auth.uid()
    AND profiles.role = 'admin'
  )
);

-- Trigger: Reset weekly counter on Monday
CREATE OR REPLACE FUNCTION reset_weekly_urgent_counter()
RETURNS TRIGGER AS $$
BEGIN
  -- Check if it's a new week (Monday)
  IF NEW.week_start_date IS NULL OR
     EXTRACT(DOW FROM NOW()) = 1 AND -- Monday
     NEW.week_start_date < DATE_TRUNC('week', NOW()) THEN
    NEW.current_week_urgent_count = 0;
    NEW.week_start_date = DATE_TRUNC('week', NOW())::DATE;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER reset_urgent_counter_weekly
BEFORE INSERT OR UPDATE ON contractor_urgency_config
FOR EACH ROW EXECUTE FUNCTION reset_weekly_urgent_counter();
```

---

## 3. appointment_bookings (Extensions)

**Purpose:** Extensions pour les réservations urgentes Ready to Go

```sql
-- Extensions à la table appointment_bookings existante
-- IMPORTANT: Coordonner avec spec 007 (tip_amount, tip_transfer_id, etc.)

ALTER TABLE appointment_bookings ADD COLUMN IF NOT EXISTS urgency_level VARCHAR(20) CHECK (urgency_level IN ('express', 'fast', 'today'));
ALTER TABLE appointment_bookings ADD COLUMN IF NOT EXISTS urgency_surcharge_amount DECIMAL(10, 2) DEFAULT 0;
ALTER TABLE appointment_bookings ADD COLUMN IF NOT EXISTS urgency_surcharge_percent DECIMAL(5, 2) DEFAULT 0;
ALTER TABLE appointment_bookings ADD COLUMN IF NOT EXISTS urgency_contractor_bonus DECIMAL(10, 2) DEFAULT 0;
ALTER TABLE appointment_bookings ADD COLUMN IF NOT EXISTS urgency_platform_revenue DECIMAL(10, 2) DEFAULT 0;
ALTER TABLE appointment_bookings ADD COLUMN IF NOT EXISTS urgency_requested_at TIMESTAMP;
ALTER TABLE appointment_bookings ADD COLUMN IF NOT EXISTS urgency_promised_arrival_start TIMESTAMP;
ALTER TABLE appointment_bookings ADD COLUMN IF NOT EXISTS urgency_promised_arrival_end TIMESTAMP;
ALTER TABLE appointment_bookings ADD COLUMN IF NOT EXISTS urgency_actual_arrival_time TIMESTAMP;
ALTER TABLE appointment_bookings ADD COLUMN IF NOT EXISTS urgency_arrived_on_time BOOLEAN;
ALTER TABLE appointment_bookings ADD COLUMN IF NOT EXISTS urgency_pricing_config_id BIGINT REFERENCES platform_urgency_pricing(id);

COMMENT ON COLUMN appointment_bookings.urgency_level IS 'Palier d''urgence: express (<1h), fast (1h-2h), today (2h-4h). NULL si réservation standard';
COMMENT ON COLUMN appointment_bookings.urgency_surcharge_amount IS 'Montant de la surcharge urgence appliquée (en euros)';
COMMENT ON COLUMN appointment_bookings.urgency_surcharge_percent IS 'Pourcentage de surcharge appliqué (snapshot au moment de la réservation)';
COMMENT ON COLUMN appointment_bookings.urgency_contractor_bonus IS 'Bonus perçu par le prestataire (50% de la surcharge par défaut)';
COMMENT ON COLUMN appointment_bookings.urgency_platform_revenue IS 'Revenu additionnel pour la plateforme (50% de la surcharge par défaut)';
COMMENT ON COLUMN appointment_bookings.urgency_requested_at IS 'Date et heure de la demande d''urgence par le client';
COMMENT ON COLUMN appointment_bookings.urgency_promised_arrival_start IS 'Début de la fenêtre d''arrivée promise (ex: maintenant + 45 min pour Express)';
COMMENT ON COLUMN appointment_bookings.urgency_promised_arrival_end IS 'Fin de la fenêtre d''arrivée promise (ex: maintenant + 60 min pour Express)';
COMMENT ON COLUMN appointment_bookings.urgency_actual_arrival_time IS 'Heure d''arrivée réelle du prestataire (pour mesurer respect du délai)';
COMMENT ON COLUMN appointment_bookings.urgency_arrived_on_time BOOLEAN IS 'True si le prestataire est arrivé dans la fenêtre promise';
COMMENT ON COLUMN appointment_bookings.urgency_pricing_config_id IS 'Référence à la config de tarification appliquée (snapshot pour audit)';

-- Index for urgency bookings queries
CREATE INDEX IF NOT EXISTS idx_appointment_bookings_urgency ON appointment_bookings(urgency_level, created_at DESC) WHERE urgency_level IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_appointment_bookings_urgency_contractor ON appointment_bookings(contractor_id, urgency_level) WHERE urgency_level IS NOT NULL;
```

---

## 4. urgent_notifications

**Purpose:** Notifications prioritaires envoyées aux prestataires pour demandes urgentes

```sql
CREATE TABLE urgent_notifications (
  id BIGINT PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
  booking_id BIGINT NOT NULL REFERENCES appointment_bookings(id) ON DELETE CASCADE,
  contractor_id BIGINT NOT NULL REFERENCES contractors(id) ON DELETE CASCADE,

  -- Détails de l'urgence
  urgency_level VARCHAR(20) NOT NULL CHECK (urgency_level IN ('express', 'fast', 'today')),
  bonus_amount DECIMAL(10, 2) NOT NULL,
  travel_time_minutes INT NOT NULL,
  departure_time TIMESTAMP NOT NULL, -- Quand le prestataire doit partir

  -- Statut de la notification
  status VARCHAR(50) DEFAULT 'pending' CHECK (status IN ('pending', 'confirmed', 'refused', 'timeout')),
  sent_at TIMESTAMP DEFAULT NOW(),
  responded_at TIMESTAMP,

  -- Canaux de notification utilisés
  push_notification_sent BOOLEAN DEFAULT false,
  sms_sent BOOLEAN DEFAULT false,
  email_sent BOOLEAN DEFAULT false,

  -- Message du prestataire (en cas de refus)
  contractor_message TEXT,

  -- Numéro de tentative (pour reassignation)
  attempt_number INT DEFAULT 1 CHECK (attempt_number > 0),

  -- Métadonnées
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

COMMENT ON TABLE urgent_notifications IS 'Notifications prioritaires envoyées aux prestataires pour demandes urgentes Ready to Go';
COMMENT ON COLUMN urgent_notifications.bonus_amount IS 'Montant du bonus que le prestataire recevra s''il accepte';
COMMENT ON COLUMN urgent_notifications.travel_time_minutes IS 'Temps de trajet estimé vers l''adresse client (via Google Distance Matrix)';
COMMENT ON COLUMN urgent_notifications.departure_time IS 'Heure à laquelle le prestataire doit partir pour respecter le délai';
COMMENT ON COLUMN urgent_notifications.status IS 'Statut: pending (en attente réponse 5 min), confirmed (accepté), refused (refusé), timeout (pas de réponse)';
COMMENT ON COLUMN urgent_notifications.attempt_number IS 'Numéro de la tentative (1, 2, 3). Après 3 timeouts, annulation automatique';

-- Indexes
CREATE INDEX idx_urgent_notifications_booking ON urgent_notifications(booking_id);
CREATE INDEX idx_urgent_notifications_contractor ON urgent_notifications(contractor_id, status);
CREATE INDEX idx_urgent_notifications_pending ON urgent_notifications(status, sent_at) WHERE status = 'pending';

-- RLS Policies
ALTER TABLE urgent_notifications ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Contractors can view own urgent notifications"
ON urgent_notifications FOR SELECT
TO authenticated
USING (
  contractor_id IN (
    SELECT id FROM contractors WHERE profile_uuid = auth.uid()
  )
);

CREATE POLICY "Contractors can update own urgent notifications"
ON urgent_notifications FOR UPDATE
TO authenticated
USING (
  contractor_id IN (
    SELECT id FROM contractors WHERE profile_uuid = auth.uid()
  )
);

CREATE POLICY "Admins can view all urgent notifications"
ON urgent_notifications FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM profiles
    WHERE profiles.id = auth.uid()
    AND profiles.role = 'admin'
  )
);

-- Trigger: Auto-update responded_at when status changes
CREATE OR REPLACE FUNCTION set_notification_responded_at()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.status != 'pending' AND OLD.status = 'pending' THEN
    NEW.responded_at = NOW();
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_urgent_notification_responded_at
BEFORE UPDATE ON urgent_notifications
FOR EACH ROW EXECUTE FUNCTION set_notification_responded_at();
```

---

## 5. urgency_analytics

**Purpose:** Logs et analytics de toutes les tentatives Ready to Go

```sql
CREATE TABLE urgency_analytics (
  id BIGINT PRIMARY KEY GENERATED ALWAYS AS IDENTITY,

  -- Réservation associée
  booking_id BIGINT REFERENCES appointment_bookings(id) ON DELETE CASCADE,

  -- Détails de la demande
  urgency_level VARCHAR(20) NOT NULL CHECK (urgency_level IN ('express', 'fast', 'today')),
  requested_at TIMESTAMP DEFAULT NOW(),
  service_id BIGINT REFERENCES services(id),
  client_id UUID REFERENCES profiles(id),

  -- Prestataire assigné
  assigned_contractor_id BIGINT REFERENCES contractors(id),
  response_time_seconds INT, -- Temps pour accepter
  contractor_attempts INT DEFAULT 1, -- Nombre de prestataires contactés

  -- Statut final
  status VARCHAR(50) NOT NULL CHECK (status IN ('success', 'timeout', 'no_contractor', 'client_cancel')),

  -- Respect du délai
  promised_arrival_window_start TIMESTAMP,
  promised_arrival_window_end TIMESTAMP,
  actual_arrival_time TIMESTAMP,
  arrived_on_time BOOLEAN,

  -- Satisfaction client
  client_satisfaction_rating INT CHECK (client_satisfaction_rating >= 1 AND client_satisfaction_rating <= 5),
  client_feedback TEXT,

  -- Tarification
  base_price DECIMAL(10, 2),
  surcharge_amount DECIMAL(10, 2),
  contractor_bonus DECIMAL(10, 2),
  platform_revenue DECIMAL(10, 2),

  -- Métadonnées
  created_at TIMESTAMP DEFAULT NOW()
);

COMMENT ON TABLE urgency_analytics IS 'Analytics complètes de toutes les tentatives de réservation urgente Ready to Go';
COMMENT ON COLUMN urgency_analytics.response_time_seconds IS 'Temps en secondes entre l''envoi de la notification et l''acceptation du prestataire';
COMMENT ON COLUMN urgency_analytics.contractor_attempts IS 'Nombre de prestataires contactés avant acceptation (1, 2, ou 3)';
COMMENT ON COLUMN urgency_analytics.status IS 'Statut final: success (réservation complétée), timeout (aucune réponse après 3 tentatives), no_contractor (aucun prestataire disponible), client_cancel (client a annulé)';
COMMENT ON COLUMN urgency_analytics.arrived_on_time IS 'True si le prestataire est arrivé dans la fenêtre promise (ex: <1h pour Express)';
COMMENT ON COLUMN urgency_analytics.client_satisfaction_rating IS 'Note de satisfaction du client de 1 à 5 étoiles';

-- Indexes
CREATE INDEX idx_urgency_analytics_urgency_level ON urgency_analytics(urgency_level, requested_at DESC);
CREATE INDEX idx_urgency_analytics_contractor ON urgency_analytics(assigned_contractor_id, status);
CREATE INDEX idx_urgency_analytics_status ON urgency_analytics(status, requested_at DESC);
CREATE INDEX idx_urgency_analytics_booking ON urgency_analytics(booking_id);

-- RLS Policies
ALTER TABLE urgency_analytics ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Contractors can view own urgency analytics"
ON urgency_analytics FOR SELECT
TO authenticated
USING (
  assigned_contractor_id IN (
    SELECT id FROM contractors WHERE profile_uuid = auth.uid()
  )
);

CREATE POLICY "Admins can view all urgency analytics"
ON urgency_analytics FOR SELECT
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

## 6. urgency_zone_restrictions

**Purpose:** Zones géographiques où Ready to Go est désactivé

```sql
CREATE TABLE urgency_zone_restrictions (
  id BIGINT PRIMARY KEY GENERATED ALWAYS AS IDENTITY,

  -- Type de zone
  zone_type VARCHAR(50) NOT NULL CHECK (zone_type IN ('postal_code', 'city', 'radius')),
  zone_value VARCHAR(255) NOT NULL, -- Code postal, nom ville, ou "lat,lng,radius_km"

  -- Raison de la restriction
  reason TEXT NOT NULL,

  -- Activation
  is_active BOOLEAN DEFAULT true,

  -- Métadonnées
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

COMMENT ON TABLE urgency_zone_restrictions IS 'Zones géographiques où le service Ready to Go est désactivé (trop éloignées, pas de couverture)';
COMMENT ON COLUMN urgency_zone_restrictions.zone_type IS 'Type de restriction: postal_code (code postal), city (ville), radius (rayon autour d''un point)';
COMMENT ON COLUMN urgency_zone_restrictions.zone_value IS 'Valeur selon le type: "75020", "Versailles", ou "48.8566,2.3522,15" (lat,lng,radius_km)';
COMMENT ON COLUMN urgency_zone_restrictions.reason IS 'Raison de la restriction (ex: "Trop éloigné des prestataires actifs")';

-- Indexes
CREATE INDEX idx_urgency_zone_restrictions_type ON urgency_zone_restrictions(zone_type, is_active) WHERE is_active = true;
CREATE INDEX idx_urgency_zone_restrictions_value ON urgency_zone_restrictions(zone_value) WHERE is_active = true;

-- RLS Policies
ALTER TABLE urgency_zone_restrictions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view active zone restrictions"
ON urgency_zone_restrictions FOR SELECT
TO public
USING (is_active = true);

CREATE POLICY "Admins can manage zone restrictions"
ON urgency_zone_restrictions FOR ALL
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

## 7. services (Extensions)

**Purpose:** Extensions pour activer/désactiver Ready to Go par service

```sql
-- Extensions à la table services existante
ALTER TABLE services ADD COLUMN IF NOT EXISTS urgency_enabled BOOLEAN DEFAULT true;
ALTER TABLE services ADD COLUMN IF NOT EXISTS urgency_max_duration_minutes INT CHECK (urgency_max_duration_minutes > 0);

COMMENT ON COLUMN services.urgency_enabled IS 'Si false, ce service ne peut pas être réservé en mode Ready to Go';
COMMENT ON COLUMN services.urgency_max_duration_minutes IS 'Durée maximale (en minutes) pour qu''un service soit éligible au mode urgence (ex: 120 min). NULL = pas de limite';

-- Index
CREATE INDEX IF NOT EXISTS idx_services_urgency_enabled ON services(urgency_enabled) WHERE urgency_enabled = true AND is_active = true;
```

---

## Relationships Summary

```
platform_urgency_pricing
  ├─→ services (many-to-1, optionnel pour overrides)
  └─→ appointment_bookings (1-to-many via urgency_pricing_config_id)

contractor_urgency_config
  └─→ contractors (1-to-1)

appointment_bookings
  ├─→ platform_urgency_pricing (many-to-1)
  ├─→ urgent_notifications (1-to-many)
  └─→ urgency_analytics (1-to-1)

urgent_notifications
  ├─→ appointment_bookings (many-to-1)
  └─→ contractors (many-to-1)

urgency_analytics
  ├─→ appointment_bookings (many-to-1)
  ├─→ contractors (many-to-1)
  ├─→ services (many-to-1)
  └─→ profiles (clients) (many-to-1)

urgency_zone_restrictions (standalone)

services
  └─→ urgency_enabled (boolean flag)
```

---

## Database Views for Admin Dashboard

```sql
-- View: urgency_performance_by_tier
-- Performance globale par palier d'urgence
CREATE VIEW urgency_performance_by_tier AS
SELECT
  urgency_level,
  COUNT(*) AS total_requests,
  COUNT(CASE WHEN status = 'success' THEN 1 END) AS successful_bookings,
  COUNT(CASE WHEN status = 'timeout' THEN 1 END) AS timeout_count,
  COUNT(CASE WHEN status = 'no_contractor' THEN 1 END) AS no_contractor_count,
  ROUND(100.0 * COUNT(CASE WHEN status = 'success' THEN 1 END) / NULLIF(COUNT(*), 0), 2) AS conversion_rate_percentage,
  AVG(response_time_seconds) AS avg_response_time_seconds,
  PERCENTILE_CONT(0.5) WITHIN GROUP (ORDER BY response_time_seconds) AS median_response_time_seconds,
  AVG(contractor_attempts) AS avg_contractor_attempts,
  COUNT(CASE WHEN arrived_on_time = true THEN 1 END) AS arrived_on_time_count,
  ROUND(100.0 * COUNT(CASE WHEN arrived_on_time = true THEN 1 END) / NULLIF(COUNT(CASE WHEN actual_arrival_time IS NOT NULL THEN 1 END), 0), 2) AS on_time_rate_percentage,
  AVG(client_satisfaction_rating) AS avg_satisfaction_rating,
  SUM(surcharge_amount) AS total_surcharge_revenue,
  SUM(contractor_bonus) AS total_contractor_bonus,
  SUM(platform_revenue) AS total_platform_revenue
FROM urgency_analytics
WHERE requested_at >= NOW() - INTERVAL '30 days'
GROUP BY urgency_level
ORDER BY urgency_level;

COMMENT ON VIEW urgency_performance_by_tier IS 'Performance globale du service Ready to Go par palier d''urgence (30 derniers jours)';

-- View: contractor_urgency_stats
-- Statistiques Ready to Go par prestataire
CREATE VIEW contractor_urgency_stats AS
SELECT
  c.id AS contractor_id,
  c.first_name,
  c.last_name,
  cuc.is_enabled AS urgency_enabled,
  cuc.max_urgent_per_week,
  cuc.current_week_urgent_count,
  COUNT(ua.id) AS total_urgent_bookings,
  COUNT(CASE WHEN ua.status = 'success' THEN 1 END) AS successful_bookings,
  AVG(ua.response_time_seconds) AS avg_response_time_seconds,
  AVG(CASE WHEN ua.arrived_on_time = true THEN 1 ELSE 0 END) AS on_time_rate,
  AVG(ua.client_satisfaction_rating) AS avg_satisfaction_rating,
  SUM(ua.contractor_bonus) AS total_bonus_earned,
  COUNT(CASE WHEN un.status = 'timeout' THEN 1 END) AS timeout_count,
  COUNT(CASE WHEN un.status = 'refused' THEN 1 END) AS refused_count
FROM contractors c
LEFT JOIN contractor_urgency_config cuc ON cuc.contractor_id = c.id
LEFT JOIN urgency_analytics ua ON ua.assigned_contractor_id = c.id
LEFT JOIN urgent_notifications un ON un.contractor_id = c.id
GROUP BY c.id, c.first_name, c.last_name, cuc.is_enabled, cuc.max_urgent_per_week, cuc.current_week_urgent_count;

COMMENT ON VIEW contractor_urgency_stats IS 'Statistiques Ready to Go agrégées par prestataire pour dashboard admin';

-- View: urgency_revenue_breakdown
-- Répartition des revenus Ready to Go par mois
CREATE VIEW urgency_revenue_breakdown AS
SELECT
  DATE_TRUNC('month', requested_at) AS month,
  urgency_level,
  COUNT(*) AS booking_count,
  SUM(base_price) AS total_base_price,
  SUM(surcharge_amount) AS total_surcharge,
  SUM(contractor_bonus) AS total_contractor_bonus,
  SUM(platform_revenue) AS total_platform_revenue,
  AVG(surcharge_amount) AS avg_surcharge_per_booking
FROM urgency_analytics
WHERE status = 'success'
GROUP BY DATE_TRUNC('month', requested_at), urgency_level
ORDER BY month DESC, urgency_level;

COMMENT ON VIEW urgency_revenue_breakdown IS 'Répartition mensuelle des revenus Ready to Go par palier';

GRANT SELECT ON urgency_performance_by_tier TO authenticated;
GRANT SELECT ON contractor_urgency_stats TO authenticated;
GRANT SELECT ON urgency_revenue_breakdown TO authenticated;
```

---

## Migration Order

When implementing this data model, follow this order to respect foreign key constraints:

1. `platform_urgency_pricing` (references services - exists)
2. `contractor_urgency_config` (references contractors - exists)
3. `services` (extensions - requires existing table)
4. `appointment_bookings` (extensions - requires existing table)
5. `urgent_notifications` (references appointment_bookings, contractors)
6. `urgency_analytics` (references appointment_bookings, contractors, services, profiles)
7. `urgency_zone_restrictions` (standalone, no dependencies)
8. Create views: `urgency_performance_by_tier`, `contractor_urgency_stats`, `urgency_revenue_breakdown`

---

## Critical Triggers & Functions

```sql
-- Function: Increment contractor weekly urgent count
CREATE OR REPLACE FUNCTION increment_contractor_urgent_count()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.urgency_level IS NOT NULL THEN
    UPDATE contractor_urgency_config
    SET
      current_week_urgent_count = current_week_urgent_count + 1,
      updated_at = NOW()
    WHERE contractor_id = NEW.contractor_id;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER increment_urgent_count_on_booking
AFTER INSERT ON appointment_bookings
FOR EACH ROW
WHEN (NEW.urgency_level IS NOT NULL)
EXECUTE FUNCTION increment_contractor_urgent_count();

-- Function: Update contractor last known location after completed booking
CREATE OR REPLACE FUNCTION update_contractor_location_after_booking()
RETURNS TRIGGER AS $$
DECLARE
  booking_location JSONB;
BEGIN
  IF NEW.status = 'completed' AND NEW.service_address_data IS NOT NULL THEN
    -- Extract lat/lng from service_address_data
    booking_location = jsonb_build_object(
      'lat', (NEW.service_address_data->>'latitude')::DECIMAL,
      'lng', (NEW.service_address_data->>'longitude')::DECIMAL
    );

    UPDATE contractor_urgency_config
    SET
      last_known_location = booking_location,
      last_location_updated_at = NOW()
    WHERE contractor_id = NEW.contractor_id;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_location_on_booking_complete
AFTER UPDATE ON appointment_bookings
FOR EACH ROW
WHEN (NEW.status = 'completed' AND OLD.status != 'completed')
EXECUTE FUNCTION update_contractor_location_after_booking();

-- Function: Auto-create urgency analytics entry
CREATE OR REPLACE FUNCTION create_urgency_analytics_entry()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.urgency_level IS NOT NULL THEN
    INSERT INTO urgency_analytics (
      booking_id,
      urgency_level,
      requested_at,
      service_id,
      client_id,
      assigned_contractor_id,
      promised_arrival_window_start,
      promised_arrival_window_end,
      base_price,
      surcharge_amount,
      contractor_bonus,
      platform_revenue,
      status
    ) VALUES (
      NEW.id,
      NEW.urgency_level,
      NEW.urgency_requested_at,
      NEW.service_id,
      NEW.client_id,
      NEW.contractor_id,
      NEW.urgency_promised_arrival_start,
      NEW.urgency_promised_arrival_end,
      NEW.base_price,
      NEW.urgency_surcharge_amount,
      NEW.urgency_contractor_bonus,
      NEW.urgency_platform_revenue,
      CASE
        WHEN NEW.status = 'cancelled' THEN 'client_cancel'
        WHEN NEW.status IN ('completed', 'completed_by_contractor') THEN 'success'
        ELSE 'success' -- Will be updated later if needed
      END
    );
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER create_analytics_on_urgent_booking
AFTER INSERT ON appointment_bookings
FOR EACH ROW
WHEN (NEW.urgency_level IS NOT NULL)
EXECUTE FUNCTION create_urgency_analytics_entry();

-- Function: Check urgency zone restrictions
CREATE OR REPLACE FUNCTION check_urgency_zone_restriction(
  client_postal_code VARCHAR,
  client_city VARCHAR
) RETURNS BOOLEAN AS $$
DECLARE
  is_restricted BOOLEAN;
BEGIN
  SELECT EXISTS (
    SELECT 1 FROM urgency_zone_restrictions
    WHERE is_active = true
    AND (
      (zone_type = 'postal_code' AND zone_value = client_postal_code) OR
      (zone_type = 'city' AND LOWER(zone_value) = LOWER(client_city))
    )
  ) INTO is_restricted;

  RETURN NOT is_restricted; -- Return true if NOT restricted
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION check_urgency_zone_restriction IS 'Vérifie si une zone géographique est autorisée pour Ready to Go';
```

---

**Last Updated:** 2025-11-07
**Status:** Approved for Implementation
