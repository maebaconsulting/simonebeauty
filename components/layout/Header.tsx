'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'

interface HeaderProps {
  onLoginClick?: () => void
  onSignupClick?: () => void
}

export function Header({ onLoginClick, onSignupClick }: HeaderProps) {
  const [isMenuOpen, setIsMenuOpen] = useState(false)

  return (
    <header className="fixed top-0 left-0 right-0 z-50 bg-black/30 backdrop-blur-md">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-20">
          {/* Logo */}
          <Link href="/" className="font-playfair text-3xl text-white font-light italic">
            Simone
          </Link>

          {/* Desktop Navigation */}
          <nav className="hidden lg:flex items-center space-x-8">
            <Link href="/" className="text-white hover:text-white/80 transition-colors">
              Accueil
            </Link>
            <Link href="/services" className="text-white hover:text-white/80 transition-colors">
              Services
            </Link>
            <Link href="/instituts" className="text-white hover:text-white/80 transition-colors">
              Instituts
            </Link>
            <Link href="/entreprise" className="text-white hover:text-white/80 transition-colors">
              Entreprise
            </Link>
            <Link href="/evenement" className="text-white hover:text-white/80 transition-colors">
              Événement
            </Link>
            <Link href="/devenir-expert" className="text-white hover:text-white/80 transition-colors">
              Devenir expert
            </Link>
          </nav>

          {/* Right Side - Language & Auth */}
          <div className="hidden lg:flex items-center space-x-4">
            {/* Language Selector */}
            <button className="flex items-center space-x-2 text-white hover:text-white/80 transition-colors">
              <span className="text-xl">🇫🇷</span>
              <span>FR</span>
            </button>

            {/* Auth Buttons */}
            <button
              onClick={onLoginClick}
              className="text-white hover:text-white/80 transition-colors px-4 py-2"
            >
              Se connecter
            </button>
            <Button
              onClick={onSignupClick}
              className="bg-button-primary hover:bg-button-primary/90 text-white px-6 py-2 rounded-full"
            >
              S'inscrire
            </Button>
          </div>

          {/* Mobile Menu Button */}
          <button
            className="lg:hidden text-white p-2"
            onClick={() => setIsMenuOpen(!isMenuOpen)}
            aria-label="Menu"
          >
            <svg
              className="w-6 h-6"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              {isMenuOpen ? (
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M6 18L18 6M6 6l12 12"
                />
              ) : (
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M4 6h16M4 12h16M4 18h16"
                />
              )}
            </svg>
          </button>
        </div>

        {/* Mobile Menu */}
        {isMenuOpen && (
          <div className="lg:hidden py-4 space-y-4 animate-fade-in">
            <Link
              href="/"
              className="block text-white hover:text-white/80 transition-colors py-2"
            >
              Accueil
            </Link>
            <Link
              href="/services"
              className="block text-white hover:text-white/80 transition-colors py-2"
            >
              Services
            </Link>
            <Link
              href="/instituts"
              className="block text-white hover:text-white/80 transition-colors py-2"
            >
              Instituts
            </Link>
            <Link
              href="/entreprise"
              className="block text-white hover:text-white/80 transition-colors py-2"
            >
              Entreprise
            </Link>
            <Link
              href="/evenement"
              className="block text-white hover:text-white/80 transition-colors py-2"
            >
              Événement
            </Link>
            <Link
              href="/devenir-expert"
              className="block text-white hover:text-white/80 transition-colors py-2"
            >
              Devenir expert
            </Link>
            <div className="pt-4 space-y-2">
              <button
                onClick={onLoginClick}
                className="block w-full text-left text-white hover:text-white/80 transition-colors py-2"
              >
                Se connecter
              </button>
              <Button
                onClick={onSignupClick}
                className="w-full bg-button-primary hover:bg-button-primary/90 text-white rounded-full"
              >
                S'inscrire
              </Button>
            </div>
          </div>
        )}
      </div>
    </header>
  )
}
