import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js'
import { supabase } from '../lib/supabase.js'
import { AddPersonInputSchema, GetPeopleInputSchema, UpdatePersonInputSchema } from '@context-engine/shared'

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
    'update_person',
    'Update an existing person profile (role, company, email, notes). Identify by id or name.',
    UpdatePersonInputSchema.shape,
    async (input) => {
      const parsed = UpdatePersonInputSchema.parse(input)

      // Resolve id by name if not provided
      let resolvedId = parsed.id
      if (!resolvedId && parsed.name) {
        const { data: found } = await supabase
          .from('people')
          .select('id')
          .ilike('name', parsed.name)
          .single()
        if (!found) throw new Error(`Person not found: ${parsed.name}`)
        resolvedId = found.id
      }

      const allowed: Record<string, unknown> = {}
      for (const k of ['role', 'company', 'email', 'notes'] as const) {
        if (parsed[k] !== undefined) allowed[k] = parsed[k]
      }

      if (!Object.keys(allowed).length) {
        throw new Error('No fields to update')
      }

      const { data, error } = await supabase
        .from('people')
        .update(allowed)
        .eq('id', resolvedId)
        .select('*')
        .single()

      if (error) throw new Error(`Failed to update person: ${error.message}`)

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
