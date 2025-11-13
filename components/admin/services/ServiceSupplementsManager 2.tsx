'use client'

/**
 * Service Supplements Manager Component
 * Feature: Service Supplements Management
 *
 * Manages supplements/add-ons for services
 */

import { useState } from 'react'
import { Plus, Pencil, Trash2, Package, Loader2, GripVertical } from 'lucide-react'
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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import {
  useServiceSupplements,
  useCreateSupplement,
  useUpdateSupplement,
  useDeleteSupplement,
  type ServiceSupplement,
} from '@/hooks/useServiceSupplements'

interface ServiceSupplementsManagerProps {
  serviceId: number
  serviceName: string
}

const SUPPLEMENT_TYPES = [
  { value: 'duration', label: 'Durée étendue', icon: '⏱️' },
  { value: 'product', label: 'Produit supplémentaire', icon: '📦' },
  { value: 'addon', label: 'Service additionnel', icon: '➕' },
  { value: 'option', label: 'Option spéciale', icon: '⭐' },
]

export function ServiceSupplementsManager({ serviceId, serviceName }: ServiceSupplementsManagerProps) {
  const [isAddModalOpen, setIsAddModalOpen] = useState(false)
  const [isEditModalOpen, setIsEditModalOpen] = useState(false)
  const [selectedSupplement, setSelectedSupplement] = useState<ServiceSupplement | null>(null)

  // Fetch data
  const { data: supplements = [], isLoading } = useServiceSupplements(serviceId)

  // Mutations
  const createSupplement = useCreateSupplement(serviceId)
  const updateSupplement = useUpdateSupplement(serviceId)
  const deleteSupplement = useDeleteSupplement(serviceId)

  const handleCreateSupplement = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    const formData = new FormData(e.currentTarget)

    const name = formData.get('name') as string
    const description = formData.get('description') as string
    const type = formData.get('type') as 'duration' | 'product' | 'addon' | 'option'
    const priceAdjustment = formData.get('price_adjustment') as string
    const durationAdjustment = formData.get('duration_adjustment') as string
    const isActive = formData.get('is_active') === 'on'

    if (!name || !type) {
      toast.error('Erreur', {
        description: 'Le nom et le type sont requis.',
      })
      return
    }

    try {
      await createSupplement.mutateAsync({
        name,
        description: description || undefined,
        type,
        price_adjustment: priceAdjustment ? parseInt(priceAdjustment) * 100 : 0,
        duration_adjustment: durationAdjustment ? parseInt(durationAdjustment) : 0,
        is_active: isActive,
      })
      toast.success('Supplément créé', {
        description: `${name} a été ajouté au service.`,
      })
      setIsAddModalOpen(false)
      ;(e.target as HTMLFormElement).reset()
    } catch (error: any) {
      toast.error('Erreur', {
        description: error.message || 'Impossible de créer le supplément.',
      })
    }
  }

  const handleEditSupplement = (supplement: ServiceSupplement) => {
    setSelectedSupplement(supplement)
    setIsEditModalOpen(true)
  }

  const handleUpdateSupplement = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    if (!selectedSupplement) return

    const formData = new FormData(e.currentTarget)

    const name = formData.get('name') as string
    const description = formData.get('description') as string
    const type = formData.get('type') as 'duration' | 'product' | 'addon' | 'option'
    const priceAdjustment = formData.get('price_adjustment') as string
    const durationAdjustment = formData.get('duration_adjustment') as string
    const isActive = formData.get('is_active') === 'on'

    try {
      await updateSupplement.mutateAsync({
        supplement_id: selectedSupplement.id,
        name,
        description: description || undefined,
        type,
        price_adjustment: priceAdjustment ? parseInt(priceAdjustment) * 100 : 0,
        duration_adjustment: durationAdjustment ? parseInt(durationAdjustment) : 0,
        is_active: isActive,
      })
      toast.success('Modification enregistrée', {
        description: 'Le supplément a été mis à jour.',
      })
      setIsEditModalOpen(false)
      setSelectedSupplement(null)
    } catch (error: any) {
      toast.error('Erreur', {
        description: error.message || 'Impossible de mettre à jour le supplément.',
      })
    }
  }

  const handleDeleteSupplement = async (supplement: ServiceSupplement) => {
    if (!confirm(`Êtes-vous sûr de vouloir supprimer "${supplement.name}" ?`)) {
      return
    }

    try {
      await deleteSupplement.mutateAsync(supplement.id)
      toast.success('Supplément supprimé', {
        description: 'Le supplément a été retiré du service.',
      })
    } catch (error: any) {
      toast.error('Erreur', {
        description: error.message || 'Impossible de supprimer le supplément.',
      })
    }
  }

  const getTypeLabel = (type: string) => {
    return SUPPLEMENT_TYPES.find((t) => t.value === type)?.label || type
  }

  const getTypeIcon = (type: string) => {
    return SUPPLEMENT_TYPES.find((t) => t.value === type)?.icon || '📌'
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
            Suppléments du service ({supplements.length})
          </h3>
          <p className="text-sm text-gray-600 mt-1">
            Gérez les options et suppléments disponibles pour ce service.
          </p>
        </div>
        <Button type="button" onClick={() => setIsAddModalOpen(true)}>
          <Plus className="h-4 w-4 mr-2" />
          Ajouter un supplément
        </Button>
      </div>

      {/* Supplements List */}
      {supplements.length === 0 ? (
        <div className="bg-gray-50 rounded-lg p-12 text-center">
          <Package className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            Aucun supplément disponible
          </h3>
          <p className="text-gray-600 mb-6">
            Commencez par ajouter des suppléments pour ce service.
          </p>
          <Button type="button" onClick={() => setIsAddModalOpen(true)}>
            <Plus className="h-4 w-4 mr-2" />
            Ajouter un supplément
          </Button>
        </div>
      ) : (
        <div className="grid gap-4">
          {supplements.map((supplement) => (
            <div
              key={supplement.id}
              className="bg-white border rounded-lg p-6 hover:shadow-md transition-shadow"
            >
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <span className="text-2xl">{getTypeIcon(supplement.type)}</span>
                    <h4 className="text-lg font-semibold text-gray-900">
                      {supplement.name}
                    </h4>
                    <span
                      className={`px-2.5 py-0.5 rounded-full text-xs font-medium ${
                        supplement.is_active
                          ? 'bg-green-100 text-green-800'
                          : 'bg-gray-100 text-gray-800'
                      }`}
                    >
                      {supplement.is_active ? 'Actif' : 'Inactif'}
                    </span>
                  </div>

                  <p className="text-sm text-gray-600 mb-3">
                    {getTypeLabel(supplement.type)}
                  </p>

                  {supplement.description && (
                    <p className="text-sm text-gray-700 mb-3 italic">
                      {supplement.description}
                    </p>
                  )}

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-sm text-gray-500">Ajustement prix</p>
                      <p className="text-base font-medium text-gray-900">
                        {supplement.price_adjustment >= 0 ? '+' : ''}
                        {(supplement.price_adjustment / 100).toFixed(0)}€
                      </p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-500">Ajustement durée</p>
                      <p className="text-base font-medium text-gray-900">
                        {supplement.duration_adjustment >= 0 ? '+' : ''}
                        {supplement.duration_adjustment} min
                      </p>
                    </div>
                  </div>
                </div>

                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleEditSupplement(supplement)}
                  >
                    <Pencil className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleDeleteSupplement(supplement)}
                    disabled={deleteSupplement.isPending}
                  >
                    <Trash2 className="h-4 w-4 text-red-600" />
                  </Button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Add Supplement Modal */}
      <Dialog open={isAddModalOpen} onOpenChange={setIsAddModalOpen}>
        <DialogContent>
          <form onSubmit={handleCreateSupplement}>
            <DialogHeader>
              <DialogTitle>Ajouter un supplément</DialogTitle>
              <DialogDescription>
                Créez un nouveau supplément pour {serviceName}
              </DialogDescription>
            </DialogHeader>

            <div className="grid gap-4 py-4">
              <div className="grid gap-2">
                <Label htmlFor="name">Nom *</Label>
                <Input
                  id="name"
                  name="name"
                  type="text"
                  placeholder="Ex: Durée prolongée de 30 min"
                  required
                />
              </div>

              <div className="grid gap-2">
                <Label htmlFor="type">Type *</Label>
                <Select name="type" required>
                  <SelectTrigger>
                    <SelectValue placeholder="Sélectionnez un type" />
                  </SelectTrigger>
                  <SelectContent>
                    {SUPPLEMENT_TYPES.map((type) => (
                      <SelectItem key={type.value} value={type.value}>
                        {type.icon} {type.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="grid gap-2">
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  name="description"
                  placeholder="Description du supplément (optionnel)"
                  rows={3}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="grid gap-2">
                  <Label htmlFor="price_adjustment">Prix (€)</Label>
                  <Input
                    id="price_adjustment"
                    name="price_adjustment"
                    type="number"
                    placeholder="0"
                    step="1"
                  />
                </div>

                <div className="grid gap-2">
                  <Label htmlFor="duration_adjustment">Durée (min)</Label>
                  <Input
                    id="duration_adjustment"
                    name="duration_adjustment"
                    type="number"
                    placeholder="0"
                    step="5"
                  />
                </div>
              </div>

              <div className="flex items-center justify-between">
                <Label htmlFor="is_active">Actif</Label>
                <Switch id="is_active" name="is_active" defaultChecked />
              </div>
            </div>

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => setIsAddModalOpen(false)}
              >
                Annuler
              </Button>
              <Button type="submit" disabled={createSupplement.isPending}>
                {createSupplement.isPending ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Création...
                  </>
                ) : (
                  'Créer'
                )}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Edit Supplement Modal */}
      <Dialog open={isEditModalOpen} onOpenChange={setIsEditModalOpen}>
        <DialogContent>
          <form onSubmit={handleUpdateSupplement}>
            <DialogHeader>
              <DialogTitle>Modifier le supplément</DialogTitle>
              <DialogDescription>
                Modifiez les informations de ce supplément
              </DialogDescription>
            </DialogHeader>

            <div className="grid gap-4 py-4">
              <div className="grid gap-2">
                <Label htmlFor="edit_name">Nom *</Label>
                <Input
                  id="edit_name"
                  name="name"
                  type="text"
                  defaultValue={selectedSupplement?.name || ''}
                  required
                />
              </div>

              <div className="grid gap-2">
                <Label htmlFor="edit_type">Type *</Label>
                <Select name="type" defaultValue={selectedSupplement?.type} required>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {SUPPLEMENT_TYPES.map((type) => (
                      <SelectItem key={type.value} value={type.value}>
                        {type.icon} {type.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="grid gap-2">
                <Label htmlFor="edit_description">Description</Label>
                <Textarea
                  id="edit_description"
                  name="description"
                  defaultValue={selectedSupplement?.description || ''}
                  rows={3}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="grid gap-2">
                  <Label htmlFor="edit_price_adjustment">Prix (€)</Label>
                  <Input
                    id="edit_price_adjustment"
                    name="price_adjustment"
                    type="number"
                    defaultValue={
                      selectedSupplement
                        ? (selectedSupplement.price_adjustment / 100).toString()
                        : '0'
                    }
                    step="1"
                  />
                </div>

                <div className="grid gap-2">
                  <Label htmlFor="edit_duration_adjustment">Durée (min)</Label>
                  <Input
                    id="edit_duration_adjustment"
                    name="duration_adjustment"
                    type="number"
                    defaultValue={selectedSupplement?.duration_adjustment?.toString() || '0'}
                    step="5"
                  />
                </div>
              </div>

              <div className="flex items-center justify-between">
                <Label htmlFor="edit_is_active">Actif</Label>
                <Switch
                  id="edit_is_active"
                  name="is_active"
                  defaultChecked={selectedSupplement?.is_active || false}
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
              <Button type="submit" disabled={updateSupplement.isPending}>
                {updateSupplement.isPending ? (
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
