"use client";

import { useEffect, useRef } from "react";

const PILLARS = [
  {
    num: "01",
    title: "MCP Server",
    body: "12 tools. Native Claude Code + Copilot CLI integration. Runs in your environment.",
    bg: "var(--surface-1)",
  },
  {
    num: "02",
    title: "Supabase + pgvector",
    body: "Persistent storage. Vector embeddings. Semantic similarity search at query time.",
    bg: "var(--bg-base)",
  },
  {
    num: "03",
    title: "Web UI",
    body: "Real-time dashboard. Every MCP call reflected instantly. Built with Next.js 15.",
    bg: "var(--surface-1)",
  },
];

const CODE_TRACE = [
  'query_context("what stack for auth?")',
  "→  embed query",
  "→  cosine similarity",
  "→  3 matches",
  "→  Claude uses",
];

function useInView(
  ref: React.RefObject<Element | null>,
  onEnter: () => void,
  threshold = 0.15
) {
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          onEnter();
          observer.disconnect();
        }
      },
      { threshold }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, [ref, onEnter, threshold]);
}

export default function HowItWorksSection() {
  const sectionRef = useRef<HTMLDivElement>(null);
  const traceRef = useRef<HTMLDivElement>(null);
  const traceSpans = useRef<(HTMLSpanElement | null)[]>([]);
  const pillarsShown = useRef(false);
  const traceShown = useRef(false);

  useInView(sectionRef, () => {
    if (pillarsShown.current) return;
    pillarsShown.current = true;
    document.querySelectorAll(".pillar-anim").forEach((el, i) => {
      setTimeout(() => {
        (el as HTMLElement).setAttribute("data-inview", "true");
      }, i * 100);
    });
  });

  useInView(traceRef, () => {
    if (traceShown.current) return;
    traceShown.current = true;
    traceSpans.current.forEach((span, i) => {
      if (!span) return;
      setTimeout(() => {
        span.style.opacity = "1";
        span.style.transform = "translateY(0)";
      }, i * 200);
    });
  });

  return (
    <section
      id="how-it-works"
      ref={sectionRef}
      style={{
        background: "var(--bg-base)",
        padding: "120px 40px",
        borderTop: "1px solid var(--border-subtle)",
      }}
    >
      <div style={{ maxWidth: "1200px", margin: "0 auto" }}>
        <p
          style={{
            fontFamily: "var(--font-jetbrains-mono), monospace",
            fontSize: "var(--text-micro)",
            color: "var(--text-muted)",
            letterSpacing: "0.1em",
            marginBottom: "16px",
          }}
        >
          ── How it works ──────────────────────────────
        </p>
        <h2
          style={{
            fontFamily: "var(--font-space-grotesk), sans-serif",
            fontSize: "var(--text-display)",
            fontWeight: 700,
            color: "var(--text-primary)",
            letterSpacing: "-0.03em",
            marginBottom: "8px",
          }}
        >
          Three components.
        </h2>
        <h2
          style={{
            fontFamily: "var(--font-space-grotesk), sans-serif",
            fontSize: "var(--text-display)",
            fontWeight: 400,
            color: "var(--text-secondary)",
            letterSpacing: "-0.03em",
            marginBottom: "64px",
          }}
        >
          One pipeline.
        </h2>

        {/* Pillars */}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(3, 1fr)",
            gap: "1px",
            background: "var(--border-subtle)",
            marginBottom: "48px",
          }}
        >
          {PILLARS.map((pillar, i) => (
            <div
              key={pillar.num}
              className="pillar-anim pillar"
              data-inview
              style={{
                background: pillar.bg,
                border: "1px solid var(--border-subtle)",
                padding: "40px",
                position: "relative",
                transitionDelay: `${i * 100}ms`,
              }}
            >
              {/* Decorative number */}
              <div
                style={{
                  fontFamily: "var(--font-jetbrains-mono), monospace",
                  fontSize: "48px",
                  fontWeight: 600,
                  color: "var(--surface-2)",
                  lineHeight: 1,
                  marginBottom: "24px",
                  userSelect: "none",
                }}
              >
                {pillar.num}
              </div>

              <h3
                style={{
                  fontFamily: "var(--font-space-grotesk), sans-serif",
                  fontSize: "20px",
                  fontWeight: 700,
                  color: "var(--text-primary)",
                  marginBottom: "12px",
                }}
              >
                {pillar.title}
              </h3>
              <p
                style={{
                  fontSize: "var(--text-body)",
                  color: "var(--text-secondary)",
                  lineHeight: 1.7,
                }}
              >
                {pillar.body}
              </p>

              {/* Dashed connector */}
              {i < 2 && (
                <svg
                  style={{
                    position: "absolute",
                    right: "-20px",
                    top: "50%",
                    transform: "translateY(-50%)",
                    zIndex: 1,
                    overflow: "visible",
                  }}
                  width="40"
                  height="2"
                  aria-hidden="true"
                >
                  <line
                    x1="0"
                    y1="1"
                    x2="40"
                    y2="1"
                    stroke="var(--accent)"
                    strokeWidth="1"
                    strokeDasharray="4 4"
                    style={{
                      animation: "march 600ms linear infinite",
                    }}
                  />
                </svg>
              )}
            </div>
          ))}
        </div>

        {/* Code trace */}
        <div
          ref={traceRef}
          style={{
            padding: "32px 40px",
            background: "var(--accent-dim)",
            borderLeft: "2px solid var(--accent)",
            overflow: "auto",
          }}
        >
          <div
            style={{
              display: "flex",
              gap: "12px",
              flexWrap: "wrap",
              alignItems: "center",
            }}
          >
            {CODE_TRACE.map((segment, i) => (
              <span
                key={i}
                ref={(el) => { traceSpans.current[i] = el; }}
                style={{
                  fontFamily: "var(--font-jetbrains-mono), monospace",
                  fontSize: "13px",
                  color: "var(--accent)",
                  opacity: 0,
                  transform: "translateY(8px)",
                  transition: "opacity 300ms ease, transform 300ms ease",
                  whiteSpace: "nowrap",
                }}
              >
                {segment}
              </span>
            ))}
          </div>
        </div>
      </div>

      <style>{`
        @media (max-width: 768px) {
          #how-it-works [style*="grid-template-columns: repeat(3"] {
            grid-template-columns: 1fr !important;
          }
        }
      `}</style>
    </section>
  );
}
