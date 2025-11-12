'use client'

/**
 * Protocol Tab Component
 * Feature: 018-service-management-crud
 *
 * Service protocol and professional information
 * Fields: preparation, your_session, advises, suggestion,
 *         hygienic_precautions, contraindications
 */

import { UseFormReturn } from 'react-hook-form'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { AlertCircle, ClipboardList, Heart, AlertTriangle, Sparkles, Lightbulb, Info } from 'lucide-react'
import { ServiceInsertData } from '@/lib/validations/service-schemas'

// ============================================================================
// Types
// ============================================================================

interface ProtocolTabProps {
  form: UseFormReturn<ServiceInsertData>
}

interface ProtocolField {
  name: keyof ServiceInsertData
  label: string
  description: string
  placeholder: string
  icon: typeof ClipboardList
  maxLength: number
  color: string
}

// ============================================================================
// Constants
// ============================================================================

const protocolFields: ProtocolField[] = [
  {
    name: 'preparation',
    label: 'Préparation',
    description: 'Comment le client doit se préparer avant la séance',
    placeholder: 'Ex: Évitez de manger copieusement 2h avant la séance. Portez des vêtements confortables. Hydratez-vous bien...',
    icon: ClipboardList,
    maxLength: 2000,
    color: 'blue',
  },
  {
    name: 'your_session',
    label: 'Déroulement de la séance',
    description: 'Description détaillée du déroulement étape par étape',
    placeholder: 'Ex: 1. Accueil et entretien préalable (10 min)\n2. Installation confortable (5 min)\n3. Massage détente (60 min)\n4. Temps de repos (10 min)\n5. Conseils personnalisés...',
    icon: Heart,
    maxLength: 3000,
    color: 'purple',
  },
  {
    name: 'advises',
    label: 'Conseils post-séance',
    description: 'Recommandations après le service',
    placeholder: 'Ex: Hydratez-vous abondamment dans les heures suivantes. Évitez l\'exposition au soleil pendant 24h. Repos conseillé...',
    icon: Lightbulb,
    maxLength: 2000,
    color: 'green',
  },
  {
    name: 'suggestion',
    label: 'Suggestions complémentaires',
    description: 'Services ou produits recommandés en complément',
    placeholder: 'Ex: Pour prolonger les bienfaits, nous vous recommandons un gommage corporel. Pensez également à notre soin visage anti-âge...',
    icon: Sparkles,
    maxLength: 2000,
    color: 'yellow',
  },
  {
    name: 'hygienic_precautions',
    label: 'Précautions d\'hygiène',
    description: 'Mesures d\'hygiène et de sécurité',
    placeholder: 'Ex: Matériel stérilisé après chaque utilisation. Huiles et crèmes hypoallergéniques. Linge de toilette à usage unique...',
    icon: AlertCircle,
    maxLength: 2000,
    color: 'cyan',
  },
  {
    name: 'contraindications',
    label: 'Contre-indications',
    description: 'Situations où le service est déconseillé ou interdit',
    placeholder: 'Ex: Grossesse (1er trimestre), phlébite, varices sévères, allergies aux huiles essentielles, problèmes cardiaques récents...',
    icon: AlertTriangle,
    maxLength: 2000,
    color: 'red',
  },
]

// ============================================================================
// Component
// ============================================================================

