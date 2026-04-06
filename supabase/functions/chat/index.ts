import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const CORS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

const OPENROUTER_URL = "https://openrouter.ai/api/v1/chat/completions";
const MODEL = "anthropic/claude-3.5-haiku";
const MAX_ITER = 5;

const SYSTEM_PROMPT = `You are the Context Engine — a sharp, slightly sarcastic but highly efficient AI operating system for personal knowledge management.

Think of yourself as the user's second brain… but faster, better organized, and with a sense of humor.

## Core Capabilities
You have direct, real-time access to the user's memory system. You can:
- Store decisions, tasks, notes, ideas, meetings, logs
- Query and retrieve any stored knowledge
- Manage people, projects, and behavioral rules
- Update and refine existing records

## Operating Principles
- Be concise, structured, and action-oriented.
- Default to action, not explanation.
- If something can be stored, store it.
- If something can be clarified, ask quickly and move on.
- Never leave operations ambiguous — always confirm what you did.

## Behavior Rules

### 1. Storing Information
- When the user provides something storable (task, note, decision, etc.), act immediately.
- Choose the most appropriate tool (add_entry, add_person, add_project, etc.)
- Infer structure when possible (tags, type, priority).
- Confirm clearly:
  → What was stored
  → Where it was stored
  → Any inferred metadata

### 2. Querying Information
- Use get_entries, search_memory, query_context, etc.
- Return results cleanly formatted (bullets or sections).
- If nothing is found, say it clearly (no hallucinations).

### 3. Updating Information
- Use update_entry, update_person, etc.
- Briefly describe what changed.

### 4. Managing Context
- Connect dots when relevant (people ↔ projects ↔ tasks).
- Surface useful context proactively when it adds value (but don’t ramble).

## Personality Layer 😏
- You are witty, slightly sarcastic, and efficient.
- Think: “helpful operator with personality”, not a clown.
- Always answer in the language they user is talking.
- Use light humor when confirming actions or pointing out obvious things.
- Examples:
  - “Stored. Your future self will thank me.”
  - “Found 3 entries. Not bad, you’ve been productive.”
  - “Nothing found… either you never saved it, or it vanished into the void.”

## Communication Style
- Short paragraphs or bullet points
- No fluff, no over-explaining
- Clear confirmations after every operation

## Available Tools
add_entry, get_entries, update_entry,
add_person, get_people, update_person,
add_project, get_projects,
get_rules, add_rule,
query_context, search_memory

## Golden Rule
If the user interacts with knowledge, you act on it.
If you act on it, you confirm it.
No silent operations. No guesswork.`;

// ── Tool definitions (OpenAI format — works with all OpenRouter providers) ──────

// deno-lint-ignore no-explicit-any
function tool(
  name: string,
  description: string,
  parameters: Record<string, any>,
): Record<string, any> {
  return { type: "function", function: { name, description, parameters } };
}

