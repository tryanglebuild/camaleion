# Context Engine — Improvement Roadmap

> **Auditoria gerada em:** 2026-04-07  
> Prioridades baseadas na análise de ISSUES_AND_BUGS.md, BACKEND_AUDIT.md e FRONTEND_AUDIT.md.

---

## Fase 1 — Bugs Críticos (Fix Imediato)

Estes problemas causam comportamento incorreto já em produção.

### P1.1 — Corrigir SECTION_INDEX (BUG-001)

**Impacto:** Navegação interna quebrada — botões levam para sections erradas.  
**Esforço:** 5 minutos  
**Ficheiro:** `packages/web-ui/components/sections/types.ts`

```typescript
export const SECTION_INDEX = {
  DASHBOARD:  0,
  ENTRIES:    1,
  SEARCH:     2,
  PROJECTS:   3,
  COMPANIES:  4,
  PEOPLE:     5,
  CHAT:       6,
  AGENTS:     7,
  ANALYSES:   8,
  PLANS:      9,
  CONTENT:   10,
  GRAPH:     11,
  TIMELINE:  12,
  TASKS:     13,
  RULES:     14,
  SETTINGS:  15,
} as const
```

---

### P1.2 — Implementar `/api/search/answer` real (BUG-002)

**Impacto:** RAG Answer no SectionSearch é inútil — nunca chama a edge function real.  
**Esforço:** 30 minutos  
**Ficheiro:** `packages/web-ui/app/api/search/answer/route.ts`

Proxy SSE para `supabase/functions/rag-answer`. A edge function já existe e é de alta qualidade (streaming, citações, confidence score).

---

### P1.3 — Corrigir unique constraint para deduplicação do watcher (BUG-004)

**Impacto:** Watcher pode inserir mensagens duplicadas em `agent_messages`.  
**Esforço:** 10 minutos  
**Ficheiro:** Nova migration `db/migrations/008_agent_messages_unique.sql`

```sql
ALTER TABLE agent_messages
  ADD CONSTRAINT agent_messages_dedupe_unique
  UNIQUE (session_id, from_agent, created_at);
```

---

### P1.4 — Corrigir watcher de sessões (BUG-003)

**Impacto:** Watcher processa o ficheiro todo em cada evento — ineficiente e potencialmente duplica dados.  
**Esforço:** 30 minutos  
**Ficheiro:** `packages/mcp-server/src/lib/watcher.ts`

Reescrever lógica de offset para usar `Buffer.byteLength` ou `readline` incremental.

---

## Fase 2 — Qualidade de Backend (Alta Prioridade)

### P2.1 — Corrigir `query_context` na edge function `chat` (BUG-005)

**Impacto:** AI no chat fica cego ao contexto de memória — perde a funcionalidade core.  
**Esforço:** 1 hora  
**Ficheiro:** `supabase/functions/chat/index.ts`

Após `match_entries`, fazer fetch das entries completas e retornar conteúdo formatado como o MCP server faz em `search.ts::query_context`.

---

### P2.2 — Adicionar re-embed em `update_entry` no chat (BUG-006)

**Impacto:** Entries actualizadas via chat ficam com embeddings desatualizados.  
**Esforço:** 30 minutos  
**Ficheiro:** `supabase/functions/chat/index.ts`

```typescript
case "update_entry": {
  // ... update ...
  // Re-embed se content mudou
  if (input.content) {
    const newEmbedding = await getEmbedding(supabase, [entry.title, input.content].join('\n'))
    if (newEmbedding) {
      await supabase.from('embeddings').delete().eq('entry_id', id)
      await supabase.from('embeddings').insert({ entry_id: id, embedding: newEmbedding, content: ... })
    }
  }
}
```

---

### P2.3 — Corrigir `add_project` no MCP para usar upsert (BUG-007)

**Esforço:** 5 minutos  
**Ficheiro:** `packages/mcp-server/src/tools/projects.ts`

---

### P2.4 — Adicionar `update_person` ao MCP server (BUG-008)

**Impacto:** Claude Code não consegue actualizar perfis de pessoas.  
**Esforço:** 30 minutos  
**Ficheiro:** `packages/mcp-server/src/tools/people.ts` + `packages/shared/src/schemas.ts`

---

### P2.5 — Corrigir filtro de export por project (BUG-009)

**Ficheiro:** `packages/web-ui/app/api/export/route.ts`  
**Esforço:** 15 minutos

---

### P2.6 — Corrigir env vars no search e entries API routes (BUG-014)

**Ficheiros:** `app/api/search/route.ts`, `app/api/entries/route.ts`  
**Esforço:** 15 minutos  
Usar `getConfig()` em vez de `process.env` para service key.

---

## Fase 3 — DB e Integridade

### P3.1 — Adicionar index `embeddings.entry_id` (BUG-016)

