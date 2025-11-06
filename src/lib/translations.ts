/**
 * Translation service with caching
 * Supports DeepL or Google Translate API
 */

import { supabase } from './db'

interface TranslationCache {
  originalText: string
  translatedText: string
  sourceLang: string
  targetLang: string
}

/**
 * Translate text with caching
 */
export async function translateText(
  text: string,
  targetLang: string,
  sourceLang: string = 'auto'
): Promise<string> {
  if (!text || text.trim().length === 0) {
    return text
  }

  // Check cache first
  const cached = await getCachedTranslation(text, sourceLang, targetLang)
  if (cached) {
    return cached
  }

  // Translate using API
  const translated = await callTranslationAPI(text, targetLang, sourceLang)

  // Cache the result
  if (translated) {
    await cacheTranslation(text, translated, sourceLang, targetLang)
  }

  return translated || text
}

async function getCachedTranslation(
  text: string,
  sourceLang: string,
  targetLang: string
): Promise<string | null> {
  try {
    const { data, error } = await supabase
      .from('TranslationCache')
      .select('translatedText')
      .eq('originalText', text)
      .eq('sourceLang', sourceLang)
      .eq('targetLang', targetLang)
      .single()

    if (error || !data) {
      return null
    }

    return data.translatedText
  } catch (error) {
    console.error('Error fetching cached translation:', error)
    return null
  }
}

async function cacheTranslation(
  originalText: string,
  translatedText: string,
  sourceLang: string,
  targetLang: string
): Promise<void> {
  try {
    await supabase
      .from('TranslationCache')
      .insert({
        id: crypto.randomUUID(),
        originalText,
        translatedText,
        sourceLang,
        targetLang,
      })
  } catch (error) {
    console.error('Error caching translation:', error)
    // Ignore cache errors - translation still works
  }
}

async function callTranslationAPI(
  text: string,
  targetLang: string,
  sourceLang: string
): Promise<string | null> {
  const apiKey = process.env.DEEPL_API_KEY || process.env.GOOGLE_TRANSLATE_API_KEY

  if (!apiKey) {
    console.warn('No translation API key configured. Returning original text.')
    return text // Return original if no API key
  }

  // Try DeepL first (if key is DeepL format)
  if (process.env.DEEPL_API_KEY) {
    try {
      const langCode = targetLang === 'pl' ? 'PL' : targetLang.toUpperCase()
      const response = await fetch('https://api-free.deepl.com/v2/translate', {
        method: 'POST',
        headers: {
          'Authorization': `DeepL-Auth-Key ${apiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          text: [text],
          target_lang: langCode,
          source_lang: sourceLang === 'auto' ? undefined : sourceLang.toUpperCase(),
        }),
      })

      if (response.ok) {
        const data = await response.json()
        return data.translations?.[0]?.text || null
      }
    } catch (error) {
      console.error('DeepL translation error:', error)
    }
  }

  // Fallback to Google Translate (if key is Google format)
  if (process.env.GOOGLE_TRANSLATE_API_KEY) {
    try {
      const response = await fetch(
        `https://translation.googleapis.com/language/translate/v2?key=${apiKey}`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            q: text,
            target: targetLang,
            source: sourceLang === 'auto' ? undefined : sourceLang,
          }),
        }
      )

      if (response.ok) {
        const data = await response.json()
        return data.data?.translations?.[0]?.translatedText || null
      }
    } catch (error) {
      console.error('Google Translate error:', error)
    }
  }

  return null
}

/**
 * Detect language of text
 */
export async function detectLanguage(text: string): Promise<string> {
  // Simple heuristic - can be enhanced with API
  // For now, return 'auto' or detect basic patterns
  return 'auto'
}

