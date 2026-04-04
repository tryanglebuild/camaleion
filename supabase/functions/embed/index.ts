// Supabase native AI — gte-small (384 dims), no external deps
// Docs: https://supabase.com/docs/guides/functions/ai-models

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, content-type',
}

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    const { input } = await req.json() as { input: string }

    if (!input || typeof input !== 'string') {
      return new Response(JSON.stringify({ error: 'Missing input string' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json', ...corsHeaders },
      })
    }

    // @ts-ignore: Supabase.ai is injected at runtime
    const session = new Supabase.ai.Session('gte-small')
    const output = await session.run(input, { mean_pool: true, normalize: true })
    const embedding: number[] = Array.from(output as Float32Array)

    return new Response(JSON.stringify({ embedding }), {
      headers: { 'Content-Type': 'application/json', ...corsHeaders },
    })
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err)
    return new Response(JSON.stringify({ error: message }), {
      status: 500,
      headers: { 'Content-Type': 'application/json', ...corsHeaders },
    })
  }
})
