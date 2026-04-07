# Context Engine — Frontend Audit

> **Auditoria gerada em:** 2026-04-07  
> Cobre: `packages/web-ui` — Next.js 15, App Router

---

## 1. Arquitetura Frontend

### 1.1 Estrutura de Rotas

```
/              → BootPage → redirect /dashboard
/dashboard     → DashboardPage (single-page, 16 sections)
```

### 1.2 Padrão de Navegação

O dashboard é uma **single-page app vertical** com 16 sections. Navegação via:
- Scroll wheel (com throttle de 700ms)
- LeftNav (sidebar com ícones)
- CommandPalette (⌘K)
- `onNavigateTo(sectionIndex, itemId?)` passado como prop

**Problema de SECTION_INDEX:** Ver secção 3.1 abaixo.

### 1.3 State Management

Não há state management global (sem Redux, Zustand, Context). Cada section gere o seu próprio estado com `useState`. Comunicação entre sections via:
- `initialItemId` prop (para navegar diretamente para um item)
- `onNavigateTo` callback
- Supabase Realtime subscriptions (sections individuais)

**Avaliação:** Adequado para o scope do projeto. Pode tornar-se difícil de gerir se crescer.

### 1.4 Clientes Supabase

**Browser (`lib/supabase.ts`):**
- Lê URL e anon key de `localStorage`
- Singleton com Proxy — recriado em `reloadSupabase()`
- `syncConfigFromServer()` sincroniza de `/api/config` para localStorage no boot
- ⚠️ Se localStorage está vazio, cria cliente com credenciais placeholder (`placeholder.supabase.co`) — queries vão falhar silenciosamente

**Server (`lib/supabase-server.ts`):**
- Lê de `config.json` via `getConfig()`
- Proxy que cria cliente em cada chamada — reflete config updates sem restart
- Usa service role key

---

## 2. Sections — Inventário

### 2.1 SectionDashboard (Overview) ✅

**Linhas:** ~400  
**Estado de dados:** próprio (`useState`)  
**Supabase:** reads diretos

**Pontos positivos:**
- Count-up animation elegante (`useCountUp` hook)
- System status com polling 30s
- Quick action buttons com `SECTION_INDEX` constants

**Problema:**
- ⚠️ Usa `SECTION_INDEX` para quick actions — índices incorretos (ver 3.1)

---

### 2.2 SectionEntries (Memory) ✅

**Linhas:** ~520  
**Estado:** rico — filtros, paginação, split view, bulk selection

**Pontos positivos:**
- View mode split/timeline
- Bulk actions (select all, delete, mark done)
- Inline editing de título, conteúdo, status
- DetailPanel com edição directa

**Problemas:**
- ⚠️ PATCH em `/api/entries/[id]` aceita qualquer body — sem validação no frontend antes de enviar
- ⚠️ Deleção usa Supabase client directo (browser) — bypassa a API route — não há cascade de embeddings

---

### 2.3 SectionSearch ✅ (com stub RAG)

**Linhas:** 958  
**Estado:** rico — results, history, RAG answer

**Pontos positivos:**
- Hybrid search: semântica + keyword fallback
- Score labels visuais (HIGH/MED/LOW)
- Query history em localStorage (últimas 10)
- Highlight de termos
- Debounce em input

**Problemas:**
- ❌ RAG Answer usa `/api/search/answer` (stub) em vez de edge fn `rag-answer`
- ⚠️ `SECTION_INDEX` usado para `onNavigateTo` — índices errados

---

### 2.4 SectionProjects ✅

**Linhas:** ~350  
**Funcional.** CRUD de projetos, filtros por status.

---

### 2.5 SectionCompanies ✅

**Linhas:** ~200  
**Funcional.** View agregada de projetos por empresa.

---

### 2.6 SectionPeople ✅

**Linhas:** ~300  
**Funcional.** Lista de pessoas com detalhe de entries associadas.

**Problema:**
- ⚠️ Sem formulário de edição de pessoa na web UI (só inline da nota)

---

### 2.7 SectionChat ✅

**Linhas:** 1109  
**State:** complexo — sessions, messages, streaming, tool calls

