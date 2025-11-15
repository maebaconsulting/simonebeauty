'use client'

/**
 * Placeholder Tabs for Future Features
 * Feature: 018-service-management-crud
 *
 * Placeholder components for tabs that will be implemented in future phases
 */

import { Package, Users, Image as ImageIcon, ExternalLink } from 'lucide-react'
import { Button } from '@/components/ui/button'
import Link from 'next/link'

// ============================================================================
// Images Tab (Feature 017 already implemented separately)
// ============================================================================

interface ImagesTabPlaceholderProps {
  serviceId?: number
}

export function ImagesTabPlaceholder({ serviceId }: ImagesTabPlaceholderProps) {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-bold text-gray-900 mb-2">
          Images du service
        </h2>
        <p className="text-gray-600">
          Gérez les images de ce service via la page dédiée
        </p>
      </div>

      {serviceId ? (
        <div className="bg-gradient-to-r from-blue-50 to-cyan-50 border-2 border-blue-200 rounded-lg p-8 text-center">
          <div className="max-w-md mx-auto space-y-4">
            <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto">
              <ImageIcon className="w-8 h-8 text-blue-600" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                Gestion des images
              </h3>
              <p className="text-gray-700">
                La gestion des images est disponible sur une page dédiée avec toutes les fonctionnalités:
              </p>
              <ul className="text-sm text-gray-600 mt-3 space-y-1">
                <li>• Upload jusqu'à 10 images</li>
                <li>• Drag & drop pour réorganiser</li>
                <li>• Définir l'image principale</li>
                <li>• Éditer les alt-text</li>
                <li>• Génération automatique des descriptions</li>
              </ul>
            </div>
            <Link href={`/admin/services/${serviceId}/images`}>
              <Button className="bg-blue-600 hover:bg-blue-700 text-white">
                <ImageIcon className="w-4 h-4 mr-2" />
                Gérer les images
                <ExternalLink className="w-4 h-4 ml-2" />
              </Button>
            </Link>
          </div>
        </div>
      ) : (
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6 text-center">
          <p className="text-yellow-900">
            Enregistrez d'abord le service pour pouvoir ajouter des images
          </p>
        </div>
      )}
    </div>
  )
}

// ============================================================================
// Supplements Tab (Phase 4)
// ============================================================================

export function SupplementsTabPlaceholder() {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-bold text-gray-900 mb-2">
          Suppléments
        </h2>
        <p className="text-gray-600">
          Associez des services supplémentaires à ce service principal
        </p>
      </div>

      <div className="bg-gradient-to-r from-purple-50 to-pink-50 border-2 border-dashed border-purple-300 rounded-lg p-12 text-center">
        <div className="max-w-lg mx-auto space-y-4">
          <div className="w-20 h-20 bg-purple-100 rounded-full flex items-center justify-center mx-auto">
            <Package className="w-10 h-10 text-purple-600" />
          </div>
          <div>
            <h3 className="text-2xl font-bold text-gray-900 mb-2">
              Bientôt disponible
            </h3>
            <p className="text-gray-700 mb-4">
              La gestion des suppléments sera disponible dans une prochaine version (Phase 4)
            </p>
            <div className="bg-white border border-purple-200 rounded-lg p-4 text-left">
              <p className="font-medium text-gray-900 mb-2">Fonctionnalités prévues:</p>
              <ul className="text-sm text-gray-700 space-y-1.5">
                <li className="flex items-start gap-2">
                  <span className="text-purple-600 font-bold">•</span>
                  <span>Association de services additionnels (ex: gommage avec massage)</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-purple-600 font-bold">•</span>
                  <span>Tarifs spéciaux pour les packages</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-purple-600 font-bold">•</span>
                  <span>Gestion des relations many-to-many</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-purple-600 font-bold">•</span>
                  <span>Suggestions automatiques aux clients</span>
                </li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

// ============================================================================
// Contractors Tab (Phase 4)
// ============================================================================

export function ContractorsTabPlaceholder() {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-bold text-gray-900 mb-2">
          Prestataires
        </h2>
        <p className="text-gray-600">
          Gérez les prestataires autorisés à proposer ce service
        </p>
      </div>

      <div className="bg-gradient-to-r from-indigo-50 to-blue-50 border-2 border-dashed border-indigo-300 rounded-lg p-12 text-center">
        <div className="max-w-lg mx-auto space-y-4">
          <div className="w-20 h-20 bg-indigo-100 rounded-full flex items-center justify-center mx-auto">
            <Users className="w-10 h-10 text-indigo-600" />
          </div>
          <div>
            <h3 className="text-2xl font-bold text-gray-900 mb-2">
              Bientôt disponible
            </h3>
            <p className="text-gray-700 mb-4">
              La gestion des prestataires sera disponible dans une prochaine version (Phase 4)
            </p>
            <div className="bg-white border border-indigo-200 rounded-lg p-4 text-left">
              <p className="font-medium text-gray-900 mb-2">Fonctionnalités prévues:</p>
              <ul className="text-sm text-gray-700 space-y-1.5">
                <li className="flex items-start gap-2">
                  <span className="text-indigo-600 font-bold">•</span>
                  <span>Attribution de services aux prestataires</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-indigo-600 font-bold">•</span>
                  <span>Tarifs et durées personnalisés par prestataire</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-indigo-600 font-bold">•</span>
                  <span>Gestion des disponibilités</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-indigo-600 font-bold">•</span>
                  <span>Statistiques et performances</span>
                </li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
