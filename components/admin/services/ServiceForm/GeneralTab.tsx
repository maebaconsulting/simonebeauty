'use client'

/**
 * General Tab Component
 * Feature: 018-service-management-crud
 *
 * First tab of service form containing basic service information
 * Fields: name, slug, description, intro, short_description, long_description,
 *         is_active, is_featured, display_order
 */

import { UseFormReturn } from 'react-hook-form'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { Checkbox } from '@/components/ui/checkbox'
import { AlertCircle, Info, Sparkles } from 'lucide-react'
import { ServiceInsertData } from '@/lib/validations/service-schemas'

// ============================================================================
// Types
// ============================================================================

interface GeneralTabProps {
  form: UseFormReturn<ServiceInsertData>
  mode: 'create' | 'edit'
}

// ============================================================================
// Component
// ============================================================================

export default function GeneralTab({ form, mode }: GeneralTabProps) {
  const {
    register,
    formState: { errors },
    watch,
    setValue,
  } = form

  const name = watch('name')
  const is_active = watch('is_active')
  const is_featured = watch('is_featured')

  // Auto-generate slug from name (only in create mode)
  const handleNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newName = e.target.value
    if (mode === 'create') {
      const slug = newName
        .toLowerCase()
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .replace(/[^a-z0-9\s-]/g, '')
        .trim()
        .replace(/\s+/g, '-')
        .replace(/-+/g, '-')
      setValue('slug', slug)
    }
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h2 className="text-xl font-bold text-gray-900 mb-2">
          Informations générales
        </h2>
        <p className="text-gray-600">
          Définissez les informations de base de votre service
        </p>
      </div>

      {/* Name & Slug */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="space-y-2">
          <Label htmlFor="name" className="required">
            Nom du service
          </Label>
          <Input
            id="name"
            placeholder="Ex: Massage Suédois"
            {...register('name')}
            onChange={(e) => {
              register('name').onChange(e)
              handleNameChange(e)
            }}
            className={errors.name ? 'border-red-500' : ''}
          />
          {errors.name && (
            <p className="text-sm text-red-600 flex items-center gap-1">
              <AlertCircle className="w-4 h-4" />
              {errors.name.message}
            </p>
          )}
          <p className="text-xs text-gray-500">
            Le nom sera affiché dans le catalogue et sur les fiches détaillées
          </p>
        </div>

        <div className="space-y-2">
          <Label htmlFor="slug">
            URL (slug)
            {mode === 'create' && (
              <span className="ml-2 text-xs text-gray-500">(auto-généré)</span>
            )}
          </Label>
          <Input
            id="slug"
            placeholder="massage-suedois"
            {...register('slug')}
            disabled={mode === 'create'}
            className={errors.slug ? 'border-red-500' : ''}
          />
          {errors.slug && (
            <p className="text-sm text-red-600 flex items-center gap-1">
              <AlertCircle className="w-4 h-4" />
              {errors.slug.message}
            </p>
          )}
          <p className="text-xs text-gray-500">
            URL: /services/{watch('slug') || 'votre-service'}
          </p>
        </div>
      </div>

      {/* Description (required) */}
      <div className="space-y-2">
        <Label htmlFor="description" className="required">
          Description
        </Label>
        <Textarea
          id="description"
          placeholder="Description complète du service (affichée sur la page du service)"
          rows={4}
          {...register('description')}
          className={errors.description ? 'border-red-500' : ''}
        />
        {errors.description && (
          <p className="text-sm text-red-600 flex items-center gap-1">
            <AlertCircle className="w-4 h-4" />
            {errors.description.message}
          </p>
        )}
        <p className="text-xs text-gray-500">
          {watch('description')?.length || 0} / 5000 caractères
        </p>
      </div>

      {/* Intro (optional) */}
      <div className="space-y-2">
        <Label htmlFor="intro">
          Introduction courte
          <span className="ml-2 text-xs text-gray-500">(optionnel)</span>
        </Label>
        <Textarea
          id="intro"
          placeholder="1-2 phrases d'accroche pour les aperçus rapides"
          rows={2}
          {...register('intro')}
          className={errors.intro ? 'border-red-500' : ''}
        />
        {errors.intro && (
          <p className="text-sm text-red-600 flex items-center gap-1">
            <AlertCircle className="w-4 h-4" />
            {errors.intro.message}
          </p>
        )}
        <p className="text-xs text-gray-500">
          {watch('intro')?.length || 0} / 500 caractères
        </p>
      </div>

      {/* Short Description (optional) */}
      <div className="space-y-2">
        <Label htmlFor="short_description">
          Description courte
          <span className="ml-2 text-xs text-gray-500">(optionnel)</span>
        </Label>
        <Textarea
          id="short_description"
          placeholder="Résumé court pour les cartes de services"
          rows={3}
          {...register('short_description')}
          className={errors.short_description ? 'border-red-500' : ''}
        />
        {errors.short_description && (
          <p className="text-sm text-red-600 flex items-center gap-1">
            <AlertCircle className="w-4 h-4" />
            {errors.short_description.message}
          </p>
        )}
        <p className="text-xs text-gray-500">
          {watch('short_description')?.length || 0} / 500 caractères
        </p>
      </div>

      {/* Long Description (optional) */}
      <div className="space-y-2">
        <Label htmlFor="long_description">
          Description détaillée
          <span className="ml-2 text-xs text-gray-500">(optionnel)</span>
        </Label>
        <Textarea
          id="long_description"
          placeholder="Description complète et détaillée avec tous les détails du service"
          rows={8}
          {...register('long_description')}
          className={errors.long_description ? 'border-red-500' : ''}
        />
        {errors.long_description && (
          <p className="text-sm text-red-600 flex items-center gap-1">
            <AlertCircle className="w-4 h-4" />
            {errors.long_description.message}
          </p>
        )}
        <p className="text-xs text-gray-500 flex items-center justify-between">
          <span>{watch('long_description')?.length || 0} / 10000 caractères</span>
          <span className="flex items-center gap-1">
            <Info className="w-3 h-3" />
            Utilisé pour la page détaillée du service
          </span>
        </p>
      </div>

      {/* Status & Display Options */}
      <div className="border-t pt-6 space-y-4">
        <h3 className="font-semibold text-gray-900">
          État et affichage
        </h3>

        <div className="space-y-4">
          {/* Active Status */}
          <div className="flex items-center space-x-3">
            <Checkbox
              id="is_active"
              checked={is_active}
              onCheckedChange={(checked) => setValue('is_active', checked === true)}
            />
            <div className="flex-1">
              <Label htmlFor="is_active" className="cursor-pointer font-medium">
                Service actif
              </Label>
              <p className="text-sm text-gray-600">
                Le service sera visible dans le catalogue et réservable par les clients
              </p>
            </div>
          </div>

          {/* Featured Status */}
          <div className="flex items-center space-x-3">
            <Checkbox
              id="is_featured"
              checked={is_featured}
              onCheckedChange={(checked) => setValue('is_featured', checked === true)}
            />
            <div className="flex-1">
              <Label htmlFor="is_featured" className="cursor-pointer font-medium flex items-center gap-2">
                Service mis en avant
                <Sparkles className="w-4 h-4 text-yellow-500" />
              </Label>
              <p className="text-sm text-gray-600">
                Le service apparaîtra en premier dans les listes et recommandations
              </p>
            </div>
          </div>

          {/* Display Order */}
          <div className="space-y-2">
            <Label htmlFor="display_order">
              Ordre d'affichage
            </Label>
            <Input
              id="display_order"
              type="number"
              min="0"
              step="1"
              placeholder="0"
              {...register('display_order', { valueAsNumber: true })}
              className={errors.display_order ? 'border-red-500' : ''}
            />
            {errors.display_order && (
              <p className="text-sm text-red-600 flex items-center gap-1">
                <AlertCircle className="w-4 h-4" />
                {errors.display_order.message}
              </p>
            )}
            <p className="text-xs text-gray-500">
              Les services avec un ordre plus petit seront affichés en premier (0 = premier)
            </p>
          </div>
        </div>
      </div>

      {/* Info Banner */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <div className="flex items-start gap-3">
          <Info className="w-5 h-5 text-blue-600 mt-0.5 flex-shrink-0" />
          <div className="text-sm text-blue-900">
            <p className="font-medium mb-1">Conseils de rédaction</p>
            <ul className="space-y-1 text-blue-800">
              <li>• Utilisez un nom clair et descriptif</li>
              <li>• La description doit expliquer les bénéfices du service</li>
              <li>• L'intro courte est idéale pour capter l'attention rapidement</li>
              <li>• Utilisez la description détaillée pour tous les détails techniques</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  )
}