**Pontos positivos:**
- SSE streaming correto via `fetch` (não `supabase.functions.invoke` que não suporta streaming)
- Tool call visualization com expand/collapse e timing
- `buildToolSummary` — resumo compacto dos params
- ReactMarkdown com componentes customizados
- Persistência de sessões e mensagens
- Histórico de conversas

**Problemas:**
- ⚠️ Sem scroll-to-bottom automático em alguns casos edge (mensagens longas)
- ⚠️ Se `fetch` para edge function falhar, não há retry automático
- ⚠️ Session title não é gerado automaticamente (fica "New conversation")

---

### 2.8 SectionAgents ✅

**Linhas:** 1052  
**State:** complexo — agents, sessions, messages, realtime

**Pontos positivos:**
- Supabase Realtime subscription para mensagens ao vivo
- Cores por agente e tipo de mensagem
- Verdict badges (pass/fail/weak)
- CRUD de agentes
- Gestão de sessões

**Problemas:**
- ⚠️ Realtime subscription não é cleanup corretamente em todos os paths de unmount
- ⚠️ `system_prompt` mostrado no card — pode ser muito longo

---

### 2.9 SectionAnalyze ✅

**Linhas:** ~380  
**Funcional.** Lista de análises filtradas por projeto.

---

### 2.10 SectionPlan ✅

**Linhas:** ~420  
**Funcional.** Planos com tasks, progress bar segmentada, toggle de status.

---

### 2.11 SectionGenerate ⚠️

**Linhas:** ~350  
**Funcional mas incompleto.**

**Problema:**
- ⚠️ A geração de posts é explicada via "terminal flow" visual mas não há botão "Generate" na UI — o utilizador tem de usar Claude/MCP directamente

---

### 2.12 SectionGraph ✅

**Linhas:** ~520  
**Implementação:** Canvas custom (sem lib externa), force-directed

**Pontos positivos:**
- Zero dependências para o grafo
- Física funcional (repulsão + atração)
- Filtro por tipo de nó

**Problemas:**
- ⚠️ Performance pode degradar com muitos nós (>200) — sem Web Workers ou off-screen canvas
- ⚠️ Sem persistência de posições dos nós — recalcula em cada load
- ⚠️ Sem zoom/pan

---

### 2.13 SectionTimeline ✅

**Linhas:** 349  
**Funcional.** Feed cronológico agrupado por dia.

---

### 2.14 SectionTasks ⚠️

**Linhas:** ~420  
**Estado:** ❌ BUG de navegação (ver 3.1)

Funcionalidade OK — filtros, bulk actions, inline status toggle. Mas a secção está inacessível via `SECTION_INDEX.TASKS`.

---

### 2.15 SectionRules ✅

**Linhas:** ~350  
**Funcional.** CRUD de rules, toggle active, ordenação por priority.

---

### 2.16 SectionSettings ✅

**Linhas:** 382  
**Funcional.** Credenciais, deploy, health, export, theme.

**Problemas:**
- ⚠️ Mostrar (mascarado) o service key em GET `/api/config` sem autenticação
- ⚠️ Deploy steps UI não distingue bem "running" de "completed"

---

## 3. Bugs e Problemas Significativos

### 3.1 ❌ CRÍTICO — SECTION_INDEX Mismatch

**Ficheiro:** `packages/web-ui/components/sections/types.ts`

O `SECTION_INDEX` em `types.ts` não reflete a ordem actual das sections em `dashboard/page.tsx`. Quando `SectionChat` (índice 6) e `SectionAgents` (índice 7) foram adicionados, as sections seguintes foram empurradas para baixo mas o `SECTION_INDEX` não foi atualizado.

**Estado atual:**

