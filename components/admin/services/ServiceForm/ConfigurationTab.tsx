'use client'

/**
 * Configuration Tab Component
 * Feature: 018-service-management-crud
 *
 * Service configuration: type, targeting, special features
 * Fields: service_type, for_men, for_women, for_kids,
 *         is_for_entreprise_ready, is_additional_service, video_url
 */

import { UseFormReturn } from 'react-hook-form'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Checkbox } from '@/components/ui/checkbox'
import { AlertCircle, MapPin, Users, Briefcase, Plus, Video } from 'lucide-react'
import { ServiceInsertData } from '@/lib/validations/service-schemas'

// ============================================================================
// Types
// ============================================================================

interface ConfigurationTabProps {
  form: UseFormReturn<ServiceInsertData>
}

type ServiceType = 'at_home' | 'at_location' | 'hybrid'

interface ServiceTypeOption {
  value: ServiceType
  label: string
  description: string
  icon: typeof MapPin
}

// ============================================================================
// Constants
// ============================================================================

const serviceTypeOptions: ServiceTypeOption[] = [
  {
    value: 'at_home',
    label: 'À domicile',
    description: 'Le prestataire se déplace chez le client',
    icon: MapPin,
  },
  {
    value: 'at_location',
    label: 'Sur place',
    description: 'Le client se rend chez le prestataire',
    icon: Briefcase,
  },
  {
    value: 'hybrid',
    label: 'Hybride',
    description: 'Les deux options sont possibles',
    icon: Plus,
  },
]

// ============================================================================
// Component
// ============================================================================

