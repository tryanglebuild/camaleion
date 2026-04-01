import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js'
import { supabase } from '../lib/supabase.js'
import { embedText, resolveProjectId } from '../lib/helpers.js'
import {
  SaveAnalysisInputSchema,
  GetAnalysesInputSchema,
  DeleteAnalysisInputSchema,
} from '@context-engine/shared'

export function registerAnalysisTools(server: McpServer) {
  server.tool(
    'save_analysis',
    'Save a codebase analysis to Supabase. Call this after Claude/Copilot has analyzed a project — it persists the insights so they appear in the app.',
    SaveAnalysisInputSchema.shape,
    async (input) => {
      const parsed = SaveAnalysisInputSchema.parse(input)

      const project_id = await resolveProjectId(parsed.project)

      const tags = [
        ...(parsed.tags ?? []),
        parsed.project,
        ...(parsed.focus ? [parsed.focus] : []),
      ]

      const { data: entry, error } = await supabase
        .from('entries')
        .insert({
          type: 'analysis',
          title: `Analysis: ${parsed.project}${parsed.focus ? ` (${parsed.focus})` : ''}`,
          content: `## Summary\n\n${parsed.summary}\n\n## Insights\n\n${parsed.insights}`,
          project_id,
          tags,
          metadata: {
            focus: parsed.focus ?? 'general',
            files_referenced: parsed.files_referenced ?? [],
          },
        })
        .select('id, created_at')
        .single()

      if (error) throw new Error(`Failed to save analysis: ${error.message}`)

      // Embed for RAG
      const textToEmbed = `${parsed.summary}\n\n${parsed.insights}`
      const embedding = await embedText(textToEmbed)

      await supabase.from('embeddings').insert({
        entry_id: entry.id,
        embedding: JSON.stringify(embedding),
        content: textToEmbed,
      })

      return {
        content: [{ type: 'text', text: JSON.stringify({ id: entry.id, created_at: entry.created_at }) }],
      }
    }
  )

  server.tool(
    'get_analyses',
    'Retrieve saved codebase analyses. Filter by project, focus area, or date.',
    GetAnalysesInputSchema.shape,
    async (input) => {
      const parsed = GetAnalysesInputSchema.parse(input)

      let query = supabase
        .from('entries')
        .select('*, project:projects(id, name)')
        .eq('type', 'analysis')
        .order('created_at', { ascending: false })

      if (parsed.since) query = query.gte('created_at', parsed.since)
      if (parsed.focus) query = query.contains('tags', [parsed.focus])

      if (parsed.project) {
        const { data: proj } = await supabase
          .from('projects')
          .select('id')
          .ilike('name', parsed.project)
          .single()
        if (proj) query = query.eq('project_id', proj.id)
      }

      const { data, error } = await query.limit(parsed.limit)
      if (error) throw new Error(`Failed to get analyses: ${error.message}`)

      return {
        content: [{ type: 'text', text: JSON.stringify(data ?? []) }],
      }
    }
  )

  server.tool(
    'delete_analysis',
    'Delete a saved analysis by ID.',
    DeleteAnalysisInputSchema.shape,
    async (input) => {
      const parsed = DeleteAnalysisInputSchema.parse(input)

      // Remove embedding first (FK)
      await supabase.from('embeddings').delete().eq('entry_id', parsed.id)

      const { error } = await supabase.from('entries').delete().eq('id', parsed.id)
      if (error) throw new Error(`Failed to delete analysis: ${error.message}`)

      return {
        content: [{ type: 'text', text: JSON.stringify({ deleted: true, id: parsed.id }) }],
      }
    }
  )
}
