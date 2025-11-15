'use client'

/**
 * AcceptBookingModal Component
 * Task: T070
 * Feature: 007-contractor-interface
 *
 * Modal for confirming booking acceptance with Stripe payment capture warning
 */

import { useState } from 'react'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { AlertCircle, CheckCircle, CreditCard, Loader2 } from 'lucide-react'
import type { BookingRequest } from '@/types/contractor'
import { format, parseISO } from 'date-fns'
import { fr } from 'date-fns/locale'

interface AcceptBookingModalProps {
  request: BookingRequest | null
  open: boolean
  onClose: () => void
  onConfirm: (requestId: number) => Promise<void>
}

export function AcceptBookingModal({
  request,
  open,
  onClose,
  onConfirm,
}: AcceptBookingModalProps) {
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  if (!request || !request.booking) {
    return null
  }

  const { booking } = request

  // Convert UTC datetime to Paris local time
  const scheduledDateTimeUTC = parseISO(booking.scheduled_datetime)

  // Format date in Paris timezone
  const formatDate = () => {
    return scheduledDateTimeUTC.toLocaleDateString('fr-FR', {
      weekday: 'long',
      day: 'numeric',
      month: 'long',
      year: 'numeric',
      timeZone: 'Europe/Paris',
    })
  }

  // Format time in Paris timezone
  const formatTime = () => {
    return scheduledDateTimeUTC.toLocaleTimeString('fr-FR', {
      hour: '2-digit',
      minute: '2-digit',
      timeZone: 'Europe/Paris',
      hour12: false,
    })
  }

  const handleConfirm = async () => {
    try {
      setIsSubmitting(true)
      setError(null)

      await onConfirm(request.id)

      // Success - close modal
      onClose()
    } catch (err) {
      console.error('Error accepting booking:', err)
      setError(
        err instanceof Error
          ? err.message
          : 'Une erreur est survenue lors de l\'acceptation de la réservation'
      )
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={(isOpen) => !isOpen && onClose()}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <CheckCircle className="w-6 h-6 text-green-600" />
            Accepter cette réservation ?
          </DialogTitle>
          <DialogDescription>
            Confirmez que vous acceptez cette demande de réservation
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* Booking Summary */}
          <div className="p-4 bg-gray-50 rounded-lg space-y-2">
            <div>
              <p className="text-sm font-medium text-gray-700">Service</p>
              <p className="text-gray-900">{booking.service_name}</p>
            </div>
            <div>
              <p className="text-sm font-medium text-gray-700">Date et heure</p>
              <p className="text-gray-900">
                {formatDate()} à {formatTime()}
              </p>
            </div>
            <div>
              <p className="text-sm font-medium text-gray-700">Client</p>
              <p className="text-gray-900">{booking.client_name}</p>
            </div>
            <div>
              <p className="text-sm font-medium text-gray-700">Montant</p>
              <p className="text-lg font-bold text-green-600">
                {booking.service_amount.toFixed(2)}€
              </p>
            </div>
          </div>

          {/* Stripe Payment Warning */}
          <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
            <div className="flex items-start gap-3">
              <CreditCard className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-sm font-semibold text-blue-900 mb-1">
                  Paiement automatique
                </p>
                <p className="text-xs text-blue-800">
                  En acceptant cette réservation, le paiement du client sera
                  automatiquement capturé via Stripe et la réservation sera confirmée.
                  Le client recevra une confirmation par email.
                </p>
              </div>
            </div>
          </div>

          {/* Important Notice */}
          <div className="p-4 bg-orange-50 border border-orange-200 rounded-lg">
            <div className="flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-orange-600 flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-sm font-semibold text-orange-900 mb-1">
                  Engagement important
                </p>
                <p className="text-xs text-orange-800">
                  Une fois acceptée, cette réservation devient un engagement ferme.
                  Assurez-vous que vous êtes disponible à cette date et heure avant d'accepter.
                </p>
              </div>
            </div>
          </div>

          {/* Error Message */}
          {error && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-800">
              <p className="font-medium">Erreur</p>
              <p>{error}</p>
            </div>
          )}
        </div>

        <DialogFooter className="gap-2">
          <Button
            onClick={onClose}
            variant="outline"
            disabled={isSubmitting}
          >
            Annuler
          </Button>
          <Button
            onClick={handleConfirm}
            disabled={isSubmitting}
            className="bg-green-600 hover:bg-green-700 text-white"
          >
            {isSubmitting ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Traitement en cours...
              </>
            ) : (
              <>
                <CheckCircle className="w-4 h-4 mr-2" />
                Confirmer l'acceptation
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
