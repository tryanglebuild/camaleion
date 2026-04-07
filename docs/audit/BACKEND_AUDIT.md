# Context Engine — Backend Audit

> **Auditoria gerada em:** 2026-04-07  
> Cobre: Edge Functions Supabase + MCP Server + Next.js API Routes

---

## 1. Edge Functions

### 1.1 `embed` — Geração de Embeddings

**Ficheiro:** `supabase/functions/embed/index.ts`  
**Tamanho:** ~50 linhas  
**Estado:** ✅ Sólido

```
Input:  { input: string }
Output: { embedding: number[] }  ← 384 dims, gte-small
```

**Pontos positivos:**
- Usa Supabase AI native (`Supabase.ai.Session`) — zero custo, sem dependências externas
- `mean_pool: true, normalize: true` — configuração correta para cosine similarity
- Tratamento de erro correto: valida input, retorna JSON com status code adequado
- CORS correto para browser calls

**Problemas:**
- ⚠️ `verify_jwt: false` — qualquer pessoa com URL pode chamar. Aceitável se CORS for suficiente, mas num ambiente público é um vetor de abuso.
- ⚠️ Sem rate limiting — pode ser chamada ilimitadamente
- ⚠️ `// @ts-ignore: Supabase.ai is injected at runtime` — tipo não documentado, pode quebrar em runtime updates do Supabase Edge

---

### 1.2 `chat` — Chat Agentic

**Ficheiro:** `supabase/functions/chat/index.ts`  
**Tamanho:** 950 linhas  
**Estado:** ✅ Funcional, com problemas

#### Arquitetura
```
Request: { messages: OAIMessage[] }
System prompt: ~200 linhas (personality + rules + entity resolution)
Model: anthropic/claude-3.5-haiku via OpenRouter
Max iterations: 5 (hardcoded)
Tools: 12
Output: SSE stream
```

#### Tool Implementations

**`add_entry`:**
- ✅ Resolve project by name (case-insensitive)
- ✅ Auto-embeds de forma non-blocking (fire-and-forget)
- ⚠️ Embedding é fire-and-forget — se falhar, a entry fica sem embedding (sem retry, sem log)

**`update_entry`:**
- ✅ Permite actualizar title, content, status, tags
- ⚠️ Não re-embeds quando `content` muda — o MCP server faz re-embed, mas a edge function não

**`update_person`:**
- ✅ Lookup por nome se id não fornecido
- ⚠️ Esta ferramenta existe na edge function `chat` mas **não está disponível no MCP server** (ver MCP audit abaixo)

**`add_project`:**
- ✅ Usa `upsert` com `onConflict: 'name'` — correto
- ⚠️ No MCP server, `add_project` usa `insert` simples — vai falhar se projeto já existe

**`query_context`:**
- ⚠️ Retorna apenas `entry_id` e `score` (match_entries RPC) sem fetch das entries completas — o AI recebe IDs numéricos sem contexto útil. No MCP server, `query_context` é muito mais rico (faz fetch das entries, formata como texto, injeta rules).

**`search_memory`:**
- ✅ Escapa caracteres especiais `%_` no query
- ✅ Filtro por type

#### Problemas da Edge Function `chat`

| Severidade | Problema |
|-----------|---------|
| ❌ CRÍTICO | `query_context` retorna IDs em vez de conteúdo — o AI fica cego ao contexto |
| ❌ ALTO | Re-embed não acontece em `update_entry` — embeddings ficam desatualizados |
| ⚠️ MÉDIO | `MAX_ITER = 5` hardcoded — não configurável por request |
| ⚠️ MÉDIO | Embedding fire-and-forget sem retry — entries sem embedding falham RAG silenciosamente |
| ⚠️ MÉDIO | Mensagens de chat **não são persistidas** pela edge function — é responsabilidade do frontend. Se o frontend falhar a persistir, perde-se o histórico |
| ⚠️ BAIXO | `MODEL = "anthropic/claude-3.5-haiku"` hardcoded — não configurável |
| ⚠️ BAIXO | CORS `*` sem autenticação |

#### Lógica do Loop (análise de qualidade)

```typescript
while (iteration < MAX_ITER) {
  const orRes = await callOpenRouter(apiKey, conversationMessages, false)  // stream: false
  
  if (finishReason !== "tool_calls" || !message?.tool_calls?.length) {
    // ← Resposta final: emite tokens via stream
    break
  }
  
  // Executa tools, adiciona ao conversation buffer
  iteration++
}

// Se MAX_ITER atingido: faz chamada final sem tools (stream: true)
// ← Remove tool_calls das mensagens assistant para forçar resposta textual
```

**Problema no final da loop:** ao atingir MAX_ITER, o código filtra `tool_calls` das mensagens assistant com `m.content ?? ""`. Se `message.content` for `null` (comum quando há tool_calls), ficamos com mensagens assistant com `content: ""` — historicamente problemático com alguns providers.

---

