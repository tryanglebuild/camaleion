import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase-server'
import { getConfig } from '@/lib/config.server'

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const { userMessage, assistantMessage } = await req.json()

    if (!userMessage) {
      return NextResponse.json({ error: 'userMessage required' }, { status: 400 })
    }

    const { openrouterKey } = getConfig()

    let title: string

    if (openrouterKey) {
      const orRes = await fetch('https://openrouter.ai/api/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${openrouterKey}`,
        },
        body: JSON.stringify({
          model: 'anthropic/claude-3.5-haiku',
          max_tokens: 20,
          messages: [
            {
              role: 'user',
              content: `Generate a 4-7 word title for a conversation that starts with:\nUser: ${userMessage.slice(0, 300)}${assistantMessage ? `\nAssistant: ${assistantMessage.slice(0, 300)}` : ''}\n\nReply with ONLY the title, no quotes, no punctuation at the end.`,
            },
          ],
        }),
      })

      if (orRes.ok) {
        const data = await orRes.json()
        title = data.choices?.[0]?.message?.content?.trim() ?? userMessage.slice(0, 50)
      } else {
        title = userMessage.slice(0, 50)
      }
    } else {
      // Fallback: use first sentence or 50 chars
      title = userMessage.split(/[.!?]/)[0].trim().slice(0, 50)
    }

    const { data, error } = await supabaseAdmin
      .from('chat_sessions')
      .update({ title, updated_at: new Date().toISOString() })
      .eq('id', id)
      .select('id, title')
      .single()

    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json(data)
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Unknown' },
      { status: 500 }
    )
  }
}