const TOOLS = [
  tool(
    "add_entry",
    "Insert a new entry (task, note, decision, meeting, idea, log, analysis, plan, post, file) into the knowledge base.",
    {
      type: "object",
      properties: {
        type: {
          type: "string",
          enum: [
            "task",
            "note",
            "decision",
            "meet",
            "idea",
            "log",
            "analysis",
            "plan",
            "post",
            "file",
          ],
          description: "Entry type",
        },
        title: { type: "string", description: "Entry title (required)" },
        content: { type: "string", description: "Entry body / details" },
        project: {
          type: "string",
          description: "Project name to link this entry to",
        },
        tags: {
          type: "array",
          items: { type: "string" },
          description: "Tags list",
        },
        status: {
          type: "string",
          enum: ["pending", "done", "blocked"],
          description: "Status (for tasks)",
        },
      },
      required: ["type", "title"],
    },
  ),
  tool(
    "get_entries",
    "Retrieve entries from the knowledge base with optional filters.",
    {
      type: "object",
      properties: {
        type: { type: "string", description: "Filter by entry type" },
        project: { type: "string", description: "Filter by project name" },
        status: { type: "string", description: "Filter by status" },
        limit: {
          type: "number",
          description: "Max results (default 10, max 50)",
        },
      },
    },
  ),
  tool("update_entry", "Update an existing entry by ID.", {
    type: "object",
    properties: {
      id: { type: "string", description: "Entry UUID (required)" },
      title: { type: "string" },
      content: { type: "string" },
      status: { type: "string", enum: ["pending", "done", "blocked"] },
      tags: { type: "array", items: { type: "string" } },
    },
    required: ["id"],
  }),
  tool("add_person", "Add a new person to the knowledge base.", {
    type: "object",
    properties: {
      name: { type: "string", description: "Person name (required)" },
      role: { type: "string" },
      company: { type: "string" },
      email: { type: "string" },
      notes: { type: "string" },
    },
    required: ["name"],
  }),
  tool("get_people", "List people in the knowledge base.", {
    type: "object",
    properties: {
      company: { type: "string", description: "Filter by company" },
    },
  }),
  tool("update_person", "Update an existing person record by id or name.", {
    type: "object",
    properties: {
      id: { type: "string", description: "Person UUID" },
      name: {
        type: "string",
        description: "Person name to look up if id not provided",
      },
      role: { type: "string" },
      company: { type: "string" },
      email: { type: "string" },
      notes: { type: "string" },
    },
  }),
  tool("add_project", "Add or upsert a project in the knowledge base.", {
    type: "object",
    properties: {
      name: { type: "string", description: "Project name (required, unique)" },
      description: { type: "string" },
      company: { type: "string" },
      stack: { type: "array", items: { type: "string" } },
      status: { type: "string", enum: ["active", "paused", "done"] },
    },
    required: ["name"],
  }),
  tool("get_projects", "List projects in the knowledge base.", {
    type: "object",
    properties: {
      status: {
        type: "string",
        description: "Filter by status (active, paused, done)",
      },
    },
  }),
  tool("get_rules", "Retrieve AI behavior rules.", {
    type: "object",
    properties: {
      active: { type: "boolean", description: "Filter by active status" },
      category: {
        type: "string",
        enum: ["behavior", "memory", "output", "general"],
        description: "Filter by category",
      },
    },
  }),
  tool("add_rule", "Add a new AI behavior rule.", {
    type: "object",
    properties: {
      title: { type: "string", description: "Rule title (required)" },
      content: { type: "string", description: "Rule content (required)" },
      category: {
        type: "string",
        enum: ["behavior", "memory", "output", "general"],
      },
      priority: {
        type: "number",
        description: "Priority (higher = more important)",
      },
    },
    required: ["title", "content"],
  }),
  tool(
    "query_context",
    "Semantic RAG search over all stored knowledge using natural language.",
    {
      type: "object",
      properties: {
        question: {
          type: "string",
          description: "Natural language question (required)",
        },
        limit: { type: "number", description: "Max results (default 5)" },
      },
      required: ["question"],
    },
  ),
  tool("search_memory", "Text-based search in entries by title and content.", {
    type: "object",
    properties: {
      query: { type: "string", description: "Search string (required)" },
      type: { type: "string", description: "Filter by entry type" },
      limit: { type: "number", description: "Max results (default 10)" },
    },
    required: ["query"],
  }),
];

// ── Helpers ──────────────────────────────────────────────────────────────────

function makeSupabase() {
  return createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
  );
}

async function resolveProjectId(
  supabase: ReturnType<typeof makeSupabase>,
  name: string,
): Promise<string | null> {
  const { data } = await supabase
    .from("projects")
    .select("id")
    .ilike("name", name)
    .limit(1)
    .single();
  return data?.id ?? null;
}

async function getEmbedding(
  supabase: ReturnType<typeof makeSupabase>,
  text: string,
): Promise<number[] | null> {
  try {
    const { data } = await supabase.functions.invoke("embed", {
      body: { input: text },
    });
    return data?.embedding ?? null;
  } catch {
    return null;
  }
}

// ── Tool executor ─────────────────────────────────────────────────────────────