### 1.3 `rag-answer` — RAG Answer Streaming

**Ficheiro:** `supabase/functions/rag-answer/index.ts`  
**Tamanho:** ~120 linhas  
**Estado:** ✅ Implementado mas **não usado** pela web UI

#### O que faz
Recebe `{ query, results: ResultEntry[] }`, constrói prompt RAG com citações, chama OpenRouter com streaming, retorna SSE.

#### Prompt RAG
- Usa apenas os top 8 resultados
- Trunca content a 400 chars por resultado
- Inclui similarity score no contexto
- Exige citações `[N]` no output
- Exige secção "Confidence" (High/Medium/Low)

#### Problema crítico
A web UI tem `/api/search/answer` que recebe os results e deveria proxy-ar para esta edge function. Em vez disso, é um **stub** que gera uma frase genérica localmente:

```typescript
// /api/search/answer/route.ts
const answer = `Found ${results.length} relevant entries for "${query}". 
  Top results include: ${titles}. Entry types: ${types.join(', ')}.`
```

A edge function `rag-answer` de alta qualidade (streaming, citações, confidence) **nunca é chamada** pela web UI. O SectionSearch usa o stub, desperdiçando a edge function real.

---

## 2. MCP Server

### 2.1 Estrutura Geral

**Ficheiro:** `packages/mcp-server/src/index.ts`  
**Transport:** StdioServerTransport  
**Versão:** `@modelcontextprotocol/sdk`  

O servidor regista 9 módulos de tools e inicia um **file watcher** para sincronizar conversation.jsonl → DB.

### 2.2 Módulo `entries` ✅

**Tools:** `add_entry`, `get_entries`, `update_entry`

**add_entry:**
- ✅ Resolve project e person por nome
- ✅ Auto-embed (lança promise, sem await — semi fire-and-forget mas com await em `embedText`)
- ✅ Insere embedding com `content` explícito
- ⚠️ Se embedding falhar, a entry fica criada mas sem embedding — sem log de erro para o AI

**get_entries:**
- ✅ Filtros por tipo, status, since, tags (overlaps), project
- ✅ Join com projects e people
- ⚠️ Máximo hardcoded de 100 (pode ser lento para grandes datasets)

**update_entry:**
- ✅ Re-embed quando content muda (delete + insert) — melhor que a edge function
- ⚠️ Não permite actualizar `title`, `project_id`, `person_id` — limitação real

### 2.3 Módulo `search` ✅

**Tools:** `search_memory`, `query_context`

**search_memory:**
- ✅ Embedding via `embedText` → `match_entries` RPC → fetch entries
- ✅ Preserva ordem por relevância
- ⚠️ Sem fallback keyword se embedding falhar

**query_context:**
- ✅ Carrega rules activas em paralelo com embedding
- ✅ Formata output como markdown legível pelo AI
- ✅ Inclui metadata (project, status, tags, date, content)
- ✅ É o método mais rico de context injection

### 2.4 Módulo `projects` ✅

**Tools:** `add_project`, `get_projects`, `get_companies`, `get_projects_by_company`

**Problema:**
- ❌ `add_project` usa `insert` simples — falha com "duplicate key" se projeto já existe. Deveria usar `upsert` com `onConflict: 'name'` como faz a edge function chat.

### 2.5 Módulo `people` ⚠️

**Tools:** `add_person`, `get_people`

**Falta:** `update_person` — a edge function chat tem, o MCP não. Não é possível actualizar perfis de pessoas via MCP (só via chat ou web UI).

### 2.6 Módulo `rules` ✅

**Tools:** `get_rules`, `add_rule`, `update_rule`, `delete_rule`

**get_rules:**
- ✅ Ordena por priority DESC e created_at ASC
- ⚠️ `active` default é `true` hardcoded no código — ignora o que vem do schema default. Se o input não especificar `active`, filtra apenas activas.

### 2.7 Módulo `analysis` ✅

**Tools:** `save_analysis`, `get_analyses`, `delete_analysis`

**save_analysis:**
- ✅ Cria entry tipo 'analysis' com metadata estruturado
- ✅ Auto-embed

**delete_analysis:**
- ✅ Deleta embeddings antes de deletar entry (evita FK violation)

### 2.8 Módulo `planning` ✅

**Tools:** `save_plan`

Cria entry tipo 'plan' + entries tipo 'task' associadas. Tasks têm `metadata.parent_plan_id`. Embed do plan entry.

**Falta:** `get_plans`, `update_plan`, `delete_plan` — read/update/delete de planos só via web UI.

### 2.9 Módulo `generation` ⚠️

**Tools:** `upload_file`, `set_generation_profile`, `fetch_world_context`, `generate_posts`, `save_post`

**upload_file:**
- ✅ Upload para Supabase Storage
- ✅ Chunking em 2000 chars
- ⚠️ PDF extraction não implementada — retorna "[Binary file: filename]" como content
- ⚠️ Storage bucket `context-engine-files` deve existir — não é criado automaticamente pelo deploy

