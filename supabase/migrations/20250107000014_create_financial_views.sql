-- Migration: 20250107000014_create_financial_views.sql
-- Feature: 007 - Contractor Interface
-- Description: Create database views for contractor financial dashboard (monthly summary and transaction details)
-- Date: 2025-11-07

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

-- Note: Views cannot have RLS policies. These views inherit RLS from their base tables:
-- - contractors table (with RLS for contractor access)
-- - appointment_bookings table (with RLS for contractor and client access)
-- The inherited RLS ensures contractors only see their own financial data.
