'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Loader2 } from 'lucide-react'

export interface AddressFormData {
  type: 'home' | 'work' | 'other'
  label?: string
  street: string
  city: string
  postal_code: string
  country: string
  latitude?: number
  longitude?: number
  building_info?: string
  delivery_instructions?: string
  is_default: boolean
}

interface AddressFormProps {
  initialData?: Partial<AddressFormData>
  onSubmit: (data: AddressFormData) => void
  onCancel: () => void
  isLoading?: boolean
}

export function AddressForm({
  initialData,
  onSubmit,
  onCancel,
  isLoading = false,
}: AddressFormProps) {
  const [formData, setFormData] = useState<AddressFormData>({
    type: initialData?.type || 'home',
    label: initialData?.label || '',
    street: initialData?.street || '',
    city: initialData?.city || '',
    postal_code: initialData?.postal_code || '',
    country: initialData?.country || 'FR',
    latitude: initialData?.latitude,
    longitude: initialData?.longitude,
    building_info: initialData?.building_info || '',
    delivery_instructions: initialData?.delivery_instructions || '',
    is_default: initialData?.is_default || false,
  })

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    onSubmit(formData)
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Type */}
      <div className="space-y-2">
        <Label htmlFor="type">Type d'adresse *</Label>
        <select
          id="type"
          className="w-full border border-gray-300 rounded-md px-3 py-2"
          value={formData.type}
          onChange={(e) =>
            setFormData({ ...formData, type: e.target.value as AddressFormData['type'] })
          }
          required
        >
          <option value="home">Domicile</option>
          <option value="work">Travail</option>
          <option value="other">Autre</option>
        </select>
      </div>

      {/* Label */}
      <div className="space-y-2">
        <Label htmlFor="label">Libellé (optionnel)</Label>
        <Input
          id="label"
          value={formData.label}
          onChange={(e) => setFormData({ ...formData, label: e.target.value })}
          placeholder="ex: Appartement Paris, Bureau La Défense"
        />
      </div>

      {/* Street */}
      <div className="space-y-2">
        <Label htmlFor="street">Adresse *</Label>
        <Input
          id="street"
          value={formData.street}
          onChange={(e) => setFormData({ ...formData, street: e.target.value })}
          placeholder="123 Rue de la Paix"
          required
        />
      </div>

      {/* City & Postal Code */}
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="postal_code">Code postal *</Label>
          <Input
            id="postal_code"
            value={formData.postal_code}
            onChange={(e) => setFormData({ ...formData, postal_code: e.target.value })}
            placeholder="75001"
            required
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="city">Ville *</Label>
          <Input
            id="city"
            value={formData.city}
            onChange={(e) => setFormData({ ...formData, city: e.target.value })}
            placeholder="Paris"
            required
          />
        </div>
      </div>

      {/* Country */}
      <div className="space-y-2">
        <Label htmlFor="country">Pays</Label>
        <select
          id="country"
          className="w-full border border-gray-300 rounded-md px-3 py-2"
          value={formData.country}
          onChange={(e) => setFormData({ ...formData, country: e.target.value })}
        >
          <option value="FR">France</option>
          <option value="ES">Espagne</option>
          <option value="BE">Belgique</option>
          <option value="DE">Allemagne</option>
          <option value="CH">Suisse</option>
        </select>
      </div>

      {/* Building Info */}
      <div className="space-y-2">
        <Label htmlFor="building_info">Informations complémentaires</Label>
        <Textarea
          id="building_info"
          value={formData.building_info}
          onChange={(e) => setFormData({ ...formData, building_info: e.target.value })}
          placeholder="Bâtiment, étage, code d'accès, interphone..."
          rows={2}
        />
      </div>

      {/* Delivery Instructions */}
      <div className="space-y-2">
        <Label htmlFor="delivery_instructions">Instructions de livraison</Label>
        <Textarea
          id="delivery_instructions"
          value={formData.delivery_instructions}
          onChange={(e) =>
            setFormData({ ...formData, delivery_instructions: e.target.value })
          }
          placeholder="Instructions spéciales pour accéder à l'adresse..."
          rows={2}
        />
      </div>

      {/* Is Default */}
      <div className="flex items-center space-x-2">
        <input
          type="checkbox"
          id="is_default"
          checked={formData.is_default}
          onChange={(e) => setFormData({ ...formData, is_default: e.target.checked })}
          className="rounded border-gray-300"
        />
        <Label htmlFor="is_default" className="cursor-pointer">
          Définir comme adresse par défaut
        </Label>
      </div>

      {/* Action Buttons */}
      <div className="flex gap-3 pt-4 border-t">
        <Button type="submit" disabled={isLoading} className="flex-1">
          {isLoading ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Enregistrement...
            </>
          ) : (
            'Enregistrer'
          )}
        </Button>
        <Button type="button" onClick={onCancel} variant="outline" className="flex-1">
          Annuler
        </Button>
      </div>
    </form>
  )
}
