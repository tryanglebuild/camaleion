import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase-server'

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { name, description, status, stack, company } = body
    if (!name) return NextResponse.json({ error: 'name required' }, { status: 400 })
    const { data, error } = await supabaseAdmin
      .from('projects')
      .insert({ name, description: description ?? null, status: status ?? 'active', stack: stack ?? null, company: company ?? null })
      .select().single()
    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json(data)
  } catch (err) {
    return NextResponse.json({ error: err instanceof Error ? err.message : 'Unknown' }, { status: 500 })
  }
}
