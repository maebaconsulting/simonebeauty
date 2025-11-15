'use client'

/**
 * Cancel Booking Modal
 * Feature: Admin Back Office - Booking Cancellation
 * SpecKit: spec 005 User Story 5
 */

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { X, XCircle, AlertTriangle, RefreshCw } from 'lucide-react'
import { AdminBookingWithDetails } from '@/types/booking'

interface CancelBookingModalProps {
  isOpen: boolean
  onClose: () => void
  onCancel: (data: {
    cancellation_reason: string
    refund_amount?: number
    notify_parties: boolean
  }) => Promise<void>
  booking: AdminBookingWithDetails
}

export function CancelBookingModal({
  isOpen,
  onClose,
  onCancel,
  booking
}: CancelBookingModalProps) {
  const [cancellationReason, setCancellationReason] = useState('')
  const [refundOption, setRefundOption] = useState<'full' | 'none'>('full')
  const [notifyParties, setNotifyParties] = useState(true)
  const [isSubmitting, setIsSubmitting] = useState(false)

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('fr-FR', {
      style: 'currency',
      currency: 'EUR',
    }).format(amount)
  }

  // Determine if payment was captured
  const isPaymentCaptured = booking.payment_status === 'captured'
  const refundAmount = refundOption === 'full' ? booking.service_amount : 0

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!cancellationReason.trim()) {
      alert('Veuillez indiquer une raison d\'annulation')
      return
    }

    setIsSubmitting(true)

    try {
      await onCancel({
        cancellation_reason: cancellationReason.trim(),
        refund_amount: refundOption === 'full' ? undefined : 0,
        notify_parties: notifyParties,
      })

      // Reset form
      setCancellationReason('')
      setRefundOption('full')
      setNotifyParties(true)
      onClose()
    } catch (error) {
      console.error('Error cancelling booking:', error)
      alert('Erreur lors de l\'annulation: ' + (error instanceof Error ? error.message : 'Unknown error'))
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
              <XCircle className="w-5 h-5 text-red-600" />
              Annuler la réservation
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
          <div className="bg-red-50 border border-red-200 rounded-lg p-4">
            <h3 className="text-sm font-semibold text-red-900 mb-3 flex items-center gap-2">
              <AlertTriangle className="w-4 h-4" />
              Attention :
            </h3>
            <ul className="space-y-2 text-sm text-red-800">
              <li className="flex items-start gap-2">
                <span className="font-bold mt-0.5">•</span>
                <span>
                  La réservation sera <strong>définitivement annulée</strong>
                </span>
              </li>
              <li className="flex items-start gap-2">
                <span className="font-bold mt-0.5">•</span>
                <span>
                  {isPaymentCaptured
                    ? 'Le paiement a été capturé. Un remboursement sera émis si sélectionné.'
                    : 'Le paiement n\'a pas été capturé. La pré-autorisation sera annulée.'}
                </span>
              </li>
              <li className="flex items-start gap-2">
                <span className="font-bold mt-0.5">•</span>
                <span>
                  {notifyParties
                    ? 'Le client et le prestataire seront notifiés par email'
                    : 'Aucune notification ne sera envoyée'}
                </span>
              </li>
            </ul>
          </div>

          {/* Booking Summary */}
          <div className="bg-gray-50 rounded-lg p-4 space-y-2">
            <h3 className="font-semibold text-gray-900 mb-3">Récapitulatif</h3>

            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <span className="text-gray-600">Service:</span>
                <div className="font-semibold text-gray-900">{booking.service_name}</div>
              </div>

              <div>
                <span className="text-gray-600">Date:</span>
                <div className="font-semibold text-gray-900">
                  {new Date(booking.scheduled_datetime).toLocaleDateString('fr-FR', {
                    timeZone: booking.booking_timezone || 'Europe/Paris'
                  })}
                </div>
              </div>

              <div>
                <span className="text-gray-600">Montant:</span>
                <div className="font-semibold text-gray-900">
                  {formatCurrency(booking.service_amount)}
                </div>
              </div>

              <div>
                <span className="text-gray-600">Statut paiement:</span>
                <div className="font-semibold text-gray-900">
                  {isPaymentCaptured ? 'Capturé' : 'Pré-autorisé'}
                </div>
              </div>
            </div>
          </div>

          {/* Cancellation Reason */}
          <div>
            <label htmlFor="cancellation_reason" className="block text-sm font-medium text-gray-700 mb-2">
              Raison de l'annulation <span className="text-red-600">*</span>
            </label>
            <textarea
              id="cancellation_reason"
              value={cancellationReason}
              onChange={(e) => setCancellationReason(e.target.value)}
              placeholder="Ex: Client a demandé l'annulation, Prestataire indisponible, etc."
              rows={3}
              required
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-button-primary focus:border-transparent"
            />
          </div>

          {/* Refund Options (only if payment was captured) */}
          {isPaymentCaptured && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-3">
                Options de remboursement
              </label>

              <div className="space-y-2">
                <label className="flex items-start gap-3 p-3 border border-gray-300 rounded-lg cursor-pointer hover:bg-gray-50">
                  <input
                    type="radio"
                    value="full"
                    checked={refundOption === 'full'}
                    onChange={(e) => setRefundOption(e.target.value as 'full')}
                    className="mt-0.5 w-4 h-4 text-button-primary border-gray-300 focus:ring-button-primary"
                  />
                  <div className="flex-1">
                    <div className="font-medium text-gray-900 flex items-center gap-2">
                      <RefreshCw className="w-4 h-4" />
                      Remboursement complet
                    </div>
                    <div className="text-sm text-gray-600">
                      Le client sera remboursé de {formatCurrency(booking.service_amount)}
                    </div>
                  </div>
                </label>

                <label className="flex items-start gap-3 p-3 border border-gray-300 rounded-lg cursor-pointer hover:bg-gray-50">
                  <input
                    type="radio"
                    value="none"
                    checked={refundOption === 'none'}
                    onChange={(e) => setRefundOption(e.target.value as 'none')}
                    className="mt-0.5 w-4 h-4 text-button-primary border-gray-300 focus:ring-button-primary"
                  />
                  <div className="flex-1">
                    <div className="font-medium text-gray-900 flex items-center gap-2">
                      <XCircle className="w-4 h-4" />
                      Aucun remboursement
                    </div>
                    <div className="text-sm text-gray-600">
                      Le paiement reste acquis (annulation tardive, non-respect des conditions, etc.)
                    </div>
                  </div>
                </label>
              </div>
            </div>
          )}

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
                  Envoyer un email d'annulation avec la raison indiquée
                </span>
              </div>
            </label>
          </div>

          {/* Summary of action */}
          {refundOption === 'full' && isPaymentCaptured && (
            <div className="bg-orange-50 border border-orange-200 rounded-lg p-4">
              <div className="flex items-center gap-2 text-orange-800 text-sm">
                <RefreshCw className="w-4 h-4" />
                <span>
                  Un remboursement de <strong>{formatCurrency(refundAmount)}</strong> sera émis sur Stripe
                </span>
              </div>
            </div>
          )}

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
              disabled={isSubmitting || !cancellationReason.trim()}
              className="flex-1 bg-red-600 hover:bg-red-700 text-white"
            >
              {isSubmitting ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                  Annulation en cours...
                </>
              ) : (
                <>
                  <XCircle className="w-4 h-4 mr-2" />
                  Confirmer l'annulation
                </>
              )}
            </Button>
          </div>
        </form>
      </div>
    </div>
  )
}
