'use client'

/**
 * Onboarding Wizard Component
 * Task: T044 - Step indicator and completion percentage
 * Feature: 007-contractor-interface
 */

import { useState, useEffect } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { createClient } from '@/lib/supabase/client'
import { Step1Schedule } from './Step1Schedule'
import { Step2StripeConnect } from './Step2StripeConnect'
import { Step3Profile } from './Step3Profile'
import { CheckCircle, Circle } from 'lucide-react'

interface OnboardingStatus {
  schedule_configured: boolean
  stripe_connected: boolean
  profile_completed: boolean
  completion_percentage: number
  is_completed: boolean
}

interface OnboardingWizardProps {
  contractorId: number
}

export function OnboardingWizard({ contractorId }: OnboardingWizardProps) {
  const queryClient = useQueryClient()
  const [currentStep, setCurrentStep] = useState(1)

  // Fetch onboarding status
  const { data: status, isLoading } = useQuery({
    queryKey: ['contractor-onboarding-status', contractorId],
    queryFn: async () => {
      const supabase = createClient()

      const { data, error } = await supabase
        .from('contractor_onboarding_status')
        .select('*')
        .eq('contractor_id', contractorId)
        .single()

      if (error) throw error

      return data as OnboardingStatus
    },
    refetchInterval: 5000, // Refetch every 5 seconds to catch updates
  })

  // Determine current step based on completion status
  useEffect(() => {
    if (status) {
      if (!status.schedule_configured) {
        setCurrentStep(1)
      } else if (!status.stripe_connected) {
        setCurrentStep(2)
      } else if (!status.profile_completed) {
        setCurrentStep(3)
      }
    }
  }, [status])

  const handleStepComplete = () => {
    // Refetch status and move to next step
    queryClient.invalidateQueries({ queryKey: ['contractor-onboarding-status', contractorId] })

    if (currentStep < 3) {
      setCurrentStep(currentStep + 1)
    }
  }

  const handleFinalComplete = () => {
    // Redirect to contractor dashboard
    window.location.href = '/contractor/dashboard'
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-button-primary"></div>
          <p className="mt-4 text-gray-600">Chargement...</p>
        </div>
      </div>
    )
  }

  if (!status) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <p className="text-red-600">Erreur lors du chargement du statut d'onboarding.</p>
        </div>
      </div>
    )
  }

  const steps = [
    {
      number: 1,
      title: 'Horaires',
      description: 'Configurez vos disponibilités',
      completed: status.schedule_configured,
    },
    {
      number: 2,
      title: 'Paiements',
      description: 'Connectez Stripe',
      completed: status.stripe_connected,
    },
    {
      number: 3,
      title: 'Profil',
      description: 'Complétez votre profil',
      completed: status.profile_completed,
    },
  ]

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Bienvenue chez Simone Paris !
          </h1>
          <p className="text-gray-600">
            Complétez votre onboarding pour commencer à recevoir des demandes de clients
          </p>
        </div>

        {/* Progress Bar */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <span className="text-sm font-medium text-gray-700">
              Progression
            </span>
            <span className="text-sm font-medium text-button-primary">
              {status.completion_percentage}%
            </span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-3">
            <div
              className="bg-button-primary h-3 rounded-full transition-all duration-500"
              style={{ width: `${status.completion_percentage}%` }}
            />
          </div>
        </div>

        {/* Step Indicators */}
        <div className="mb-12">
          <div className="flex items-center justify-between relative">
            {/* Connection Line */}
            <div className="absolute top-5 left-0 right-0 h-0.5 bg-gray-200 -z-10" />

            {steps.map((step, index) => (
              <div key={step.number} className="flex flex-col items-center flex-1">
                <div
                  className={`w-10 h-10 rounded-full flex items-center justify-center font-semibold mb-2 ${
                    step.completed
                      ? 'bg-green-500 text-white'
                      : currentStep === step.number
                      ? 'bg-button-primary text-white'
                      : 'bg-gray-200 text-gray-600'
                  }`}
                >
                  {step.completed ? (
                    <CheckCircle className="w-6 h-6" />
                  ) : (
                    <span>{step.number}</span>
                  )}
                </div>
                <div className="text-center">
                  <p className={`text-sm font-medium ${
                    currentStep === step.number ? 'text-button-primary' : 'text-gray-700'
                  }`}>
                    {step.title}
                  </p>
                  <p className="text-xs text-gray-500 mt-1">{step.description}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Step Content */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-8">
          {currentStep === 1 && (
            <Step1Schedule
              isCompleted={status.schedule_configured}
              onNext={handleStepComplete}
            />
          )}

          {currentStep === 2 && (
            <Step2StripeConnect
              isCompleted={status.stripe_connected}
              contractorId={contractorId}
              onNext={handleStepComplete}
            />
          )}

          {currentStep === 3 && (
            <Step3Profile
              isCompleted={status.profile_completed}
              contractorId={contractorId}
              onComplete={handleFinalComplete}
            />
          )}
        </div>

        {/* Help Text */}
        <div className="mt-6 text-center text-sm text-gray-600">
          <p>
            Besoin d'aide ? Contactez-nous à{' '}
            <a href="mailto:support@simone.paris" className="text-button-primary hover:underline">
              support@simone.paris
            </a>
          </p>
        </div>
      </div>
    </div>
  )
}
