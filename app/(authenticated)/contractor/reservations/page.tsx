'use client'

/**
 * Contractor Reservations Page
 * Task: T067 (updated with full integration)
 * Feature: 007-contractor-interface
 * Route: /contractor/reservations
 *
 * Displays booking requests and bookings with tabs:
 * - Pending Requests (booking_requests with status='pending')
 * - Upcoming (confirmed/in_progress bookings)
 * - Past (completed/cancelled bookings)
 */

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useUser } from '@/hooks/useUser'
import { useCurrentContractor } from '@/hooks/useContractorSchedule'
import {
  usePendingRequests,
  useUpcomingBookings,
  usePastBookings,
  useAcceptRequest,
  useRefuseRequest,
  useMarkServiceCompleted
} from '@/hooks/useContractorBookings'
import { PendingRequestsList } from '@/components/contractor/PendingRequestsList'
import { UpcomingBookingsList } from '@/components/contractor/UpcomingBookingsList'
import { PastBookingsList } from '@/components/contractor/PastBookingsList'
import { AcceptBookingModal } from '@/components/contractor/AcceptBookingModal'
import { RefuseBookingModal } from '@/components/contractor/RefuseBookingModal'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import {
  Calendar,
  ArrowLeft,
  AlertCircle,
  Clock,
  CheckCircle,
  History
} from 'lucide-react'
import { toast } from 'sonner'
import type { BookingRequest } from '@/types/contractor'

type TabType = 'pending' | 'upcoming' | 'past'