export default function ProtocolTab({ form }: ProtocolTabProps) {
  const {
    register,
    formState: { errors },
    watch,
  } = form

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h2 className="text-xl font-bold text-gray-900 mb-2">
          Protocole du service
        </h2>
        <p className="text-gray-600">
          Informations professionnelles détaillées pour les clients
        </p>
      </div>

      {/* Protocol Fields */}
      <div className="space-y-8">
        {protocolFields.map((field) => {
          const Icon = field.icon
          const value = watch(field.name as keyof ServiceInsertData) as string | undefined
          const fieldError = errors[field.name]
          const charCount = value?.length || 0

          // Color classes based on field color
          const colorClasses = {
            blue: 'bg-blue-50 border-blue-200 text-blue-900',
            purple: 'bg-purple-50 border-purple-200 text-purple-900',
            green: 'bg-green-50 border-green-200 text-green-900',
            yellow: 'bg-yellow-50 border-yellow-200 text-yellow-900',
            cyan: 'bg-cyan-50 border-cyan-200 text-cyan-900',
            red: 'bg-red-50 border-red-200 text-red-900',
          }

          const iconClasses = {
            blue: 'text-blue-600',
            purple: 'text-purple-600',
            green: 'text-green-600',
            yellow: 'text-yellow-600',
            cyan: 'text-cyan-600',
            red: 'text-red-600',
          }

          return (
            <div key={field.name} className="space-y-3">
              {/* Field Header */}
              <div className={`p-4 rounded-t-lg border ${colorClasses[field.color as keyof typeof colorClasses]}`}>
                <div className="flex items-start gap-3">
                  <Icon className={`w-5 h-5 mt-0.5 flex-shrink-0 ${iconClasses[field.color as keyof typeof iconClasses]}`} />
                  <div className="flex-1">
                    <Label htmlFor={field.name} className="text-base font-semibold">
                      {field.label}
                      <span className="ml-2 text-xs font-normal opacity-70">(optionnel)</span>
                    </Label>
                    <p className="text-sm opacity-90 mt-1">
                      {field.description}
                    </p>
                  </div>
                </div>
              </div>

              {/* Text Area */}
              <div className="space-y-2">
                <Textarea
                  id={field.name}
                  placeholder={field.placeholder}
                  rows={6}
                  {...register(field.name as any)}
                  className={fieldError ? 'border-red-500' : ''}
                />
                {fieldError && (
                  <p className="text-sm text-red-600 flex items-center gap-1">
                    <AlertCircle className="w-4 h-4" />
                    {fieldError.message as string}
                  </p>
                )}
                <p className="text-xs text-gray-500 flex justify-between">
                  <span>
                    {charCount} / {field.maxLength} caractères
                  </span>
                  {charCount > field.maxLength * 0.9 && (
                    <span className="text-orange-600 font-medium">
                      Limite presque atteinte
                    </span>
                  )}
                </p>
              </div>
            </div>
          )
        })}
      </div>

      {/* Info Banner */}
      <div className="bg-gradient-to-r from-blue-50 to-cyan-50 border border-blue-200 rounded-lg p-4">
        <div className="flex items-start gap-3">
          <Info className="w-5 h-5 text-blue-600 mt-0.5 flex-shrink-0" />
          <div className="text-sm text-blue-900">
            <p className="font-medium mb-2">Pourquoi remplir le protocole ?</p>
            <ul className="space-y-1 text-blue-800">
              <li>• <strong>Préparation:</strong> Aide les clients à se préparer correctement</li>
              <li>• <strong>Déroulement:</strong> Rassure et informe sur ce qui les attend</li>
              <li>• <strong>Conseils:</strong> Maximise les bénéfices du service</li>
              <li>• <strong>Suggestions:</strong> Favorise la vente croisée</li>
              <li>• <strong>Hygiène:</strong> Renforce la confiance et le professionnalisme</li>
              <li>• <strong>Contre-indications:</strong> Protège juridiquement et assure la sécurité</li>
            </ul>
          </div>
        </div>
      </div>

      {/* Completion Status */}
      <div className="bg-gray-50 border border-gray-200 rounded-lg p-6">
        <h4 className="font-semibold text-gray-900 mb-4">
          Complétude du protocole
        </h4>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
          {protocolFields.map((field) => {
            const value = watch(field.name as keyof ServiceInsertData) as string | undefined
            const isCompleted = value && value.trim().length > 0

            return (
              <div key={field.name} className="flex items-center gap-2">
                <div className={`w-4 h-4 rounded-full flex items-center justify-center ${
                  isCompleted ? 'bg-green-500' : 'bg-gray-300'
                }`}>
                  {isCompleted && (
                    <svg className="w-2.5 h-2.5 text-white" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                  )}
                </div>
                <span className={`text-sm ${isCompleted ? 'text-green-700 font-medium' : 'text-gray-600'}`}>
                  {field.label}
                </span>
              </div>
            )
          })}
        </div>

        {/* Progress Bar */}
        <div className="mt-6">
          <div className="flex justify-between text-sm mb-2">
            <span className="text-gray-700 font-medium">Progression</span>
            <span className="text-gray-900 font-bold">
              {Math.round((protocolFields.filter(f => {
                const v = watch(f.name as keyof ServiceInsertData) as string | undefined
                return v && v.trim().length > 0
              }).length / protocolFields.length) * 100)}%
            </span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-3">
            <div
              className="bg-gradient-to-r from-green-500 to-emerald-500 h-3 rounded-full transition-all duration-300"
              style={{
                width: `${(protocolFields.filter(f => {
                  const v = watch(f.name as keyof ServiceInsertData) as string | undefined
                  return v && v.trim().length > 0
                }).length / protocolFields.length) * 100}%`
              }}
            />
          </div>
        </div>
      </div>
    </div>
  )
}
