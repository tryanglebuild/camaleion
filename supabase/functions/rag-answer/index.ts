import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'

const CORS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

const OPENROUTER_URL = 'https://openrouter.ai/api/v1/chat/completions'
const FREE_MODEL     = 'meta-llama/llama-3.1-8b-instruct:free'

interface ResultEntry {
  title:   string
  content: string | null
  type:    string
  status:  string | null
  similarity?: number
}

function buildPrompt(query: string, results: ResultEntry[]): string {
  const ctx = results
    .slice(0, 8)
    .map((r, i) => {
      const score = r.similarity !== undefined ? ` [${(r.similarity * 100).toFixed(0)}% match]` : ''
      const body  = r.content ? `\n${r.content.slice(0, 400)}` : ''
      return `[${i + 1}] ${r.type.toUpperCase()}${score} — ${r.title}${body}`
    })
    .join('\n\n')

  return `You are a personal knowledge assistant. Answer the user's question based ONLY on the context below.
Be concise and direct. If the context doesn't contain enough information, say so.
Do NOT make up information. Reference entries by their number [1], [2], etc. when relevant.

CONTEXT:
${ctx}

QUESTION: ${query}

ANSWER:`
}

serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: CORS })

  const apiKey = Deno.env.get('OPENROUTER_API_KEY')
  if (!apiKey) {
    return new Response(JSON.stringify({ error: 'OPENROUTER_API_KEY not set' }), {
      status: 500, headers: { ...CORS, 'Content-Type': 'application/json' },
    })
  }

  try {
    const { query, results } = await req.json() as { query: string; results: ResultEntry[] }

    if (!query || !results?.length) {
      return new Response(JSON.stringify({ answer: '' }), {
        headers: { ...CORS, 'Content-Type': 'application/json' },
      })
    }

    const prompt = buildPrompt(query, results)

    // Call OpenRouter with streaming
    const orRes = await fetch(OPENROUTER_URL, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
        'HTTP-Referer': 'https://context-engine.local',
        'X-Title': 'Context Engine',
      },
      body: JSON.stringify({
        model: FREE_MODEL,
        stream: true,
        messages: [{ role: 'user', content: prompt }],
        max_tokens: 512,
        temperature: 0.3,
      }),
    })

    if (!orRes.ok) {
      const err = await orRes.text()
      return new Response(JSON.stringify({ error: err }), {
        status: 502, headers: { ...CORS, 'Content-Type': 'application/json' },
      })
    }

    // Stream SSE back to client
    const { readable, writable } = new TransformStream()
    const writer = writable.getWriter()
    const encoder = new TextEncoder()

    ;(async () => {
      const reader = orRes.body!.getReader()
      const dec = new TextDecoder()
      try {
        while (true) {
          const { done, value } = await reader.read()
          if (done) break
          const chunk = dec.decode(value)
          const lines = chunk.split('\n').filter(l => l.startsWith('data: '))
          for (const line of lines) {
            const data = line.slice(6).trim()
            if (data === '[DONE]') { await writer.write(encoder.encode('data: [DONE]\n\n')); continue }
            try {
              const json = JSON.parse(data)
              const token = json.choices?.[0]?.delta?.content ?? ''
              if (token) await writer.write(encoder.encode(`data: ${JSON.stringify({ token })}\n\n`))
            } catch { /* skip malformed */ }
          }
        }
      } finally {
        await writer.close()
      }
    })()

    return new Response(readable, {
      headers: {
        ...CORS,
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive',
      },
    })
  } catch (e) {
    return new Response(JSON.stringify({ error: String(e) }), {
      status: 500, headers: { ...CORS, 'Content-Type': 'application/json' },
    })
  }
})
