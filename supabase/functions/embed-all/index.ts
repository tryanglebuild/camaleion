// Embeds all entries that are missing embeddings.
// Call via: POST /functions/v1/embed-all
// Requires service role key (Authorization: Bearer <service_key>)

import { createClient } from 'jsr:@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, content-type',
}

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  const supabaseUrl = Deno.env.get('SUPABASE_URL')!
  const serviceKey  = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
  const supabase    = createClient(supabaseUrl, serviceKey, { auth: { persistSession: false } })

  // @ts-ignore: Supabase.ai is injected at runtime
  const session = new Supabase.ai.Session('gte-small')

  try {
    // Fetch entry_ids that already have embeddings
    const { data: existing, error: existingError } = await supabase
      .from('embeddings')
      .select('entry_id')
    if (existingError) throw existingError

    const alreadyEmbedded = (existing ?? []).map((r: { entry_id: string }) => r.entry_id)

    // Entries that don't have an embedding yet
    let query = supabase.from('entries').select('id, title, content')
    if (alreadyEmbedded.length > 0) {
      query = query.not('id', 'in', `(${alreadyEmbedded.map((id: string) => `"${id}"`).join(',')})`)
    }
    const { data: entries, error: fetchError } = await query

    if (fetchError) throw fetchError

    if (!entries?.length) {
      return new Response(
        JSON.stringify({ ok: true, message: 'All entries already embedded', processed: 0 }),
        { headers: { 'Content-Type': 'application/json', ...corsHeaders } },
      )
    }

    let success = 0
    const errors: { id: string; title: string; error: string }[] = []

    for (const entry of entries) {
      const text = [entry.title, entry.content].filter(Boolean).join('\n')

      try {
        const output = await session.run(text, { mean_pool: true, normalize: true })
        const embedding: number[] = Array.from(output as Float32Array)

        const { error: insertError } = await supabase.from('embeddings').insert({
          entry_id:  entry.id,
          embedding,
          content:   text,
        })

        if (insertError) {
          errors.push({ id: entry.id, title: entry.title, error: insertError.message })
        } else {
          success++
        }
      } catch (err) {
        const msg = err instanceof Error ? err.message : String(err)
        errors.push({ id: entry.id, title: entry.title, error: msg })
      }
    }

    return new Response(
      JSON.stringify({
        ok:        errors.length === 0,
        processed: entries.length,
        success,
        failed:    errors.length,
        errors:    errors.length > 0 ? errors : undefined,
      }),
      { headers: { 'Content-Type': 'application/json', ...corsHeaders } },
    )
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err)
    return new Response(
      JSON.stringify({ ok: false, error: message }),
      { status: 500, headers: { 'Content-Type': 'application/json', ...corsHeaders } },
    )
  }
})
