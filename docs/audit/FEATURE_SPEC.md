# Context Engine — Feature Specification

> **Auditoria gerada em:** 2026-04-07

---

## Legenda de Estado

| Estado | Significado |
|--------|-------------|
| ✅ Implementado | Feature completa e funcional |
| ⚠️ Parcial | Implementado mas com limitações ou bugs |
| ❌ Quebrado | Feature existe mas está incorreta |
| 🚧 Stub | Estrutura existe mas não implementada |
| 📋 Planeado | Documentado mas não implementado |

---

## 1. Memória — Entries

**Secção:** Dashboard → Entries (índice 1)  
**Estado:** ✅ Implementado

### O que é
Sistema central de memória. Guarda items estruturados classificados por tipo.

### Tipos de Entry

| Tipo | Cor | Uso |
|------|-----|-----|
| `task` | Azul | Ações a fazer ou em curso |
| `note` | Roxo | Notas genéricas |
| `decision` | Âmbar | Decisões tomadas |
| `meet` | Verde | Reuniões/encontros |
| `idea` | Rosa | Ideias a explorar |
| `log` | Cinzento | Registos de atividade |
| `analysis` | Ciano | Análises de projetos |
| `plan` | Índigo | Planos com tasks |
| `post` | Laranja | Posts de conteúdo |
| `file` | Slate | Ficheiros indexados |

### Campos de uma Entry

| Campo | Tipo | Obrigatório |
|-------|------|-------------|
| `id` | UUID | Auto |
| `type` | enum | ✓ |
| `title` | text | ✓ |
| `content` | text | — |
| `status` | pending/in_progress/done/blocked | — |
| `project_id` | FK → projects | — |
| `person_id` | FK → people | — |
| `tags` | text[] | — |
| `metadata` | jsonb | — |
| `pinned` | boolean | — (default false) |
| `created_at` / `updated_at` | timestamptz | Auto |

### Funcionalidades

- **Listagem** com filtros por tipo e status
- **Paginação** (18 items por página)
- **View modes:** split (lista + detalhe) e timeline
- **Detail Panel** inline com edição de título, conteúdo e status
- **Bulk actions:** marcar todas como done, selecionar e apagar
- **Modais:** AddEntryModal e EditEntryModal
- **Pinned entries** (coluna adicionada em migração `20260402`)

### Como funciona (lógica)
Entries são lidas diretamente do Supabase client-side (anon key). Criação usa `/api/entries` (server-side, embeds automatically). PATCH usa `/api/entries/[id]`. Deleção usa Supabase client diretamente.

---

## 2. Busca Semântica — Search

**Secção:** Dashboard → Search (índice 2)  
**Estado:** ⚠️ Parcial

### O que é
Busca semântica (RAG) + keyword search sobre todas as entries. Pipeline:
1. Texto → embedding via edge fn `embed`
2. Embedding → `match_entries` RPC (cosine similarity)
3. Resultados ordenados por score (HIGH/MED/LOW)
4. RAG answer via edge fn `rag-answer` (com score de confiança)

### Funcionalidades

- **Hybrid search**: semântica (RAG) com fallback para keyword (`ilike`)
- **Filtros:** por tipo, status, date range (week/month)
- **Score labels:** HIGH (≥0.85), MED (≥0.65), LOW (<0.65)
- **Histórico de queries** (localStorage, últimas 10)
- **Highlight** dos termos pesquisados
- **RAG Answer panel** (acima dos resultados)
- **Navegação** para entry no SectionEntries via `onNavigateTo`

### Limitação conhecida
O botão "RAG Answer" chama `/api/search/answer` que é um **stub** — não chama a edge function `rag-answer`. Retorna uma string formatada localmente. A edge function real existe e é superior (streaming via OpenRouter). Ver ISSUES_AND_BUGS.md #2.

---

## 3. Projects

**Secção:** Dashboard → Projects (índice 3)  
**Estado:** ✅ Implementado

### Campos
`name` (único), `company`, `stack[]`, `status` (active/paused/done), `description`

### Funcionalidades
- Listagem filtrada por status
- Criação/edição inline
- Contagem de entries associadas
- Filtro por empresa em SectionCompanies

---

## 4. Companies

**Secção:** Dashboard → Companies (índice 4)  
**Estado:** ✅ Implementado

Agrega projetos por campo `company`. Usa `get_companies()` (distinct values) e `get_projects_by_company()`. View read-only — companies não são entidades próprias, são strings nos projetos.

---

## 5. People

**Secção:** Dashboard → People (índice 5)  
**Estado:** ⚠️ Parcial

### Campos
`name`, `role`, `company`, `email`, `notes`

### Limitação
`update_person` não existe como ferramenta MCP (apenas na edge function `chat`). Só via web UI ou chat.

---

## 6. Chat Agentic

**Secção:** Dashboard → Chat (índice 6)  
**Estado:** ✅ Implementado (rico)

### O que é
Interface de chat com Claude que tem acesso às ferramentas de memória. O AI pode guardar, pesquisar e actualizar memória durante a conversa.

