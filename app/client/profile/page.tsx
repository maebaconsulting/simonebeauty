'use client'

/**
 * Client Profile Page
 * Feature: 006-client-interface (P1)
 * Route: /client/profile
 */

import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useUser } from '@/hooks/useUser'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Loader2, User, Save, ArrowLeft } from 'lucide-react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useToast } from '@/hooks/use-toast'

interface Profile {
  id: string
  first_name: string
  last_name: string
  email: string
  phone: string | null
  date_of_birth: string | null
  preferred_language: string | null
  role: string
}

export default function ClientProfilePage() {
  const { user, isLoading: userLoading } = useUser()
  const router = useRouter()
  const { toast } = useToast()
  const queryClient = useQueryClient()
  const [isEditing, setIsEditing] = useState(false)

  // Fetch profile
  const { data: profileData, isLoading: profileLoading } = useQuery({
    queryKey: ['client-profile'],
    queryFn: async () => {
      const res = await fetch('/api/client/profile')
      if (!res.ok) throw new Error('Failed to fetch profile')
      const data = await res.json()
      return data.profile as Profile
    },
    enabled: !!user,
  })

  // Update profile mutation
  const updateProfileMutation = useMutation({
    mutationFn: async (data: Partial<Profile>) => {
      const res = await fetch('/api/client/profile', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      })
      if (!res.ok) throw new Error('Failed to update profile')
      return res.json()
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['client-profile'] })
      setIsEditing(false)
      toast({
        title: 'Succès',
        description: 'Profil mis à jour avec succès',
      })
    },
    onError: () => {
      toast({
        title: 'Erreur',
        description: 'Échec de la mise à jour du profil',
        variant: 'destructive',
      })
    },
  })

  const [formData, setFormData] = useState<Partial<Profile>>({})

  const handleEdit = () => {
    setFormData(profileData || {})
    setIsEditing(true)
  }

  const handleCancel = () => {
    setFormData({})
    setIsEditing(false)
  }

  const handleSave = () => {
    updateProfileMutation.mutate(formData)
  }

  if (userLoading || profileLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-button-primary animate-spin" />
      </div>
    )
  }

  if (!profileData) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <Card className="max-w-md w-full p-8 text-center">
          <p className="text-gray-600">Profil non trouvé</p>
        </Card>
      </div>
    )
  }

  const displayData = isEditing ? formData : profileData

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="container mx-auto px-4 max-w-4xl">
        {/* Header */}
        <div className="mb-6">
          <Link href="/client">
            <Button variant="ghost" size="sm" className="mb-4">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Retour au tableau de bord
            </Button>
          </Link>
          <h1 className="font-playfair text-4xl font-bold text-gray-900 mb-2">
            Mon Profil
          </h1>
          <p className="text-gray-600">
            Gérez vos informations personnelles
          </p>
        </div>

        {/* Profile Card */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-3 bg-button-primary/10 rounded-full">
                  <User className="w-6 h-6 text-button-primary" />
                </div>
                <div>
                  <CardTitle>Informations personnelles</CardTitle>
                  <CardDescription>Vos coordonnées et préférences</CardDescription>
                </div>
              </div>
              {!isEditing && (
                <Button onClick={handleEdit} variant="outline">
                  Modifier
                </Button>
              )}
            </div>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* First Name */}
              <div className="space-y-2">
                <Label htmlFor="first_name">Prénom *</Label>
                {isEditing ? (
                  <Input
                    id="first_name"
                    value={displayData.first_name || ''}
                    onChange={(e) =>
                      setFormData({ ...formData, first_name: e.target.value })
                    }
                    required
                  />
                ) : (
                  <p className="text-gray-900 font-medium">{displayData.first_name}</p>
                )}
              </div>

              {/* Last Name */}
              <div className="space-y-2">
                <Label htmlFor="last_name">Nom *</Label>
                {isEditing ? (
                  <Input
                    id="last_name"
                    value={displayData.last_name || ''}
                    onChange={(e) =>
                      setFormData({ ...formData, last_name: e.target.value })
                    }
                    required
                  />
                ) : (
                  <p className="text-gray-900 font-medium">{displayData.last_name}</p>
                )}
              </div>

              {/* Email */}
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <p className="text-gray-600 text-sm">{profileData.email}</p>
                <p className="text-xs text-gray-500">
                  Contactez le support pour modifier votre email
                </p>
              </div>

              {/* Phone */}
              <div className="space-y-2">
                <Label htmlFor="phone">Téléphone</Label>
                {isEditing ? (
                  <Input
                    id="phone"
                    type="tel"
                    value={displayData.phone || ''}
                    onChange={(e) =>
                      setFormData({ ...formData, phone: e.target.value })
                    }
                    placeholder="+33 6 12 34 56 78"
                  />
                ) : (
                  <p className="text-gray-900">
                    {displayData.phone || 'Non renseigné'}
                  </p>
                )}
              </div>

              {/* Date of Birth */}
              <div className="space-y-2">
                <Label htmlFor="date_of_birth">Date de naissance</Label>
                {isEditing ? (
                  <Input
                    id="date_of_birth"
                    type="date"
                    value={displayData.date_of_birth || ''}
                    onChange={(e) =>
                      setFormData({ ...formData, date_of_birth: e.target.value })
                    }
                  />
                ) : (
                  <p className="text-gray-900">
                    {displayData.date_of_birth
                      ? new Date(displayData.date_of_birth).toLocaleDateString('fr-FR')
                      : 'Non renseigné'}
                  </p>
                )}
              </div>

              {/* Preferred Language */}
              <div className="space-y-2">
                <Label htmlFor="preferred_language">Langue préférée</Label>
                {isEditing ? (
                  <select
                    id="preferred_language"
                    className="w-full border border-gray-300 rounded-md px-3 py-2"
                    value={displayData.preferred_language || 'fr'}
                    onChange={(e) =>
                      setFormData({ ...formData, preferred_language: e.target.value })
                    }
                  >
                    <option value="fr">Français</option>
                    <option value="en">English</option>
                    <option value="es">Español</option>
                    <option value="de">Deutsch</option>
                    <option value="nl">Nederlands</option>
                    <option value="it">Italiano</option>
                  </select>
                ) : (
                  <p className="text-gray-900">
                    {displayData.preferred_language
                      ? {
                          fr: 'Français',
                          en: 'English',
                          es: 'Español',
                          de: 'Deutsch',
                          nl: 'Nederlands',
                          it: 'Italiano',
                        }[displayData.preferred_language]
                      : 'Français'}
                  </p>
                )}
              </div>
            </div>

            {/* Action Buttons */}
            {isEditing && (
              <div className="flex gap-3 pt-4 border-t">
                <Button
                  onClick={handleSave}
                  disabled={updateProfileMutation.isPending}
                  className="flex-1"
                >
                  {updateProfileMutation.isPending ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Enregistrement...
                    </>
                  ) : (
                    <>
                      <Save className="mr-2 h-4 w-4" />
                      Enregistrer
                    </>
                  )}
                </Button>
                <Button onClick={handleCancel} variant="outline" className="flex-1">
                  Annuler
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
