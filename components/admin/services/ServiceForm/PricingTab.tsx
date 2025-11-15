'use client'

/**
 * Pricing Tab Component
 * Feature: 018-service-management-crud
 *
 * Pricing and duration management with automatic calculations
 * Fields: base_price, cost_price, base_duration_minutes, has_many_session, number_of_session
 */

import { UseFormReturn } from 'react-hook-form'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Checkbox } from '@/components/ui/checkbox'
import { AlertCircle, TrendingUp, Clock, Package } from 'lucide-react'
import { ServiceInsertData } from '@/lib/validations/service-schemas'
import { useEffect } from 'react'

// ============================================================================
// Types
// ============================================================================

interface PricingTabProps {
  form: UseFormReturn<ServiceInsertData>
}

// ============================================================================
// Component
// ============================================================================

export default function PricingTab({ form }: PricingTabProps) {
  const {
    register,
    formState: { errors },
    watch,
    setValue,
  } = form

  const base_price = watch('base_price')
  const cost_price = watch('cost_price')
  const base_duration_minutes = watch('base_duration_minutes')
  const has_many_session = watch('has_many_session')
  const number_of_session = watch('number_of_session') || 1

  // Calculate margin
  const margin = cost_price && base_price > 0
    ? ((base_price - cost_price) / base_price * 100).toFixed(2)
    : null

  // Calculate price per minute
  const pricePerMinute = base_price > 0 && base_duration_minutes > 0
    ? (base_price / base_duration_minutes).toFixed(2)
    : null

  // Calculate price per session (for packages)
  const pricePerSession = has_many_session && number_of_session > 1
    ? (base_price / number_of_session).toFixed(2)
    : null

  // Auto-adjust number_of_session when has_many_session changes
  useEffect(() => {
    if (has_many_session && number_of_session === 1) {
      setValue('number_of_session', 3) // Default to 3 sessions for packages
    } else if (!has_many_session && number_of_session > 1) {
      setValue('number_of_session', 1)
    }
  }, [has_many_session, number_of_session, setValue])

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h2 className="text-xl font-bold text-gray-900 mb-2">
          Prix et durée
        </h2>
        <p className="text-gray-600">
          Définissez le tarif et la durée du service
        </p>
      </div>

      {/* Pricing Section */}
      <div className="space-y-6">
        <h3 className="font-semibold text-gray-900 flex items-center gap-2">
          <TrendingUp className="w-5 h-5 text-[#FF9B8A]" />
          Tarification
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Base Price */}
          <div className="space-y-2">
            <Label htmlFor="base_price" className="required">
              Prix de vente (€)
            </Label>
            <div className="relative">
              <Input
                id="base_price"
                type="number"
                min="10"
                step="0.01"
                placeholder="135.00"
                {...register('base_price', { valueAsNumber: true })}
                className={errors.base_price ? 'border-red-500' : ''}
              />
              <span className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500">
                €
              </span>
            </div>
            {errors.base_price && (
              <p className="text-sm text-red-600 flex items-center gap-1">
                <AlertCircle className="w-4 h-4" />
                {errors.base_price.message}
              </p>
            )}
            <p className="text-xs text-gray-500">
              Prix affiché aux clients (minimum 10€)
            </p>
          </div>

          {/* Cost Price */}
          <div className="space-y-2">
            <Label htmlFor="cost_price">
              Prix de revient (€)
              <span className="ml-2 text-xs text-gray-500">(optionnel)</span>
            </Label>
            <div className="relative">
              <Input
                id="cost_price"
                type="number"
                min="0"
                step="0.01"
                placeholder="85.00"
                {...register('cost_price', { valueAsNumber: true })}
                className={errors.cost_price ? 'border-red-500' : ''}
              />
              <span className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500">
                €
              </span>
            </div>
            {errors.cost_price && (
              <p className="text-sm text-red-600 flex items-center gap-1">
                <AlertCircle className="w-4 h-4" />
                {errors.cost_price.message}
              </p>
            )}
            <p className="text-xs text-gray-500">
              Pour calculer votre marge
            </p>
          </div>
        </div>

        {/* Margin Calculation */}
        {margin && (
          <div className="bg-gradient-to-r from-green-50 to-emerald-50 border border-green-200 rounded-lg p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-700">Marge calculée</p>
                <p className="text-xs text-gray-600 mt-0.5">
                  {base_price.toFixed(2)}€ - {cost_price?.toFixed(2)}€ = {(base_price - (cost_price || 0)).toFixed(2)}€
                </p>
              </div>
              <div className="text-right">
                <p className="text-2xl font-bold text-green-700">{margin}%</p>
                <p className="text-xs text-green-600">de marge brute</p>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Duration Section */}
      <div className="space-y-6 border-t pt-6">
        <h3 className="font-semibold text-gray-900 flex items-center gap-2">
          <Clock className="w-5 h-5 text-blue-600" />
          Durée
        </h3>

        <div className="space-y-2">
          <Label htmlFor="base_duration_minutes" className="required">
            Durée du service (minutes)
          </Label>
          <Input
            id="base_duration_minutes"
            type="number"
            min="5"
            max="480"
            step="5"
            placeholder="90"
            {...register('base_duration_minutes', { valueAsNumber: true })}
            className={errors.base_duration_minutes ? 'border-red-500' : ''}
          />
          {errors.base_duration_minutes && (
            <p className="text-sm text-red-600 flex items-center gap-1">
              <AlertCircle className="w-4 h-4" />
              {errors.base_duration_minutes.message}
            </p>
          )}
          <p className="text-xs text-gray-500">
            Doit être un multiple de 5 (5 min à 8h max)
          </p>
        </div>

        {/* Price per minute */}
        {pricePerMinute && (
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
            <p className="text-sm text-blue-900">
              <span className="font-semibold">Prix par minute:</span>{' '}
              {pricePerMinute}€/min
            </p>
          </div>
        )}
      </div>

      {/* Session Package Section */}
      <div className="space-y-6 border-t pt-6">
        <h3 className="font-semibold text-gray-900 flex items-center gap-2">
          <Package className="w-5 h-5 text-purple-600" />
          Forfait multiple séances
        </h3>

        <div className="space-y-4">
          {/* Has Many Sessions Checkbox */}
          <div className="flex items-center space-x-3">
            <Checkbox
              id="has_many_session"
              checked={has_many_session}
              onCheckedChange={(checked) => setValue('has_many_session', checked === true)}
            />
            <div className="flex-1">
              <Label htmlFor="has_many_session" className="cursor-pointer font-medium">
                Ce service est vendu en forfait (cure/pack)
              </Label>
              <p className="text-sm text-gray-600">
                Activez cette option pour les services vendus en plusieurs séances
              </p>
            </div>
          </div>

          {/* Number of Sessions */}
          {has_many_session && (
            <div className="ml-7 space-y-4">
              <div className="space-y-2">
                <Label htmlFor="number_of_session" className="required">
                  Nombre de séances dans le forfait
                </Label>
                <Input
                  id="number_of_session"
                  type="number"
                  min="2"
                  max="50"
                  step="1"
                  placeholder="3"
                  {...register('number_of_session', { valueAsNumber: true })}
                  className={errors.number_of_session ? 'border-red-500' : ''}
                />
                {errors.number_of_session && (
                  <p className="text-sm text-red-600 flex items-center gap-1">
                    <AlertCircle className="w-4 h-4" />
                    {errors.number_of_session.message}
                  </p>
                )}
                <p className="text-xs text-gray-500">
                  Minimum 2 séances pour un forfait
                </p>
              </div>

              {/* Price per session calculation */}
              {pricePerSession && (
                <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-purple-900">
                        Prix par séance
                      </p>
                      <p className="text-xs text-purple-700 mt-0.5">
                        {base_price.toFixed(2)}€ ÷ {number_of_session} séances
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-2xl font-bold text-purple-700">
                        {pricePerSession}€
                      </p>
                      <p className="text-xs text-purple-600">par séance</p>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Summary Card */}
      <div className="bg-gradient-to-br from-gray-50 to-gray-100 border border-gray-200 rounded-lg p-6">
        <h4 className="font-semibold text-gray-900 mb-4">Résumé</h4>
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div>
            <p className="text-gray-600">Prix de vente</p>
            <p className="font-bold text-gray-900">
              {base_price?.toFixed(2) || '0.00'}€
            </p>
          </div>
          <div>
            <p className="text-gray-600">Durée</p>
            <p className="font-bold text-gray-900">
              {base_duration_minutes || 0} min
              {base_duration_minutes >= 60 && ` (${(base_duration_minutes / 60).toFixed(1)}h)`}
            </p>
          </div>
          {margin && (
            <div>
              <p className="text-gray-600">Marge</p>
              <p className="font-bold text-green-700">{margin}%</p>
            </div>
          )}
          {pricePerMinute && (
            <div>
              <p className="text-gray-600">Prix/minute</p>
              <p className="font-bold text-gray-900">{pricePerMinute}€</p>
            </div>
          )}
          {has_many_session && (
            <>
              <div>
                <p className="text-gray-600">Type</p>
                <p className="font-bold text-purple-700">Forfait {number_of_session} séances</p>
              </div>
              {pricePerSession && (
                <div>
                  <p className="text-gray-600">Prix/séance</p>
                  <p className="font-bold text-purple-700">{pricePerSession}€</p>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  )
}
