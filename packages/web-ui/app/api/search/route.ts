import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase-server'

const EMBED_URL = `${process.env.SUPABASE_URL}/functions/v1/embed`

async function runSearch(query: string, limit: number) {
  const embedRes = await fetch(EMBED_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${process.env.SUPABASE_SERVICE_KEY}` },
    body: JSON.stringify({ input: query }),
  })
  const { embedding } = await embedRes.json()

  if (!embedding) {
    // fallback to text search
    const { data } = await supabaseAdmin
      .from('entries')
      .select('*, project:projects(id,name), person:people(id,name)')
      .ilike('title', `%${query}%`)
      .limit(limit)
    return (data ?? []).map((e: Record<string, unknown>) => ({ ...e, similarity: undefined }))
  }

  const { data: matches, error } = await supabaseAdmin.rpc('match_entries', {
    query_embedding: JSON.stringify(embedding),
    match_count: limit,
    filter_type: null,
    filter_project: null,
  })

  if (error || !matches?.length) {
    const { data } = await supabaseAdmin
      .from('entries')
      .select('*, project:projects(id,name), person:people(id,name)')
      .ilike('title', `%${query}%`)
      .limit(limit)
    return (data ?? []).map((e: Record<string, unknown>) => ({ ...e, similarity: undefined }))
  }

  const ids = matches.map((m: { entry_id: string }) => m.entry_id)
  const { data: entries } = await supabaseAdmin
    .from('entries')
    .select('*, project:projects(id,name), person:people(id,name)')
    .in('id', ids)

  const map = new Map((entries ?? []).map((e: { id: string }) => [e.id, e]))
  return matches.map((m: { entry_id: string; score: number }) => ({
    ...(map.get(m.entry_id) as Record<string, unknown>),
    similarity: m.score,
  }))
}

export async function GET(req: NextRequest) {
  try {
    const q = req.nextUrl.searchParams.get('q')
    const limit = Number(req.nextUrl.searchParams.get('limit') ?? 12)
    if (!q) return NextResponse.json({ error: 'q required' }, { status: 400 })
    const results = await runSearch(q, limit)
    return NextResponse.json(results)
  } catch (err) {
    return NextResponse.json({ error: err instanceof Error ? err.message : 'Unknown' }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  try {
    const { query, type, project, limit = 5 } = await req.json()
    if (!query) return NextResponse.json({ error: 'query required' }, { status: 400 })

    const embedRes = await fetch(EMBED_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${process.env.SUPABASE_SERVICE_KEY}` },
      body: JSON.stringify({ input: query }),
    })
    const { embedding } = await embedRes.json()
    if (!embedding) return NextResponse.json({ error: 'Embedding failed' }, { status: 500 })

    let projectId: string | null = null
    if (project) {
      const { data } = await supabaseAdmin.from('projects').select('id').ilike('name', project).single()
      projectId = data?.id ?? null
    }

    const { data: matches, error } = await supabaseAdmin.rpc('match_entries', {
      query_embedding: JSON.stringify(embedding),
      match_count: limit,
      filter_type: type ?? null,
      filter_project: projectId,
    })
    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    if (!matches?.length) return NextResponse.json([])

    const ids = matches.map((m: { entry_id: string }) => m.entry_id)
    const { data: entries } = await supabaseAdmin
      .from('entries')
      .select('*, project:projects(id, name), person:people(id, name)')
      .in('id', ids)

    const map = new Map((entries ?? []).map((e: { id: string }) => [e.id, e]))
    const results = matches.map((m: { entry_id: string; score: number }) => ({
      entry: map.get(m.entry_id),
      score: m.score,
    }))
    return NextResponse.json(results)
  } catch (err) {
    return NextResponse.json({ error: err instanceof Error ? err.message : 'Unknown' }, { status: 500 })
  }
}
