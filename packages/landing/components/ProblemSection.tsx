"use client";

import { useEffect, useRef } from "react";

function useInView(ref: React.RefObject<Element | null>, threshold = 0.15) {
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

function Panel({
  label,
  labelColor,
  borderColor,
  bg,
  content,
  dimText,
}: {
  label: string;
  labelColor: string;
  borderColor: string;
  bg: string;
  content: React.ReactNode;
  dimText?: boolean;
}) {
  const ref = useRef<HTMLDivElement>(null);
  useInView(ref);

  return (
    <div
      ref={ref}
      data-inview
      style={{
        flex: 1,
        background: bg,
        borderLeft: `2px solid ${borderColor}`,
        padding: "40px 48px",
        minHeight: "320px",
      }}
    >
      <p
        style={{
          fontFamily: "var(--font-jetbrains-mono), monospace",
          fontSize: "var(--text-micro)",
          color: labelColor,
          marginBottom: "40px",
          letterSpacing: "0.08em",
        }}
      >
        {label}
      </p>
      <div
        style={{
          fontFamily: "var(--font-space-grotesk), sans-serif",
          fontSize: "clamp(22px, 3vw, 36px)",
          fontWeight: 400,
          lineHeight: 1.4,
          color: dimText ? "var(--text-secondary)" : "var(--text-primary)",
        }}
      >
        {content}
      </div>
    </div>
  );
}

export default function ProblemSection() {
  return (
    <section
      style={{
        background: "var(--bg-base)",
        padding: "120px 0",
        borderTop: "1px solid var(--border-subtle)",
      }}
    >
      <div
        style={{
          maxWidth: "1200px",
          margin: "0 auto",
          padding: "0 40px",
          marginBottom: "60px",
        }}
      >
        <p
          style={{
            fontFamily: "var(--font-jetbrains-mono), monospace",
            fontSize: "var(--text-micro)",
            color: "var(--text-muted)",
            letterSpacing: "0.1em",
            marginBottom: "16px",
          }}
        >
          ── The problem ──────────────────────────────
        </p>
      </div>

      <div style={{ display: "flex" }}>
        <Panel
          label="WITHOUT ──────────────"
          labelColor="var(--text-muted)"
          borderColor="var(--border-strong)"
          bg="var(--surface-1)"
          dimText
          content={
            <>
              <p>No persistence.</p>
              <p>No context.</p>
              <p>Each session is</p>
              <p>a blank slate.</p>
              <br />
              <p>You are the memory.</p>
              <br />
              <p
                style={{
                  fontSize: "var(--text-body)",
                  color: "var(--text-muted)",
                  lineHeight: 1.8,
                }}
              >
                You re-explain your stack
                <br />
                every time. Every decision.
                <br />
                Every convention.
              </p>
            </>
          }
        />

        <Panel
          label="WITH CAMALEON ──────────────"
          labelColor="var(--accent)"
          borderColor="var(--accent)"
          bg="#1A1208"
          content={
            <>
              <p
                style={{
                  fontFamily: "var(--font-jetbrains-mono), monospace",
                  fontSize: "15px",
                  color: "var(--accent)",
                  lineHeight: 1.6,
                  marginBottom: "24px",
                }}
              >
                {`query_context("what stack`}
                <br />
                {`did we choose for auth?")`}
              </p>
              <p
                style={{
                  fontSize: "var(--text-body)",
                  color: "var(--text-secondary)",
                  lineHeight: 1.8,
                  marginBottom: "24px",
                }}
              >
                → 1 decision entry,
                <br />
                &nbsp;&nbsp;3 months ago.
                <br />
                &nbsp;&nbsp;Returned in 180ms.
              </p>
              <p>You asked once.</p>
              <p>It remembers forever.</p>
            </>
          }
        />
      </div>

      <style>{`
        @media (max-width: 768px) {
          section > div:last-child {
            flex-direction: column !important;
          }
        }
      `}</style>
    </section>
  );
}
