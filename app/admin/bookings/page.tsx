'use client'

/**
 * Admin Bookings List Page
 * Feature: Admin Back Office - Booking Management
 * SpecKit: spec 005 User Story 5 - Gestion des Réservations
 */

import { useState } from 'react'
import { AdminBookingStatus, AdminBookingWithDetails, AdminBookingFilters } from '@/types/booking'
import { useAdminBookings, useCapturePayment, useCancelBooking } from '@/hooks/useAdminBookings'
import { BookingCard } from '@/components/admin/BookingCard'
import { CapturePaymentModal } from '@/components/admin/CapturePaymentModal'
import { CancelBookingModal } from '@/components/admin/CancelBookingModal'
import { Button } from '@/components/ui/button'
import { Search, Filter, Calendar as CalendarIcon } from 'lucide-react'

const STATUS_FILTERS: { value: AdminBookingStatus | 'all', label: string }[] = [
  { value: 'all', label: 'Toutes' },
  { value: 'pending', label: 'En attente' },
  { value: 'confirmed', label: 'Confirmées' },
  { value: 'in_progress', label: 'En cours' },
  { value: 'completed_by_contractor', label: 'Terminées (prestataire)' },
  { value: 'completed', label: 'Terminées' },
  { value: 'cancelled', label: 'Annulées' },
]

