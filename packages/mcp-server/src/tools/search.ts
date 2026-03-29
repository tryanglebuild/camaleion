import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js'
import { supabase } from '../lib/supabase.js'
import { embedText } from '../lib/helpers.js'
import {
  SearchMemoryInputSchema,
  QueryContextInputSchema,
  type Entry,
} from '@context-engine/shared'

export function registerSearchTools(server: McpServer) {
  server.tool(
    'search_memory',
    'Semantic search over all memory entries using cosine similarity (RAG). Returns the most relevant entries.',
    SearchMemoryInputSchema.shape,
    async (input) => {
      const parsed = SearchMemoryInputSchema.parse(input)

      const embedding = await embedText(parsed.query)

      // Resolve project name → id if provided
      let projectId: string | undefined
      if (parsed.project) {
        const { data } = await supabase
          .from('projects')
          .select('id')
          .ilike('name', parsed.project)
          .single()
        projectId = data?.id
      }

      const { data: matches, error } = await supabase.rpc('match_entries', {
        query_embedding: JSON.stringify(embedding),
        match_count: parsed.limit,
        filter_type: parsed.type ?? null,
        filter_project: projectId ?? null,
      })

      if (error) throw new Error(`Semantic search failed: ${error.message}`)

      if (!matches || matches.length === 0) {
        return { content: [{ type: 'text', text: JSON.stringify({ entries: [], scores: [] }) }] }
      }

      const entryIds = matches.map((m: { entry_id: string }) => m.entry_id)
      const { data: entries, error: entriesErr } = await supabase
        .from('entries')
        .select('*, project:projects(id, name), person:people(id, name)')
        .in('id', entryIds)

      if (entriesErr) throw new Error(`Failed to fetch entries: ${entriesErr.message}`)

      // Preserve relevance order + attach scores
      const entryMap = new Map<string, Entry>((entries ?? []).map((e: Entry) => [e.id, e]))
      const results = matches.map((m: { entry_id: string; score: number }) => ({
        entry: entryMap.get(m.entry_id),
        score: m.score,
      }))

      return {
        content: [{ type: 'text', text: JSON.stringify(results) }],
      }
    }
  )

  server.tool(
    'query_context',
    'Answer a natural language question by searching memory and returning formatted context ready for Claude to use.',
    QueryContextInputSchema.shape,
    async (input) => {
      const parsed = QueryContextInputSchema.parse(input)

      const embedding = await embedText(parsed.question)

      const { data: matches, error } = await supabase.rpc('match_entries', {
        query_embedding: JSON.stringify(embedding),
        match_count: 5,
        filter_type: null,
        filter_project: null,
      })

      if (error) throw new Error(`Context query failed: ${error.message}`)
      if (!matches || matches.length === 0) {
        return {
          content: [{ type: 'text', text: 'No relevant context found in memory.' }],
        }
      }

      const entryIds = matches.map((m: { entry_id: string }) => m.entry_id)
      const { data: entries } = await supabase
        .from('entries')
        .select('*, project:projects(id, name)')
        .in('id', entryIds)

      const entryMap = new Map<string, Entry>((entries ?? []).map((e: Entry) => [e.id, e]))

      const lines: string[] = [
        `# Context for: "${parsed.question}"`,
        `Retrieved ${matches.length} relevant memory entries:\n`,
      ]

      for (const match of matches as { entry_id: string; score: number }[]) {
        const entry = entryMap.get(match.entry_id)
        if (!entry) continue

        const project = (entry.project as { name: string } | null)?.name
        const date = new Date(entry.created_at).toLocaleDateString('pt-PT')

        lines.push(`---`)
        lines.push(`[${entry.type.toUpperCase()}] ${entry.title}`)
        if (project) lines.push(`Project: ${project}`)
        if (entry.status) lines.push(`Status: ${entry.status}`)
        if (entry.tags?.length) lines.push(`Tags: ${entry.tags.join(', ')}`)
        lines.push(`Date: ${date}`)
        if (entry.content) lines.push(`\n${entry.content}`)
        lines.push('')
      }

      return {
        content: [{ type: 'text', text: lines.join('\n') }],
      }
    }
  )
}
