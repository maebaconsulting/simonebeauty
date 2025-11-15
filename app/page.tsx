'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useUser } from '@/hooks/useUser'
import { createClient } from '@/lib/supabase/client'
import Link from 'next/link'
import { Search, MapPin, Home, Building2, Scissors, Hand, User, Eye, HeartPulse, Droplet, ArrowRight } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { LoginModal } from '@/components/auth/LoginModal'
import { SignupModal } from '@/components/auth/SignupModal'
import { ForgotPasswordModal } from '@/components/auth/ForgotPasswordModal'

export default function HomePage() {
  const { user, profile, isLoading } = useUser()
  const [loginModalOpen, setLoginModalOpen] = useState(false)
  const [signupModalOpen, setSignupModalOpen] = useState(false)
  const [forgotPasswordModalOpen, setForgotPasswordModalOpen] = useState(false)

  const router = useRouter()
  const supabase = createClient()

  // Show loading state
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#E97B6E] mx-auto mb-4"></div>
          <p className="text-muted-foreground">Chargement...</p>
        </div>
      </div>
    )
  }

  // Handle logout
  const handleLogout = async () => {
    await supabase.auth.signOut()
    router.refresh()
  }

  return (
    <div className="min-h-screen bg-white">
      {/* Header - Semi-transparent avec blur */}
      <header className="sticky top-0 z-50 bg-black/40 backdrop-blur-md text-white border-b border-white/10">
        <div className="container mx-auto px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            {/* Logo */}
            <Link href="/" className="text-2xl font-playfair italic font-light">
              Simone
            </Link>

            {/* Navigation Desktop - Centrée */}
            <nav className="hidden lg:flex items-center space-x-8 absolute left-1/2 transform -translate-x-1/2">
              <Link href="/" className="text-white hover:text-white/80 transition-colors text-sm">
                Accueil
              </Link>
              <Link href="/services" className="text-white hover:text-white/80 transition-colors text-sm">
                Services
              </Link>
              <Link href="/instituts" className="text-white hover:text-white/80 transition-colors text-sm">
                Instituts
              </Link>
              <Link href="/entreprise" className="text-white hover:text-white/80 transition-colors text-sm">
                Entreprise
              </Link>
              <Link href="/evenement" className="text-white hover:text-white/80 transition-colors text-sm">
                Événement
              </Link>
              <Link href="/rejoindre-simone" className="text-white hover:text-white/80 transition-colors text-sm">
                Devenir expert
              </Link>
            </nav>

            {/* Auth Buttons */}
            <div className="flex items-center space-x-3">
              {user && profile ? (
                <Button
                  variant="ghost"
                  className="text-white hover:bg-white/10 text-sm font-normal"
                  onClick={handleLogout}
                >
                  Se déconnecter
                </Button>
              ) : (
                <>
                  <Button
                    variant="ghost"
                    className="text-white hover:bg-white/10 text-sm font-normal"
                    onClick={() => setLoginModalOpen(true)}
                  >
                    Se connecter
                  </Button>
                  <Button
                    className="bg-[#E97B6E] hover:bg-[#E97B6E]/90 text-white rounded-lg px-6 text-sm font-normal"
                    onClick={() => setSignupModalOpen(true)}
                  >
                    S'inscrire
                  </Button>
                </>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative min-h-[600px] flex items-center justify-center bg-gradient-to-br from-gray-900 to-gray-800 text-white overflow-hidden">
        {/* Background overlay */}
        <div className="absolute inset-0 bg-black/50 z-10"></div>

        <div className="container mx-auto px-6 lg:px-8 relative z-20 py-20">
          <div className="max-w-4xl mx-auto text-center">
            {/* Titre principal */}
            <h1 className="font-playfair text-4xl md:text-5xl lg:text-6xl font-normal mb-6 leading-tight">
              Beauté & bien-être<br />à domicile et au bureau
            </h1>

            {/* Sous-titre */}
            <p className="text-lg md:text-xl text-white/80 mb-12 font-light">
              Des services professionnels directement chez vous, 7j/7.
            </p>

            {/* Search Card */}
            <div className="bg-white rounded-2xl p-8 md:p-10 shadow-2xl max-w-3xl mx-auto">
              {/* Onglets */}
              <div className="flex gap-6 mb-8 border-b border-gray-200">
                <button className="flex items-center gap-2 pb-4 border-b-2 border-[#E97B6E] text-[#E97B6E] font-medium">
                  <Home className="h-5 w-5" />
                  <span>À domicile</span>
                </button>
                <button className="flex items-center gap-2 pb-4 border-b-2 border-transparent text-gray-600 hover:text-gray-900 font-medium">
                  <Building2 className="h-5 w-5" />
                  <span>En institut</span>
                </button>
              </div>

              {/* Champs de recherche */}
              <div className="space-y-4 mb-6">
                <div className="relative">
                  <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                  <Input
                    placeholder="Rechercher une prestation..."
                    className="pl-12 h-14 rounded-xl border-gray-200 text-base"
                  />
                </div>

                <div className="relative">
                  <MapPin className="absolute left-4 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                  <Input
                    placeholder="Localisation..."
                    className="pl-12 h-14 rounded-xl border-gray-200 text-base"
                  />
                </div>
              </div>

              {/* Boutons CTA */}
              <div className="flex flex-col sm:flex-row gap-4">
                <Link href="/booking/services" className="flex-1">
                  <Button className="w-full bg-[#E97B6E] hover:bg-[#E97B6E]/90 text-white h-14 rounded-xl text-base font-medium">
                    Réserver un service
                  </Button>
                </Link>
                <Link href="/services" className="flex-1">
                  <Button variant="outline" className="w-full h-14 rounded-xl text-base font-medium border-2">
                    Découvrir nos services
                  </Button>
                </Link>
              </div>
            </div>

            {/* Statistiques */}
            <div className="grid grid-cols-3 gap-8 mt-16 max-w-2xl mx-auto">
              <div className="text-center">
                <div className="text-3xl md:text-4xl font-bold mb-2">7j/7</div>
                <div className="text-sm text-white/70">Disponible</div>
              </div>
              <div className="text-center">
                <div className="text-3xl md:text-4xl font-bold mb-2">2h</div>
                <div className="text-sm text-white/70">Délai moyen</div>
              </div>
              <div className="text-center">
                <div className="text-3xl md:text-4xl font-bold mb-2">100%</div>
                <div className="text-sm text-white/70">À domicile</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Section Catégories */}
      <section className="py-20 px-6 lg:px-8 bg-white">
        <div className="container mx-auto max-w-7xl">
          <h2 className="font-playfair text-3xl md:text-4xl font-normal text-center text-gray-900 mb-12">
            Catégories de services
          </h2>

          <div className="flex flex-wrap justify-center gap-4">
            <button className="flex items-center gap-2 px-6 py-3 rounded-full border border-gray-200 hover:border-gray-300 hover:shadow-sm transition-all bg-white">
              <Scissors className="h-5 w-5 text-gray-600" />
              <span className="text-sm font-medium">COIFFURE</span>
            </button>
            <button className="flex items-center gap-2 px-6 py-3 rounded-full border border-gray-200 hover:border-gray-300 hover:shadow-sm transition-all bg-white">
              <Hand className="h-5 w-5 text-gray-600" />
              <span className="text-sm font-medium">BEAUTÉ DES ONGLES</span>
            </button>
            <button className="flex items-center gap-2 px-6 py-3 rounded-full border border-gray-200 hover:border-gray-300 hover:shadow-sm transition-all bg-white">
              <User className="h-5 w-5 text-gray-600" />
              <span className="text-sm font-medium">LE VISAGE</span>
            </button>
            <button className="flex items-center gap-2 px-6 py-3 rounded-full border border-gray-200 hover:border-gray-300 hover:shadow-sm transition-all bg-white">
              <Eye className="h-5 w-5 text-gray-600" />
              <span className="text-sm font-medium">LE REGARD</span>
            </button>
            <button className="flex items-center gap-2 px-6 py-3 rounded-full border border-gray-200 hover:border-gray-300 hover:shadow-sm transition-all bg-white">
              <HeartPulse className="h-5 w-5 text-gray-600" />
              <span className="text-sm font-medium">MASSAGE BIEN-ÊTRE</span>
            </button>
            <button className="flex items-center gap-2 px-6 py-3 rounded-full border border-gray-200 hover:border-gray-300 hover:shadow-sm transition-all bg-white">
              <Droplet className="h-5 w-5 text-gray-600" />
              <span className="text-sm font-medium">MINCEUR & DRAINAGE</span>
            </button>
          </div>
        </div>
      </section>

      {/* Section Nos Services */}
      <section className="py-20 px-6 lg:px-8 bg-gray-50">
        <div className="container mx-auto max-w-7xl">
          <h2 className="font-playfair text-3xl md:text-4xl font-normal text-center text-gray-900 mb-4">
            Nos services
          </h2>
          <p className="text-center text-gray-600 mb-16 max-w-2xl mx-auto">
            Des services de beauté et bien-être professionnels directement chez vous
          </p>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {[
              { title: 'COIFFURE', description: 'Services de coiffure professionnels directement chez vous' },
              { title: 'BEAUTÉ DES ONGLES', description: 'Soins complets des ongles à domicile' },
              { title: 'LE VISAGE', description: 'Soins du visage personnalisés' },
              { title: 'LE REGARD', description: 'Soins du regard à domicile' },
              { title: 'MASSAGE BIEN-ÊTRE', description: 'Massages relaxants et thérapeutiques' },
              { title: 'MINCEUR & DRAINAGE', description: 'Massages drainants et soins minceur' }
            ].map((service, index) => (
              <div key={index} className="bg-white rounded-xl border border-gray-200 overflow-hidden hover:shadow-lg transition-shadow">
                <div className="h-48 bg-gradient-to-br from-gray-100 to-gray-200"></div>
                <div className="p-6">
                  <h3 className="font-playfair text-2xl font-normal mb-3 text-gray-900">{service.title}</h3>
                  <p className="text-gray-600 text-sm mb-6 leading-relaxed">{service.description}</p>
                  <Link href="/services">
                    <Button variant="outline" className="border-black text-black hover:bg-black hover:text-white rounded-lg">
                      En savoir plus
                      <ArrowRight className="ml-2 h-4 w-4" />
                    </Button>
                  </Link>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Newsletter Section */}
      <section className="py-20 px-6 lg:px-8 bg-black text-white">
        <div className="container mx-auto max-w-4xl text-center">
          <h2 className="font-playfair text-3xl md:text-4xl font-normal mb-4">
            Votre beauté révélée dans le confort de chez vous
          </h2>
          <p className="text-gray-400 mb-12 text-lg">
            Restez connecté avec nos dernières réalisations et actualités beauté
          </p>

          <div className="flex flex-col sm:flex-row gap-4 max-w-xl mx-auto">
            <Input
              type="email"
              placeholder="Votre email"
              className="flex-1 h-14 rounded-full bg-gray-800 border-gray-700 text-white placeholder:text-gray-500 px-6"
            />
            <Button className="bg-white text-black hover:bg-gray-100 h-14 rounded-full px-8 font-medium">
              S'abonner
            </Button>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-black text-gray-400 py-16 px-6 lg:px-8">
        <div className="container mx-auto max-w-7xl">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-12 mb-12">
            {/* Colonne 1 - Branding */}
            <div>
              <div className="text-white text-2xl font-playfair italic mb-4">Simone</div>
              <p className="text-sm leading-relaxed mb-6">
                L'excellence beauté et bien-être à domicile. Des services premium pour révéler votre beauté naturelle.
              </p>
            </div>

            {/* Colonne 2 - Navigation */}
            <div>
              <h4 className="text-white font-semibold mb-4">Navigation</h4>
              <ul className="space-y-3 text-sm">
                <li><Link href="/about" className="hover:text-white transition-colors">À propos</Link></li>
                <li><Link href="/services" className="hover:text-white transition-colors">Nos services</Link></li>
                <li><Link href="/evenements" className="hover:text-white transition-colors">Événements</Link></li>
                <li><Link href="/contact" className="hover:text-white transition-colors">Contact</Link></li>
              </ul>
            </div>

            {/* Colonne 3 - Contact */}
            <div>
              <h4 className="text-white font-semibold mb-4">Contact</h4>
              <ul className="space-y-3 text-sm">
                <li>contact@simone.paris</li>
                <li>60 RUE FRANCOIS I ER<br />75008 PARIS France</li>
              </ul>
            </div>
          </div>

          {/* Footer Bottom */}
          <div className="border-t border-gray-800 pt-8 flex flex-col md:flex-row justify-between items-center gap-4 text-sm">
            <div className="text-gray-600">
              © 2025 Simone. Tous droits réservés
            </div>
            <div className="flex gap-4 text-gray-600">
              <Link href="/legal/privacy" className="hover:text-white">Confidentialité</Link>
              <span>|</span>
              <Link href="/legal/cookies" className="hover:text-white">Cookies</Link>
              <span>|</span>
              <Link href="/legal/terms" className="hover:text-white">CGU</Link>
              <span>|</span>
              <Link href="/legal/mentions" className="hover:text-white">Mentions légales</Link>
            </div>
            <div className="flex gap-3">
              <Link href="/rejoindre-simone">
                <Button variant="outline" size="sm" className="border-white text-white hover:bg-white hover:text-black rounded-lg">
                  Devenir expert
                </Button>
              </Link>
              <Link href="/entreprise">
                <Button variant="outline" size="sm" className="border-white text-white hover:bg-white hover:text-black rounded-lg">
                  Entreprise
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </footer>

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
