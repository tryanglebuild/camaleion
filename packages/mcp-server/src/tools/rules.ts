import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js'
import { supabase } from '../lib/supabase.js'
import {
  GetRulesInputSchema,
  AddRuleInputSchema,
  UpdateRuleInputSchema,
  DeleteRuleInputSchema,
} from '@context-engine/shared'

export function registerRulesTools(server: McpServer) {
  server.tool(
    'get_rules',
    'Get AI behavior rules stored in Supabase. Returns active rules by default, sorted by priority (highest first).',
    GetRulesInputSchema.shape,
    async (input) => {
      const parsed = GetRulesInputSchema.parse(input)

      let query = supabase
        .from('rules')
        .select('*')
        .order('priority', { ascending: false })
        .order('created_at', { ascending: true })

      if (parsed.category) query = query.eq('category', parsed.category)

      const active = parsed.active ?? true
      query = query.eq('active', active)

      const { data, error } = await query

      if (error) throw new Error(`Failed to get rules: ${error.message}`)

      return {
        content: [{ type: 'text', text: JSON.stringify(data ?? []) }],
      }
    }
  )

  server.tool(
    'add_rule',
    'Add a new AI behavior rule to Supabase.',
    AddRuleInputSchema.shape,
    async (input) => {
      const parsed = AddRuleInputSchema.parse(input)

      const { data, error } = await supabase
        .from('rules')
        .insert({
          title: parsed.title,
          content: parsed.content,
          category: parsed.category ?? 'general',
          priority: parsed.priority,
        })
        .select('*')
        .single()

      if (error) throw new Error(`Failed to add rule: ${error.message}`)

      return {
        content: [{ type: 'text', text: JSON.stringify(data) }],
      }
    }
  )

  server.tool(
    'update_rule',
    'Update an existing rule (title, content, active status, priority, or category).',
    UpdateRuleInputSchema.shape,
    async (input) => {
      const parsed = UpdateRuleInputSchema.parse(input)

      const updates: Record<string, unknown> = {}
      if (parsed.title !== undefined) updates.title = parsed.title
      if (parsed.content !== undefined) updates.content = parsed.content
      if (parsed.active !== undefined) updates.active = parsed.active
      if (parsed.priority !== undefined) updates.priority = parsed.priority
      if (parsed.category !== undefined) updates.category = parsed.category

      const { data, error } = await supabase
        .from('rules')
        .update(updates)
        .eq('id', parsed.id)
        .select('*')
        .single()

      if (error) throw new Error(`Failed to update rule: ${error.message}`)

      return {
        content: [{ type: 'text', text: JSON.stringify(data) }],
      }
    }
  )

  server.tool(
    'delete_rule',
    'Delete a rule by ID.',
    DeleteRuleInputSchema.shape,
    async (input) => {
      const parsed = DeleteRuleInputSchema.parse(input)

      const { error } = await supabase
        .from('rules')
        .delete()
        .eq('id', parsed.id)

      if (error) throw new Error(`Failed to delete rule: ${error.message}`)

      return {
        content: [{ type: 'text', text: JSON.stringify({ deleted: true, id: parsed.id }) }],
      }
    }
  )
}
