'use client'

/**
 * Step 4: Motivation
 * Task: T028 - Min 100 characters with character counter
 */

import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { MotivationSchema, Motivation } from '@/lib/validations/contractor-application'
import { Button } from '@/components/ui/button'
import { ArrowLeft } from 'lucide-react'
import { useState, useEffect } from 'react'

interface Step4Props {
  initialData: Partial<Motivation>
  onComplete: (data: Motivation) => void
  onPrevious: () => void
}

export function Step4Motivation({ initialData, onComplete, onPrevious }: Step4Props) {
  const {
    register,
    handleSubmit,
    watch,
    formState: { errors, isValid },
  } = useForm<Motivation>({
    resolver: zodResolver(MotivationSchema),
    defaultValues: initialData,
    mode: 'onChange',
  })

  const motivation = watch('motivation')
  const [charCount, setCharCount] = useState(initialData.motivation?.length || 0)

  useEffect(() => {
    setCharCount(motivation?.length || 0)
  }, [motivation])

  const remainingChars = 100 - charCount
  const isMinReached = charCount >= 100

  return (
    <form onSubmit={handleSubmit(onComplete)} className="space-y-6">
      <div>
        <h2 className="text-xl font-semibold text-gray-900 mb-4">
          Votre motivation (optionnel)
        </h2>
        <p className="text-gray-600 mb-6">
          Si vous le souhaitez, expliquez-nous pourquoi vous voulez rejoindre Simone Paris
        </p>
      </div>

      <div>
        <label htmlFor="motivation" className="block text-sm font-medium text-gray-700 mb-1">
          Lettre de motivation <span className="text-gray-500 font-normal">(optionnel)</span>
        </label>
        <textarea
          {...register('motivation')}
          id="motivation"
          rows={10}
          className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-button-primary focus:border-transparent resize-none"
          placeholder="Si vous le souhaitez, partagez votre passion pour votre métier, ce qui vous différencie, pourquoi vous voulez travailler avec Simone Paris... (minimum 100 caractères si fourni)"
        />

        <div className="flex items-center justify-between mt-2">
          <div>
            {errors.motivation && (
              <p className="text-sm text-red-600">{errors.motivation.message}</p>
            )}
          </div>

          <div className="text-sm">
            <span className={`font-medium ${
              charCount === 0 ? 'text-gray-500' :
              isMinReached ? 'text-green-600' :
              'text-orange-600'
            }`}>
              {charCount} / 2000 caractères
            </span>
            {charCount > 0 && !isMinReached && (
              <span className="ml-2 text-orange-600">
                (minimum 100 si fourni)
              </span>
            )}
            {isMinReached && (
              <span className="ml-2 text-green-600">
                ✓
              </span>
            )}
          </div>
        </div>

        <div className="mt-4 p-4 bg-blue-50 border border-blue-200 rounded-lg">
          <p className="text-sm text-blue-800 font-medium mb-2">
            💡 Conseils pour une bonne motivation :
          </p>
          <ul className="text-sm text-blue-700 space-y-1 ml-4 list-disc">
            <li>Parlez de votre passion pour votre métier</li>
            <li>Expliquez ce qui vous rend unique</li>
            <li>Mentionnez votre expérience avec les clients à domicile</li>
            <li>Décrivez vos valeurs et votre approche du service</li>
          </ul>
        </div>
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
