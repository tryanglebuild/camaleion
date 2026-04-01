import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase-server'

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const days = parseInt(searchParams.get('days') ?? '365')

  const since = new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString()

  const { data, error } = await supabaseAdmin
    .from('entries')
    .select('created_at')
    .gte('created_at', since)
    .order('created_at', { ascending: true })

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  // Group by day
  const counts: Record<string, number> = {}
  for (const row of data ?? []) {
    const day = row.created_at.slice(0, 10)
    counts[day] = (counts[day] ?? 0) + 1
  }

  const result = Object.entries(counts).map(([date, count]) => ({ date, count }))
  return NextResponse.json(result)
}
