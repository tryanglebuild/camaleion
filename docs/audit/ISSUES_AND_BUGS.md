# Context Engine — Issues & Bugs

> **Auditoria gerada em:** 2026-04-07  
> Problemas encontrados durante análise completa do código-fonte.

---

## Legenda

| Severidade | Critério |
|-----------|---------|
| 🔴 CRÍTICO | Comportamento incorreto que afeta funcionalidade core |
| 🟠 ALTO | Funcionalidade incorreta ou dados inconsistentes |
| 🟡 MÉDIO | Degradação de qualidade, performance, ou UX |
| 🔵 BAIXO | Melhoria de código, inconsistência menor |

---

## 🔴 CRÍTICOS

### BUG-001 — SECTION_INDEX desatualizado: navegação interna quebrada

**Ficheiro:** `packages/web-ui/components/sections/types.ts`  
**Impacto:** Todos os links de navegação interna que usam `SECTION_INDEX` navegam para a section errada.

**Causa:** `SectionChat` (índice 6) e `SectionAgents` (índice 7) foram inseridos no meio do array de sections, empurrando Tasks, Rules, Settings, Timeline para índices mais altos. O `SECTION_INDEX` não foi atualizado.

**Mapeamento errado:**
```
SECTION_INDEX.TASKS    = 6  →  real: 13  →  navega para CHAT
SECTION_INDEX.RULES    = 7  →  real: 14  →  navega para AGENTS
SECTION_INDEX.SETTINGS = 12 →  real: 15  →  navega para TIMELINE
SECTION_INDEX.TIMELINE = 13 →  real: 12  →  inversão com Settings
CHAT   = ausente             →  real: 6
AGENTS = ausente             →  real: 7
```

**Fix:**
```typescript
// types.ts — ordem correta
export const SECTION_INDEX = {
  DASHBOARD:  0,
  ENTRIES:    1,
  SEARCH:     2,
  PROJECTS:   3,
  COMPANIES:  4,
  PEOPLE:     5,
  CHAT:       6,   // ← adicionado
  AGENTS:     7,   // ← adicionado
  ANALYSES:   8,
  PLANS:      9,
  CONTENT:   10,
  GRAPH:     11,
  TIMELINE:  12,   // ← corrigido
  TASKS:     13,   // ← corrigido
  RULES:     14,   // ← corrigido
  SETTINGS:  15,   // ← corrigido
} as const
```

---

### BUG-002 — `/api/search/answer` é um stub: RAG answer nunca acontece

**Ficheiro:** `packages/web-ui/app/api/search/answer/route.ts`  
**Impacto:** A "RAG Answer" no SectionSearch não usa a edge function `rag-answer` — retorna uma frase genérica sem conteúdo útil.

**Causa:** A route foi criada como placeholder e nunca foi ligada à edge function real.

**Comportamento atual:**
```typescript
// Stub — apenas formata um texto genérico
const answer = `Found ${results.length} relevant entries for "${query}". Top results include: ${titles}...`
```

**Comportamento esperado:** Proxy para `supabase/functions/rag-answer` com streaming SSE.

**Fix:** Implementar proxy SSE para a edge function:
```typescript
const ragUrl = `${process.env.SUPABASE_URL}/functions/v1/rag-answer`
const orRes = await fetch(ragUrl, {
  method: 'POST',
  headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${process.env.SUPABASE_SERVICE_KEY}` },
  body: JSON.stringify({ query, results }),
})
return new Response(orRes.body, { headers: { 'Content-Type': 'text/event-stream', ...CORS } })
```

---

### BUG-003 — Watcher de sessões processa todas as linhas em cada mudança

**Ficheiro:** `packages/mcp-server/src/lib/watcher.ts`  
**Impacto:** Em vez de processar apenas novas linhas, o watcher processa o ficheiro inteiro em cada evento `change`.

**Causa:** A lógica compara `byteCount >= prevOffset` onde `prevOffset` é inicializado com `stat.size`. O `byteCount` é calculado somando bytes linha a linha a partir de 0 — nunca atinge `stat.size` antes de percorrer o ficheiro todo. Resultado: `newLines` contém sempre todas as linhas.

**Consequência:** O `upsert` com `ignoreDuplicates: true` é chamado para cada linha existente em cada evento. Performance degradada + risco de duplicados.

**Fix:**
```typescript
// Usar readline ou slice direto por bytes:
const raw = readFileSync(filePath, { encoding: 'utf-8' })
const newContent = raw.slice(prevOffset)  // slice por bytes (ou caracteres UTF-8)
const newLines = newContent.split('\n').filter(Boolean)
fileOffsets.set(filePath, raw.length)
```

---

### BUG-004 — Unique constraint ausente para deduplicação do watcher

**Ficheiro:** `db/migrations/006_agents.sql`  
**Impacto:** O watcher usa `upsert({ onConflict: 'session_id,from_agent,created_at' })` mas esse unique constraint não existe na tabela `agent_messages`.

**Resultado:** O upsert não deduplica — insere duplicados silenciosamente (ou lança erro, dependendo da versão do Supabase).

**Fix na migration:**
```sql
ALTER TABLE agent_messages
  ADD CONSTRAINT agent_messages_session_from_ts_unique
  UNIQUE (session_id, from_agent, created_at);
