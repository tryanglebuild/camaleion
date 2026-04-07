"use client";

import { useEffect, useRef } from "react";

export type AppScreen = "memory" | "projects" | "agents" | "search" | "chat";

interface AppMockupProps {
  screen: AppScreen;
  drawProgress: number; // 0 = nothing drawn, 1 = fully drawn
  dissolveProgress?: number; // 0 = fully visible, 1 = fully dissolved
}

// ── Nav items ──────────────────────────────────────────────────────
const NAV_ITEMS: { icon: string; label: string; id: AppScreen }[] = [
  { icon: "◈", label: "Memory",   id: "memory"   },
  { icon: "⬡", label: "Projects", id: "projects" },
  { icon: "⬖", label: "Agents",   id: "agents"   },
  { icon: "⌕", label: "Search",   id: "search"   },
  { icon: "◻", label: "Chat",     id: "chat"     },
];

// ── Screen content renderers ───────────────────────────────────────
function MemoryContent({ p }: { p: number }) {
  const entries = [
    { type: "decision", title: "Use non-streaming for tool_use loop", tag: "decision", color: "#D97706", time: "2h ago" },
    { type: "log",      title: "Edge function chat implemented",       tag: "log",      color: "#78716C", time: "3h ago" },
    { type: "task",     title: "Add pgvector similarity threshold",    tag: "task",     color: "#2563EB", time: "5h ago" },
    { type: "note",     title: "SSE via fetch direct — not invoke",    tag: "note",     color: "#7C3AED", time: "1d ago" },
    { type: "idea",     title: "Timeline view for session history",    tag: "idea",     color: "#DB2777", time: "2d ago" },
  ];
  return (
    <div style={{ padding: "16px", display: "flex", flexDirection: "column", gap: "6px" }}>
      {/* Stats row */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "6px", marginBottom: "10px", opacity: Math.min(1, p * 4) }}>
        {[
          { label: "ENTRIES", value: "247", color: "#3B82F6" },
          { label: "TODAY",   value: "12",  color: "#86EFAC" },
          { label: "PROJECTS",value: "8",   color: "#A78BFA" },
        ].map((s) => (
          <div key={s.label} style={{
            background: "var(--app-surface-2)",
            border: `1px solid var(--app-border)`,
            borderLeft: `3px solid ${s.color}`,
            borderRadius: "6px",
            padding: "8px 10px",
          }}>
            <p style={{ fontSize: "8px", color: "var(--app-text-muted)", fontFamily: "var(--font-jetbrains-mono), monospace", letterSpacing: "0.05em" }}>{s.label}</p>
            <p style={{ fontSize: "18px", fontWeight: 700, color: s.color, fontFamily: "var(--font-space-grotesk), sans-serif", lineHeight: 1.2 }}>{s.value}</p>
          </div>
        ))}
      </div>
      {/* Entry cards */}
      {entries.map((e, i) => (
        <div
          key={i}
          style={{
            background: "var(--app-surface-1)",
            border: "1px solid var(--app-border)",
            borderRadius: "8px",
            padding: "10px 12px",
            display: "flex",
            alignItems: "center",
            gap: "10px",
            opacity: Math.min(1, Math.max(0, (p - 0.15 - i * 0.08) * 8)),
            transform: `translateY(${Math.max(0, (1 - Math.min(1, Math.max(0, (p - 0.15 - i * 0.08) * 8))) * 10)}px)`,
            transition: "opacity 0ms, transform 0ms",
          }}
        >
          <span style={{ fontSize: "9px", fontFamily: "var(--font-jetbrains-mono), monospace", background: "var(--app-surface-2)", border: `1px solid var(--app-border)`, borderRadius: "3px", padding: "2px 6px", color: e.color, flexShrink: 0 }}>{e.tag}</span>
          <span style={{ fontSize: "11px", color: "var(--app-text)", flex: 1, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{e.title}</span>
          <span style={{ fontSize: "9px", color: "var(--app-text-muted)", flexShrink: 0 }}>{e.time}</span>
        </div>
      ))}
    </div>
  );
}

function ProjectsContent({ p }: { p: number }) {
  const projects = [
    { name: "project-ai-system", desc: "Context Engine MCP + Web UI", health: "healthy", entries: 156, color: "#0891B2" },
    { name: "cli-mcp",           desc: "MCP server tooling",          health: "healthy", entries: 43,  color: "#7C3AED" },
    { name: "web-ui",            desc: "Dashboard + Agents UI",       health: "warning", entries: 89,  color: "#D97706" },
    { name: "landing",           desc: "Marketing site",              health: "idle",    entries: 12,  color: "#A8A29E" },
  ];
  const hColor: Record<string, string> = { healthy: "#16A34A", warning: "#D97706", idle: "#A8A29E" };
  return (
    <div style={{ padding: "16px", display: "flex", flexDirection: "column", gap: "8px" }}>
      {projects.map((pr, i) => (
        <div key={i} style={{
          background: "var(--app-surface-1)",
          border: "1px solid var(--app-border)",
          borderRadius: "8px",
          padding: "12px 14px",
          borderLeft: `3px solid ${pr.color}`,
          opacity: Math.min(1, Math.max(0, (p - i * 0.12) * 6)),
          transform: `translateX(${Math.max(0, (1 - Math.min(1, Math.max(0, (p - i * 0.12) * 6))) * 20)}px)`,
        }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "4px" }}>
            <span style={{ fontSize: "12px", fontWeight: 600, color: "var(--app-text)", fontFamily: "var(--font-space-grotesk), sans-serif" }}>{pr.name}</span>
            <span style={{ fontSize: "9px", color: hColor[pr.health], fontFamily: "var(--font-jetbrains-mono), monospace" }}>● {pr.health}</span>
          </div>
          <div style={{ display: "flex", justifyContent: "space-between" }}>
            <span style={{ fontSize: "10px", color: "var(--app-text-sec)" }}>{pr.desc}</span>
            <span style={{ fontSize: "9px", color: "var(--app-text-muted)" }}>{pr.entries} entries</span>
          </div>
        </div>
      ))}
    </div>
  );
}

