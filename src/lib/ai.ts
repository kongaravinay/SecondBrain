// ============================================================
// SECOND BRAIN — Universal AI Provider
// Supports: Ollama (local) | Groq | Claude | Gemini | xAI Grok
// Set AI_PROVIDER in .env.local to switch between them
// ============================================================

export type Provider = 'ollama' | 'groq' | 'claude' | 'gemini' | 'grok'

export function getProvider(): Provider {
  const p = (process.env.AI_PROVIDER || 'ollama').toLowerCase()
  if (['ollama', 'groq', 'claude', 'gemini', 'grok'].includes(p)) return p as Provider
  return 'ollama'
}

interface ChatMessage { role: 'system' | 'user'; content: string }

interface AIOptions {
  model?: string
  temperature?: number
  maxTokens?: number
  forceJson?: boolean
}

/**
 * Universal chat function — routes to the right provider automatically.
 * Returns the text response from the AI.
 */
export async function chat(messages: ChatMessage[], options: AIOptions = {}): Promise<string> {
  const provider = getProvider()

  switch (provider) {
    case 'ollama':  return chatOllama(messages, options)
    case 'groq':    return chatGroq(messages, options)
    case 'claude':  return chatClaude(messages, options)
    case 'gemini':  return chatGemini(messages, options)
    case 'grok':    return chatGrok(messages, options)
    default:        return chatOllama(messages, options)
  }
}

// ---- OLLAMA (local, free, private) ----
async function chatOllama(messages: ChatMessage[], options: AIOptions): Promise<string> {
  const url   = process.env.OLLAMA_URL   || 'http://localhost:11434'
  const model = process.env.OLLAMA_MODEL || options.model || 'qwen2.5:7b'

  const res = await fetch(`${url}/api/chat`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      model,
      messages,
      stream: false,
      format: options.forceJson ? 'json' : undefined,
      options: { temperature: options.temperature ?? 0.1, num_predict: options.maxTokens ?? 512 },
    }),
  })

  if (!res.ok) throw new Error(`Ollama error ${res.status}: ${await res.text()}`)
  const data = await res.json()
  return data.message?.content ?? ''
}

// ---- GROQ (free cloud, very fast) ----
async function chatGroq(messages: ChatMessage[], options: AIOptions): Promise<string> {
  const apiKey = process.env.GROQ_API_KEY
  if (!apiKey) throw new Error('GROQ_API_KEY is not set in .env.local')

  const model = process.env.GROQ_MODEL || options.model || 'llama-3.3-70b-versatile'

  const res = await fetch('https://api.groq.com/openai/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model,
      messages,
      temperature: options.temperature ?? 0.1,
      max_tokens: options.maxTokens ?? 512,
      response_format: options.forceJson ? { type: 'json_object' } : undefined,
    }),
  })

  if (!res.ok) throw new Error(`Groq error ${res.status}: ${await res.text()}`)
  const data = await res.json()
  return data.choices?.[0]?.message?.content ?? ''
}

// ---- CLAUDE / ANTHROPIC ----
async function chatClaude(messages: ChatMessage[], options: AIOptions): Promise<string> {
  const apiKey = process.env.ANTHROPIC_API_KEY
  if (!apiKey) throw new Error('ANTHROPIC_API_KEY is not set in .env.local')

  const model  = process.env.CLAUDE_MODEL || options.model || 'claude-sonnet-4-6'
  const system = messages.find(m => m.role === 'system')?.content ?? ''
  const userMessages = messages
    .filter(m => m.role !== 'system')
    .map(m => ({ role: m.role, content: m.content }))

  const res = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': apiKey,
      'anthropic-version': '2023-06-01',
    },
    body: JSON.stringify({
      model,
      max_tokens: options.maxTokens ?? 1024,
      system,
      messages: userMessages,
    }),
  })

  if (!res.ok) throw new Error(`Claude error ${res.status}: ${await res.text()}`)
  const data = await res.json()
  return data.content?.[0]?.text ?? ''
}

// ---- GOOGLE GEMINI ----
async function chatGemini(messages: ChatMessage[], options: AIOptions): Promise<string> {
  const apiKey = process.env.GOOGLE_API_KEY
  if (!apiKey) throw new Error('GOOGLE_API_KEY is not set in .env.local')

  const model  = process.env.GEMINI_MODEL || options.model || 'gemini-1.5-flash'
  const system = messages.find(m => m.role === 'system')?.content ?? ''
  const userMsgs = messages.filter(m => m.role !== 'system')

  const res = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        system_instruction: system ? { parts: [{ text: system }] } : undefined,
        contents: userMsgs.map(m => ({ role: m.role === 'user' ? 'user' : 'model', parts: [{ text: m.content }] })),
        generationConfig: {
          temperature: options.temperature ?? 0.1,
          maxOutputTokens: options.maxTokens ?? 512,
          responseMimeType: options.forceJson ? 'application/json' : 'text/plain',
        },
      }),
    }
  )

  if (!res.ok) throw new Error(`Gemini error ${res.status}: ${await res.text()}`)
  const data = await res.json()
  return data.candidates?.[0]?.content?.parts?.[0]?.text ?? ''
}

// ---- xAI GROK ----
// xAI API is OpenAI-compatible — easy to integrate
async function chatGrok(messages: ChatMessage[], options: AIOptions): Promise<string> {
  const apiKey = process.env.XAI_API_KEY
  if (!apiKey) throw new Error('XAI_API_KEY is not set in .env.local')

  const model = process.env.GROK_MODEL || options.model || 'grok-3-mini'

  const res = await fetch('https://api.x.ai/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model,
      messages,
      temperature: options.temperature ?? 0.1,
      max_tokens: options.maxTokens ?? 512,
      response_format: options.forceJson ? { type: 'json_object' } : undefined,
    }),
  })

  if (!res.ok) throw new Error(`Grok error ${res.status}: ${await res.text()}`)
  const data = await res.json()
  return data.choices?.[0]?.message?.content ?? ''
}