async function executeTool(
  name: string,
  // deno-lint-ignore no-explicit-any
  input: Record<string, any>,
  supabase: ReturnType<typeof makeSupabase>,
): Promise<unknown> {
  switch (name) {
    case "add_entry": {
      const { type, title, content, project, tags, status } = input;

      let projectId: string | null = null;
      if (project) {
        projectId = await resolveProjectId(supabase, project);
      }

      const { data: entry, error } = await supabase
        .from("entries")
        .insert({
          type,
          title,
          content: content ?? null,
          project_id: projectId,
          tags: tags ?? [],
          status: status ?? null,
        })
        .select("id, type, title")
        .single();

      if (error) throw new Error(error.message);

      // Best-effort embedding — non-blocking
      const textToEmbed = [title, content].filter(Boolean).join("\n");
      const embedding = await getEmbedding(supabase, textToEmbed);
      if (embedding) {
        await supabase
          .from("embeddings")
          .insert({
            entry_id: entry.id,
            embedding,
          })
          .then(() => {
            /* fire-and-forget */
          });
      }

      return { success: true, entry };
    }

    case "get_entries": {
      const { type, project, status, limit = 10 } = input;
      const cap = Math.min(Number(limit), 50);

      let query = supabase
        .from("entries")
        .select(
          "id, type, title, content, status, tags, created_at, projects(name)",
        )
        .order("created_at", { ascending: false })
        .limit(cap);

      if (type) query = query.eq("type", type);
      if (status) query = query.eq("status", status);

      if (project) {
        const projectId = await resolveProjectId(supabase, project);
        if (projectId) query = query.eq("project_id", projectId);
      }

      const { data, error } = await query;
      if (error) throw new Error(error.message);

      return (data ?? []).map((e: Record<string, unknown>) => ({
        id: e.id,
        type: e.type,
        title: e.title,
        content: e.content,
        status: e.status,
        tags: e.tags,
        // deno-lint-ignore no-explicit-any
        project_name: (e.projects as any)?.name ?? null,
        created_at: e.created_at,
      }));
    }

    case "update_entry": {
      const { id, ...fields } = input;
      const allowed: Record<string, unknown> = {};
      for (const k of ["title", "content", "status", "tags"]) {
        if (k in fields) allowed[k] = fields[k];
      }
      allowed["updated_at"] = new Date().toISOString();

      const { data, error } = await supabase
        .from("entries")
        .update(allowed)
        .eq("id", id)
        .select("id, type, title, status")
        .single();

      if (error) throw new Error(error.message);
      return { success: true, entry: data };
    }

    case "add_person": {
      const { name, role, company, email, notes } = input;
      const { data, error } = await supabase
        .from("people")
        .insert({
          name,
          role: role ?? null,
          company: company ?? null,
          email: email ?? null,
          notes: notes ?? null,
        })
        .select("id, name, role, company")
        .single();

      if (error) throw new Error(error.message);
      return { success: true, person: data };
    }

    case "get_people": {
      const { company } = input;
      let query = supabase
        .from("people")
        .select("id, name, role, company, email, notes")
        .order("name");
      if (company) query = query.ilike("company", `%${company}%`);
      const { data, error } = await query;
      if (error) throw new Error(error.message);
      return data ?? [];
    }

    case "update_person": {
      const { id, name, ...fields } = input;
      const allowed: Record<string, unknown> = {};
      for (const k of ["role", "company", "email", "notes", "name"]) {
        if (k in fields) allowed[k] = fields[k];
      }

      let resolvedId = id;
      if (!resolvedId && name) {
        const { data } = await supabase
          .from("people")
          .select("id")
          .ilike("name", name)
          .limit(1)
          .single();
        resolvedId = data?.id;
      }
      if (!resolvedId)
        throw new Error("Person not found — provide id or a valid name");

      const { data, error } = await supabase
        .from("people")
        .update(allowed)
        .eq("id", resolvedId)
        .select("id, name, role, company")
        .single();

      if (error) throw new Error(error.message);
      return { success: true, person: data };
    }

    case "add_project": {
      const { name, description, company, stack, status = "active" } = input;
      const { data, error } = await supabase
        .from("projects")
        .upsert(
          {
            name,
            description: description ?? null,
            company: company ?? null,
            stack: stack ?? [],
            status,
          },
          { onConflict: "name" },
        )
        .select("id, name, status")
        .single();

      if (error) throw new Error(error.message);
      return { success: true, project: data };
    }

    case "get_projects": {
      const { status } = input;
      let query = supabase
        .from("projects")
        .select("id, name, company, stack, status, description, created_at")
        .order("name");
      if (status) query = query.eq("status", status);
      const { data, error } = await query;
      if (error) throw new Error(error.message);
      return data ?? [];
    }

    case "get_rules": {
      const { active, category } = input;
      let query = supabase
        .from("rules")
        .select("id, title, content, category, priority, active")
        .order("priority", { ascending: false });

      if (typeof active === "boolean") query = query.eq("active", active);
      if (category) query = query.eq("category", category);

      const { data, error } = await query;
      if (error) throw new Error(error.message);
      return data ?? [];
    }

    case "add_rule": {
      const { title, content, category, priority = 0 } = input;
      const { data, error } = await supabase
        .from("rules")
        .insert({ title, content, category: category ?? null, priority })
        .select("id, title, category, priority")
        .single();

      if (error) throw new Error(error.message);
      return { success: true, rule: data };
    }

    case "query_context": {
      const { question, limit = 5 } = input;
      const embedding = await getEmbedding(supabase, question);
      if (!embedding) throw new Error("Failed to generate embedding");

      const { data, error } = await supabase.rpc("match_entries", {
        query_embedding: embedding,
        match_count: Math.min(Number(limit), 20),
      });

      if (error) throw new Error(error.message);
      return data ?? [];
    }

    case "search_memory": {
      const { query, type, limit = 10 } = input;
      const safe = query.replace(/[%_]/g, "\\$&");

      let q = supabase
        .from("entries")
        .select("id, type, title, content, status, tags, created_at")
        .or(`title.ilike.%${safe}%,content.ilike.%${safe}%`)
        .order("created_at", { ascending: false })
        .limit(Math.min(Number(limit), 50));

      if (type) q = q.eq("type", type);

      const { data, error } = await q;
      if (error) throw new Error(error.message);
      return data ?? [];
    }

    default:
      throw new Error(`Unknown tool: ${name}`);
  }
}

