import { watch } from 'fs'
import { readFileSync, existsSync, statSync } from 'fs'
import { join } from 'path'
import { homedir } from 'os'
import { readdirSync } from 'fs'
import { supabase } from './supabase.js'

const SESSIONS_DIR = join(homedir(), '.claude', 'agent-sessions')

// Track byte offset per file so we only process new lines
const fileOffsets = new Map<string, number>()

async function syncNewLines(sessionId: string, filePath: string) {
  if (!existsSync(filePath)) return

  const stat = statSync(filePath)
  const prevOffset = fileOffsets.get(filePath) ?? 0

  if (stat.size <= prevOffset) return

  const raw = readFileSync(filePath, 'utf-8')
  const lines = raw.split('\n').filter(Boolean)

  // Process only lines beyond what we've already seen
  let byteCount = 0
  const newLines: string[] = []

  for (const line of lines) {
    const lineBytes = Buffer.byteLength(line + '\n')
    if (byteCount >= prevOffset) {
      newLines.push(line)
    }
    byteCount += lineBytes
  }

  fileOffsets.set(filePath, stat.size)

  for (const line of newLines) {
    try {
      const msg = JSON.parse(line)
      await supabase.from('agent_messages').upsert(
        {
          session_id:    sessionId,
          from_agent:    msg.from,
          to_agent:      msg.to,
          type:          msg.type,
          content:       msg.content,
          task_id:       msg.task_id   ?? null,
          ref_task:      msg.ref_task  ?? null,
          expects_reply: msg.expects_reply ?? false,
          verdict:       msg.verdict   ?? null,
          created_at:    msg.ts,
        },
        // Deduplicate by session_id + ts + from_agent — avoid double-writes
        // when log_message already inserted via MCP tool
        { onConflict: 'session_id,from_agent,created_at', ignoreDuplicates: true }
      )
    } catch {
      // Malformed line — skip silently
    }
  }
}

function watchSession(sessionId: string) {
  const filePath = join(SESSIONS_DIR, sessionId, 'conversation.jsonl')
  if (!existsSync(filePath)) return

  watch(filePath, { persistent: false }, async (event) => {
    if (event === 'change') {
      await syncNewLines(sessionId, filePath)
    }
  })

  // Initialize offset
  if (!fileOffsets.has(filePath)) {
    fileOffsets.set(filePath, statSync(filePath).size)
  }
}

export function startWatcher() {
  if (!existsSync(SESSIONS_DIR)) return

  // Watch existing sessions
  try {
    const existing = readdirSync(SESSIONS_DIR)
    for (const sessionId of existing) {
      watchSession(sessionId)
    }
  } catch {
    // Directory empty or unreadable
  }

  // Watch for new session folders
  watch(SESSIONS_DIR, { persistent: false }, (event, filename) => {
    if (event === 'rename' && filename) {
      // Small delay to ensure folder + file are created
      setTimeout(() => watchSession(filename), 200)
    }
  })
}
