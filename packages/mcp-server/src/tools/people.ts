import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js'
import { supabase } from '../lib/supabase.js'
import { AddPersonInputSchema, GetPeopleInputSchema } from '@context-engine/shared'

export function registerPeopleTools(server: McpServer) {
  server.tool(
    'add_person',
    'Add a person to memory (team member, client, contact).',
    AddPersonInputSchema.shape,
    async (input) => {
      const parsed = AddPersonInputSchema.parse(input)

      const { data, error } = await supabase
        .from('people')
        .insert({
          name: parsed.name,
          role: parsed.role ?? null,
          company: parsed.company ?? null,
          email: parsed.email ?? null,
          notes: parsed.notes ?? null,
        })
        .select('*')
        .single()

      if (error) throw new Error(`Failed to create person: ${error.message}`)

      return {
        content: [{ type: 'text', text: JSON.stringify(data) }],
      }
    }
  )

  server.tool(
    'get_people',
    'List people in memory, optionally filtered by company.',
    GetPeopleInputSchema.shape,
    async (input) => {
      const parsed = GetPeopleInputSchema.parse(input)

      let query = supabase.from('people').select('*').order('name', { ascending: true })
      if (parsed.company) query = query.ilike('company', `%${parsed.company}%`)

      const { data, error } = await query
      if (error) throw new Error(`Failed to get people: ${error.message}`)

      return {
        content: [{ type: 'text', text: JSON.stringify(data ?? []) }],
      }
    }
  )
}
