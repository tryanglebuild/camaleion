"use client";

import { useEffect, useRef, useState } from "react";

interface CommandStationProps {
  num: "01" | "02";
  command: string;
  description: string;
  hovered: boolean;
  onMouseEnter: () => void;
  onMouseLeave: () => void;
}

function CommandStation({
  num,
  command,
  description,
  hovered,
  onMouseEnter,
  onMouseLeave,
}: CommandStationProps) {
  const [copied, setCopied] = useState(false);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  function handleCopy() {
    navigator.clipboard.writeText(command).then(() => {
      setCopied(true);
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
      timeoutRef.current = setTimeout(() => setCopied(false), 2000);
    });
  }

  useEffect(() => {
    return () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
    };
  }, []);

  return (
    <div
      onMouseEnter={onMouseEnter}
      onMouseLeave={onMouseLeave}
      style={{ position: "relative", overflow: "hidden" }}
    >
      {/* Ghost numeral */}
      <div
        aria-hidden="true"
        style={{
          position: "absolute",
          bottom: "-20px",
          right: "16px",
          fontSize: "120px",
          color: "var(--surface-2)",
          fontFamily: "var(--font-jetbrains-mono), monospace",
          userSelect: "none",
          pointerEvents: "none",
          lineHeight: 1,
          opacity: 0.8,
          zIndex: 0,
        }}
      >
        {num}
      </div>

      {/* Step tag */}
      <div
        style={{
          fontFamily: "var(--font-jetbrains-mono), monospace",
          fontSize: "10px",
          color: "var(--text-muted)",
          marginBottom: "12px",
          position: "relative",
          zIndex: 1,
        }}
      >
        [step-{num}]
      </div>

      {/* Command rail */}
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          borderLeft: `3px solid ${hovered ? "var(--accent)" : "var(--border-subtle)"}`,
          padding: "16px 20px",
          position: "relative",
          zIndex: 1,
          transition: "border-left-color 150ms ease",
        }}
      >
        <span
          style={{
            fontFamily: "var(--font-jetbrains-mono), monospace",
            fontSize: "22px",
            color: "var(--accent)",
            fontWeight: 400,
          }}
        >
          {command}
        </span>
        <button
          onClick={handleCopy}
          style={{
            fontFamily: "var(--font-jetbrains-mono), monospace",
            fontSize: "11px",
            color: copied ? "var(--code-green)" : "var(--text-muted)",
            background: "none",
            border: "none",
            cursor: "pointer",
            padding: "4px 8px",
            marginLeft: "16px",
            flexShrink: 0,
            transition: "color 120ms ease",
          }}
          onMouseEnter={(e) => {
            if (!copied)
              (e.currentTarget as HTMLButtonElement).style.color =
                "var(--text-secondary)";
          }}
          onMouseLeave={(e) => {
            if (!copied)
              (e.currentTarget as HTMLButtonElement).style.color =
                "var(--text-muted)";
          }}
          aria-label={`Copy ${command}`}
        >
          {copied ? "[ copied ✓ ]" : "[ copy ]"}
        </button>
      </div>

      {/* Description */}
      <p
        style={{
          fontFamily: "var(--font-space-grotesk), sans-serif",
          fontSize: "14px",
          color: "var(--text-secondary)",
          marginTop: "12px",
          position: "relative",
          zIndex: 1,
        }}
      >
        {description}
      </p>
    </div>
  );
}

