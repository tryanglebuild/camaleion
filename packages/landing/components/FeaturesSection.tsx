"use client";

import { useEffect, useRef } from "react";
import EntryTag from "./EntryTag";

function useInView(ref: React.RefObject<Element | null>, threshold = 0.1) {
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          el.setAttribute("data-inview", "true");
          observer.disconnect();
        }
      },
      { threshold }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, [ref, threshold]);
}

function useInViewScan(ref: React.RefObject<Element | null>, threshold = 0.1) {
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          el.setAttribute("data-inview-scan", "true");
          observer.disconnect();
        }
      },
      { threshold }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, [ref, threshold]);
}

const MEMORY_TAGS = ["task", "note", "decision", "idea", "log", "analysis", "plan", "post", "file", "meet"];
const AGENT_TAGS = ["designer", "backend", "frontend", "tester", "orchestrator"];

const SMALL_PANELS = [
  {
    title: "Projects",
    body: "Track every project with name, stack, status, and company. All memory entries link back to a project.",
  },
  {
    title: "People",
    body: "Profiles for team members, clients, and contacts. Decisions and tasks link to the people who made them.",
  },
  {
    title: "Rules",
    body: "Persistent AI behavior rules. Define how your agents should think, prioritize, and respond across sessions.",
  },
  {
    title: "MCP Server",
    body: "12 tools. Native Claude Code + Copilot CLI integration. Runs locally. No cloud required.",
  },
];

