# Context Engine — Architecture Document

> **Auditoria gerada em:** 2026-04-07  
> **Versão do sistema:** MCP Server v2.0.0 / Next.js 15 / Supabase

---

## 1. Visão Geral

Context Engine é um **sistema de memória persistente e orquestração multi-agente** para assistentes de IA (Claude Code, Claude Desktop). O sistema é composto por:

- Um **MCP Server** que expõe ferramentas de memória ao AI via Model Context Protocol
- Uma **Web UI** (dashboard) para visualizar e gerir toda a memória
- **Edge Functions** Supabase para IA (chat agentic, embeddings RAG, RAG answers)
- **CLIs** para instalar o MCP server e a web UI
- Uma **base de dados** Supabase (PostgreSQL + pgvector)

### Filosofia do Sistema

```
AI (Claude) é o motor de raciocínio
MCP tools são a interface de escrita
Supabase é a única fonte de verdade
Web UI é a superfície de leitura/gestão
```

---

## 2. Estrutura do Monorepo

```
context-engine/                     ← raiz do monorepo (pnpm workspaces)
├── packages/
│   ├── web-ui/                     ← Dashboard Next.js 15 (App Router)
│   ├── mcp-server/                 ← MCP Server Node.js
│   ├── shared/                     ← Tipos TypeScript + Zod schemas partilhados
│   ├── cli-mcp/                    ← CLI `camaleon-mcp` para instalar o MCP server
│   ├── cli-web/                    ← CLI `camaleon-web` para instalar a web UI
│   └── landing/                    ← Landing page pública (Next.js)
├── supabase/
│   ├── functions/
│   │   ├── chat/index.ts           ← Chat agentic SSE (OpenRouter + tools)
│   │   ├── embed/index.ts          ← Embeddings (Supabase AI gte-small, 384 dims)
│   │   └── rag-answer/index.ts     ← RAG answer streaming (OpenRouter)
│   └── migrations/                 ← 1 migration (chat tables) — ver db/migrations
├── db/
│   ├── schema.sql                  ← Schema base (desatualizado — ver migrations)
│   └── migrations/                 ← Migrations completas (001–007 + pinned)
├── docs/                           ← Documentação existente (v1–v3, design)
└── scripts/                        ← seed-session.ts
```

---

## 3. Camadas da Arquitetura

### Camada 1 — Base de Dados (Supabase)

PostgreSQL com pgvector. Tabelas principais:

| Tabela | Responsabilidade |
|--------|-----------------|
| `entries` | Memória central — tasks, notes, decisions, ideas, logs, etc. |
| `embeddings` | Vectores 384-dim para RAG (gte-small) |
| `projects` | Contexto de projeto |
| `people` | Perfis de pessoas |
| `rules` | Regras de comportamento do AI |
| `generation_profiles` | Perfis de geração de conteúdo por plataforma |
| `agents` | Registo de agentes multi-agent |
| `agent_sessions` | Sessões de orquestração |
| `agent_messages` | Log de comunicação entre agentes |
| `chat_sessions` | Sessões de chat (SectionChat) |
| `chat_messages` | Mensagens de chat persistidas |

### Camada 2 — Edge Functions (Deno)

Deployadas em Supabase. Sem autenticação JWT (`verify_jwt: false`).

```
embed           → Supabase AI gte-small (384 dims)
                  Input: { input: string }
                  Output: { embedding: number[] }

chat            → Agentic loop (OpenRouter + Claude 3.5 Haiku)
                  Input: { messages: OAIMessage[] }
                  Output: SSE stream (tokens + tool_calls + tool_results)
                  Max iterations: 5
                  Tools: 12 (add_entry, get_entries, update_entry, add_person,
                              get_people, update_person, add_project, get_projects,
                              get_rules, add_rule, query_context, search_memory)

rag-answer      → RAG answer streaming (OpenRouter + Claude 3.5 Haiku)
                  Input: { query: string, results: ResultEntry[] }
                  Output: SSE stream (tokens)
```

### Camada 3 — MCP Server (Node.js)

Processo stdio que expõe ferramentas ao AI via Model Context Protocol.

```
Módulos registados:
  V1: entries, search, projects, people
  V2: rules, analysis, planning, generation, agents

Total: ~50+ ferramentas MCP
```

**Transporte:** `StdioServerTransport` — comunicação por stdin/stdout  
**Credenciais:** `SUPABASE_URL` + `SUPABASE_SERVICE_KEY` (env vars)  
**File watcher:** monitoriza `~/.claude/agent-sessions/*/conversation.jsonl` e sincroniza para DB

### Camada 4 — Web UI (Next.js 15, App Router)

**Rota principal:** `/dashboard`  
**Arquitetura:** Single-page com 16 sections navegadas por scroll (vertical, animação Framer Motion)  
**Configuração:** `config.json` no raiz do app (não env vars)

**Clientes Supabase:**
- `lib/supabase.ts` — cliente browser (anon key, lido de `localStorage`)
- `lib/supabase-server.ts` — cliente server (service role, lido de `config.json`)

**API Routes (Next.js):**