export default function InstallSection() {
  const sectionRef = useRef<HTMLDivElement>(null);
  const headingRef = useRef<HTMLDivElement>(null);
  const station1Ref = useRef<HTMLDivElement>(null);
  const station2Ref = useRef<HTMLDivElement>(null);
  const connectorRef = useRef<HTMLDivElement>(null);
  const triggered = useRef(false);

  const [hoveredStation, setHoveredStation] = useState<"01" | "02" | null>(
    null
  );

  useEffect(() => {
    const el = sectionRef.current;
    if (!el) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting && !triggered.current) {
          triggered.current = true;

          if (headingRef.current)
            headingRef.current.setAttribute("data-inview", "true");

          setTimeout(() => {
            if (station1Ref.current)
              station1Ref.current.setAttribute("data-inview", "true");
          }, 100);

          setTimeout(() => {
            if (station2Ref.current)
              station2Ref.current.setAttribute("data-inview", "true");
          }, 200);

          setTimeout(() => {
            if (connectorRef.current)
              connectorRef.current.setAttribute("data-inview-clip", "true");
          }, 300);

          observer.disconnect();
        }
      },
      { threshold: 0.15 }
    );

    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  return (
    <section
      id="install"
      ref={sectionRef}
      style={{
        background: "var(--bg-base)",
        padding: "120px 40px",
        borderTop: "1px solid var(--border-subtle)",
      }}
    >
      <div style={{ maxWidth: "1200px", margin: "0 auto" }}>
        {/* Eyebrow + heading */}
        <div ref={headingRef} data-inview>
          <p
            style={{
              fontFamily: "var(--font-jetbrains-mono), monospace",
              fontSize: "11px",
              color: "var(--text-muted)",
              letterSpacing: "0.1em",
              marginBottom: "16px",
            }}
          >
            ── install ──────────────────────────────
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
            Two commands.
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
            Online in 60s.
          </h2>
        </div>

        {/* Stations layout */}
        <div
          className="install-flex"
          style={{ display: "flex", alignItems: "flex-start" }}
        >
          {/* Station 01 */}
          <div
            ref={station1Ref}
            data-inview
            style={{ flex: "0 0 48%" }}
          >
            <CommandStation
              num="01"
              command="npx camaleon-web"
              description="Installs and runs the web dashboard on port 4069"
              hovered={hoveredStation === "01"}
              onMouseEnter={() => setHoveredStation("01")}
              onMouseLeave={() => setHoveredStation(null)}
            />
          </div>

          {/* Connector */}
          <div
            className="install-connector"
            style={{
              flex: "0 0 4%",
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              justifyContent: "center",
              paddingTop: "48px",
              gap: "6px",
            }}
          >
            <div
              ref={connectorRef}
              data-inview-clip
              style={{
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                gap: "6px",
              }}
            >
              {/* Dashed vertical line */}
              <div
                style={{
                  width: "1px",
                  height: "80px",
                  background:
                    "repeating-linear-gradient(to bottom, var(--accent) 0px, var(--accent) 4px, transparent 4px, transparent 8px)",
                }}
              />
              <span
                style={{
                  fontFamily: "var(--font-jetbrains-mono), monospace",
                  fontSize: "10px",
                  color: "var(--text-muted)",
                }}
              >
                then
              </span>
              <span
                style={{
                  color: "var(--accent)",
                  fontSize: "14px",
                }}
              >
                →
              </span>
            </div>
          </div>

          {/* Station 02 */}
          <div
            ref={station2Ref}
            data-inview
            className="install-station2"
            style={{ flex: "0 0 44%", marginTop: "40px" }}
          >
            <CommandStation
              num="02"
              command="npx camaleon-mcp"
              description="Installs and configures the MCP server for Claude Code"
              hovered={hoveredStation === "02"}
              onMouseEnter={() => setHoveredStation("02")}
              onMouseLeave={() => setHoveredStation(null)}
            />
          </div>
        </div>

        {/* Bottom annotation */}
        <p
          style={{
            fontFamily: "var(--font-jetbrains-mono), monospace",
            fontSize: "11px",
            color: "var(--text-muted)",
            marginTop: "48px",
            letterSpacing: "0.04em",
          }}
        >
          ── camaleon-web runs on :4069 · camaleon-mcp configures
          claude_desktop_config.json ──────
        </p>
      </div>

      <style>{`
        @media (max-width: 768px) {
          .install-flex {
            flex-direction: column !important;
            gap: 40px;
          }
          .install-flex > div {
            flex: none !important;
            width: 100% !important;
            margin-top: 0 !important;
          }
          .install-connector {
            display: none !important;
          }
        }
      `}</style>
    </section>
  );
}
