# Data Model
# Feature 007: Interface Prestataire Complète

**Date:** 2025-11-07
**Status:** Approved
**Branch:** `007-contractor-interface`

---

## Overview

This document defines the complete data model for the contractor interface feature. All table and column names follow the project constitution:
- **Names:** English, snake_case
- **IDs:** BIGINT auto-increment (except auth.users UUID references)
- **Enums:** VARCHAR + CHECK constraints (no PostgreSQL ENUMs)
- **Comments:** French SQL comments for business context

---

## 1. specialties

**Purpose:** Spécialités prédéfinies disponibles dans le système pour différentes professions

```sql
CREATE TABLE specialties (
  id BIGINT PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
  name VARCHAR(100) NOT NULL,
  category VARCHAR(50) NOT NULL CHECK (category IN ('massage', 'beauty', 'hair', 'health', 'other')),
  description TEXT,
  is_active BOOLEAN DEFAULT true,
  display_order INT DEFAULT 0,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

COMMENT ON TABLE specialties IS 'Spécialités prédéfinies disponibles pour les prestataires selon leur profession';
COMMENT ON COLUMN specialties.name IS 'Nom de la spécialité (ex: Massage Suédois, Coupe Femme)';
COMMENT ON COLUMN specialties.category IS 'Catégorie professionnelle: massage/beauté/coiffure/santé/autre';
COMMENT ON COLUMN specialties.description IS 'Description détaillée de la spécialité pour aider les candidats';
COMMENT ON COLUMN specialties.is_active IS 'Si false, la spécialité n''apparaît plus dans les formulaires';
COMMENT ON COLUMN specialties.display_order IS 'Ordre d''affichage dans les listes (0 = premier)';

-- Indexes
CREATE INDEX idx_specialties_category ON specialties(category) WHERE is_active = true;
CREATE INDEX idx_specialties_active ON specialties(is_active, display_order);

-- RLS Policies
ALTER TABLE specialties ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view active specialties"
ON specialties FOR SELECT
TO public
USING (is_active = true);

CREATE POLICY "Admins can manage specialties"
ON specialties FOR ALL
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM profiles
    WHERE profiles.id = auth.uid()
    AND profiles.role = 'admin'
  )
);

-- Seed data examples
INSERT INTO specialties (name, category, display_order) VALUES
('Massage Suédois', 'massage', 1),
('Massage Deep Tissue', 'massage', 2),
('Massage Thaï', 'massage', 3),
('Massage Californien', 'massage', 4),
('Maquillage', 'beauty', 1),
('Manucure', 'beauty', 2),
('Pédicure', 'beauty', 3),
('Épilation', 'beauty', 4),
('Coupe Femme', 'hair', 1),
('Coupe Homme', 'hair', 2),
('Coloration', 'hair', 3),
('Brushing', 'hair', 4);
```

---

## 2. contractor_applications

**Purpose:** Candidatures de prestataires soumises via le formulaire public

```sql
CREATE TABLE contractor_applications (
  id BIGINT PRIMARY KEY GENERATED ALWAYS AS IDENTITY,

  -- Étape 1: Informations personnelles
  first_name VARCHAR(100) NOT NULL,
  last_name VARCHAR(100) NOT NULL,
  email VARCHAR(255) NOT NULL,
  phone VARCHAR(20) NOT NULL,
  address TEXT NOT NULL,

  -- Étape 2: Profil professionnel
  profession VARCHAR(100) NOT NULL,
  years_of_experience INT NOT NULL CHECK (years_of_experience >= 0),
  diplomas TEXT,
  specialties BIGINT[] NOT NULL, -- Array of specialty IDs
  services_offered TEXT NOT NULL,

  -- Étape 3: Disponibilités et zones
  geographic_zones TEXT[] NOT NULL, -- Array of zones (arrondissements, villes)
  preferred_schedule TEXT,
  work_frequency VARCHAR(50) CHECK (work_frequency IN ('full_time', 'part_time', 'occasional')),

  -- Étape 4: Motivation
  motivation TEXT NOT NULL CHECK (LENGTH(motivation) >= 100),

  -- Étape 5: Documents
  cv_file_path TEXT,
  certifications_file_paths TEXT[], -- Array of file paths
  portfolio_file_paths TEXT[], -- Array of file paths

  -- Statut de la candidature
  status VARCHAR(50) DEFAULT 'pending' CHECK (status IN ('pending', 'interview_scheduled', 'approved', 'rejected')),
  submitted_at TIMESTAMP DEFAULT NOW(),

  -- Admin review
  admin_comments TEXT,
  reviewed_by UUID REFERENCES profiles(id),
  reviewed_at TIMESTAMP,

  -- Entretien
  interview_date TIMESTAMP,
  interview_mode VARCHAR(50) CHECK (interview_mode IN ('video', 'phone', 'in_person')),
  interview_notes TEXT,

  -- Refus
  rejection_reason TEXT,

  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

COMMENT ON TABLE contractor_applications IS 'Candidatures de prestataires soumises via le formulaire multi-étapes';
COMMENT ON COLUMN contractor_applications.specialties IS 'IDs des spécialités sélectionnées (relation avec table specialties)';
COMMENT ON COLUMN contractor_applications.geographic_zones IS 'Zones d''intervention souhaitées (ex: ["75001", "75002", "Boulogne-Billancourt"])';
COMMENT ON COLUMN contractor_applications.motivation IS 'Texte libre minimum 100 caractères expliquant la motivation du candidat';
COMMENT ON COLUMN contractor_applications.cv_file_path IS 'Chemin du fichier CV dans Supabase Storage (bucket: job-applications/cv/)';
COMMENT ON COLUMN contractor_applications.certifications_file_paths IS 'Chemins des fichiers de certifications dans Supabase Storage';
COMMENT ON COLUMN contractor_applications.portfolio_file_paths IS 'Chemins des photos de réalisations dans Supabase Storage';
COMMENT ON COLUMN contractor_applications.status IS 'Statut: pending (en attente), interview_scheduled (entretien planifié), approved (validé), rejected (refusé)';
COMMENT ON COLUMN contractor_applications.rejection_reason IS 'Motif de refus obligatoire si status = rejected';

-- Indexes
CREATE INDEX idx_contractor_applications_status ON contractor_applications(status, submitted_at DESC);
CREATE INDEX idx_contractor_applications_email ON contractor_applications(email);

-- RLS Policies
ALTER TABLE contractor_applications ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can view all applications"
ON contractor_applications FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM profiles
    WHERE profiles.id = auth.uid()
    AND profiles.role = 'admin'
  )
);

CREATE POLICY "Admins can update applications"
ON contractor_applications FOR UPDATE
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM profiles
    WHERE profiles.id = auth.uid()
    AND profiles.role = 'admin'
  )
);

-- Validation trigger: reject if motivation too short
CREATE OR REPLACE FUNCTION check_contractor_application()
RETURNS TRIGGER AS $$
BEGIN
  IF LENGTH(NEW.motivation) < 100 THEN
    RAISE EXCEPTION 'La motivation doit contenir au moins 100 caractères';
  END IF;

  IF NEW.status = 'rejected' AND (NEW.rejection_reason IS NULL OR LENGTH(NEW.rejection_reason) < 10) THEN
    RAISE EXCEPTION 'Un motif de refus est obligatoire (minimum 10 caractères)';
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER validate_contractor_application
BEFORE INSERT OR UPDATE ON contractor_applications
FOR EACH ROW EXECUTE FUNCTION check_contractor_application();
```

