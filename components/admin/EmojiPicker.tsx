'use client'

/**
 * Emoji Picker Component
 * Feature: 017-image-management (Category extension)
 *
 * Simple emoji picker for category/subcategory icons
 */

import { useState } from 'react'
import { Check } from 'lucide-react'
import { Button } from '@/components/ui/button'

// Curated list of emojis commonly used for service categories
const EMOJI_CATEGORIES = {
  'Beauté & Soins': [
    '💅', '💇', '💆', '🧖', '💄', '🪮', '🧴', '✨', '💎', '🌸',
    '🌺', '🌹', '🦋', '🎀', '👗', '👠', '💍', '🪷', '🌷', '🦚'
  ],
  'Santé & Bien-être': [
    '💪', '🧘', '🤸', '🏃', '🚴', '⛹️', '🧎', '🧍', '❤️', '🫀',
    '🧠', '🦴', '🫁', '🩺', '💊', '🩹', '🧬', '🔬', '⚕️', '🌿'
  ],
  'Maison & Services': [
    '🏠', '🏡', '🏘️', '🏚️', '🏗️', '🔨', '🔧', '🪛', '🪚', '🪜',
    '🧹', '🧺', '🧼', '🧽', '🪣', '🧴', '🔑', '🚪', '🪟', '🛋️'
  ],
  'Animaux & Pets': [
    '🐕', '🐶', '🐩', '🐈', '🐱', '🦮', '🐕‍🦺', '🐾', '🦴', '🐟',
    '🐠', '🐡', '🐦', '🦜', '🦩', '🐰', '🐹', '🐭', '🐎', '🦄'
  ],
  'Éducation & Formation': [
    '📚', '📖', '📝', '✏️', '🖊️', '🖍️', '📔', '📕', '📗', '📘',
    '📙', '🎓', '🧑‍🎓', '🧑‍🏫', '📐', '📏', '🧮', '🔢', '🔡', '💡'
  ],
  'Art & Créativité': [
    '🎨', '🖌️', '🖍️', '✏️', '🖊️', '🖼️', '🎭', '🎪', '🎬', '🎤',
    '🎧', '🎵', '🎶', '🎼', '🎹', '🎸', '🎺', '🎻', '🥁', '🎷'
  ],
  'Technologie': [
    '💻', '🖥️', '⌨️', '🖱️', '🖨️', '📱', '📲', '☎️', '📞', '📟',
    '📠', '🔌', '🔋', '💾', '💿', '📀', '🖲️', '🕹️', '📡', '🛰️'
  ],
  'Symboles génériques': [
    '⭐', '✨', '💫', '🌟', '⚡', '🔥', '💧', '☀️', '🌙', '⛅',
    '🌈', '☁️', '💨', '🍀', '🌱', '🌳', '🍃', '🌾', '🔆', '✅'
  ]
}

interface EmojiPickerProps {
  currentEmoji?: string
  onSelect: (emoji: string) => void
  onClose: () => void
}

export function EmojiPicker({ currentEmoji, onSelect, onClose }: EmojiPickerProps) {
  const [selectedCategory, setSelectedCategory] = useState<string>(
    Object.keys(EMOJI_CATEGORIES)[0]
  )

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[80vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="px-6 py-4 border-b flex items-center justify-between">
          <div>
            <h2 className="text-xl font-bold text-gray-900">Choisir une icône</h2>
            <p className="text-sm text-gray-500 mt-1">
              Sélectionnez un emoji pour représenter cette catégorie
            </p>
          </div>
          <Button variant="outline" size="sm" onClick={onClose}>
            Fermer
          </Button>
        </div>

        {/* Category Tabs */}
        <div className="px-6 py-3 border-b overflow-x-auto">
          <div className="flex gap-2">
            {Object.keys(EMOJI_CATEGORIES).map((category) => (
              <button
                key={category}
                onClick={() => setSelectedCategory(category)}
                className={`px-3 py-1.5 text-sm font-medium rounded-lg whitespace-nowrap transition-colors ${
                  selectedCategory === category
                    ? 'bg-purple-100 text-purple-700'
                    : 'text-gray-600 hover:bg-gray-100'
                }`}
              >
                {category}
              </button>
            ))}
          </div>
        </div>

        {/* Emoji Grid */}
        <div className="flex-1 overflow-y-auto p-6">
          <div className="grid grid-cols-8 sm:grid-cols-10 md:grid-cols-12 gap-2">
            {EMOJI_CATEGORIES[selectedCategory as keyof typeof EMOJI_CATEGORIES].map((emoji) => (
              <button
                key={emoji}
                onClick={() => {
                  onSelect(emoji)
                  onClose()
                }}
                className={`
                  relative aspect-square flex items-center justify-center text-3xl
                  rounded-lg border-2 transition-all hover:scale-110 hover:shadow-lg
                  ${
                    currentEmoji === emoji
                      ? 'border-purple-500 bg-purple-50 shadow-md'
                      : 'border-gray-200 hover:border-purple-300 bg-white'
                  }
                `}
                title={emoji}
              >
                {emoji}
                {currentEmoji === emoji && (
                  <div className="absolute -top-1 -right-1 bg-purple-600 rounded-full p-0.5">
                    <Check className="h-3 w-3 text-white" />
                  </div>
                )}
              </button>
            ))}
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t bg-gray-50">
          <p className="text-xs text-gray-500">
            💡 Astuce : Choisissez un emoji qui représente visuellement votre catégorie
            pour améliorer l'expérience utilisateur
          </p>
        </div>
      </div>
    </div>
  )
}
