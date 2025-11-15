-- Migration: Create contractor_slug_analytics table and view
-- Feature: 007-contractor-interface
-- Description: Suivi des visites sur les liens personnalisés des prestataires et taux de conversion

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