export default function ConfigurationTab({ form }: ConfigurationTabProps) {
  const {
    register,
    formState: { errors },
    watch,
    setValue,
  } = form

  const service_type = watch('service_type')
  const for_men = watch('for_men')
  const for_women = watch('for_women')
  const for_kids = watch('for_kids')
  const is_for_entreprise_ready = watch('is_for_entreprise_ready')
  const is_additional_service = watch('is_additional_service')

  // Check if at least one targeting option is selected
  const hasTargeting = for_men || for_women || for_kids

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h2 className="text-xl font-bold text-gray-900 mb-2">
          Configuration du service
        </h2>
        <p className="text-gray-600">
          Définissez les options et restrictions du service
        </p>
      </div>

      {/* Service Type Section */}
      <div className="space-y-4">
        <div>
          <Label className="required">Type de prestation</Label>
          <p className="text-sm text-gray-600 mt-1">
            Comment le service est-il délivré ?
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {serviceTypeOptions.map((option) => {
            const Icon = option.icon
            const isSelected = service_type === option.value

            return (
              <button
                key={option.value}
                type="button"
                onClick={() => setValue('service_type', option.value, { shouldValidate: true })}
                className={`p-4 rounded-lg border-2 transition-all text-left ${
                  isSelected
                    ? 'border-purple-600 bg-purple-50'
                    : 'border-gray-200 hover:border-purple-300 bg-white'
                }`}
              >
                <div className="flex flex-col gap-2">
                  <div className="flex items-center justify-between">
                    <Icon className={`w-6 h-6 ${isSelected ? 'text-purple-600' : 'text-gray-400'}`} />
                    {isSelected && (
                      <div className="w-5 h-5 bg-purple-600 rounded-full flex items-center justify-center">
                        <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                        </svg>
                      </div>
                    )}
                  </div>
                  <div>
                    <p className={`font-medium ${isSelected ? 'text-purple-900' : 'text-gray-900'}`}>
                      {option.label}
                    </p>
                    <p className="text-xs text-gray-600 mt-1">
                      {option.description}
                    </p>
                  </div>
                </div>
              </button>
            )
          })}
        </div>
      </div>

      {/* Client Targeting Section */}
      <div className="space-y-4 border-t pt-6">
        <div>
          <Label className="required flex items-center gap-2">
            <Users className="w-5 h-5" />
            Clientèle cible
          </Label>
          <p className="text-sm text-gray-600 mt-1">
            À qui s'adresse ce service ? (au moins une option requise)
          </p>
        </div>

        <div className={`space-y-3 p-4 rounded-lg border-2 ${
          !hasTargeting && errors.for_men ? 'border-red-300 bg-red-50' : 'border-gray-200 bg-gray-50'
        }`}>
          {/* For Men */}
          <div className="flex items-center space-x-3">
            <Checkbox
              id="for_men"
              checked={for_men}
              onCheckedChange={(checked) => setValue('for_men', checked === true, { shouldValidate: true })}
            />
            <div className="flex-1">
              <Label htmlFor="for_men" className="cursor-pointer font-medium">
                Service pour hommes
              </Label>
              <p className="text-sm text-gray-600">
                Le service est adapté et recommandé pour les hommes
              </p>
            </div>
          </div>

          {/* For Women */}
          <div className="flex items-center space-x-3">
            <Checkbox
              id="for_women"
              checked={for_women}
              onCheckedChange={(checked) => setValue('for_women', checked === true, { shouldValidate: true })}
            />
            <div className="flex-1">
              <Label htmlFor="for_women" className="cursor-pointer font-medium">
                Service pour femmes
              </Label>
              <p className="text-sm text-gray-600">
                Le service est adapté et recommandé pour les femmes
              </p>
            </div>
          </div>

          {/* For Kids */}
          <div className="flex items-center space-x-3">
            <Checkbox
              id="for_kids"
              checked={for_kids}
              onCheckedChange={(checked) => setValue('for_kids', checked === true, { shouldValidate: true })}
            />
            <div className="flex-1">
              <Label htmlFor="for_kids" className="cursor-pointer font-medium">
                Service pour enfants
              </Label>
              <p className="text-sm text-gray-600">
                Le service est adapté et recommandé pour les enfants
              </p>
            </div>
          </div>
        </div>

        {!hasTargeting && errors.for_men && (
          <p className="text-sm text-red-600 flex items-center gap-1">
            <AlertCircle className="w-4 h-4" />
            {errors.for_men.message}
          </p>
        )}
      </div>

      {/* Special Features Section */}
      <div className="space-y-4 border-t pt-6">
        <div>
          <Label>Options spéciales</Label>
          <p className="text-sm text-gray-600 mt-1">
            Caractéristiques particulières du service
          </p>
        </div>

        <div className="space-y-3">
          {/* Enterprise Ready */}
          <div className="flex items-center space-x-3">
            <Checkbox
              id="is_for_entreprise_ready"
              checked={is_for_entreprise_ready}
              onCheckedChange={(checked) => setValue('is_for_entreprise_ready', checked === true)}
            />
            <div className="flex-1">
              <Label htmlFor="is_for_entreprise_ready" className="cursor-pointer font-medium">
                Service B2B (Entreprises)
              </Label>
              <p className="text-sm text-gray-600">
                Service disponible pour les prestations en entreprise (bien-être au bureau, événements corporate)
              </p>
            </div>
          </div>

          {/* Additional Service */}
          <div className="flex items-center space-x-3">
            <Checkbox
              id="is_additional_service"
              checked={is_additional_service}
              onCheckedChange={(checked) => setValue('is_additional_service', checked === true)}
            />
            <div className="flex-1">
              <Label htmlFor="is_additional_service" className="cursor-pointer font-medium">
                Service additionnel
              </Label>
              <p className="text-sm text-gray-600">
                Peut être ajouté à un autre service (ex: gommage avec massage)
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Video Section */}
      <div className="space-y-4 border-t pt-6">
        <div>
          <Label htmlFor="video_url" className="flex items-center gap-2">
            <Video className="w-5 h-5" />
            Vidéo de présentation
            <span className="ml-2 text-xs text-gray-500">(optionnel)</span>
          </Label>
          <p className="text-sm text-gray-600 mt-1">
            URL d'une vidéo YouTube, Vimeo ou autre plateforme
          </p>
        </div>

        <Input
          id="video_url"
          type="url"
          placeholder="https://www.youtube.com/watch?v=..."
          {...register('video_url')}
          className={errors.video_url ? 'border-red-500' : ''}
        />
        {errors.video_url && (
          <p className="text-sm text-red-600 flex items-center gap-1">
            <AlertCircle className="w-4 h-4" />
            {errors.video_url.message}
          </p>
        )}
        <p className="text-xs text-gray-500">
          La vidéo sera affichée sur la page détaillée du service
        </p>
      </div>

      {/* Summary */}
      <div className="bg-gradient-to-br from-purple-50 to-blue-50 border border-purple-200 rounded-lg p-6">
        <h4 className="font-semibold text-gray-900 mb-4">Résumé de la configuration</h4>
        <div className="space-y-2 text-sm">
          <div className="flex justify-between">
            <span className="text-gray-700">Type de prestation:</span>
            <span className="font-medium text-gray-900">
              {serviceTypeOptions.find(opt => opt.value === service_type)?.label}
            </span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-700">Clientèle:</span>
            <span className="font-medium text-gray-900">
              {[
                for_men && 'Hommes',
                for_women && 'Femmes',
                for_kids && 'Enfants'
              ].filter(Boolean).join(', ') || 'Non défini'}
            </span>
          </div>
          {is_for_entreprise_ready && (
            <div className="flex justify-between">
              <span className="text-gray-700">B2B:</span>
              <span className="font-medium text-green-700">✓ Disponible pour entreprises</span>
            </div>
          )}
          {is_additional_service && (
            <div className="flex justify-between">
              <span className="text-gray-700">Type:</span>
              <span className="font-medium text-blue-700">✓ Service additionnel</span>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
