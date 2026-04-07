import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase-server'

export async function GET(req: NextRequest) {
  try {
    const sp = req.nextUrl.searchParams
    const format = sp.get('format') ?? 'json'        // json | csv
    const type   = sp.get('type')                    // optional entry type filter
    const project = sp.get('project')                // optional project name filter

    let q = supabaseAdmin
      .from('entries')
      .select('id, type, title, content, status, pinned, tags, created_at, updated_at, project:projects(name), person:people(name)')
      .order('created_at', { ascending: false })

    if (type) q = q.eq('type', type)
    if (project) {
      const { data: proj } = await supabaseAdmin
        .from('projects')
        .select('id')
        .ilike('name', project)
        .single()
      if (proj) q = q.eq('project_id', proj.id)
      else {
        // Unknown project — return empty result
        return new NextResponse(format === 'csv' ? 'id,type,title,content,status,pinned,tags,project,created_at\n' : '[]', {
          headers: {
            'Content-Type': format === 'csv' ? 'text/csv' : 'application/json',
            'Content-Disposition': `attachment; filename="context-engine-${new Date().toISOString().slice(0, 10)}.${format === 'csv' ? 'csv' : 'json'}"`,
          },
        })
      }
    }

    const { data, error } = await q
    if (error) return NextResponse.json({ error: error.message }, { status: 500 })

    const entries = data ?? []

    if (format === 'csv') {
      const cols = ['id', 'type', 'title', 'content', 'status', 'pinned', 'tags', 'project', 'created_at']
      const escape = (v: unknown) => {
        if (v == null) return ''
        const s = Array.isArray(v) ? v.join('; ') : String(v)
        return s.includes(',') || s.includes('"') || s.includes('\n')
          ? `"${s.replace(/"/g, '""')}"`
          : s
      }
      const rows = entries.map(e => [
        e.id, e.type, e.title, e.content ?? '', e.status ?? '',
        e.pinned, (e.tags ?? []).join('; '),
        (Array.isArray(e.project) ? e.project[0] : e.project as { name: string } | null)?.name ?? '',
        e.created_at,
      ].map(escape).join(','))
      const csv = [cols.join(','), ...rows].join('\n')
      return new NextResponse(csv, {
        headers: {
          'Content-Type': 'text/csv',
          'Content-Disposition': `attachment; filename="context-engine-${new Date().toISOString().slice(0, 10)}.csv"`,
        },
      })
    }

    // JSON
    return new NextResponse(JSON.stringify(entries, null, 2), {
      headers: {
        'Content-Type': 'application/json',
        'Content-Disposition': `attachment; filename="context-engine-${new Date().toISOString().slice(0, 10)}.json"`,
      },
    })
  } catch (err) {
    return NextResponse.json({ error: err instanceof Error ? err.message : 'Unknown' }, { status: 500 })
  }
}
