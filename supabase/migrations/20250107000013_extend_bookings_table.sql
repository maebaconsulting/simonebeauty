-- Migration: 20250107000013_extend_bookings_table.sql
-- Feature: 007 - Contractor Interface
-- Description: Extend appointment_bookings table with tip columns, stripe_fee_service, and updated status constraint
-- Date: 2025-11-07

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
