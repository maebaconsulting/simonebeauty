/**
 * OpenAI Client Configuration
 * Feature: 017-image-management
 *
 * Configured OpenAI client for GPT-4 Vision API
 */

import OpenAI from 'openai'

// Singleton instance
let openaiClient: OpenAI | null = null

/**
 * Get or create OpenAI client instance
 * Uses OPENAI_API_KEY from environment variables
 */
export function getOpenAIClient(): OpenAI {
  if (!openaiClient) {
    const apiKey = process.env.OPENAI_API_KEY

    if (!apiKey || apiKey === 'sk_YOUR_OPENAI_API_KEY_HERE') {
      throw new Error(
        'OpenAI API key not configured. Please set OPENAI_API_KEY in .env.local'
      )
    }

    openaiClient = new OpenAI({
      apiKey,
    })
  }

  return openaiClient
}

/**
 * Check if OpenAI is properly configured
 */
export function isOpenAIConfigured(): boolean {
  const apiKey = process.env.OPENAI_API_KEY
  return !!apiKey && apiKey !== 'sk_YOUR_OPENAI_API_KEY_HERE'
}
