'use client'

import { useState } from 'react'
import { Header } from '@/components/layout/Header'
import { HeroSection } from '@/components/home/HeroSection'
import { ServicesSection } from '@/components/home/ServicesSection'
import { Footer } from '@/components/layout/Footer'
import { LoginModal } from '@/components/auth/LoginModal'
import { SignupModal } from '@/components/auth/SignupModal'
import { ForgotPasswordModal } from '@/components/auth/ForgotPasswordModal'

export default function HomePage() {
  const [activeModal, setActiveModal] = useState<'login' | 'signup' | 'forgot-password' | null>(null)

  const closeModal = () => setActiveModal(null)

  return (
    <div className="min-h-screen">
      {/* Header */}
      <Header
        onLoginClick={() => setActiveModal('login')}
        onSignupClick={() => setActiveModal('signup')}
      />

      {/* Hero Section */}
      <HeroSection />

      {/* Services Section */}
      <ServicesSection />

      {/* Footer */}
      <Footer />

      {/* Modals */}
      <LoginModal
        open={activeModal === 'login'}
        onClose={closeModal}
        onSwitchToSignup={() => setActiveModal('signup')}
        onSwitchToForgotPassword={() => setActiveModal('forgot-password')}
      />

      <SignupModal
        open={activeModal === 'signup'}
        onClose={closeModal}
        onSwitchToLogin={() => setActiveModal('login')}
      />

      <ForgotPasswordModal
        open={activeModal === 'forgot-password'}
        onClose={closeModal}
        onSwitchToLogin={() => setActiveModal('login')}
      />
    </div>
  )
}