| Rota | Método | Função |
|------|--------|--------|
| `/api/config` | GET/POST | Ler/escrever `config.json` |
| `/api/health` | GET | Estado de Supabase, MCP, embed |
| `/api/entries` | GET/POST | CRUD entries |
| `/api/entries/[id]` | GET/PATCH/DELETE | CRUD entry individual |
| `/api/search` | GET/POST | Busca semântica + keyword |
| `/api/search/answer` | POST | Stub (não usa rag-answer!) |
| `/api/people/[id]` | GET/PATCH/DELETE | CRUD pessoa |
| `/api/projects/[id]` | GET/PATCH/DELETE | CRUD projeto |
| `/api/export` | GET | Export JSON/CSV |
| `/api/analytics` | GET | Contagens por dia |
| `/api/deploy` | POST | Deploy edge functions + schema via Management API |
| `/api/chat-sessions` | — | Gestão de sessões de chat |

### Camada 5 — CLIs (npm packages)

```
camaleon-mcp   → instala e configura MCP server em ~/.camaleon/
                 Escreve config MCP para Claude Code / Claude Desktop

camaleon-web   → instala web UI (download de release GitHub)
```

---

## 4. Fluxo de Dados

### 4.1 Memória via MCP (caminho principal)

```
Utilizador fala com Claude
  → Claude usa MCP tool (ex: add_entry)
  → MCP Server recebe via stdio
  → Chama Supabase REST API (service role)
  → Persiste em entries table
  → Chama edge function embed para gerar vector
  → Persiste em embeddings table
  → Retorna {id, created_at} ao Claude
```

### 4.2 Busca Semântica (RAG)

```
Claude chama search_memory("query")
  → MCP Server chama edge function embed
  → Obtém vector 384-dim
  → Chama RPC match_entries(vector, limit)
  → match_entries faz cosine similarity com pgvector
  → Retorna entry_ids ordenados por score
  → MCP Server fetch entries by ids
  → Retorna entries com scores ao Claude
```

### 4.3 Chat Agentic (SectionChat)

```
Utilizador escreve no chat
  → SectionChat envia via fetch direto à edge function chat
  → Edge function cria system prompt + tools definitions
  → Chama OpenRouter (claude-3.5-haiku) sem streaming
  → Se finish_reason = "tool_calls":
      → executa tools (add_entry, query_context, etc.)
      → emite SSE: {tool_call: ...} e {tool_result: ...}
      → adiciona ao conversation buffer
      → itera (máx 5)
  → Quando não há tool_calls ou MAX_ITER atingido:
      → emite SSE: {token: ...} com streaming
      → emite SSE: [DONE]
  → SectionChat persiste em chat_sessions/chat_messages via API routes
```

### 4.4 Sistema Multi-Agente

```
Orchestrator (Claude Code com CLAUDE.md)
  → start_session(goal)    → cria agent_sessions + ~/.claude/agent-sessions/{id}/
  → Invoca sub-agentes via Task tool com system_prompt copiado da DB
  → Sub-agente executa + usa MCP tools
  → log_message(...)       → escreve em conversation.jsonl + agent_messages
  → Watcher detecta mudança em .jsonl → upsert em agent_messages
  → SectionAgents lê via Supabase Realtime (subscription)
  → end_session(...)       → marca agent_sessions.status = 'completed'
```

### 4.5 Deploy Autónomo (SectionSettings)

```
Utilizador clica "Deploy"
  → POST /api/deploy
  → Supabase Management API:
      1. SET secrets (OPENROUTER_API_KEY)
      2. Deploy edge functions (multipart upload de index.ts)
      3. Run db/schema.sql via /database/query
      4. Run db/migrations/*.sql (excluindo 001_initial.sql)
      5. Run supabase/migrations/*.sql
  → Retorna steps[] com status ok/error/skipped
```

---

## 5. Stack Tecnológica

| Componente | Stack |
|-----------|-------|
| Database | PostgreSQL 15 + pgvector (Supabase) |
| Edge Functions | Deno (Supabase Edge Runtime) |
| MCP Server | Node.js ≥20, TypeScript, @modelcontextprotocol/sdk |
| Web UI | Next.js 15 (App Router), React 19, TypeScript |
| Animações | Framer Motion |
| Markdown | ReactMarkdown + remark-gfm |
| Styling | CSS custom properties (sem Tailwind no runtime) |
| AI Provider | OpenRouter (claude-3.5-haiku) |
| Embeddings | Supabase AI (gte-small, 384 dims) |
| Validation | Zod (shared schemas) |
| Package Manager | pnpm (workspaces) |

---

## 6. Decisões de Design Notáveis

### D1 — Tool-use loop sem streaming
A edge function `chat` usa `stream: false` para a fase de tool-calling (OpenAI format) e só faz streaming na resposta final. Motivo: Anthropic tool_use é mais fiável sem streaming, e o loop de tools precisa do JSON completo para parsear.

### D2 — Supabase como única fonte de verdade
Não há estado local de aplicação (Redis, files, etc.). Tudo persiste em Supabase. O MCP server é stateless entre chamadas.

### D3 — Configuração via `config.json` (não env vars)
A web UI lê credenciais de `config.json` no cwd, exposto via `/api/config`. Permite configuração via UI sem reiniciar o processo. Tradeoff: menos seguro que env vars.

### D4 — Scroll navigation como UX principal
O dashboard navega por scroll entre sections. Cada section é uma "página" vertical com animação de entrada/saída. Navegação via teclado, CommandPalette (⌘K), e LeftNav.

### D5 — File watcher como bridge local ↔ DB
O MCP server corre no mesmo host que o Claude. O watcher monitora ficheiros `.jsonl` e sincroniza para a DB em tempo real, permitindo que a web UI (que pode estar noutro browser/host) veja as mensagens dos agentes em tempo real via Supabase Realtime.
