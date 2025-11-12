'use client';

/**
 * Admin Contractor Detail Page
 * Feature: 018-international-market-segmentation
 * Task: T049 - Add contractor_code display to contractor detail page
 *
 * Displays detailed information about a specific contractor including their unique code
 * and market assignment.
 */

import { useQuery } from '@tanstack/react-query';
import { CodeHeader } from '@/components/admin/CodeDisplay';
import { Button } from '@/components/ui/button';
import {
  ArrowLeft,
  Building2,
  Phone,
  Mail,
  MapPin,
  Calendar,
  Briefcase,
  Globe,
} from 'lucide-react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';

export default function AdminContractorDetailPage() {
  const params = useParams();
  const router = useRouter();
  const contractorId = params.id as string;

  // Fetch contractor details with market info
  const { data: contractor, isLoading, error } = useQuery({
    queryKey: ['admin', 'contractor', contractorId],
    queryFn: async () => {
      const supabase = createClient();

      const { data, error } = await supabase
        .from('contractors')
        .select(
          `
          *,
          market:markets (
            id,
            name,
            code,
            currency_code,
            timezone,
            supported_languages
          )
        `
        )
        .eq('id', contractorId)
        .single();

      if (error) throw error;
      return data;
    },
  });

  // Fetch contractor bookings
  const { data: bookings } = useQuery({
    queryKey: ['admin', 'contractor', contractorId, 'bookings'],
    queryFn: async () => {
      const supabase = createClient();

      const { data, error } = await supabase
        .from('appointment_bookings')
        .select(
          `
          *,
          service:services (
            name,
            category
          ),
          client:profiles (
            first_name,
            last_name,
            client_code
          )
        `
        )
        .eq('contractor_id', contractorId)
        .order('scheduled_datetime', { ascending: false });

      if (error) throw error;
      return data;
    },
    enabled: !!contractorId,
  });

  // Fetch contractor services
  const { data: services } = useQuery({
    queryKey: ['admin', 'contractor', contractorId, 'services'],
    queryFn: async () => {
      const supabase = createClient();

      const { data, error } = await supabase
        .from('contractor_services')
        .select(
          `
          *,
          service:services (
            name,
            category
          )
        `
        )
        .eq('contractor_id', contractorId);

      if (error) throw error;
      return data;
    },
    enabled: !!contractorId,
  });

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
          <p className="mt-4 text-gray-600">Chargement du prestataire...</p>
        </div>
      </div>
    );
  }

  if (error || !contractor) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <p className="text-red-600">Prestataire introuvable</p>
          <Button onClick={() => router.back()} className="mt-4" variant="outline">
            Retour
          </Button>
        </div>
      </div>
    );
  }

  const upcomingBookings = bookings?.filter(
    (b: any) =>
      b.status === 'confirmed' && new Date(b.scheduled_datetime) > new Date()
  );

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-start justify-between">
            <div className="flex items-start gap-4">
              <Button
                variant="outline"
                size="sm"
                onClick={() => router.push('/admin/contractors')}
              >
                <ArrowLeft className="h-4 w-4" />
              </Button>
              <div>
                <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
                  <Building2 className="h-6 w-6" />
                  {contractor.business_name}
                </h1>
                {contractor.professional_title && (
                  <p className="mt-1 text-sm text-gray-600">
                    {contractor.professional_title}
                  </p>
                )}
                <div className="mt-3">
                  <CodeHeader
                    code={contractor.contractor_code}
                    type="contractor"
                    label="Code Prestataire"
                  />
                </div>
              </div>
            </div>

            <div className="flex flex-col gap-2">
              <span
                className={`px-3 py-1 text-sm font-medium rounded-full text-center ${
                  contractor.is_active
                    ? 'bg-green-100 text-green-800'
                    : 'bg-red-100 text-red-800'
                }`}
              >
                {contractor.is_active ? 'Actif' : 'Inactif'}
              </span>
              {contractor.market && (
                <span className="px-3 py-1 text-sm font-medium bg-blue-100 text-blue-800 rounded-full text-center">
                  {contractor.market.name}
                </span>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Column - Contractor Info */}
          <div className="lg:col-span-1 space-y-6">
            {/* Contact Information */}
            <div className="bg-white rounded-lg shadow p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">
                Informations de contact
              </h2>
              <div className="space-y-3">
                {contractor.phone && (
                  <div className="flex items-center gap-3 text-sm">
                    <Phone className="h-4 w-4 text-gray-400" />
                    <span className="text-gray-600">{contractor.phone}</span>
                  </div>
                )}
                {contractor.email && (
                  <div className="flex items-center gap-3 text-sm">
                    <Mail className="h-4 w-4 text-gray-400" />
                    <span className="text-gray-600">{contractor.email}</span>
                  </div>
                )}
                <div className="flex items-center gap-3 text-sm">
                  <Calendar className="h-4 w-4 text-gray-400" />
                  <span className="text-gray-600">
                    Inscrit le{' '}
                    {new Date(contractor.created_at).toLocaleDateString('fr-FR')}
                  </span>
                </div>
              </div>
            </div>

            {/* Market Information */}
            {contractor.market && (
              <div className="bg-white rounded-lg shadow p-6">
                <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                  <Globe className="h-5 w-5" />
                  Marché assigné
                </h2>
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">Nom</span>
                    <span className="text-sm font-medium text-gray-900">
                      {contractor.market.name}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">Code</span>
                    <span className="text-sm font-medium text-gray-900">
                      {contractor.market.code}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">Devise</span>
                    <span className="text-sm font-medium text-gray-900">
                      {contractor.market.currency_code}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">Fuseau horaire</span>
                    <span className="text-sm font-medium text-gray-900">
                      {contractor.market.timezone}
                    </span>
                  </div>
                </div>
              </div>
            )}

            {/* Statistics */}
            <div className="bg-white rounded-lg shadow p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">
                Statistiques
              </h2>
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">Services</span>
                  <span className="text-lg font-semibold text-gray-900">
                    {services?.filter((s: any) => s.is_active).length || 0}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">Réservations totales</span>
                  <span className="text-lg font-semibold text-gray-900">
                    {bookings?.length || 0}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">Réservations à venir</span>
                  <span className="text-lg font-semibold text-green-600">
                    {upcomingBookings?.length || 0}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Right Column - Bookings & Services */}
          <div className="lg:col-span-2 space-y-6">
            {/* Recent Bookings */}
            <div className="bg-white rounded-lg shadow">
              <div className="px-6 py-4 border-b border-gray-200">
                <h2 className="text-lg font-semibold text-gray-900">
                  Réservations récentes ({bookings?.length || 0})
                </h2>
              </div>
              <div className="p-6">
                {!bookings || bookings.length === 0 ? (
                  <p className="text-gray-600 text-center py-8">
                    Aucune réservation
                  </p>
                ) : (
                  <div className="space-y-3">
                    {bookings.slice(0, 10).map((booking: any) => (
                      <div
                        key={booking.id}
                        className="border border-gray-200 rounded-lg p-4 hover:border-purple-300 transition-colors"
                      >
                        <div className="flex items-start justify-between">
                          <div>
                            <p className="font-medium text-gray-900">
                              {booking.service?.name || 'Service inconnu'}
                            </p>
                            <p className="text-sm text-gray-600 mt-1">
                              Client:{' '}
                              {booking.client
                                ? `${booking.client.first_name} ${booking.client.last_name} (${booking.client.client_code})`
                                : 'Non assigné'}
                            </p>
                            <p className="text-xs text-gray-500 mt-1">
                              {new Date(
                                booking.scheduled_datetime
                              ).toLocaleString('fr-FR')}
                            </p>
                          </div>
                          <span
                            className={`px-2 py-1 text-xs font-medium rounded-full ${
                              booking.status === 'confirmed'
                                ? 'bg-green-100 text-green-800'
                                : booking.status === 'pending'
                                  ? 'bg-yellow-100 text-yellow-800'
                                  : booking.status === 'completed'
                                    ? 'bg-blue-100 text-blue-800'
                                    : 'bg-gray-100 text-gray-800'
                            }`}
                          >
                            {booking.status}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Services */}
            <div className="bg-white rounded-lg shadow">
              <div className="px-6 py-4 border-b border-gray-200">
                <h2 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                  <Briefcase className="h-5 w-5" />
                  Services proposés ({services?.length || 0})
                </h2>
              </div>
              <div className="p-6">
                {!services || services.length === 0 ? (
                  <p className="text-gray-600 text-center py-8">
                    Aucun service proposé
                  </p>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {services.map((contractorService: any) => (
                      <div
                        key={contractorService.id}
                        className="border border-gray-200 rounded-lg p-4"
                      >
                        <div className="flex items-start justify-between">
                          <div>
                            <p className="font-medium text-gray-900">
                              {contractorService.service?.name || 'Service inconnu'}
                            </p>
                            {contractorService.service?.category && (
                              <p className="text-xs text-gray-500 mt-1">
                                {contractorService.service.category}
                              </p>
                            )}
                          </div>
                          <span
                            className={`px-2 py-1 text-xs font-medium rounded-full ${
                              contractorService.is_active
                                ? 'bg-green-100 text-green-800'
                                : 'bg-gray-100 text-gray-800'
                            }`}
                          >
                            {contractorService.is_active ? 'Actif' : 'Inactif'}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
