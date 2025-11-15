'use client'

/**
 * Onboarding Step 3: Profile Completion
 * Task: T047 - Bio, professional_title, years_of_experience, specialty selection
 * Feature: 007-contractor-interface
 */

import { useState, useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Button } from '@/components/ui/button'
import { User, CheckCircle } from 'lucide-react'

const ProfileSchema = z.object({
  bio: z.string().min(50, 'Minimum 50 caractères').max(500, 'Maximum 500 caractères'),
  professional_title: z.string().min(3, 'Titre professionnel requis').max(100),
  years_of_experience: z.number().int().min(0).max(50),
  specialties: z.array(z.number()).min(1, 'Sélectionnez au moins une spécialité'),
})

type ProfileData = z.infer<typeof ProfileSchema>

interface Step3ProfileProps {
  isCompleted: boolean
  contractorId: number
  onComplete: () => void
}

export function Step3Profile({ isCompleted, contractorId, onComplete }: Step3ProfileProps) {
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [availableSpecialties, setAvailableSpecialties] = useState<Array<{id: number, name: string}>>([])

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors, isValid },
  } = useForm<ProfileData>({
    resolver: zodResolver(ProfileSchema),
    mode: 'onChange',
    defaultValues: {
      specialties: [],
      years_of_experience: 0,
    },
  })

  const bio = watch('bio')
  const selectedSpecialties = watch('specialties')

  // Fetch specialties
  useEffect(() => {
    // TODO: Fetch from database
    setAvailableSpecialties([
      { id: 1, name: 'Massage suédois' },
      { id: 2, name: 'Massage deep tissue' },
      { id: 3, name: 'Coiffure à domicile' },
      { id: 4, name: 'Manucure/Pédicure' },
      { id: 5, name: 'Soins du visage' },
    ])
  }, [])

  const toggleSpecialty = (specialtyId: number) => {
    const current = selectedSpecialties || []
    if (current.includes(specialtyId)) {
      setValue('specialties', current.filter(id => id !== specialtyId), { shouldValidate: true })
    } else {
      setValue('specialties', [...current, specialtyId], { shouldValidate: true })
    }
  }

  const onSubmit = async (data: ProfileData) => {
    setIsSubmitting(true)

    try {
      // Call Edge Function to update profile
      const response = await fetch('/api/contractor/onboarding/update-profile', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contractorId,
          ...data,
        }),
      })

      if (!response.ok) {
        throw new Error('Failed to update profile')
      }

      onComplete()
    } catch (error) {
      console.error('Error updating profile:', error)
      alert('Erreur lors de la mise à jour du profil. Veuillez réessayer.')
    } finally {
      setIsSubmitting(false)
    }
  }

  if (isCompleted) {
    return (
      <div className="space-y-6">
        <div className="text-center">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-purple-100 rounded-full mb-4">
            <User className="w-8 h-8 text-purple-600" />
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">
            Profil complété
          </h2>
          <p className="text-gray-600">
            Votre profil professionnel est configuré
          </p>
        </div>

        <div className="bg-green-50 border border-green-200 rounded-lg p-6">
          <div className="flex items-center gap-3">
            <CheckCircle className="w-6 h-6 text-green-600 flex-shrink-0" />
            <div className="flex-1">
              <h4 className="font-semibold text-green-900">Profil enregistré</h4>
              <p className="text-sm text-green-700 mt-1">
                Vos informations professionnelles sont maintenant visibles par les clients potentiels.
              </p>
            </div>
          </div>
        </div>

        <Button
          onClick={onComplete}
          className="w-full bg-button-primary hover:bg-button-primary/90"
        >
          Terminer l'onboarding
        </Button>
      </div>
    )
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      <div className="text-center">
        <div className="inline-flex items-center justify-center w-16 h-16 bg-purple-100 rounded-full mb-4">
          <User className="w-8 h-8 text-purple-600" />
        </div>
        <h2 className="text-2xl font-bold text-gray-900 mb-2">
          Complétez votre profil
        </h2>
        <p className="text-gray-600">
          Dernière étape : ajoutez les informations qui seront visibles par les clients
        </p>
      </div>

      {/* Professional Title */}
      <div>
        <label htmlFor="professional_title" className="block text-sm font-medium text-gray-700 mb-2">
          Titre professionnel *
        </label>
        <input
          {...register('professional_title')}
          type="text"
          id="professional_title"
          placeholder="Ex: Masseur professionnel certifié"
          className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-button-primary focus:border-transparent"
        />
        {errors.professional_title && (
          <p className="mt-1 text-sm text-red-600">{errors.professional_title.message}</p>
        )}
      </div>

      {/* Years of Experience */}
      <div>
        <label htmlFor="years_of_experience" className="block text-sm font-medium text-gray-700 mb-2">
          Années d'expérience *
        </label>
        <input
          {...register('years_of_experience', { valueAsNumber: true })}
          type="number"
          id="years_of_experience"
          min="0"
          max="50"
          className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-button-primary focus:border-transparent"
        />
        {errors.years_of_experience && (
          <p className="mt-1 text-sm text-red-600">{errors.years_of_experience.message}</p>
        )}
      </div>

      {/* Specialties */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-3">
          Spécialités * (sélectionnez au moins une)
        </label>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {availableSpecialties.map(specialty => (
            <button
              key={specialty.id}
              type="button"
              onClick={() => toggleSpecialty(specialty.id)}
              className={`p-4 border-2 rounded-lg text-left transition-all ${
                selectedSpecialties?.includes(specialty.id)
                  ? 'border-button-primary bg-blue-50 text-button-primary'
                  : 'border-gray-200 hover:border-gray-300'
              }`}
            >
              <div className="flex items-center justify-between">
                <span className="font-medium">{specialty.name}</span>
                {selectedSpecialties?.includes(specialty.id) && (
                  <CheckCircle className="w-5 h-5 text-button-primary" />
                )}
              </div>
            </button>
          ))}
        </div>
        {errors.specialties && (
          <p className="mt-2 text-sm text-red-600">{errors.specialties.message}</p>
        )}
      </div>

      {/* Bio */}
      <div>
        <label htmlFor="bio" className="block text-sm font-medium text-gray-700 mb-2">
          Présentation * (50-500 caractères)
        </label>
        <textarea
          {...register('bio')}
          id="bio"
          rows={6}
          placeholder="Présentez-vous en quelques mots : votre passion pour votre métier, votre approche, ce qui vous rend unique..."
          className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-button-primary focus:border-transparent resize-none"
        />
        <div className="flex items-center justify-between mt-2">
          {errors.bio && (
            <p className="text-sm text-red-600">{errors.bio.message}</p>
          )}
          <p className={`text-sm ml-auto ${
            bio && bio.length >= 50 && bio.length <= 500 ? 'text-green-600' : 'text-gray-500'
          }`}>
            {bio?.length || 0} / 500 caractères
          </p>
        </div>
      </div>

      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 text-sm text-blue-800">
        <p>
          💡 <strong>Astuce :</strong> Un bon profil augmente vos chances d'être choisi par les clients. Soyez authentique et mettez en avant votre expérience et vos qualifications.
        </p>
      </div>

      <Button
        type="submit"
        disabled={!isValid || isSubmitting}
        className="w-full bg-purple-600 hover:bg-purple-700 text-white py-6 text-lg"
      >
        {isSubmitting ? 'Enregistrement...' : 'Finaliser mon profil'}
      </Button>
    </form>
  )
}