export default function ContractorReservationsPage() {
  const router = useRouter()
  const [activeTab, setActiveTab] = useState<TabType>('pending')
  const [selectedRequest, setSelectedRequest] = useState<BookingRequest | null>(null)
  const [showAcceptModal, setShowAcceptModal] = useState(false)
  const [showRefuseModal, setShowRefuseModal] = useState(false)

  const { user, isLoading: userLoading } = useUser()
  const { data: contractor, isLoading: contractorLoading } = useCurrentContractor()

  // Queries
  const { data: pendingRequests = [], isLoading: pendingLoading } = usePendingRequests(contractor?.id)
  const { data: upcomingBookings = [], isLoading: upcomingLoading } = useUpcomingBookings(contractor?.id)
  const { data: pastBookings = [], isLoading: pastLoading } = usePastBookings(contractor?.id)

  // Mutations
  const acceptMutation = useAcceptRequest()
  const refuseMutation = useRefuseRequest()
  const markCompletedMutation = useMarkServiceCompleted()

  const isLoading = userLoading || contractorLoading

  // Handlers
  const handleAcceptClick = (requestId: number) => {
    const request = pendingRequests.find(r => r.id === requestId)
    if (request) {
      setSelectedRequest(request)
      setShowAcceptModal(true)
    }
  }

  const handleRefuseClick = (requestId: number) => {
    const request = pendingRequests.find(r => r.id === requestId)
    if (request) {
      setSelectedRequest(request)
      setShowRefuseModal(true)
    }
  }

  const handleAcceptConfirm = async (requestId: number) => {
    if (!contractor) return

    try {
      await acceptMutation.mutateAsync({
        requestId,
        contractorId: contractor.id
      })
      toast.success('Réservation acceptée avec succès')
      setShowAcceptModal(false)
      setSelectedRequest(null)
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Erreur lors de l\'acceptation')
      throw error // Re-throw to let modal handle it
    }
  }

  const handleRefuseConfirm = async (
    requestId: number,
    refusalReason: string,
    contractorMessage?: string
  ) => {
    if (!contractor) return

    try {
      await refuseMutation.mutateAsync({
        requestId,
        contractorId: contractor.id,
        refusalReason,
        contractorMessage
      })
      toast.success('Réservation refusée')
      setShowRefuseModal(false)
      setSelectedRequest(null)
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Erreur lors du refus')
      throw error // Re-throw to let modal handle it
    }
  }

  const handleMarkCompleted = async (bookingId: number) => {
    if (!contractor) return

    try {
      await markCompletedMutation.mutateAsync({
        bookingId,
        contractorId: contractor.id
      })
      toast.success('Service marqué comme terminé')
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Erreur lors de la mise à jour')
    }
  }

  // Loading state
  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-purple-100 rounded-full mb-4 animate-pulse">
            <Calendar className="w-8 h-8 text-purple-600" />
          </div>
          <p className="text-gray-600 font-medium">Chargement de vos réservations...</p>
        </div>
      </div>
    )
  }

  // Error: Not a contractor
  if (!contractor) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <Card className="max-w-md w-full p-8">
          <div className="text-center">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-red-100 rounded-full mb-4">
              <AlertCircle className="w-8 h-8 text-red-600" />
            </div>
            <h1 className="text-2xl font-bold text-gray-900 mb-2">
              Accès refusé
            </h1>
            <p className="text-gray-600 mb-6">
              Cette page est réservée aux prestataires approuvés.
            </p>
            <Button
              onClick={() => router.push('/')}
              className="w-full bg-button-primary hover:bg-button-primary/90"
            >
              Retour à l'accueil
            </Button>
          </div>
        </Card>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="container mx-auto px-4 max-w-6xl">
        {/* Header */}
        <div className="mb-8">
          <Button
            onClick={() => router.back()}
            variant="ghost"
            className="mb-4 text-gray-600 hover:text-gray-900"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Retour
          </Button>

          <div className="bg-white rounded-lg p-6 shadow-sm">
            <div className="flex items-center gap-3 mb-2">
              <div className="inline-flex items-center justify-center w-12 h-12 bg-purple-100 rounded-lg">
                <Calendar className="w-6 h-6 text-purple-600" />
              </div>
              <h1 className="font-playfair text-3xl font-bold text-gray-900">
                Mes Réservations
              </h1>
            </div>
            <p className="text-gray-600 ml-15">
              Gérez vos demandes de réservation et vos prestations à venir
            </p>
          </div>
        </div>

        {/* Tabs */}
        <div className="mb-6">
          <div className="border-b border-gray-200">
            <nav className="-mb-px flex space-x-8">
              {/* Pending Requests Tab */}
              <button
                onClick={() => setActiveTab('pending')}
                className={`${
                  activeTab === 'pending'
                    ? 'border-orange-500 text-orange-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                } whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm flex items-center gap-2`}
              >
                <Clock className="w-4 h-4" />
                Demandes en attente
                {pendingRequests.length > 0 && (
                  <span className="inline-flex items-center justify-center w-5 h-5 text-xs font-bold text-white bg-orange-500 rounded-full">
                    {pendingRequests.length}
                  </span>
                )}
              </button>

              {/* Upcoming Bookings Tab */}
              <button
                onClick={() => setActiveTab('upcoming')}
                className={`${
                  activeTab === 'upcoming'
                    ? 'border-purple-500 text-purple-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                } whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm flex items-center gap-2`}
              >
                <CheckCircle className="w-4 h-4" />
                À venir
              </button>

              {/* Past Bookings Tab */}
              <button
                onClick={() => setActiveTab('past')}
                className={`${
                  activeTab === 'past'
                    ? 'border-purple-500 text-purple-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                } whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm flex items-center gap-2`}
              >
                <History className="w-4 h-4" />
                Historique
              </button>
            </nav>
          </div>
        </div>

        {/* Tab Content */}
        <div className="space-y-4">
          {/* Pending Requests Content */}
          {activeTab === 'pending' && (
            <PendingRequestsList
              requests={pendingRequests}
              isLoading={pendingLoading}
              onAccept={handleAcceptClick}
              onRefuse={handleRefuseClick}
              isProcessing={acceptMutation.isPending || refuseMutation.isPending}
            />
          )}

          {/* Upcoming Bookings Content */}
          {activeTab === 'upcoming' && (
            <UpcomingBookingsList
              bookings={upcomingBookings}
              isLoading={upcomingLoading}
              onMarkCompleted={handleMarkCompleted}
              isProcessing={markCompletedMutation.isPending}
            />
          )}

          {/* Past Bookings Content */}
          {activeTab === 'past' && (
            <PastBookingsList
              bookings={pastBookings}
              isLoading={pastLoading}
            />
          )}
        </div>

        {/* Modals */}
        <AcceptBookingModal
          request={selectedRequest}
          open={showAcceptModal}
          onClose={() => {
            setShowAcceptModal(false)
            setSelectedRequest(null)
          }}
          onConfirm={handleAcceptConfirm}
        />

        <RefuseBookingModal
          request={selectedRequest}
          open={showRefuseModal}
          onClose={() => {
            setShowRefuseModal(false)
            setSelectedRequest(null)
          }}
          onConfirm={handleRefuseConfirm}
        />
      </div>
    </div>
  )
}
