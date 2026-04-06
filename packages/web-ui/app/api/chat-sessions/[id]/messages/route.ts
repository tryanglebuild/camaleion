import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase-server'

type ChatMessage = {
  id: string
  session_id: string
  role: 'user' | 'assistant'
  content: string
  tool_calls: unknown[]
  created_at: string
}

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const body = await req.json()
    const { role, content, tool_calls } = body
    const { id } = await params

    if (role !== 'user' && role !== 'assistant') {
      return NextResponse.json({ error: 'Invalid role' }, { status: 400 })
    }

    if (role === 'user' && (!content || typeof content !== 'string' || content.trim() === '')) {
      return NextResponse.json({ error: 'Content required' }, { status: 400 })
    }

    const { data: session, error: sessionError } = await supabaseAdmin
      .from('chat_sessions')
      .select('id, message_count')
      .eq('id', id)
      .single()

    if (sessionError || !session) {
      return NextResponse.json({ error: 'Session not found' }, { status: 404 })
    }

    const { data: message, error: insertError } = await supabaseAdmin
      .from('chat_messages')
      .insert({
        session_id: id,
        role,
        content,
        tool_calls: tool_calls ?? [],
      })
      .select()
      .single()

    if (insertError) {
      return NextResponse.json({ error: insertError.message }, { status: 500 })
    }

    const now = new Date().toISOString()
    const { error: updateError } = await supabaseAdmin
      .from('chat_sessions')
      .update({
        last_message_at: now,
        message_count: (session.message_count ?? 0) + 1,
        updated_at: now,
      })
      .eq('id', id)

    if (updateError) {
      console.error('Failed to update session stats:', updateError)
    }

    return NextResponse.json(message as ChatMessage, { status: 201 })
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Unknown error' },
      { status: 500 }
    )
  }
}
