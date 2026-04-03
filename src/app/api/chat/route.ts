import { NextRequest, NextResponse } from 'next/server'

const GROQ_API_KEY = process.env.GROQ_API_KEY
const GROQ_MODEL   = process.env.GROQ_MODEL || 'llama-3.3-70b-versatile'

export async function POST(req: NextRequest) {
  try {
    if (!GROQ_API_KEY) {
      return NextResponse.json({ error: 'GROQ_API_KEY not configured' }, { status: 500 })
    }

    const { question, context } = await req.json()
    if (!question || typeof question !== 'string') {
      return NextResponse.json({ error: 'question is required' }, { status: 400 })
    }

    const contextBlock = Array.isArray(context) && context.length > 0
      ? `Here are the most relevant notes from the user's Second Brain:\n\n${context
          .map((c: string, i: number) => `[Note ${i + 1}]: ${c}`)
          .join('\n\n')}\n\n---\n\n`
      : ''

    const systemPrompt = contextBlock
      ? `You are a personal knowledge assistant for a Second Brain app. Answer the user's question using ONLY the notes provided below. If the notes don't contain enough information to answer, say so honestly. Be concise and direct. Reference specific notes when relevant.\n\n${contextBlock}`
      : `You are a personal knowledge assistant. The user's Second Brain has no notes yet. Encourage them to add some notes first.`

    const res = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${GROQ_API_KEY}`,
      },
      body: JSON.stringify({
        model: GROQ_MODEL,
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: question },
        ],
        temperature: 0.3,
        max_tokens: 512,
      }),
    })

    if (!res.ok) {
      const errText = await res.text()
      return NextResponse.json({ error: `Groq API error ${res.status}: ${errText}` }, { status: 500 })
    }

    const data = await res.json()
    const answer = data.choices?.[0]?.message?.content ?? 'No response'

    return NextResponse.json({ answer })
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err)
    console.error('[/api/chat]', msg)
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}