```

---

## 🟠 ALTOS

### BUG-005 — `query_context` na edge function `chat` retorna IDs sem conteúdo

**Ficheiro:** `supabase/functions/chat/index.ts`  
**Impacto:** Quando o AI usa `query_context` no chat, recebe apenas `[{ entry_id, score }]` sem títulos, conteúdo ou metadata — contexto praticamente inútil.

**Causa:** A implementação faz apenas `supabase.rpc('match_entries', ...)` sem fetch das entries completas.

**Fix:** Após o RPC, fazer fetch das entries por id (como faz o MCP server `search.ts`).

---

### BUG-006 — `update_entry` na edge function `chat` não re-embeds

**Ficheiro:** `supabase/functions/chat/index.ts`  
**Impacto:** Quando o AI actualiza o conteúdo de uma entry via chat, o embedding fica com o conteúdo antigo — RAG retorna dados desatualizados.

**Fix:** Após update, apagar embedding antigo e criar novo (como faz o MCP server `entries.ts`).

---

### BUG-007 — `add_project` no MCP usa `insert` simples: falha em duplicados

**Ficheiro:** `packages/mcp-server/src/tools/projects.ts`  
**Impacto:** Chamar `add_project` com um nome de projeto existente lança erro de FK/unique constraint.

**Fix:**
```typescript
// Usar upsert com onConflict: 'name'
await supabase.from('projects').upsert({ name, ... }, { onConflict: 'name' })
```

---

### BUG-008 — `update_person` ausente no MCP server

**Ficheiro:** `packages/mcp-server/src/tools/people.ts`  
**Impacto:** Não é possível actualizar perfis de pessoas via MCP (e portanto via Claude Code). Só via chat ou web UI.

**Fix:** Adicionar tool `update_person` ao módulo people do MCP server (implementação existe na edge function chat).

---

### BUG-009 — `/api/export` filtro por project não funciona

**Ficheiro:** `packages/web-ui/app/api/export/route.ts`  
**Impacto:** O parâmetro `?project=name` não filtra corretamente.

**Causa:**
```typescript
if (project) q = q.ilike('projects.name', project)
// ↑ Não funciona — join foreign table não é filtrado assim no Supabase JS
```

**Fix:** Resolver `project_id` antes e filtrar por ID:
```typescript
if (project) {
  const { data: proj } = await supabaseAdmin.from('projects').select('id').ilike('name', project).single()
  if (proj) q = q.eq('project_id', proj.id)
}
```

---

### BUG-010 — Embedding fire-and-forget sem retry: entries sem RAG

**Ficheiro:** `supabase/functions/chat/index.ts` (e MCP `entries.ts`)  
**Impacto:** Se o embedding falhar (edge function `embed` timeout, etc.), a entry é criada mas nunca aparece em search_memory ou query_context.

**Na edge function `chat`:** Totalmente silencioso — sem log, sem retorno de erro ao AI.  
**No MCP server:** Lança exceção que o MCP captura e retorna ao AI — mas a entry já foi criada.

**Fix:** Adicionar retry com exponential backoff, ou pelo menos logar o erro para que o AI saiba.

---

## 🟡 MÉDIOS

### BUG-011 — `schema.sql` desatualizado

**Ficheiro:** `db/schema.sql`  
**Impacto:** Quem usar `schema.sql` diretamente para setup manual terá um schema incompleto — sem `rules`, `generation_profiles`, `agents`, `agent_sessions`, `agent_messages`, `chat_sessions`, `chat_messages`, sem `pinned`, sem extensão de `entries.type`.

**Fix:** Regenerar `schema.sql` a partir do schema atual completo, ou documentar claramente que deve usar as migrations.

---

### BUG-012 — `resolveProjectId` auto-cria projetos com typos

**Ficheiro:** `packages/mcp-server/src/lib/helpers.ts`  
**Impacto:** Qualquer typo num nome de projeto (ex: "project-ai-sustem") cria um novo projeto fantasma em vez de falhar com erro.

**Fix:** Retornar `null` se projeto não existe (como faz `resolvePersonId`), ou perguntar ao AI para confirmar criação.

---

### BUG-013 — `agent_sessions.status` sem CHECK constraint

**Ficheiro:** `db/migrations/006_agents.sql`  
**Impacto:** Qualquer string pode ser inserida em `status` — sem validação a nível de DB.

**Fix:**
```sql
ALTER TABLE agent_sessions
  ADD CONSTRAINT agent_sessions_status_check
  CHECK (status IN ('active', 'completed', 'failed'));
