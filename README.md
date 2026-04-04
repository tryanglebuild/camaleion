<div align="center">

```
  ██████╗ █████╗ ███╗   ███╗ █████╗ ██╗     ███████╗ ██████╗ ███╗   ██╗
 ██╔════╝██╔══██╗████╗ ████║██╔══██╗██║     ██╔════╝██╔═══██╗████╗  ██║
 ██║     ███████║██╔████╔██║███████║██║     █████╗  ██║   ██║██╔██╗ ██║
 ██║     ██╔══██║██║╚██╔╝██║██╔══██║██║     ██╔══╝  ██║   ██║██║╚██╗██║
 ╚██████╗██║  ██║██║ ╚═╝ ██║██║  ██║███████╗███████╗╚██████╔╝██║ ╚████║
  ╚═════╝╚═╝  ╚═╝╚═╝     ╚═╝╚═╝  ╚═╝╚══════╝╚══════╝ ╚═════╝ ╚═╝  ╚═══╝
```

# Context Engine

**Persistent memory and multi-agent orchestration for AI assistants.**

Give Claude Code and Claude Desktop a real second brain — semantic search, structured memory, behavior rules, and autonomous agent workflows — all backed by Supabase and visible in a live dashboard.

[![MCP Server](https://img.shields.io/badge/MCP_Server-v2.0.0-blue?style=flat-square)](https://modelcontextprotocol.io)
[![Node.js](https://img.shields.io/badge/Node.js-%3E%3D20-green?style=flat-square)](https://nodejs.org)
[![Next.js](https://img.shields.io/badge/Next.js-16.2-black?style=flat-square)](https://nextjs.org)
[![Supabase](https://img.shields.io/badge/Supabase-pgvector-3FCF8E?style=flat-square)](https://supabase.com)
[![License](https://img.shields.io/badge/License-MIT-yellow?style=flat-square)](LICENSE)

</div>

---

## What Is This?

Context Engine is a **persistent memory system** for AI assistants built on the [Model Context Protocol (MCP)](https://modelcontextprotocol.io). It gives Claude Code and Claude Desktop:

- 📝 **Structured memory** — tasks, notes, decisions, ideas, meetings, logs
- 🔍 **Semantic search (RAG)** — find anything by meaning, not just keyword
- 🧠 **Behavior rules** — define how the AI acts on every session, stored in a database
- 📊 **Project & people tracking** — link memory to context entities
- 🤖 **Multi-agent orchestration** — run parallel agent sessions with full audit trails
- 🌐 **Web dashboard** — view, edit, and manage everything in a live UI

> The CLI AI (Claude Code / Copilot) is the reasoning engine.  
> MCP tools are the write interface.  
> Supabase is the single source of truth.  
> The web app is the read/manage surface.

---

## Table of Contents

- [Architecture](#architecture)
- [Monorepo Structure](#monorepo-structure)
- [Prerequisites](#prerequisites)
- [Installation](#installation)
  - [1. Supabase Setup](#1-supabase-setup)
  - [2. Clone & Install](#2-clone--install)
  - [3. Environment Variables](#3-environment-variables)
  - [4. Run Migrations](#4-run-migrations)
  - [5. Start Development](#5-start-development)
- [Using the CLI Installers (npm)](#using-the-cli-installers-npm)
  - [camaleon-mcp — Install MCP Server](#camaleon-mcp--install-mcp-server)
  - [camaleon-web — Install Web UI](#camaleon-web--install-web-ui)
- [MCP Tools Reference](#mcp-tools-reference)
  - [Memory (Entries)](#memory-entries)
  - [Search & Context](#search--context)
  - [Projects](#projects)
  - [People](#people)
  - [Rules Engine](#rules-engine)
  - [Analysis](#analysis)
  - [Planning](#planning)
  - [Generation](#generation)
  - [Agents & Sessions](#agents--sessions)
- [Web Dashboard](#web-dashboard)
- [Database Schema](#database-schema)
- [Multi-Agent System](#multi-agent-system)
- [Tech Stack](#tech-stack)
- [Development](#development)

---

## Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                     AI Assistants                           │
│          Claude Code  ·  Claude Desktop  ·  Copilot CLI     │
└───────────────────────────┬─────────────────────────────────┘
                            │  stdio (MCP protocol)
                            ▼
┌─────────────────────────────────────────────────────────────┐
│                   MCP Server v2.0.0                         │
│   ┌──────────┐ ┌────────┐ ┌───────┐ ┌──────────┐ ┌──────┐  │
│   │ Entries  │ │ Search │ │ Rules │ │ Planning │ │Agents│  │
│   │ Projects │ │  RAG   │ │ Anal. │ │  Gener.  │ │ Sess.│  │
│   └──────────┘ └────────┘ └───────┘ └──────────┘ └──────┘  │
│                    9 tool groups · 35+ tools                │
└───────────────────────────┬─────────────────────────────────┘
                            │  REST + Realtime
                            ▼
┌─────────────────────────────────────────────────────────────┐
│                      Supabase                               │
│   PostgreSQL · pgvector · Edge Functions · Storage          │
│   gte-small embeddings (384 dims)                          │
└───────────────────────────┬─────────────────────────────────┘
                            │  API
                            ▼
┌─────────────────────────────────────────────────────────────┐
│                  Web Dashboard (Next.js)                    │
│   15 sections · 3D visualizations · Real-time UI           │
└─────────────────────────────────────────────────────────────┘
```

---

## Monorepo Structure

```
context-engine/
├── packages/
│   ├── mcp-server/          # MCP server (Node.js + TypeScript)
│   │   ├── src/
│   │   │   ├── index.ts     # Entry point, registers all tool groups
│   │   │   ├── tools/       # 9 tool group modules
│   │   │   │   ├── entries.ts
│   │   │   │   ├── search.ts
│   │   │   │   ├── projects.ts
│   │   │   │   ├── people.ts
│   │   │   │   ├── rules.ts
│   │   │   │   ├── analysis.ts
│   │   │   │   ├── planning.ts
│   │   │   │   ├── generation.ts
│   │   │   │   └── agents.ts
│   │   │   └── lib/
│   │   │       ├── supabase.ts   # Supabase client
│   │   │       ├── helpers.ts    # embedText(), resolveProjectId()
│   │   │       └── watcher.ts    # File watcher → DB sync
│   │   └── __tests__/
│   │
│   ├── web-ui/              # Next.js 16 dashboard
│   │   ├── app/
│   │   │   ├── dashboard/   # 15 dashboard sections
│   │   │   ├── api/         # REST API routes
│   │   │   └── globals.css  # Design system (CSS custom properties)
│   │   └── components/
│   │       ├── sections/    # 15 section components
│   │       ├── dashboard/   # Nav, modals, cards
│   │       └── 3d/          # Three.js visualizations
│   │
│   ├── cli-mcp/             # npm: camaleon-mcp (MCP installer CLI)
│   ├── cli-web/             # npm: camaleon-web (Web UI installer CLI)
│   └── shared/              # Shared TypeScript types & Zod schemas
│
├── db/
│   ├── schema.sql           # Full database schema
│   └── migrations/          # Incremental SQL migrations (001–005)
│
├── supabase/
│   └── functions/           # Edge functions (embed, rag-answer)
│
├── docs/                    # Architecture docs (v1, v2, v3, design)
├── .env.example
├── package.json             # pnpm workspace root
└── pnpm-workspace.yaml
```

---

## Prerequisites

| Tool | Version | Notes |
|------|---------|-------|
| Node.js | ≥ 20 | Required |
| pnpm | ≥ 9 | `npm i -g pnpm` |
| Supabase account | — | [supabase.com](https://supabase.com) (free tier works) |

---

## Installation

### 1. Supabase Setup

1. Create a new project at [supabase.com](https://supabase.com)
2. Enable the **pgvector** extension:
   ```sql
   create extension if not exists vector;
   ```
3. Deploy the **embed** edge function (for generating embeddings):
   - Found in `supabase/functions/`
   - Uses the `gte-small` model (384 dimensions)
4. Note your project's **URL**, **Anon Key**, and **Service Role Key**

---

### 2. Clone & Install

```bash
git clone https://github.com/your-org/context-engine.git
cd context-engine
pnpm install
```

---

### 3. Environment Variables

Copy the example and fill in your values:

```bash
cp .env.example .env
```

```env
# Supabase — required for MCP server and web UI
SUPABASE_URL=https://xxxx.supabase.co
SUPABASE_ANON_KEY=eyJ...
SUPABASE_SERVICE_KEY=eyJ...         # Service role key (MCP server only)

# Web UI public vars
NEXT_PUBLIC_SUPABASE_URL=https://xxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJ...

# Optional — for web search in generation tools
BRAVE_API_KEY=BSA...
```

---

### 4. Run Migrations

Apply the database migrations to your Supabase project via the SQL editor or CLI:

```bash
# Apply all migrations in order
psql $DATABASE_URL -f db/migrations/001_initial.sql
psql $DATABASE_URL -f db/migrations/002_update_tasks.sql
psql $DATABASE_URL -f db/migrations/003_v2.sql
psql $DATABASE_URL -f db/migrations/004_second_brain_rules.sql
psql $DATABASE_URL -f db/migrations/005_agents.sql
```

Or use the full schema directly:

```bash
psql $DATABASE_URL -f db/schema.sql
```

---

### 5. Start Development

**Start everything (MCP server + web UI):**

```bash
pnpm dev
```

**Start individually:**

```bash
# MCP server only
pnpm --filter camaleon-mcp-server dev

# Web UI only
pnpm --filter @context-engine/web-ui dev
```

**Web UI** will be available at `http://localhost:3000`

---

### 6. Connect to Claude

Add the MCP server to your Claude config:

**Claude Code** — `~/.claude/mcp.json`:

```json
{
  "mcpServers": {
    "context-engine": {
      "command": "node",
      "args": ["/path/to/context-engine/packages/mcp-server/dist/index.js"],
      "env": {
        "SUPABASE_URL": "https://xxxx.supabase.co",
        "SUPABASE_ANON_KEY": "eyJ...",
        "SUPABASE_SERVICE_KEY": "eyJ..."
      }
    }
  }
}
```

**Claude Desktop** — `~/Library/Application Support/Claude/claude_desktop_config.json` (macOS)

---

## Using the CLI Installers (npm)

For end users, two CLI tools handle installation without needing to clone the repo.

### `camaleon-mcp` — Install MCP Server

```bash
npx camaleon-mcp install
```

Interactive guided setup:
1. Enter your **Supabase URL**, **Anon Key**, **Service Role Key**
2. Optionally enter your **Brave Search API Key** (for web context generation)
3. The CLI downloads, builds, and installs the MCP server
4. Outputs the exact JSON block to paste into your Claude config

```bash
# Commands
camaleon-mcp install    # First-time setup
camaleon-mcp update     # Update to latest version
camaleon-mcp config     # Reconfigure credentials
camaleon-mcp status     # Check if server is installed and running
```

---

### `camaleon-web` — Install Web UI

```bash
npx camaleon-web install
```

1. Downloads the latest release from GitHub
2. Extracts to `~/.camaleon/web/`
3. Installs as a system service (auto-start on boot)
4. Starts the web UI at `http://localhost:3000`

```bash
# Commands
camaleon-web install    # First-time install
camaleon-web start      # Start the web service
camaleon-web stop       # Stop the web service
camaleon-web status     # Check service status
camaleon-web update     # Update to latest version
```

---

## MCP Tools Reference

The MCP server exposes **35+ tools** across 9 groups. At session start, Claude automatically calls `get_rules()` + `query_context()` to load rules and reconstruct context.

---

### Memory (Entries)

The central memory store. Supports polymorphic types: `task · note · decision · meet · idea · log · analysis · plan · post · file`

| Tool | Description |
|------|-------------|
| `add_entry` | Create a memory entry. Auto-embeds content for RAG. Accepts: `type`, `title`, `content`, `status`, `project`, `tags`, `metadata` |
| `get_entries` | List entries with filters: `type`, `project`, `tags`, `status`, `since`. Max 100 results, ordered newest first |
| `update_entry` | Update entry. Re-embeds automatically if content changes. Accepts: `status`, `content`, `tags`, `metadata` |

**Entry types:**

| Type | Use Case |
|------|----------|
| `task` | Work items with `pending / in_progress / done / blocked` status |
| `note` | Freeform notes or knowledge snippets |
| `decision` | Architectural or product decisions |
| `meet` | Meeting notes |
| `idea` | Ideas to explore |
| `log` | Activity logs and change records |

---

### Search & Context

| Tool | Description |
|------|-------------|
| `search_memory` | Semantic vector search via cosine similarity. Embeds the query → calls `match_entries()` RPC. Returns results with relevance scores. Max 20 |
| `query_context` | **Session-start tool.** Fetches active rules + top 5 relevant memories. Returns formatted markdown injected into Claude's context |

> **Tip:** Call `query_context()` at the start of every session to reconstruct relevant context automatically.

---

### Projects

| Tool | Description |
|------|-------------|
| `add_project` | Register a project: name (unique), company, stack array, description, status |
| `get_projects` | List projects, optionally filtered by `status` (active / paused / done) |
| `get_companies` | Get distinct company names across all projects |
| `get_projects_by_company` | Get all projects for a specific company |

---

### People

| Tool | Description |
|------|-------------|
| `add_person` | Add a person: name, role, company, email, notes |
| `get_people` | List people, optionally filtered by company |

---

### Rules Engine

Behavior rules are stored in Supabase and injected at every session start. Edit rules in the dashboard without touching code.

| Tool | Description |
|------|-------------|
| `get_rules` | Fetch active rules, optionally filtered by category. Ordered by priority (highest first) |
| `add_rule` | Create a rule. Categories: `behavior · memory · output · general` |
| `update_rule` | Update rule content, title, priority, active status |
| `delete_rule` | Delete a rule by ID |

**Rule categories:**

| Category | Purpose |
|----------|---------|
| `behavior` | How the AI executes tasks |
| `memory` | What data to capture and how |
| `output` | Response format and length |
| `general` | Miscellaneous instructions |

---

### Analysis

Save codebase analysis results for future retrieval and cross-session context.

| Tool | Description |
|------|-------------|
| `save_analysis` | Save an analysis: project, summary, insights, focus, tags, files_referenced. Auto-embedded for RAG |
| `get_analyses` | Retrieve analyses, filtered by project, focus, or date |
| `delete_analysis` | Delete analysis by ID |

**Focus areas:** `debt · patterns · dependencies · general`

---

### Planning

Break down goals into structured task hierarchies.

| Tool | Description |
|------|-------------|
| `save_plan` | Create a plan with tasks. Input: goal, project, tasks[]. Each task: title, description, tags, depends_on. Creates parent `plan` entry + N child `task` entries. Resolves task dependencies by title → UUID |

---

### Generation

Content generation and file management tools.

| Tool | Description |
|------|-------------|
| `upload_file` | Upload file → Supabase Storage. Chunks (~2000 chars) and embeds for RAG. Supports: .txt, .md, code files, PDF (text) |
| `set_generation_profile` | Configure generation profile per platform: intent, tone, topics, avoid list, frequency, language |
| `fetch_world_context` | Query Brave Search API for recent news on your topics. Requires `BRAVE_API_KEY` |
| `generate_posts` | Prepare generation context: recent memory + world news + profile → returns structured prompt for Claude |
| `save_post` | Save post draft or published post. Platforms: `linkedin · twitter · newsletter` |

---

### Agents & Sessions

Full multi-agent orchestration with audit trails.

| Tool | Description |
|------|-------------|
| `get_agents` | List registered agents, optionally filtered by status |
| `register_agent` | Register or update an agent: name (unique key), role, system_prompt, color, status |
| `sync_agents` | Compare local `.agent.md` files vs DB registry — finds drift |
| `start_session` | Create orchestrator session in DB + local folder (`~/.claude/agent-sessions/{id}/`). Generates `conversation.jsonl` |
| `end_session` | Mark session completed or failed with summary |
| `log_message` | Log inter-agent message. Types: `task · result · request · question · answer · context · state · error`. Supports verdicts: `pass · fail · weak` |
| `get_session_context` | Fetch full conversation log for a session (local file first, DB fallback) |
| `list_sessions` | List sessions ordered by date. Filter by status: `active · completed · failed` |

---

## Web Dashboard

The dashboard runs at `http://localhost:3000` and provides a full UI for everything the MCP server can do.

### 15 Sections

| # | Section | Description |
|---|---------|-------------|
| 0 | **Overview** | Live stats: entry counts, project health, pending tasks, system status |
| 1 | **Memory** | Browse and edit all entries. Grid or split view. Filter by type, status, search |
| 2 | **Search** | Semantic search with similarity scores (HIGH / MED / LOW). Query history |
| 3 | **Projects** | Project cards with health bars (done / pending / blocked). Entry counts |
| 4 | **Companies** | Company records with linked people and projects |
| 5 | **People** | Person profiles with activity feed and avatar color system |
| 6 | **Tasks** | Filtered task view by status. Bulk status updates |
| 7 | **Rules** | AI behavior rules editor. Toggle active/inactive per rule |
| 8 | **Analyze** | View AI-generated codebase analysis entries. Filter by project |
| 9 | **Plan** | Plans with nested tasks. Segmented progress bars |
| 10 | **Generate** | Post drafts for LinkedIn, Twitter, Newsletter. Profile management |
| 11 | **Graph** | Interactive 3D knowledge graph (Three.js force-directed layout) |
| 12 | **Settings** | Supabase credentials, theme toggle, data export (JSON / CSV) |
| 13 | **Timeline** | Chronological feed of all entries grouped by day |
| 14 | **Agents** | Multi-agent session viewer. Message logs, verdicts, session status |

### Keyboard Shortcuts

| Key | Action |
|-----|--------|
| `↑ / ↓` | Navigate between sections |
| `N` | Open new entry modal |
| `Cmd+K` / `Ctrl+K` | Command palette |
| `Esc` | Close modal / go back |

---

## Database Schema

### Tables

```
projects          People and team management
people            Person profiles
entries           Central memory store (all entry types)
embeddings        pgvector embeddings (384 dims, gte-small)
rules             AI behavior rules
generations       Generation profiles (LinkedIn, Twitter, etc.)
posts             Generated post drafts
agent_registry    Registered agents
agent_sessions    Orchestrator sessions
agent_messages    Inter-agent message logs
```

### Key Design Decisions

- **Single `entries` table** for all memory types — polymorphic via `type` column
- **pgvector** (`vector(384)`) with IVFFlat index for cosine similarity search
- **Embeddings cascade** — deleting an entry deletes its embeddings
- **Auto `updated_at`** via PostgreSQL trigger on the `entries` table
- **File chunks** stored as entries with `type='file'` and metadata linking to Supabase Storage path

### Vector Search RPC

```sql
-- Called by search_memory and query_context
select match_entries(
  query_embedding  => $1::vector,
  match_count      => $2,
  filter_type      => $3,
  filter_project   => $4
);
```

---

## Multi-Agent System

Context Engine includes a full **multi-agent orchestration layer**. The orchestrator delegates tasks to specialized agents, logs all communication, and tracks sessions end-to-end.

### Built-in Agents

| Agent | Role |
|-------|------|
| `orchestrator` | Orchestration & coordination |
| `backend` | API & database engineering |
| `frontend` | UI/UX implementation |
| `fullstack` | End-to-end feature development |
| `designer` | UX/UI design system |
| `design-critic` | Design quality enforcement |
| `tester` | QA & validation |
| `data-analyst` | Data analysis & pipelines |
| `ideator` | Problem decomposition & planning |

### Session Flow

```
1. start_session(goal)          → creates session + local folder
2. get_agents()                 → load all registered agents
3. Delegate via Task tool       → agents run in parallel or sequence
4. log_message() (per step)     → full audit trail in conversation.jsonl
5. end_session(session_id)      → mark complete with summary
```

### File Watcher

The MCP server includes a **file watcher** (`src/lib/watcher.ts`) that monitors `~/.claude/agent-sessions/*/conversation.jsonl` in real-time. New lines appended to any conversation file are automatically synced to the `agent_messages` table in Supabase — making all agent activity visible in the dashboard instantly.

---

## Tech Stack

### MCP Server
| Layer | Technology |
|-------|-----------|
| Runtime | Node.js ≥ 20 |
| Language | TypeScript 5.x |
| Protocol | MCP SDK (`@modelcontextprotocol/sdk`) |
| Validation | Zod |
| Database | Supabase (PostgreSQL + pgvector) |
| Build | esbuild (via `build.mjs`) |
| Tests | Vitest |

### Web Dashboard
| Layer | Technology |
|-------|-----------|
| Framework | Next.js 16.2 (App Router) |
| Runtime | React 19.2 + React Compiler |
| Styling | Tailwind CSS v4 |
| Animations | Framer Motion 12 |
| 3D | Three.js 0.183 + @react-three/fiber |
| Drag & Drop | dnd-kit |
| Icons | Lucide React |
| Markdown | react-markdown + remark-gfm |
| Typography | Space Grotesk · Inter · JetBrains Mono |

### Infrastructure
| Layer | Technology |
|-------|-----------|
| Database | Supabase (PostgreSQL) |
| Embeddings | pgvector (`gte-small`, 384 dims) |
| Edge Functions | Supabase Edge Functions (embed, RAG) |
| File Storage | Supabase Storage |
| Web Search | Brave Search API (optional) |
| Package Manager | pnpm workspaces |

---

## Development

### Build

```bash
# Build everything
pnpm build

# Build individual packages
pnpm --filter @context-engine/shared build
pnpm --filter camaleon-mcp-server build
pnpm --filter @context-engine/web-ui build
```

### Tests

```bash
# Run MCP server tests
pnpm --filter camaleon-mcp-server test

# Watch mode
pnpm --filter camaleon-mcp-server test:watch

# Coverage report
pnpm --filter camaleon-mcp-server test:coverage
```

### Type Check

```bash
pnpm type-check
```

### Project Scripts

```bash
pnpm dev          # Start MCP server + web UI in watch mode
pnpm build        # Build all packages
pnpm type-check   # Type-check all packages
```

---

## License

MIT — see [LICENSE](LICENSE)

---

<div align="center">

Built with [Model Context Protocol](https://modelcontextprotocol.io) · Powered by [Supabase](https://supabase.com)

</div>
