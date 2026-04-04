import { NextRequest, NextResponse } from 'next/server'
import { chat } from '@/lib/ai'

export async function POST(req: NextRequest) {
  try {
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

    const answer = await chat(
      [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: question },
      ],
      { temperature: 0.3, maxTokens: 512 }
    )

    return NextResponse.json({ answer })
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err)
    console.error('[/api/chat]', msg)
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}