---

## 3. contractor_onboarding_status

**Purpose:** État de complétion de l'onboarding obligatoire des nouveaux prestataires

```sql
CREATE TABLE contractor_onboarding_status (
  id BIGINT PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
  contractor_id BIGINT UNIQUE NOT NULL REFERENCES contractors(id) ON DELETE CASCADE,

  -- Étapes de l'onboarding
  account_created BOOLEAN DEFAULT true, -- Always true once record exists
  schedule_configured BOOLEAN DEFAULT false,
  stripe_connect_completed BOOLEAN DEFAULT false,
  profile_completed BOOLEAN DEFAULT false,

  -- Progression
  completion_percentage INT GENERATED ALWAYS AS (
    (
      CASE WHEN account_created THEN 25 ELSE 0 END +
      CASE WHEN schedule_configured THEN 25 ELSE 0 END +
      CASE WHEN stripe_connect_completed THEN 25 ELSE 0 END +
      CASE WHEN profile_completed THEN 25 ELSE 0 END
    )
  ) STORED,

  -- Onboarding terminé
  is_completed BOOLEAN GENERATED ALWAYS AS (
    schedule_configured AND stripe_connect_completed AND profile_completed
  ) STORED,

  -- Timestamps
  schedule_configured_at TIMESTAMP,
  stripe_connect_completed_at TIMESTAMP,
  profile_completed_at TIMESTAMP,
  completed_at TIMESTAMP,

  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

COMMENT ON TABLE contractor_onboarding_status IS 'État de complétion de l''onboarding obligatoire pour les nouveaux prestataires';
COMMENT ON COLUMN contractor_onboarding_status.schedule_configured IS 'Vrai si le prestataire a configuré ses horaires de travail';
COMMENT ON COLUMN contractor_onboarding_status.stripe_connect_completed IS 'Vrai si le compte Stripe Connect est vérifié et opérationnel';
COMMENT ON COLUMN contractor_onboarding_status.profile_completed IS 'Vrai si le profil professionnel (bio, spécialités) est rempli';
COMMENT ON COLUMN contractor_onboarding_status.completion_percentage IS 'Pourcentage de complétion calculé automatiquement (0-100)';
COMMENT ON COLUMN contractor_onboarding_status.is_completed IS 'Vrai si toutes les étapes sont terminées (permet d''accepter des réservations)';

-- Indexes
CREATE INDEX idx_contractor_onboarding_contractor ON contractor_onboarding_status(contractor_id);
CREATE INDEX idx_contractor_onboarding_incomplete ON contractor_onboarding_status(is_completed) WHERE is_completed = false;

-- RLS Policies
ALTER TABLE contractor_onboarding_status ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Contractors can view own onboarding status"
ON contractor_onboarding_status FOR SELECT
TO authenticated
USING (
  contractor_id IN (
    SELECT id FROM contractors WHERE profile_uuid = auth.uid()
  )
);

CREATE POLICY "Admins can view all onboarding status"
ON contractor_onboarding_status FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM profiles
    WHERE profiles.id = auth.uid()
    AND profiles.role = 'admin'
  )
);

-- Trigger: update completed_at when all steps done
CREATE OR REPLACE FUNCTION update_onboarding_completion()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.is_completed AND OLD.completed_at IS NULL THEN
    NEW.completed_at = NOW();
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER set_onboarding_completed_at
BEFORE UPDATE ON contractor_onboarding_status
FOR EACH ROW EXECUTE FUNCTION update_onboarding_completion();
```

---

## 4. contractor_schedules

**Purpose:** Horaires de travail hebdomadaires des prestataires (renommé de appointment_contractor_schedules)

