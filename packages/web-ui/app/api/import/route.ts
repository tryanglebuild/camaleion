import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase-server'

export async function POST(req: NextRequest) {
  try {
    const data = await req.json()

    const isMulti = !Array.isArray(data) && (data.people || data.projects || data.entries)

    const rawEntries: Record<string, unknown>[]  = isMulti ? (data.entries  ?? []) : (Array.isArray(data) ? data : data.entries ?? [])
    const rawPeople: Record<string, unknown>[]   = isMulti ? (data.people   ?? []) : []
    const rawProjects: Record<string, unknown>[] = isMulti ? (data.projects ?? []) : []

    if (rawPeople.length === 0 && rawProjects.length === 0 && rawEntries.length === 0) {
      return NextResponse.json({ error: 'No data found in file' }, { status: 400 })
    }

    const totals: string[] = []

    if (rawPeople.length > 0) {
      const { error } = await supabaseAdmin.from('people').upsert(rawPeople, { onConflict: 'id' })
      if (error) return NextResponse.json({ error: `people: ${error.message}` }, { status: 500 })
      totals.push(`${rawPeople.length} people`)
    }

    if (rawProjects.length > 0) {
      const { error } = await supabaseAdmin.from('projects').upsert(rawProjects, { onConflict: 'id' })
      if (error) return NextResponse.json({ error: `projects: ${error.message}` }, { status: 500 })
      totals.push(`${rawProjects.length} projects`)
    }

    if (rawEntries.length > 0) {
      // Strip joined relation fields that come from the export format
      const entries = rawEntries.map(({ project: _p, person: _pe, ...rest }) => rest)
      const { error } = await supabaseAdmin.from('entries').upsert(entries, { onConflict: 'id' })
      if (error) return NextResponse.json({ error: `entries: ${error.message}` }, { status: 500 })
      totals.push(`${entries.length} entries`)
    }

    return NextResponse.json({ ok: true, imported: totals.join(', ') })
  } catch (err) {
    return NextResponse.json({ error: err instanceof Error ? err.message : 'Unknown' }, { status: 500 })
  }
}
