# Context Engine — DB Schema Audit

> **Auditoria gerada em:** 2026-04-07

---

## 1. Visão Geral do Schema

O schema é construído por camadas de migrations:

| Ficheiro | Conteúdo |
|----------|----------|
| `db/schema.sql` | Schema base — **desatualizado** (não reflete migrations) |
| `db/migrations/001_initial.sql` | Schema inicial completo |
| `db/migrations/002_update_tasks.sql` | Adiciona `in_progress` ao status |
| `db/migrations/003_v2.sql` | Rules, generation_profiles, estende entries, estende embeddings |
| `db/migrations/004_second_brain_rules.sql` | Seed de regras comportamentais |
| `db/migrations/006_agents.sql` | agents, agent_sessions, agent_messages |
| `db/migrations/007_chat.sql` | chat_sessions, chat_messages |
| `db/migrations/20260402_add_pinned_to_entries.sql` | Coluna `pinned` em entries |
| `supabase/migrations/20250630120000_chat.sql` | Duplicate de chat tables (ver nota) |

> ⚠️ **Nota:** `supabase/migrations/` contém apenas as chat tables, enquanto a maior parte das migrations está em `db/migrations/`. O deploy route combina ambas, mas os dois conjuntos são tratados de forma independente pelo Supabase CLI.

---

## 2. Tabelas e Colunas

### 2.1 `entries` — Memória central

```sql
id          uuid primary key default gen_random_uuid()
type        text not null
            CHECK (type IN ('task','note','decision','meet','idea','log',
                            'analysis','plan','post','file'))  -- estendido em 003
title       text not null
content     text
status      text CHECK (status IN ('pending','in_progress','done','blocked'))  -- in_progress adicionado em 002
project_id  uuid references projects(id) on delete set null
person_id   uuid references people(id) on delete set null
tags        text[]
metadata    jsonb
pinned      boolean not null default false  -- adicionado em 20260402
created_at  timestamptz not null default now()
updated_at  timestamptz not null default now()  -- auto-updated via trigger
```

**Trigger:** `entries_updated_at` — atualiza `updated_at` em UPDATE  
**Índice:** `entries_pinned_idx` — parcial em `(created_at DESC) WHERE pinned = true`

**Avaliação:** ✅ Bem estruturado. Tipos cobrem todos os casos de uso.

---

### 2.2 `embeddings` — Vectores RAG

```sql
id          uuid primary key default gen_random_uuid()
entry_id    uuid references entries(id) on delete cascade  -- nullable desde 003
embedding   vector(384)
content     text not null
source_type text not null default 'entry'
            CHECK (source_type IN ('entry', 'file'))  -- adicionado em 003
file_path   text  -- só quando source_type = 'file', adicionado em 003
created_at  timestamptz not null default now()
```

**Índice:** `embeddings_embedding_idx` — IVFFlat (lists=100) para cosine similarity

**Problemas:**
- ⚠️ `content` não é indexed — buscas por conteúdo são seq scan
- ⚠️ `entry_id` nullable mas sem constraint que garanta `entry_id IS NOT NULL` quando `source_type = 'entry'`
- ⚠️ IVFFlat requer pelo menos 100 rows para ser eficaz (abaixo disso é seq scan de qualquer modo)
- ❌ Sem índice em `entry_id` — joins lentos com muitos embeddings

---

### 2.3 `projects`

```sql
id          uuid primary key default gen_random_uuid()
name        text not null unique
company     text
stack       text[]
status      text not null default 'active'
            CHECK (status IN ('active','paused','done'))
description text
created_at  timestamptz not null default now()
```

**Avaliação:** ✅ Simples e correto. `name` tem UNIQUE constraint — upsert seguro.

---

### 2.4 `people`

```sql
id          uuid primary key default gen_random_uuid()
name        text not null
role        text
company     text
email       text
notes       text
created_at  timestamptz not null default now()
```

**Problemas:**
- ⚠️ Sem UNIQUE constraint em `name` — duplicados possíveis
- ⚠️ Sem validação de formato em `email`
- ⚠️ Sem `updated_at` — não se sabe quando foi o último update de perfil

---

### 2.5 `rules`

```sql
id          uuid primary key default gen_random_uuid()
title       text not null
content     text not null
category    text CHECK (category IN ('behavior','memory','output','general'))
active      boolean not null default true
priority    int not null default 0
created_at  timestamptz not null default now()
updated_at  timestamptz not null default now()
```

**Trigger:** `rules_updated_at`  
**Avaliação:** ✅ Bem estruturado.

---

### 2.6 `generation_profiles`

```sql
id             uuid primary key default gen_random_uuid()
platform       text not null CHECK (platform IN ('linkedin','twitter','newsletter'))
intent         text not null
tone           text not null
topics         text[] not null default '{}'
avoid          text[] not null default '{}'
post_frequency text
language       text default 'english'
active         boolean not null default true
created_at     timestamptz not null default now()
updated_at     timestamptz not null default now()
UNIQUE (platform)
```

**Avaliação:** ✅ Correto. UNIQUE em platform para upsert.

---

### 2.7 `agents`

```sql
id            uuid primary key default gen_random_uuid()
name          text not null unique
role          text not null
system_prompt text not null
status        text not null default 'active'
color         text
last_synced   timestamptz
metadata      jsonb
created_at    timestamptz not null default now()
updated_at    timestamptz not null default now()
```

**Trigger:** `agents_updated_at`  
**Avaliação:** ✅ Correto.

