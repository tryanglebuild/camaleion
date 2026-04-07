# Context Engine — Security Audit

> **Auditoria gerada em:** 2026-04-07  
> **Âmbito:** Uso pessoal / local. Não é um produto multi-tenant.

---

## Contexto de Risco

O sistema é desenhado para uso **pessoal, single-user, local**. Não tem multi-tenancy, não tem utilizadores registados, não tem exposição pública prevista. Este contexto reduz o risco real de vários problemas encontrados — mas devem ser documentados para o caso de o sistema ser exposto publicamente.

---

## 1. Autenticação e Autorização

### 1.1 Ausência Total de Autenticação ❌

Não existe nenhum mecanismo de autenticação:
- Sem login / session management
- Sem Supabase Auth (não configurado)
- Sem JWT validation nas edge functions (`verify_jwt: false`)
- Sem middleware de auth no Next.js

**Impacto (se exposto publicamente):** Qualquer pessoa com URL pode:
- Ler toda a memória
- Escrever entries falsas
- Apagar dados
- Obter (masked) credenciais

**Para uso local (localhost):** Risco aceitável.

### 1.2 RLS Allow-All ❌

Todas as tabelas têm RLS activo mas com políticas universais:

```sql
create policy "allow_all_entries" on entries
  for all to anon, authenticated using (true) with check (true);
```

A anon key (chave pública) permite leitura e escrita em qualquer linha de qualquer tabela.

**Nota positiva:** RLS está ativo — é fácil adicionar políticas restritas sem mudar o código aplicacional.

---

## 2. Gestão de Credenciais

### 2.1 `config.json` com Service Role Key no Disco ⚠️

O ficheiro `packages/web-ui/config.json` guarda:
- `supabaseAnonKey`
- `supabaseServiceKey` (service role — acesso total à DB)
- `supabaseAccessToken` (Personal Access Token do Supabase)
- `openrouterKey`

**Localização:** No diretório de trabalho da web UI — ficheiro de texto simples.

**Problemas:**
- Service role key no disco em plaintext
- `config.json` está em `.gitignore` → não é commitado. ✅
- Mas se o servidor web for comprometido, todas as chaves são expostas

### 2.2 API `/api/config` sem Autenticação ❌

```
GET  /api/config  → retorna keys (masked mas URL visível)
POST /api/config  → escreve novas credenciais no disco
```

Sem qualquer autenticação. Num servidor exposto, qualquer request HTTP pode sobrescrever as credenciais.

**Mitigação:** A masked key tem `slice(0,20) + '…'` — chaves completas não são retornadas. Mas a URL existe e pode ser chamada para inspecção.

### 2.3 Env Vars vs config.json — Inconsistência ⚠️

O MCP server usa env vars (`SUPABASE_URL`, `SUPABASE_SERVICE_KEY`). A web UI usa `config.json`. O `/api/search` e `/api/entries` leem `process.env.SUPABASE_URL` e `process.env.SUPABASE_SERVICE_KEY` diretamente:

```typescript
// /api/search/route.ts
Authorization: `Bearer ${process.env.SUPABASE_SERVICE_KEY}`
```

Se estas env vars não estiverem definidas (a web UI usa `config.json`, não env vars por defeito), estas chamadas falham silenciosamente e o search cai para keyword.

---

## 3. Edge Functions

### 3.1 CORS `*` em Todas as Edge Functions ⚠️

```typescript
"Access-Control-Allow-Origin": "*"
```

Todas as edge functions aceitam pedidos de qualquer origem. Num contexto de browser:
- Qualquer página web maliciosa pode chamar as edge functions
- Sem protection contra CSRF via CORS (CORS `*` com credenciais é mais complexo)

**Para uso local:** Anon key é necessária — protege acidentalmente.

### 3.2 `verify_jwt: false` nas Edge Functions ⚠️

```json
{ "verify_jwt": false }
```

Deploy metadata desativa JWT verification. Qualquer request sem token é aceite.

**Impacto:** A URL pública da edge function (`https://{ref}.supabase.co/functions/v1/chat`) pode ser chamada por qualquer pessoa que conheça a URL e a anon key (ambas visíveis no browser DevTools se a app estiver exposta).

### 3.3 OpenRouter API Key em Edge Function ⚠️

`OPENROUTER_API_KEY` é lida de `Deno.env.get()` — stored como Supabase secret. Correto.

