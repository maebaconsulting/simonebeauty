'use client'

/**
 * Alt Text Editor Component
 * Feature: 017-image-management
 * SpecKit: US0 - Admin Image Management for Services
 *
 * Modal dialog for editing image alt-text with:
 * - Manual text input with character counter
 * - AI-powered generation with OpenAI GPT-4 Vision
 * - WCAG accessibility guidelines
 * - Preview of current image
 */

import { useState, useEffect } from 'react'
import { Sparkles, Save, X, AlertCircle } from 'lucide-react'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { useAltTextGeneration } from '@/hooks/useAltTextGeneration'
import type { EntityType } from '@/lib/validations/image-schemas'

const MAX_ALT_TEXT_LENGTH = 250

interface AltTextEditorProps {
  isOpen: boolean
  onClose: () => void
  imageId: number
  entityType: EntityType
  currentAltText: string
  imagePreviewUrl?: string
  onSave: (imageId: number, newAltText: string) => void
}

export function AltTextEditor({
  isOpen,
  onClose,
  imageId,
  entityType,
  currentAltText,
  imagePreviewUrl,
  onSave
}: AltTextEditorProps) {
  const [altText, setAltText] = useState(currentAltText)
  const [hasChanges, setHasChanges] = useState(false)
  const { generate, isGenerating, error, lastGeneratedText } = useAltTextGeneration()

  // Reset state when dialog opens with new image
  useEffect(() => {
    if (isOpen) {
      setAltText(currentAltText)
      setHasChanges(false)
    }
  }, [isOpen, currentAltText])

  // Update alt-text when AI generation completes
  useEffect(() => {
    if (lastGeneratedText && isOpen) {
      setAltText(lastGeneratedText)
      setHasChanges(true)
    }
  }, [lastGeneratedText, isOpen])

  const handleAltTextChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const newValue = e.target.value
    if (newValue.length <= MAX_ALT_TEXT_LENGTH) {
      setAltText(newValue)
      setHasChanges(newValue !== currentAltText)
    }
  }

  const handleGenerateAltText = async () => {
    await generate({
      imageId,
      entityType,
      saveToDatabase: false, // Don't auto-save, let user review first
      maxLength: 125
    })
  }

  const handleSave = () => {
    if (altText.trim() && hasChanges) {
      onSave(imageId, altText.trim())
      onClose()
    }
  }

  const handleCancel = () => {
    onClose()
  }

  const remainingChars = MAX_ALT_TEXT_LENGTH - altText.length
  const isValid = altText.trim().length > 0 && altText.length <= MAX_ALT_TEXT_LENGTH

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && handleCancel()}>
      <DialogContent className="sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>Modifier le texte alternatif</DialogTitle>
          <DialogDescription>
            Le texte alternatif décrit l'image pour les utilisateurs malvoyants et les moteurs de recherche.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Image Preview */}
          {imagePreviewUrl && (
            <div className="bg-gray-100 rounded-lg p-4">
              <img
                src={imagePreviewUrl}
                alt="Aperçu"
                className="max-h-48 mx-auto rounded-lg object-contain"
              />
            </div>
          )}

          {/* AI Generation Button */}
          <div className="flex items-center justify-between">
            <p className="text-sm text-gray-600">
              Générez automatiquement un texte alternatif avec l'IA
            </p>
            <Button
              onClick={handleGenerateAltText}
              disabled={isGenerating}
              variant="outline"
              size="sm"
            >
              <Sparkles className={`h-4 w-4 mr-2 ${isGenerating ? 'animate-pulse' : ''}`} />
              {isGenerating ? 'Génération...' : 'Générer avec IA'}
            </Button>
          </div>

          {/* Error Message */}
          {error && (
            <div className="flex items-start gap-2 p-3 bg-red-50 border border-red-200 rounded-lg">
              <AlertCircle className="h-5 w-5 text-red-600 flex-shrink-0 mt-0.5" />
              <div className="text-sm text-red-800">
                <p className="font-medium">Erreur lors de la génération</p>
                <p className="mt-1">{error}</p>
              </div>
            </div>
          )}

          {/* Alt Text Input */}
          <div className="space-y-2">
            <label htmlFor="alt-text" className="text-sm font-medium text-gray-700">
              Texte alternatif
            </label>
            <textarea
              id="alt-text"
              value={altText}
              onChange={handleAltTextChange}
              rows={4}
              className={`
                w-full px-3 py-2 border rounded-lg resize-none
                focus:outline-none focus:ring-2 focus:ring-blue-500
                ${!isValid && altText.length > 0 ? 'border-red-300' : 'border-gray-300'}
              `}
              placeholder="Décrivez ce que montre l'image de manière concise et factuelle..."
            />

            {/* Character Counter */}
            <div className="flex items-center justify-between text-xs">
              <div className="text-gray-500">
                Recommandé : 125 caractères maximum pour l'accessibilité (WCAG)
              </div>
              <div className={remainingChars < 0 ? 'text-red-600 font-medium' : 'text-gray-500'}>
                {remainingChars} caractères restants
              </div>
            </div>
          </div>

          {/* Guidelines */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
            <p className="text-xs font-medium text-blue-900 mb-2">Bonnes pratiques :</p>
            <ul className="text-xs text-blue-800 space-y-1 list-disc list-inside">
              <li>Soyez concis et factuel (évitez "Image de..." ou "Photo de...")</li>
              <li>Décrivez le contenu important et le contexte</li>
              <li>Évitez les détails superflus</li>
              <li>Utilisez un langage simple et clair</li>
            </ul>
          </div>
        </div>

        <DialogFooter>
          <Button
            variant="outline"
            onClick={handleCancel}
          >
            <X className="h-4 w-4 mr-2" />
            Annuler
          </Button>
          <Button
            onClick={handleSave}
            disabled={!isValid || !hasChanges}
          >
            <Save className="h-4 w-4 mr-2" />
            Enregistrer
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
