import { supabase } from './supabase.js'

/**
 * Calls the Supabase Edge Function `embed` which uses gte-small (384 dims).
 * The edge function is deployed at: supabase/functions/embed/index.ts
 */
export async function embedText(text: string): Promise<number[]> {
  const { data, error } = await supabase.functions.invoke<{ embedding: number[] }>('embed', {
    body: { input: text },
  })

  if (error) throw new Error(`Embedding failed: ${error.message}`)
  if (!data?.embedding) throw new Error('Embedding response missing embedding field')

  return data.embedding
}

/**
 * Resolve a project name to its UUID.
 * Creates the project if it doesn't exist.
 */
export async function resolveProjectId(name: string): Promise<string> {
  const { data, error } = await supabase
    .from('projects')
    .select('id')
    .ilike('name', name)
    .single()

  if (error && error.code !== 'PGRST116') throw error
  if (data) return data.id

  const { data: created, error: createErr } = await supabase
    .from('projects')
    .insert({ name })
    .select('id')
    .single()

  if (createErr) throw createErr
  return created.id
}

/**
 * Resolve a person name to their UUID.
 * Returns null if not found (does not auto-create people).
 */
export async function resolvePersonId(name: string): Promise<string | null> {
  const { data } = await supabase
    .from('people')
    .select('id')
    .ilike('name', name)
    .single()

  return data?.id ?? null
}
