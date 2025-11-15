'use client'

/**
 * Duplicate Service Button Component
 * Feature: 018-service-management-crud
 *
 * Client component for duplicating a service
 */

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Copy, Loader2 } from 'lucide-react'
import { useDuplicateService } from '@/hooks/useServiceCRUD'
import { toast } from 'sonner'

interface DuplicateServiceButtonProps {
  serviceId: number
  serviceName: string
  variant?: 'default' | 'outline' | 'ghost'
}

export function DuplicateServiceButton({
  serviceId,
  serviceName,
  variant = 'outline',
}: DuplicateServiceButtonProps) {
  const router = useRouter()
  const duplicateService = useDuplicateService()

  const handleDuplicate = async () => {
    const newName = prompt(
      `Dupliquer "${serviceName}".\n\nEntrez le nom du nouveau service:`,
      `${serviceName} (Copie)`
    )

    if (!newName || newName.trim() === '') {
      return
    }

    try {
      const result = await duplicateService.mutateAsync({
        source_service_id: serviceId,
        new_name: newName.trim(),
        copy_images: true,
        copy_supplements: false,
        copy_contractors: false,
      })

      toast.success('Service dupliqué', {
        description: `Le service "${result.name}" a été créé.`,
      })

      // Redirect to edit the new service
      router.push(`/admin/services/${result.id}/edit`)
    } catch (error: any) {
      console.error('Error duplicating service:', error)
      toast.error('Erreur lors de la duplication', {
        description: error.message || 'Une erreur est survenue.',
      })
    }
  }

  return (
    <Button
      variant={variant}
      onClick={handleDuplicate}
      disabled={duplicateService.isPending}
    >
      {duplicateService.isPending ? (
        <>
          <Loader2 className="h-4 w-4 mr-2 animate-spin" />
          Duplication...
        </>
      ) : (
        <>
          <Copy className="h-4 w-4 mr-2" />
          Dupliquer
        </>
      )}
    </Button>
  )
}
