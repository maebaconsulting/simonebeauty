/**
 * PromoCodeForm Component
 * Feature: 015-promo-codes-system
 *
 * Shared form for creating and editing promo codes
 */

'use client'

import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { promoCodeFormSchema, type PromoCodeFormData } from '@/types/promo-form'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Checkbox } from '@/components/ui/checkbox'
import { Loader2 } from 'lucide-react'
import { Label } from '@/components/ui/label'
import type { PromoCode } from '@/types/promo-code'
import { useMarkets } from '@/hooks/useMarkets'

interface PromoCodeFormProps {
  initialData?: PromoCode
  onSubmit: (data: PromoCodeFormData) => Promise<void>
  isSubmitting: boolean
}

export function PromoCodeForm({
  initialData,
  onSubmit,
  isSubmitting,
}: PromoCodeFormProps) {
  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors },
  } = useForm<PromoCodeFormData>({
    resolver: zodResolver(promoCodeFormSchema),
    defaultValues: initialData
      ? {
          code: initialData.code,
          description: initialData.description || '',
          discount_type: initialData.discount_type,
          // Convert discount_value from cents to euros if fixed_amount
          discount_value: initialData.discount_type === 'fixed_amount'
            ? initialData.discount_value / 100
            : initialData.discount_value,
          // Convert max_discount_amount from cents to euros
          max_discount_amount: initialData.max_discount_amount
            ? initialData.max_discount_amount / 100
            : undefined,
          max_uses: initialData.max_uses || undefined,
          max_uses_per_user: initialData.max_uses_per_user,
          valid_from: new Date(initialData.valid_from),
          valid_until: initialData.valid_until
            ? new Date(initialData.valid_until)
            : undefined,
          // Convert min_order_amount from cents to euros
          min_order_amount: initialData.min_order_amount
            ? initialData.min_order_amount / 100
            : undefined,
          first_booking_only: initialData.first_booking_only,
          specific_services: initialData.specific_services || undefined,
          specific_categories: initialData.specific_categories || undefined,
          specific_markets: initialData.specific_markets || undefined,
          is_active: initialData.is_active,
        }
      : {
          discount_type: 'percentage',
          discount_value: 10,
          max_uses_per_user: 1,
          valid_from: new Date(),
          first_booking_only: false,
          is_active: true,
        },
  })

  const discountType = watch('discount_type')
  const firstBookingOnly = watch('first_booking_only')
  const isActive = watch('is_active')
  const specificMarkets = watch('specific_markets')

  // Fetch all active markets
  const { data: marketsData } = useMarkets({
    is_active: true,
    limit: 100,
  })
  const markets = marketsData?.data || []

  const handleFormSubmit = async (data: PromoCodeFormData) => {
    await onSubmit(data)
  }

  return (
    <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-8">
      {/* Code Information Section */}
      <div className="bg-white p-6 rounded-lg shadow-sm border">
        <h3 className="text-lg font-semibold mb-4">Informations du code</h3>

        <div className="space-y-4">
          <div>
            <Label htmlFor="code">
              Code promotionnel <span className="text-red-500">*</span>
            </Label>
            <Input
              id="code"
              {...register('code')}
              placeholder="BIENVENUE20"
              className="uppercase"
              disabled={!!initialData} // Can't change code after creation
            />
            {errors.code && (
              <p className="text-sm text-red-600 mt-1">{errors.code.message}</p>
            )}
            <p className="text-sm text-gray-500 mt-1">
              Lettres majuscules, chiffres, tirets et underscores uniquement
            </p>
          </div>

          <div>
            <Label htmlFor="description">Description (optionnelle)</Label>
            <Textarea
              id="description"
              {...register('description')}
              placeholder="Description du code promo pour usage interne..."
              rows={3}
            />
            {errors.description && (
              <p className="text-sm text-red-600 mt-1">
                {errors.description.message}
              </p>
            )}
          </div>
        </div>
      </div>

      {/* Discount Configuration Section */}
      <div className="bg-white p-6 rounded-lg shadow-sm border">
        <h3 className="text-lg font-semibold mb-4">Configuration de la remise</h3>

        <div className="space-y-4">
          <div>
            <Label htmlFor="discount_type">
              Type de remise <span className="text-red-500">*</span>
            </Label>
            <select
              id="discount_type"
              {...register('discount_type')}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
            >
              <option value="percentage">Pourcentage (%)</option>
              <option value="fixed_amount">Montant fixe (€)</option>
            </select>
            {errors.discount_type && (
              <p className="text-sm text-red-600 mt-1">
                {errors.discount_type.message}
              </p>
            )}
          </div>

          <div>
            <Label htmlFor="discount_value">
              Valeur de la remise <span className="text-red-500">*</span>
            </Label>
            <div className="relative">
              <Input
                id="discount_value"
                type="number"
                step={discountType === 'percentage' ? '1' : '0.01'}
                {...register('discount_value', { valueAsNumber: true })}
                placeholder={discountType === 'percentage' ? '10' : '5.00'}
              />
              <span className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500">
                {discountType === 'percentage' ? '%' : '€'}
              </span>
            </div>
            {errors.discount_value && (
              <p className="text-sm text-red-600 mt-1">
                {errors.discount_value.message}
              </p>
            )}
            {discountType === 'fixed_amount' && (
              <p className="text-sm text-gray-500 mt-1">Montant en euros</p>
            )}
          </div>

          {discountType === 'percentage' && (
            <div>
              <Label htmlFor="max_discount_amount">
                Montant maximum de remise (optionnel)
              </Label>
              <Input
                id="max_discount_amount"
                type="number"
                step="0.01"
                {...register('max_discount_amount', { valueAsNumber: true })}
                placeholder="50.00"
              />
              {errors.max_discount_amount && (
                <p className="text-sm text-red-600 mt-1">
                  {errors.max_discount_amount.message}
                </p>
              )}
              <p className="text-sm text-gray-500 mt-1">
                Limite de remise en euros pour les pourcentages
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Usage Limits Section */}
      <div className="bg-white p-6 rounded-lg shadow-sm border">
        <h3 className="text-lg font-semibold mb-4">Limites d'utilisation</h3>

        <div className="space-y-4">
          <div>
            <Label htmlFor="max_uses">Utilisations maximum (optionnel)</Label>
            <Input
              id="max_uses"
              type="number"
              {...register('max_uses', { valueAsNumber: true })}
              placeholder="Illimité"
            />
            {errors.max_uses && (
              <p className="text-sm text-red-600 mt-1">
                {errors.max_uses.message}
              </p>
            )}
            <p className="text-sm text-gray-500 mt-1">
              Nombre total d'utilisations autorisées. Laissez vide pour illimité.
            </p>
          </div>

          <div>
            <Label htmlFor="max_uses_per_user">
              Utilisations par utilisateur <span className="text-red-500">*</span>
            </Label>
            <Input
              id="max_uses_per_user"
              type="number"
              {...register('max_uses_per_user', { valueAsNumber: true })}
              placeholder="1"
            />
            {errors.max_uses_per_user && (
              <p className="text-sm text-red-600 mt-1">
                {errors.max_uses_per_user.message}
              </p>
            )}
          </div>
        </div>
      </div>

      {/* Validity Period Section */}
      <div className="bg-white p-6 rounded-lg shadow-sm border">
        <h3 className="text-lg font-semibold mb-4">Période de validité</h3>

        <div className="space-y-4">
          <div>
            <Label htmlFor="valid_from">
              Date de début <span className="text-red-500">*</span>
            </Label>
            <Input
              id="valid_from"
              type="datetime-local"
              {...register('valid_from', { valueAsDate: true })}
            />
            {errors.valid_from && (
              <p className="text-sm text-red-600 mt-1">
                {errors.valid_from.message}
              </p>
            )}
          </div>

          <div>
            <Label htmlFor="valid_until">Date de fin (optionnelle)</Label>
            <Input
              id="valid_until"
              type="datetime-local"
              {...register('valid_until', { valueAsDate: true })}
            />
            {errors.valid_until && (
              <p className="text-sm text-red-600 mt-1">
                {errors.valid_until.message}
              </p>
            )}
            <p className="text-sm text-gray-500 mt-1">
              Laissez vide pour une validité illimitée
            </p>
          </div>
        </div>
      </div>

      {/* Restrictions Section */}
      <div className="bg-white p-6 rounded-lg shadow-sm border">
        <h3 className="text-lg font-semibold mb-4">Restrictions</h3>

        <div className="space-y-4">
          <div>
            <Label htmlFor="min_order_amount">
              Montant minimum de commande (optionnel)
            </Label>
            <Input
              id="min_order_amount"
              type="number"
              step="0.01"
              {...register('min_order_amount', { valueAsNumber: true })}
              placeholder="0.00"
            />
            {errors.min_order_amount && (
              <p className="text-sm text-red-600 mt-1">
                {errors.min_order_amount.message}
              </p>
            )}
            <p className="text-sm text-gray-500 mt-1">Montant en euros</p>
          </div>

          <div className="flex items-center space-x-2">
            <Checkbox
              id="first_booking_only"
              checked={firstBookingOnly}
              onCheckedChange={(checked) =>
                setValue('first_booking_only', checked as boolean)
              }
            />
            <Label htmlFor="first_booking_only" className="cursor-pointer">
              Réservé aux premières réservations uniquement
            </Label>
          </div>

          <div>
            <Label className="mb-3 block">
              Marchés autorisés (optionnel)
            </Label>
            <p className="text-sm text-gray-500 mb-3">
              Laissez tout décoché pour appliquer à tous les marchés
            </p>
            <div className="space-y-2 max-h-48 overflow-y-auto border rounded-lg p-3">
              {markets.map((market) => {
                const isChecked = specificMarkets?.includes(market.id) || false
                return (
                  <div key={market.id} className="flex items-center space-x-2">
                    <Checkbox
                      id={`market-${market.id}`}
                      checked={isChecked}
                      onCheckedChange={(checked) => {
                        const currentMarkets = specificMarkets || []
                        if (checked) {
                          setValue('specific_markets', [...currentMarkets, market.id])
                        } else {
                          setValue(
                            'specific_markets',
                            currentMarkets.filter((id) => id !== market.id)
                          )
                        }
                      }}
                    />
                    <Label
                      htmlFor={`market-${market.id}`}
                      className="cursor-pointer flex items-center gap-2"
                    >
                      <span className="font-medium">{market.name}</span>
                      <span className="text-xs text-gray-500">({market.code})</span>
                      <span className="text-xs text-gray-400">{market.currency_code}</span>
                    </Label>
                  </div>
                )
              })}
            </div>
          </div>

          <div>
            <p className="text-sm text-gray-500 italic">
              Note: Les restrictions par services et catégories spécifiques seront
              ajoutées dans une future version.
            </p>
          </div>
        </div>
      </div>

      {/* Status Section */}
      <div className="bg-white p-6 rounded-lg shadow-sm border">
        <h3 className="text-lg font-semibold mb-4">Statut</h3>

        <div className="flex items-center space-x-2">
          <Checkbox
            id="is_active"
            checked={isActive}
            onCheckedChange={(checked) =>
              setValue('is_active', checked as boolean)
            }
          />
          <Label htmlFor="is_active" className="cursor-pointer">
            Code promo actif
          </Label>
        </div>
        <p className="text-sm text-gray-500 mt-2">
          Désactivez pour empêcher l'utilisation sans supprimer le code
        </p>
      </div>

      {/* Submit Button */}
      <div className="flex justify-end gap-4">
        <Button
          type="button"
          variant="outline"
          onClick={() => window.history.back()}
          disabled={isSubmitting}
        >
          Annuler
        </Button>
        <Button
          type="submit"
          disabled={isSubmitting}
          className="bg-[#FF9B8A] hover:bg-[#FF8A76] text-white"
        >
          {isSubmitting ? (
            <>
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              Enregistrement...
            </>
          ) : initialData ? (
            'Mettre à jour'
          ) : (
            'Créer le code promo'
          )}
        </Button>
      </div>
    </form>
  )
}
