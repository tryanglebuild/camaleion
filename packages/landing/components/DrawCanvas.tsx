"use client";

import { useRef, useState, useEffect } from "react";
import {
  useScroll,
  useTransform,
  useMotionValueEvent,
  motion,
  MotionValue,
} from "framer-motion";
import AppMockup, { type AppScreen } from "./AppMockup";

// ── Utility ───────────────────────────────────────────────────────
function remap(p: number, start: number, end: number): number {
  return Math.min(1, Math.max(0, (p - start) / (end - start)));
}

// ── Phase map ─────────────────────────────────────────────────────
const P = {
  memory:   [0.10, 0.30] as const,
  projects: [0.28, 0.48] as const,
  agents:   [0.46, 0.66] as const,
  search:   [0.64, 0.82] as const,
  chat:     [0.80, 0.98] as const,
};

const SCREENS: AppScreen[] = ["memory", "projects", "agents", "search", "chat"];
const SCREEN_PHASES = [P.memory, P.projects, P.agents, P.search, P.chat] as const;

// ── Copy definitions ──────────────────────────────────────────────
const COPY = [
  {
    eyebrow:  "01 · MEMORY",
    headline: "Your AI remembers everything.",
    body:     "Every decision, task, and lesson is stored, indexed, and instantly retrievable. Persistent memory via pgvector — semantic similarity search included.",
  },
  {
    eyebrow:  "02 · PROJECTS",
    headline: "Organize by project.",
    body:     "Memory is scoped to projects. Switch context without losing anything. Every entry is linked to a project, company, or person.",
  },
  {
    eyebrow:  "03 · AGENTS",
    headline: "Multi-agent, orchestrated.",
    body:     "Spawn specialist agents — Designer, Backend, Tester — and watch them coordinate in real-time. Every message logged. Every decision tracked.",
  },
  {
    eyebrow:  "04 · SEARCH",
    headline: "Find anything, instantly.",
    body:     "Ask a natural language question. Get semantically matched results ranked by cosine similarity. Not keyword search — actual meaning search.",
  },
  {
    eyebrow:  "05 · CHAT",
    headline: "Talk to your memory.",
    body:     "Ask your AI about its own history. \"What decisions did we make about streaming?\" and it knows — because it was there, and it remembers.",
  },
];

// ── Derive animation state from scroll progress ───────────────────
function deriveState(p: number) {
  // Which screen is currently active (most advanced phase)
  let screenIdx = 0;
  for (let i = 0; i < SCREEN_PHASES.length; i++) {
    if (p >= SCREEN_PHASES[i][0]) screenIdx = i;
  }

  const [phStart, phEnd] = SCREEN_PHASES[screenIdx];

  // Frame + nav draw (first 0–0.10 of global progress)
  const frameDraw = remap(p, 0.02, 0.12);

  // Screen-specific draw
  const screenDraw = remap(p, phStart, phEnd);

  // Combined draw (frame contributes 35%, screen 65%)
  const drawProgress = frameDraw * 0.35 + screenDraw * 0.65;

  // Dissolve: current screen fades as next starts
  let dissolveProgress = 0;
  if (screenIdx < SCREEN_PHASES.length - 1) {
    const nextStart = SCREEN_PHASES[screenIdx + 1][0];
    dissolveProgress = remap(p, nextStart, nextStart + 0.05);
  }

  // Copy index
  let copyIdx = 0;
  for (let i = 0; i < SCREEN_PHASES.length; i++) {
    if (p >= SCREEN_PHASES[i][0]) copyIdx = i;
  }

  // Show copy after frame starts drawing
  const copyVisible = p >= 0.08;

  return {
    screen: SCREENS[screenIdx],
    drawProgress,
    dissolveProgress,
    copyIdx,
    copyVisible,
    hintVisible: p < 0.06,
  };
}

