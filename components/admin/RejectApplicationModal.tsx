'use client'

/**
 * Reject Application Modal
 * Task: T040 - Rejection modal with required reason textarea
 * Feature: 007-contractor-interface
 */

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { X, XCircle, AlertTriangle } from 'lucide-react'

interface RejectApplicationModalProps {
  isOpen: boolean
  onClose: () => void
  onReject: (data: {
    rejectionReason: string
    sendEmail: boolean
  }) => Promise<void>
  candidateName: string
  candidateEmail: string
}

export function RejectApplicationModal({
  isOpen,
  onClose,
  onReject,
  candidateName,
  candidateEmail
}: RejectApplicationModalProps) {
  const [rejectionReason, setRejectionReason] = useState('')
  const [sendEmail, setSendEmail] = useState(true)
  const [isSubmitting, setIsSubmitting] = useState(false)

  const MIN_REASON_LENGTH = 10

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (rejectionReason.trim().length < MIN_REASON_LENGTH) {
      alert(`La raison du refus doit contenir au moins ${MIN_REASON_LENGTH} caractères.`)
      return
    }

    setIsSubmitting(true)

    try {
      await onReject({
        rejectionReason: rejectionReason.trim(),
        sendEmail,
      })

      // Reset form
      setRejectionReason('')
      setSendEmail(true)
      onClose()
    } catch (error) {
      console.error('Error rejecting application:', error)
      alert('Erreur lors du refus de la candidature.')
    } finally {
      setIsSubmitting(false)
    }
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
      <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200 bg-red-50">
          <div>
            <h2 className="text-xl font-semibold text-gray-900 flex items-center gap-2">
              <XCircle className="w-5 h-5 text-red-600" />
              Refuser la candidature
            </h2>
            <p className="text-sm text-gray-600 mt-1">
              Pour: <strong>{candidateName}</strong> ({candidateEmail})
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
          <div className="bg-orange-50 border border-orange-200 rounded-lg p-4">
            <div className="flex items-start gap-3">
              <AlertTriangle className="w-5 h-5 text-orange-600 mt-0.5 flex-shrink-0" />
              <div className="text-sm text-orange-800">
                <p className="font-medium mb-1">Attention</p>
                <p>
                  Le refus de cette candidature est définitif. Le candidat recevra un email de notification avec la raison du refus. Assurez-vous de fournir une raison claire et professionnelle.
                </p>
              </div>
            </div>
          </div>

          {/* Rejection Reason */}
          <div>
            <label htmlFor="rejection-reason" className="block text-sm font-medium text-gray-700 mb-2">
              Raison du refus * (minimum {MIN_REASON_LENGTH} caractères)
            </label>
            <textarea
              id="rejection-reason"
              value={rejectionReason}
              onChange={(e) => setRejectionReason(e.target.value)}
              rows={6}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-button-primary focus:border-transparent resize-none"
              placeholder="Exemple: Profil intéressant mais nous recherchons actuellement des prestataires avec une expérience minimale de 5 ans dans le secteur du bien-être à domicile. Nous vous encourageons à recontacter notre service dans quelques années."
              required
            />

            <div className="flex items-center justify-between mt-2">
              <p className="text-xs text-gray-500">
                Cette raison sera envoyée au candidat par email
              </p>
              <p className={`text-sm font-medium ${
                rejectionReason.length >= MIN_REASON_LENGTH ? 'text-green-600' : 'text-orange-600'
              }`}>
                {rejectionReason.length} / {MIN_REASON_LENGTH} min.
              </p>
            </div>
          </div>

          {/* Suggested Reasons */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Suggestions de formulation :
            </label>
            <div className="space-y-2">
              {[
                "Profil intéressant mais nous recherchons actuellement des prestataires avec plus d'expérience dans ce domaine spécifique.",
                "Malheureusement, nous ne couvrons pas encore les zones géographiques que vous proposez.",
                "Nous avons actuellement un nombre suffisant de prestataires dans votre spécialité. Nous vous invitons à renouveler votre candidature dans quelques mois.",
                "Les qualifications requises pour cette spécialité ne correspondent pas à votre profil actuel. Nous vous encourageons à compléter vos certifications.",
              ].map((suggestion, index) => (
                <button
                  key={index}
                  type="button"
                  onClick={() => setRejectionReason(suggestion)}
                  className="w-full text-left p-3 text-sm bg-gray-50 hover:bg-gray-100 border border-gray-200 rounded-lg transition-colors"
                >
                  {suggestion}
                </button>
              ))}
            </div>
          </div>

          {/* Email Notification Option */}
          <div>
            <label className="flex items-start gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={sendEmail}
                onChange={(e) => setSendEmail(e.target.checked)}
                className="mt-1 w-4 h-4 text-button-primary border-gray-300 rounded focus:ring-button-primary"
              />
              <div className="flex-1">
                <p className="text-sm font-medium text-gray-900">
                  Envoyer un email de notification au candidat
                </p>
                <p className="text-xs text-gray-600 mt-1">
                  L'email contiendra la raison du refus et des encouragements à persévérer
                </p>
              </div>
            </label>
          </div>

          {/* What will happen */}
          <div className="bg-red-50 border border-red-200 rounded-lg p-4">
            <h3 className="text-sm font-semibold text-red-900 mb-3 flex items-center gap-2">
              <XCircle className="w-4 h-4" />
              Actions qui seront effectuées :
            </h3>
            <ul className="space-y-2 text-sm text-red-800">
              <li className="flex items-start gap-2">
                <span className="text-red-600 mt-0.5">•</span>
                <span>La candidature sera marquée comme "refusée"</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-red-600 mt-0.5">•</span>
                <span>La raison du refus sera enregistrée dans le système</span>
              </li>
              {sendEmail && (
                <li className="flex items-start gap-2">
                  <span className="text-red-600 mt-0.5">•</span>
                  <span>Un email de notification sera envoyé à {candidateEmail}</span>
                </li>
              )}
              <li className="flex items-start gap-2">
                <span className="text-red-600 mt-0.5">•</span>
                <span>La candidature restera archivée dans le système pour référence</span>
              </li>
            </ul>
          </div>

          {/* Actions */}
          <div className="flex gap-3 pt-4">
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
              disabled={isSubmitting || rejectionReason.trim().length < MIN_REASON_LENGTH}
              className="flex-1 bg-red-600 hover:bg-red-700 text-white"
            >
              {isSubmitting ? 'Refus en cours...' : 'Confirmer le refus'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  )
}
