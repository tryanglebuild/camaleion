"use client";

import { useEffect, useRef } from "react";
import BrowserChrome from "./BrowserChrome";

const CALLOUTS = [
  {
    text: "Every MCP call updates this live.",
    x: "58%",
    y: "100px",
    lineX2: "50%",
    lineY2: "84px",
  },
  {
    text: "Run multi-agent sessions. Watch them work.",
    x: "0%",
    y: "190px",
    anchor: "right",
    lineX2: "15%",
    lineY2: "224px",
  },
  {
    text: "847 entries. pgvector. Search by meaning.",
    x: "58%",
    y: "150px",
    lineX2: "53%",
    lineY2: "132px",
  },
  {
    text: "10 types. Every decision, task, idea — all persistent.",
    x: "58%",
    y: "300px",
    lineX2: "53%",
    lineY2: "290px",
  },
];

export default function PreviewSection() {
  const sectionRef = useRef<HTMLDivElement>(null);
  const lineRefs = useRef<(SVGLineElement | null)[]>([]);

  useEffect(() => {
    const section = sectionRef.current;
    if (!section) return;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          lineRefs.current.forEach((line, i) => {
            if (line) {
              setTimeout(() => line.classList.add("drawn"), i * 200);
            }
          });
          observer.disconnect();
        }
      },
      { threshold: 0.2 }
    );
    observer.observe(section);
    return () => observer.disconnect();
  }, []);

  return (
    <section
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
          ── Live preview ──────────────────────────────
        </p>
        <h2
          style={{
            fontFamily: "var(--font-space-grotesk), sans-serif",
            fontSize: "var(--text-display)",
            fontWeight: 700,
            color: "var(--text-primary)",
            letterSpacing: "-0.03em",
            marginBottom: "64px",
          }}
        >
          Your memory. Always on.
        </h2>

        <div style={{ position: "relative" }}>
          <BrowserChrome />

          {/* SVG callout overlay */}
          <svg
            style={{
              position: "absolute",
              inset: 0,
              width: "100%",
              height: "100%",
              pointerEvents: "none",
              overflow: "visible",
            }}
            aria-hidden="true"
          >
            {CALLOUTS.map((c, i) => (
              <g key={i}>
                <line
                  ref={(el) => { lineRefs.current[i] = el; }}
                  className="callout-line"
                  x1={c.lineX2}
                  y1={c.lineY2}
                  x2={c.x}
                  y2={c.y}
                />
                <circle cx={c.lineX2} cy={c.lineY2} r="3" fill="var(--accent)" />
                <text
                  x={c.x}
                  y={c.y}
                  textAnchor={c.anchor === "right" ? "end" : "start"}
                  style={{
                    fontFamily: "var(--font-jetbrains-mono), monospace",
                    fontSize: "11px",
                    fill: "var(--text-secondary)",
                  }}
                >
                  {c.text}
                </text>
              </g>
            ))}
          </svg>
        </div>
      </div>
    </section>
  );
}
