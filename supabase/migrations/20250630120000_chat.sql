-- Migration 007: Chat System
-- Tables: chat_sessions, chat_messages

-- TypeScript types:
-- type ChatSession = { id: string; title: string; created_at: string; updated_at: string; last_message_at: string; message_count: number }
-- type ChatMessage = { id: string; session_id: string; role: 'user'|'assistant'; content: string; tool_calls: ToolCall[]; created_at: string }

-- ── chat_sessions ─────────────────────────────────────────────────────────────

create table if not exists chat_sessions (
  id               uuid        primary key default gen_random_uuid(),
  title            text        not null default 'New conversation',
  created_at       timestamptz not null default now(),
  updated_at       timestamptz not null default now(),
  last_message_at  timestamptz not null default now(),
  message_count    int         not null default 0
);

-- ── chat_messages ─────────────────────────────────────────────────────────────

create table if not exists chat_messages (
  id          uuid        primary key default gen_random_uuid(),
  session_id  uuid        not null references chat_sessions(id) on delete cascade,
  role        text        not null check (role in ('user', 'assistant')),
  content     text        not null,
  tool_calls  jsonb       not null default '[]'::jsonb,
  created_at  timestamptz not null default now()
);

create index if not exists chat_messages_session_created_idx
  on chat_messages(session_id, created_at asc);

-- ── RLS ───────────────────────────────────────────────────────────────────────

alter table chat_sessions  enable row level security;
alter table chat_messages  enable row level security;

-- Permissive allow-all policies (auth is not in scope)
do $$ begin
  if not exists (select 1 from pg_policies where tablename = 'chat_sessions' and policyname = 'allow_all_chat_sessions') then
    create policy "allow_all_chat_sessions" on chat_sessions for all to anon, authenticated using (true) with check (true);
  end if;
end $$;

do $$ begin
  if not exists (select 1 from pg_policies where tablename = 'chat_messages' and policyname = 'allow_all_chat_messages') then
    create policy "allow_all_chat_messages" on chat_messages for all to anon, authenticated using (true) with check (true);
  end if;
end $$;

-- ── Auto-update updated_at on chat_sessions ───────────────────────────────────

create or replace function update_chat_sessions_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists chat_sessions_updated_at on chat_sessions;
create trigger chat_sessions_updated_at
  before update on chat_sessions
  for each row execute function update_chat_sessions_updated_at();
