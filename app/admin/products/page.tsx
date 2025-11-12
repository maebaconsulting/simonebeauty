'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useQuery } from '@tanstack/react-query'
import { createClient } from '@/lib/supabase/client'
import { Package, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'

export default function ProductsListPage() {
  const router = useRouter()
  const supabase = createClient()

  // Check authentication and role
  const { data: session } = useQuery({
    queryKey: ['session'],
    queryFn: async () => {
      const { data: { session } } = await supabase.auth.getSession()
      return session
    },
  })

  const { data: profile } = useQuery({
    queryKey: ['profile', session?.user?.id],
    queryFn: async () => {
      if (!session?.user?.id) return null
      const { data } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', session.user.id)
        .single()
      return data
    },
    enabled: !!session?.user?.id,
  })

  useEffect(() => {
    if (session === undefined || profile === undefined) return

    if (!session) {
      router.push('/login')
      return
    }

    if (!profile || !['admin', 'manager'].includes(profile.role)) {
      router.push('/')
      return
    }
  }, [session, profile, router])

  if (!session || !profile || !['admin', 'manager'].includes(profile.role)) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-purple-600 animate-spin" />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-white border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Gestion des produits</h1>
              <p className="text-gray-600 mt-1">
                Gerez les produits e-commerce et leurs images
              </p>
            </div>
            <Button>
              <Package className="h-4 w-4 mr-2" />
              Creer un produit
            </Button>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="bg-white rounded-lg shadow-sm p-12 text-center">
          <Package className="h-16 w-16 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            Fonctionnalite en developpement
          </h3>
          <p className="text-gray-600 mb-6">
            La gestion des produits e-commerce sera disponible prochainement.
          </p>
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 max-w-2xl mx-auto">
            <p className="text-sm text-blue-800">
              Feature 017 - Image Management: Les produits supporteront jusqu'a 10 images par produit.
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
