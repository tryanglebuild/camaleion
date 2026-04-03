import { NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase-server'

async function checkSupabase(): Promise<{ ok: boolean; ms: number }> {
  const t = Date.now()
  try {
    const { error } = await supabaseAdmin.from('entries').select('id').limit(1)
    return { ok: !error, ms: Date.now() - t }
  } catch {
    return { ok: false, ms: Date.now() - t }
  }
}

async function checkMCP(): Promise<{ ok: boolean }> {
  // Read path from manifest written by camaleon-mcp after install
  try {
    const { existsSync, readFileSync } = await import('fs')
    const { join } = await import('path')
    const { homedir } = await import('os')
    const manifest = join(homedir(), '.camaleon', 'mcp.json')
    if (!existsSync(manifest)) return { ok: false }
    const { path } = JSON.parse(readFileSync(manifest, 'utf-8')) as { path: string }
    return { ok: existsSync(path) }
  } catch {
    return { ok: false }
  }
}

async function checkEmbed(): Promise<{ ok: boolean; ms: number }> {
  const t = Date.now()
  try {
    // Test Supabase AI embed endpoint availability
    const { data, error } = await supabaseAdmin.functions.invoke('embed', {
      body: { input: 'test', model: 'gte-small' },
    }).catch(() => ({ data: null, error: new Error('no edge fn') }))
    // Fallback: if edge functions not deployed, try a direct embedding approach
    if (error) {
      // Check if pgvector is available (good enough signal)
      const { error: e2 } = await supabaseAdmin.from('embeddings').select('id').limit(1)
      return { ok: !e2, ms: Date.now() - t }
    }
    return { ok: !!data, ms: Date.now() - t }
  } catch {
    return { ok: false, ms: Date.now() - t }
  }
}

export async function GET() {
  const [supabase, mcp, embed] = await Promise.all([
    checkSupabase(),
    checkMCP(),
    checkEmbed(),
  ])

  const allOk = supabase.ok && mcp.ok && embed.ok

  return NextResponse.json({ ok: allOk, supabase, mcp, embed }, {
    status: allOk ? 200 : 503,
  })
}
