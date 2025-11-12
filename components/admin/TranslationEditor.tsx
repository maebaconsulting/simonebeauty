'use client'

import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Globe, Save, Loader2 } from 'lucide-react'
import { locales, localeNames, localeFlags, type Locale } from '@/i18n/config'
import { useToast } from '@/hooks/use-toast'

interface Translation {
  id: number
  entity_type: string
  entity_id: number
  field_name: string
  language_code: string
  value: string
}

interface TranslationEditorProps {
  entityType: string
  items: Array<{ id: number; name: string }>
  existingTranslations: Translation[]
  fields: string[]
}

export function TranslationEditor({
  entityType,
  items,
  existingTranslations,
  fields,
}: TranslationEditorProps) {
  const [translations, setTranslations] = useState<Record<string, string>>(() => {
    // Build initial state from existing translations
    const initial: Record<string, string> = {}
    existingTranslations.forEach((t) => {
      const key = `${t.entity_id}-${t.field_name}-${t.language_code}`
      initial[key] = t.value
    })
    return initial
  })

  const [saving, setSaving] = useState(false)
  const [translating, setTranslating] = useState<string | null>(null)
  const { toast } = useToast()

  const getTranslationKey = (itemId: number, field: string, locale: Locale) => {
    return `${itemId}-${field}-${locale}`
  }

  const handleTranslationChange = (
    itemId: number,
    field: string,
    locale: Locale,
    value: string
  ) => {
    const key = getTranslationKey(itemId, field, locale)
    setTranslations((prev) => ({
      ...prev,
      [key]: value,
    }))
  }

  const handleSave = async () => {
    setSaving(true)
    try {
      const response = await fetch('/api/admin/translations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          entityType,
          translations: Object.entries(translations).map(([key, value]) => {
            const [entityId, fieldName, languageCode] = key.split('-')
            return {
              entity_id: parseInt(entityId),
              field_name: fieldName,
              language_code: languageCode,
              value,
            }
          }),
        }),
      })

      if (!response.ok) throw new Error('Failed to save translations')

      toast({
        title: 'Success',
        description: 'Translations saved successfully',
      })
    } catch (error) {
      console.error('Error saving translations:', error)
      toast({
        title: 'Error',
        description: 'Failed to save translations',
        variant: 'destructive',
      })
    } finally {
      setSaving(false)
    }
  }

  const handleAutoTranslate = async (itemId: number, field: string) => {
    const key = `${itemId}-${field}`
    setTranslating(key)

    try {
      // Get the French (source) text
      const frenchKey = getTranslationKey(itemId, field, 'fr')
      const sourceText = translations[frenchKey]

      if (!sourceText) {
        toast({
          title: 'Error',
          description: 'French text is required for auto-translation',
          variant: 'destructive',
        })
        return
      }

      // Translate to all other languages
      const response = await fetch('/api/admin/translate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          text: sourceText,
          sourceLang: 'fr',
          targetLangs: locales.filter((l) => l !== 'fr'),
        }),
      })

      if (!response.ok) throw new Error('Translation failed')

      const result = await response.json()

      // Update translations state with auto-translated values
      const newTranslations = { ...translations }
      Object.entries(result.translations).forEach(([lang, text]) => {
        const key = getTranslationKey(itemId, field, lang as Locale)
        newTranslations[key] = text as string
      })

      setTranslations(newTranslations)

      toast({
        title: 'Success',
        description: 'Text translated automatically',
      })
    } catch (error) {
      console.error('Error auto-translating:', error)
      toast({
        title: 'Error',
        description: 'Auto-translation failed',
        variant: 'destructive',
      })
    } finally {
      setTranslating(null)
    }
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle>Manage Translations</CardTitle>
        <Button onClick={handleSave} disabled={saving}>
          {saving ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Saving...
            </>
          ) : (
            <>
              <Save className="mr-2 h-4 w-4" />
              Save All
            </>
          )}
        </Button>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue={locales[0]}>
          <TabsList className="grid w-full grid-cols-6">
            {locales.map((locale) => (
              <TabsTrigger key={locale} value={locale}>
                <span className="mr-1">{localeFlags[locale]}</span>
                <span className="hidden sm:inline">{localeNames[locale]}</span>
                <span className="sm:hidden">{locale.toUpperCase()}</span>
              </TabsTrigger>
            ))}
          </TabsList>

          {locales.map((locale) => (
            <TabsContent key={locale} value={locale} className="mt-4">
              <div className="rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-[200px]">Item</TableHead>
                      {fields.map((field) => (
                        <TableHead key={field}>
                          {field.charAt(0).toUpperCase() + field.slice(1)}
                        </TableHead>
                      ))}
                      <TableHead className="w-[100px]">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {items.map((item) => (
                      <TableRow key={item.id}>
                        <TableCell className="font-medium">{item.name}</TableCell>
                        {fields.map((field) => {
                          const key = getTranslationKey(item.id, field, locale)
                          const value = translations[key] || ''
                          const isLongText = field === 'description'

                          return (
                            <TableCell key={field}>
                              {isLongText ? (
                                <Textarea
                                  value={value}
                                  onChange={(e) =>
                                    handleTranslationChange(
                                      item.id,
                                      field,
                                      locale,
                                      e.target.value
                                    )
                                  }
                                  placeholder={`${field} in ${localeNames[locale]}`}
                                  rows={3}
                                  className="min-w-[300px]"
                                />
                              ) : (
                                <Input
                                  value={value}
                                  onChange={(e) =>
                                    handleTranslationChange(
                                      item.id,
                                      field,
                                      locale,
                                      e.target.value
                                    )
                                  }
                                  placeholder={`${field} in ${localeNames[locale]}`}
                                  className="min-w-[200px]"
                                />
                              )}
                            </TableCell>
                          )
                        })}
                        <TableCell>
                          {locale !== 'fr' && (
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => handleAutoTranslate(item.id, fields[0])}
                              disabled={translating === `${item.id}-${fields[0]}`}
                            >
                              {translating === `${item.id}-${fields[0]}` ? (
                                <Loader2 className="h-4 w-4 animate-spin" />
                              ) : (
                                <Globe className="h-4 w-4" />
                              )}
                            </Button>
                          )}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </TabsContent>
          ))}
        </Tabs>
      </CardContent>
    </Card>
  )
}
