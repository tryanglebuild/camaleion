import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase-server'

export type ChatMessage = {
  id: string
  session_id: string
  role: 'user' | 'assistant'
  content: string
  tool_calls: unknown[]
  created_at: string
}

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params

    const { data: session, error: sessionError } = await supabaseAdmin
      .from('chat_sessions')
      .select('*')
      .eq('id', id)
      .single()

    if (sessionError || !session) {
      return NextResponse.json({ error: 'Session not found' }, { status: 404 })
    }

    const { data: messages, error: messagesError } = await supabaseAdmin
      .from('chat_messages')
      .select('*')
      .eq('session_id', id)
      .order('created_at', { ascending: true })

    if (messagesError) return NextResponse.json({ error: messagesError.message }, { status: 500 })

    return NextResponse.json({ session, messages: messages ?? [] })
  } catch (err) {
    return NextResponse.json({ error: err instanceof Error ? err.message : 'Unknown' }, { status: 500 })
  }
}

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const body = await req.json()

    if (typeof body?.title !== 'string' || !body.title.trim()) {
      return NextResponse.json({ error: 'title must be a non-empty string' }, { status: 400 })
    }

    const { data, error } = await supabaseAdmin
      .from('chat_sessions')
      .update({ title: body.title.trim(), updated_at: new Date().toISOString() })
      .eq('id', id)
      .select('id, title, created_at, updated_at, last_message_at, message_count')
      .single()

    if (error || !data) return NextResponse.json({ error: 'Session not found' }, { status: 404 })
    return NextResponse.json(data)
  } catch (err) {
    return NextResponse.json({ error: err instanceof Error ? err.message : 'Unknown' }, { status: 500 })
  }
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params

    const { data: existing, error: fetchError } = await supabaseAdmin
      .from('chat_sessions')
      .select('id')
      .eq('id', id)
      .single()

    if (fetchError || !existing) {
      return NextResponse.json({ error: 'Session not found' }, { status: 404 })
    }

    const { error } = await supabaseAdmin.from('chat_sessions').delete().eq('id', id)
    if (error) return NextResponse.json({ error: error.message }, { status: 500 })

    return NextResponse.json({ success: true })
  } catch (err) {
    return NextResponse.json({ error: err instanceof Error ? err.message : 'Unknown' }, { status: 500 })
  }
}
