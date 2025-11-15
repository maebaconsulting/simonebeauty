import type { Metadata } from 'next'
import Link from 'next/link'
import { CheckCircle, Home, Mail, Clock } from 'lucide-react'
import { Button } from '@/components/ui/button'

export const metadata: Metadata = {
  title: 'Candidature Envoyée | Simone Paris',
  description: 'Votre candidature a été envoyée avec succès. Nous vous recontacterons prochainement.',
}

export default function ApplicationSuccessPage() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white flex items-center justify-center p-4">
      <div className="max-w-2xl w-full">
        {/* Success Card */}
        <div className="bg-white rounded-xl shadow-lg p-8 md:p-12 text-center">
          {/* Success Icon */}
          <div className="inline-flex items-center justify-center w-20 h-20 bg-green-100 rounded-full mb-6">
            <CheckCircle className="h-12 w-12 text-green-600" />
          </div>

          {/* Main Message */}
          <h1 className="font-playfair text-3xl md:text-4xl font-bold text-gray-900 mb-4">
            Candidature envoyée avec succès !
          </h1>

          <p className="text-lg text-gray-600 mb-8">
            Merci pour votre candidature. Nous avons bien reçu vos informations et nous vous
            recontacterons très prochainement.
          </p>

          {/* Next Steps */}
          <div className="bg-gray-50 rounded-lg p-6 mb-8 text-left">
            <h2 className="font-semibold text-lg mb-4 flex items-center gap-2">
              <Clock className="h-5 w-5 text-[#E97B6E]" />
              Prochaines étapes
            </h2>
            <ol className="space-y-3 text-gray-700">
              <li className="flex gap-3">
                <span className="flex-shrink-0 w-6 h-6 bg-[#E97B6E] text-white rounded-full flex items-center justify-center text-sm font-semibold">
                  1
                </span>
                <span>
                  <strong>Confirmation par email :</strong> Vous recevrez un email de confirmation
                  dans les prochaines minutes
                </span>
              </li>
              <li className="flex gap-3">
                <span className="flex-shrink-0 w-6 h-6 bg-[#E97B6E] text-white rounded-full flex items-center justify-center text-sm font-semibold">
                  2
                </span>
                <span>
                  <strong>Étude de votre profil :</strong> Notre équipe examinera votre candidature
                  sous 2-3 jours ouvrés
                </span>
              </li>
              <li className="flex gap-3">
                <span className="flex-shrink-0 w-6 h-6 bg-[#E97B6E] text-white rounded-full flex items-center justify-center text-sm font-semibold">
                  3
                </span>
                <span>
                  <strong>Entretien :</strong> Si votre profil correspond, nous vous contacterons
                  pour planifier un entretien
                </span>
              </li>
              <li className="flex gap-3">
                <span className="flex-shrink-0 w-6 h-6 bg-[#E97B6E] text-white rounded-full flex items-center justify-center text-sm font-semibold">
                  4
                </span>
                <span>
                  <strong>Activation de votre compte :</strong> Suite à l'entretien, nous
                  validerons votre compte et vous recevrez vos identifiants
                </span>
              </li>
            </ol>
          </div>

          {/* Info Box */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-8">
            <div className="flex gap-3 text-left">
              <Mail className="h-5 w-5 text-blue-600 flex-shrink-0 mt-0.5" />
              <div className="text-sm text-blue-900">
                <p className="font-semibold mb-1">Vérifiez vos emails</p>
                <p>
                  Nous vous avons envoyé un email de confirmation. Si vous ne le recevez pas dans
                  les 10 minutes, vérifiez votre dossier spam/courrier indésirable.
                </p>
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button asChild size="lg" className="bg-[#E97B6E] hover:bg-[#E97B6E]/90">
              <Link href="/">
                <Home className="h-5 w-5 mr-2" />
                Retour à l'accueil
              </Link>
            </Button>

            <Button asChild variant="outline" size="lg">
              <Link href="/rejoindre-simone">
                Soumettre une autre candidature
              </Link>
            </Button>
          </div>

          {/* Contact Support */}
          <div className="mt-8 pt-8 border-t border-gray-200">
            <p className="text-sm text-gray-600">
              Des questions sur votre candidature ?{' '}
              <a
                href="mailto:recrutement@simone.paris"
                className="text-[#E97B6E] hover:underline font-medium"
              >
                Contactez notre équipe
              </a>
            </p>
          </div>
        </div>

        {/* Additional Info */}
        <div className="mt-8 text-center">
          <p className="text-sm text-gray-500">
            Votre candidature a été enregistrée le{' '}
            <strong>{new Date().toLocaleDateString('fr-FR', {
              day: 'numeric',
              month: 'long',
              year: 'numeric',
              hour: '2-digit',
              minute: '2-digit',
            })}</strong>
          </p>
        </div>
      </div>
    </div>
  )
}
