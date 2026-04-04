import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js'
import { appendFileSync, mkdirSync, readFileSync, existsSync } from 'fs'
import { homedir } from 'os'
import { join } from 'path'
import { supabase } from '../lib/supabase.js'
import {
  GetAgentsInputSchema,
  RegisterAgentInputSchema,
  SyncAgentsInputSchema,
  StartSessionInputSchema,
  EndSessionInputSchema,
  LogMessageInputSchema,
  GetSessionContextInputSchema,
  ListSessionsInputSchema,
} from '@context-engine/shared'

function sessionsDir(): string {
  return join(homedir(), '.claude', 'agent-sessions')
}

function sessionDir(sessionId: string): string {
  return join(sessionsDir(), sessionId)
}

function conversationFile(sessionId: string): string {
  return join(sessionDir(sessionId), 'conversation.jsonl')
}

function contextFile(sessionId: string): string {
  return join(sessionDir(sessionId), 'context.json')
}

export function registerAgentTools(server: McpServer) {
  // ── get_agents ──────────────────────────────────────────────────────────────
  server.tool(
    'get_agents',
    'List all registered global agents. Returns name, role, system_prompt, status, color, last_synced.',
    GetAgentsInputSchema.shape,
    async (input) => {
      const parsed = GetAgentsInputSchema.parse(input)

      let query = supabase
        .from('agents')
        .select('id, name, role, system_prompt, status, color, last_synced, updated_at')
        .order('name')

      if (parsed.status) query = query.eq('status', parsed.status)

      const { data, error } = await query
      if (error) throw new Error(`Failed to fetch agents: ${error.message}`)

      return {
        content: [{ type: 'text', text: JSON.stringify(data ?? []) }],
      }
    }
  )

  // ── register_agent ──────────────────────────────────────────────────────────
  server.tool(
    'register_agent',
    'Register or update a global agent in the DB. Uses name as unique key — upserts if already exists.',
    RegisterAgentInputSchema.shape,
    async (input) => {
      const parsed = RegisterAgentInputSchema.parse(input)

      const { data, error } = await supabase
        .from('agents')
        .upsert(
          {
            name:          parsed.name,
            role:          parsed.role,
            system_prompt: parsed.system_prompt,
            color:         parsed.color ?? null,
            status:        parsed.status ?? 'active',
          },
          { onConflict: 'name' }
        )
        .select('id, name, created_at, updated_at')
        .single()

      if (error) throw new Error(`Failed to register agent: ${error.message}`)

      return {
        content: [{ type: 'text', text: JSON.stringify(data) }],
      }
    }
  )

  // ── sync_agents ─────────────────────────────────────────────────────────────
  server.tool(
    'sync_agents',
    'Compare local .agent.md files against DB registry. Returns agents missing locally and unregistered local agents.',
    SyncAgentsInputSchema.shape,
    async (input) => {
      const parsed = SyncAgentsInputSchema.parse(input)

      const { data: dbAgents, error } = await supabase
        .from('agents')
        .select('name, role, system_prompt, status')
        .eq('status', 'active')

      if (error) throw new Error(`Failed to fetch agents: ${error.message}`)

      const dbNames  = new Set((dbAgents ?? []).map(a => a.name))
      const localNames = new Set(parsed.local_agents.map(a => a.name))

      const missing_locally    = (dbAgents ?? []).filter(a => !localNames.has(a.name))
      const unregistered_locally = parsed.local_agents.filter(a => !dbNames.has(a.name)).map(a => a.name)

      return {
        content: [{
          type: 'text',
          text: JSON.stringify({ missing_locally, unregistered_locally }),
        }],
      }
    }
  )

  // ── start_session ───────────────────────────────────────────────────────────
  server.tool(
    'start_session',
    'Create a new orchestrator session. Creates session in DB and local folder with conversation.jsonl.',
    StartSessionInputSchema.shape,
    async (input) => {
      const parsed = StartSessionInputSchema.parse(input)

      const { data: session, error } = await supabase
        .from('agent_sessions')
        .insert({ goal: parsed.goal, status: 'active' })
        .select('id, goal, started_at')
        .single()

      if (error) throw new Error(`Failed to create session: ${error.message}`)

      // Create local folder + empty conversation.jsonl
      const dir = sessionDir(session.id)
      mkdirSync(dir, { recursive: true })
      appendFileSync(conversationFile(session.id), '')

      // Write context stub (will be populated by orchestrator)
      const ctx = { session_id: session.id, goal: parsed.goal, started_at: session.started_at }
      appendFileSync(contextFile(session.id), JSON.stringify(ctx, null, 2))

      return {
        content: [{
          type: 'text',
          text: JSON.stringify({
            session_id:        session.id,
            goal:              session.goal,
            started_at:        session.started_at,
            conversation_file: conversationFile(session.id),
            context_file:      contextFile(session.id),
          }),
        }],
      }
    }
  )

  // ── end_session ─────────────────────────────────────────────────────────────
  server.tool(
    'end_session',
    'Mark an orchestrator session as completed or failed.',
    EndSessionInputSchema.shape,
    async (input) => {
      const parsed = EndSessionInputSchema.parse(input)

      const update: Record<string, unknown> = {
        status:   parsed.status,
        ended_at: new Date().toISOString(),
      }
      if (parsed.summary) update.metadata = { summary: parsed.summary }

      const { error } = await supabase
        .from('agent_sessions')
        .update(update)
        .eq('id', parsed.session_id)

      if (error) throw new Error(`Failed to end session: ${error.message}`)

      return {
        content: [{ type: 'text', text: JSON.stringify({ ok: true, session_id: parsed.session_id, status: parsed.status }) }],
      }
    }
  )

  // ── log_message ─────────────────────────────────────────────────────────────
  server.tool(
    'log_message',
    'Log an inter-agent message. Appends to conversation.jsonl and inserts into DB.',
    LogMessageInputSchema.shape,
    async (input) => {
      const parsed = LogMessageInputSchema.parse(input)

      const ts = new Date().toISOString()

      // Append to local file
      const line = JSON.stringify({
        ts,
        from:          parsed.from_agent,
        to:            parsed.to_agent,
        type:          parsed.type,
        content:       parsed.content,
        task_id:       parsed.task_id     ?? undefined,
        ref_task:      parsed.ref_task    ?? undefined,
        expects_reply: parsed.expects_reply ?? false,
        verdict:       parsed.verdict     ?? undefined,
      })

      const file = conversationFile(parsed.session_id)
      if (existsSync(sessionDir(parsed.session_id))) {
        appendFileSync(file, line + '\n')
      }

      // Insert into DB
      const { data, error } = await supabase
        .from('agent_messages')
        .insert({
          session_id:    parsed.session_id,
          from_agent:    parsed.from_agent,
          to_agent:      parsed.to_agent,
          type:          parsed.type,
          content:       parsed.content,
          task_id:       parsed.task_id     ?? null,
          ref_task:      parsed.ref_task    ?? null,
          expects_reply: parsed.expects_reply ?? false,
          verdict:       parsed.verdict     ?? null,
          created_at:    ts,
        })
        .select('id, created_at')
        .single()

      if (error) throw new Error(`Failed to log message: ${error.message}`)

      return {
        content: [{ type: 'text', text: JSON.stringify({ id: data.id, ts: data.created_at }) }],
      }
    }
  )

  // ── get_session_context ─────────────────────────────────────────────────────
  server.tool(
    'get_session_context',
    'Get the full conversation log for a session. Returns all messages as formatted text for agent context injection.',
    GetSessionContextInputSchema.shape,
    async (input) => {
      const parsed = GetSessionContextInputSchema.parse(input)

      const file = conversationFile(parsed.session_id)

      // Try local file first (faster, always up to date)
      if (existsSync(file)) {
        const raw = readFileSync(file, 'utf-8').trim()
        if (raw) {
          const lines = raw.split('\n').filter(Boolean)
          const messages = lines.map(l => {
            try { return JSON.parse(l) } catch { return null }
          }).filter(Boolean)

          const formatted = messages.map((m: Record<string, unknown>) =>
            `[${m.ts}] ${m.from} → ${m.to} [${String(m.type).toUpperCase()}]${m.task_id ? ` (task:${m.task_id})` : ''}\n${m.content}`
          ).join('\n\n---\n\n')

          return { content: [{ type: 'text', text: formatted || '(no messages yet)' }] }
        }
      }

      // Fallback: fetch from DB
      const { data, error } = await supabase
        .from('agent_messages')
        .select('*')
        .eq('session_id', parsed.session_id)
        .order('created_at', { ascending: true })

      if (error) throw new Error(`Failed to fetch session context: ${error.message}`)

      const formatted = (data ?? []).map(m =>
        `[${m.created_at}] ${m.from_agent} → ${m.to_agent} [${m.type.toUpperCase()}]${m.task_id ? ` (task:${m.task_id})` : ''}\n${m.content}`
      ).join('\n\n---\n\n')

      return {
        content: [{ type: 'text', text: formatted || '(no messages yet)' }],
      }
    }
  )

  // ── list_sessions ───────────────────────────────────────────────────────────
  server.tool(
    'list_sessions',
    'List agent sessions ordered by start date descending. Optionally filter by status (active, completed, failed).',
    ListSessionsInputSchema.shape,
    async (input) => {
      const parsed = ListSessionsInputSchema.parse(input)

      let query = supabase
        .from('agent_sessions')
        .select('id, goal, status, started_at, ended_at, metadata')
        .order('started_at', { ascending: false })
        .limit(parsed.limit)

      if (parsed.status) query = query.eq('status', parsed.status)

      const { data, error } = await query
      if (error) throw new Error(`Failed to list sessions: ${error.message}`)

      return {
        content: [{ type: 'text', text: JSON.stringify(data ?? []) }],
      }
    }
  )
}
