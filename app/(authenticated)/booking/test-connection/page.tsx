'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'

export default function TestConnectionPage() {
  const [status, setStatus] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function testConnection() {
      try {
        // Test environment variables
        const envTest = {
          url: process.env.NEXT_PUBLIC_SUPABASE_URL,
          hasKey: !!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
          keyPrefix: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY?.substring(0, 20),
        }

        // Create client
        const supabase = createClient()

        // Test 1: Auth
        const {
          data: { user },
          error: authError,
        } = await supabase.auth.getUser()

        // Test 2: Categories (public read)
        const { data: categories, error: categoriesError } = await supabase
          .from('service_categories')
          .select('id, name, slug')
          .is('parent_id', null)
          .limit(3)

        // Test 3: Services (public read)
        const { data: services, error: servicesError } = await supabase
          .from('services')
          .select('id, name, base_price')
          .eq('is_active', true)
          .limit(3)

        setStatus({
          env: envTest,
          auth: {
            userId: user?.id,
            email: user?.email,
            error: authError?.message,
          },
          categories: {
            count: categories?.length || 0,
            data: categories,
            error: categoriesError
              ? {
                  message: categoriesError.message,
                  code: categoriesError.code,
                  details: categoriesError.details,
                  hint: categoriesError.hint,
                }
              : null,
          },
          services: {
            count: services?.length || 0,
            data: services,
            error: servicesError
              ? {
                  message: servicesError.message,
                  code: servicesError.code,
                  details: servicesError.details,
                  hint: servicesError.hint,
                }
              : null,
          },
        })
      } catch (error: any) {
        setStatus({
          error: error.message,
          stack: error.stack,
        })
      } finally {
        setLoading(false)
      }
    }

    testConnection()
  }, [])

  if (loading) {
    return <div className="p-8">Testing connection...</div>
  }

  return (
    <div className="p-8 font-mono text-sm">
      <h1 className="text-2xl font-bold mb-4">Supabase Connection Test</h1>
      <pre className="bg-gray-100 p-4 rounded overflow-auto max-h-screen">
        {JSON.stringify(status, null, 2)}
      </pre>
    </div>
  )
}