```

---

### BUG-014 — Env vars ausentes causam fallback silencioso no search

**Ficheiros:** `packages/web-ui/app/api/search/route.ts`, `packages/web-ui/app/api/entries/route.ts`  
**Impacto:** Se `process.env.SUPABASE_SERVICE_KEY` não estiver definido (a web UI usa `config.json`), o fetch para `embed` falha e o search cai para keyword sem qualquer aviso ao utilizador.

**Fix:** Ler service key de `getConfig()` em vez de `process.env`:
```typescript
const { supabaseUrl, supabaseServiceKey } = getConfig()
const EMBED_URL = `${supabaseUrl}/functions/v1/embed`
```

---

### BUG-015 — `chat_messages.message_count` não é atualizado automaticamente

**Ficheiro:** `db/migrations/007_chat.sql`  
**Impacto:** `message_count` em `chat_sessions` fica sempre em 0 a não ser que o código o atualize manualmente — não há trigger para isso.

**Fix:** Adicionar trigger:
```sql
CREATE OR REPLACE FUNCTION increment_message_count()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
  UPDATE chat_sessions SET message_count = message_count + 1 WHERE id = NEW.session_id;
  RETURN NEW;
END;
$$;

CREATE TRIGGER chat_messages_count
  AFTER INSERT ON chat_messages
  FOR EACH ROW EXECUTE FUNCTION increment_message_count();
```

---

### BUG-016 — Sem índice em `embeddings.entry_id`

**Ficheiro:** `db/schema.sql` / migrations  
**Impacto:** JOINs entre `embeddings` e `entries` fazem seq scan — degradação de performance com crescimento.

**Fix:**
```sql
CREATE INDEX IF NOT EXISTS embeddings_entry_id_idx ON embeddings(entry_id);
```

---

## 🔵 BAIXOS

### BUG-017 — Inconsistência de marca: "Camaleon" vs "Context Engine"

O produto usa dois nomes simultaneamente. `app/layout.tsx` tem `title: 'Camaleon'`, o MCP server chama-se `context-engine`, o README diz "Context Engine".

---

### BUG-018 — `SectionAnalyze` faz duplo delete desnecessário

```typescript
await supabase.from('embeddings').delete().eq('entry_id', id)
await supabase.from('entries').delete().eq('id', id)
```

`ON DELETE CASCADE` já apaga os embeddings quando a entry é apagada. O primeiro delete é desnecessário (mas inofensivo).

---

### BUG-019 — `update_entry` no MCP não permite actualizar `title`

**Ficheiro:** `packages/mcp-server/src/tools/entries.ts`  
`UpdateEntryInputSchema` não inclui `title` como campo actualizável. O AI não pode renomear entries via MCP.

---

### BUG-020 — Sem `updated_at` em `people`

A tabela `people` não tem `updated_at` nem trigger para o manter. Não é possível saber quando foi a última atualização de um perfil.

---

### BUG-021 — Sem UNIQUE em `people.name`

Permite criar múltiplas pessoas com o mesmo nome — duplicados inevitáveis.

---

### BUG-022 — Session title de chat fica "New conversation" indefinidamente

`SectionChat` não gera título automático para as conversas. Fica o default "New conversation" para sempre — dificulta gestão de histórico.
