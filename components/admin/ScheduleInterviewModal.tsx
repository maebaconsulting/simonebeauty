'use client'

/**
 * Schedule Interview Modal
 * Task: T036 - Interview scheduling modal with date/time picker and mode selection
 * Feature: 007-contractor-interface
 */

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { X, Calendar, Video, Phone, Users } from 'lucide-react'
import { InterviewMode } from '@/types/contractor'

interface ScheduleInterviewModalProps {
  isOpen: boolean
  onClose: () => void
  onSchedule: (data: {
    interviewDate: string
    interviewMode: InterviewMode
    interviewNotes?: string
  }) => Promise<void>
  candidateName: string
}

export function ScheduleInterviewModal({
  isOpen,
  onClose,
  onSchedule,
  candidateName
}: ScheduleInterviewModalProps) {
  const [interviewDate, setInterviewDate] = useState('')
  const [interviewTime, setInterviewTime] = useState('')
  const [interviewMode, setInterviewMode] = useState<InterviewMode>('video')
  const [interviewNotes, setInterviewNotes] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)

  const interviewModes: { value: InterviewMode, label: string, icon: any }[] = [
    { value: 'video', label: 'Visioconférence', icon: Video },
    { value: 'phone', label: 'Téléphone', icon: Phone },
    { value: 'in_person', label: 'En personne', icon: Users },
  ]

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!interviewDate || !interviewTime) {
      alert('Veuillez sélectionner une date et une heure.')
      return
    }

    setIsSubmitting(true)

    try {
      // Combine date and time into ISO string
      const dateTime = new Date(`${interviewDate}T${interviewTime}`)

      await onSchedule({
        interviewDate: dateTime.toISOString(),
        interviewMode,
        interviewNotes: interviewNotes.trim() || undefined,
      })

      // Reset form
      setInterviewDate('')
      setInterviewTime('')
      setInterviewMode('video')
      setInterviewNotes('')
      onClose()
    } catch (error) {
      console.error('Error scheduling interview:', error)
      const errorMessage = error instanceof Error ? error.message : 'Erreur inconnue'
      const isDev = process.env.NODE_ENV === 'development'
      alert(
        isDev
          ? `Erreur lors de la planification de l'entretien:\n\n${errorMessage}`
          : 'Erreur lors de la planification de l\'entretien.'
      )
    } finally {
      setIsSubmitting(false)
    }
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
      <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div>
            <h2 className="text-xl font-semibold text-gray-900 flex items-center gap-2">
              <Calendar className="w-5 h-5" />
              Planifier un entretien
            </h2>
            <p className="text-sm text-gray-600 mt-1">
              Pour: <strong>{candidateName}</strong>
            </p>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
            disabled={isSubmitting}
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {/* Date and Time */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label htmlFor="interview-date" className="block text-sm font-medium text-gray-700 mb-2">
                Date de l'entretien *
              </label>
              <input
                type="date"
                id="interview-date"
                value={interviewDate}
                onChange={(e) => setInterviewDate(e.target.value)}
                min={new Date().toISOString().split('T')[0]}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-button-primary focus:border-transparent"
                required
              />
            </div>

            <div>
              <label htmlFor="interview-time" className="block text-sm font-medium text-gray-700 mb-2">
                Heure *
              </label>
              <input
                type="time"
                id="interview-time"
                value={interviewTime}
                onChange={(e) => setInterviewTime(e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-button-primary focus:border-transparent"
                required
              />
            </div>
          </div>

          {/* Interview Mode */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-3">
              Mode d'entretien *
            </label>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              {interviewModes.map(mode => {
                const Icon = mode.icon
                return (
                  <button
                    key={mode.value}
                    type="button"
                    onClick={() => setInterviewMode(mode.value)}
                    className={`p-4 border-2 rounded-lg transition-all ${
                      interviewMode === mode.value
                        ? 'border-button-primary bg-blue-50 text-button-primary'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    <Icon className={`w-6 h-6 mx-auto mb-2 ${
                      interviewMode === mode.value ? 'text-button-primary' : 'text-gray-400'
                    }`} />
                    <p className={`text-sm font-medium ${
                      interviewMode === mode.value ? 'text-button-primary' : 'text-gray-700'
                    }`}>
                      {mode.label}
                    </p>
                  </button>
                )
              })}
            </div>
          </div>

          {/* Notes */}
          <div>
            <label htmlFor="interview-notes" className="block text-sm font-medium text-gray-700 mb-2">
              Notes internes (optionnel)
            </label>
            <textarea
              id="interview-notes"
              value={interviewNotes}
              onChange={(e) => setInterviewNotes(e.target.value)}
              rows={4}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-button-primary focus:border-transparent resize-none"
              placeholder="Sujets à aborder, informations complémentaires..."
            />
          </div>

          {/* Info Box */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <p className="text-sm text-blue-800">
              ℹ️ <strong>Information:</strong> Un email de confirmation sera automatiquement envoyé au candidat avec une invitation calendrier (.ics).
            </p>
          </div>

          {/* Actions */}
          <div className="flex gap-3 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              disabled={isSubmitting}
              className="flex-1"
            >
              Annuler
            </Button>
            <Button
              type="submit"
              disabled={isSubmitting}
              className="flex-1 bg-button-primary hover:bg-button-primary/90 text-white"
            >
              {isSubmitting ? 'Planification en cours...' : 'Planifier l\'entretien'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  )
}
