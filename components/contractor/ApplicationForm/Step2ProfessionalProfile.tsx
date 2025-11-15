'use client'

/**
 * Step 2: Professional Profile
 * Task: T026 - Dynamic specialty selection based on profession
 */

import { useForm, Controller } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { ProfessionalProfileSchema, ProfessionalProfile } from '@/lib/validations/contractor-application'
import { Button } from '@/components/ui/button'
import { ArrowLeft } from 'lucide-react'
import { useState, useEffect } from 'react'

interface Specialty {
  id: number
  name: string
  category: string
}

interface Step2Props {
  initialData: Partial<ProfessionalProfile>
  onComplete: (data: ProfessionalProfile) => void
  onPrevious: () => void
}

export function Step2ProfessionalProfile({ initialData, onComplete, onPrevious }: Step2Props) {
  const [specialties, setSpecialties] = useState<Specialty[]>([])
  const [filteredSpecialties, setFilteredSpecialties] = useState<Specialty[]>([])

  const {
    register,
    handleSubmit,
    watch,
    control,
    formState: { errors, isValid },
  } = useForm<ProfessionalProfile>({
    resolver: zodResolver(ProfessionalProfileSchema),
    defaultValues: initialData,
    mode: 'onChange',
  })

  const profession = watch('profession')

  // Load specialties from database
  useEffect(() => {
    // TODO: Fetch from API
    // Temporary mock data
    const mockSpecialties: Specialty[] = [
      { id: 1, name: 'Massage Suédois', category: 'massage' },
      { id: 2, name: 'Massage Deep Tissue', category: 'massage' },
      { id: 3, name: 'Massage Thaï', category: 'massage' },
      { id: 4, name: 'Maquillage', category: 'beauty' },
      { id: 5, name: 'Manucure', category: 'beauty' },
      { id: 6, name: 'Pédicure', category: 'beauty' },
      { id: 7, name: 'Coupe Femme', category: 'hair' },
      { id: 8, name: 'Coupe Homme', category: 'hair' },
      { id: 9, name: 'Coloration', category: 'hair' },
    ]
    setSpecialties(mockSpecialties)
  }, [])

  // Filter specialties based on profession
  useEffect(() => {
    if (profession && profession !== 'other') {
      setFilteredSpecialties(specialties.filter(s => s.category === profession))
    } else {
      setFilteredSpecialties(specialties)
    }
  }, [profession, specialties])

  return (
    <form onSubmit={handleSubmit(onComplete)} className="space-y-6">
      <div>
        <h2 className="text-xl font-semibold text-gray-900 mb-4">
          Profil professionnel
        </h2>
        <p className="text-gray-600 mb-6">
          Parlez-nous de votre expertise
        </p>
      </div>

      <div>
        <label htmlFor="profession" className="block text-sm font-medium text-gray-700 mb-1">
          Profession principale *
        </label>
        <select
          {...register('profession')}
          id="profession"
          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-button-primary focus:border-transparent"
        >
          <option value="">Sélectionnez...</option>
          <option value="massage">Massage</option>
          <option value="beauty">Beauté / Esthétique</option>
          <option value="hair">Coiffure</option>
          <option value="health">Santé / Bien-être</option>
          <option value="other">Autre</option>
        </select>
        {errors.profession && (
          <p className="mt-1 text-sm text-red-600">{errors.profession.message}</p>
        )}
      </div>

      <div>
        <label htmlFor="years_of_experience" className="block text-sm font-medium text-gray-700 mb-1">
          Années d'expérience *
        </label>
        <input
          {...register('years_of_experience', { valueAsNumber: true })}
          type="number"
          id="years_of_experience"
          min="0"
          max="50"
          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-button-primary focus:border-transparent"
          placeholder="5"
        />
        {errors.years_of_experience && (
          <p className="mt-1 text-sm text-red-600">{errors.years_of_experience.message}</p>
        )}
      </div>

      {profession && (
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Spécialités * (sélectionnez 1 à 10)
          </label>
          <Controller
            name="specialties"
            control={control}
            render={({ field }) => (
              <div className="grid md:grid-cols-2 gap-2 max-h-60 overflow-y-auto border border-gray-200 rounded-lg p-4">
                {filteredSpecialties.map((specialty) => (
                  <label key={specialty.id} className="flex items-center space-x-2 cursor-pointer hover:bg-gray-50 p-2 rounded">
                    <input
                      type="checkbox"
                      value={specialty.id}
                      checked={field.value?.includes(specialty.id) || false}
                      onChange={(e) => {
                        const current = field.value || []
                        if (e.target.checked) {
                          field.onChange([...current, specialty.id])
                        } else {
                          field.onChange(current.filter(id => id !== specialty.id))
                        }
                      }}
                      className="w-4 h-4 text-button-primary border-gray-300 rounded focus:ring-button-primary"
                    />
                    <span className="text-sm text-gray-700">{specialty.name}</span>
                  </label>
                ))}
              </div>
            )}
          />
          {errors.specialties && (
            <p className="mt-1 text-sm text-red-600">{errors.specialties.message}</p>
          )}
        </div>
      )}

      <div>
        <label htmlFor="diplomas" className="block text-sm font-medium text-gray-700 mb-1">
          Diplômes et certifications (optionnel)
        </label>
        <textarea
          {...register('diplomas')}
          id="diplomas"
          rows={3}
          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-button-primary focus:border-transparent"
          placeholder="CAP Esthétique, Certification massage suédois..."
        />
        {errors.diplomas && (
          <p className="mt-1 text-sm text-red-600">{errors.diplomas.message}</p>
        )}
      </div>

      <div>
        <label htmlFor="services_offered" className="block text-sm font-medium text-gray-700 mb-1">
          Services proposés *
        </label>
        <textarea
          {...register('services_offered')}
          id="services_offered"
          rows={4}
          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-button-primary focus:border-transparent"
          placeholder="Décrivez les services que vous proposez..."
        />
        {errors.services_offered && (
          <p className="mt-1 text-sm text-red-600">{errors.services_offered.message}</p>
        )}
      </div>

      <div className="flex justify-between pt-4">
        <Button
          type="button"
          onClick={onPrevious}
          variant="outline"
          className="px-6 py-3 rounded-full"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Retour
        </Button>
        <Button
          type="submit"
          disabled={!isValid}
          className="px-8 py-3 bg-button-primary hover:bg-button-primary/90 text-white rounded-full"
        >
          Continuer
        </Button>
      </div>
    </form>
  )
}