export default function AdminBookingsPage() {
  const [statusFilter, setStatusFilter] = useState<AdminBookingStatus | 'all'>('all')
  const [searchQuery, setSearchQuery] = useState('')
  const [dateFrom, setDateFrom] = useState('')
  const [dateTo, setDateTo] = useState('')
  const [currentPage, setCurrentPage] = useState(1)

  // Modal state
  const [selectedBooking, setSelectedBooking] = useState<AdminBookingWithDetails | null>(null)
  const [isCaptureModalOpen, setIsCaptureModalOpen] = useState(false)
  const [isCancelModalOpen, setIsCancelModalOpen] = useState(false)

  // Mutations
  const capturePaymentMutation = useCapturePayment()
  const cancelBookingMutation = useCancelBooking()

  // Build filters
  const filters: AdminBookingFilters = {
    status: statusFilter,
    search: searchQuery || undefined,
    date_from: dateFrom || undefined,
    date_to: dateTo || undefined,
    page: currentPage,
    limit: 20,
  }

  // Fetch bookings
  const { data, isLoading, error, refetch } = useAdminBookings(filters)

  const bookings = data?.bookings || []
  const pagination = data?.pagination

  // Count bookings by status (approximation from current page)
  const statusCounts = bookings.reduce((acc, booking) => {
    acc[booking.status] = (acc[booking.status] || 0) + 1
    return acc
  }, {} as Record<string, number>)

  // Modal handlers
  const handleCapturePayment = (bookingId: number) => {
    const booking = bookings.find(b => b.id === bookingId)
    if (booking) {
      setSelectedBooking(booking)
      setIsCaptureModalOpen(true)
    }
  }

  const handleCancelBooking = (bookingId: number) => {
    const booking = bookings.find(b => b.id === bookingId)
    if (booking) {
      setSelectedBooking(booking)
      setIsCancelModalOpen(true)
    }
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">
                Gestion des Réservations
              </h1>
              <p className="mt-1 text-sm text-gray-600">
                Consulter, modifier et gérer les réservations de la plateforme
              </p>
            </div>

            <div className="flex items-center gap-3">
              <div className="text-right">
                <div className="text-2xl font-bold text-gray-900">
                  {pagination?.total || 0}
                </div>
                <div className="text-sm text-gray-600">
                  {statusFilter === 'all' ? 'Total' : STATUS_FILTERS.find(f => f.value === statusFilter)?.label}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Filters */}
        <div className="bg-white rounded-lg border border-gray-200 p-6 mb-6">
          <div className="space-y-4">
            {/* Status Filter */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <Filter className="w-4 h-4 inline mr-1" />
                Filtrer par statut
              </label>
              <div className="flex flex-wrap gap-2">
                {STATUS_FILTERS.map(filter => {
                  const count = filter.value === 'all'
                    ? pagination?.total
                    : statusCounts[filter.value] || 0

                  return (
                    <button
                      key={filter.value}
                      onClick={() => {
                        setStatusFilter(filter.value)
                        setCurrentPage(1)
                      }}
                      className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                        statusFilter === filter.value
                          ? 'bg-button-primary text-white'
                          : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                      }`}
                    >
                      {filter.label}
                      {filter.value === 'all' && count !== undefined && (
                        <span className={`ml-2 px-2 py-0.5 rounded-full text-xs ${
                          statusFilter === filter.value
                            ? 'bg-white/20'
                            : 'bg-gray-200'
                        }`}>
                          {count}
                        </span>
                      )}
                    </button>
                  )
                })}
              </div>
            </div>

            {/* Search and Date Filters */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {/* Search */}
              <div className="md:col-span-1">
                <label htmlFor="search" className="block text-sm font-medium text-gray-700 mb-2">
                  <Search className="w-4 h-4 inline mr-1" />
                  Rechercher
                </label>
                <input
                  type="text"
                  id="search"
                  placeholder="Nom, email, ID..."
                  value={searchQuery}
                  onChange={(e) => {
                    setSearchQuery(e.target.value)
                    setCurrentPage(1)
                  }}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-button-primary focus:border-transparent"
                />
              </div>

              {/* Date From */}
              <div>
                <label htmlFor="date_from" className="block text-sm font-medium text-gray-700 mb-2">
                  <CalendarIcon className="w-4 h-4 inline mr-1" />
                  Date de début
                </label>
                <input
                  type="date"
                  id="date_from"
                  value={dateFrom}
                  onChange={(e) => {
                    setDateFrom(e.target.value)
                    setCurrentPage(1)
                  }}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-button-primary focus:border-transparent"
                />
              </div>

              {/* Date To */}
              <div>
                <label htmlFor="date_to" className="block text-sm font-medium text-gray-700 mb-2">
                  <CalendarIcon className="w-4 h-4 inline mr-1" />
                  Date de fin
                </label>
                <input
                  type="date"
                  id="date_to"
                  value={dateTo}
                  onChange={(e) => {
                    setDateTo(e.target.value)
                    setCurrentPage(1)
                  }}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-button-primary focus:border-transparent"
                />
              </div>
            </div>

            {/* Clear Filters */}
            {(searchQuery || dateFrom || dateTo || statusFilter !== 'all') && (
              <div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    setSearchQuery('')
                    setDateFrom('')
                    setDateTo('')
                    setStatusFilter('all')
                    setCurrentPage(1)
                  }}
                >
                  Réinitialiser les filtres
                </Button>
              </div>
            )}
          </div>
        </div>

        {/* Bookings List */}
        {isLoading ? (
          <div className="text-center py-12">
            <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-button-primary"></div>
            <p className="mt-4 text-gray-600">Chargement des réservations...</p>
          </div>
        ) : error ? (
          <div className="bg-red-50 border border-red-200 rounded-lg p-6 text-center">
            <p className="text-red-800">
              Erreur lors du chargement des réservations.
            </p>
            <Button
              onClick={() => refetch()}
              variant="outline"
              className="mt-4"
            >
              Réessayer
            </Button>
          </div>
        ) : bookings.length > 0 ? (
          <>
            <div className="space-y-4">
              {bookings.map(booking => (
                <BookingCard
                  key={booking.id}
                  booking={booking}
                  onCapturePayment={handleCapturePayment}
                  onCancelBooking={handleCancelBooking}
                />
              ))}
            </div>

            {/* Pagination */}
            {pagination && pagination.total_pages > 1 && (
              <div className="mt-6 flex items-center justify-center gap-2">
                <Button
                  variant="outline"
                  disabled={currentPage === 1}
                  onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                >
                  Précédent
                </Button>

                <span className="px-4 py-2 text-sm text-gray-600">
                  Page {currentPage} sur {pagination.total_pages}
                </span>

                <Button
                  variant="outline"
                  disabled={currentPage === pagination.total_pages}
                  onClick={() => setCurrentPage(p => Math.min(pagination.total_pages, p + 1))}
                >
                  Suivant
                </Button>
              </div>
            )}
          </>
        ) : (
          <div className="bg-white rounded-lg border border-gray-200 p-12 text-center">
            <CalendarIcon className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              Aucune réservation trouvée
            </h3>
            <p className="text-gray-600">
              {searchQuery || dateFrom || dateTo
                ? 'Aucune réservation ne correspond à vos critères de recherche.'
                : statusFilter === 'all'
                ? 'Aucune réservation n\'a encore été créée.'
                : `Aucune réservation avec le statut "${STATUS_FILTERS.find(f => f.value === statusFilter)?.label}".`
              }
            </p>
          </div>
        )}
      </div>

      {/* Modals */}
      {selectedBooking && (
        <>
          <CapturePaymentModal
            isOpen={isCaptureModalOpen}
            onClose={() => setIsCaptureModalOpen(false)}
            onCapture={async (data) => {
              await capturePaymentMutation.mutateAsync({
                bookingId: selectedBooking.id,
                ...data,
              })
              setIsCaptureModalOpen(false)
              refetch()
            }}
            booking={selectedBooking}
          />

          <CancelBookingModal
            isOpen={isCancelModalOpen}
            onClose={() => setIsCancelModalOpen(false)}
            onCancel={async (data) => {
              await cancelBookingMutation.mutateAsync({
                booking_id: selectedBooking.id,
                ...data,
              })
              setIsCancelModalOpen(false)
              refetch()
            }}
            booking={selectedBooking}
          />
        </>
      )}
    </div>
  )
}
