'use client'

/**
 * Image Dropzone Component
 * Feature: 017-image-management
 * SpecKit: US0 - Admin Image Management for Services
 *
 * Drag-and-drop image upload interface with:
 * - File validation (format, size)
 * - Multiple file support (up to max limit)
 * - Progress indication
 * - Preview of selected files
 */

import { useCallback, useState } from 'react'
import { useDropzone } from 'react-dropzone'
import { Upload, X, Image as ImageIcon, AlertCircle } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useImageUpload, type ImageUploadOptions } from '@/hooks/useImageUpload'
import type { EntityType } from '@/lib/validations/image-schemas'
import { SUPPORTED_IMAGE_FORMATS, MAX_FILE_SIZE_BYTES } from '@/lib/validations/image-schemas'

interface ImageDropzoneProps {
  entityType: EntityType
  entityId: number
  maxImages?: number
  currentImageCount?: number
  onUploadComplete?: (uploadedImages: any[]) => void
  onUploadError?: (error: string) => void
}

interface SelectedFile {
  file: File
  preview: string
  status: 'pending' | 'uploading' | 'success' | 'error'
  progress: number
  error?: string
}

export function ImageDropzone({
  entityType,
  entityId,
  maxImages = 10,
  currentImageCount = 0,
  onUploadComplete,
  onUploadError
}: ImageDropzoneProps) {
  const [selectedFiles, setSelectedFiles] = useState<SelectedFile[]>([])
  const { upload, isUploading } = useImageUpload()

  const remainingSlots = maxImages - currentImageCount

  const onDrop = useCallback((acceptedFiles: File[]) => {
    // Check if we have remaining slots
    if (acceptedFiles.length > remainingSlots) {
      const error = `Vous ne pouvez ajouter que ${remainingSlots} image(s) supplémentaire(s)`
      onUploadError?.(error)
      return
    }

    // Create preview URLs for accepted files
    const newFiles: SelectedFile[] = acceptedFiles.map((file) => ({
      file,
      preview: URL.createObjectURL(file),
      status: 'pending' as const,
      progress: 0
    }))

    setSelectedFiles((prev) => [...prev, ...newFiles])
  }, [remainingSlots, onUploadError])

  const { getRootProps, getInputProps, isDragActive, fileRejections } = useDropzone({
    onDrop,
    accept: {
      'image/jpeg': ['.jpg', '.jpeg'],
      'image/png': ['.png'],
      'image/webp': ['.webp']
    },
    maxSize: MAX_FILE_SIZE_BYTES,
    maxFiles: remainingSlots,
    disabled: isUploading || remainingSlots === 0
  })

  const removeFile = (index: number) => {
    setSelectedFiles((prev) => {
      const newFiles = [...prev]
      // Revoke preview URL to avoid memory leaks
      URL.revokeObjectURL(newFiles[index].preview)
      newFiles.splice(index, 1)
      return newFiles
    })
  }

  const uploadFiles = async () => {
    const uploadResults: any[] = []

    for (let i = 0; i < selectedFiles.length; i++) {
      const selectedFile = selectedFiles[i]

      // Update status to uploading
      setSelectedFiles((prev) => {
        const newFiles = [...prev]
        newFiles[i].status = 'uploading'
        return newFiles
      })

      try {
        const options: ImageUploadOptions = {
          file: selectedFile.file,
          entityType,
          entityId,
          isPrimary: currentImageCount === 0 && i === 0 // First image is primary if no existing images
        }

        const result = await upload(options)

        if (result.success && result.data) {
          uploadResults.push(result.data)
          setSelectedFiles((prev) => {
            const newFiles = [...prev]
            newFiles[i].status = 'success'
            newFiles[i].progress = 100
            return newFiles
          })
        } else {
          throw new Error(result.error?.message || 'Upload échoué')
        }
      } catch (error: any) {
        setSelectedFiles((prev) => {
          const newFiles = [...prev]
          newFiles[i].status = 'error'
          newFiles[i].error = error.message
          return newFiles
        })
      }
    }

    // Call completion callback with successful uploads
    if (uploadResults.length > 0) {
      onUploadComplete?.(uploadResults)
    }

    // Clear successful uploads after a delay
    setTimeout(() => {
      setSelectedFiles((prev) => prev.filter((f) => f.status !== 'success'))
    }, 2000)
  }

  const clearAll = () => {
    selectedFiles.forEach((file) => URL.revokeObjectURL(file.preview))
    setSelectedFiles([])
  }

  return (
    <div className="space-y-4">
      {/* Dropzone Area */}
      <div
        {...getRootProps()}
        className={`
          border-2 border-dashed rounded-lg p-8 text-center cursor-pointer
          transition-colors duration-200
          ${isDragActive ? 'border-blue-500 bg-blue-50' : 'border-gray-300 hover:border-gray-400'}
          ${isUploading || remainingSlots === 0 ? 'opacity-50 cursor-not-allowed' : ''}
        `}
      >
        <input {...getInputProps()} />
        <Upload className="mx-auto h-12 w-12 text-gray-400 mb-4" />

        {remainingSlots === 0 ? (
          <div className="text-red-600">
            <p className="text-sm font-medium">Limite d'images atteinte</p>
            <p className="text-xs mt-1">Vous avez déjà {maxImages} images</p>
          </div>
        ) : isDragActive ? (
          <p className="text-blue-600 font-medium">Déposez les images ici...</p>
        ) : (
          <div>
            <p className="text-sm font-medium text-gray-700 mb-1">
              Glissez-déposez des images ou cliquez pour sélectionner
            </p>
            <p className="text-xs text-gray-500">
              JPEG, PNG, WebP · Max {MAX_FILE_SIZE_BYTES / (1024 * 1024)}MB · {remainingSlots} image(s) restante(s)
            </p>
          </div>
        )}
      </div>

      {/* File Rejections */}
      {fileRejections.length > 0 && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-3">
          <div className="flex items-start gap-2">
            <AlertCircle className="h-5 w-5 text-red-600 flex-shrink-0 mt-0.5" />
            <div className="text-sm text-red-800">
              <p className="font-medium mb-1">Fichiers rejetés :</p>
              <ul className="list-disc list-inside space-y-1">
                {fileRejections.map(({ file, errors }) => (
                  <li key={file.name}>
                    {file.name} - {errors[0]?.message}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      )}

      {/* Selected Files Preview */}
      {selectedFiles.length > 0 && (
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h4 className="text-sm font-medium text-gray-700">
              {selectedFiles.length} image(s) sélectionnée(s)
            </h4>
            {!isUploading && (
              <Button
                variant="ghost"
                size="sm"
                onClick={clearAll}
                className="text-gray-500 hover:text-gray-700"
              >
                Tout effacer
              </Button>
            )}
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
            {selectedFiles.map((selectedFile, index) => (
              <div
                key={index}
                className="relative aspect-square rounded-lg overflow-hidden border-2 border-gray-200"
              >
                {/* Preview Image */}
                <img
                  src={selectedFile.preview}
                  alt={selectedFile.file.name}
                  className="w-full h-full object-cover"
                />

                {/* Status Overlay */}
                {selectedFile.status !== 'pending' && (
                  <div
                    className={`
                      absolute inset-0 flex items-center justify-center
                      ${selectedFile.status === 'uploading' ? 'bg-blue-900/70' : ''}
                      ${selectedFile.status === 'success' ? 'bg-green-900/70' : ''}
                      ${selectedFile.status === 'error' ? 'bg-red-900/70' : ''}
                    `}
                  >
                    {selectedFile.status === 'uploading' && (
                      <div className="text-white text-center">
                        <div className="text-xs font-medium">Upload...</div>
                      </div>
                    )}
                    {selectedFile.status === 'success' && (
                      <ImageIcon className="h-8 w-8 text-white" />
                    )}
                    {selectedFile.status === 'error' && (
                      <div className="text-white text-center px-2">
                        <AlertCircle className="h-6 w-6 mx-auto mb-1" />
                        <div className="text-xs">{selectedFile.error}</div>
                      </div>
                    )}
                  </div>
                )}

                {/* Remove Button */}
                {selectedFile.status === 'pending' && !isUploading && (
                  <button
                    onClick={() => removeFile(index)}
                    className="absolute top-1 right-1 p-1 bg-red-600 text-white rounded-full hover:bg-red-700 transition-colors"
                  >
                    <X className="h-4 w-4" />
                  </button>
                )}

                {/* File Name */}
                <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/70 to-transparent p-2">
                  <p className="text-white text-xs truncate">
                    {selectedFile.file.name}
                  </p>
                </div>
              </div>
            ))}
          </div>

          {/* Upload Button */}
          {selectedFiles.some((f) => f.status === 'pending') && (
            <Button
              onClick={uploadFiles}
              disabled={isUploading}
              className="w-full"
            >
              <Upload className="h-4 w-4 mr-2" />
              {isUploading ? 'Upload en cours...' : `Uploader ${selectedFiles.filter(f => f.status === 'pending').length} image(s)`}
            </Button>
          )}
        </div>
      )}
    </div>
  )
}
