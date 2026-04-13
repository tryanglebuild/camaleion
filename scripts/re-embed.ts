/**
 * Re-embed all entries that are missing embeddings.
 *
 * Usage:
 *   cd /home/mc/work/projects/tryangle/project-ai-system
 *   npx tsx --tsconfig packages/mcp-server/tsconfig.json scripts/re-embed.ts
 */

import { createClient } from '@supabase/supabase-js'
import { readFileSync } from 'fs'

try {
  const env = readFileSync(new URL('../.env', import.meta.url), 'utf-8')
  for (const line of env.split('\n')) {
    const [k, ...v] = line.split('=')
    if (k && v.length) process.env[k.trim()] = v.join('=').trim()
  }
} catch { /* rely on process.env */ }

const url = process.env.SUPABASE_URL
const key = process.env.SUPABASE_SERVICE_KEY

if (!url || !key) {
  console.error('Missing SUPABASE_URL or SUPABASE_SERVICE_KEY')
  process.exit(1)
}

const supabase = createClient(url, key, { auth: { persistSession: false } })

async function getEmbedding(text: string): Promise<number[] | null> {
  try {
    const { data } = await supabase.functions.invoke('embed', {
      body: { input: text },
    })
    return data?.embedding ?? null
  } catch {
    return null
  }
}

async function main() {
  // Fetch entries without embeddings
  const { data: entries, error } = await supabase
    .from('entries')
    .select('id, title, content')
    .not('id', 'in', supabase.from('embeddings').select('entry_id'))

  if (error) {
    console.error('Failed to fetch entries:', error.message)
    process.exit(1)
  }

  if (!entries?.length) {
    console.log('All entries already have embeddings. Nothing to do.')
    return
  }

  console.log(`Found ${entries.length} entries without embeddings. Starting...`)

  let success = 0
  let failed = 0

  for (const entry of entries) {
    const text = [entry.title, entry.content].filter(Boolean).join('\n')
    const embedding = await getEmbedding(text)

    if (!embedding) {
      console.error(`  ✗ [${entry.id}] "${entry.title}" — embed failed`)
      failed++
      continue
    }

    const { error: insertError } = await supabase.from('embeddings').insert({
      entry_id: entry.id,
      embedding,
      content: text,
    })

    if (insertError) {
      console.error(`  ✗ [${entry.id}] "${entry.title}" — ${insertError.message}`)
      failed++
    } else {
      console.log(`  ✓ [${entry.id}] "${entry.title}"`)
      success++
    }

    // Small delay to avoid hammering the embed function
    await new Promise(r => setTimeout(r, 100))
  }

  console.log(`\nDone. ${success} embedded, ${failed} failed.`)
}

main()
