"use client";

import { useState, useEffect, useRef } from "react";

const TERMINAL_LINES = [
  { text: '> query_context("what did we decide about auth?")', delay: 0 },
  { text: "", delay: 300 },
  { text: "✓ Found 3 relevant entries", delay: 700, color: "var(--code-green)" },
  { text: "", delay: 1000 },
  { text: "· [decision] Use JWT with Supabase Auth", delay: 1200 },
  { text: "  project: camaleon · 3 months ago", delay: 1400, muted: true },
  { text: "", delay: 1600 },
  { text: "· [task] Implement refresh token rotation", delay: 1800 },
  { text: "  status: done · project: camaleon", delay: 2000, muted: true },
  { text: "", delay: 2200 },
  { text: "· [note] Never store tokens in localStorage", delay: 2400 },
  { text: "  tags: [security] [auth] [lesson]", delay: 2600, muted: true },
];

export default function TerminalPanel() {
  const [visibleLines, setVisibleLines] = useState<number>(0);
  const started = useRef(false);

  useEffect(() => {
    if (started.current) return;
    started.current = true;

    TERMINAL_LINES.forEach((line, i) => {
      setTimeout(() => {
        setVisibleLines((prev) => Math.max(prev, i + 1));
      }, 1400 + line.delay); // offset by hero animation timing
    });
  }, []);

  return (
    <div
      style={{
        background: "var(--surface-1)",
        border: "1px solid var(--border-subtle)",
        width: "520px",
        maxWidth: "90vw",
        fontFamily: "var(--font-jetbrains-mono), monospace",
        fontSize: "13px",
        lineHeight: 1.7,
        overflow: "hidden",
      }}
    >
      {/* Terminal header */}
      <div
        style={{
          height: "36px",
          background: "var(--surface-2)",
          borderBottom: "1px solid var(--border-subtle)",
          display: "flex",
          alignItems: "center",
          padding: "0 16px",
          gap: "8px",
        }}
      >
        {["#C44C2C", "#CCA85A", "#6EC498"].map((c, i) => (
          <div
            key={i}
            style={{
              width: "10px",
              height: "10px",
              borderRadius: "50%",
              background: c,
              opacity: 0.7,
            }}
          />
        ))}
        <span
          style={{
            marginLeft: "12px",
            fontSize: "11px",
            color: "var(--text-muted)",
          }}
        >
          claude code — context engine
        </span>
      </div>

      {/* Terminal content */}
      <div
        style={{
          padding: "20px 24px",
          minHeight: "280px",
        }}
      >
        {TERMINAL_LINES.slice(0, visibleLines).map((line, i) => (
          <div
            key={i}
            style={{
              color: line.color
                ? line.color
                : line.muted
                ? "var(--text-muted)"
                : i === 0
                ? "var(--accent)"
                : "var(--text-primary)",
              minHeight: "1.7em",
              opacity: 1,
            }}
          >
            {line.text}
          </div>
        ))}
        {visibleLines < TERMINAL_LINES.length && (
          <span className="cursor-blink">█</span>
        )}
      </div>
    </div>
  );
}
