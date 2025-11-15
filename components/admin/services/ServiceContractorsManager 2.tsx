'use client'

/**
 * Service Contractors Manager Component
 * Feature: Service Contractors Association
 *
 * Manages contractors assigned to a service
 */

import { useState } from 'react'
import { Plus, Pencil, Trash2, Search, User, Loader2 } from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import {
  useServiceContractors,
  useAvailableContractors,
  useAssignContractor,
  useUpdateContractorAssignment,
  useUnassignContractor,
  type ContractorService,
  type AvailableContractor,
} from '@/hooks/useServiceContractors'

interface ServiceContractorsManagerProps {
  serviceId: number
  serviceName: string
}

export function ServiceContractorsManager({ serviceId, serviceName }: ServiceContractorsManagerProps) {
  const [isAddModalOpen, setIsAddModalOpen] = useState(false)
  const [isEditModalOpen, setIsEditModalOpen] = useState(false)
  const [selectedContractor, setSelectedContractor] = useState<ContractorService | null>(null)
  const [searchTerm, setSearchTerm] = useState('')

  // Fetch data
  const { data: contractors = [], isLoading } = useServiceContractors(serviceId)
  const { data: availableContractors = [] } = useAvailableContractors()

  // Mutations
  const assignContractor = useAssignContractor(serviceId)
  const updateAssignment = useUpdateContractorAssignment(serviceId)
  const unassignContractor = useUnassignContractor(serviceId)

  // Filter available contractors (exclude already assigned)
  const assignedContractorIds = contractors.map(c => c.contractor_id)
  const filteredAvailableContractors = availableContractors
    .filter(c => !assignedContractorIds.includes(c.id))
    .filter(c => {
      if (!searchTerm) return true
      const searchLower = searchTerm.toLowerCase()
      return (
        c.business_name?.toLowerCase().includes(searchLower) ||
        c.professional_title?.toLowerCase().includes(searchLower) ||
        c.profile?.first_name?.toLowerCase().includes(searchLower) ||
        c.profile?.last_name?.toLowerCase().includes(searchLower)
      )
    })

  const handleAssignContractor = async (contractor: AvailableContractor) => {
    try {
      await assignContractor.mutateAsync({
        contractor_id: contractor.id,
      })
      toast.success('Prestataire associé', {
        description: `${contractor.business_name} a été associé au service.`,
      })
      setIsAddModalOpen(false)
      setSearchTerm('')
    } catch (error: any) {
      toast.error('Erreur', {
        description: error.message || 'Impossible d\'associer le prestataire.',
      })
    }
  }

  const handleEditContractor = (contractor: ContractorService) => {
    setSelectedContractor(contractor)
    setIsEditModalOpen(true)
  }

  const handleUpdateAssignment = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    if (!selectedContractor) return

    const formData = new FormData(e.currentTarget)
    const isActive = formData.get('is_active') === 'on'
    const customPrice = formData.get('custom_price') as string
    const customDuration = formData.get('custom_duration') as string
    const customDescription = formData.get('custom_description') as string

    try {
      await updateAssignment.mutateAsync({
        contractor_id: selectedContractor.contractor_id,
        is_active: isActive,
        custom_price: customPrice ? parseInt(customPrice) * 100 : null,
        custom_duration: customDuration ? parseInt(customDuration) : null,
        custom_description: customDescription || null,
      })
      toast.success('Modification enregistrée', {
        description: 'L\'association a été mise à jour.',
      })
      setIsEditModalOpen(false)
      setSelectedContractor(null)
    } catch (error: any) {
      toast.error('Erreur', {
        description: error.message || 'Impossible de mettre à jour l\'association.',
      })
    }
  }

  const handleUnassignContractor = async (contractor: ContractorService) => {
    if (!confirm(`Êtes-vous sûr de vouloir retirer ${contractor.contractors?.business_name} de ce service ?`)) {
      return
    }

    try {
      await unassignContractor.mutateAsync(contractor.contractor_id)
      toast.success('Prestataire retiré', {
        description: 'Le prestataire a été retiré du service.',
      })
    } catch (error: any) {
      toast.error('Erreur', {
        description: error.message || 'Impossible de retirer le prestataire.',
      })
    }
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-medium text-gray-900">
            Prestataires associés ({contractors.length})
          </h3>
          <p className="text-sm text-gray-600 mt-1">
            Gérez les prestataires qui peuvent fournir ce service.
          </p>
        </div>
        <Button type="button" onClick={() => setIsAddModalOpen(true)}>
          <Plus className="h-4 w-4 mr-2" />
          Ajouter un prestataire
        </Button>
      </div>

      {/* Contractors List */}
      {contractors.length === 0 ? (
        <div className="bg-gray-50 rounded-lg p-12 text-center">
          <User className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            Aucun prestataire associé
          </h3>
          <p className="text-gray-600 mb-6">
            Commencez par ajouter des prestataires qui peuvent offrir ce service.
          </p>
          <Button type="button" onClick={() => setIsAddModalOpen(true)}>
            <Plus className="h-4 w-4 mr-2" />
            Ajouter un prestataire
          </Button>
        </div>
      ) : (
        <div className="grid gap-4">
          {contractors.map((contractor) => {
            const profile = contractor.contractors?.profiles
            const fullName = profile
              ? `${profile.first_name || ''} ${profile.last_name || ''}`.trim()
              : ''

            return (
              <div
                key={contractor.id}
                className="bg-white border rounded-lg p-6 hover:shadow-md transition-shadow"
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <h4 className="text-lg font-semibold text-gray-900">
                        {contractor.contractors?.business_name || 'Sans nom'}
                      </h4>
                      <span
                        className={`px-2.5 py-0.5 rounded-full text-xs font-medium ${
                          contractor.is_active
                            ? 'bg-green-100 text-green-800'
                            : 'bg-gray-100 text-gray-800'
                        }`}
                      >
                        {contractor.is_active ? 'Actif' : 'Inactif'}
                      </span>
                    </div>

                    <p className="text-sm text-gray-600 mb-3">
                      {contractor.contractors?.professional_title || 'Aucun titre'}
                      {fullName && ` • ${fullName}`}
                    </p>

                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <p className="text-sm text-gray-500">Prix</p>
                        <p className="text-base font-medium text-gray-900">
                          {contractor.custom_price
                            ? `${(contractor.custom_price / 100).toFixed(0)}€`
                            : 'Prix de base'}
                        </p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-500">Durée</p>
                        <p className="text-base font-medium text-gray-900">
                          {contractor.custom_duration
                            ? `${contractor.custom_duration} min`
                            : 'Durée de base'}
                        </p>
                      </div>
                    </div>

                    {contractor.custom_description && (
                      <p className="text-sm text-gray-600 mt-3 italic">
                        {contractor.custom_description}
                      </p>
                    )}
                  </div>

                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleEditContractor(contractor)}
                    >
                      <Pencil className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleUnassignContractor(contractor)}
                      disabled={unassignContractor.isPending}
                    >
                      <Trash2 className="h-4 w-4 text-red-600" />
                    </Button>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      )}

      {/* Add Contractor Modal */}
      <Dialog open={isAddModalOpen} onOpenChange={setIsAddModalOpen}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-hidden flex flex-col">
          <DialogHeader>
            <DialogTitle>Ajouter un prestataire</DialogTitle>
            <DialogDescription>
              Sélectionnez un prestataire à associer à {serviceName}
            </DialogDescription>
          </DialogHeader>

          <div className="my-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                type="text"
                placeholder="Rechercher un prestataire..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>

          <div className="flex-1 overflow-y-auto min-h-0">
            {filteredAvailableContractors.length === 0 ? (
              <div className="text-center py-12">
                <User className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-600">Aucun prestataire disponible</p>
              </div>
            ) : (
              <div className="grid gap-3">
                {filteredAvailableContractors.map((contractor) => {
                  const fullName = contractor.profile
                    ? `${contractor.profile.first_name || ''} ${contractor.profile.last_name || ''}`.trim()
                    : ''

                  return (
                    <button
                      key={contractor.id}
                      onClick={() => handleAssignContractor(contractor)}
                      disabled={assignContractor.isPending}
                      className="w-full text-left bg-white border rounded-lg p-4 hover:bg-gray-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      <h4 className="font-medium text-gray-900 mb-1">
                        {contractor.business_name || 'Sans nom'}
                      </h4>
                      <p className="text-sm text-gray-600">
                        {contractor.professional_title || 'Aucun titre'}
                        {fullName && ` • ${fullName}`}
                      </p>
                    </button>
                  )
                })}
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>

      {/* Edit Assignment Modal */}
      <Dialog open={isEditModalOpen} onOpenChange={setIsEditModalOpen}>
        <DialogContent>
          <form onSubmit={handleUpdateAssignment}>
            <DialogHeader>
              <DialogTitle>Modifier l'association</DialogTitle>
              <DialogDescription>
                Personnalisez les paramètres pour{' '}
                {selectedContractor?.contractors?.business_name}
              </DialogDescription>
            </DialogHeader>

            <div className="grid gap-4 py-4">
              <div className="flex items-center justify-between">
                <Label htmlFor="is_active">Actif</Label>
                <Switch
                  id="is_active"
                  name="is_active"
                  defaultChecked={selectedContractor?.is_active || false}
                />
              </div>

              <div className="grid gap-2">
                <Label htmlFor="custom_price">Prix personnalisé (€)</Label>
                <Input
                  id="custom_price"
                  name="custom_price"
                  type="number"
                  placeholder="Laisser vide pour utiliser le prix de base"
                  defaultValue={
                    selectedContractor?.custom_price
                      ? (selectedContractor.custom_price / 100).toString()
                      : ''
                  }
                />
              </div>

              <div className="grid gap-2">
                <Label htmlFor="custom_duration">Durée personnalisée (minutes)</Label>
                <Input
                  id="custom_duration"
                  name="custom_duration"
                  type="number"
                  placeholder="Laisser vide pour utiliser la durée de base"
                  defaultValue={selectedContractor?.custom_duration?.toString() || ''}
                />
              </div>

              <div className="grid gap-2">
                <Label htmlFor="custom_description">Description personnalisée</Label>
                <Input
                  id="custom_description"
                  name="custom_description"
                  type="text"
                  placeholder="Note ou description spécifique"
                  defaultValue={selectedContractor?.custom_description || ''}
                />
              </div>
            </div>

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => setIsEditModalOpen(false)}
              >
                Annuler
              </Button>
              <Button type="submit" disabled={updateAssignment.isPending}>
                {updateAssignment.isPending ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Enregistrement...
                  </>
                ) : (
                  'Enregistrer'
                )}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  )
}
