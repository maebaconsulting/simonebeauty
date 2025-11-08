'use client'

import { useRouter } from 'next/navigation'
import { ForgotPasswordForm } from '@/components/auth/ForgotPasswordForm'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { X } from 'lucide-react'

interface ForgotPasswordModalProps {
  open: boolean
  onClose: () => void
  onSwitchToLogin?: () => void
}

export function ForgotPasswordModal({
  open,
  onClose,
  onSwitchToLogin,
}: ForgotPasswordModalProps) {
  const router = useRouter()

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md p-0 gap-0">
        {/* Header */}
        <DialogHeader className="p-8 pb-6 relative">
          <DialogTitle className="font-playfair text-4xl text-center font-normal">
            Mot de passe oublié
          </DialogTitle>
          <button
            onClick={onClose}
            className="absolute right-6 top-6 rounded-full p-2 hover:bg-gray-100 transition-colors"
            aria-label="Fermer"
          >
            <X className="w-5 h-5" />
          </button>
        </DialogHeader>

        {/* Form Container */}
        <div className="px-8 pb-8">
          <p className="text-gray-600 text-center mb-6">
            Entrez votre adresse email et nous vous enverrons un code de vérification pour réinitialiser votre mot de passe.
          </p>

          {/* Reuse existing ForgotPasswordForm but customize it */}
          <ForgotPasswordForm
            onSuccess={(email) => {
              onClose()
              router.push(`/reset-password?email=${encodeURIComponent(email)}`)
            }}
            compact
          />

          {/* Back to Login */}
          <div className="text-center mt-6">
            <button
              type="button"
              onClick={() => {
                onClose()
                onSwitchToLogin?.()
              }}
              className="text-gray-600 hover:text-gray-900"
            >
              Retour à la connexion
            </button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