```sql
CREATE TABLE contractor_schedules (
  id BIGINT PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
  contractor_id BIGINT NOT NULL REFERENCES contractors(id) ON DELETE CASCADE,

  -- Jour et horaires
  day_of_week INT NOT NULL CHECK (day_of_week BETWEEN 0 AND 6), -- 0 = dimanche, 6 = samedi
  start_time TIME NOT NULL,
  end_time TIME NOT NULL,

  -- Récurrence
  is_recurring BOOLEAN DEFAULT true,
  effective_from DATE DEFAULT CURRENT_DATE,
  effective_until DATE, -- NULL = indéfini

  -- Métadonnées
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),

  -- Contrainte: start_time < end_time
  CONSTRAINT valid_time_range CHECK (start_time < end_time)
);

COMMENT ON TABLE contractor_schedules IS 'Horaires de travail hebdomadaires configurés par les prestataires';
COMMENT ON COLUMN contractor_schedules.day_of_week IS 'Jour de la semaine (0=dimanche, 1=lundi, ..., 6=samedi)';
COMMENT ON COLUMN contractor_schedules.start_time IS 'Heure de début de disponibilité (ex: 09:00:00)';
COMMENT ON COLUMN contractor_schedules.end_time IS 'Heure de fin de disponibilité (ex: 18:00:00)';
COMMENT ON COLUMN contractor_schedules.is_recurring IS 'Si true, l''horaire se répète chaque semaine';
COMMENT ON COLUMN contractor_schedules.effective_from IS 'Date à partir de laquelle l''horaire est valide';
COMMENT ON COLUMN contractor_schedules.effective_until IS 'Date jusqu''à laquelle l''horaire est valide (NULL = indéfini)';

-- Indexes
CREATE INDEX idx_contractor_schedules_contractor ON contractor_schedules(contractor_id);
CREATE INDEX idx_contractor_schedules_day ON contractor_schedules(contractor_id, day_of_week) WHERE is_active = true;

-- Unique constraint: pas de chevauchement d'horaires pour le même jour
CREATE UNIQUE INDEX idx_contractor_schedules_unique ON contractor_schedules(
  contractor_id,
  day_of_week,
  start_time,
  end_time
) WHERE is_active = true;

-- RLS Policies
ALTER TABLE contractor_schedules ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Contractors can manage own schedules"
ON contractor_schedules FOR ALL
TO authenticated
USING (
  contractor_id IN (
    SELECT id FROM contractors WHERE profile_uuid = auth.uid()
  )
);

CREATE POLICY "Admins can view all schedules"
ON contractor_schedules FOR SELECT
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

## 5. contractor_unavailabilities

**Purpose:** Créneaux spécifiques bloqués par les prestataires (congés, rendez-vous personnels, pauses)

```sql
CREATE TABLE contractor_unavailabilities (
  id BIGINT PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
  contractor_id BIGINT NOT NULL REFERENCES contractors(id) ON DELETE CASCADE,

  -- Date et horaires
  start_datetime TIMESTAMP NOT NULL,
  end_datetime TIMESTAMP NOT NULL,

  -- Raison
  reason VARCHAR(255),
  reason_type VARCHAR(50) CHECK (reason_type IN ('vacation', 'personal', 'lunch_break', 'sick', 'other')),

  -- Récurrence (pour pauses déjeuner quotidiennes par exemple)
  is_recurring BOOLEAN DEFAULT false,
  recurrence_pattern VARCHAR(50), -- 'daily', 'weekly', 'monthly'
  recurrence_end_date DATE,

  -- Métadonnées
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),

  -- Contrainte: start < end
  CONSTRAINT valid_datetime_range CHECK (start_datetime < end_datetime)
);

COMMENT ON TABLE contractor_unavailabilities IS 'Créneaux spécifiques bloqués par les prestataires (congés, pauses, rendez-vous personnels)';
COMMENT ON COLUMN contractor_unavailabilities.start_datetime IS 'Date et heure de début de l''indisponibilité';
COMMENT ON COLUMN contractor_unavailabilities.end_datetime IS 'Date et heure de fin de l''indisponibilité';
COMMENT ON COLUMN contractor_unavailabilities.reason_type IS 'Type d''indisponibilité: vacation (congés), personal (RDV perso), lunch_break (pause déjeuner), sick (maladie), other';
COMMENT ON COLUMN contractor_unavailabilities.is_recurring IS 'Si true, l''indisponibilité se répète selon recurrence_pattern';
COMMENT ON COLUMN contractor_unavailabilities.recurrence_pattern IS 'Schéma de récurrence: daily (chaque jour), weekly (chaque semaine), monthly (chaque mois)';

-- Indexes
CREATE INDEX idx_contractor_unavailabilities_contractor ON contractor_unavailabilities(contractor_id);
CREATE INDEX idx_contractor_unavailabilities_dates ON contractor_unavailabilities(contractor_id, start_datetime, end_datetime) WHERE is_active = true;

-- RLS Policies
ALTER TABLE contractor_unavailabilities ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Contractors can manage own unavailabilities"
ON contractor_unavailabilities FOR ALL
TO authenticated
USING (
  contractor_id IN (
    SELECT id FROM contractors WHERE profile_uuid = auth.uid()
  )
);

CREATE POLICY "Admins can view all unavailabilities"
ON contractor_unavailabilities FOR SELECT
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

## 6. booking_requests

**Purpose:** Demandes de réservations en attente de validation par le prestataire

