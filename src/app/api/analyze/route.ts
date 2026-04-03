import { NextRequest, NextResponse } from 'next/server'

const GROQ_API_KEY = process.env.GROQ_API_KEY
const GROQ_MODEL   = process.env.GROQ_MODEL || 'llama-3.3-70b-versatile'

const SYSTEM_PROMPT = `You are a knowledge analysis engine. Analyze the user's note and return ONLY a valid JSON object.

Return exactly this structure:
{
  "tags": ["3-5 short keyword tags"],
  "summary": "one sentence summary",
  "keyInsight": "the single most important takeaway",
  "vector": [20 float values between 0.0 and 1.0]
}

The 20 vector dimensions (in order):
0:AI/ML 1:Programming 2:Mathematics 3:Science 4:Business
5:Health 6:Philosophy 7:Art 8:History 9:Psychology
10:Physics 11:Biology 12:Society 13:Education 14:Technology
15:Personal 16:Language 17:Systems 18:Data 19:Other

Rules: 0.8-1.0 = strongly about this topic. 0.0-0.2 = not present.
Return ONLY the JSON object. No markdown. No explanation.`

export async function POST(req: NextRequest) {
  try {
    // Check API key
    if (!GROQ_API_KEY) {
      return NextResponse.json({ error: 'GROQ_API_KEY not configured on server' }, { status: 500 })
    }

    const { content } = await req.json()
    if (!content || typeof content !== 'string') {
      return NextResponse.json({ error: 'content is required' }, { status: 400 })
    }

    // Call Groq directly — no abstraction layer
    const res = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${GROQ_API_KEY}`,
      },
      body: JSON.stringify({
        model: GROQ_MODEL,
        messages: [
          { role: 'system', content: SYSTEM_PROMPT },
          { role: 'user',   content: `Analyze this note:\n\n${content}` },
        ],
        temperature: 0.1,
        max_tokens: 512,
        response_format: { type: 'json_object' },
      }),
    })

    if (!res.ok) {
      const errText = await res.text()
      return NextResponse.json({ error: `Groq API error ${res.status}: ${errText}` }, { status: 500 })
    }

    const data   = await res.json()
    const text   = data.choices?.[0]?.message?.content ?? ''
    const analysis = JSON.parse(text)

    // Sanitize
    if (!Array.isArray(analysis.tags))           analysis.tags = ['note']
    if (typeof analysis.summary !== 'string')    analysis.summary = 'No summary'
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
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err)
    console.error('[/api/analyze]', msg)
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}
