'use client'

/**
 * Step 1: Personal Information
 * Task: T025
 */

import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { PersonalInfoSchema, PersonalInfo } from '@/lib/validations/contractor-application'
import { Button } from '@/components/ui/button'

interface Step1Props {
  initialData: Partial<PersonalInfo>
  onComplete: (data: PersonalInfo) => void
  onPrevious?: () => void
  isFirst?: boolean
}

export function Step1PersonalInfo({ initialData, onComplete, isFirst }: Step1Props) {
  const {
    register,
    handleSubmit,
    formState: { errors, isValid },
  } = useForm<PersonalInfo>({
    resolver: zodResolver(PersonalInfoSchema),
    defaultValues: initialData,
    mode: 'onChange',
  })

  return (
    <form onSubmit={handleSubmit(onComplete)} className="space-y-6">
      <div>
        <h2 className="text-xl font-semibold text-gray-900 mb-4">
          Informations personnelles
        </h2>
        <p className="text-gray-600 mb-6">
          Commençons par vos coordonnées
        </p>
      </div>

      <div className="grid md:grid-cols-2 gap-4">
        <div>
          <label htmlFor="first_name" className="block text-sm font-medium text-gray-700 mb-1">
            Prénom *
          </label>
          <input
            {...register('first_name')}
            type="text"
            id="first_name"
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-button-primary focus:border-transparent"
            placeholder="Marie"
          />
          {errors.first_name && (
            <p className="mt-1 text-sm text-red-600">{errors.first_name.message}</p>
          )}
        </div>

        <div>
          <label htmlFor="last_name" className="block text-sm font-medium text-gray-700 mb-1">
            Nom *
          </label>
          <input
            {...register('last_name')}
            type="text"
            id="last_name"
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-button-primary focus:border-transparent"
            placeholder="Dupont"
          />
          {errors.last_name && (
            <p className="mt-1 text-sm text-red-600">{errors.last_name.message}</p>
          )}
        </div>
      </div>

      <div>
        <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
          Email *
        </label>
        <input
          {...register('email')}
          type="email"
          id="email"
          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-button-primary focus:border-transparent"
          placeholder="marie.dupont@example.com"
        />
        {errors.email && (
          <p className="mt-1 text-sm text-red-600">{errors.email.message}</p>
        )}
      </div>

      <div>
        <label htmlFor="phone" className="block text-sm font-medium text-gray-700 mb-1">
          Téléphone *
        </label>
        <input
          {...register('phone')}
          type="tel"
          id="phone"
          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-button-primary focus:border-transparent"
          placeholder="0612345678"
        />
        {errors.phone && (
          <p className="mt-1 text-sm text-red-600">{errors.phone.message}</p>
        )}
        <p className="mt-1 text-xs text-gray-500">
          Format: 0612345678 ou +33612345678
        </p>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Type de structure
        </label>
        <div className="flex gap-4">
          <label className="flex items-center">
            <input
              {...register('contractor_type')}
              type="radio"
              value="personnel"
              className="mr-2"
            />
            Personnel (auto-entrepreneur)
          </label>
          <label className="flex items-center">
            <input
              {...register('contractor_type')}
              type="radio"
              value="société"
              className="mr-2"
            />
            Société
          </label>
        </div>
        {errors.contractor_type && (
          <p className="mt-1 text-sm text-red-600">{errors.contractor_type.message}</p>
        )}
      </div>

      <div>
        <label htmlFor="street_address" className="block text-sm font-medium text-gray-700 mb-1">
          Adresse
        </label>
        <input
          {...register('street_address')}
          type="text"
          id="street_address"
          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-button-primary focus:border-transparent"
          placeholder="123 Rue de la Paix"
        />
        {errors.street_address && (
          <p className="mt-1 text-sm text-red-600">{errors.street_address.message}</p>
        )}
      </div>

      <div className="grid md:grid-cols-3 gap-4">
        <div>
          <label htmlFor="city" className="block text-sm font-medium text-gray-700 mb-1">
            Ville
          </label>
          <input
            {...register('city')}
            type="text"
            id="city"
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-button-primary focus:border-transparent"
            placeholder="Paris"
          />
          {errors.city && (
            <p className="mt-1 text-sm text-red-600">{errors.city.message}</p>
          )}
        </div>

        <div>
          <label htmlFor="postal_code" className="block text-sm font-medium text-gray-700 mb-1">
            Code postal
          </label>
          <input
            {...register('postal_code')}
            type="text"
            id="postal_code"
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-button-primary focus:border-transparent"
            placeholder="75001"
          />
          {errors.postal_code && (
            <p className="mt-1 text-sm text-red-600">{errors.postal_code.message}</p>
          )}
        </div>

        <div>
          <label htmlFor="country" className="block text-sm font-medium text-gray-700 mb-1">
            Pays *
          </label>
          <input
            {...register('country')}
            type="text"
            id="country"
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-button-primary focus:border-transparent"
            placeholder="France"
            defaultValue="France"
          />
          {errors.country && (
            <p className="mt-1 text-sm text-red-600">{errors.country.message}</p>
          )}
        </div>
      </div>

      <div className="flex justify-end pt-4">
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
