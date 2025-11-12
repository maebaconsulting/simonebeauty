'use client';

/**
 * Admin Client Detail Page
 * Feature: 018-international-market-segmentation
 * Task: T048 - Add client_code display to client detail page
 *
 * Displays detailed information about a specific client including their unique code.
 */

import { useQuery } from '@tanstack/react-query';
import { CodeHeader } from '@/components/admin/CodeDisplay';
import { Button } from '@/components/ui/button';
import {
  ArrowLeft,
  User,
  Phone,
  Mail,
  MapPin,
  Calendar,
  CreditCard,
} from 'lucide-react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';

export default function AdminClientDetailPage() {
  const params = useParams();
  const router = useRouter();
  const clientId = params.id as string;

  // Fetch client details
  const { data: client, isLoading, error } = useQuery({
    queryKey: ['admin', 'client', clientId],
    queryFn: async () => {
      const supabase = createClient();

      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', clientId)
        .single();

      if (error) throw error;
      return data;
    },
  });

  // Fetch client bookings
  const { data: bookings } = useQuery({
    queryKey: ['admin', 'client', clientId, 'bookings'],
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
          contractor:contractors (
            business_name
          )
        `
        )
        .eq('client_id', clientId)
        .order('scheduled_datetime', { ascending: false });

      if (error) throw error;
      return data;
    },
    enabled: !!clientId,
  });

  // Fetch client addresses
  const { data: addresses } = useQuery({
    queryKey: ['admin', 'client', clientId, 'addresses'],
    queryFn: async () => {
      const supabase = createClient();

      const { data, error } = await supabase
        .from('client_addresses')
        .select('*')
        .eq('client_id', clientId)
        .order('is_default', { ascending: false });

      if (error) throw error;
      return data;
    },
    enabled: !!clientId,
  });

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
          <p className="mt-4 text-gray-600">Chargement du client...</p>
        </div>
      </div>
    );
  }

  if (error || !client) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <p className="text-red-600">Client introuvable</p>
          <Button onClick={() => router.back()} className="mt-4" variant="outline">
            Retour
          </Button>
        </div>
      </div>
    );
  }

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
                onClick={() => router.push('/admin/clients')}
              >
                <ArrowLeft className="h-4 w-4" />
              </Button>
              <div>
                <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
                  <User className="h-6 w-6" />
                  {client.first_name} {client.last_name}
                </h1>
                <div className="mt-2">
                  <CodeHeader
                    code={client.client_code}
                    type="client"
                    label="Code Client"
                  />
                </div>
              </div>
            </div>

            <div className="flex gap-2">
              <span
                className={`px-3 py-1 text-sm font-medium rounded-full ${
                  client.is_active
                    ? 'bg-green-100 text-green-800'
                    : 'bg-red-100 text-red-800'
                }`}
              >
                {client.is_active ? 'Actif' : 'Inactif'}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Column - Client Info */}
          <div className="lg:col-span-1 space-y-6">
            {/* Contact Information */}
            <div className="bg-white rounded-lg shadow p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">
                Informations de contact
              </h2>
              <div className="space-y-3">
                {client.phone && (
                  <div className="flex items-center gap-3 text-sm">
                    <Phone className="h-4 w-4 text-gray-400" />
                    <span className="text-gray-600">{client.phone}</span>
                  </div>
                )}
                <div className="flex items-center gap-3 text-sm">
                  <Mail className="h-4 w-4 text-gray-400" />
                  <span className="text-gray-600">{client.id}</span>
                </div>
                <div className="flex items-center gap-3 text-sm">
                  <Calendar className="h-4 w-4 text-gray-400" />
                  <span className="text-gray-600">
                    Inscrit le{' '}
                    {new Date(client.created_at).toLocaleDateString('fr-FR')}
                  </span>
                </div>
              </div>
            </div>

            {/* Statistics */}
            <div className="bg-white rounded-lg shadow p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">
                Statistiques
              </h2>
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">Réservations</span>
                  <span className="text-lg font-semibold text-gray-900">
                    {bookings?.length || 0}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">Adresses</span>
                  <span className="text-lg font-semibold text-gray-900">
                    {addresses?.length || 0}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">Rôle</span>
                  <span className="text-sm font-medium text-gray-900">
                    {client.role}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Right Column - Bookings & Addresses */}
          <div className="lg:col-span-2 space-y-6">
            {/* Bookings */}
            <div className="bg-white rounded-lg shadow">
              <div className="px-6 py-4 border-b border-gray-200">
                <h2 className="text-lg font-semibold text-gray-900">
                  Réservations ({bookings?.length || 0})
                </h2>
              </div>
              <div className="p-6">
                {!bookings || bookings.length === 0 ? (
                  <p className="text-gray-600 text-center py-8">
                    Aucune réservation
                  </p>
                ) : (
                  <div className="space-y-3">
                    {bookings.map((booking: any) => (
                      <div
                        key={booking.id}
                        className="border border-gray-200 rounded-lg p-4 hover:border-blue-300 transition-colors"
                      >
                        <div className="flex items-start justify-between">
                          <div>
                            <p className="font-medium text-gray-900">
                              {booking.service?.name || 'Service inconnu'}
                            </p>
                            <p className="text-sm text-gray-600 mt-1">
                              {booking.contractor?.business_name ||
                                'Prestataire non assigné'}
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

            {/* Addresses */}
            <div className="bg-white rounded-lg shadow">
              <div className="px-6 py-4 border-b border-gray-200">
                <h2 className="text-lg font-semibold text-gray-900">
                  Adresses ({addresses?.length || 0})
                </h2>
              </div>
              <div className="p-6">
                {!addresses || addresses.length === 0 ? (
                  <p className="text-gray-600 text-center py-8">
                    Aucune adresse enregistrée
                  </p>
                ) : (
                  <div className="space-y-3">
                    {addresses.map((address: any) => (
                      <div
                        key={address.id}
                        className="border border-gray-200 rounded-lg p-4"
                      >
                        <div className="flex items-start gap-3">
                          <MapPin className="h-5 w-5 text-gray-400 mt-0.5" />
                          <div className="flex-1">
                            <div className="flex items-start justify-between">
                              <div>
                                <p className="font-medium text-gray-900">
                                  {address.street_address}
                                </p>
                                <p className="text-sm text-gray-600">
                                  {address.postal_code} {address.city}
                                </p>
                                {address.additional_info && (
                                  <p className="text-xs text-gray-500 mt-1">
                                    {address.additional_info}
                                  </p>
                                )}
                              </div>
                              {address.is_default && (
                                <span className="px-2 py-1 text-xs font-medium bg-blue-100 text-blue-800 rounded-full">
                                  Par défaut
                                </span>
                              )}
                            </div>
                          </div>
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
