import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase-server'

export type ChatSession = {
  id: string
  title: string
  created_at: string
  updated_at: string
  last_message_at: string
  message_count: number
}

export async function GET() {
  try {
    const { data, error } = await supabaseAdmin
      .from('chat_sessions')
      .select('id, title, created_at, updated_at, last_message_at, message_count')
      .order('last_message_at', { ascending: false })

    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json(data ?? [])
  } catch (err) {
    return NextResponse.json({ error: err instanceof Error ? err.message : 'Unknown' }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({}))
    const title = typeof body?.title === 'string' && body.title.trim() ? body.title.trim() : 'New conversation'

    const { data, error } = await supabaseAdmin
      .from('chat_sessions')
      .insert({ title })
      .select('id, title, created_at, updated_at, last_message_at, message_count')
      .single()

    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json(data, { status: 201 })
  } catch (err) {
    return NextResponse.json({ error: err instanceof Error ? err.message : 'Unknown' }, { status: 500 })
  }
}
