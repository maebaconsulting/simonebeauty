import { Metadata } from 'next'
import Link from 'next/link'
import { ForgotPasswordForm } from '@/components/auth/ForgotPasswordForm'

export const metadata: Metadata = {
  title: 'Mot de passe oublié | Simone Paris',
  description: 'Réinitialisez votre mot de passe',
}

export default function ForgotPasswordPage() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center px-4 py-12">
      <div className="w-full max-w-md space-y-8">
        {/* Header */}
        <div className="text-center">
          <h1 className="text-3xl font-bold tracking-tight">Mot de passe oublié</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            Entrez votre adresse email et nous vous enverrons un code de vérification
          </p>
        </div>

        {/* Form */}
        <ForgotPasswordForm />

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