```sql
CREATE TABLE booking_requests (
  id BIGINT PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
  booking_id BIGINT UNIQUE NOT NULL REFERENCES appointment_bookings(id) ON DELETE CASCADE,
  contractor_id BIGINT NOT NULL REFERENCES contractors(id) ON DELETE CASCADE,

  -- Statut de la demande
  status VARCHAR(50) DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'refused', 'expired')),

  -- Délais
  requested_at TIMESTAMP DEFAULT NOW(),
  expires_at TIMESTAMP DEFAULT NOW() + INTERVAL '24 hours',
  responded_at TIMESTAMP,

  -- Réponse du prestataire
  contractor_message TEXT, -- Message optionnel lors du refus
  refusal_reason VARCHAR(255),

  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

COMMENT ON TABLE booking_requests IS 'Demandes de réservations en attente de validation par le prestataire (délai 24h)';
COMMENT ON COLUMN booking_requests.status IS 'Statut: pending (en attente), accepted (accepté), refused (refusé), expired (délai dépassé)';
COMMENT ON COLUMN booking_requests.expires_at IS 'Date limite de réponse (24h après demande). Après expiration, statut passe à expired automatiquement';
COMMENT ON COLUMN booking_requests.contractor_message IS 'Message optionnel du prestataire au client (surtout en cas de refus)';
COMMENT ON COLUMN booking_requests.refusal_reason IS 'Motif de refus si status = refused';

-- Indexes
CREATE INDEX idx_booking_requests_contractor ON booking_requests(contractor_id, status);
CREATE INDEX idx_booking_requests_expires ON booking_requests(expires_at) WHERE status = 'pending';

-- RLS Policies
ALTER TABLE booking_requests ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Contractors can view own requests"
ON booking_requests FOR SELECT
TO authenticated
USING (
  contractor_id IN (
    SELECT id FROM contractors WHERE profile_uuid = auth.uid()
  )
);

CREATE POLICY "Contractors can update own requests"
ON booking_requests FOR UPDATE
TO authenticated
USING (
  contractor_id IN (
    SELECT id FROM contractors WHERE profile_uuid = auth.uid()
  )
);

CREATE POLICY "Admins can view all requests"
ON booking_requests FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM profiles
    WHERE profiles.id = auth.uid()
    AND profiles.role = 'admin'
  )
);

-- Trigger: auto-expire after 24h
-- This will be handled by a cron job (see Edge Function: expire-pending-requests.ts)
```

---

## 7. contractor_profiles

**Purpose:** Profils professionnels publics des prestataires

```sql
CREATE TABLE contractor_profiles (
  id BIGINT PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
  contractor_id BIGINT UNIQUE NOT NULL REFERENCES contractors(id) ON DELETE CASCADE,

  -- Informations publiques
  bio TEXT,
  professional_title VARCHAR(200), -- Ex: "Masseuse professionnelle certifiée"
  years_of_experience INT CHECK (years_of_experience >= 0),

  -- Spécialités (many-to-many via junction table contractor_profile_specialties)
  -- Handled separately

  -- Portfolio
  portfolio_image_paths TEXT[], -- Paths in Supabase Storage
  certification_paths TEXT[], -- Paths to diplomas/certifications
  certifications_verified BOOLEAN DEFAULT false, -- Admin verification

  -- Zone d'intervention
  service_area_center TEXT, -- Adresse de base
  service_radius_km INT DEFAULT 10, -- Rayon en km
  postal_codes TEXT[], -- Codes postaux couverts

  -- Affichage
  is_visible BOOLEAN DEFAULT true,
  is_featured BOOLEAN DEFAULT false, -- Mis en avant dans les recherches

  -- Métadonnées
  profile_completeness_percentage INT DEFAULT 0,
  last_profile_update TIMESTAMP DEFAULT NOW(),
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

COMMENT ON TABLE contractor_profiles IS 'Profils professionnels publics des prestataires visibles par les clients';
COMMENT ON COLUMN contractor_profiles.bio IS 'Description professionnelle rédigée par le prestataire (max 500 caractères recommandé)';
COMMENT ON COLUMN contractor_profiles.professional_title IS 'Titre professionnel affiché (ex: Masseuse certifiée, Coiffeur à domicile)';
COMMENT ON COLUMN contractor_profiles.portfolio_image_paths IS 'Chemins des photos de réalisations dans Supabase Storage (max 10 recommandé)';
COMMENT ON COLUMN contractor_profiles.certifications_verified IS 'Si true, les diplômes ont été vérifiés par un administrateur (badge visible)';
COMMENT ON COLUMN contractor_profiles.service_area_center IS 'Adresse centrale du prestataire pour calculer les distances';
COMMENT ON COLUMN contractor_profiles.service_radius_km IS 'Rayon d''intervention en kilomètres depuis le centre';
COMMENT ON COLUMN contractor_profiles.postal_codes IS 'Liste des codes postaux couverts (ex: ["75001", "75002", "92100"])';
COMMENT ON COLUMN contractor_profiles.is_visible IS 'Si false, le profil n''apparaît pas dans les recherches clients';
COMMENT ON COLUMN contractor_profiles.is_featured IS 'Si true, le profil est mis en avant dans les résultats de recherche';
COMMENT ON COLUMN contractor_profiles.profile_completeness_percentage IS 'Pourcentage de complétion du profil (0-100) pour encourager la complétion';

-- Indexes
CREATE INDEX idx_contractor_profiles_contractor ON contractor_profiles(contractor_id);
CREATE INDEX idx_contractor_profiles_visible ON contractor_profiles(is_visible, is_featured);

-- RLS Policies
ALTER TABLE contractor_profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view visible profiles"
ON contractor_profiles FOR SELECT
TO public
USING (is_visible = true);

CREATE POLICY "Contractors can update own profile"
ON contractor_profiles FOR UPDATE
TO authenticated
USING (
  contractor_id IN (
    SELECT id FROM contractors WHERE profile_uuid = auth.uid()
  )
);

CREATE POLICY "Admins can manage all profiles"
ON contractor_profiles FOR ALL
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM profiles
    WHERE profiles.id = auth.uid()
    AND profiles.role = 'admin'
  )
);

-- Junction table: contractor_profile_specialties
CREATE TABLE contractor_profile_specialties (
  contractor_profile_id BIGINT NOT NULL REFERENCES contractor_profiles(id) ON DELETE CASCADE,
  specialty_id BIGINT NOT NULL REFERENCES specialties(id) ON DELETE CASCADE,
  added_at TIMESTAMP DEFAULT NOW(),
  PRIMARY KEY (contractor_profile_id, specialty_id)
);

COMMENT ON TABLE contractor_profile_specialties IS 'Table de liaison many-to-many entre profils prestataires et spécialités';

CREATE INDEX idx_contractor_profile_specialties_profile ON contractor_profile_specialties(contractor_profile_id);
CREATE INDEX idx_contractor_profile_specialties_specialty ON contractor_profile_specialties(specialty_id);

ALTER TABLE contractor_profile_specialties ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view profile specialties"
ON contractor_profile_specialties FOR SELECT
TO public
USING (true);

CREATE POLICY "Contractors can manage own profile specialties"
ON contractor_profile_specialties FOR ALL
TO authenticated
USING (
  contractor_profile_id IN (
    SELECT cp.id FROM contractor_profiles cp
    JOIN contractors c ON c.id = cp.contractor_id
    WHERE c.profile_uuid = auth.uid()
  )
);
```

