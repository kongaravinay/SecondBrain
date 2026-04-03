import { NextRequest, NextResponse } from 'next/server'
import { chat } from '@/lib/ai'

const SYSTEM_PROMPT = `Convert the search query into a 20-dimensional concept vector.
Return ONLY a JSON array of exactly 20 floats between 0.0 and 1.0. Nothing else.

Dimensions: 0:AI/ML 1:Programming 2:Mathematics 3:Science 4:Business
5:Health 6:Philosophy 7:Art 8:History 9:Psychology 10:Physics 11:Biology
12:Society 13:Education 14:Technology 15:Personal 16:Language 17:Systems 18:Data 19:Other

Set 0.7-1.0 for concepts in the query, 0.0-0.1 for absent ones.
Return ONLY the array like: [0.9, 0.1, 0.0, ...]`

export async function POST(req: NextRequest) {
  try {
    const { query } = await req.json()
    if (!query || typeof query !== 'string') {
      return NextResponse.json({ error: 'query is required' }, { status: 400 })
    }

    const text = await chat(
      [
        { role: 'system', content: SYSTEM_PROMPT },
        { role: 'user', content: `Search query: "${query}"` },
      ],
      { forceJson: true, temperature: 0.1, maxTokens: 128 }
    )

    const cleaned = text.replace(/^```json?\s*/i, '').replace(/```\s*$/i, '').trim()
    const parsed  = JSON.parse(cleaned)

    let vector: number[] = Array.isArray(parsed)
      ? parsed
      : Array.isArray(parsed.vector)
      ? parsed.vector
      : Object.values(parsed)

    while (vector.length < 20) vector.push(0.1)
    vector = vector.slice(0, 20).map((v: unknown) => {
      const n = Number(v)
      return isNaN(n) ? 0 : Math.max(0, Math.min(1, n))
    })

    return NextResponse.json({ vector })
  } catch (error) {
    console.error('[/api/search]', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Search failed' },
      { status: 500 }
    )
  }
}
