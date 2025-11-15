'use client'

/**
 * PendingRequestsList Component
 * Task: T068 (enhancement)
 * Feature: 007-contractor-interface
 *
 * Displays list of pending booking requests with actions
 */

import { BookingRequestCard } from './BookingRequestCard'
import type { BookingRequest } from '@/types/contractor'
import { Card } from '@/components/ui/card'
import { Inbox, Loader2 } from 'lucide-react'

interface PendingRequestsListProps {
  requests: BookingRequest[]
  isLoading: boolean
  onAccept: (requestId: number) => void
  onRefuse: (requestId: number) => void
  isProcessing?: boolean
}

export function PendingRequestsList({
  requests,
  isLoading,
  onAccept,
  onRefuse,
  isProcessing = false
}: PendingRequestsListProps) {
  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="w-8 h-8 text-orange-600 animate-spin" />
      </div>
    )
  }

  if (requests.length === 0) {
    return (
      <Card className="p-12">
        <div className="text-center">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-orange-100 rounded-full mb-4">
            <Inbox className="w-8 h-8 text-orange-600" />
          </div>
          <h3 className="text-lg font-semibold text-gray-900 mb-2">
            Aucune demande en attente
          </h3>
          <p className="text-gray-600 max-w-md mx-auto">
            Les nouvelles demandes de réservation de la part des clients apparaîtront ici.
            Vous aurez 24 heures pour accepter ou refuser chaque demande.
          </p>
        </div>
      </Card>
    )
  }

  return (
    <div className="space-y-4">
      {/* Count badge */}
      <div className="flex items-center justify-between mb-2">
        <p className="text-sm text-gray-600">
          <span className="font-semibold text-gray-900">{requests.length}</span> demande{requests.length > 1 ? 's' : ''} en attente
        </p>
      </div>

      {/* Requests list */}
      {requests.map((request) => (
        <BookingRequestCard
          key={request.id}
          request={request}
          onAccept={onAccept}
          onRefuse={onRefuse}
          isProcessing={isProcessing}
        />
      ))}
    </div>
  )
}
