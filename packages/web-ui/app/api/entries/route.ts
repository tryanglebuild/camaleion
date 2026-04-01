import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase-server'

const EMBED_URL = `${process.env.SUPABASE_URL}/functions/v1/embed`

async function embed(text: string): Promise<number[]> {
  const res = await fetch(EMBED_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${process.env.SUPABASE_SERVICE_KEY}`,
    },
    body: JSON.stringify({ input: text }),
  })
  const data = await res.json()
  if (!data.embedding) throw new Error('Embed failed')
  return data.embedding
}

export async function GET(req: NextRequest) {
  try {
    const sp = req.nextUrl.searchParams
    const limit = Number(sp.get('limit') ?? 12)
    const person_id = sp.get('person_id')
    const type = sp.get('type')
    const status = sp.get('status')

    let q = supabaseAdmin
      .from('entries')
      .select('*, project:projects(id, name), person:people(id, name)')
      .order('created_at', { ascending: false })
      .limit(limit)

    if (person_id) q = q.eq('person_id', person_id)
    if (type) q = q.eq('type', type)
    if (status) q = q.eq('status', status)

    const { data, error } = await q
    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json(data ?? [])
  } catch (err) {
    return NextResponse.json({ error: err instanceof Error ? err.message : 'Unknown' }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { type, title, content, project, person, tags, status, metadata } = body

    if (!type || !title) {
      return NextResponse.json({ error: 'type and title are required' }, { status: 400 })
    }

    // Resolve project
    let project_id: string | null = null
    if (project) {
      const { data: proj } = await supabaseAdmin
        .from('projects').select('id').ilike('name', project).single()
      if (proj) {
        project_id = proj.id
      } else {
        const { data: created } = await supabaseAdmin
          .from('projects').insert({ name: project }).select('id').single()
        project_id = created?.id ?? null
      }
    }

    // Resolve person
    let person_id: string | null = null
    if (person) {
      const { data: per } = await supabaseAdmin
        .from('people').select('id').ilike('name', person).single()
      person_id = per?.id ?? null
    }

    const { data: entry, error } = await supabaseAdmin
      .from('entries')
      .insert({ type, title, content: content ?? null, status: status ?? null, project_id, person_id, tags: tags ?? null, metadata: metadata ?? null })
      .select('id, created_at').single()

    if (error) return NextResponse.json({ error: error.message }, { status: 500 })

    // Auto-embed
    const textToEmbed = [title, content].filter(Boolean).join('\n')
    const embedding = await embed(textToEmbed)
    await supabaseAdmin.from('embeddings').insert({
      entry_id: entry.id,
      embedding: JSON.stringify(embedding),
      content: textToEmbed,
    })

    return NextResponse.json(entry)
  } catch (err) {
    return NextResponse.json({ error: err instanceof Error ? err.message : 'Unknown error' }, { status: 500 })
  }
}
