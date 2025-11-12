'use client'

/**
 * Step 5: Documents Upload
 * Task: T029 - Optional file uploads with validation
 */

import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { DocumentsSchema, Documents } from '@/lib/validations/contractor-application'
import { Button } from '@/components/ui/button'
import { ArrowLeft, Upload, X } from 'lucide-react'
import { useState } from 'react'

interface Step5Props {
  initialData: Partial<Documents>
  onComplete: (data: Documents) => void
  onPrevious: () => void
  isSubmitting: boolean
  isLast: boolean
}

export function Step5Documents({ initialData, onComplete, onPrevious, isSubmitting, isLast }: Step5Props) {
  const {
    handleSubmit,
    setValue,
    formState: { errors },
  } = useForm<Documents>({
    resolver: zodResolver(DocumentsSchema),
    defaultValues: initialData,
    mode: 'onChange',
  })

  const [cvFile, setCvFile] = useState<File | null>(null)
  const [certFiles, setCertFiles] = useState<File[]>([])
  const [portfolioFiles, setPortfolioFiles] = useState<File[]>([])

  const handleCvUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      setCvFile(file)
      setValue('cv_file', file)
    }
  }

  const handleCertUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || [])
    setCertFiles(prev => [...prev, ...files])
    setValue('certifications_files', [...certFiles, ...files])
  }

  const handlePortfolioUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || [])
    setPortfolioFiles(prev => [...prev, ...files])
    setValue('portfolio_files', [...portfolioFiles, ...files])
  }

  const removeCertFile = (index: number) => {
    const newFiles = certFiles.filter((_, i) => i !== index)
    setCertFiles(newFiles)
    setValue('certifications_files', newFiles)
  }

  const removePortfolioFile = (index: number) => {
    const newFiles = portfolioFiles.filter((_, i) => i !== index)
    setPortfolioFiles(newFiles)
    setValue('portfolio_files', newFiles)
  }

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return bytes + ' B'
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB'
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB'
  }

  return (
    <form onSubmit={handleSubmit(onComplete)} className="space-y-6">
      <div>
        <h2 className="text-xl font-semibold text-gray-900 mb-4">
          Documents (optionnel)
        </h2>
        <p className="text-gray-600 mb-6">
          Ajoutez vos documents pour renforcer votre candidature
        </p>
      </div>

      {/* CV Upload */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          CV (optionnel)
        </label>
        <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-button-primary transition-colors">
          {!cvFile ? (
            <label className="cursor-pointer">
              <Upload className="w-8 h-8 text-gray-400 mx-auto mb-2" />
              <p className="text-sm text-gray-600">
                Cliquez pour télécharger votre CV
              </p>
              <p className="text-xs text-gray-500 mt-1">
                PDF, DOC, DOCX (max 5MB)
              </p>
              <input
                type="file"
                accept=".pdf,.doc,.docx"
                onChange={handleCvUpload}
                className="hidden"
              />
            </label>
          ) : (
            <div className="flex items-center justify-between bg-gray-50 p-3 rounded">
              <div className="flex items-center gap-2">
                <Upload className="w-4 h-4 text-green-600" />
                <span className="text-sm font-medium">{cvFile.name}</span>
                <span className="text-xs text-gray-500">({formatFileSize(cvFile.size)})</span>
              </div>
              <button
                type="button"
                onClick={() => setCvFile(null)}
                className="text-red-600 hover:text-red-800"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          )}
        </div>
        {errors.cv_file && (
          <p className="mt-1 text-sm text-red-600">{errors.cv_file.message as string}</p>
        )}
      </div>

      {/* Certifications Upload */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Certifications / Diplômes (optionnel)
        </label>
        <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-button-primary transition-colors">
          <label className="cursor-pointer">
            <Upload className="w-8 h-8 text-gray-400 mx-auto mb-2" />
            <p className="text-sm text-gray-600">
              Cliquez pour ajouter des certifications
            </p>
            <p className="text-xs text-gray-500 mt-1">
              PDF, DOC, DOCX (max 5MB par fichier)
            </p>
            <input
              type="file"
              accept=".pdf,.doc,.docx"
              multiple
              onChange={handleCertUpload}
              className="hidden"
            />
          </label>
        </div>
        {certFiles.length > 0 && (
          <div className="mt-3 space-y-2">
            {certFiles.map((file, index) => (
              <div key={index} className="flex items-center justify-between bg-gray-50 p-3 rounded">
                <div className="flex items-center gap-2">
                  <Upload className="w-4 h-4 text-green-600" />
                  <span className="text-sm font-medium">{file.name}</span>
                  <span className="text-xs text-gray-500">({formatFileSize(file.size)})</span>
                </div>
                <button
                  type="button"
                  onClick={() => removeCertFile(index)}
                  className="text-red-600 hover:text-red-800"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            ))}
          </div>
        )}
        {errors.certifications_files && (
          <p className="mt-1 text-sm text-red-600">{errors.certifications_files.message as string}</p>
        )}
      </div>

      {/* Portfolio Upload */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Portfolio (photos de vos réalisations - optionnel)
        </label>
        <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-button-primary transition-colors">
          <label className="cursor-pointer">
            <Upload className="w-8 h-8 text-gray-400 mx-auto mb-2" />
            <p className="text-sm text-gray-600">
              Cliquez pour ajouter des photos
            </p>
            <p className="text-xs text-gray-500 mt-1">
              JPG, PNG, WEBP (max 5MB par photo)
            </p>
            <input
              type="file"
              accept="image/jpeg,image/jpg,image/png,image/webp"
              multiple
              onChange={handlePortfolioUpload}
              className="hidden"
            />
          </label>
        </div>
        {portfolioFiles.length > 0 && (
          <div className="mt-3 grid grid-cols-2 md:grid-cols-3 gap-3">
            {portfolioFiles.map((file, index) => (
              <div key={index} className="relative group">
                <img
                  src={URL.createObjectURL(file)}
                  alt={`Portfolio ${index + 1}`}
                  className="w-full h-32 object-cover rounded-lg"
                />
                <button
                  type="button"
                  onClick={() => removePortfolioFile(index)}
                  className="absolute top-1 right-1 bg-red-600 text-white p-1 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                >
                  <X className="w-4 h-4" />
                </button>
                <p className="text-xs text-gray-500 mt-1 truncate">{file.name}</p>
              </div>
            ))}
          </div>
        )}
        {errors.portfolio_files && (
          <p className="mt-1 text-sm text-red-600">{errors.portfolio_files.message as string}</p>
        )}
      </div>

      <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mt-6">
        <p className="text-sm text-yellow-800">
          ℹ️ <strong>Note :</strong> Les documents sont optionnels mais fortement recommandés pour augmenter vos chances de validation. Vous pourrez les ajouter plus tard si nécessaire.
        </p>
      </div>

      <div className="flex justify-between pt-4">
        <Button
          type="button"
          onClick={onPrevious}
          variant="outline"
          className="px-6 py-3 rounded-full"
          disabled={isSubmitting}
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Retour
        </Button>
        <Button
          type="submit"
          disabled={isSubmitting}
          className="px-8 py-3 bg-green-600 hover:bg-green-700 text-white rounded-full"
        >
          {isSubmitting ? 'Envoi en cours...' : 'Soumettre la candidature'}
        </Button>
      </div>
    </form>
  )
}
