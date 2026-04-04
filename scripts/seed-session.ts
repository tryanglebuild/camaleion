/**
 * Seed script — creates a realistic agent session for UI testing.
 *
 * Usage:
 *   cd /home/mc/work/projects/tryangle/project-ai-system
 *   npx tsx --tsconfig packages/mcp-server/tsconfig.json scripts/seed-session.ts
 */

import { createClient } from '@supabase/supabase-js'
import { mkdirSync, writeFileSync, appendFileSync } from 'fs'
import { homedir } from 'os'
import { join } from 'path'
import { readFileSync } from 'fs'

// Load .env manually (top-level await + tsx doesn't always honour --env-file)
try {
  const env = readFileSync(new URL('../.env', import.meta.url), 'utf-8')
  for (const line of env.split('\n')) {
    const [k, ...v] = line.split('=')
    if (k && v.length) process.env[k.trim()] = v.join('=').trim()
  }
} catch { /* .env not found, rely on process.env */ }

const url = process.env.SUPABASE_URL
const key = process.env.SUPABASE_SERVICE_KEY

if (!url || !key) {
  console.error('Missing SUPABASE_URL or SUPABASE_SERVICE_KEY in environment')
  process.exit(1)
}

const supabase = createClient(url, key, { auth: { persistSession: false } })

// ── Seed agents (upsert so re-running is safe) ──────────────────────────────

const AGENTS = [
  { name: 'orchestrator',  role: 'Orchestration & Coordination',       color: '#3B82F6' },
  { name: 'ideator',       role: 'Problem Decomposition & Planning',    color: '#F59E0B' },
  { name: 'frontend',      role: 'UI/UX Implementation',               color: '#8B5CF6' },
  { name: 'backend',       role: 'API & Database Engineering',         color: '#06B6D4' },
  { name: 'fullstack',     role: 'End-to-End Feature Development',     color: '#14B8A6' },
  { name: 'tester',        role: 'QA & Validation',                    color: '#EF4444' },
  { name: 'designer',      role: 'UX/UI Design System',                color: '#EC4899' },
  { name: 'design-critic', role: 'Design Quality Enforcement',         color: '#F97316' },
  { name: 'data-analyst',  role: 'Data Analysis & Pipelines',          color: '#84CC16' },
]

