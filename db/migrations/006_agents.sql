-- Migration 006: Multi-Agent System
-- Tables: agents, agent_sessions, agent_messages

-- Global agent registry
create table if not exists agents (
  id            uuid primary key default gen_random_uuid(),
  name          text not null unique,
  role          text not null,
  system_prompt text not null,
  status        text not null default 'active', -- active | inactive
  color         text,                           -- hex color for chat UI (e.g. '#3B82F6')
  last_synced   timestamptz,
  metadata      jsonb,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);

-- Orchestrator sessions (one per user goal)
create table if not exists agent_sessions (
  id         uuid primary key default gen_random_uuid(),
  goal       text not null,
  status     text not null default 'active', -- active | completed | failed
  started_at timestamptz not null default now(),
  ended_at   timestamptz,
  metadata   jsonb
);

-- Inter-agent message log
create table if not exists agent_messages (
  id            uuid primary key default gen_random_uuid(),
  session_id    uuid not null references agent_sessions(id) on delete cascade,
  from_agent    text not null,
  to_agent      text not null,
  type          text not null, -- task | result | request | question | answer | context | state | error
  content       text not null,
  task_id       text,          -- logical task reference within the session
  ref_task      text,          -- which task_id this message is responding to
  expects_reply boolean not null default false,
  verdict       text,          -- 'pass' | 'fail' | 'weak' — for tester/critic result messages
  created_at    timestamptz not null default now()
);

create index if not exists agent_messages_session_idx    on agent_messages(session_id);
create index if not exists agent_messages_created_at_idx on agent_messages(created_at);
create index if not exists agent_messages_from_idx       on agent_messages(from_agent);
create index if not exists agent_messages_to_idx         on agent_messages(to_agent);

-- Auto-update updated_at on agents
create or replace function update_agents_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists agents_updated_at on agents;
create trigger agents_updated_at
  before update on agents
  for each row execute function update_agents_updated_at();
