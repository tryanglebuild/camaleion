"use client";

import { motion } from "framer-motion";

const STEPS = [
  {
    n: "01",
    title: "Install the MCP server",
    body: "Add camaleon to your Claude Code or Copilot CLI config. One command. Works immediately.",
    code: "npx @context-engine/cli install",
  },
  {
    n: "02",
    title: "Use 12 MCP tools",
    body: "add_entry, query_context, search_memory, save_analysis, start_session — and 7 more. All available inside Claude Code and Copilot CLI.",
    code: "add_entry({ type: 'decision', title: '...' })",
  },
  {
    n: "03",
    title: "Your AI finally knows",
    body: "Every session is context-aware. No more \"I don't have information about previous sessions\". Your AI has memory — permanently.",
    code: "query_context({ question: 'what did we decide?' })",
  },
];

export default function HowItWorksSection() {
  return (
    <section
      id="how-it-works"
      style={{
        background: "var(--bg-base)",
        padding: "120px 80px",
        position: "relative",
      }}
    >
      <div style={{ maxWidth: "900px", margin: "0 auto" }}>
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.3 }}
          transition={{ duration: 0.5 }}
          style={{ marginBottom: "72px" }}
        >
          <p style={{
            fontFamily: "var(--font-jetbrains-mono), monospace",
            fontSize: "10px",
            color: "var(--accent)",
            letterSpacing: "0.12em",
            textTransform: "uppercase",
            marginBottom: "16px",
          }}>
            How it works
          </p>
          <h2 style={{
            fontFamily: "var(--font-space-grotesk), sans-serif",
            fontSize: "clamp(32px, 4vw, 52px)",
            fontWeight: 700,
            color: "var(--text-primary)",
            letterSpacing: "-0.03em",
            lineHeight: 1.1,
          }}>
            Up in three steps.
          </h2>
        </motion.div>

        {/* Steps */}
        <div style={{ display: "flex", flexDirection: "column", gap: "0" }}>
          {STEPS.map((step, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, x: -20 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true, amount: 0.3 }}
              transition={{ duration: 0.5, delay: i * 0.1 }}
              style={{
                display: "grid",
                gridTemplateColumns: "80px 1fr",
                gap: "32px",
                paddingBottom: "56px",
                borderBottom: i < STEPS.length - 1 ? "1px solid var(--border-subtle)" : "none",
                marginBottom: i < STEPS.length - 1 ? "56px" : "0",
              }}
            >
              {/* Step number */}
              <div>
                <span style={{
                  fontFamily: "var(--font-jetbrains-mono), monospace",
                  fontSize: "clamp(28px, 4vw, 48px)",
                  fontWeight: 700,
                  color: "var(--border-strong)",
                  lineHeight: 1,
                  display: "block",
                }}>
                  {step.n}
                </span>
              </div>

              {/* Content */}
              <div>
                <h3 style={{
                  fontFamily: "var(--font-space-grotesk), sans-serif",
                  fontSize: "20px",
                  fontWeight: 600,
                  color: "var(--text-primary)",
                  marginBottom: "10px",
                  letterSpacing: "-0.01em",
                }}>
                  {step.title}
                </h3>
                <p style={{
                  fontSize: "15px",
                  color: "var(--text-secondary)",
                  lineHeight: 1.7,
                  marginBottom: "16px",
                  maxWidth: "500px",
                }}>
                  {step.body}
                </p>
                <div style={{
                  display: "inline-flex",
                  alignItems: "center",
                  background: "var(--surface-1)",
                  border: "1px solid var(--border-subtle)",
                  borderRadius: "6px",
                  padding: "8px 14px",
                }}>
                  <span style={{
                    fontFamily: "var(--font-jetbrains-mono), monospace",
                    fontSize: "12px",
                    color: "var(--code-green)",
                  }}>
                    {step.code}
                  </span>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