---

## 8. contractor_slug_history

**Purpose:** Historique des changements de slug pour redirection temporaire (30 jours)

```sql
CREATE TABLE contractor_slug_history (
  id BIGINT PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
  contractor_id BIGINT NOT NULL REFERENCES contractors(id) ON DELETE CASCADE,

  -- Slugs
  old_slug VARCHAR(50) NOT NULL,
  new_slug VARCHAR(50) NOT NULL,

  -- Durée de vie de la redirection
  created_at TIMESTAMP DEFAULT NOW(),
  expires_at TIMESTAMP DEFAULT NOW() + INTERVAL '30 days',
  is_active BOOLEAN DEFAULT true,

  -- Métadonnées
  change_reason VARCHAR(255), -- Optionnel: pourquoi le prestataire a changé
  changed_by_admin BOOLEAN DEFAULT false -- True si changement forcé par admin
);

COMMENT ON TABLE contractor_slug_history IS 'Historique des changements de slug pour maintenir des redirections temporaires (30 jours)';
COMMENT ON COLUMN contractor_slug_history.old_slug IS 'Ancien slug qui doit être redirigé';
COMMENT ON COLUMN contractor_slug_history.new_slug IS 'Nouveau slug vers lequel rediriger';
COMMENT ON COLUMN contractor_slug_history.expires_at IS 'Date d''expiration de la redirection (30 jours après changement)';
COMMENT ON COLUMN contractor_slug_history.is_active IS 'Si false, la redirection n''est plus active (après expiration ou suppression manuelle)';
COMMENT ON COLUMN contractor_slug_history.changed_by_admin IS 'True si un admin a forcé le changement de slug (ex: slug inapproprié)';

-- Indexes
CREATE INDEX idx_contractor_slug_history_contractor ON contractor_slug_history(contractor_id);
CREATE UNIQUE INDEX idx_contractor_slug_history_old_slug_active ON contractor_slug_history(old_slug) WHERE is_active = true;

-- RLS Policies
ALTER TABLE contractor_slug_history ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Contractors can view own slug history"
ON contractor_slug_history FOR SELECT
TO authenticated
USING (
  contractor_id IN (
    SELECT id FROM contractors WHERE profile_uuid = auth.uid()
  )
);

CREATE POLICY "Admins can view all slug history"
ON contractor_slug_history FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM profiles
    WHERE profiles.id = auth.uid()
    AND profiles.role = 'admin'
  )
);

-- Cleanup job (run daily via cron)
-- DELETE FROM contractor_slug_history WHERE expires_at < NOW();
```

---

## 9. contractor_slug_analytics

**Purpose:** Suivi des visites et conversions par slug pour statistiques prestataires

