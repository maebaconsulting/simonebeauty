'use client'

/**
 * Client Addresses Page
 * Feature: 006-client-interface (P1)
 * Route: /client/addresses
 */

import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useUser } from '@/hooks/useUser'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Loader2, MapPin, Plus, Home, Briefcase, MapPinned, Edit, Trash2, ArrowLeft, Star } from 'lucide-react'
import Link from 'next/link'
import { useToast } from '@/hooks/use-toast'
import { AddressForm, AddressFormData } from '@/components/client/AddressForm'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'

interface Address {
  id: number
  type: 'home' | 'work' | 'other'
  label?: string
  street: string
  city: string
  postal_code: string
  country: string
  building_info?: string
  delivery_instructions?: string
  is_default: boolean
  is_active: boolean
}

export default function ClientAddressesPage() {
  const { user, isLoading: userLoading } = useUser()
  const { toast } = useToast()
  const queryClient = useQueryClient()
  const [showAddDialog, setShowAddDialog] = useState(false)
  const [editingAddress, setEditingAddress] = useState<Address | null>(null)

  // Fetch addresses
  const { data: addressesData, isLoading: addressesLoading } = useQuery({
    queryKey: ['client-addresses'],
    queryFn: async () => {
      const res = await fetch('/api/client/addresses')
      if (!res.ok) throw new Error('Failed to fetch addresses')
      const data = await res.json()
      return data.addresses as Address[]
    },
    enabled: !!user,
  })

  // Create address mutation
  const createAddressMutation = useMutation({
    mutationFn: async (data: AddressFormData) => {
      const res = await fetch('/api/client/addresses', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      })
      if (!res.ok) throw new Error('Failed to create address')
      return res.json()
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['client-addresses'] })
      setShowAddDialog(false)
      toast({
        title: 'Succès',
        description: 'Adresse ajoutée avec succès',
      })
    },
    onError: () => {
      toast({
        title: 'Erreur',
        description: "Échec de l'ajout de l'adresse",
        variant: 'destructive',
      })
    },
  })

  // Update address mutation
  const updateAddressMutation = useMutation({
    mutationFn: async ({ id, data }: { id: number; data: AddressFormData }) => {
      const res = await fetch(`/api/client/addresses/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      })
      if (!res.ok) throw new Error('Failed to update address')
      return res.json()
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['client-addresses'] })
      setEditingAddress(null)
      toast({
        title: 'Succès',
        description: 'Adresse mise à jour avec succès',
      })
    },
    onError: () => {
      toast({
        title: 'Erreur',
        description: 'Échec de la mise à jour de l\'adresse',
        variant: 'destructive',
      })
    },
  })

  // Delete address mutation
  const deleteAddressMutation = useMutation({
    mutationFn: async (id: number) => {
      const res = await fetch(`/api/client/addresses/${id}`, {
        method: 'DELETE',
      })
      if (!res.ok) throw new Error('Failed to delete address')
      return res.json()
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['client-addresses'] })
      toast({
        title: 'Succès',
        description: 'Adresse supprimée avec succès',
      })
    },
    onError: () => {
      toast({
        title: 'Erreur',
        description: 'Échec de la suppression de l\'adresse',
        variant: 'destructive',
      })
    },
  })

  const handleAddAddress = (data: AddressFormData) => {
    createAddressMutation.mutate(data)
  }

  const handleUpdateAddress = (data: AddressFormData) => {
    if (editingAddress) {
      updateAddressMutation.mutate({ id: editingAddress.id, data })
    }
  }

  const handleDeleteAddress = (id: number) => {
    if (confirm('Êtes-vous sûr de vouloir supprimer cette adresse ?')) {
      deleteAddressMutation.mutate(id)
    }
  }

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'home':
        return <Home className="w-5 h-5" />
      case 'work':
        return <Briefcase className="w-5 h-5" />
      default:
        return <MapPinned className="w-5 h-5" />
    }
  }

  const getTypeLabel = (type: string) => {
    switch (type) {
      case 'home':
        return 'Domicile'
      case 'work':
        return 'Travail'
      default:
        return 'Autre'
    }
  }

  if (userLoading || addressesLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-button-primary animate-spin" />
      </div>
    )
  }

  const addresses = addressesData || []

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="container mx-auto px-4 max-w-6xl">
        {/* Header */}
        <div className="mb-6">
          <Link href="/client">
            <Button variant="ghost" size="sm" className="mb-4">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Retour au tableau de bord
            </Button>
          </Link>
          <div className="flex items-center justify-between">
            <div>
              <h1 className="font-playfair text-4xl font-bold text-gray-900 mb-2">
                Mes Adresses
              </h1>
              <p className="text-gray-600">
                Gérez vos adresses de service
              </p>
            </div>
            <Button onClick={() => setShowAddDialog(true)}>
              <Plus className="mr-2 h-4 w-4" />
              Ajouter une adresse
            </Button>
          </div>
        </div>

        {/* Addresses List */}
        {addresses.length === 0 ? (
          <Card className="p-12">
            <div className="text-center text-gray-500">
              <MapPin className="w-12 h-12 mx-auto mb-3 opacity-50" />
              <p className="text-lg font-medium mb-1">Aucune adresse</p>
              <p className="text-sm mb-6">Ajoutez votre première adresse de service</p>
              <Button onClick={() => setShowAddDialog(true)}>
                <Plus className="mr-2 h-4 w-4" />
                Ajouter une adresse
              </Button>
            </div>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {addresses.map((address) => (
              <Card key={address.id} className={address.is_default ? 'ring-2 ring-button-primary' : ''}>
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3">
                      <div className={`p-2 rounded-lg ${
                        address.is_default ? 'bg-button-primary text-white' : 'bg-gray-100 text-gray-600'
                      }`}>
                        {getTypeIcon(address.type)}
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <CardTitle className="text-lg">
                            {address.label || getTypeLabel(address.type)}
                          </CardTitle>
                          {address.is_default && (
                            <Star className="w-4 h-4 text-button-primary fill-button-primary" />
                          )}
                        </div>
                        <CardDescription>{getTypeLabel(address.type)}</CardDescription>
                      </div>
                    </div>
                    <div className="flex gap-1">
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => setEditingAddress(address)}
                      >
                        <Edit className="w-4 h-4" />
                      </Button>
                      {!address.is_default && (
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => handleDeleteAddress(address.id)}
                        >
                          <Trash2 className="w-4 h-4 text-red-600" />
                        </Button>
                      )}
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-2">
                  <p className="text-gray-700">{address.street}</p>
                  <p className="text-gray-600">
                    {address.postal_code} {address.city}
                  </p>
                  {address.building_info && (
                    <p className="text-sm text-gray-500 border-t pt-2 mt-2">
                      <span className="font-medium">Infos:</span> {address.building_info}
                    </p>
                  )}
                  {address.delivery_instructions && (
                    <p className="text-sm text-gray-500">
                      <span className="font-medium">Instructions:</span> {address.delivery_instructions}
                    </p>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {/* Add Address Dialog */}
        <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Ajouter une adresse</DialogTitle>
              <DialogDescription>
                Ajoutez une nouvelle adresse pour vos services
              </DialogDescription>
            </DialogHeader>
            <AddressForm
              onSubmit={handleAddAddress}
              onCancel={() => setShowAddDialog(false)}
              isLoading={createAddressMutation.isPending}
            />
          </DialogContent>
        </Dialog>

        {/* Edit Address Dialog */}
        <Dialog open={!!editingAddress} onOpenChange={(open) => !open && setEditingAddress(null)}>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Modifier l'adresse</DialogTitle>
              <DialogDescription>
                Modifiez les informations de votre adresse
              </DialogDescription>
            </DialogHeader>
            {editingAddress && (
              <AddressForm
                initialData={editingAddress}
                onSubmit={handleUpdateAddress}
                onCancel={() => setEditingAddress(null)}
                isLoading={updateAddressMutation.isPending}
              />
            )}
          </DialogContent>
        </Dialog>
      </div>
    </div>
  )
}
