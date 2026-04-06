"use client";

import { useEffect, useRef } from "react";

export default function LightModeSection() {
  const sectionRef = useRef<HTMLDivElement>(null);
  const cardRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const section = sectionRef.current;
    const card = cardRef.current;
    if (!section || !card) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          section.setAttribute("data-inview-clip", "true");
          setTimeout(() => {
            card.setAttribute("data-inview-x", "true");
          }, 300);
          observer.disconnect();
        }
      },
      { threshold: 0.1 }
    );
    observer.observe(section);
    return () => observer.disconnect();
  }, []);

  return (
    <section
      ref={sectionRef}
      data-inview-clip
      data-theme="light"
      style={{
        background: "#F4F0E8",
        padding: "120px 40px",
      }}
      className="dot-grid-light"
    >
      <div style={{ maxWidth: "1200px", margin: "0 auto" }}>
        <p
          style={{
            fontFamily: "var(--font-jetbrains-mono), monospace",
            fontSize: "var(--text-micro)",
            color: "#9A9590",
            letterSpacing: "0.1em",
            marginBottom: "40px",
          }}
        >
          ── Your context. Both ways. ──────────────────
        </p>

        <h2
          style={{
            fontFamily: "var(--font-space-grotesk), sans-serif",
            fontSize: "var(--text-display)",
            fontWeight: 700,
            color: "#18160F",
            letterSpacing: "-0.03em",
            lineHeight: 1.1,
            marginBottom: "16px",
          }}
        >
          Your context doesn't care
          <br />
          what theme you're in.
        </h2>
        <p
          style={{
            fontSize: "var(--text-body)",
            color: "#5A5550",
            lineHeight: 1.7,
            marginBottom: "64px",
          }}
        >
          The memory is the same.
          <br />
          Choose your environment.
        </p>

        {/* Project card */}
        <div
          ref={cardRef}
          data-inview-x
          style={{
            background: "#EDE8DE",
            border: "1px solid #D4CEC4",
            borderLeft: "3px solid #C44C2C",
            borderRadius: 0,
            padding: "32px 40px",
            maxWidth: "600px",
          }}
        >
          <div
            style={{
              fontFamily: "var(--font-jetbrains-mono), monospace",
              fontSize: "var(--text-small)",
              color: "#18160F",
              marginBottom: "8px",
              fontWeight: 600,
            }}
          >
            📁&nbsp; camaleon&nbsp;
            <span
              style={{
                color: "#9A9590",
                fontWeight: 400,
              }}
            >
              · active
            </span>
          </div>
          <div
            style={{
              fontFamily: "var(--font-jetbrains-mono), monospace",
              fontSize: "12px",
              color: "#9A9590",
              marginBottom: "20px",
            }}
          >
            Stack: Next.js · Supabase · MCP · pgvector
          </div>

          <div
            style={{
              height: "1px",
              background: "#D4CEC4",
              marginBottom: "20px",
            }}
          />

          <div
            style={{
              fontFamily: "var(--font-jetbrains-mono), monospace",
              fontSize: "12px",
              color: "#5A5550",
              marginBottom: "12px",
              letterSpacing: "0.06em",
            }}
          >
            Recent decisions:
          </div>

          {[
            "Use pgvector for semantic search",
            "JetBrains Mono for mono elements",
            "Amber accent — not blue",
          ].map((d) => (
            <div
              key={d}
              style={{
                fontFamily: "var(--font-jetbrains-mono), monospace",
                fontSize: "13px",
                color: "#5A5550",
                marginBottom: "8px",
                display: "flex",
                gap: "8px",
              }}
            >
              <span style={{ color: "#C44C2C", flexShrink: 0 }}>·</span>
              <span>
                <span style={{ color: "#C44C2C" }}>[decision]</span> {d}
              </span>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
