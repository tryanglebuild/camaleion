-- Context Engine MCP — Full Schema
-- Supabase + pgvector (gte-small, 384 dims)

-- ============================================================
-- Extensions
-- ============================================================
create extension if not exists vector;

-- ============================================================
-- projects
-- ============================================================
create table if not exists projects (
  id          uuid primary key default gen_random_uuid(),
  name        text not null unique,
  company     text,
  stack       text[],
  status      text not null default 'active'
                check (status in ('active', 'paused', 'done')),
  description text,
  created_at  timestamptz not null default now()
);

-- ============================================================
-- people
-- ============================================================
create table if not exists people (
  id          uuid primary key default gen_random_uuid(),
  name        text not null,
  role        text,
  company     text,
  email       text,
  notes       text,
  created_at  timestamptz not null default now()
);

-- ============================================================
-- entries — central memory store
-- ============================================================
create table if not exists entries (
  id          uuid primary key default gen_random_uuid(),
  type        text not null
                check (type in ('task', 'note', 'decision', 'meet', 'idea', 'log')),
  title       text not null,
  content     text,
  status      text
                check (status in ('pending', 'done', 'blocked')),
  project_id  uuid references projects(id) on delete set null,
  person_id   uuid references people(id) on delete set null,
  tags        text[],
  metadata    jsonb,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

-- auto-update updated_at
create or replace function update_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

drop trigger if exists entries_updated_at on entries;
create trigger entries_updated_at
  before update on entries
  for each row execute function update_updated_at();

-- ============================================================
-- embeddings — RAG (gte-small via Supabase AI, 384 dims)
-- ============================================================
create table if not exists embeddings (
  id          uuid primary key default gen_random_uuid(),
  entry_id    uuid not null references entries(id) on delete cascade,
  embedding   vector(384),
  content     text not null,  -- text that was embedded
  created_at  timestamptz not null default now()
);

-- ivfflat index for cosine similarity search
create index if not exists embeddings_embedding_idx
  on embeddings using ivfflat (embedding vector_cosine_ops)
  with (lists = 100);

-- ============================================================
-- match_entries — RPC for semantic search
-- ============================================================
create or replace function match_entries(
  query_embedding vector(384),
  match_count     int default 5,
  filter_type     text default null,
  filter_project  uuid default null
)
returns table (
  entry_id    uuid,
  score       float
)
language sql stable
as $$
  select
    e.entry_id,
    1 - (e.embedding <=> query_embedding) as score
  from embeddings e
  join entries en on en.id = e.entry_id
  where
    (filter_type is null or en.type = filter_type)
    and (filter_project is null or en.project_id = filter_project)
  order by e.embedding <=> query_embedding
  limit match_count;
$$;
