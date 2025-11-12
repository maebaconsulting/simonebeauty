'use client'

/**
 * Multi-Step Contractor Application Form
 * Feature: 007-contractor-interface
 *
 * 5-step form for contractor job applications
 */

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useMultiStepForm } from '@/lib/hooks/useMultiStepForm'
import { CompleteApplication } from '@/lib/validations/contractor-application'
import { Step1PersonalInfo } from './Step1PersonalInfo'
import { Step2ProfessionalProfile } from './Step2ProfessionalProfile'
import { Step3Availability } from './Step3Availability'
import { Step4Motivation } from './Step4Motivation'
import { Step5Documents } from './Step5Documents'

export function ApplicationForm() {
  const router = useRouter()
  const {
    currentStep,
    formData,
    updateFormData,
    nextStep,
    previousStep,
    reset,
    progress,
    isFirstStep,
    isLastStep,
  } = useMultiStepForm<CompleteApplication>({
    totalSteps: 5,
    storageKey: 'contractor-application',
  })

  const [isSubmitting, setIsSubmitting] = useState(false)

  const handleStepComplete = (data: Partial<CompleteApplication>) => {
    updateFormData(data)
    if (!isLastStep) {
      nextStep()
    }
  }

  const handleSubmit = async (documentsData: Partial<CompleteApplication>) => {
    setIsSubmitting(true)

    try {
      const completeData = {
        ...formData,
        ...documentsData,
      }

      console.log('Submitting application:', completeData)

      // Build FormData with files
      const submissionFormData = new FormData()

      // Add application data as JSON
      const { cv_file, certifications_files, portfolio_files, ...applicationData } = completeData
      submissionFormData.append('data', JSON.stringify(applicationData))

      // Add files
      if (cv_file instanceof File) {
        submissionFormData.append('cv_file', cv_file)
      }

      if (certifications_files && Array.isArray(certifications_files)) {
        certifications_files.forEach((file) => {
          if (file instanceof File) {
            submissionFormData.append('certifications_files', file)
          }
        })
      }

      if (portfolio_files && Array.isArray(portfolio_files)) {
        portfolio_files.forEach((file) => {
          if (file instanceof File) {
            submissionFormData.append('portfolio_files', file)
          }
        })
      }

      // Call Edge Function
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_SUPABASE_URL}/functions/v1/submit-job-application`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY}`,
          },
          body: submissionFormData,
        }
      )

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: 'Erreur de soumission' }))
        throw new Error(errorData.error || 'Erreur lors de la soumission')
      }

      const result = await response.json()
      console.log('Application submitted successfully:', result)

      // Reset form and redirect to success page
      reset()
      router.push('/rejoindre-simone/success')

    } catch (error) {
      console.error('Error submitting application:', error)
      alert(
        error instanceof Error
          ? error.message
          : 'Erreur lors de la soumission. Veuillez réessayer.'
      )
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div>
      {/* Progress Indicator */}
      <div className="mb-8">
        <div className="flex items-center justify-between mb-4">
          {[1, 2, 3, 4, 5].map((step) => (
            <div key={step} className="flex items-center flex-1">
              <div
                className={`w-10 h-10 rounded-full flex items-center justify-center font-semibold transition-colors ${
                  step === currentStep
                    ? 'bg-button-primary text-white'
                    : step < currentStep
                    ? 'bg-green-500 text-white'
                    : 'bg-gray-200 text-gray-600'
                }`}
              >
                {step < currentStep ? '✓' : step}
              </div>
              {step < 5 && (
                <div
                  className={`flex-1 h-1 mx-2 transition-colors ${
                    step < currentStep ? 'bg-green-500' : 'bg-gray-200'
                  }`}
                />
              )}
            </div>
          ))}
        </div>

        <div className="text-sm text-gray-600 text-center">
          Étape {currentStep} sur 5
        </div>
      </div>

      {/* Step Content */}
      <div className="min-h-[400px]">
        {currentStep === 1 && (
          <Step1PersonalInfo
            initialData={formData}
            onComplete={handleStepComplete}
            onPrevious={previousStep}
            isFirst={isFirstStep}
          />
        )}

        {currentStep === 2 && (
          <Step2ProfessionalProfile
            initialData={formData}
            onComplete={handleStepComplete}
            onPrevious={previousStep}
          />
        )}

        {currentStep === 3 && (
          <Step3Availability
            initialData={formData}
            onComplete={handleStepComplete}
            onPrevious={previousStep}
          />
        )}

        {currentStep === 4 && (
          <Step4Motivation
            initialData={formData}
            onComplete={handleStepComplete}
            onPrevious={previousStep}
          />
        )}

        {currentStep === 5 && (
          <Step5Documents
            initialData={formData}
            onComplete={handleSubmit}
            onPrevious={previousStep}
            isSubmitting={isSubmitting}
            isLast={isLastStep}
          />
        )}
      </div>
    </div>
  )
}
