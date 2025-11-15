'use client'

/**
 * Contractor Onboarding Page
 * Task: T043 - Onboarding wizard page with progress steps
 * Feature: 007-contractor-interface
 */

import { useEffect, useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { createClient } from '@/lib/supabase/client'
import { OnboardingWizard } from '@/components/contractor/OnboardingWizard/OnboardingWizard'

export default function ContractorOnboardingPage() {
  const [userId, setUserId] = useState<string | null>(null)

  // Get current user
  useEffect(() => {
    const getUser = async () => {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      setUserId(user?.id || null)
    }

    getUser()
  }, [])

  // Fetch contractor ID
  const { data: contractor, isLoading, error } = useQuery({
    queryKey: ['contractor', userId],
    queryFn: async () => {
      if (!userId) return null

      const supabase = createClient()

      const { data, error } = await supabase
        .from('contractors')
        .select('id')
        .eq('profile_uuid', userId)
        .single()

      if (error) {
        console.error('Error fetching contractor:', error)
        throw error
      }

      return data
    },
    enabled: !!userId,
  })

  if (isLoading || !userId) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-button-primary"></div>
          <p className="mt-4 text-gray-600">Chargement de votre profil...</p>
        </div>
      </div>
    )
  }

  if (error || !contractor) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="max-w-md mx-auto text-center p-6">
          <div className="text-red-600 mb-4">
            <svg className="w-16 h-16 mx-auto" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
          </div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">
            Erreur de chargement
          </h1>
          <p className="text-gray-600 mb-6">
            Impossible de charger votre profil prestataire. Veuillez réessayer ou contacter le support.
          </p>
          <a
            href="/"
            className="inline-block px-6 py-3 bg-button-primary text-white rounded-lg hover:bg-button-primary/90"
          >
            Retour à l'accueil
          </a>
        </div>
      </div>
    )
  }

  return <OnboardingWizard contractorId={contractor.id} />
}