```sql
CREATE TABLE contractor_slug_analytics (
  id BIGINT PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
  contractor_id BIGINT NOT NULL REFERENCES contractors(id) ON DELETE CASCADE,

  -- Visite
  slug_used VARCHAR(50) NOT NULL, -- Peut être ancien slug ou slug actuel
  visited_at TIMESTAMP DEFAULT NOW(),

  -- Tracking
  referrer TEXT, -- URL d'où vient le visiteur
  user_agent TEXT, -- Navigateur/device
  ip_address VARCHAR(45), -- IPv4 ou IPv6
  session_id VARCHAR(255), -- Cookie session pour déduplication

  -- Conversion
  converted BOOLEAN DEFAULT false, -- True si la visite a mené à une réservation confirmée
  booking_id BIGINT REFERENCES appointment_bookings(id) ON DELETE SET NULL,
  conversion_timestamp TIMESTAMP
);

COMMENT ON TABLE contractor_slug_analytics IS 'Suivi des visites sur les liens personnalisés des prestataires et taux de conversion';
COMMENT ON COLUMN contractor_slug_analytics.slug_used IS 'Slug utilisé lors de la visite (peut être un ancien slug redirigé)';
COMMENT ON COLUMN contractor_slug_analytics.referrer IS 'URL de provenance (réseaux sociaux, site web personnel, etc.)';
COMMENT ON COLUMN contractor_slug_analytics.session_id IS 'Identifiant de session pour déduplication des visites (cookie 30min)';
COMMENT ON COLUMN contractor_slug_analytics.converted IS 'True si la visite a abouti à une réservation confirmée';
COMMENT ON COLUMN contractor_slug_analytics.booking_id IS 'ID de la réservation créée lors de cette visite (si converted = true)';

-- Indexes
CREATE INDEX idx_contractor_slug_analytics_contractor ON contractor_slug_analytics(contractor_id, visited_at DESC);
CREATE INDEX idx_contractor_slug_analytics_session ON contractor_slug_analytics(session_id) WHERE converted = false;
CREATE INDEX idx_contractor_slug_analytics_converted ON contractor_slug_analytics(contractor_id, converted) WHERE converted = true;

-- RLS Policies
ALTER TABLE contractor_slug_analytics ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Contractors can view own analytics"
ON contractor_slug_analytics FOR SELECT
TO authenticated
USING (
  contractor_id IN (
    SELECT id FROM contractors WHERE profile_uuid = auth.uid()
  )
);

CREATE POLICY "Admins can view all analytics"
ON contractor_slug_analytics FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM profiles
    WHERE profiles.id = auth.uid()
    AND profiles.role = 'admin'
  )
);

-- View: contractor_slug_stats (agregated analytics)
CREATE VIEW contractor_slug_stats AS
SELECT
  contractor_id,
  COUNT(DISTINCT session_id) AS total_visits,
  COUNT(DISTINCT CASE WHEN visited_at >= NOW() - INTERVAL '30 days' THEN session_id END) AS visits_last_30_days,
  COUNT(DISTINCT CASE WHEN converted = true THEN booking_id END) AS total_conversions,
  CASE
    WHEN COUNT(DISTINCT session_id) > 0
    THEN (COUNT(DISTINCT CASE WHEN converted = true THEN booking_id END)::DECIMAL / COUNT(DISTINCT session_id)::DECIMAL) * 100
    ELSE 0
  END AS conversion_rate_percentage
FROM contractor_slug_analytics
GROUP BY contractor_id;

COMMENT ON VIEW contractor_slug_stats IS 'Statistiques agrégées des visites et conversions par prestataire';

GRANT SELECT ON contractor_slug_stats TO authenticated;

CREATE POLICY "Contractors can view own stats"
ON contractor_slug_stats FOR SELECT
TO authenticated
USING (
  contractor_id IN (
    SELECT id FROM contractors WHERE profile_uuid = auth.uid()
  )
);
```

---

## 10. platform_config

**Purpose:** Configuration globale de la plateforme (slugs interdits, paramètres système)

```sql
CREATE TABLE platform_config (
  key VARCHAR(255) PRIMARY KEY,
  value JSONB NOT NULL,
  description TEXT,
  updated_at TIMESTAMP DEFAULT NOW(),
  updated_by UUID REFERENCES profiles(id)
);

COMMENT ON TABLE platform_config IS 'Configuration globale de la plateforme (paramètres système, listes de valeurs)';
COMMENT ON COLUMN platform_config.key IS 'Clé unique du paramètre (ex: forbidden_slugs, commission_default)';
COMMENT ON COLUMN platform_config.value IS 'Valeur JSONB flexible (peut être array, object, string, number)';

-- RLS Policies
ALTER TABLE platform_config ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read platform config"
ON platform_config FOR SELECT
TO public
USING (true);

CREATE POLICY "Admins can manage platform config"
ON platform_config FOR ALL
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM profiles
    WHERE profiles.id = auth.uid()
    AND profiles.role = 'admin'
  )
);

-- Seed: forbidden slugs
INSERT INTO platform_config (key, value, description) VALUES (
  'forbidden_slugs',
  '["admin", "api", "www", "book", "search", "login", "register", "support", "help", "contact", "about", "dashboard", "settings", "account", "profile", "bookings", "payments", "test", "dev", "staging", "prod", "stripe", "supabase", "simone", "contractor", "client", "user", "public", "private", "secret", "config", "database", "cache", "upload", "download", "delete", "create", "update", "null", "undefined", "true", "false", "home", "faq", "legal", "privacy", "terms", "blog", "news", "careers", "team", "pricing"]'::JSONB,
  'Liste des slugs interdits pour les URLs prestataires'
);

-- Seed: commission default
INSERT INTO platform_config (key, value, description) VALUES (
  'commission_default_percentage',
  '15.0'::JSONB,
  'Taux de commission par défaut appliqué aux nouveaux prestataires (15%)'
);

-- Seed: slug change limit
INSERT INTO platform_config (key, value, description) VALUES (
  'slug_change_limit_per_year',
  '3'::JSONB,
  'Nombre maximum de changements de slug autorisés par an et par prestataire'
);
```

---

## 11. contractor_services

**Purpose:** Services proposés par chaque prestataire (relation many-to-many avec possibilité de prix personnalisés)