// ── Main component ────────────────────────────────────────────────
export default function DrawCanvas() {
  const containerRef = useRef<HTMLDivElement>(null);

  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ["start start", "end end"],
  });

  const [animState, setAnimState] = useState(() => deriveState(0));

  useMotionValueEvent(scrollYProgress, "change", (latest) => {
    setAnimState(deriveState(latest));
  });

  const appOpacity = useTransform(scrollYProgress, [0.02, 0.10], [0, 1]);

  return (
    <div ref={containerRef} style={{ position: "relative", height: "600vh" }}>
      {/* Sticky viewport */}
      <div
        style={{
          position: "sticky",
          top: 0,
          height: "100vh",
          display: "flex",
          overflow: "hidden",
          background: "var(--bg-base)",
        }}
      >
        {/* Left copy column */}
        <div
          style={{
            flex: "0 0 42%",
            display: "flex",
            flexDirection: "column",
            justifyContent: "center",
            padding: "0 48px 0 80px",
            position: "relative",
          }}
        >
          {/* Hint */}
          <motion.div
            animate={{ opacity: animState.hintVisible ? 1 : 0 }}
            transition={{ duration: 0.3 }}
            style={{ position: "absolute", top: "50%", left: "80px", right: "48px", transform: "translateY(-50%)", pointerEvents: "none" }}
          >
            <p style={{
              fontFamily: "var(--font-jetbrains-mono), monospace",
              fontSize: "10px",
              color: "var(--text-muted)",
              letterSpacing: "0.1em",
              textTransform: "uppercase",
              marginBottom: "12px",
            }}>
              // constructing
            </p>
            <p style={{
              fontFamily: "var(--font-space-grotesk), sans-serif",
              fontSize: "clamp(24px, 2.8vw, 38px)",
              fontWeight: 600,
              color: "var(--text-secondary)",
              letterSpacing: "-0.02em",
              lineHeight: 1.2,
            }}>
              Keep scrolling<br />to build.
            </p>
          </motion.div>

          {/* Phase copy */}
          <motion.div
            animate={{ opacity: animState.copyVisible ? 1 : 0 }}
            transition={{ duration: 0.4 }}
          >
            <motion.p
              key={`eyebrow-${animState.copyIdx}`}
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.35 }}
              style={{
                fontFamily: "var(--font-jetbrains-mono), monospace",
                fontSize: "10px",
                color: "var(--accent)",
                letterSpacing: "0.12em",
                textTransform: "uppercase",
                marginBottom: "20px",
              }}
            >
              {COPY[animState.copyIdx].eyebrow}
            </motion.p>

            <motion.h2
              key={`headline-${animState.copyIdx}`}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, delay: 0.05 }}
              style={{
                fontFamily: "var(--font-space-grotesk), sans-serif",
                fontSize: "clamp(28px, 3vw, 44px)",
                fontWeight: 700,
                color: "var(--text-primary)",
                letterSpacing: "-0.03em",
                lineHeight: 1.1,
                marginBottom: "20px",
              }}
            >
              {COPY[animState.copyIdx].headline}
            </motion.h2>

            <motion.p
              key={`body-${animState.copyIdx}`}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, delay: 0.1 }}
              style={{
                fontSize: "15px",
                color: "var(--text-secondary)",
                lineHeight: 1.75,
                maxWidth: "380px",
              }}
            >
              {COPY[animState.copyIdx].body}
            </motion.p>

            {/* Progress dots */}
            <div style={{ display: "flex", gap: "6px", marginTop: "36px" }}>
              {COPY.map((_, i) => (
                <div
                  key={i}
                  style={{
                    width: i === animState.copyIdx ? "20px" : "6px",
                    height: "4px",
                    borderRadius: "2px",
                    background: i === animState.copyIdx ? "var(--accent)" : "var(--border-subtle)",
                    transition: "width 300ms ease, background 300ms ease",
                  }}
                />
              ))}
            </div>
          </motion.div>
        </div>

        {/* Right app mockup column */}
        <motion.div
          style={{
            flex: "0 0 58%",
            padding: "28px 48px 28px 0",
            opacity: appOpacity,
          }}
        >
          <AppMockup
            screen={animState.screen}
            drawProgress={animState.drawProgress}
            dissolveProgress={animState.dissolveProgress}
          />
        </motion.div>
      </div>
    </div>
  );
}
