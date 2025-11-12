'use client'

/**
 * Onboarding Step 1: Schedule Configuration
 * Task: T045 - Redirect to /contractor/planning with onboarding mode
 * Feature: 007-contractor-interface
 */

import { Button } from '@/components/ui/button'
import { Calendar, Clock, CheckCircle } from 'lucide-react'
import Link from 'next/link'

interface Step1ScheduleProps {
  isCompleted: boolean
  onNext: () => void
}

export function Step1Schedule({ isCompleted, onNext }: Step1ScheduleProps) {
  return (
    <div className="space-y-6">
      <div className="text-center">
        <div className="inline-flex items-center justify-center w-16 h-16 bg-blue-100 rounded-full mb-4">
          <Calendar className="w-8 h-8 text-blue-600" />
        </div>
        <h2 className="text-2xl font-bold text-gray-900 mb-2">
          Configurez vos disponibilités
        </h2>
        <p className="text-gray-600">
          Définissez vos horaires de travail hebdomadaires pour que nous puissions vous proposer des créneaux adaptés
        </p>
      </div>

      <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
        <h3 className="font-semibold text-blue-900 mb-4 flex items-center gap-2">
          <Clock className="w-5 h-5" />
          Ce que vous allez configurer :
        </h3>
        <ul className="space-y-3 text-blue-800">
          <li className="flex items-start gap-2">
            <span className="text-blue-600 mt-0.5">•</span>
            <span>Vos horaires de disponibilité par jour de la semaine</span>
          </li>
          <li className="flex items-start gap-2">
            <span className="text-blue-600 mt-0.5">•</span>
            <span>Vos créneaux préférés (matin, après-midi, soir)</span>
          </li>
          <li className="flex items-start gap-2">
            <span className="text-blue-600 mt-0.5">•</span>
            <span>Vos jours de repos hebdomadaires</span>
          </li>
        </ul>
      </div>

      {isCompleted ? (
        <div className="bg-green-50 border border-green-200 rounded-lg p-6">
          <div className="flex items-center gap-3">
            <CheckCircle className="w-6 h-6 text-green-600 flex-shrink-0" />
            <div className="flex-1">
              <h4 className="font-semibold text-green-900">Horaires configurés</h4>
              <p className="text-sm text-green-700 mt-1">
                Vos disponibilités ont été enregistrées. Vous pourrez les modifier à tout moment depuis votre espace prestataire.
              </p>
            </div>
          </div>
          <div className="flex gap-3 mt-4">
            <Link href="/contractor/planning" className="flex-1">
              <Button variant="outline" className="w-full">
                Modifier mes horaires
              </Button>
            </Link>
            <Button onClick={onNext} className="flex-1 bg-button-primary hover:bg-button-primary/90">
              Continuer
            </Button>
          </div>
        </div>
      ) : (
        <div className="flex gap-3">
          <Link href="/contractor/planning?onboarding=true" className="flex-1">
            <Button className="w-full bg-button-primary hover:bg-button-primary/90 text-white">
              Configurer mes horaires
            </Button>
          </Link>
        </div>
      )}

      <div className="bg-gray-50 rounded-lg p-4 text-sm text-gray-600">
        <p>
          💡 <strong>Astuce :</strong> Ne vous inquiétez pas si vous n'êtes pas sûr de vos disponibilités. Vous pourrez toujours les ajuster plus tard en fonction de vos besoins.
        </p>
      </div>
    </div>
  )
}
