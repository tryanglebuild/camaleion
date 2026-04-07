"use client";

import { motion } from "framer-motion";

export default function CtaSection() {
  return (
    <section
      style={{
        background: "var(--surface-1)",
        borderTop: "1px solid var(--border-subtle)",
        padding: "120px 80px 80px",
      }}
    >
      <div style={{ maxWidth: "700px", margin: "0 auto", textAlign: "center" }}>
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.3 }}
          transition={{ duration: 0.5 }}
        >
          <p style={{
            fontFamily: "var(--font-jetbrains-mono), monospace",
            fontSize: "10px",
            color: "var(--accent)",
            letterSpacing: "0.12em",
            textTransform: "uppercase",
            marginBottom: "24px",
          }}>
            Open source · Free
          </p>
          <h2 style={{
            fontFamily: "var(--font-space-grotesk), sans-serif",
            fontSize: "clamp(36px, 5vw, 64px)",
            fontWeight: 700,
            color: "var(--text-primary)",
            letterSpacing: "-0.04em",
            lineHeight: 0.95,
            marginBottom: "28px",
          }}>
            Give your AI<br />
            <span style={{ color: "var(--accent)" }}>a memory.</span>
          </h2>
          <p style={{
            fontSize: "16px",
            color: "var(--text-secondary)",
            lineHeight: 1.7,
            marginBottom: "48px",
          }}>
            12 MCP tools. pgvector semantic search. Multi-agent sessions.
            <br />
            Works with Claude Code and GitHub Copilot CLI. Open source.
          </p>
          <div style={{ display: "flex", gap: "16px", justifyContent: "center", flexWrap: "wrap" }}>
            <a
              href="https://github.com/tryangle/project-ai-system"
              target="_blank"
              rel="noopener noreferrer"
              className="cta-primary"
            >
              ★ Star on GitHub
            </a>
            <a
              href="https://github.com/tryangle/project-ai-system#readme"
              target="_blank"
              rel="noopener noreferrer"
              className="cta-secondary"
            >
              Read the docs →
            </a>
          </div>
        </motion.div>
      </div>

      {/* Footer */}
      <div style={{
        borderTop: "1px solid var(--border-subtle)",
        marginTop: "80px",
        paddingTop: "32px",
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        flexWrap: "wrap",
        gap: "16px",
      }}>
        <span style={{
          fontFamily: "var(--font-space-grotesk), sans-serif",
          fontSize: "14px",
          fontWeight: 600,
          color: "var(--text-muted)",
          letterSpacing: "-0.01em",
        }}>
          ◈ camaleon
        </span>
        <div style={{ display: "flex", gap: "24px" }}>
          {[
            { label: "GitHub",  href: "https://github.com/tryangle/project-ai-system" },
            { label: "Docs",    href: "#how-it-works" },
          ].map((l) => (
            <a
              key={l.label}
              href={l.href}
              target={l.href.startsWith("http") ? "_blank" : undefined}
              rel={l.href.startsWith("http") ? "noopener noreferrer" : undefined}
              style={{
                fontFamily: "var(--font-jetbrains-mono), monospace",
                fontSize: "11px",
                color: "var(--text-muted)",
                textDecoration: "none",
                transition: "color 120ms ease",
              }}
              onMouseEnter={(e) => (e.currentTarget.style.color = "var(--text-primary)")}
              onMouseLeave={(e) => (e.currentTarget.style.color = "var(--text-muted)")}
            >
              {l.label}
            </a>
          ))}
        </div>
        <span style={{
          fontFamily: "var(--font-jetbrains-mono), monospace",
          fontSize: "10px",
          color: "var(--text-muted)",
        }}>
          MIT License
        </span>
      </div>
    </section>
  );
}
