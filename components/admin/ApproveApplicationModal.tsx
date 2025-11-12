'use client'

/**
 * Approve Application Modal
 * Task: T038 - Approval modal with contractor account creation
 * Feature: 007-contractor-interface
 */

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { X, CheckCircle, User, Mail, Lock, AlertCircle } from 'lucide-react'

interface ApproveApplicationModalProps {
  isOpen: boolean
  onClose: () => void
  onApprove: (data: {
    slug?: string
    sendEmail: boolean
  }) => Promise<void>
  candidateEmail: string
  candidateName: string
}

export function ApproveApplicationModal({
  isOpen,
  onClose,
  onApprove,
  candidateEmail,
  candidateName
}: ApproveApplicationModalProps) {
  const [customSlug, setCustomSlug] = useState('')
  const [sendEmail, setSendEmail] = useState(true)
  const [isSubmitting, setIsSubmitting] = useState(false)

  // Generate default slug from name
  const defaultSlug = candidateName
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '') // Remove accents
    .replace(/\s+/g, '-')
    .replace(/[^a-z0-9-]/g, '')

  const finalSlug = customSlug.trim() || defaultSlug

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)

    try {
      await onApprove({
        slug: customSlug.trim() || undefined,
        sendEmail,
      })

      // Reset form
      setCustomSlug('')
      setSendEmail(true)
      onClose()
    } catch (error) {
      console.error('Error approving application:', error)
      alert('Erreur lors de l\'approbation de la candidature.')
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
              <CheckCircle className="w-5 h-5 text-green-600" />
              Approuver la candidature
            </h2>
            <p className="text-sm text-gray-600 mt-1">
              Pour: <strong>{candidateName}</strong>
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
          {/* What will happen */}
          <div className="bg-green-50 border border-green-200 rounded-lg p-4">
            <h3 className="text-sm font-semibold text-green-900 mb-3 flex items-center gap-2">
              <CheckCircle className="w-4 h-4" />
              Actions qui seront effectuées :
            </h3>
            <ul className="space-y-2 text-sm text-green-800">
              <li className="flex items-start gap-2">
                <span className="text-green-600 mt-0.5">•</span>
                <span>Création d'un compte prestataire avec identifiants</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-green-600 mt-0.5">•</span>
                <span>Génération d'un mot de passe temporaire</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-green-600 mt-0.5">•</span>
                <span>Création du profil prestataire avec slug personnalisé</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-green-600 mt-0.5">•</span>
                <span>Initialisation du statut d'onboarding</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-green-600 mt-0.5">•</span>
                <span>Envoi d'un email avec les identifiants (si coché)</span>
              </li>
            </ul>
          </div>

          {/* Account Details */}
          <div className="space-y-4">
            <h3 className="text-sm font-semibold text-gray-900">
              Détails du compte
            </h3>

            {/* Email */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <Mail className="w-4 h-4 inline mr-1" />
                Email de connexion
              </label>
              <div className="px-4 py-3 bg-gray-50 border border-gray-200 rounded-lg text-gray-700">
                {candidateEmail}
              </div>
            </div>

            {/* Slug */}
            <div>
              <label htmlFor="custom-slug" className="block text-sm font-medium text-gray-700 mb-2">
                <User className="w-4 h-4 inline mr-1" />
                Slug personnalisé (optionnel)
              </label>
              <input
                type="text"
                id="custom-slug"
                value={customSlug}
                onChange={(e) => setCustomSlug(e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, ''))}
                placeholder={defaultSlug}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-button-primary focus:border-transparent"
              />
              <p className="mt-2 text-sm text-gray-600">
                URL publique: <code className="px-2 py-1 bg-gray-100 rounded text-xs">
                  simone.paris/book/{finalSlug}
                </code>
              </p>
              <p className="mt-1 text-xs text-gray-500">
                Si vide, le slug sera généré automatiquement: <code>{defaultSlug}</code>
              </p>
            </div>

            {/* Temporary Password */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <Lock className="w-4 h-4 inline mr-1" />
                Mot de passe temporaire
              </label>
              <div className="px-4 py-3 bg-gray-50 border border-gray-200 rounded-lg text-gray-700">
                Sera généré automatiquement et envoyé par email
              </div>
              <p className="mt-1 text-xs text-gray-500">
                Le prestataire devra changer son mot de passe lors de la première connexion
              </p>
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
                  Envoyer un email de bienvenue avec les identifiants
                </p>
                <p className="text-xs text-gray-600 mt-1">
                  L'email contiendra le lien de connexion, l'email et le mot de passe temporaire
                </p>
              </div>
            </label>
          </div>

          {/* Warning */}
          <div className="bg-orange-50 border border-orange-200 rounded-lg p-4">
            <div className="flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-orange-600 mt-0.5 flex-shrink-0" />
              <div className="text-sm text-orange-800">
                <p className="font-medium mb-1">Attention</p>
                <p>
                  Une fois approuvée, la candidature ne pourra plus être modifiée. Le prestataire aura immédiatement accès à son espace et pourra commencer son onboarding.
                </p>
              </div>
            </div>
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
              disabled={isSubmitting}
              className="flex-1 bg-green-600 hover:bg-green-700 text-white"
            >
              {isSubmitting ? 'Approbation en cours...' : 'Approuver et créer le compte'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  )
}
