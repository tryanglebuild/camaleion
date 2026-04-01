import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js'
import { supabase } from '../lib/supabase.js'
import { embedText, resolveProjectId } from '../lib/helpers.js'
import { SavePlanInputSchema } from '@context-engine/shared'

export function registerPlanningTools(server: McpServer) {
  server.tool(
    'save_plan',
    'Save a goal breakdown as a plan + individual tasks in Supabase. Call this after Claude/Copilot has broken down a goal — tasks appear immediately in the app.',
    SavePlanInputSchema.shape,
    async (input) => {
      const parsed = SavePlanInputSchema.parse(input)

      const project_id = parsed.project ? await resolveProjectId(parsed.project) : null

      // Create parent plan entry
      const { data: planEntry, error: planErr } = await supabase
        .from('entries')
        .insert({
          type: 'plan',
          title: parsed.goal,
          content: `Goal: ${parsed.goal}\n\nTasks:\n${parsed.tasks.map((t, i) => `${i + 1}. ${t.title}${t.description ? ` — ${t.description}` : ''}`).join('\n')}`,
          project_id,
          tags: parsed.project ? [parsed.project] : [],
          metadata: { task_count: parsed.tasks.length },
        })
        .select('id, created_at')
        .single()

      if (planErr) throw new Error(`Failed to create plan: ${planErr.message}`)

      // Embed plan for RAG
      const planText = `Goal: ${parsed.goal}\n${parsed.tasks.map(t => t.title).join('\n')}`
      const planEmbedding = await embedText(planText)
      await supabase.from('embeddings').insert({
        entry_id: planEntry.id,
        embedding: JSON.stringify(planEmbedding),
        content: planText,
      })

      // Build title → id map for depends_on resolution
      const taskIdMap = new Map<string, string>()
      const createdTasks: { id: string; title: string; created_at: string }[] = []

      for (const task of parsed.tasks) {
        const depends_on_id = task.depends_on ? taskIdMap.get(task.depends_on) : null

        const { data: taskEntry, error: taskErr } = await supabase
          .from('entries')
          .insert({
            type: 'task',
            title: task.title,
            content: task.description ?? null,
            status: 'pending',
            project_id,
            tags: [...(task.tags ?? []), ...(parsed.project ? [parsed.project] : [])],
            metadata: {
              plan_id: planEntry.id,
              depends_on_title: task.depends_on ?? null,
              depends_on_id: depends_on_id ?? null,
            },
          })
          .select('id, title, created_at')
          .single()

        if (taskErr) throw new Error(`Failed to create task "${task.title}": ${taskErr.message}`)

        // Embed task
        const taskText = [task.title, task.description].filter(Boolean).join('\n')
        const taskEmbedding = await embedText(taskText)
        await supabase.from('embeddings').insert({
          entry_id: taskEntry.id,
          embedding: JSON.stringify(taskEmbedding),
          content: taskText,
        })

        taskIdMap.set(task.title, taskEntry.id)
        createdTasks.push(taskEntry)
      }

      return {
        content: [{
          type: 'text',
          text: JSON.stringify({
            plan_entry: { id: planEntry.id, created_at: planEntry.created_at },
            tasks_created: createdTasks,
          }),
        }],
      }
    }
  )
}
