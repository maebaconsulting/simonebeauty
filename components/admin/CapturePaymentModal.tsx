'use client'

/**
 * Capture Payment Modal
 * Feature: Admin Back Office - Manual Payment Capture
 * SpecKit: spec 005 User Story 9 - Capture Manuelle
 */

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { X, DollarSign, AlertCircle, CheckCircle } from 'lucide-react'
import { AdminBookingWithDetails } from '@/types/booking'

interface CapturePaymentModalProps {
  isOpen: boolean
  onClose: () => void
  onCapture: (data: {
    notify_parties: boolean
    admin_notes?: string
  }) => Promise<void>
  booking: AdminBookingWithDetails
}

export function CapturePaymentModal({
  isOpen,
  onClose,
  onCapture,
  booking
}: CapturePaymentModalProps) {
  const [notifyParties, setNotifyParties] = useState(true)
  const [adminNotes, setAdminNotes] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('fr-FR', {
      style: 'currency',
      currency: 'EUR',
    }).format(amount)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)

    try {
      await onCapture({
        notify_parties: notifyParties,
        admin_notes: adminNotes.trim() || undefined,
      })

      // Reset form
      setAdminNotes('')
      setNotifyParties(true)
      onClose()
    } catch (error) {
      console.error('Error capturing payment:', error)
      alert('Erreur lors de la capture du paiement: ' + (error instanceof Error ? error.message : 'Unknown error'))
    } finally {
      setIsSubmitting(false)
    }
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
      <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div>
            <h2 className="text-xl font-semibold text-gray-900 flex items-center gap-2">
              <DollarSign className="w-5 h-5 text-green-600" />
              Capturer le paiement
            </h2>
            <p className="text-sm text-gray-600 mt-1">
              Réservation #{booking.id} - {booking.client_name}
            </p>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
            disabled={isSubmitting}
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {/* Warning */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <h3 className="text-sm font-semibold text-blue-900 mb-3 flex items-center gap-2">
              <AlertCircle className="w-4 h-4" />
              Informations importantes :
            </h3>
            <ul className="space-y-2 text-sm text-blue-800">
              <li className="flex items-start gap-2">
                <span className="font-bold mt-0.5">•</span>
                <span>
                  Le paiement sera <strong>immédiatement capturé</strong> depuis le compte Stripe du client
                </span>
              </li>
              <li className="flex items-start gap-2">
                <span className="font-bold mt-0.5">•</span>
                <span>
                  Cette action est <strong>irréversible</strong> (seul un remboursement manuel sera possible)
                </span>
              </li>
              <li className="flex items-start gap-2">
                <span className="font-bold mt-0.5">•</span>
                <span>
                  Le statut de la réservation passera à <strong>"Terminée"</strong>
                </span>
              </li>
            </ul>
          </div>

          {/* Payment Details */}
          <div className="bg-gray-50 rounded-lg p-4 space-y-3">
            <h3 className="font-semibold text-gray-900">Détails du paiement</h3>

            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <span className="text-gray-600">Montant du service:</span>
                <div className="font-semibold text-gray-900">
                  {formatCurrency(booking.service_amount)}
                </div>
              </div>

              {booking.tip_amount > 0 && (
                <div>
                  <span className="text-gray-600">Pourboire:</span>
                  <div className="font-semibold text-gray-900">
                    {formatCurrency(booking.tip_amount)}
                  </div>
                </div>
              )}

              <div>
                <span className="text-gray-600">Payment Intent ID:</span>
                <div className="font-mono text-xs text-gray-700 break-all">
                  {booking.stripe_payment_intent_id}
                </div>
              </div>

              <div>
                <span className="text-gray-600">Statut actuel:</span>
                <div className="font-semibold text-gray-900">
                  {booking.payment_status === 'authorized' ? 'Pré-autorisé' : booking.payment_status}
                </div>
              </div>
            </div>

            <div className="pt-3 border-t border-gray-200">
              <div className="flex justify-between items-center">
                <span className="text-gray-600">Montant à capturer:</span>
                <div className="text-2xl font-bold text-green-600">
                  {formatCurrency(booking.service_amount)}
                </div>
              </div>
            </div>
          </div>

          {/* Notifications */}
          <div>
            <label className="flex items-start gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={notifyParties}
                onChange={(e) => setNotifyParties(e.target.checked)}
                className="mt-1 w-4 h-4 text-button-primary border-gray-300 rounded focus:ring-button-primary"
              />
              <div>
                <span className="font-medium text-gray-900 block">
                  Notifier le client et le prestataire
                </span>
                <span className="text-sm text-gray-600">
                  Envoyer un email de confirmation de paiement aux deux parties
                </span>
              </div>
            </label>
          </div>

          {/* Admin Notes */}
          <div>
            <label htmlFor="admin_notes" className="block text-sm font-medium text-gray-700 mb-2">
              Notes administratives (optionnel)
            </label>
            <textarea
              id="admin_notes"
              value={adminNotes}
              onChange={(e) => setAdminNotes(e.target.value)}
              placeholder="Raison de la capture manuelle, contexte, etc..."
              rows={3}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-button-primary focus:border-transparent"
            />
            <p className="mt-1 text-xs text-gray-500">
              Ces notes seront enregistrées dans l'historique de la réservation
            </p>
          </div>

          {/* Actions */}
          <div className="flex gap-3 pt-4 border-t border-gray-200">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              disabled={isSubmitting}
              className="flex-1"
            >
              Annuler
            </Button>
            <Button
              type="submit"
              disabled={isSubmitting}
              className="flex-1 bg-green-600 hover:bg-green-700 text-white"
            >
              {isSubmitting ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                  Capture en cours...
                </>
              ) : (
                <>
                  <CheckCircle className="w-4 h-4 mr-2" />
                  Capturer {formatCurrency(booking.service_amount)}
                </>
              )}
            </Button>
          </div>
        </form>
      </div>
    </div>
  )
}
