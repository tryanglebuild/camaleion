"use client";

import { motion } from "framer-motion";

export default function HeroSection() {
  return (
    <section
      style={{
        minHeight: "calc(100vh - 56px)",
        background: "var(--bg-base)",
        position: "relative",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        padding: "80px 40px 120px",
        textAlign: "center",
        overflow: "hidden",
      }}
      className="dot-grid"
    >
      {/* Eyebrow */}
      <motion.p
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.1 }}
        style={{
          fontFamily: "var(--font-jetbrains-mono), monospace",
          fontSize: "var(--text-micro)",
          color: "var(--text-muted)",
          letterSpacing: "0.12em",
          textTransform: "uppercase",
          marginBottom: "32px",
        }}
      >
        memory&nbsp;&nbsp;·&nbsp;&nbsp;context&nbsp;&nbsp;·&nbsp;&nbsp;persistence
      </motion.p>

      {/* Headline */}
      <motion.h1
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, delay: 0.2, ease: [0.16, 1, 0.3, 1] }}
        style={{
          fontFamily: "var(--font-space-grotesk), sans-serif",
          fontSize: "var(--text-mega)",
          fontWeight: 700,
          lineHeight: 0.95,
          letterSpacing: "-0.04em",
          color: "var(--text-primary)",
          marginBottom: "28px",
          maxWidth: "900px",
        }}
      >
        Your AI
        <br />
        finally
        <br />
        <span style={{ color: "var(--accent)" }}>remembers.</span>
        <span className="cursor-blink" style={{ marginLeft: "6px" }}>█</span>
      </motion.h1>

      {/* Sub-copy */}
      <motion.p
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.55, ease: [0.16, 1, 0.3, 1] }}
        style={{
          fontSize: "var(--text-body)",
          color: "var(--text-secondary)",
          lineHeight: 1.7,
          marginBottom: "44px",
          maxWidth: "520px",
        }}
      >
        Context Engine for Claude Code + Copilot CLI.
        <br />
        Persistent memory. Semantic search. Multi-agent.
      </motion.p>

      {/* CTAs */}
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.85 }}
        style={{
          display: "flex",
          gap: "16px",
          alignItems: "center",
          flexWrap: "wrap",
          justifyContent: "center",
          marginBottom: "80px",
        }}
      >
        <a
          href="https://github.com/tryangle/project-ai-system"
          target="_blank"
          rel="noopener noreferrer"
          className="cta-primary"
        >
          ★ Star on GitHub
        </a>
        <a href="#how-it-works" className="cta-secondary">
          How it works →
        </a>
      </motion.div>

      {/* Scroll hint */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.5, delay: 1.6 }}
        style={{
          position: "absolute",
          bottom: "40px",
          left: "50%",
          transform: "translateX(-50%)",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          gap: "8px",
        }}
      >
        <span
          style={{
            fontFamily: "var(--font-jetbrains-mono), monospace",
            fontSize: "10px",
            color: "var(--text-muted)",
            letterSpacing: "0.1em",
            textTransform: "uppercase",
          }}
        >
          scroll to build
        </span>
        <motion.div
          animate={{ y: [0, 6, 0] }}
          transition={{ duration: 1.4, repeat: Infinity, ease: "easeInOut" }}
          style={{ color: "var(--accent)", fontSize: "18px", lineHeight: 1 }}
        >
          ↓
        </motion.div>
      </motion.div>
    </section>
  );
}
