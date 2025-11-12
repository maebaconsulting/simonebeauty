import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'
import { ShieldCheck } from 'lucide-react'

export default async function ModerationPage() {
  const cookieStore = await cookies()
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return cookieStore.get(name)?.value
        },
      },
    }
  )

  const {
    data: { session },
  } = await supabase.auth.getSession()

  if (!session) {
    redirect('/login')
  }

  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', session.user.id)
    .single()

  if (!profile || !['admin', 'manager'].includes(profile.role)) {
    redirect('/')
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-white border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Moderation des images</h1>
              <p className="text-gray-600 mt-1">
                Moderez les images uploadees par les utilisateurs dans les conversations
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="bg-white rounded-lg shadow-sm p-12 text-center">
          <ShieldCheck className="h-16 w-16 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            Fonctionnalite en developpement
          </h3>
          <p className="text-gray-600 mb-6">
            La moderation des images UGC sera disponible prochainement.
          </p>
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 max-w-2xl mx-auto">
            <p className="text-sm text-blue-800 mb-4">
              Feature 017 - Image Management (US4):
            </p>
            <ul className="text-sm text-blue-800 text-left space-y-2">
              <li>- Queue de moderation pour les images en attente</li>
              <li>- Apercu des images avec contexte de conversation</li>
              <li>- Actions: Approuver, Rejeter avec raison, Signaler</li>
              <li>- Filtres par statut: En attente, Approuvees, Rejetees</li>
              <li>- Historique des actions de moderation</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  )
}