```sql
CREATE TABLE contractor_services (
  id BIGINT PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
  contractor_id BIGINT NOT NULL REFERENCES contractors(id) ON DELETE CASCADE,
  service_id BIGINT NOT NULL REFERENCES services(id) ON DELETE CASCADE,

  -- Activation
  is_active BOOLEAN DEFAULT true,

  -- Personnalisation (optionnel)
  custom_price DECIMAL(10, 2), -- NULL = utiliser le prix par défaut du service
  custom_duration INT, -- NULL = utiliser la durée par défaut (en minutes)
  custom_description TEXT, -- NULL = utiliser la description par défaut

  -- Métadonnées
  added_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),

  -- Unique constraint
  UNIQUE (contractor_id, service_id)
);

COMMENT ON TABLE contractor_services IS 'Services proposés par chaque prestataire avec possibilité de personnalisation (prix, durée)';
COMMENT ON COLUMN contractor_services.custom_price IS 'Prix personnalisé pour ce prestataire (NULL = utiliser le prix par défaut du service)';
COMMENT ON COLUMN contractor_services.custom_duration IS 'Durée personnalisée en minutes (NULL = utiliser la durée par défaut)';
COMMENT ON COLUMN contractor_services.custom_description IS 'Description personnalisée visible par les clients (NULL = utiliser description par défaut)';
COMMENT ON COLUMN contractor_services.is_active IS 'Si false, le service n''est plus proposé par ce prestataire';

-- Indexes
CREATE INDEX idx_contractor_services_contractor ON contractor_services(contractor_id) WHERE is_active = true;
CREATE INDEX idx_contractor_services_service ON contractor_services(service_id);

-- RLS Policies
ALTER TABLE contractor_services ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view active contractor services"
ON contractor_services FOR SELECT
TO public
USING (is_active = true);

CREATE POLICY "Contractors can manage own services"
ON contractor_services FOR ALL
TO authenticated
USING (
  contractor_id IN (
    SELECT id FROM contractors WHERE profile_uuid = auth.uid()
  )
);

CREATE POLICY "Admins can manage all contractor services"
ON contractor_services FOR ALL
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

## 12. contractors (Extensions)

**Purpose:** Ajout des colonnes nécessaires à la table contractors existante

```sql
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
```

---

## 13. appointment_bookings (Extensions)

**Purpose:** Ajout des colonnes nécessaires pour le suivi des tips et statuts prestataire

```sql
-- Extensions à la table appointment_bookings existante
ALTER TABLE appointment_bookings ADD COLUMN IF NOT EXISTS tip_amount DECIMAL(10, 2) DEFAULT 0;
ALTER TABLE appointment_bookings ADD COLUMN IF NOT EXISTS stripe_fee_tip DECIMAL(10, 2) DEFAULT 0;
ALTER TABLE appointment_bookings ADD COLUMN IF NOT EXISTS tip_transfer_id VARCHAR(255);
ALTER TABLE appointment_bookings ADD COLUMN IF NOT EXISTS tip_processed_at TIMESTAMP;
ALTER TABLE appointment_bookings ADD COLUMN IF NOT EXISTS stripe_fee_service DECIMAL(10, 2) DEFAULT 0;

COMMENT ON COLUMN appointment_bookings.tip_amount IS 'Montant du pourboire laissé par le client (en euros)';
COMMENT ON COLUMN appointment_bookings.stripe_fee_tip IS 'Frais Stripe prélevés sur le pourboire (toujours déduits du tip)';
COMMENT ON COLUMN appointment_bookings.tip_transfer_id IS 'ID du Stripe Transfer pour le pourboire vers le compte Connect du prestataire';
COMMENT ON COLUMN appointment_bookings.tip_processed_at IS 'Date et heure de traitement du pourboire';
COMMENT ON COLUMN appointment_bookings.stripe_fee_service IS 'Frais Stripe prélevés sur le paiement du service (selon contractor_pays_stripe_fees)';

-- Ajouter le statut completed_by_contractor aux statuts existants
-- Assuming status is VARCHAR with CHECK constraint
ALTER TABLE appointment_bookings DROP CONSTRAINT IF EXISTS appointment_bookings_status_check;
ALTER TABLE appointment_bookings ADD CONSTRAINT appointment_bookings_status_check
CHECK (status IN ('pending', 'confirmed', 'in_progress', 'completed_by_contractor', 'completed', 'cancelled', 'refunded'));

COMMENT ON COLUMN appointment_bookings.status IS 'Statut: pending (en attente validation prestataire), confirmed (validé, à venir), in_progress (en cours), completed_by_contractor (terminé par prestataire, en attente paiement), completed (service terminé et payé), cancelled (annulé), refunded (remboursé)';
```

---

## 14. service_action_logs

**Purpose:** Logs d'actions sur les réservations pour traçabilité (marquage terminé, capture paiement, etc.)

```sql
CREATE TABLE service_action_logs (
  id BIGINT PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
  booking_id BIGINT NOT NULL REFERENCES appointment_bookings(id) ON DELETE CASCADE,

  -- Action
  action_type VARCHAR(100) NOT NULL,
  performed_by_type VARCHAR(50) NOT NULL CHECK (performed_by_type IN ('client', 'contractor', 'admin', 'system')),
  performed_by_id UUID REFERENCES profiles(id),

  -- Détails
  action_details JSONB,
  timestamp TIMESTAMP DEFAULT NOW(),

  -- Contexte
  ip_address VARCHAR(45),
  user_agent TEXT
);

COMMENT ON TABLE service_action_logs IS 'Logs de toutes les actions effectuées sur les réservations pour traçabilité et audit';
COMMENT ON COLUMN service_action_logs.action_type IS 'Type d''action: completed_by_contractor, payment_captured, tip_added, cancelled, refunded, etc.';
COMMENT ON COLUMN service_action_logs.performed_by_type IS 'Qui a effectué l''action: client, contractor, admin, system (automatique)';
COMMENT ON COLUMN service_action_logs.action_details IS 'Détails supplémentaires en JSON (montants, motifs, etc.)';

-- Indexes
CREATE INDEX idx_service_action_logs_booking ON service_action_logs(booking_id, timestamp DESC);
CREATE INDEX idx_service_action_logs_performed_by ON service_action_logs(performed_by_id);

