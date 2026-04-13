import type { DemoScenario } from '@/lib/types'

export const DEMO_SCENARIOS: DemoScenario[] = [
  {
    id: 'search',
    chip: 'search_memory',
    command: 'search_memory({ query: "authentication decisions" })',
    response: `> Found 3 relevant entries:

[DECISION] Use JWT for auth (2026-04-10)
  "Chose JWT over sessions for stateless horizontal scaling."

[DECISION] Refresh token rotation (2026-04-10)
  "7-day refresh, 15-min access token. Invalidate on logout."

[NOTE] bcrypt rounds = 12 (2026-04-11)
  "Benchmarked: 12 rounds = ~250ms on target hardware."`,
  },
  {
    id: 'add',
    chip: 'add_entry',
    command: 'add_entry({ type: "decision", title: "Use Supabase RLS", content: "Row-level security for multi-tenant isolation.", project: "cameleon" })',
    response: `> Entry saved ✓

id: "dec_9f3a2c"
type: DECISION
title: "Use Supabase RLS"
project: cameleon
tags: ["security", "database"]
embedded: true (1536-dim vector)`,
  },
  {
    id: 'query',
    chip: 'query_context',
    command: 'query_context({ question: "What did we decide about the API rate limiting?" })',
    response: `> RAG answer:

You decided to implement token-bucket rate limiting
at 100 req/min per user. Redis-backed with a 1-hour
window. Decided on 2026-04-09 after load testing
showed the API could handle 150 req/min safely.

Sources: [decision #2847] [log #2901] [note #2903]`,
  },
  {
    id: 'session',
    chip: 'start_session',
    command: 'start_session({ goal: "Refactor auth module to use PKCE" })',
    response: `> Session started ✓

session_id: "sess_d4e9f1"
goal: "Refactor auth module to use PKCE"
agents: [backend, tester]
context_loaded: 12 relevant entries
conversation.jsonl: initialized`,
  },
  {
    id: 'rules',
    chip: 'get_rules',
    command: 'get_rules({ category: "behavior", active: true })',
    response: `> 4 active rules:

[P1]  Always verify person exists before referencing
[D1]  Log every architectural decision immediately  
[L1]  Capture lessons learned with "lesson" tag
[T2]  Create task entries for all action items`,
  },
  {
    id: 'plan',
    chip: 'save_plan',
    command: 'save_plan({ goal: "Launch v2.0", tasks: ["write migration", "update docs", "deploy"] })',
    response: `> Plan saved ✓

plan_id: "plan_7c2b4e"
goal: "Launch v2.0"
tasks: 3 created (pending)
  → write migration
  → update docs  
  → deploy`,
  },
]