### Funcionalidades

- **SSE streaming** via `fetch` direto à edge function `chat`
- **Tool call visualization** — cada tool call mostra nome, params e resultado (expansível)
- **Tool summary** — nome compacto com parâmetro principal
- **Multi-session** — lista de conversas com títulos automáticos
- **Persistência** — mensagens guardadas em `chat_messages` via API
- **Histórico** — conversas anteriores carregadas do DB
- **Markdown rendering** via ReactMarkdown
- **Streaming de tokens** em tempo real

### Loop Agentic (edge function)

```
System prompt (200+ linhas) + user messages
  → OpenRouter (claude-3.5-haiku) sem streaming
  → Se tool_calls: executa tools (12 disponíveis) → emite SSE
  → Itera até: finish_reason != "tool_calls" OU MAX_ITER = 5
  → Resposta final: OpenRouter com streaming ON
```

### Ferramentas disponíveis no chat
`add_entry`, `get_entries`, `update_entry`, `add_person`, `get_people`, `update_person`, `add_project`, `get_projects`, `get_rules`, `add_rule`, `query_context`, `search_memory`

---

## 7. Agents — Multi-Agent Orchestration

**Secção:** Dashboard → Agents (índice 7)  
**Estado:** ✅ Implementado

### O que é
Sistema de visualização e gestão de sessões multi-agente. Os agentes são invocados pelo Orchestrator (Claude Code) externamente; a web UI serve como painel de observação.

### Sub-features

#### 7.1 Agent Registry
Lista de agentes globais registados em DB (`agents` table).
- Nome, role, system_prompt, status (active/inactive), cor
- Agentes predefinidos: orchestrator, frontend, backend, designer, design-critic, tester, fullstack, data-analyst, ideator

#### 7.2 Sessions
- Listagem de sessões (`agent_sessions`)
- Estado: active / completed / failed
- Click para expandir e ver mensagens

#### 7.3 Live Message Feed
- Mensagens de inter-agente em tempo real
- Supabase Realtime subscription em `agent_messages`
- Tipo de mensagem: task / result / request / question / answer / context / state / error
- Verdict: pass / fail / weak (para result messages)
- Cores por agente e por tipo

#### 7.4 Gestão
- Criar/editar agentes (nome, role, system_prompt, cor)
- Eliminar agente
- Marcar sessão como completed/failed

### Como funciona (ponta a ponta)
1. Utilizador diz goal ao Orchestrator (Claude Code)
2. Orchestrator chama `start_session(goal)` via MCP → cria pasta `~/.claude/agent-sessions/{id}/`
3. Invoca sub-agentes via Task tool com contexto + system_prompt da DB
4. Sub-agentes chamam `log_message()` → escreve em `.jsonl` + `agent_messages` DB
5. File watcher detecta mudanças em `.jsonl` → upsert na DB (deduplicado)
6. SectionAgents recebe via Realtime → atualiza UI em tempo real

---

## 8. Analysis — Análises de Codebase

**Secção:** Dashboard → Analyses (índice 8)  
**Estado:** ✅ Implementado

### O que é
Repositório de análises de projetos geradas pelo AI. Entries do tipo `analysis` com metadata estruturada.

### Funcionalidades
- Listagem filtrada por projeto
- Detalhe com conteúdo markdown
- Cores por projeto (palette de 8 cores rotativa)
- Apagar análise (com cascade delete de embeddings)
- Criado via MCP tool `save_analysis()`

---

## 9. Planning — Planos e Tasks

**Secção:** Dashboard → Plans (índice 9)  
**Estado:** ✅ Implementado

### O que é
Planos criados pelo AI (via `save_plan()`) com lista de tasks associadas.

### Funcionalidades
- Listagem de planos (entries tipo `plan`)
- Detail panel com tasks e status
- Progress bar segmentada (done/blocked/pending)
- Toggle de status de task (click em status dot)
- Apagar task individual
- Tasks são entries tipo `task` com `metadata.parent_plan_id`

---

## 10. Content Generation

**Secção:** Dashboard → Content (índice 10)  
**Estado:** ⚠️ Parcial

### O que é
Gestão de posts gerados pelo AI para LinkedIn, Twitter, Newsletter.

### Funcionalidades
- Listagem de posts (entries tipo `post`) filtrados por plataforma
- Detalhe com conteúdo completo
- Copy to clipboard
- Perfis de geração (via MCP `set_generation_profile`)
- Flow terminal visual (explica passos para gerar posts via MCP)

### Limitação
A geração real de posts acontece via Claude (MCP `generate_posts`), não na web UI. A UI é read-only para posts já gerados — não há botão "gerar" na web UI.

---

## 11. Graph — Knowledge Graph

**Secção:** Dashboard → Graph (índice 11)  
**Estado:** ✅ Implementado

### O que é
Visualização de força (force-directed graph) das relações entre entidades.

### Nós
Projects (ciano), People (rosa), Companies (verde), Tasks/Notes/Decisions/Ideas/Meets/Logs

