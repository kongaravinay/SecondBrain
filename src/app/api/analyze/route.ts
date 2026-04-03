import { NextRequest, NextResponse } from 'next/server'
import { chat } from '@/lib/ai'

const SYSTEM_PROMPT = `You are a knowledge analysis engine. Analyze the user's note and return ONLY a valid JSON object — no markdown, no explanation, just raw JSON.

Return exactly this structure:
{
  "tags": ["3-5 short keyword tags"],
  "summary": "one sentence summary",
  "keyInsight": "the single most important takeaway",
  "vector": [20 float values between 0.0 and 1.0]
}

The 20 vector dimensions (in order):
0:AI/ML  1:Programming  2:Mathematics  3:Science  4:Business
5:Health  6:Philosophy  7:Art  8:History  9:Psychology
10:Physics  11:Biology  12:Society  13:Education  14:Technology
15:Personal  16:Language  17:Systems  18:Data  19:Other

Rules: 0.8-1.0 = strongly about this topic. 0.0-0.2 = not present.
Return ONLY the JSON object.`

export async function POST(req: NextRequest) {
  try {
    const { content } = await req.json()
    if (!content || typeof content !== 'string') {
      return NextResponse.json({ error: 'content is required' }, { status: 400 })
    }

    const text = await chat(
      [
        { role: 'system', content: SYSTEM_PROMPT },
        { role: 'user', content: `Analyze this note:\n\n${content}` },
      ],
      { forceJson: true, temperature: 0.1, maxTokens: 512 }
    )

    const cleaned = text.replace(/^```json?\s*/i, '').replace(/```\s*$/i, '').trim()
    const analysis = JSON.parse(cleaned)

    if (!Array.isArray(analysis.tags))         analysis.tags = ['note']
    if (typeof analysis.summary !== 'string')  analysis.summary = 'No summary'
    if (typeof analysis.keyInsight !== 'string') analysis.keyInsight = 'No insight'

    if (!Array.isArray(analysis.vector) || analysis.vector.length !== 20) {
      const v = Array.isArray(analysis.vector) ? analysis.vector : []
      while (v.length < 20) v.push(0.1)
      analysis.vector = v.slice(0, 20)
    }
    analysis.vector = analysis.vector.map((v: unknown) => {
      const n = Number(v)
      return isNaN(n) ? 0 : Math.max(0, Math.min(1, n))
    })

    return NextResponse.json({ analysis })
  } catch (error) {
    console.error('[/api/analyze]', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Analysis failed' },
      { status: 500 }
    )
  }
}
