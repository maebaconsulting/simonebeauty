/**
 * Public Job Application Page
 * Feature: 007-contractor-interface
 * Route: /rejoindre-simone
 *
 * Multi-step form for contractor applications
 */

import { Metadata } from 'next'
import { ApplicationForm } from '@/components/contractor/ApplicationForm/ApplicationForm'
import { DollarSign, Calendar, Target, Shield } from 'lucide-react'

export const metadata: Metadata = {
  title: 'Devenir Prestataire | Simone Paris',
  description: 'Rejoignez notre réseau de prestataires de confiance. Postulez maintenant pour offrir vos services à domicile à Paris et en Île-de-France.',
  openGraph: {
    title: 'Devenir Prestataire | Simone Paris',
    description: 'Rejoignez notre réseau de prestataires de confiance',
    type: 'website',
  },
}

export default function RejoindreSimonePage() {
  return (
    <div className="min-h-screen bg-gray-50">
      {/* Hero Section */}
      <div className="bg-gradient-to-r from-button-primary to-purple-600 text-white py-16">
        <div className="container mx-auto px-4 max-w-4xl">
          <h1 className="font-playfair text-4xl md:text-5xl font-bold mb-4">
            Rejoignez Simone Paris
          </h1>
          <p className="text-lg md:text-xl text-white/90 mb-6">
            Développez votre activité en rejoignant notre réseau de prestataires qualifiés
          </p>
          <div className="grid md:grid-cols-3 gap-6 mt-8">
            <div className="bg-white/10 backdrop-blur-sm rounded-lg p-4">
              <div className="text-3xl font-bold mb-2">+500</div>
              <div className="text-sm text-white/80">Clients actifs</div>
            </div>
            <div className="bg-white/10 backdrop-blur-sm rounded-lg p-4">
              <div className="text-3xl font-bold mb-2">4.8/5</div>
              <div className="text-sm text-white/80">Satisfaction moyenne</div>
            </div>
            <div className="bg-white/10 backdrop-blur-sm rounded-lg p-4">
              <div className="text-3xl font-bold mb-2">85%</div>
              <div className="text-sm text-white/80">Taux de commission</div>
            </div>
          </div>
        </div>
      </div>

      {/* Benefits Section */}
      <div className="container mx-auto px-4 max-w-4xl py-12">
        <h2 className="font-playfair text-2xl md:text-3xl font-bold text-gray-900 mb-6">
          Pourquoi rejoindre Simone ?
        </h2>
        <div className="grid md:grid-cols-2 gap-6 mb-12">
          <div className="bg-white rounded-lg p-6 shadow-sm border border-gray-100 hover:border-button-primary/20 transition-colors">
            <div className="w-12 h-12 bg-button-primary/10 rounded-lg flex items-center justify-center mb-4">
              <DollarSign className="w-6 h-6 text-button-primary" strokeWidth={2} />
            </div>
            <h3 className="font-semibold text-lg mb-2">Revenus attractifs</h3>
            <p className="text-gray-600">Commission de seulement 15% sur vos prestations</p>
          </div>
          <div className="bg-white rounded-lg p-6 shadow-sm border border-gray-100 hover:border-button-primary/20 transition-colors">
            <div className="w-12 h-12 bg-button-primary/10 rounded-lg flex items-center justify-center mb-4">
              <Calendar className="w-6 h-6 text-button-primary" strokeWidth={2} />
            </div>
            <h3 className="font-semibold text-lg mb-2">Flexibilité totale</h3>
            <p className="text-gray-600">Gérez votre planning selon vos disponibilités</p>
          </div>
          <div className="bg-white rounded-lg p-6 shadow-sm border border-gray-100 hover:border-button-primary/20 transition-colors">
            <div className="w-12 h-12 bg-button-primary/10 rounded-lg flex items-center justify-center mb-4">
              <Target className="w-6 h-6 text-button-primary" strokeWidth={2} />
            </div>
            <h3 className="font-semibold text-lg mb-2">Clients qualifiés</h3>
            <p className="text-gray-600">Accédez à une clientèle premium pré-qualifiée</p>
          </div>
          <div className="bg-white rounded-lg p-6 shadow-sm border border-gray-100 hover:border-button-primary/20 transition-colors">
            <div className="w-12 h-12 bg-button-primary/10 rounded-lg flex items-center justify-center mb-4">
              <Shield className="w-6 h-6 text-button-primary" strokeWidth={2} />
            </div>
            <h3 className="font-semibold text-lg mb-2">Paiements sécurisés</h3>
            <p className="text-gray-600">Recevez vos paiements rapidement via Stripe</p>
          </div>
        </div>
      </div>

      {/* Application Form */}
      <div className="container mx-auto px-4 max-w-4xl pb-16">
        <div className="bg-white rounded-lg shadow-lg p-8">
          <h2 className="font-playfair text-2xl md:text-3xl font-bold text-gray-900 mb-2">
            Postuler maintenant
          </h2>
          <p className="text-gray-600 mb-8">
            Remplissez le formulaire ci-dessous en 5 étapes simples
          </p>
          
          <ApplicationForm />
        </div>
      </div>
    </div>
  )
}