```sql
CREATE INDEX IF NOT EXISTS embeddings_entry_id_idx ON embeddings(entry_id);
```

---

### P3.2 — Adicionar CHECK constraints em `agent_sessions` e `agent_messages` (BUG-013)

```sql
ALTER TABLE agent_sessions
  ADD CONSTRAINT agent_sessions_status_check
  CHECK (status IN ('active','completed','failed'));

ALTER TABLE agent_messages
  ADD CONSTRAINT agent_messages_type_check
  CHECK (type IN ('task','result','request','question','answer','context','state','error'));

ALTER TABLE agent_messages
  ADD CONSTRAINT agent_messages_verdict_check
  CHECK (verdict IS NULL OR verdict IN ('pass','fail','weak'));
```

---

### P3.3 — Adicionar UNIQUE e `updated_at` em `people` (BUG-020, BUG-021)

```sql
ALTER TABLE people ADD COLUMN IF NOT EXISTS updated_at timestamptz NOT NULL DEFAULT now();
ALTER TABLE people ADD CONSTRAINT people_name_unique UNIQUE (name);

CREATE TRIGGER people_updated_at
  BEFORE UPDATE ON people
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();
```

---

### P3.4 — Atualizar `schema.sql` para refletir estado atual

Regenerar `db/schema.sql` como snapshot do schema completo atual (depois de todas as migrations). Documentar que é read-only para referência, e que o deploy usa migrations.

---

### P3.5 — Trigger para `chat_messages.message_count` (BUG-015)

Adicionar trigger que incrementa `chat_sessions.message_count` em cada insert de `chat_messages`.

---

## Fase 4 — Melhorias de UX e Funcionalidade

### P4.1 — Auto-title para sessões de chat (BUG-022)

**Implementação:** Após a primeira resposta do AI, fazer uma chamada de 1-shot ao OpenRouter para gerar um título de 5-8 palavras a partir do primeiro par user/assistant. Guardar em `chat_sessions.title`.

---

### P4.2 — Validação de body em PATCH `/api/entries/[id]`

Adicionar validação Zod antes de passar para Supabase update:

```typescript
const AllowedUpdateSchema = z.object({
  title: z.string().optional(),
  content: z.string().optional(),
  status: EntryStatusSchema.optional(),
  tags: z.array(z.string()).optional(),
  pinned: z.boolean().optional(),
  metadata: z.record(z.unknown()).optional(),
})
const updates = AllowedUpdateSchema.parse(body)
```

---

### P4.3 — Geração de posts na web UI

Adicionar botão "Generate" em SectionGenerate que chama `generate_posts` via API route e apresenta os drafts directamente na UI, sem precisar de usar Claude manualmente.

---

### P4.4 — Zoom/pan no Knowledge Graph

Adicionar suporte a scroll para zoom e drag do canvas para pan em SectionGraph. Persistir posições dos nós em localStorage.

---

### P4.5 — `update_entry` no MCP permitir actualizar `title`

Adicionar `title` ao `UpdateEntryInputSchema` no shared package.

---

### P4.6 — Error boundaries no frontend

Envolver cada section com um `ErrorBoundary` React para prevenir crash total da app em erros não tratados.

---

### P4.7 — Extrair `TYPE_META` para shared

A definição de cores/labels por tipo de entry está duplicada em 4+ sections. Mover para `packages/shared` ou um ficheiro `constants.ts` na web UI.

---

## Fase 5 — Segurança (Se Expor Publicamente)

### P5.1 — Middleware de autenticação Next.js

Adicionar `middleware.ts` com basic auth ou token fixo para proteger todas as routes `/api/*` e `/dashboard`.

### P5.2 — Proteger `/api/config`

Requer autenticação para GET e POST. Separar GET (status) de GET (keys).

### P5.3 — CORS restrito nas edge functions

Mudar de `*` para a URL específica da web UI.

### P5.4 — Rate limiting nas edge functions

Usar Supabase Edge Function middleware ou um proxy (Cloudflare Workers) para limitar requests por IP.

---

## Resumo de Prioridades

| Fase | Items | Esforço Total Estimado | Impacto |
|------|-------|----------------------|---------|
| 1 — Bugs Críticos | 4 | ~2h | 🔴 Muito alto — funcionalidades core quebradas |
| 2 — Qualidade Backend | 6 | ~3h | 🟠 Alto — AI mal informado, dados desatualizados |
| 3 — DB e Integridade | 5 | ~1h | 🟡 Médio — dados mais consistentes |
| 4 — UX e Features | 7 | ~1 semana | 🟡 Médio — polish |
| 5 — Segurança | 4 | ~1 dia | 🔵 Baixo para uso local / Alto para exposição pública |

**Recomendação:** Fazer Fase 1 imediatamente (meia tarde). Fase 2 numa sessão de trabalho. Fases 3-4 progressivamente.
