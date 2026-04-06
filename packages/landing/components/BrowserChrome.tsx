"use client";

import { useState } from "react";

interface BrowserChromeProps {
  children?: React.ReactNode;
}

export default function BrowserChrome({ children }: BrowserChromeProps) {
  const [lightInner, setLightInner] = useState(false);

  return (
    <div
      style={{
        border: "1px solid var(--border-subtle)",
        background: "var(--surface-1)",
        transform: "perspective(1200px) rotateX(3deg) rotateY(-2deg)",
        transformOrigin: "center center",
        overflow: "hidden",
        width: "100%",
      }}
    >
      {/* Chrome header */}
      <div
        style={{
          height: "56px",
          background: "var(--surface-2)",
          borderBottom: "1px solid var(--border-subtle)",
          display: "flex",
          alignItems: "center",
          padding: "0 20px",
          gap: "16px",
        }}
      >
        {/* Traffic lights */}
        <div style={{ display: "flex", gap: "6px" }}>
          {[1, 2, 3].map((i) => (
            <div
              key={i}
              style={{
                width: "10px",
                height: "10px",
                borderRadius: "50%",
                background: "var(--border-strong)",
              }}
            />
          ))}
        </div>

        {/* URL bar */}
        <div
          style={{
            flex: 1,
            height: "28px",
            background: "var(--bg-base)",
            border: "1px solid var(--border-subtle)",
            display: "flex",
            alignItems: "center",
            padding: "0 12px",
            borderRadius: "2px",
          }}
        >
          <span
            style={{
              fontFamily: "var(--font-jetbrains-mono), monospace",
              fontSize: "12px",
              color: "var(--text-muted)",
            }}
          >
            camaleon.app/dashboard
          </span>
        </div>

        {/* Theme toggle */}
        <button
          onClick={() => setLightInner((v) => !v)}
          title="Toggle inner theme"
          aria-label="Toggle theme"
          style={{
            background: "transparent",
            border: "1px solid var(--border-subtle)",
            borderRadius: "2px",
            width: "28px",
            height: "28px",
            cursor: "pointer",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontSize: "14px",
            transition: "border-color 120ms ease",
          }}
        >
          {lightInner ? "☀" : "◑"}
        </button>
      </div>

      {/* Inner content */}
      <div data-theme={lightInner ? "light" : undefined}>
        {children ?? <DashboardMockup />}
      </div>
    </div>
  );
}

function DashboardMockup() {
  return (
    <div
      style={{
        display: "flex",
        height: "420px",
        background: "var(--bg-base)",
        fontSize: "12px",
        fontFamily: "var(--font-jetbrains-mono), monospace",
      }}
    >
      {/* Sidebar */}
      <div
        style={{
          width: "160px",
          flexShrink: 0,
          background: "var(--surface-1)",
          borderRight: "1px solid var(--border-subtle)",
          padding: "16px 0",
        }}
      >
        <div
          style={{
            padding: "0 16px 12px",
            fontWeight: 600,
            color: "var(--text-primary)",
            fontSize: "13px",
            letterSpacing: "-0.01em",
          }}
        >
          ◈ camaleon
        </div>
        <div
          style={{
            height: "1px",
            background: "var(--border-subtle)",
            margin: "0 0 12px",
          }}
        />
        {[
          "Memory",
          "Projects",
          "People",
          "Agents",
          "Analyze",
          "Plan",
          "Generate",
          "Rules",
        ].map((item) => (
          <div
            key={item}
            style={{
              padding: "7px 16px",
              color:
                item === "Memory"
                  ? "var(--accent)"
                  : "var(--text-secondary)",
              cursor: "default",
              fontSize: "12px",
              borderLeft:
                item === "Memory"
                  ? "2px solid var(--accent)"
                  : "2px solid transparent",
            }}
          >
            {item}
          </div>
        ))}
      </div>

      {/* Main */}
      <div style={{ flex: 1, padding: "24px", overflow: "hidden" }}>
        {/* Stats row */}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "1fr 1fr 1fr",
            gap: "12px",
            marginBottom: "24px",
          }}
        >
          {[
            { value: "847", label: "entries" },
            { value: "12", label: "projects" },
            { value: "3", label: "agents" },
          ].map((stat) => (
            <div
              key={stat.label}
              style={{
                background: "var(--surface-1)",
                border: "1px solid var(--border-subtle)",
                padding: "12px 16px",
              }}
            >
              <div
                style={{
                  fontSize: "22px",
                  fontWeight: 700,
                  color: "var(--text-primary)",
                  fontFamily: "var(--font-space-grotesk), sans-serif",
                  lineHeight: 1,
                  marginBottom: "4px",
                }}
              >
                {stat.value}
              </div>
              <div style={{ color: "var(--text-muted)", fontSize: "11px" }}>
                {stat.label}
              </div>
            </div>
          ))}
        </div>

        {/* Recent entries */}
        <div
          style={{
            color: "var(--text-muted)",
            fontSize: "11px",
            marginBottom: "12px",
            letterSpacing: "0.08em",
          }}
        >
          RECENT ENTRIES
        </div>
        {[
          { type: "decision", text: "Use pgvector for semantic search", time: "2h ago" },
          { type: "task", text: "deploy schema to production", time: "5h ago" },
          { type: "note", text: "lesson: always index embedding column", time: "1d ago" },
          { type: "decision", text: "JetBrains Mono for mono elements", time: "2d ago" },
        ].map((entry, i) => (
          <div
            key={i}
            style={{
              display: "flex",
              alignItems: "baseline",
              gap: "8px",
              padding: "7px 0",
              borderBottom: "1px solid var(--border-subtle)",
              color: "var(--text-secondary)",
            }}
          >
            <span
              style={{
                color:
                  entry.type === "decision"
                    ? "var(--accent)"
                    : entry.type === "task"
                    ? "var(--code-green)"
                    : "var(--code-blue)",
                flexShrink: 0,
              }}
            >
              [{entry.type}]
            </span>
            <span style={{ flex: 1, fontSize: "11px" }}>{entry.text}</span>
            <span style={{ color: "var(--text-muted)", fontSize: "10px" }}>
              {entry.time}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