async function main() {
console.log('Upserting agents...')
for (const agent of AGENTS) {
  const { error } = await supabase
    .from('agents')
    .upsert({ ...agent, system_prompt: `[${agent.role}] — see docs/multi-agent-system.md` }, { onConflict: 'name' })
  if (error) console.error(`  ✗ ${agent.name}: ${error.message}`)
  else console.log(`  ✓ ${agent.name}`)
}

// ── Create session ──────────────────────────────────────────────────────────

console.log('\nCreating session...')
const { data: session, error: sessionError } = await supabase
  .from('agent_sessions')
  .insert({ goal: 'Build user authentication flow (register, login, JWT, refresh, logout)', status: 'active' })
  .select('id, goal, started_at')
  .single()

if (sessionError || !session) {
  console.error('Failed to create session:', sessionError?.message)
  process.exit(1)
}

console.log(`  ✓ Session: ${session.id}`)

// ── Create local folder ─────────────────────────────────────────────────────

const sessionDir = join(homedir(), '.claude', 'agent-sessions', session.id)
mkdirSync(sessionDir, { recursive: true })
writeFileSync(join(sessionDir, 'context.json'), JSON.stringify({ session_id: session.id, goal: session.goal, started_at: session.started_at }, null, 2))
const conversationFile = join(sessionDir, 'conversation.jsonl')

// ── Messages ────────────────────────────────────────────────────────────────

function ts(offsetSeconds: number): string {
  return new Date(new Date(session.started_at).getTime() + offsetSeconds * 1000).toISOString()
}

const messages = [
  { from: 'orchestrator', to: 'ideator',       type: 'task',    task_id: 't1', content: 'Break down the user authentication flow into concrete tasks. Cover: register, login, JWT access tokens, refresh tokens, logout. Assign each task to the correct specialist agent.', expects_reply: true,  offset: 0   },
  { from: 'ideator',      to: 'orchestrator',  type: 'result',  task_id: 't1', content: '4 features identified · 12 tasks total\n\nfeature:register → backend(t2), tester(t3)\nfeature:login → backend(t4), tester(t5)\nfeature:tokens → backend(t6), frontend(t7)\nfeature:logout → backend(t8), tester(t9)', expects_reply: false, offset: 8   },
  { from: 'orchestrator', to: 'backend',        type: 'task',    task_id: 't2', content: 'Implement POST /auth/register\n- Validate email + password (min 8 chars, 1 uppercase, 1 number)\n- Hash password with argon2id\n- Create user record\n- Return JWT access token (15min) + refresh token (7 days)', expects_reply: true,  offset: 10  },
  { from: 'backend',      to: 'orchestrator',   type: 'request', task_id: 't2', content: 'JWT expiry strategy — should access token be 15min or 1h? And refresh token 7 days or 30 days?', expects_reply: true,  offset: 45  },
  { from: 'orchestrator', to: 'backend',        type: 'context', task_id: 't2', content: 'From memory (entry #a3f2, security audit 2026-03-15):\n- Access token: 15 minutes\n- Refresh token: 7 days\n\nContinue with these values.', expects_reply: false, offset: 47  },
  { from: 'backend',      to: 'orchestrator',   type: 'result',  task_id: 't2', content: 'POST /auth/register implemented ✓\n\nFiles changed:\n- packages/api/src/routes/auth.ts\n- db/migrations/007_auth.sql\n\nAPI contract:\nPOST /auth/register\nBody: { email: string, password: string, name: string }\nReturns: { user: User, access_token: string, refresh_token: string }', expects_reply: false, offset: 90  },
  { from: 'orchestrator', to: 'tester',          type: 'task',    task_id: 't3', content: 'Validate POST /auth/register\n\nTest cases required:\n1. Happy path (valid data → 201)\n2. Duplicate email → 409\n3. Weak password → 400\n4. Missing fields → 400\n5. Invalid email format → 400', expects_reply: true,  offset: 92  },
  { from: 'tester',       to: 'orchestrator',    type: 'result',  task_id: 't3', verdict: 'fail', content: '✖ FAIL\n\n[critical] Duplicate email returns 500 instead of 409 — unhandled unique constraint error\n[critical] No input sanitization — XSS payload accepted in name field\n[minor] No rate limiting on endpoint — brute force possible\n\nRedesign instructions:\n1. Catch unique constraint error, return 409 with { error: "Email already registered" }\n2. Sanitize name field with DOMPurify or strip HTML tags server-side\n3. Add rate limiting middleware (suggest: 5 req/min per IP)', expects_reply: false, offset: 130 },
  { from: 'orchestrator', to: 'backend',         type: 'task',    task_id: 't2', content: 'Tester found 2 critical issues. Fix required:\n\n1. Catch unique constraint on email → return 409 { error: "Email already registered" }\n2. Sanitize name field server-side — strip HTML/script tags\n3. (minor) Add rate limiting — 5 req/min per IP', expects_reply: true,  offset: 132 },
  { from: 'backend',      to: 'orchestrator',    type: 'result',  task_id: 't2', content: 'All issues fixed ✓\n\n- Unique constraint handled → 409\n- Name sanitized with server-side strip\n- Rate limiting added (express-rate-limit, 5/min/IP)\n\nReady for re-validation.', expects_reply: false, offset: 165 },
  { from: 'orchestrator', to: 'tester',           type: 'task',    task_id: 't3', content: 'Re-validate POST /auth/register after fixes. Focus on the 2 critical issues that were flagged.', expects_reply: true,  offset: 167 },
  { from: 'tester',       to: 'orchestrator',     type: 'result',  task_id: 't3', verdict: 'pass', content: '✓ PASS\n\nAll critical issues resolved:\n- Duplicate email → 409 ✓\n- Name sanitized ✓\n- Rate limiting active ✓\n\n[minor] No rate limiting remains noted for backlog. Not blocking.', expects_reply: false, offset: 195 },
]

// ── Insert messages ─────────────────────────────────────────────────────────

console.log('\nInserting messages...')

for (const msg of messages) {
  const created_at = ts(msg.offset)

  const line = JSON.stringify({
    ts: created_at,
    from: msg.from, to: msg.to, type: msg.type,
    content: msg.content, task_id: msg.task_id,
    expects_reply: msg.expects_reply,
    ...(msg.verdict ? { verdict: msg.verdict } : {}),
  })
  appendFileSync(conversationFile, line + '\n')

  const { error } = await supabase.from('agent_messages').insert({
    session_id: session.id,
    from_agent: msg.from,
    to_agent:   msg.to,
    type:       msg.type,
    content:    msg.content,
    task_id:    msg.task_id ?? null,
    expects_reply: msg.expects_reply,
    verdict:    msg.verdict ?? null,
    created_at,
  })

  if (error) console.error(`  ✗ [${msg.from}→${msg.to}]: ${error.message}`)
  else console.log(`  ✓ [${msg.from} → ${msg.to}] [${msg.type}]`)
}

console.log(`
✓ Seed complete!

Session ID: ${session.id}
Goal: ${session.goal}
Messages: ${messages.length}

Local file: ${conversationFile}

To test live updates, run:
  echo '{"ts":"${new Date().toISOString()}","from":"backend","to":"orchestrator","type":"result","content":"New live message!","task_id":"t99","expects_reply":false}' >> ${conversationFile}
`)
}

main().catch(err => { console.error(err); process.exit(1) })
