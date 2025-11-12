'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { X, Sparkles, CheckCircle2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { LoginModal } from '@/components/auth/LoginModal'
import { SignupModal } from '@/components/auth/SignupModal'
import { ForgotPasswordModal } from '@/components/auth/ForgotPasswordModal'
import {
  useBookingSession,
  useMigrateGuestSession,
  useSaveGuestAddressToProfile,
} from '@/hooks/useBookingSession'
import { useUser } from '@/hooks/useUser'

interface LoginGateProps {
  open: boolean
  onClose: () => void
  sessionId: string
  onAuthSuccess: () => void
}

/**
 * Login Gate Component
 *
 * Appears after guest users select a timeslot to encourage account creation
 * Shows value proposition for creating an account
 * Handles session migration after successful authentication
 */
export function LoginGate({ open, onClose, sessionId, onAuthSuccess }: LoginGateProps) {
  const router = useRouter()
  const { user } = useUser()
  const { data: bookingSession } = useBookingSession(sessionId)
  const [loginModalOpen, setLoginModalOpen] = useState(false)
  const [signupModalOpen, setSignupModalOpen] = useState(false)
  const [forgotPasswordModalOpen, setForgotPasswordModalOpen] = useState(false)
  const [isMigrating, setIsMigrating] = useState(false)

  const migrateSession = useMigrateGuestSession()
  const saveAddress = useSaveGuestAddressToProfile()

  // Auto-migrate session when user authenticates
  useEffect(() => {
    if (user && open && !isMigrating) {
      handleSessionMigration()
    }
  }, [user, open])

  const handleSessionMigration = async () => {
    if (!user || !sessionId || isMigrating || !bookingSession) return

    setIsMigrating(true)

    try {
      console.log('🔄 Migrating guest session to authenticated user...')

      // Save guest address to client_addresses first (if exists)
      let savedAddressId: number | undefined

      if (bookingSession.guest_address) {
        console.log('💾 Saving guest address to user profile...')
        savedAddressId = await saveAddress.mutateAsync({
          userId: user.id,
          address: bookingSession.guest_address,
        })
        console.log('✅ Guest address saved with ID:', savedAddressId)
      }

      // Migrate session to authenticated user
      // This will also update address_id if we saved one
      await migrateSession.mutateAsync({
        sessionId,
        userId: user.id,
        addressId: savedAddressId,
      })

      console.log('✅ Session migrated successfully')

      // Close all modals
      setLoginModalOpen(false)
      setSignupModalOpen(false)
      onClose()

      // Trigger success callback
      onAuthSuccess()
    } catch (error) {
      console.error('❌ Error migrating guest session:', error)
      alert("Erreur lors de la migration de votre session. Veuillez réessayer.")
      setIsMigrating(false)
    }
  }

  if (!open) return null

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/50 z-50 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        <div
          className="bg-white rounded-2xl max-w-md w-full shadow-2xl transform transition-all"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Close button */}
          <button
            onClick={onClose}
            className="absolute top-4 right-4 p-2 rounded-full hover:bg-gray-100 transition-colors"
          >
            <X className="w-5 h-5 text-gray-500" />
          </button>

          {/* Content */}
          <div className="p-8">
            {/* Icon */}
            <div className="flex justify-center mb-6">
              <div className="w-16 h-16 bg-gradient-to-br from-button-primary to-purple-600 rounded-full flex items-center justify-center">
                <Sparkles className="w-8 h-8 text-white" />
              </div>
            </div>

            {/* Title */}
            <h2 className="font-playfair text-2xl font-bold text-gray-900 text-center mb-2">
              Dernière étape !
            </h2>
            <p className="text-gray-600 text-center mb-6">
              Créez votre compte pour finaliser votre réservation
            </p>

            {/* Benefits */}
            <div className="space-y-3 mb-8">
              <div className="flex items-start gap-3">
                <CheckCircle2 className="w-5 h-5 text-green-500 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="text-sm font-medium text-gray-900">Confirmez votre réservation</p>
                  <p className="text-xs text-gray-600">Recevez une confirmation par email</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <CheckCircle2 className="w-5 h-5 text-green-500 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="text-sm font-medium text-gray-900">Gérez vos rendez-vous</p>
                  <p className="text-xs text-gray-600">Suivez et modifiez vos réservations</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <CheckCircle2 className="w-5 h-5 text-green-500 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="text-sm font-medium text-gray-900">Accédez à votre historique</p>
                  <p className="text-xs text-gray-600">Retrouvez vos anciennes réservations</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <CheckCircle2 className="w-5 h-5 text-green-500 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="text-sm font-medium text-gray-900">Réservez plus rapidement</p>
                  <p className="text-xs text-gray-600">Vos informations sont déjà enregistrées</p>
                </div>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="space-y-3">
              <Button
                onClick={() => {
                  setSignupModalOpen(true)
                }}
                className="w-full bg-button-primary hover:bg-button-primary/90 text-white h-12 text-base rounded-full"
              >
                Créer un compte
              </Button>
              <Button
                onClick={() => {
                  setLoginModalOpen(true)
                }}
                variant="outline"
                className="w-full h-12 text-base rounded-full"
              >
                J'ai déjà un compte
              </Button>
            </div>

            {/* Migrating state */}
            {isMigrating && (
              <div className="mt-4 text-center">
                <p className="text-sm text-gray-600">
                  ⏳ Migration de votre session en cours...
                </p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Auth Modals */}
      <LoginModal
        open={loginModalOpen}
        onClose={() => setLoginModalOpen(false)}
        onSwitchToSignup={() => {
          setLoginModalOpen(false)
          setSignupModalOpen(true)
        }}
        onSwitchToForgotPassword={() => {
          setLoginModalOpen(false)
          setForgotPasswordModalOpen(true)
        }}
      />

      <SignupModal
        open={signupModalOpen}
        onClose={() => setSignupModalOpen(false)}
        onSwitchToLogin={() => {
          setSignupModalOpen(false)
          setLoginModalOpen(true)
        }}
      />

      <ForgotPasswordModal
        open={forgotPasswordModalOpen}
        onClose={() => setForgotPasswordModalOpen(false)}
        onSwitchToLogin={() => {
          setForgotPasswordModalOpen(false)
          setLoginModalOpen(true)
        }}
      />
    </>
  )
}
