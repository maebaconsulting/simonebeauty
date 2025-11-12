'use client'

import { useSearchParams } from 'next/navigation'
import { Lock } from 'lucide-react'
import { ResetPasswordForm } from '@/components/auth/ResetPasswordForm'

export default function ResetPasswordPage() {
  const searchParams = useSearchParams()
  const email = searchParams.get('email') || ''

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
      <div className="bg-white rounded-xl shadow-lg w-full max-w-md p-8">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-[#E97B6E]/10 rounded-full mb-4">
            <Lock className="h-8 w-8 text-[#E97B6E]" />
          </div>
          <h1 className="font-playfair text-2xl font-semibold text-gray-900 mb-2">
            Réinitialiser votre mot de passe
          </h1>
          <p className="text-gray-600 text-sm">
            Nous avons envoyé un code de vérification à 6 chiffres à
          </p>
          <p className="text-gray-900 font-medium mt-1">{email || 'votre adresse email'}</p>
        </div>

        {/* Form */}
        <ResetPasswordForm />
      </div>
    </div>
  )
}