export default function FeaturesSection() {
  const ref1a = useRef<HTMLDivElement>(null);
  const ref1b = useRef<HTMLDivElement>(null);
  const ref2 = useRef<HTMLDivElement>(null);
  const small0 = useRef<HTMLDivElement>(null);
  const small1 = useRef<HTMLDivElement>(null);
  const small2 = useRef<HTMLDivElement>(null);
  const small3 = useRef<HTMLDivElement>(null);
  const smallRefs = [small0, small1, small2, small3];

  useInView(ref1a);
  useInView(ref1b, 0.1);
  useInViewScan(ref2);
  useInView(small0, 0.1);
  useInView(small1, 0.1);
  useInView(small2, 0.1);
  useInView(small3, 0.1);

  return (
    <section
      style={{
        background: "var(--bg-base)",
        borderTop: "1px solid var(--border-subtle)",
      }}
    >
      <div
        style={{
          maxWidth: "1200px",
          margin: "0 auto",
          padding: "120px 40px 0",
        }}
      >
        <p
          style={{
            fontFamily: "var(--font-jetbrains-mono), monospace",
            fontSize: "var(--text-micro)",
            color: "var(--text-muted)",
            letterSpacing: "0.1em",
            marginBottom: "60px",
          }}
        >
          ── What's inside ──────────────────────────────
        </p>

        {/* Row 1 */}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "1fr 1fr",
            gap: "1px",
            background: "var(--border-subtle)",
            marginBottom: "1px",
          }}
        >
          {/* Memory Engine */}
          <div
            ref={ref1a}
            data-inview
            className="feature-panel"
            style={{
              background: "var(--bg-base)",
              padding: "48px",
              transitionDelay: "0ms",
            }}
          >
            <div style={{ fontSize: "28px", marginBottom: "16px" }}>🧠</div>
            <h3
              style={{
                fontFamily: "var(--font-space-grotesk), sans-serif",
                fontSize: "22px",
                fontWeight: 700,
                color: "var(--text-primary)",
                marginBottom: "12px",
              }}
            >
              Memory Engine
            </h3>
            <p
              style={{
                fontSize: "var(--text-body)",
                color: "var(--text-secondary)",
                lineHeight: 1.7,
                marginBottom: "24px",
              }}
            >
              10 entry types. Every decision, task, note, idea, log, analysis,
              plan, post, file, meeting.
            </p>
            <div style={{ display: "flex", flexWrap: "wrap", gap: "6px" }}>
              {MEMORY_TAGS.map((t) => (
                <EntryTag key={t} label={t} />
              ))}
            </div>
          </div>

          {/* Multi-Agent System */}
          <div
            ref={ref1b}
            data-inview
            className="feature-panel"
            style={{
              background: "var(--bg-base)",
              padding: "48px",
              transitionDelay: "80ms",
            }}
          >
            <div style={{ fontSize: "28px", marginBottom: "16px" }}>⚡</div>
            <h3
              style={{
                fontFamily: "var(--font-space-grotesk), sans-serif",
                fontSize: "22px",
                fontWeight: 700,
                color: "var(--text-primary)",
                marginBottom: "12px",
              }}
            >
              Multi-Agent System
            </h3>
            <p
              style={{
                fontSize: "var(--text-body)",
                color: "var(--text-secondary)",
                lineHeight: 1.7,
                marginBottom: "24px",
              }}
            >
              Orchestrator + specialized agents. Real-time session logs. Full
              conversation history via conversation.jsonl
            </p>
            <div style={{ display: "flex", flexWrap: "wrap", gap: "6px" }}>
              {AGENT_TAGS.map((t) => (
                <EntryTag key={t} label={t} variant="agent" />
              ))}
            </div>
          </div>
        </div>

        {/* Row 2 — Semantic Search full-width */}
      </div>

      <div
        ref={ref2}
        data-inview-scan
        style={{
          background: "#1A1208",
          borderTop: "1px solid var(--accent)",
          borderBottom: "1px solid var(--accent)",
          borderLeft: "4px solid var(--accent)",
          padding: "32px 48px",
          margin: "1px 0",
        }}
      >
        <div
          style={{
            maxWidth: "1200px",
            margin: "0 auto",
          }}
        >
          <h3
            style={{
              fontFamily: "var(--font-space-grotesk), sans-serif",
              fontSize: "22px",
              fontWeight: 700,
              color: "var(--text-primary)",
              marginBottom: "12px",
              display: "flex",
              alignItems: "center",
              gap: "12px",
            }}
          >
            🔍 Semantic Search
          </h3>
          <p
            style={{
              fontSize: "var(--text-body)",
              color: "var(--text-secondary)",
              lineHeight: 1.7,
              maxWidth: "720px",
            }}
          >
            pgvector. Search by meaning, not keywords. Query your entire memory
            with natural language. Ask{" "}
            <span
              style={{
                fontFamily: "var(--font-jetbrains-mono), monospace",
                color: "var(--accent)",
              }}
            >
              "what did we decide about auth?"
            </span>{" "}
            and get the exact decision entry from 3 months ago.
          </p>
        </div>
      </div>

      {/* Row 3 — Small panels */}
      <div
        style={{
          maxWidth: "1200px",
          margin: "0 auto",
          padding: "0 40px 120px",
        }}
      >
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(4, 1fr)",
            gap: "1px",
            background: "var(--border-subtle)",
            marginTop: "1px",
          }}
        >
          {SMALL_PANELS.map((panel, i) => (
            <div
              key={panel.title}
              ref={smallRefs[i]}
              data-inview
              className="feature-panel"
              style={{
                background: "var(--bg-base)",
                padding: "32px",
                minHeight: "200px",
                transitionDelay: `${i * 80}ms`,
              }}
            >
              <h4
                style={{
                  fontFamily: "var(--font-space-grotesk), sans-serif",
                  fontSize: "var(--text-small)",
                  fontWeight: 600,
                  color: "var(--text-primary)",
                  marginBottom: "12px",
                  letterSpacing: "-0.01em",
                }}
              >
                {panel.title}
              </h4>
              <p
                style={{
                  fontSize: "13px",
                  color: "var(--text-secondary)",
                  lineHeight: 1.7,
                }}
              >
                {panel.body}
              </p>
            </div>
          ))}
        </div>
      </div>

      <style>{`
        @media (max-width: 900px) {
          .features-row1 { grid-template-columns: 1fr !important; }
          .features-row3 { grid-template-columns: 1fr 1fr !important; }
        }
        @media (max-width: 600px) {
          .features-row3 { grid-template-columns: 1fr !important; }
        }
      `}</style>
    </section>
  );
}
