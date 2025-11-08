import Link from 'next/link'
import { Facebook, Instagram, Twitter, Linkedin } from 'lucide-react'

export function Footer() {
  return (
    <footer className="bg-gray-900 text-white py-16">
      <div className="container mx-auto px-4">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-12 mb-12">
          {/* Brand */}
          <div>
            <Link href="/" className="font-playfair text-3xl font-light italic inline-block mb-4">
              Simone
            </Link>
            <p className="text-gray-400 mb-6">
              Des services de beauté et bien-être professionnels directement chez vous, 7j/7.
            </p>
            {/* Social Links */}
            <div className="flex gap-4">
              <a
                href="#"
                className="w-10 h-10 rounded-full bg-white/10 hover:bg-button-primary flex items-center justify-center transition-colors"
                aria-label="Facebook"
              >
                <Facebook className="w-5 h-5" />
              </a>
              <a
                href="#"
                className="w-10 h-10 rounded-full bg-white/10 hover:bg-button-primary flex items-center justify-center transition-colors"
                aria-label="Instagram"
              >
                <Instagram className="w-5 h-5" />
              </a>
              <a
                href="#"
                className="w-10 h-10 rounded-full bg-white/10 hover:bg-button-primary flex items-center justify-center transition-colors"
                aria-label="Twitter"
              >
                <Twitter className="w-5 h-5" />
              </a>
              <a
                href="#"
                className="w-10 h-10 rounded-full bg-white/10 hover:bg-button-primary flex items-center justify-center transition-colors"
                aria-label="LinkedIn"
              >
                <Linkedin className="w-5 h-5" />
              </a>
            </div>
          </div>

          {/* Services */}
          <div>
            <h3 className="font-semibold text-lg mb-4">Services</h3>
            <ul className="space-y-2">
              <li>
                <Link href="/services/coiffure" className="text-gray-400 hover:text-white transition-colors">
                  Coiffure
                </Link>
              </li>
              <li>
                <Link href="/services/ongles" className="text-gray-400 hover:text-white transition-colors">
                  Beauté des ongles
                </Link>
              </li>
              <li>
                <Link href="/services/visage" className="text-gray-400 hover:text-white transition-colors">
                  Soins du visage
                </Link>
              </li>
              <li>
                <Link href="/services/massage" className="text-gray-400 hover:text-white transition-colors">
                  Massage bien-être
                </Link>
              </li>
              <li>
                <Link href="/services/minceur" className="text-gray-400 hover:text-white transition-colors">
                  Minceur & drainage
                </Link>
              </li>
            </ul>
          </div>

          {/* Company */}
          <div>
            <h3 className="font-semibold text-lg mb-4">Entreprise</h3>
            <ul className="space-y-2">
              <li>
                <Link href="/about" className="text-gray-400 hover:text-white transition-colors">
                  À propos
                </Link>
              </li>
              <li>
                <Link href="/devenir-expert" className="text-gray-400 hover:text-white transition-colors">
                  Devenir expert
                </Link>
              </li>
              <li>
                <Link href="/entreprise" className="text-gray-400 hover:text-white transition-colors">
                  Solutions entreprise
                </Link>
              </li>
              <li>
                <Link href="/evenement" className="text-gray-400 hover:text-white transition-colors">
                  Événements
                </Link>
              </li>
              <li>
                <Link href="/blog" className="text-gray-400 hover:text-white transition-colors">
                  Blog
                </Link>
              </li>
            </ul>
          </div>

          {/* Legal */}
          <div>
            <h3 className="font-semibold text-lg mb-4">Informations</h3>
            <ul className="space-y-2">
              <li>
                <Link href="/contact" className="text-gray-400 hover:text-white transition-colors">
                  Contact
                </Link>
              </li>
              <li>
                <Link href="/faq" className="text-gray-400 hover:text-white transition-colors">
                  FAQ
                </Link>
              </li>
              <li>
                <Link href="/cgv" className="text-gray-400 hover:text-white transition-colors">
                  CGV
                </Link>
              </li>
              <li>
                <Link href="/mentions-legales" className="text-gray-400 hover:text-white transition-colors">
                  Mentions légales
                </Link>
              </li>
              <li>
                <Link href="/confidentialite" className="text-gray-400 hover:text-white transition-colors">
                  Politique de confidentialité
                </Link>
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="border-t border-gray-800 pt-8">
          <div className="flex flex-col md:flex-row justify-between items-center gap-4">
            <p className="text-gray-400 text-sm">
              © {new Date().getFullYear()} Simone Paris. Tous droits réservés.
            </p>
            <div className="flex gap-6">
              <Link href="/cgv" className="text-gray-400 hover:text-white text-sm transition-colors">
                CGV
              </Link>
              <Link href="/mentions-legales" className="text-gray-400 hover:text-white text-sm transition-colors">
                Mentions légales
              </Link>
              <Link href="/confidentialite" className="text-gray-400 hover:text-white text-sm transition-colors">
                Confidentialité
              </Link>
            </div>
          </div>
        </div>
      </div>
    </footer>
  )
}