---

### 2.8 `agent_sessions`

```sql
id         uuid primary key default gen_random_uuid()
goal       text not null
status     text not null default 'active'
started_at timestamptz not null default now()
ended_at   timestamptz
metadata   jsonb
```

**Problemas:**
- ⚠️ Sem CHECK constraint em `status` — qualquer string é aceite
- ⚠️ Sem `updated_at` — não se sabe quando mudou de estado

---

### 2.9 `agent_messages`

```sql
id            uuid primary key default gen_random_uuid()
session_id    uuid not null references agent_sessions(id) on delete cascade
from_agent    text not null
to_agent      text not null
type          text not null
content       text not null
task_id       text
ref_task      text
expects_reply boolean not null default false
verdict       text
created_at    timestamptz not null default now()
```

**Índices:** `agent_messages_session_idx`, `agent_messages_created_at_idx`, `agent_messages_from_idx`, `agent_messages_to_idx`

**Problemas:**
- ⚠️ Sem CHECK constraint em `type` (task/result/request/etc.)
- ⚠️ Sem CHECK constraint em `verdict` (pass/fail/weak)
- ❌ **Sem UNIQUE constraint em `(session_id, from_agent, created_at)`** — o watcher usa `upsert` com `onConflict: 'session_id,from_agent,created_at'` mas este constraint não está definido no schema. O upsert vai falhar silenciosamente ou inserir duplicados.

---

### 2.10 `chat_sessions`

```sql
id               uuid primary key default gen_random_uuid()
title            text not null default 'New conversation'
created_at       timestamptz not null default now()
updated_at       timestamptz not null default now()
last_message_at  timestamptz not null default now()
message_count    int not null default 0
```

**Problema:**
- ⚠️ `message_count` não é atualizado automaticamente — depende do código da aplicação

---

### 2.11 `chat_messages`

```sql
id          uuid primary key default gen_random_uuid()
session_id  uuid not null references chat_sessions(id) on delete cascade
role        text not null check (role in ('user', 'assistant'))
content     text not null
tool_calls  jsonb not null default '[]'
created_at  timestamptz not null default now()
```

**Índice:** `chat_messages_session_created_idx` em `(session_id, created_at asc)`  
**Avaliação:** ✅ Bem estruturado.

---

## 3. RPC Functions

### 3.1 `match_entries`

```sql
match_entries(
  query_embedding vector(384),
  match_count     int default 5,
  filter_type     text default null,
  filter_project  uuid default null
) returns table (entry_id uuid, score float)
```

**Como funciona:** Cosine similarity via `<=>` operator do pgvector. Filtra por tipo e projeto opcionalmente.

**Problema:**
- ⚠️ O web API (`/api/search/route.ts`) passa `query_embedding: JSON.stringify(embedding)` (string) em vez de array. Supabase pode converter, mas é uma inconsistência com a chamada MCP que passa o array diretamente.
- ⚠️ Sem índice em `embeddings.entry_id` — o JOIN com `entries` para aplicar filtros pode ser lento

---

## 4. RLS (Row Level Security)

Todas as tabelas têm RLS **ativo** mas com **políticas permissivas universais** (`allow_all`):

```sql
-- Exemplo (chat_sessions):
create policy "allow_all_chat_sessions" on chat_sessions
  for all to anon, authenticated using (true) with check (true);
```

Isto aplica-se a: `chat_sessions`, `chat_messages`, e implicitamente às restantes.

**Avaliação:** ❌ **Sem autenticação real.** Qualquer utilizador com a anon key pode ler e escrever em qualquer tabela. Aceitável para uso pessoal/local, inaceitável para multi-tenant ou exposição pública.

---

## 5. Triggers

| Trigger | Tabela | Função |
|---------|--------|--------|
| `entries_updated_at` | entries | Atualiza `updated_at` |
| `rules_updated_at` | rules | Atualiza `updated_at` |
| `generation_profiles_updated_at` | generation_profiles | Atualiza `updated_at` |
| `agents_updated_at` | agents | Atualiza `updated_at` |
| `chat_sessions_updated_at` | chat_sessions | Atualiza `updated_at` |

---

## 6. O que Falta / Problemas

### Crítico
1. ❌ **Unique constraint em `agent_messages(session_id, from_agent, created_at)`** — o watcher faz upsert com este onConflict mas o constraint não existe → comportamento indefinido (duplicados ou erro)

### Alto
2. ⚠️ **Sem `updated_at` em `people`** — impossível saber quando foi editado um perfil
3. ⚠️ **Sem UNIQUE em `people.name`** — duplicados fáceis
4. ⚠️ **Sem CHECK em `agent_sessions.status`** e `agent_messages.type`/`verdict`

### Médio
5. ⚠️ **`schema.sql` desatualizado** — se alguém usar o schema.sql diretamente (ex: setup manual), vai ter um schema incompleto sem rules, generation_profiles, agents, chat, pinned
6. ⚠️ **Sem índice em `embeddings.entry_id`** — JOINs lentos
7. ⚠️ **IVFFlat com `lists=100`** requer ≥10.000 rows para eficácia máxima; abaixo disso, HNSW seria melhor
8. ⚠️ **`chat_messages.message_count`** não auto-incrementa — inconsistente

### Baixo
9. 📋 **Sem particionamento** em `entries` e `agent_messages` — a longo prazo podem crescer muito
10. 📋 **Sem TTL/cleanup** para sessions antigas ou embeddings órfãos
