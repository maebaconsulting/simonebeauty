'use client'

import { useState } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useUser } from '@/hooks/useUser'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { LoginModal } from '@/components/auth/LoginModal'
import { SignupModal } from '@/components/auth/SignupModal'
import { ForgotPasswordModal } from '@/components/auth/ForgotPasswordModal'
import { User, LogOut } from 'lucide-react'

/**
 * Public Booking Layout
 * Allows both authenticated and guest users to access the booking flow
 * Shows conditional header based on authentication state
 */
export default function BookingLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const { user, profile, isLoading } = useUser()
  const pathname = usePathname()
  const supabase = createClient()

  // Modal states
  const [loginModalOpen, setLoginModalOpen] = useState(false)
  const [signupModalOpen, setSignupModalOpen] = useState(false)
  const [forgotPasswordModalOpen, setForgotPasswordModalOpen] = useState(false)

  // Determine current step based on pathname
  const getCurrentStep = () => {
    if (pathname?.includes('/services')) return 1
    if (pathname?.includes('/address')) return 2
    if (pathname?.includes('/timeslot')) return 3
    if (pathname?.includes('/contractor')) return 4
    if (pathname?.includes('/confirmation')) return 5
    return 1
  }

  const currentStep = getCurrentStep()
  const steps = [
    { number: 1, label: 'Service', path: '/booking/services' },
    { number: 2, label: 'Adresse', path: '/booking/address' },
    { number: 3, label: 'Créneau', path: '/booking/timeslot' },
    { number: 4, label: 'Prestataire', path: '/booking/contractor' },
    { number: 5, label: 'Confirmation', path: '/booking/confirmation' },
  ]

  const handleLogout = async () => {
    await supabase.auth.signOut()
    window.location.href = '/'
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-white border-b shadow-sm">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            {/* Logo */}
            <Link href="/" className="text-xl font-playfair font-semibold text-gray-900 hover:opacity-80 transition-opacity">
              Simone Paris
            </Link>

            {/* Progress Indicator - Hidden on mobile */}
            <div className="hidden md:flex items-center gap-2">
              {steps.map((step, index) => (
                <div key={step.number} className="flex items-center">
                  <div className="flex items-center gap-2">
                    <div
                      className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium transition-all ${
                        currentStep === step.number
                          ? 'bg-button-primary text-white'
                          : currentStep > step.number
                            ? 'bg-green-500 text-white'
                            : 'bg-gray-200 text-gray-600'
                      }`}
                    >
                      {currentStep > step.number ? '✓' : step.number}
                    </div>
                    <span
                      className={`text-sm font-medium ${
                        currentStep === step.number
                          ? 'text-gray-900'
                          : 'text-gray-500'
                      }`}
                    >
                      {step.label}
                    </span>
                  </div>
                  {index < steps.length - 1 && (
                    <div
                      className={`w-12 h-0.5 mx-2 ${
                        currentStep > step.number ? 'bg-green-500' : 'bg-gray-200'
                      }`}
                    />
                  )}
                </div>
              ))}
            </div>

            {/* Auth Section */}
            <div className="flex items-center gap-3">
              {isLoading ? (
                <div className="text-sm text-gray-500">Chargement...</div>
              ) : user && profile ? (
                // Authenticated User
                <>
                  <Link href="/client">
                    <Button
                      variant="ghost"
                      className="gap-2"
                      title="Mon compte"
                    >
                      <User className="w-4 h-4" />
                      <span className="hidden sm:inline">{profile.first_name || user.email}</span>
                    </Button>
                  </Link>
                  <Button
                    variant="outline"
                    onClick={handleLogout}
                    className="gap-2"
                    title="Se déconnecter"
                  >
                    <LogOut className="w-4 h-4" />
                    <span className="hidden sm:inline">Déconnexion</span>
                  </Button>
                </>
              ) : (
                // Guest User
                <>
                  <Button
                    variant="ghost"
                    onClick={() => setLoginModalOpen(true)}
                    className="text-sm"
                  >
                    Se connecter
                  </Button>
                  <Button
                    onClick={() => setSignupModalOpen(true)}
                    className="bg-button-primary hover:bg-button-primary/90 text-sm"
                  >
                    S'inscrire
                  </Button>
                </>
              )}
            </div>
          </div>

          {/* Mobile Progress Indicator */}
          <div className="md:hidden mt-4">
            <div className="flex items-center justify-between mb-2">
              {steps.map((step) => (
                <div
                  key={step.number}
                  className={`w-full h-1 ${
                    currentStep >= step.number ? 'bg-button-primary' : 'bg-gray-200'
                  } ${step.number < steps.length ? 'mr-1' : ''}`}
                />
              ))}
            </div>
            <div className="text-sm text-center text-gray-600">
              Étape {currentStep} sur {steps.length}: {steps[currentStep - 1]?.label}
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main>{children}</main>

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
    </div>
  )
}