function AgentsContent({ p }: { p: number }) {
  const agents = [
    { name: "Frontend Agent", role: "UI implementation", color: "#3B82F6",  status: "active" },
    { name: "Backend Agent",  role: "API + DB logic",   color: "#10B981",  status: "active" },
    { name: "Designer Agent", role: "Design system",    color: "#8B5CF6",  status: "idle"   },
    { name: "Tester Agent",   role: "QA + validation",  color: "#F59E0B",  status: "idle"   },
  ];
  const msg = [
    { from: "orchestrator", text: "Delegating UI task to Frontend Agent", time: "12:41" },
    { from: "frontend",     text: "DrawCanvas implemented. 7 phases wired.", time: "12:43" },
    { from: "orchestrator", text: "Checkpoint: approve to continue?", time: "12:44" },
  ];
  return (
    <div style={{ padding: "16px", display: "flex", gap: "10px", height: "100%" }}>
      {/* Agent list */}
      <div style={{ flex: "0 0 40%", display: "flex", flexDirection: "column", gap: "6px" }}>
        {agents.map((a, i) => (
          <div key={i} style={{
            background: "var(--app-surface-1)", border: "1px solid var(--app-border)", borderRadius: "8px", padding: "10px",
            opacity: Math.min(1, Math.max(0, (p - i * 0.1) * 6)),
          }}>
            <div style={{ display: "flex", alignItems: "center", gap: "6px", marginBottom: "2px" }}>
              <div style={{ width: "8px", height: "8px", borderRadius: "50%", background: a.color, flexShrink: 0 }} />
              <span style={{ fontSize: "11px", fontWeight: 600, color: "var(--app-text)" }}>{a.name}</span>
            </div>
            <span style={{ fontSize: "9px", color: "var(--app-text-muted)" }}>{a.role}</span>
          </div>
        ))}
      </div>
      {/* Conversation log */}
      <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: "6px" }}>
        {msg.map((m, i) => (
          <div key={i} style={{
            background: "var(--app-surface-2)", borderRadius: "6px", padding: "8px 10px",
            opacity: Math.min(1, Math.max(0, (p - 0.2 - i * 0.12) * 7)),
          }}>
            <span style={{ fontSize: "8px", color: "var(--app-accent)", fontFamily: "var(--font-jetbrains-mono), monospace" }}>{m.from}</span>
            <p style={{ fontSize: "10px", color: "var(--app-text-sec)", marginTop: "2px", lineHeight: 1.4 }}>{m.text}</p>
            <span style={{ fontSize: "8px", color: "var(--app-text-muted)" }}>{m.time}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

function SearchContent({ p }: { p: number }) {
  const results = [
    { score: "0.94", title: "Decision: Use non-streaming for tool calls", type: "decision" },
    { score: "0.91", title: "Note: SSE via fetch — supabase.invoke limitation", type: "note" },
    { score: "0.87", title: "Log: Edge function deployed with 12 tools", type: "log" },
    { score: "0.82", title: "Task: Add pgvector cosine threshold config", type: "task" },
  ];
  const typeColor: Record<string, string> = { decision: "#D97706", note: "#7C3AED", log: "#78716C", task: "#2563EB" };
  return (
    <div style={{ padding: "16px" }}>
      {/* Search input */}
      <div style={{
        background: "var(--app-surface-2)", border: "1px solid var(--app-border-act)",
        borderRadius: "8px", padding: "10px 14px", marginBottom: "14px", display: "flex", alignItems: "center", gap: "8px",
        opacity: Math.min(1, p * 5),
      }}>
        <span style={{ color: "var(--app-text-muted)", fontSize: "12px" }}>⌕</span>
        <span style={{ fontSize: "12px", color: "var(--app-text-sec)" }}>tool_use streaming decision</span>
        <span style={{ marginLeft: "auto", fontSize: "9px", color: "var(--app-accent)", fontFamily: "var(--font-jetbrains-mono), monospace" }}>pgvector</span>
      </div>
      <p style={{ fontSize: "9px", color: "var(--app-text-muted)", marginBottom: "10px", fontFamily: "var(--font-jetbrains-mono), monospace", opacity: Math.min(1, p * 4) }}>
        4 results · semantic similarity
      </p>
      {results.map((r, i) => (
        <div key={i} style={{
          background: "var(--app-surface-1)", border: "1px solid var(--app-border)", borderRadius: "8px",
          padding: "10px 12px", marginBottom: "6px", display: "flex", gap: "10px", alignItems: "center",
          opacity: Math.min(1, Math.max(0, (p - 0.15 - i * 0.1) * 6)),
        }}>
          <span style={{ fontSize: "10px", color: "var(--app-accent)", fontFamily: "var(--font-jetbrains-mono), monospace", flexShrink: 0 }}>{r.score}</span>
          <span style={{ fontSize: "11px", color: "var(--app-text)", flex: 1 }}>{r.title}</span>
          <span style={{ fontSize: "9px", color: typeColor[r.type], background: "var(--app-surface-2)", border: "1px solid var(--app-border)", borderRadius: "3px", padding: "1px 5px", fontFamily: "var(--font-jetbrains-mono), monospace" }}>{r.type}</span>
        </div>
      ))}
    </div>
  );
}

function ChatContent({ p }: { p: number }) {
  const messages = [
    { role: "user",      text: "What decisions did we make about streaming?"           },
    { role: "assistant", text: "Based on your memory: you decided to use non-streaming for the tool_use loop because Anthropic's API is more reliable without SSE in that context. The final response still uses streaming." },
    { role: "user",      text: "Which files were changed?"                            },
    { role: "assistant", text: "supabase/functions/chat/index.ts — the main edge function. Also SectionChat.tsx was updated to use fetch directly instead of supabase.functions.invoke." },
  ];
  return (
    <div style={{ padding: "16px", display: "flex", flexDirection: "column", gap: "8px", height: "100%" }}>
      <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: "8px", overflowY: "auto" }}>
        {messages.map((m, i) => (
          <div key={i} style={{
            alignSelf: m.role === "user" ? "flex-end" : "flex-start",
            maxWidth: "82%",
            background: m.role === "user" ? "var(--app-accent)" : "var(--app-surface-2)",
            borderRadius: m.role === "user" ? "12px 12px 3px 12px" : "12px 12px 12px 3px",
            padding: "8px 12px",
            opacity: Math.min(1, Math.max(0, (p - i * 0.14) * 5)),
            transform: `translateY(${Math.max(0, (1 - Math.min(1, Math.max(0, (p - i * 0.14) * 5))) * 8)}px)`,
          }}>
            <p style={{
              fontSize: "11px",
              color: m.role === "user" ? "#fff" : "var(--app-text-sec)",
              lineHeight: 1.5,
            }}>{m.text}</p>
          </div>
        ))}
        {/* Typing indicator */}
        {p > 0.8 && p < 0.95 && (
          <div style={{ alignSelf: "flex-start", background: "var(--app-surface-2)", borderRadius: "12px 12px 12px 3px", padding: "8px 12px", opacity: (p - 0.8) * 6 }}>
            <span style={{ fontSize: "14px", color: "var(--app-text-muted)", letterSpacing: "3px" }}>···</span>
          </div>
        )}
      </div>
      {/* Input */}
      <div style={{
        background: "var(--app-surface-2)", border: "1px solid var(--app-border)",
        borderRadius: "8px", padding: "10px 12px", display: "flex", alignItems: "center", gap: "8px",
        opacity: Math.min(1, p * 3),
      }}>
        <span style={{ fontSize: "11px", color: "var(--app-text-muted)", flex: 1 }}>Ask about your memory…</span>
        <span style={{ fontSize: "10px", color: "var(--app-accent)" }}>↵</span>
      </div>
    </div>
  );
}

// ── SVG Frame border that draws itself ────────────────────────────
function AppFrame({ drawProgress, children }: { drawProgress: number; children: React.ReactNode }) {
  const perimeter = 2 * (100 + 100); // normalized percentage units
  const dashOffset = (1 - Math.min(1, drawProgress * 2)) * 400;

  return (
    <div style={{ position: "relative", width: "100%", height: "100%" }}>
      {/* SVG border draw */}
      <svg
        style={{ position: "absolute", inset: 0, width: "100%", height: "100%", pointerEvents: "none", zIndex: 10, borderRadius: "12px", overflow: "visible" }}
        viewBox="0 0 800 560"
        preserveAspectRatio="none"
      >
        <rect
          x="1" y="1" width="798" height="558" rx="11"
          fill="none"
          stroke="var(--app-accent)"
          strokeWidth="1.5"
          strokeDasharray="2400"
          strokeDashoffset={dashOffset * 6}
          style={{ transition: "stroke-dashoffset 0ms" }}
        />
      </svg>
      {children}
    </div>
  );
}

// ── Main component ─────────────────────────────────────────────────
export default function AppMockup({ screen, drawProgress, dissolveProgress = 0 }: AppMockupProps) {
  const navItemCount = NAV_ITEMS.length;
  // Draw phases:
  // 0.00-0.15: chrome appears
  // 0.15-0.40: nav rail draws item by item
  // 0.40-1.00: content area builds

  const chromeProg    = Math.min(1, drawProgress * (1 / 0.15));
  const navProg       = Math.min(1, Math.max(0, (drawProgress - 0.15) / 0.25));
  const contentProg   = Math.min(1, Math.max(0, (drawProgress - 0.40) / 0.60));

  const finalOpacity  = 1 - dissolveProgress;

  const screenContent: Record<AppScreen, React.ReactNode> = {
    memory:   <MemoryContent   p={contentProg} />,
    projects: <ProjectsContent p={contentProg} />,
    agents:   <AgentsContent   p={contentProg} />,
    search:   <SearchContent   p={contentProg} />,
    chat:     <ChatContent     p={contentProg} />,
  };

  const screenTitles: Record<AppScreen, string> = {
    memory:   "Memory Overview",
    projects: "Projects",
    agents:   "Agents & Sessions",
    search:   "Semantic Search",
    chat:     "Chat",
  };

  return (
    <div
      style={{
        width: "100%",
        height: "100%",
        opacity: finalOpacity,
        borderRadius: "12px",
        overflow: "hidden",
        background: "var(--app-bg)",
        boxShadow: "0 32px 80px rgba(0,0,0,0.4), 0 8px 24px rgba(0,0,0,0.2)",
        display: "flex",
        flexDirection: "column",
        position: "relative",
      }}
    >
      <AppFrame drawProgress={drawProgress}>
        {/* Chrome bar */}
        <div style={{
          height: "36px",
          background: "var(--app-surface-2)",
          borderBottom: "1px solid var(--app-border)",
          display: "flex",
          alignItems: "center",
          padding: "0 14px",
          gap: "6px",
          opacity: chromeProg,
          flexShrink: 0,
        }}>
          <div style={{ width: "8px", height: "8px", borderRadius: "50%", background: "#FF5F57" }} />
          <div style={{ width: "8px", height: "8px", borderRadius: "50%", background: "#FFBD2E" }} />
          <div style={{ width: "8px", height: "8px", borderRadius: "50%", background: "#28C840" }} />
          <div style={{ flex: 1, textAlign: "center" }}>
            <span style={{ fontSize: "9px", color: "var(--app-text-muted)", fontFamily: "var(--font-jetbrains-mono), monospace" }}>
              camaleon.app/dashboard
            </span>
          </div>
        </div>

        {/* App body */}
        <div style={{ flex: 1, display: "flex", overflow: "hidden", minHeight: 0 }}>

          {/* Left nav rail */}
          <div style={{
            width: "180px",
            flexShrink: 0,
            background: "var(--app-surface-1)",
            borderRight: "1px solid var(--app-border)",
            padding: "12px 0",
            display: "flex",
            flexDirection: "column",
            gap: "2px",
            opacity: Math.min(1, chromeProg),
          }}>
            {/* Logo */}
            <div style={{ padding: "4px 16px 12px", borderBottom: "1px solid var(--app-border)", marginBottom: "8px" }}>
              <span style={{ fontFamily: "var(--font-space-grotesk), sans-serif", fontSize: "13px", fontWeight: 600, color: "var(--app-text)" }}>
                ◈ camaleon
              </span>
            </div>

            {NAV_ITEMS.map((item, i) => {
              const itemProg = Math.min(1, Math.max(0, (navProg - i / navItemCount) * navItemCount));
              const isActive = item.id === screen;
              return (
                <div
                  key={item.id}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "8px",
                    padding: "7px 14px",
                    margin: "0 6px",
                    borderRadius: "6px",
                    background: isActive ? "var(--app-surface-3)" : "transparent",
                    borderLeft: isActive ? `2px solid var(--app-accent)` : "2px solid transparent",
                    opacity: itemProg,
                    transform: `translateX(${(1 - itemProg) * -12}px)`,
                    cursor: "default",
                  }}
                >
                  <span style={{ fontSize: "11px", color: isActive ? "var(--app-accent)" : "var(--app-text-muted)", width: "14px", textAlign: "center" }}>
                    {item.icon}
                  </span>
                  <span style={{ fontSize: "11px", color: isActive ? "var(--app-text)" : "var(--app-text-sec)", fontWeight: isActive ? 500 : 400 }}>
                    {item.label}
                  </span>
                </div>
              );
            })}
          </div>

          {/* Main content area */}
          <div style={{ flex: 1, display: "flex", flexDirection: "column", overflow: "hidden", minWidth: 0 }}>
            {/* Section header */}
            <div style={{
              height: "44px",
              background: "var(--app-surface-1)",
              borderBottom: "1px solid var(--app-border)",
              display: "flex",
              alignItems: "center",
              padding: "0 20px",
              gap: "8px",
              flexShrink: 0,
              opacity: Math.min(1, navProg * 3),
            }}>
              <span style={{ fontSize: "14px", fontWeight: 600, color: "var(--app-text)", fontFamily: "var(--font-space-grotesk), sans-serif" }}>
                {screenTitles[screen]}
              </span>
              {contentProg > 0.5 && (
                <span style={{ marginLeft: "auto", fontSize: "9px", color: "var(--app-accent)", fontFamily: "var(--font-jetbrains-mono), monospace" }}>
                  ● live
                </span>
              )}
            </div>

            {/* Content */}
            <div style={{ flex: 1, overflow: "hidden", minHeight: 0 }}>
              {screenContent[screen]}
            </div>
          </div>
        </div>
      </AppFrame>
    </div>
  );
}
