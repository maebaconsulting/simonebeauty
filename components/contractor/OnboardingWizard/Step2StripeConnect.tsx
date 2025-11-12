'use client'

/**
 * Onboarding Step 2: Stripe Connect
 * Task: T046 - Stripe Connect button with redirect handling
 * Feature: 007-contractor-interface
 */

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { DollarSign, CheckCircle, AlertCircle, ExternalLink } from 'lucide-react'

interface Step2StripeConnectProps {
  isCompleted: boolean
  contractorId: number
  onNext: () => void
}

export function Step2StripeConnect({ isCompleted, contractorId, onNext }: Step2StripeConnectProps) {
  const [isConnecting, setIsConnecting] = useState(false)

  const handleConnectStripe = async () => {
    setIsConnecting(true)

    try {
      // Call Edge Function to create Stripe Connect account
      const response = await fetch('/api/contractor/stripe-connect/create-account', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contractorId,
          returnUrl: `${window.location.origin}/contractor/onboarding?stripe=return`,
          refreshUrl: `${window.location.origin}/contractor/onboarding?stripe=refresh`,
        }),
      })

      if (!response.ok) {
        throw new Error('Failed to create Stripe account link')
      }

      const { accountLinkUrl } = await response.json()

      // Redirect to Stripe onboarding
      window.location.href = accountLinkUrl
    } catch (error) {
      console.error('Error connecting Stripe:', error)
      alert('Erreur lors de la connexion à Stripe. Veuillez réessayer.')
    } finally {
      setIsConnecting(false)
    }
  }

  return (
    <div className="space-y-6">
      <div className="text-center">
        <div className="inline-flex items-center justify-center w-16 h-16 bg-green-100 rounded-full mb-4">
          <DollarSign className="w-8 h-8 text-green-600" />
        </div>
        <h2 className="text-2xl font-bold text-gray-900 mb-2">
          Connectez votre compte Stripe
        </h2>
        <p className="text-gray-600">
          Pour recevoir vos paiements de manière sécurisée et automatique
        </p>
      </div>

      <div className="bg-green-50 border border-green-200 rounded-lg p-6">
        <h3 className="font-semibold text-green-900 mb-4 flex items-center gap-2">
          <DollarSign className="w-5 h-5" />
          Pourquoi Stripe ?
        </h3>
        <ul className="space-y-3 text-green-800">
          <li className="flex items-start gap-2">
            <span className="text-green-600 mt-0.5">•</span>
            <span>Virements automatiques après chaque prestation</span>
          </li>
          <li className="flex items-start gap-2">
            <span className="text-green-600 mt-0.5">•</span>
            <span>Sécurité maximale de vos données bancaires</span>
          </li>
          <li className="flex items-start gap-2">
            <span className="text-green-600 mt-0.5">•</span>
            <span>Transparence totale sur vos revenus et commissions</span>
          </li>
          <li className="flex items-start gap-2">
            <span className="text-green-600 mt-0.5">•</span>
            <span>100% des pourboires vous sont reversés (après frais Stripe)</span>
          </li>
        </ul>
      </div>

      {isCompleted ? (
        <div className="bg-green-50 border border-green-200 rounded-lg p-6">
          <div className="flex items-center gap-3">
            <CheckCircle className="w-6 h-6 text-green-600 flex-shrink-0" />
            <div className="flex-1">
              <h4 className="font-semibold text-green-900">Stripe connecté</h4>
              <p className="text-sm text-green-700 mt-1">
                Votre compte Stripe est configuré et prêt à recevoir des paiements.
              </p>
            </div>
          </div>
          <Button
            onClick={onNext}
            className="w-full mt-4 bg-button-primary hover:bg-button-primary/90"
          >
            Continuer
          </Button>
        </div>
      ) : (
        <>
          <Button
            onClick={handleConnectStripe}
            disabled={isConnecting}
            className="w-full bg-green-600 hover:bg-green-700 text-white py-6 text-lg"
          >
            {isConnecting ? (
              'Connexion en cours...'
            ) : (
              <>
                <ExternalLink className="w-5 h-5 mr-2" />
                Connecter mon compte Stripe
              </>
            )}
          </Button>

          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
            <div className="flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-yellow-600 mt-0.5 flex-shrink-0" />
              <div className="text-sm text-yellow-800">
                <p className="font-medium mb-1">Configuration requise</p>
                <p>
                  Vous serez redirigé vers Stripe pour créer ou connecter votre compte. Assurez-vous d'avoir :
                </p>
                <ul className="mt-2 ml-4 space-y-1">
                  <li>• Une pièce d'identité valide</li>
                  <li>• Vos coordonnées bancaires (IBAN)</li>
                  <li>• Votre numéro SIRET (si vous êtes auto-entrepreneur)</li>
                </ul>
              </div>
            </div>
          </div>
        </>
      )}

      <div className="bg-gray-50 rounded-lg p-4 text-sm text-gray-600">
        <p>
          🔒 <strong>Sécurité :</strong> Vos données bancaires sont directement gérées par Stripe et ne transitent jamais par nos serveurs. Stripe est certifié PCI DSS niveau 1.
        </p>
      </div>
    </div>
  )
}
