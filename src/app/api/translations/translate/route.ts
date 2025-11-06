import { NextRequest, NextResponse } from 'next/server'
import { translateText } from '@/lib/translations'

export const runtime = 'nodejs'

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { text, targetLang, sourceLang = 'auto' } = body

    if (!text || !targetLang) {
      return NextResponse.json({ error: 'Missing text or targetLang' }, { status: 400 })
    }

    const translated = await translateText(text, targetLang, sourceLang)

    return NextResponse.json({
      originalText: text,
      translatedText: translated,
      sourceLang: sourceLang === 'auto' ? 'auto' : sourceLang,
      targetLang,
    })
  } catch (error) {
    console.error('Error translating text:', error)
    return NextResponse.json(
      { error: 'Internal server error', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
}

