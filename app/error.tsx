'use client'

import { useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { AlertCircle } from 'lucide-react'

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    console.error('Application error:', error)
  }, [error])

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <Card className="max-w-md w-full p-8">
        <div className="text-center">
          <AlertCircle className="w-16 h-16 text-red-600 mx-auto mb-4" />
          <h2 className="font-playfair text-2xl font-bold text-gray-900 mb-2">
            Une erreur est survenue
          </h2>
          <p className="text-gray-600 mb-6">
            Désolé, quelque chose s'est mal passé. Veuillez réessayer.
          </p>
          {error.digest && (
            <p className="text-xs text-gray-500 mb-4 font-mono">
              Référence: {error.digest}
            </p>
          )}
          <div className="flex gap-3 justify-center">
            <Button onClick={() => reset()} variant="default">
              Réessayer
            </Button>
            <Button onClick={() => window.location.href = '/'} variant="outline">
              Retour à l'accueil
            </Button>
          </div>
        </div>
      </Card>
    </div>
  )
}