**generate_posts:**
- ✅ Retorna prompt estruturado para Claude gerar posts
- ⚠️ Não gera posts directamente — Claude gera com base no prompt retornado. Confusão de responsabilidades.

**fetch_world_context:**
- ✅ Trata graciosamente `BRAVE_API_KEY` não configurado

### 2.10 Módulo `agents` ✅

**Tools:** `get_agents`, `register_agent`, `sync_agents`, `start_session`, `end_session`, `log_message`, `get_session_context`, `list_sessions`

**start_session:**
- ✅ Cria DB record + folder local + conversation.jsonl + context.json
- ✅ Retorna paths para o orchestrator

**log_message:**
- ✅ Escreve em file + DB em paralelo
- ⚠️ Se o session folder não existir localmente (ex: outro host), só grava na DB

**get_session_context:**
- ✅ Lê do file local (mais rápido) com fallback para DB
- ✅ Formata como markdown legível

### 2.11 File Watcher (`lib/watcher.ts`) ❌

**Problema crítico:** A lógica de byte offset está incorreta.

```typescript
// O código calcula bytes linha a linha:
let byteCount = 0
for (const line of lines) {
  const lineBytes = Buffer.byteLength(line + '\n')
  if (byteCount >= prevOffset) {
    newLines.push(line)  // ← processa linha se byteCount >= prevOffset
  }
  byteCount += lineBytes
}
fileOffsets.set(filePath, stat.size)
```

O problema: `prevOffset` é inicializado com `stat.size` na primeira run. Na segunda run, `byteCount` começa em 0 e é incrementado linha a linha — nunca chega a `stat.size` enquanto não ler o ficheiro inteiro. **Resultado: processa TODAS as linhas em cada evento de mudança**, não apenas as novas.

O `upsert` com `ignoreDuplicates: true` mitiga o impacto (não cria duplicados), mas **o constraint único em `(session_id, from_agent, created_at)` não está definido na DB** (ver DB Audit). Sem o constraint, o upsert faz um insert normal → duplicados.

---

## 3. Next.js API Routes

### 3.1 `/api/entries` ⚠️

- ✅ POST cria entry com auto-embed
- ⚠️ `PATCH /api/entries/[id]` aceita qualquer body sem validação — possível injeção de campos não esperados (`project_id`, `person_id` com UUIDs inválidos, etc.)
- ⚠️ GET não tem paginação — pode retornar muitos registos se `limit` não for especificado

### 3.2 `/api/search` ✅

- ✅ GET: semântica com fallback keyword
- ✅ POST: semântica com filtros project + type
- ⚠️ Embedding via HTTP direto à edge function (hardcoded `process.env.SUPABASE_SERVICE_KEY`) — se env var não estiver set (web UI usa `config.json`), falha

### 3.3 `/api/search/answer` ❌

Stub que **não usa a edge function `rag-answer`**. Retorna uma frase formatada localmente. A edge function real (streaming RAG com citações, confidence score) nunca é chamada pela web UI.

### 3.4 `/api/config` ⚠️

- GET: retorna config (com keys masked) — sem autenticação
- POST: escreve `config.json` com novas credenciais — **sem autenticação**
- ⚠️ Qualquer pessoa com acesso à URL pode escrever novas credenciais no servidor

### 3.5 `/api/deploy` ✅

- ✅ 1-click deploy via Supabase Management API
- ✅ Auto-discover de edge functions e migrations
- ✅ Idempotente (CREATE TABLE IF NOT EXISTS, upsert functions)
- ⚠️ Skipa `001_initial.sql` (contém `\i schema.sql` que a API não suporta) — mas a lógica de skip é por nome (`!f.startsWith('001')`) não por conteúdo

### 3.6 `/api/export` ⚠️

- ✅ Suporta JSON e CSV
- ✅ Filtros por type e project
- ⚠️ `project` filter usa `q.ilike('projects.name', project)` — não funciona para joins em Supabase JS (precisa de `.eq('project:projects.name', project)` ou resolver project_id antes)

### 3.7 `/api/analytics` ✅

- ✅ Agrupa entries por dia
- ✅ Configurável por `days` param
- Simples e correto.

---

## 4. Helpers MCP (`lib/helpers.ts`)

### `resolveProjectId` ⚠️

```typescript
// Se projeto não existe, AUTO-CRIA
const { data: created } = await supabase
  .from('projects')
  .insert({ name })
  .select('id')
  .single()
```

Comportamento problemático: qualquer typo num nome de projeto cria um novo projeto "fantasma". Ex: "Project-AI-Sustem" cria um projeto novo em vez de falhar. O MCP devia retornar erro ou pedir confirmação.

### `resolvePersonId` ✅

Retorna `null` se não encontrado — **não auto-cria pessoas**. Comportamento correto.

### `embedText` ✅

Chama edge function `embed` via `supabase.functions.invoke`. Lança erro explícito se falhar.
