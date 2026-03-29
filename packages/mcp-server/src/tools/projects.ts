import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js'
import { supabase } from '../lib/supabase.js'
import { AddProjectInputSchema, GetProjectsInputSchema } from '@context-engine/shared'

export function registerProjectTools(server: McpServer) {
  server.tool(
    'add_project',
    'Register a new project in memory.',
    AddProjectInputSchema.shape,
    async (input) => {
      const parsed = AddProjectInputSchema.parse(input)

      const { data, error } = await supabase
        .from('projects')
        .insert({
          name: parsed.name,
          company: parsed.company ?? null,
          stack: parsed.stack ?? null,
          description: parsed.description ?? null,
          status: parsed.status,
        })
        .select('*')
        .single()

      if (error) throw new Error(`Failed to create project: ${error.message}`)

      return {
        content: [{ type: 'text', text: JSON.stringify(data) }],
      }
    }
  )

  server.tool(
    'get_projects',
    'List all projects, optionally filtered by status.',
    GetProjectsInputSchema.shape,
    async (input) => {
      const parsed = GetProjectsInputSchema.parse(input)

      let query = supabase.from('projects').select('*').order('created_at', { ascending: false })
      if (parsed.status) query = query.eq('status', parsed.status)

      const { data, error } = await query
      if (error) throw new Error(`Failed to get projects: ${error.message}`)

      return {
        content: [{ type: 'text', text: JSON.stringify(data ?? []) }],
      }
    }
  )
}
