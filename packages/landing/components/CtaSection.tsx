"use client";

import { useEffect, useRef } from "react";

const WORDS = ["It's", "open", "source."];
const LINE2_WORDS = ["Take", "it.", "Make", "it", "yours."];

export default function CtaSection() {
  const sectionRef = useRef<HTMLDivElement>(null);
  const wordRefs = useRef<(HTMLSpanElement | null)[]>([]);
  const line2Refs = useRef<(HTMLSpanElement | null)[]>([]);
  const ctaRef = useRef<HTMLAnchorElement>(null);
  const footerRef = useRef<HTMLParagraphElement>(null);
  const shown = useRef(false);

  useEffect(() => {
    const section = sectionRef.current;
    if (!section) return;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting && !shown.current) {
          shown.current = true;

          WORDS.forEach((_, i) => {
            const el = wordRefs.current[i];
            if (!el) return;
            setTimeout(() => {
              el.style.opacity = "1";
              el.style.transform = "translateY(0)";
            }, i * 120);
          });

          LINE2_WORDS.forEach((_, i) => {
            const el = line2Refs.current[i];
            if (!el) return;
            setTimeout(() => {
              el.style.opacity = "1";
              el.style.transform = "translateY(0)";
            }, WORDS.length * 120 + i * 80);
          });

          const totalDelay = (WORDS.length + LINE2_WORDS.length) * 120;

          if (ctaRef.current) {
            setTimeout(() => {
              ctaRef.current!.style.opacity = "1";
              ctaRef.current!.style.transform = "translateY(0)";
            }, totalDelay + 100);
          }

          if (footerRef.current) {
            setTimeout(() => {
              footerRef.current!.style.opacity = "1";
            }, totalDelay + 400);
          }

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
        padding: "20vh 40px",
        borderTop: "1px solid var(--border-subtle)",
        textAlign: "center",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        gap: "48px",
      }}
    >
      <div>
        {/* Line 1 */}
        <h2
          style={{
            fontFamily: "var(--font-space-grotesk), sans-serif",
            fontSize: "var(--text-display)",
            fontWeight: 700,
            letterSpacing: "-0.03em",
            lineHeight: 1.1,
            color: "var(--text-primary)",
            marginBottom: "8px",
            display: "flex",
            flexWrap: "wrap",
            justifyContent: "center",
            gap: "0.25em",
          }}
        >
          {WORDS.map((word, i) => (
            <span
              key={i}
              ref={(el) => { wordRefs.current[i] = el; }}
              style={{
                display: "inline-block",
                opacity: 0,
                transform: "translateY(12px)",
                transition: "opacity 400ms ease, transform 400ms ease",
              }}
            >
              {word}
            </span>
          ))}
        </h2>

        {/* Line 2 */}
        <h2
          style={{
            fontFamily: "var(--font-space-grotesk), sans-serif",
            fontSize: "var(--text-display)",
            fontWeight: 400,
            letterSpacing: "-0.03em",
            lineHeight: 1.1,
            color: "var(--text-secondary)",
            display: "flex",
            flexWrap: "wrap",
            justifyContent: "center",
            gap: "0.25em",
          }}
        >
          {LINE2_WORDS.map((word, i) => (
            <span
              key={i}
              ref={(el) => { line2Refs.current[i] = el; }}
              style={{
                display: "inline-block",
                opacity: 0,
                transform: "translateY(12px)",
                transition: "opacity 400ms ease, transform 400ms ease",
              }}
            >
              {word}
            </span>
          ))}
        </h2>
      </div>

      <a
        ref={ctaRef}
        href="https://github.com/tryangle/project-ai-system"
        target="_blank"
        rel="noopener noreferrer"
        className="cta-github"
        style={{
          opacity: 0,
          transform: "translateY(8px)",
          transition: "opacity 600ms ease, transform 600ms ease, background 120ms ease, color 120ms ease, transform 120ms ease",
        }}
      >
        ★ github.com/tryangle/project-ai-system
      </a>

      <p
        ref={footerRef}
        style={{
          fontFamily: "var(--font-jetbrains-mono), monospace",
          fontSize: "var(--text-micro)",
          color: "var(--text-muted)",
          letterSpacing: "0.06em",
          opacity: 0,
          transition: "opacity 600ms ease",
        }}
      >
        ◈ camaleon&nbsp;&nbsp;·&nbsp;&nbsp;context engine&nbsp;&nbsp;·&nbsp;&nbsp;MIT License
      </p>
    </section>
  );
}
