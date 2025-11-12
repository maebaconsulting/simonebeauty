'use client';

/**
 * Create Market Page
 * Feature: 018-international-market-segmentation
 * User Story 1: Market Configuration (T025-T031)
 *
 * Form to create a new geographic market
 */

import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useCreateMarket } from '@/hooks/useMarkets';
import { createMarketSchema, type CreateMarketInput } from '@/lib/validations/market-schemas';
import {
  SUPPORTED_CURRENCIES,
  SUPPORTED_TIMEZONES,
  SUPPORTED_LANGUAGE_CODES,
} from '@/types/market';
import { Button } from '@/components/ui/button';
import { Globe, ArrowLeft, Save } from 'lucide-react';
import Link from 'next/link';
import { toast } from 'sonner';
import { useState } from 'react';

export default function CreateMarketPage() {
  const router = useRouter();
  const createMarket = useCreateMarket();
  const [selectedLanguages, setSelectedLanguages] = useState<string[]>(['fr']);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    setValue,
    watch,
  } = useForm<CreateMarketInput>({
    resolver: zodResolver(createMarketSchema),
    defaultValues: {
      name: '',
      code: '',
      currency_code: 'EUR',
      timezone: 'Europe/Paris',
      supported_languages: ['fr'],
      is_active: true,
    },
  });

  const onSubmit = async (data: CreateMarketInput) => {
    try {
      const result = await createMarket.mutateAsync(data);

      toast.success('Marché créé avec succès!', {
        description: `Le marché "${result.name}" (${result.code}) a été créé.`,
      });

      router.push('/admin/markets');
    } catch (error: any) {
      console.error('Error creating market:', error);
      toast.error('Erreur lors de la création', {
        description: error.message || 'Une erreur est survenue lors de la création du marché.',
      });
    }
  };

  const handleCancel = () => {
    if (confirm('Voulez-vous vraiment annuler ? Toutes les modifications seront perdues.')) {
      router.push('/admin/markets');
    }
  };

  const handleLanguageToggle = (langCode: string) => {
    const newLanguages = selectedLanguages.includes(langCode)
      ? selectedLanguages.filter((l) => l !== langCode)
      : [...selectedLanguages, langCode];

    setSelectedLanguages(newLanguages);
    setValue('supported_languages', newLanguages as any, { shouldValidate: true });
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center gap-4">
            <Link href="/admin/markets">
              <Button variant="outline" size="sm">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Retour
              </Button>
            </Link>
            <div>
              <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
                <Globe className="h-6 w-6" />
                Créer un nouveau marché
              </h1>
              <p className="mt-1 text-sm text-gray-600">
                Configurer un nouveau marché géographique pour la plateforme
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Form */}
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <form onSubmit={handleSubmit(onSubmit)} className="bg-white rounded-lg shadow-sm p-6 space-y-6">
          {/* Name */}
          <div>
            <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-2">
              Nom du marché <span className="text-red-500">*</span>
            </label>
            <input
              id="name"
              type="text"
              {...register('name')}
              placeholder="Ex: France, Belgique, Suisse..."
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
            />
            {errors.name && (
              <p className="mt-1 text-sm text-red-600">{errors.name.message}</p>
            )}
          </div>

          {/* Code */}
          <div>
            <label htmlFor="code" className="block text-sm font-medium text-gray-700 mb-2">
              Code du marché (ISO 3166-1 alpha-2) <span className="text-red-500">*</span>
            </label>
            <input
              id="code"
              type="text"
              {...register('code')}
              placeholder="Ex: FR, BE, CH, ES, DE..."
              maxLength={3}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 uppercase"
            />
            {errors.code && (
              <p className="mt-1 text-sm text-red-600">{errors.code.message}</p>
            )}
            <p className="mt-1 text-sm text-gray-500">
              Format: 2-3 lettres majuscules (FR, BE, CH, etc.)
            </p>
          </div>

          {/* Currency */}
          <div>
            <label htmlFor="currency_code" className="block text-sm font-medium text-gray-700 mb-2">
              Devise (ISO 4217) <span className="text-red-500">*</span>
            </label>
            <select
              id="currency_code"
              {...register('currency_code')}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
            >
              {SUPPORTED_CURRENCIES.map((currency) => (
                <option key={currency} value={currency}>
                  {currency}
                </option>
              ))}
            </select>
            {errors.currency_code && (
              <p className="mt-1 text-sm text-red-600">{errors.currency_code.message}</p>
            )}
          </div>

          {/* Timezone */}
          <div>
            <label htmlFor="timezone" className="block text-sm font-medium text-gray-700 mb-2">
              Fuseau horaire (IANA) <span className="text-red-500">*</span>
            </label>
            <select
              id="timezone"
              {...register('timezone')}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
            >
              {SUPPORTED_TIMEZONES.map((timezone) => (
                <option key={timezone} value={timezone}>
                  {timezone}
                </option>
              ))}
            </select>
            {errors.timezone && (
              <p className="mt-1 text-sm text-red-600">{errors.timezone.message}</p>
            )}
          </div>

          {/* Supported Languages */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Langues supportées <span className="text-red-500">*</span>
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              {SUPPORTED_LANGUAGE_CODES.map((langCode) => {
                const languageNames: Record<string, string> = {
                  fr: 'Français',
                  en: 'English',
                  de: 'Deutsch',
                  nl: 'Nederlands',
                  it: 'Italiano',
                  es: 'Español',
                };

                const isSelected = selectedLanguages.includes(langCode);

                return (
                  <button
                    key={langCode}
                    type="button"
                    onClick={() => handleLanguageToggle(langCode)}
                    className={`px-4 py-3 rounded-lg border-2 transition-all text-sm font-medium ${
                      isSelected
                        ? 'border-purple-500 bg-purple-50 text-purple-700'
                        : 'border-gray-200 bg-white text-gray-700 hover:border-gray-300'
                    }`}
                  >
                    <div className="flex items-center justify-center gap-2">
                      <span className="text-lg">{langCode.toUpperCase()}</span>
                    </div>
                    <div className="text-xs mt-1">{languageNames[langCode]}</div>
                  </button>
                );
              })}
            </div>
            {errors.supported_languages && (
              <p className="mt-2 text-sm text-red-600">{errors.supported_languages.message}</p>
            )}
            <p className="mt-2 text-sm text-gray-500">
              Sélectionnez au moins une langue. Les utilisateurs pourront utiliser la plateforme dans ces langues.
            </p>
          </div>

          {/* Is Active */}
          <div className="flex items-center gap-3">
            <input
              id="is_active"
              type="checkbox"
              {...register('is_active')}
              className="h-4 w-4 text-purple-600 focus:ring-purple-500 border-gray-300 rounded"
            />
            <label htmlFor="is_active" className="text-sm font-medium text-gray-700">
              Marché actif
            </label>
          </div>
          <p className="text-sm text-gray-500 ml-7">
            Un marché inactif ne sera pas visible par les utilisateurs et les prestataires
          </p>

          {/* Actions */}
          <div className="flex items-center gap-3 pt-6 border-t border-gray-200">
            <Button
              type="submit"
              disabled={isSubmitting || createMarket.isPending}
              className="flex-1"
            >
              {isSubmitting || createMarket.isPending ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" />
                  Création en cours...
                </>
              ) : (
                <>
                  <Save className="h-4 w-4 mr-2" />
                  Créer le marché
                </>
              )}
            </Button>
            <Button
              type="button"
              variant="outline"
              onClick={handleCancel}
              disabled={isSubmitting || createMarket.isPending}
            >
              Annuler
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