Mas sem rate limiting, um atacante pode chamar o endpoint `chat` repetidamente e esgotar os créditos OpenRouter.

---

## 4. Next.js API Routes

### 4.1 `/api/entries/[id]` PATCH sem Validação ⚠️

```typescript
const body = await req.json()
await supabaseAdmin.from('entries').update(body).eq('id', id)
```

O body do request é passado directamente para o Supabase update. Um atacante pode:
- Alterar `project_id` para um UUID arbitrário
- Alterar `person_id`
- Injetar campos não esperados (podem ser ignorados pelo Supabase ou causar erros)
- Alterar `created_at` / `updated_at`

Não é injection de SQL (Supabase usa prepared statements), mas é uma surface de modificação não controlada.

### 4.2 `/api/deploy` — Executa Código SQL no Servidor ⚠️

```typescript
// Lê ficheiros .sql do disco e executa via Management API
const sql = fs.readFileSync(fullPath, 'utf-8')
await runSQL(ref, supabaseAccessToken, sql, ...)
```

Se alguém conseguir modificar os ficheiros `.sql` antes do deploy, pode executar SQL arbitrário no Supabase. Para um ambiente local controlado, é aceitável.

### 4.3 Path Traversal em `/api/deploy` ⚠️

```typescript
const functionsDir = path.join(REPO_ROOT, 'supabase', 'functions')
// REPO_ROOT = path.join(process.cwd(), '..', '..')
```

`REPO_ROOT` usa `process.cwd()` com `../..`. Se o server for iniciado de um diretório inesperado, pode referenciar paths incorretos. Sem validação de que o path está dentro dos limites esperados.

---

## 5. Informação Sensível no Browser

### 5.1 Anon Key em localStorage ⚠️

A anon key é armazenada em `localStorage`:
```typescript
localStorage.setItem(CONFIG_KEY, JSON.stringify({ supabaseUrl, supabaseAnonKey }))
```

A anon key é semi-pública (pode ser usada com RLS), mas:
- Está visível em DevTools
- Persiste indefinidamente
- Se a app for exposta com RLS allow_all, a anon key é suficiente para acesso total

### 5.2 Service Key Nunca vai ao Browser ✅

O `supabaseServiceKey` é guardado em `config.json` no servidor e lido em server-side API routes. Nunca é enviado ao browser. O GET `/api/config` mascara com `slice(0,20) + '…'`.

---

## 6. Resumo de Riscos

| # | Risco | Severidade | Contexto |
|---|-------|-----------|---------|
| 1 | Sem autenticação — qualquer request tem acesso total | CRÍTICO | Público |
| 2 | `/api/config` POST sem auth — pode sobrescrever credenciais | ALTO | Público |
| 3 | RLS allow_all — anon key dá acesso total a todos os dados | ALTO | Público |
| 4 | `config.json` com service key em plaintext | MÉDIO | Local |
| 5 | Edge functions sem auth (verify_jwt: false) | MÉDIO | Público |
| 6 | CORS `*` em todas as edge functions | MÉDIO | Público |
| 7 | PATCH `/api/entries/[id]` aceita body arbitrário | MÉDIO | Público |
| 8 | Sem rate limiting em nenhum endpoint | MÉDIO | Público |
| 9 | env vars ausentes causa fallback silencioso no search | BAIXO | Local |
| 10 | `/api/deploy` executa SQL do disco sem validação | BAIXO | Local |

---

## 7. Recomendações por Prioridade

### Para uso local (situação atual) — OK
- Os riscos 1-8 são aceitáveis num localhost sem exposição pública
- `config.json` está em `.gitignore` — não vaza para repositório
- Anon key em localStorage é razoável

### Se for expor publicamente

**Mínimo indispensável:**
1. Adicionar middleware Next.js com basic auth ou token fixo
2. Adicionar env var `ALLOWED_ORIGIN` e validar no middleware
3. Adicionar RLS policies que filtrem por user ID (depois de adicionar Supabase Auth)
4. Proteger `/api/config` com o mesmo middleware

**Boa prática:**
5. Mover credenciais de `config.json` para env vars (`.env.local`)
6. Adicionar rate limiting nas edge functions (ex: via Supabase Edge Function middleware)
7. Validar body em PATCH `/api/entries/[id]` com Zod