// ── SSE helpers ───────────────────────────────────────────────────────────────

const encoder = new TextEncoder();

function sseEvent(data: unknown): Uint8Array {
  return encoder.encode(`data: ${JSON.stringify(data)}\n\n`);
}

function sseDone(): Uint8Array {
  return encoder.encode("data: [DONE]\n\n");
}

// ── OpenRouter call (OpenAI-compatible format) ────────────────────────────────

// deno-lint-ignore no-explicit-any
type OAIMessage = {
  role: string;
  content: string | null;
  tool_calls?: any[];
  tool_call_id?: string;
};

async function callOpenRouter(
  apiKey: string,
  messages: OAIMessage[],
  stream = false,
): Promise<Response> {
  return fetch(OPENROUTER_URL, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
      "HTTP-Referer": "https://context-engine.local",
      "X-Title": "Context Engine",
    },
    body: JSON.stringify({
      model: MODEL,
      messages,
      tools: TOOLS,
      tool_choice: "auto",
      max_tokens: 2048,
      stream,
    }),
  });
}

// ── Main handler ──────────────────────────────────────────────────────────────

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: CORS });

  const apiKey = Deno.env.get("OPENROUTER_API_KEY");
  if (!apiKey) {
    return new Response(
      JSON.stringify({ error: "OPENROUTER_API_KEY not set" }),
      {
        status: 500,
        headers: { ...CORS, "Content-Type": "application/json" },
      },
    );
  }

  // ── Input validation ──
  let userMessages: OAIMessage[];
  try {
    const body = await req.json();
    if (!Array.isArray(body?.messages) || body.messages.length === 0) {
      return new Response(
        JSON.stringify({
          error: "messages array is required and must not be empty",
        }),
        {
          status: 400,
          headers: { ...CORS, "Content-Type": "application/json" },
        },
      );
    }
    userMessages = body.messages;
  } catch {
    return new Response(JSON.stringify({ error: "Invalid JSON body" }), {
      status: 400,
      headers: { ...CORS, "Content-Type": "application/json" },
    });
  }

  const supabase = makeSupabase();

  // ── SSE stream setup ──
  const { readable, writable } = new TransformStream<Uint8Array, Uint8Array>();
  const writer = writable.getWriter();

  (async () => {
    try {
      // System prompt as first message (OpenAI format)
      const conversationMessages: OAIMessage[] = [
        { role: "system", content: SYSTEM_PROMPT },
        ...userMessages,
      ];
      let iteration = 0;

      // ── Tool call loop ──
      while (iteration < MAX_ITER) {
        const orRes = await callOpenRouter(apiKey, conversationMessages, false);

        if (!orRes.ok) {
          const errText = await orRes.text();
          await writer.write(
            sseEvent({ error: `OpenRouter error: ${errText}` }),
          );
          await writer.write(sseDone());
          return;
        }

        const json = await orRes.json();
        // deno-lint-ignore no-explicit-any
        const choice = json.choices?.[0] as any;
        const message = choice?.message;
        const finishReason: string = choice?.finish_reason ?? "stop";

        if (finishReason !== "tool_calls" || !message?.tool_calls?.length) {
          // No tool calls — emit text and finish
          const finalText: string =
            typeof message?.content === "string" ? message.content : "";
          const words = finalText.split(/(?<=\s)/);
          for (const chunk of words) {
            if (chunk) await writer.write(sseEvent({ token: chunk }));
          }
          await writer.write(sseDone());
          return;
        }

        // ── Execute tool calls ──
        // deno-lint-ignore no-explicit-any
        const toolMessages: OAIMessage[] = [];

        for (const toolCall of message.tool_calls) {
          const name: string = toolCall.function?.name ?? "";
          // deno-lint-ignore no-explicit-any
          let input: Record<string, any> = {};
          try {
            input = JSON.parse(toolCall.function?.arguments ?? "{}");
          } catch {
            /* malformed args */
          }

          await writer.write(
            sseEvent({ tool_call: { id: toolCall.id, name, params: input } }),
          );

          let result: unknown;
          let status: "done" | "error" = "done";
          try {
            result = await executeTool(name, input, supabase);
          } catch (err) {
            status = "error";
            result = `Error: ${err instanceof Error ? err.message : String(err)}`;
          }

          const resultStr = JSON.stringify(result);
          await writer.write(
            sseEvent({
              tool_result: { id: toolCall.id, status, result: resultStr },
            }),
          );

          toolMessages.push({
            role: "tool",
            tool_call_id: toolCall.id,
            content: resultStr,
          });
        }

        // Append assistant turn + tool results (OpenAI format)
        conversationMessages.push({
          role: "assistant",
          content: message.content ?? null,
          tool_calls: message.tool_calls,
        });
        for (const tm of toolMessages) {
          conversationMessages.push(tm);
        }

        iteration++;
      }

      // ── MAX_ITER reached — do a final non-tool streaming call (no tools) ──
      const finalRes = await callOpenRouter(
        apiKey,
        conversationMessages.map((m) => {
          // Strip tool_calls from messages for the final call to force text response
          if (m.role === "assistant")
            return { role: "assistant", content: m.content ?? "" };
          return m;
        }),
        true,
      );

      if (!finalRes.ok) {
        const errText = await finalRes.text();
        await writer.write(sseEvent({ error: `OpenRouter error: ${errText}` }));
        await writer.write(sseDone());
        return;
      }

      // Stream tokens from SSE response
      const reader = finalRes.body!.getReader();
      const dec = new TextDecoder();
      try {
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          const chunk = dec.decode(value);
          const lines = chunk.split("\n").filter((l) => l.startsWith("data: "));
          for (const line of lines) {
            const data = line.slice(6).trim();
            if (data === "[DONE]") {
              await writer.write(sseDone());
              return;
            }
            try {
              const parsed = JSON.parse(data);
              const token: string =
                parsed.choices?.[0]?.delta?.content ?? parsed.delta?.text ?? "";
              if (token) await writer.write(sseEvent({ token }));
            } catch {
              /* skip malformed */
            }
          }
        }
      } finally {
        reader.releaseLock();
      }

      await writer.write(sseDone());
    } catch (err) {
      try {
        await writer.write(
          sseEvent({ error: err instanceof Error ? err.message : String(err) }),
        );
        await writer.write(sseDone());
      } catch {
        /* writer may already be closed */
      }
    } finally {
      try {
        await writer.close();
      } catch {
        /* ignore */
      }
    }
  })();

  return new Response(readable, {
    headers: {
      ...CORS,
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache",
      Connection: "keep-alive",
    },
  });
});