-- RLS Policies
ALTER TABLE service_action_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Contractors can view logs for own bookings"
ON service_action_logs FOR SELECT
TO authenticated
USING (
  booking_id IN (
    SELECT b.id FROM appointment_bookings b
    JOIN contractors c ON c.id = b.contractor_id
    WHERE c.profile_uuid = auth.uid()
  )
);

CREATE POLICY "Admins can view all logs"
ON service_action_logs FOR SELECT
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

## Relationships Summary

```
specialties
  ↓ (many-to-many)
contractor_profile_specialties
  ↓
contractor_profiles
  ↓ (1-to-1)
contractors
  ├─→ contractor_onboarding_status (1-to-1)
  ├─→ contractor_schedules (1-to-many)
  ├─→ contractor_unavailabilities (1-to-many)
  ├─→ contractor_slug_history (1-to-many)
  ├─→ contractor_slug_analytics (1-to-many)
  ├─→ contractor_services (1-to-many) → services
  ├─→ booking_requests (1-to-many)
  └─→ appointment_bookings (1-to-many)
        └─→ service_action_logs (1-to-many)

contractor_applications (standalone, creates contractor after approval)
platform_config (global configuration)
```

---

## Database Views for Financial Dashboard

```sql
-- View: contractor_financial_summary
-- Résumé financier mensuel pour chaque prestataire
CREATE VIEW contractor_financial_summary AS
SELECT
  c.id AS contractor_id,

  -- Revenus services (mois en cours)
  COALESCE(SUM(
    CASE
      WHEN b.status IN ('completed', 'completed_by_contractor')
      AND DATE_TRUNC('month', b.completed_at) = DATE_TRUNC('month', NOW())
      THEN b.service_amount - (b.service_amount * c.commission_rate / 100) - (
        CASE
          WHEN c.contractor_pays_stripe_fees THEN b.stripe_fee_service
          ELSE 0
        END
      )
      ELSE 0
    END
  ), 0) AS revenue_service_current_month,

  -- Pourboires (mois en cours)
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
        (b.service_amount - (b.service_amount * c.commission_rate / 100) -
          CASE WHEN c.contractor_pays_stripe_fees THEN b.stripe_fee_service ELSE 0 END) +
        (CASE WHEN b.tip_amount > 0 THEN b.tip_amount - b.stripe_fee_tip ELSE 0 END)
      ELSE 0
    END
  ), 0) AS total_net_current_month,

  -- Statistiques
  COUNT(CASE WHEN b.status IN ('completed', 'completed_by_contractor') THEN 1 END) AS total_completed_bookings,
  COUNT(CASE WHEN b.status IN ('completed', 'completed_by_contractor') AND b.tip_amount > 0 THEN 1 END) AS total_bookings_with_tips,
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

COMMENT ON VIEW contractor_financial_summary IS 'Résumé financier mensuel pour chaque prestataire avec revenus services, tips et total net';

GRANT SELECT ON contractor_financial_summary TO authenticated;

-- View: contractor_transaction_details
-- Détail de chaque transaction pour historique et export CSV
CREATE VIEW contractor_transaction_details AS
SELECT
  b.id AS booking_id,
  b.contractor_id,
  b.completed_at,
  b.client_name,
  b.service_name,

  -- Détail service
  b.service_amount AS service_gross,
  (b.service_amount * c.commission_rate / 100) AS service_commission,
  CASE WHEN c.contractor_pays_stripe_fees THEN b.stripe_fee_service ELSE 0 END AS service_stripe_fee,
  (b.service_amount - (b.service_amount * c.commission_rate / 100) -
    CASE WHEN c.contractor_pays_stripe_fees THEN b.stripe_fee_service ELSE 0 END) AS service_net,

  -- Détail tip
  b.tip_amount AS tip_gross,
  b.stripe_fee_tip AS tip_stripe_fee,
  (b.tip_amount - b.stripe_fee_tip) AS tip_net,

  -- Total
  (b.service_amount - (b.service_amount * c.commission_rate / 100) -
    CASE WHEN c.contractor_pays_stripe_fees THEN b.stripe_fee_service ELSE 0 END) +
  (b.tip_amount - b.stripe_fee_tip) AS total_net,

  -- Métadonnées
  c.commission_rate,
  c.contractor_pays_stripe_fees

FROM appointment_bookings b
JOIN contractors c ON c.id = b.contractor_id
WHERE b.status IN ('completed', 'completed_by_contractor')
ORDER BY b.completed_at DESC;

COMMENT ON VIEW contractor_transaction_details IS 'Détail complet de chaque transaction pour historique financier et exports CSV';

GRANT SELECT ON contractor_transaction_details TO authenticated;
```

---

## Migration Order

When implementing this data model, follow this order to respect foreign key constraints:

1. `specialties` (no dependencies)
2. `platform_config` (no dependencies)
3. `contractors` (extensions - requires existing contractors table)
4. `contractor_applications` (references specialties)
5. `contractor_onboarding_status` (references contractors)
6. `contractor_schedules` (references contractors)
7. `contractor_unavailabilities` (references contractors)
8. `contractor_profiles` (references contractors)
9. `contractor_profile_specialties` (junction table)
10. `contractor_services` (references contractors, services)
11. `contractor_slug_history` (references contractors)
12. `contractor_slug_analytics` (references contractors, appointment_bookings)
13. `appointment_bookings` (extensions - requires existing table)
14. `booking_requests` (references appointment_bookings, contractors)
15. `service_action_logs` (references appointment_bookings)
16. Create views: `contractor_financial_summary`, `contractor_transaction_details`, `contractor_slug_stats`

---

**Last Updated:** 2025-11-07
**Status:** Approved for Implementation
