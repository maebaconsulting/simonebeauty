import { Suspense } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/card'
import { Database, FileText, Tag, Briefcase } from 'lucide-react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'

/**
 * Admin Translations Page
 *
 * Provides a centralized interface for managing all translations in the platform.
 * Supports both UI-based editing and JSON file import/export.
 */

interface TranslatableEntity {
  id: string
  name: string
  description: string
  icon: typeof Database
  href: string
  count?: number
}

const TRANSLATABLE_ENTITIES: TranslatableEntity[] = [
  {
    id: 'service_categories',
    name: 'Service Categories',
    description: 'Categories for organizing wellness services',
    icon: Database,
    href: '/admin/translations/service_categories',
  },
  {
    id: 'specialties',
    name: 'Specialties',
    description: 'Contractor specializations and expertise areas',
    icon: Tag,
    href: '/admin/translations/specialties',
  },
  {
    id: 'services',
    name: 'Services',
    description: 'Individual service offerings',
    icon: Briefcase,
    href: '/admin/translations/services',
  },
  {
    id: 'ui_content',
    name: 'UI Content',
    description: 'User interface labels, messages, and help text',
    icon: FileText,
    href: '/admin/translations/ui_content',
  },
]

export default function TranslationsPage() {
  return (
    <div className="container mx-auto py-8 px-4">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Translations Management</h1>
        <p className="text-muted-foreground">
          Manage multilingual content across the platform. Support for French, English, Spanish, German, Dutch, and Italian.
        </p>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3 mb-8">
        {TRANSLATABLE_ENTITIES.map((entity) => {
          const Icon = entity.icon
          return (
            <Card key={entity.id} className="hover:shadow-lg transition-shadow">
              <CardHeader>
                <div className="flex items-center gap-3 mb-2">
                  <div className="p-2 bg-primary/10 rounded-lg">
                    <Icon className="h-5 w-5 text-primary" />
                  </div>
                  <CardTitle>{entity.name}</CardTitle>
                </div>
                <CardDescription>{entity.description}</CardDescription>
              </CardHeader>
              <CardContent>
                <Link href={entity.href}>
                  <Button className="w-full">
                    Manage Translations
                  </Button>
                </Link>
              </CardContent>
            </Card>
          )
        })}
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Import/Export</CardTitle>
          <CardDescription>
            Bulk import or export translations as JSON files for external processing
          </CardDescription>
        </CardHeader>
        <CardContent className="flex gap-4">
          <Button variant="outline">
            <FileText className="mr-2 h-4 w-4" />
            Export All Translations
          </Button>
          <Button variant="outline">
            <FileText className="mr-2 h-4 w-4" />
            Import Translations
          </Button>
        </CardContent>
      </Card>
    </div>
  )
}
