"use client";

import { motion } from "framer-motion";
import dynamic from "next/dynamic";
import { fadeIn, fadeInUp, slideFromLeft } from "@/lib/animations";

const TerminalPanel = dynamic(() => import("./TerminalPanel"), { ssr: false });

export default function HeroSection() {
  return (
    <section
      style={{
        minHeight: "calc(100vh - 56px)",
        background: "var(--bg-base)",
        position: "relative",
        display: "flex",
        alignItems: "center",
        overflow: "hidden",
        padding: "80px 40px",
      }}
      className="dot-grid"
    >
      {/* Left column */}
      <div
        style={{
          flex: "0 0 55%",
          maxWidth: "55%",
          position: "relative",
          zIndex: 2,
        }}
      >
        {/* Eyebrow */}
        <motion.p
          variants={fadeIn}
          initial="initial"
          animate="animate"
          transition={{ duration: 0.4, delay: 0 }}
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
        <h1
          style={{
            fontFamily: "var(--font-space-grotesk), sans-serif",
            fontSize: "var(--text-mega)",
            fontWeight: 700,
            lineHeight: 0.95,
            letterSpacing: "-0.04em",
            color: "var(--text-primary)",
            marginBottom: "32px",
          }}
        >
          <motion.span
            variants={fadeIn}
            initial="initial"
            animate="animate"
            transition={{ duration: 0.5, delay: 0 }}
            style={{ display: "block" }}
          >
            Your AI
          </motion.span>
          <motion.span
            variants={slideFromLeft}
            initial="initial"
            animate="animate"
            transition={{ duration: 0.5, delay: 0.08 }}
            style={{ display: "block" }}
          >
            finally
          </motion.span>
          <motion.span
            variants={fadeInUp}
            initial="initial"
            animate="animate"
            transition={{ duration: 0.5, delay: 0.16 }}
            style={{ display: "block" }}
          >
            remembers.
            <span className="cursor-blink" style={{ marginLeft: "4px" }}>
              █
            </span>
          </motion.span>
        </h1>

        {/* Sub-copy */}
        <motion.div
          variants={fadeInUp}
          initial="initial"
          animate="animate"
          transition={{ duration: 0.5, delay: 0.6 }}
          style={{ marginBottom: "40px" }}
        >
          <p
            style={{
              fontSize: "var(--text-body)",
              color: "var(--text-secondary)",
              lineHeight: 1.7,
            }}
          >
            Context Engine for Claude Code + Copilot CLI.
            <br />
            Persistent memory. Semantic search. Multi-agent.
            <br />
            Open source.
          </p>
        </motion.div>

        {/* CTAs */}
        <motion.div
          variants={fadeInUp}
          initial="initial"
          animate="animate"
          transition={{ duration: 0.5, delay: 0.9 }}
          style={{
            display: "flex",
            gap: "16px",
            alignItems: "center",
            marginBottom: "64px",
            flexWrap: "wrap",
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
            Read the docs →
          </a>
        </motion.div>

        {/* Stat strip */}
        <motion.p
          variants={fadeIn}
          initial="initial"
          animate="animate"
          transition={{ duration: 0.5, delay: 2.0 }}
          style={{
            fontFamily: "var(--font-jetbrains-mono), monospace",
            fontSize: "var(--text-micro)",
            color: "var(--text-muted)",
            letterSpacing: "0.06em",
          }}
        >
          12 MCP tools&nbsp;&nbsp;·&nbsp;&nbsp;pgvector semantic
          search&nbsp;&nbsp;·&nbsp;&nbsp;open source
        </motion.p>
      </div>

      {/* Right column — Terminal */}
      <motion.div
        initial={{ opacity: 0, x: 40 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.7, delay: 1.2, ease: [0.16, 1, 0.3, 1] }}
        style={{
          flex: "0 0 50%",
          position: "absolute",
          right: "-40px",
          top: "50%",
          transform: "translateY(-50%) rotate(-1.5deg)",
        }}
        className="hero-terminal"
      >
        <TerminalPanel />
      </motion.div>

      {/* Mobile terminal — shown below CTAs on small screens */}
      <style>{`
        @media (max-width: 768px) {
          .hero-terminal {
            display: none !important;
          }
          .hero-terminal-mobile {
            display: block !important;
          }
          section h1 {
            font-size: clamp(48px, 12vw, 72px) !important;
          }
          section > div:first-child {
            flex: unset !important;
            max-width: 100% !important;
          }
        }
      `}</style>
    </section>
  );
}