| Constante | Valor em SECTION_INDEX | Índice Real | Section Real |
|-----------|----------------------|-------------|--------------|
| `DASHBOARD` | 0 | 0 | SectionDashboard ✅ |
| `ENTRIES` | 1 | 1 | SectionEntries ✅ |
| `SEARCH` | 2 | 2 | SectionSearch ✅ |
| `PROJECTS` | 3 | 3 | SectionProjects ✅ |
| `COMPANIES` | 4 | 4 | SectionCompanies ✅ |
| `PEOPLE` | 5 | 5 | SectionPeople ✅ |
| `TASKS` | **6** | **13** | ❌ Navega para SectionChat |
| `RULES` | **7** | **14** | ❌ Navega para SectionAgents |
| `ANALYSES` | 8 | 8 | SectionAnalyze ✅ |
| `PLANS` | 9 | 9 | SectionPlan ✅ |
| `CONTENT` | 10 | 10 | SectionGenerate ✅ |
| `GRAPH` | 11 | 11 | SectionGraph ✅ |
| `SETTINGS` | **12** | **15** | ❌ Navega para SectionTimeline |
| `TIMELINE` | **13** | **12** | ❌ Navega para SectionTimeline (inversão) |
| `CHAT` | — | 6 | ❌ Não existe em SECTION_INDEX |
| `AGENTS` | — | 7 | ❌ Não existe em SECTION_INDEX |

**Impacto:** Qualquer botão ou link que use `onNavigateTo(SECTION_INDEX.TASKS)` navega para Chat. Afeta `SectionDashboard` (quick action "Jump to Tasks"), `SectionSearch` (link para entry em Tasks), etc.

**Fix:** Atualizar `SECTION_INDEX` em `types.ts` para refletir a ordem atual.

---

### 3.2 ⚠️ Deleção de Entries sem Cascade de Embeddings

`SectionEntries` deleta via:
```typescript
await supabase.from('entries').delete().eq('id', id)
```

A tabela `embeddings` tem `ON DELETE CASCADE` — por isso os embeddings são apagados automaticamente pela DB. ✅ Não é bug, é correto.

Mas `SectionAnalyze` faz:
```typescript
await supabase.from('embeddings').delete().eq('entry_id', id)
await supabase.from('entries').delete().eq('id', id)
```
Duplo delete desnecessário — mas inofensivo.

---

### 3.3 ⚠️ Client Supabase com Credenciais Placeholder

Se o utilizador abre a app pela primeira vez sem `localStorage` configurado, o cliente Supabase usa:
```typescript
createClient('https://placeholder.supabase.co', 'placeholder')
```

As queries vão falhar com erros de rede. O `syncConfigFromServer()` é chamado no boot mas é assíncrono — há uma janela onde o cliente está placeholder e queries já estão a ser feitas.

---

### 3.4 ⚠️ Inconsistência Supabase Direct vs API Routes

Algumas sections leem dados directamente do Supabase browser client (ex: SectionGraph, SectionTimeline), outras usam API routes (ex: SectionSearch, SectionEntries para write ops). Esta mistura:
- Requer que o anon key tenha permissões suficientes (RLS allow_all satisfaz)
- Torna difícil centralizar lógica (ex: auth futura)
- Cria duplicação de código entre client queries e server queries

---

### 3.5 ⚠️ Sem Error Boundaries

Nenhuma section tem `ErrorBoundary`. Se uma section lançar uma exceção não tratada (ex: Supabase retorna formato inesperado), a app crasha totalmente.

---

### 3.6 ⚠️ Inconsistência de Marca

- `app/layout.tsx`: `title: 'Camaleon'`
- MCP Server: `name: 'context-engine'`
- CLI packages: `camaleon-mcp`, `camaleon-web`
- README: "Context Engine"
- Boot page: usa `ChameleonLogo`
- Health check: procura manifest em `~/.camaleon/mcp.json`

O produto tem dois nomes em uso simultâneo: "Context Engine" (nome técnico) e "Camaleon/Chameleon" (nome de marca). Cria confusão.

---

## 4. Padrões de Código

### Bons Padrões Identificados

- `useCallback` com dependências corretas na maioria dos casos
- `useEffect` cleanup (removers de event listeners)
- Types TypeScript explícitos (interfaces por section)
- Framer Motion com `AnimatePresence` correto
- `ReactMarkdown` com componentes customizados

### Padrões a Melhorar

- **Duplicação de `TYPE_META`** — definida em SectionSearch, SectionDashboard, SectionTimeline, SectionEntries com ligeiras variações. Devia estar em `shared` ou num ficheiro utilitário.
- **Inline styles** usados extensivamente em vez de CSS modules ou classes — dificulta theming e manutenção
- **Sem testes** — zero ficheiros de teste no frontend
- **`// eslint-disable-next-line`** presente em vários locais
