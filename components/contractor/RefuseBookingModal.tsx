'use client'

/**
 * RefuseBookingModal Component
 * Task: T072
 * Feature: 007-contractor-interface
 *
 * Modal for refusing a booking with required reason and optional message
 */

import { useState } from 'react'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { XCircle, Loader2, AlertTriangle } from 'lucide-react'
import type { BookingRequest } from '@/types/contractor'

interface RefuseBookingModalProps {
  request: BookingRequest | null
  open: boolean
  onClose: () => void
  onConfirm: (requestId: number, reason: string, message?: string) => Promise<void>
}

const REFUSAL_REASONS = [
  { value: 'unavailable', label: 'Non disponible à cette date' },
  { value: 'too_far', label: 'Trop éloigné de ma zone' },
  { value: 'workload', label: 'Charge de travail trop importante' },
  { value: 'service_mismatch', label: 'Service non adapté' },
  { value: 'other', label: 'Autre raison' },
]

export function RefuseBookingModal({ request, open, onClose, onConfirm }: RefuseBookingModalProps) {
  const [reason, setReason] = useState('')
  const [message, setMessage] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleConfirm = async () => {
    if (!reason) {
      setError('Veuillez sélectionner un motif de refus')
      return
    }

    if (!request) return

    try {
      setIsSubmitting(true)
      setError(null)

      await onConfirm(request.id, reason, message || undefined)

      // Reset and close
      setReason('')
      setMessage('')
      onClose()
    } catch (err) {
      console.error('Error refusing booking:', err)
      setError(err instanceof Error ? err.message : 'Une erreur est survenue')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={(isOpen) => !isOpen && onClose()}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <XCircle className="w-6 h-6 text-red-600" />
            Refuser cette réservation
          </DialogTitle>
          <DialogDescription>
            Indiquez pourquoi vous refusez cette demande
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* Reason Select */}
          <div className="space-y-2">
            <Label htmlFor="reason">Motif de refus *</Label>
            <Select value={reason} onValueChange={setReason}>
              <SelectTrigger id="reason">
                <SelectValue placeholder="Sélectionnez un motif" />
              </SelectTrigger>
              <SelectContent>
                {REFUSAL_REASONS.map((r) => (
                  <SelectItem key={r.value} value={r.value}>
                    {r.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Optional Message */}
          <div className="space-y-2">
            <Label htmlFor="message">Message au client (optionnel)</Label>
            <Textarea
              id="message"
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="Vous pouvez ajouter un message personnalisé pour expliquer votre refus..."
              rows={4}
              maxLength={500}
            />
            <p className="text-xs text-gray-500">{message.length}/500 caractères</p>
          </div>

          {/* Warning */}
          <div className="p-4 bg-orange-50 border border-orange-200 rounded-lg">
            <div className="flex items-start gap-3">
              <AlertTriangle className="w-5 h-5 text-orange-600 flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-sm font-semibold text-orange-900 mb-1">Attention</p>
                <p className="text-xs text-orange-800">
                  Le client sera notifié de votre refus et le paiement sera automatiquement annulé.
                </p>
              </div>
            </div>
          </div>

          {/* Error */}
          {error && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-800">
              {error}
            </div>
          )}
        </div>

        <DialogFooter className="gap-2">
          <Button onClick={onClose} variant="outline" disabled={isSubmitting}>
            Annuler
          </Button>
          <Button
            onClick={handleConfirm}
            disabled={isSubmitting || !reason}
            className="bg-red-600 hover:bg-red-700 text-white"
          >
            {isSubmitting ? (
              <><Loader2 className="w-4 h-4 mr-2 animate-spin" />Traitement...</>
            ) : (
              <><XCircle className="w-4 h-4 mr-2" />Confirmer le refus</>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
