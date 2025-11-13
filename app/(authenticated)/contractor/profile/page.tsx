'use client'

/**
 * Contractor Profile Page
 * Feature: 007-contractor-interface
 * Feature: 018-international-market-segmentation (contractor_code display)
 * Route: /contractor/profile
 */

import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useUser } from '@/hooks/useUser'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Loader2, User, Save, ArrowLeft, Briefcase } from 'lucide-react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useToast } from '@/hooks/use-toast'
import { CodeDisplay } from '@/components/admin/CodeDisplay'

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

interface Contractor {
  id: string
  contractor_code: string | null
  business_name: string | null
  bio: string | null
  professional_title: string | null
  market: {
    id: number
    name: string
    code: string
    currency_code: string
  } | null
}

interface ProfileResponse {
  profile: Profile
  contractor: Contractor | null
}

export default function ContractorProfilePage() {
  const { user, isLoading: userLoading } = useUser()
  const router = useRouter()
  const { toast } = useToast()
  const queryClient = useQueryClient()
  const [isEditing, setIsEditing] = useState(false)

  // Fetch profile
  const { data: profileData, isLoading: profileLoading } = useQuery({
    queryKey: ['contractor-profile'],
    queryFn: async () => {
      const res = await fetch('/api/contractor/profile')
      if (!res.ok) throw new Error('Failed to fetch profile')
      const data: ProfileResponse = await res.json()
      return data
    },
    enabled: !!user,
  })

  // Update profile mutation
  const updateProfileMutation = useMutation({
    mutationFn: async (data: Partial<Profile>) => {
      const res = await fetch('/api/contractor/profile', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      })
      if (!res.ok) throw new Error('Failed to update profile')
      return res.json()
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['contractor-profile'] })
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
    setFormData(profileData?.profile || {})
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
        <Loader2 className="w-8 h-8 text-purple-600 animate-spin" />
      </div>
    )
  }

  if (!profileData?.profile) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <Card className="max-w-md w-full p-8 text-center">
          <p className="text-gray-600">Profil non trouvé</p>
        </Card>
      </div>
    )
  }

  const profile = profileData.profile
  const contractor = profileData.contractor
  const displayData = isEditing ? formData : profile

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="container mx-auto px-4 max-w-4xl">
        {/* Header */}
        <div className="mb-6">
          <Link href="/contractor/dashboard">
            <Button variant="ghost" size="sm" className="mb-4">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Retour au tableau de bord
            </Button>
          </Link>
          <h1 className="font-playfair text-4xl font-bold text-gray-900 mb-2">
            Mon Profil
          </h1>
          <p className="text-gray-600">
            Gérez vos informations personnelles et professionnelles
          </p>
          {contractor?.contractor_code && (
            <div className="mt-4">
              <CodeDisplay
                code={contractor.contractor_code}
                type="contractor"
                variant="header"
                size="md"
              />
            </div>
          )}
        </div>

        {/* Profile Card */}
        <Card className="mb-6">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-3 bg-purple-100 rounded-full">
                  <User className="w-6 h-6 text-purple-600" />
                </div>
                <div>
                  <CardTitle>Informations personnelles</CardTitle>
                  <CardDescription>Vos coordonnées de base</CardDescription>
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
                <p className="text-gray-600 text-sm">{profile.email}</p>
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

        {/* Contractor Info Card (read-only) */}
        {contractor && (
          <Card>
            <CardHeader>
              <div className="flex items-center gap-3">
                <div className="p-3 bg-indigo-100 rounded-full">
                  <Briefcase className="w-6 h-6 text-indigo-600" />
                </div>
                <div>
                  <CardTitle>Informations professionnelles</CardTitle>
                  <CardDescription>
                    Pour modifier ces informations, contactez l'équipe Simone
                  </CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label>Code Prestataire</Label>
                  {contractor.contractor_code ? (
                    <CodeDisplay
                      code={contractor.contractor_code}
                      type="contractor"
                      size="sm"
                    />
                  ) : (
                    <p className="text-gray-500 text-sm">Non attribué</p>
                  )}
                </div>

                {contractor.business_name && (
                  <div className="space-y-2">
                    <Label>Nom commercial</Label>
                    <p className="text-gray-900">{contractor.business_name}</p>
                  </div>
                )}

                {contractor.professional_title && (
                  <div className="space-y-2">
                    <Label>Titre professionnel</Label>
                    <p className="text-gray-900">{contractor.professional_title}</p>
                  </div>
                )}

                {contractor.market && (
                  <div className="space-y-2">
                    <Label>Marché</Label>
                    <div className="flex items-center gap-2">
                      <span className="px-3 py-1 bg-purple-100 text-purple-800 text-sm font-medium rounded-full">
                        {contractor.market.code}
                      </span>
                      <span className="text-gray-700">{contractor.market.name}</span>
                    </div>
                  </div>
                )}
              </div>

              {contractor.bio && (
                <div className="space-y-2">
                  <Label>Bio</Label>
                  <p className="text-gray-700 text-sm leading-relaxed">{contractor.bio}</p>
                </div>
              )}
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  )
}
