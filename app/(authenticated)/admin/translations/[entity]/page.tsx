import { notFound } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { TranslationEditor } from '@/components/admin/TranslationEditor'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { ArrowLeft } from 'lucide-react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'

/**
 * Translation Editor Page for Specific Entity Type
 *
 * Displays all items of the given entity type with their translations
 * across all supported languages.
 */

interface PageProps {
  params: {
    entity: string
  }
}

// Valid entity types
const VALID_ENTITIES = ['service_categories', 'specialties', 'services', 'ui_content'] as const
type EntityType = (typeof VALID_ENTITIES)[number]

const ENTITY_CONFIG: Record<EntityType, {
  title: string
  description: string
  tableName: string
  fields: string[]
}> = {
  service_categories: {
    title: 'Service Categories',
    description: 'Manage translations for service category names and descriptions',
    tableName: 'service_categories',
    fields: ['name', 'description'],
  },
  specialties: {
    title: 'Specialties',
    description: 'Manage translations for specialty names',
    tableName: 'specialties',
    fields: ['name'],
  },
  services: {
    title: 'Services',
    description: 'Manage translations for service names and descriptions',
    tableName: 'services',
    fields: ['name', 'description'],
  },
  ui_content: {
    title: 'UI Content',
    description: 'Manage translations for user interface labels and messages',
    tableName: 'translations',
    fields: ['value'],
  },
}

export default async function EntityTranslationsPage({ params }: PageProps) {
  const { entity } = params

  // Validate entity type
  if (!VALID_ENTITIES.includes(entity as EntityType)) {
    notFound()
  }

  const entityType = entity as EntityType
  const config = ENTITY_CONFIG[entityType]
  const supabase = await createClient()

  // Fetch all items of this entity type
  const { data: items, error } = await supabase
    .from(config.tableName)
    .select('id, name')
    .order('name')

  if (error) {
    console.error(`Error fetching ${entity}:`, error)
    return (
      <div className="container mx-auto py-8 px-4">
        <div className="text-center">
          <p className="text-destructive">Error loading data. Please try again later.</p>
        </div>
      </div>
    )
  }

  // Fetch existing translations for these items
  const itemIds = items?.map(item => item.id) || []
  const { data: translations } = await supabase
    .from('translations')
    .select('*')
    .eq('entity_type', entity)
    .in('entity_id', itemIds)

  return (
    <div className="container mx-auto py-8 px-4">
      <div className="mb-6">
        <Link href="/admin/translations">
          <Button variant="ghost" size="sm" className="mb-4">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Translations
          </Button>
        </Link>

        <h1 className="text-3xl font-bold mb-2">{config.title}</h1>
        <p className="text-muted-foreground">{config.description}</p>
      </div>

      <TranslationEditor
        entityType={entity}
        items={items || []}
        existingTranslations={translations || []}
        fields={config.fields}
      />
    </div>
  )
}
