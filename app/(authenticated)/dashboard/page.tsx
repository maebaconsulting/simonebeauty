'use client'

import { useAuth } from '@/hooks/useAuth'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'

export default function DashboardPage() {
  const { user } = useAuth()

  return (
    <div className="container mx-auto p-8">
      <Card className="max-w-2xl mx-auto">
        <CardHeader>
          <CardTitle>Tableau de bord</CardTitle>
          <CardDescription>Bienvenue sur Simone Paris</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <p className="text-sm text-muted-foreground">Email</p>
            <p className="font-medium">{user?.email}</p>
          </div>

          <div className="space-y-2">
            <p className="text-sm text-muted-foreground">ID Utilisateur</p>
            <p className="font-mono text-sm">{user?.id}</p>
          </div>

          <div className="rounded-lg bg-muted p-4">
            <p className="text-sm text-muted-foreground">
              Votre session est active et sera maintenue pendant 7 jours.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
