import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js'
import { supabase } from '../lib/supabase.js'
import {
  AddProjectInputSchema,
  GetProjectsInputSchema,
  GetCompaniesInputSchema,
  GetProjectsByCompanyInputSchema,
} from '@context-engine/shared'

export function registerProjectTools(server: McpServer) {
  server.tool(
    'add_project',
    'Register a new project in memory.',
    AddProjectInputSchema.shape,
    async (input) => {
      const parsed = AddProjectInputSchema.parse(input)

      const { data, error } = await supabase
        .from('projects')
        .upsert(
          {
            name: parsed.name,
            company: parsed.company ?? null,
            stack: parsed.stack ?? null,
            description: parsed.description ?? null,
            status: parsed.status,
          },
          { onConflict: 'name' }
        )
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

  server.tool(
    'get_companies',
    'Get a list of all unique company names from projects.',
    GetCompaniesInputSchema.shape,
    async () => {
      const { data, error } = await supabase
        .from('projects')
        .select('company')
        .not('company', 'is', null)
        .order('company')

      if (error) throw new Error(`Failed to get companies: ${error.message}`)

      const companies = [...new Set((data ?? []).map((r: { company: string }) => r.company).filter(Boolean))]

      return {
        content: [{ type: 'text', text: JSON.stringify(companies) }],
      }
    }
  )

  server.tool(
    'get_projects_by_company',
    'Get all projects for a specific company.',
    GetProjectsByCompanyInputSchema.shape,
    async (input) => {
      const parsed = GetProjectsByCompanyInputSchema.parse(input)

      const { data, error } = await supabase
        .from('projects')
        .select('*')
        .ilike('company', parsed.company)
        .order('status')
        .order('name')

      if (error) throw new Error(`Failed to get projects by company: ${error.message}`)

      return {
        content: [{ type: 'text', text: JSON.stringify(data ?? []) }],
      }
    }
  )
}
