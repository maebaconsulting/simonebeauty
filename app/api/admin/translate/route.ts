import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { v2 } from '@google-cloud/translate'

/**
 * Google Translate API Route
 *
 * Uses Google Cloud Translation API to automatically translate text
 * from source language to multiple target languages.
 *
 * Configuration:
 * - Set GOOGLE_TRANSLATE_API_KEY in .env.local
 * - Or use GOOGLE_APPLICATION_CREDENTIALS for service account
 */

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()

    // Verify user is authenticated and is admin
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Check if user has admin or manager role
    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single()

    if (!profile || (profile.role !== 'admin' && profile.role !== 'manager')) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const body = await request.json()
    const { text, sourceLang, targetLangs } = body

    if (!text || !sourceLang || !targetLangs || !Array.isArray(targetLangs)) {
      return NextResponse.json({ error: 'Invalid request body' }, { status: 400 })
    }

    // Check if API key is configured
    const apiKey = process.env.GOOGLE_TRANSLATE_API_KEY

    if (!apiKey) {
      // Return mock translations for development/testing
      console.warn('Google Translate API key not configured. Using mock translations.')
      const mockTranslations: Record<string, string> = {}
      targetLangs.forEach((lang) => {
        mockTranslations[lang] = `[${lang.toUpperCase()}] ${text}`
      })
      return NextResponse.json({
        translations: mockTranslations,
        mock: true,
      })
    }

    // Initialize Google Translate client
    const translate = new v2.Translate({
      key: apiKey,
    })

    // Translate to all target languages
    const translations: Record<string, string> = {}

    for (const targetLang of targetLangs) {
      try {
        const [translation] = await translate.translate(text, {
          from: sourceLang,
          to: targetLang,
        })
        translations[targetLang] = translation
      } catch (error) {
        console.error(`Error translating to ${targetLang}:`, error)
        // Fallback to mock translation if API call fails
        translations[targetLang] = `[${targetLang.toUpperCase()}] ${text}`
      }
    }

    return NextResponse.json({ translations })
  } catch (error) {
    console.error('Error in translate API:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
