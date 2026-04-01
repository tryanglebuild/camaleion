import { NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase-server'

export async function GET() {
  const { data, error } = await supabaseAdmin
    .from('entries')
    .select('project_id, status')

  if (error) return NextResponse.json({}, { status: 500 })

  const health: Record<string, { done: number; pending: number; in_progress: number; blocked: number }> = {}
  for (const e of data ?? []) {
    if (!e.project_id) continue
    if (!health[e.project_id]) health[e.project_id] = { done: 0, pending: 0, in_progress: 0, blocked: 0 }
    const s = e.status as keyof (typeof health)[string]
    if (s in health[e.project_id]) health[e.project_id][s]++
  }
  return NextResponse.json(health)
}
