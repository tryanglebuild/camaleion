import { NextRequest, NextResponse } from 'next/server'
import { getConfig } from '@/lib/config.server'

export async function POST(req: NextRequest) {
  try {
    const { query, results } = await req.json()
    if (!results?.length) {
      return NextResponse.json({ answer: `No results found for "${query}".` })
    }

    const { supabaseUrl, supabaseServiceKey } = getConfig()
    if (!supabaseUrl || !supabaseServiceKey) {
      return NextResponse.json({ error: 'Supabase not configured' }, { status: 500 })
    }

    const ragUrl = `${supabaseUrl}/functions/v1/rag-answer`
    const upstream = await fetch(ragUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${supabaseServiceKey}`,
      },
      body: JSON.stringify({ query, results }),
    })

    if (!upstream.ok) {
      const err = await upstream.text()
      return NextResponse.json({ error: err }, { status: upstream.status })
    }

    return new Response(upstream.body, {
      headers: {
        'Content-Type': upstream.headers.get('Content-Type') ?? 'text/event-stream',
        'Cache-Control': 'no-cache',
        'X-Accel-Buffering': 'no',
      },
    })
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Unknown' },
      { status: 500 }
    )
  }
}
