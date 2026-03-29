import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js'
import { supabase } from '../lib/supabase.js'
import { embedText, resolveProjectId, resolvePersonId } from '../lib/helpers.js'
import {
  AddEntryInputSchema,
  GetEntriesInputSchema,
  UpdateEntryInputSchema,
} from '@context-engine/shared'

export function registerEntryTools(server: McpServer) {
  server.tool(
    'add_entry',
    'Add a memory entry (task, note, decision, meeting, idea, or log). Automatically embeds for RAG.',
    AddEntryInputSchema.shape,
    async (input) => {
      const parsed = AddEntryInputSchema.parse(input)

      const project_id = parsed.project ? await resolveProjectId(parsed.project) : null
      const person_id = parsed.person ? await resolvePersonId(parsed.person) : null

      const { data: entry, error } = await supabase
        .from('entries')
        .insert({
          type: parsed.type,
          title: parsed.title,
          content: parsed.content ?? null,
          status: parsed.status ?? null,
          project_id,
          person_id,
          tags: parsed.tags ?? null,
          metadata: parsed.metadata ?? null,
        })
        .select('id, created_at')
        .single()

      if (error) throw new Error(`Failed to create entry: ${error.message}`)

      // Auto-embed
      const textToEmbed = [parsed.title, parsed.content].filter(Boolean).join('\n')
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
    'get_entries',
    'Retrieve memory entries with optional filters (type, project, tags, status, date).',
    GetEntriesInputSchema.shape,
    async (input) => {
      const parsed = GetEntriesInputSchema.parse(input)

      let query = supabase
        .from('entries')
        .select('*, project:projects(id, name), person:people(id, name)')
        .order('created_at', { ascending: false })

      if (parsed.type) query = query.eq('type', parsed.type)
      if (parsed.status) query = query.eq('status', parsed.status)
      if (parsed.since) query = query.gte('created_at', parsed.since)
      if (parsed.tags?.length) query = query.overlaps('tags', parsed.tags)

      if (parsed.project) {
        const { data: proj } = await supabase
          .from('projects')
          .select('id')
          .ilike('name', parsed.project)
          .single()
        if (proj) query = query.eq('project_id', proj.id)
      }

      const { data, error } = await query.limit(parsed.limit)
      if (error) throw new Error(`Failed to get entries: ${error.message}`)

      return {
        content: [{ type: 'text', text: JSON.stringify(data ?? []) }],
      }
    }
  )

  server.tool(
    'update_entry',
    'Update an existing entry (status, content, tags, or metadata).',
    UpdateEntryInputSchema.shape,
    async (input) => {
      const parsed = UpdateEntryInputSchema.parse(input)

      const updates: Record<string, unknown> = {}
      if (parsed.status !== undefined) updates.status = parsed.status
      if (parsed.content !== undefined) updates.content = parsed.content
      if (parsed.tags !== undefined) updates.tags = parsed.tags
      if (parsed.metadata !== undefined) updates.metadata = parsed.metadata

      const { data, error } = await supabase
        .from('entries')
        .update(updates)
        .eq('id', parsed.id)
        .select('*')
        .single()

      if (error) throw new Error(`Failed to update entry: ${error.message}`)

      // Re-embed if content changed
      if (parsed.content !== undefined) {
        const textToEmbed = [data.title, data.content].filter(Boolean).join('\n')
        const embedding = await embedText(textToEmbed)

        await supabase.from('embeddings').delete().eq('entry_id', data.id)
        await supabase.from('embeddings').insert({
          entry_id: data.id,
          embedding: JSON.stringify(embedding),
          content: textToEmbed,
        })
      }

      return {
        content: [{ type: 'text', text: JSON.stringify(data) }],
      }
    }
  )
}
