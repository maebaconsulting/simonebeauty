import { Metadata } from 'next'
import { Suspense } from 'react'
import Link from 'next/link'
import { ResetPasswordForm } from '@/components/auth/ResetPasswordForm'

export const metadata: Metadata = {
  title: 'Réinitialiser le mot de passe | Simone Paris',
  description: 'Créez un nouveau mot de passe',
}

export default function ResetPasswordPage() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center px-4 py-12">
      <div className="w-full max-w-md space-y-8">
        {/* Header */}
        <div className="text-center">
          <h1 className="text-3xl font-bold tracking-tight">
            Réinitialiser le mot de passe
          </h1>
          <p className="mt-2 text-sm text-muted-foreground">
            Entrez le code reçu par email et votre nouveau mot de passe
          </p>
        </div>

        {/* Form */}
        <Suspense fallback={<div>Chargement...</div>}>
          <ResetPasswordForm />
        </Suspense>

        {/* Back to login */}
        <div className="text-center text-sm">
          <Link
            href="/login"
            className="font-medium text-primary hover:underline"
          >
            Retour à la connexion
          </Link>
        </div>
      </div>
    </div>
  )
}