### Arestas
- Project → Person (via entries.person_id)
- Entry → Project (via entries.project_id)
- People → Company (via people.company)

### Funcionalidades
- Física de força: repulsão, atração por arestas, damping
- Drag de nós
- Click para ver detalhe do nó
- Filtro por tipo
- Hover com label
- Desenhado em `<canvas>` sem biblioteca externa

---

## 12. Timeline

**Secção:** Dashboard → Timeline (índice 12)  
**Estado:** ✅ Implementado

### O que é
Feed cronológico de todas as entries, agrupadas por dia.

### Funcionalidades
- Agrupamento por "Today / Yesterday / data"
- Filtros por tipo (all + 9 tipos)
- "Load more" com paginação
- Click em entry para expandir detalhe inline
- Link para navegar para SectionEntries

---

## 13. Tasks

**Secção:** Dashboard → Tasks (índice 13)  
**Estado:** ⚠️ Parcial (BUG de navegação)

### O que é
Vista focada em tasks com filtro de status.

### Funcionalidades
- Filtros: pending / in_progress / done / blocked
- Bulk actions
- Inline status toggle

### Bug crítico
`SECTION_INDEX.TASKS = 6` mas a secção está no índice real 13. Qualquer link interno que use `onNavigateTo(SECTION_INDEX.TASKS)` navega para **Chat** em vez de Tasks. Ver ISSUES_AND_BUGS.md #1.

---

## 14. Rules Engine

**Secção:** Dashboard → Rules (índice 14)  
**Estado:** ✅ Implementado

### O que é
Regras de comportamento do AI injetadas em cada sessão via `query_context()`.

### Campos
`title`, `content`, `category` (behavior/memory/output/general), `priority` (int), `active` (boolean)

### Funcionalidades
- CRUD completo de regras
- Toggle active/inactive
- Ordenação por prioridade
- Filtro por categoria
- Regras ativas são injetadas em `query_context` como bloco "# System Rules"

---

## 15. Settings

**Secção:** Dashboard → Settings (índice 15)  
**Estado:** ✅ Implementado

### Funcionalidades

- **Credenciais:** Supabase URL, Anon Key, Service Key, Access Token, OpenRouter Key
- **Deploy:** Deploy edge functions + schema via Supabase Management API (1-click)
- **Health check:** status de DB, MCP, embed (polling 30s no dashboard)
- **Export:** JSON ou CSV de todas as entries (filtráveis)
- **Stats:** contagem de entries, projects, people
- **Theme:** dark/light (localStorage)
- **Supabase client reload:** após guardar credenciais, recarrega o cliente sem restart

---

## 16. Dashboard (Overview)

**Secção:** Dashboard → Overview (índice 0)  
**Estado:** ✅ Implementado

### Funcionalidades
- **Stats animadas** (count-up animation): entries, projects, people, tasks pending
- **System status bar:** DB / MCP / VEC (polling 30s)
- **Distribuição por tipo** (gráfico de barras)
- **Distribuição por status**
- **Projetos ativos** (top 5)
- **Quick actions:** New Entry, Search, Jump to Tasks/Projects

---

## 17. Boot Page

**Rota:** `/` → redireciona para `/dashboard`  
**Estado:** ✅ Implementado

Splash screen de loading com progress bar e etapas animadas. Chama `/api/health`. Redireciona automaticamente para o dashboard quando Supabase está OK. Mostra erro se DB unreachable com botão "Configure" → navega para Settings.

---

## 18. Deploy Autónomo

**Endpoint:** POST `/api/deploy`  
**Estado:** ✅ Implementado

Permite fazer deploy de todo o sistema (edge functions + schema + migrations) sem CLI, via Supabase Management API. Requer `supabaseAccessToken` (Personal Access Token).

---

## 19. Export de Dados

**Endpoint:** GET `/api/export`  
**Estado:** ✅ Implementado

Export de entries em JSON ou CSV com filtros opcionais por tipo e projeto.

---

## 20. Ferramenta Upload de Ficheiros

**MCP Tool:** `upload_file`  
**Estado:** ⚠️ Parcial

Upload para Supabase Storage + indexação para RAG. Suporta texto/código/markdown (extração automática). PDFs: extração não implementada (retorna "[Binary file]"). Chunking em pedaços de 2000 chars para embeddings multi-chunk.

---

## 21. World Context (Brave Search)

**MCP Tool:** `fetch_world_context`  
**Estado:** ⚠️ Parcial (opcional)

Busca notícias recentes via Brave Search API. Requer `BRAVE_API_KEY` env var no MCP server. Se não configurado, retorna erro gracioso.

---

## 22. Instaladores CLI

### `camaleon-mcp`

```
npx camaleon-mcp install   → prompt para credenciais Supabase
                             → download e install do MCP server em ~/.camaleon/
                             → escreve config MCP para Claude
npx camaleon-mcp update    → atualiza para versão mais recente
npx camaleon-mcp status    → mostra estado da instalação
```

### `camaleon-web`

```
npx camaleon-web install   → download e install da web UI
npx camaleon-web service   → instala como serviço systemd/launchd
```
