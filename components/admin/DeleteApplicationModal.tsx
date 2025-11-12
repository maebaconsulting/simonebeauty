'use client'

/**
 * Delete Application Modal
 * Task: T038 - Delete rejected contractor applications permanently
 * Feature: 007-contractor-interface
 * Requirement: FR-020a
 */

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { X, Trash2, AlertTriangle } from 'lucide-react'

interface DeleteApplicationModalProps {
  isOpen: boolean
  onClose: () => void
  onDelete: () => Promise<void>
  candidateName: string
  candidateEmail: string
  applicationStatus: string
}

export function DeleteApplicationModal({
  isOpen,
  onClose,
  onDelete,
  candidateName,
  candidateEmail,
  applicationStatus
}: DeleteApplicationModalProps) {
  const [confirmText, setConfirmText] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)

  const CONFIRM_WORD = 'SUPPRIMER'

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    // Verify application is rejected
    if (applicationStatus !== 'rejected') {
      alert('Seules les candidatures refusées peuvent être supprimées.')
      return
    }

    // Verify confirmation
    if (confirmText !== CONFIRM_WORD) {
      alert(`Veuillez taper "${CONFIRM_WORD}" pour confirmer la suppression.`)
      return
    }

    setIsSubmitting(true)

    try {
      await onDelete()

      // Reset form
      setConfirmText('')
      onClose()
    } catch (error) {
      console.error('Error deleting application:', error)
      const errorMessage = error instanceof Error ? error.message : 'Erreur inconnue'
      const isDev = process.env.NODE_ENV === 'development'
      alert(
        isDev
          ? `Erreur lors de la suppression:\n\n${errorMessage}`
          : 'Erreur lors de la suppression de la candidature.'
      )
    } finally {
      setIsSubmitting(false)
    }
  }

  if (!isOpen) return null

  // Block deletion if not rejected
  const canDelete = applicationStatus === 'rejected'

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
      <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200 bg-red-600">
          <div>
            <h2 className="text-xl font-semibold text-white flex items-center gap-2">
              <Trash2 className="w-5 h-5" />
              Supprimer définitivement la candidature
            </h2>
            <p className="text-sm text-red-100 mt-1">
              Pour: <strong>{candidateName}</strong> ({candidateEmail})
            </p>
          </div>
          <button
            onClick={onClose}
            className="text-white hover:text-red-100 transition-colors"
            disabled={isSubmitting}
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {/* Critical Warning */}
          <div className="bg-red-100 border-2 border-red-400 rounded-lg p-4">
            <div className="flex items-start gap-3">
              <AlertTriangle className="w-6 h-6 text-red-700 mt-0.5 flex-shrink-0" />
              <div className="text-sm text-red-900">
                <p className="font-bold mb-2 text-base">⚠️ ACTION IRRÉVERSIBLE</p>
                <p className="mb-2">
                  Cette action va <strong>SUPPRIMER DÉFINITIVEMENT</strong> cette candidature et toutes les données associées de la base de données.
                </p>
                <p className="font-medium">
                  Cette action ne peut PAS être annulée. Les données seront perdues pour toujours.
                </p>
              </div>
            </div>
          </div>

          {/* Status Check */}
          {!canDelete && (
            <div className="bg-orange-50 border border-orange-200 rounded-lg p-4">
              <p className="text-sm text-orange-800">
                <strong>⛔ Suppression impossible:</strong> Seules les candidatures avec le statut "refusée" peuvent être supprimées. Statut actuel: <strong>{applicationStatus}</strong>
              </p>
              <p className="text-sm text-orange-700 mt-2">
                Veuillez d'abord refuser cette candidature si vous souhaitez la supprimer.
              </p>
            </div>
          )}

          {/* What will be deleted */}
          <div className="bg-gray-50 border border-gray-300 rounded-lg p-4">
            <h3 className="text-sm font-semibold text-gray-900 mb-3 flex items-center gap-2">
              <Trash2 className="w-4 h-4" />
              Données qui seront supprimées définitivement :
            </h3>
            <ul className="space-y-2 text-sm text-gray-700">
              <li className="flex items-start gap-2">
                <span className="text-red-600 mt-0.5">•</span>
                <span>Toutes les informations de la candidature (nom, email, téléphone, etc.)</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-red-600 mt-0.5">•</span>
                <span>Le CV téléchargé</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-red-600 mt-0.5">•</span>
                <span>Toutes les certifications téléchargées</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-red-600 mt-0.5">•</span>
                <span>Tous les fichiers du portfolio</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-red-600 mt-0.5">•</span>
                <span>L'historique de la candidature (dates de soumission, révision, refus)</span>
              </li>
            </ul>
          </div>

          {/* Security Note */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <p className="text-sm text-blue-800">
              ℹ️ <strong>Note de sécurité:</strong> Cette fonctionnalité est conçue pour supprimer définitivement les données conformément aux demandes de suppression RGPD ou pour nettoyer les candidatures manifestement frauduleuses ou inappropriées.
            </p>
          </div>

          {/* Confirmation Input */}
          <div>
            <label htmlFor="confirm-text" className="block text-sm font-medium text-gray-700 mb-2">
              Pour confirmer, tapez <strong className="text-red-600">{CONFIRM_WORD}</strong> en majuscules :
            </label>
            <input
              type="text"
              id="confirm-text"
              value={confirmText}
              onChange={(e) => setConfirmText(e.target.value)}
              className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500 font-mono text-center text-lg"
              placeholder={CONFIRM_WORD}
              required
              disabled={!canDelete}
            />
            {confirmText && confirmText !== CONFIRM_WORD && (
              <p className="text-sm text-red-600 mt-2">
                Le texte ne correspond pas. Tapez exactement "{CONFIRM_WORD}" (en majuscules).
              </p>
            )}
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
              disabled={isSubmitting || confirmText !== CONFIRM_WORD || !canDelete}
              className="flex-1 bg-red-600 hover:bg-red-700 text-white disabled:bg-gray-300 disabled:cursor-not-allowed"
            >
              {isSubmitting ? 'Suppression en cours...' : 'Supprimer définitivement'}
            </Button>
          </div>

          {/* Final Warning */}
          <p className="text-xs text-center text-gray-500 italic">
            Cette action est irréversible et conforme à la politique FR-020a
          </p>
        </form>
      </div>
    </div>
  )
}
