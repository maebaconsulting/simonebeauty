/**
 * Multi-Step Form Hook
 * Feature: 007-contractor-interface
 * 
 * Manages form state across multiple steps with persistence
 */

import { useState, useEffect } from 'react'

export interface UseMultiStepFormProps<T> {
  totalSteps: number
  initialData?: Partial<T>
  storageKey?: string
  onStepChange?: (step: number) => void
}

export function useMultiStepForm<T extends Record<string, any>>({
  totalSteps,
  initialData = {},
  storageKey,
  onStepChange,
}: UseMultiStepFormProps<T>) {
  const [currentStep, setCurrentStep] = useState(1)
  const [formData, setFormData] = useState<Partial<T>>(initialData)
  const [isValid, setIsValid] = useState(false)

  // Load from localStorage on mount
  useEffect(() => {
    if (storageKey && typeof window !== 'undefined') {
      const saved = localStorage.getItem(storageKey)
      if (saved) {
        try {
          const parsed = JSON.parse(saved)
          setFormData(parsed.data || {})
          setCurrentStep(parsed.step || 1)
        } catch (error) {
          console.error('Error loading form data from storage:', error)
        }
      }
    }
  }, [storageKey])

  // Save to localStorage on change
  useEffect(() => {
    if (storageKey && typeof window !== 'undefined') {
      localStorage.setItem(storageKey, JSON.stringify({
        data: formData,
        step: currentStep,
        timestamp: Date.now(),
      }))
    }
  }, [formData, currentStep, storageKey])

  // Notify step change
  useEffect(() => {
    onStepChange?.(currentStep)
  }, [currentStep, onStepChange])

  const updateFormData = (data: Partial<T>) => {
    setFormData((prev) => ({ ...prev, ...data }))
  }

  const nextStep = () => {
    if (currentStep < totalSteps) {
      setCurrentStep((prev) => prev + 1)
    }
  }

  const previousStep = () => {
    if (currentStep > 1) {
      setCurrentStep((prev) => prev - 1)
    }
  }

  const goToStep = (step: number) => {
    if (step >= 1 && step <= totalSteps) {
      setCurrentStep(step)
    }
  }

  const reset = () => {
    setFormData(initialData)
    setCurrentStep(1)
    if (storageKey && typeof window !== 'undefined') {
      localStorage.removeItem(storageKey)
    }
  }

  const canGoNext = isValid && currentStep < totalSteps
  const canGoPrevious = currentStep > 1
  const isFirstStep = currentStep === 1
  const isLastStep = currentStep === totalSteps

  const progress = (currentStep / totalSteps) * 100

  return {
    currentStep,
    formData,
    isValid,
    setIsValid,
    updateFormData,
    nextStep,
    previousStep,
    goToStep,
    reset,
    canGoNext,
    canGoPrevious,
    isFirstStep,
    isLastStep,
    progress,
    totalSteps,
  }
}
