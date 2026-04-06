"use client";

import { useEffect, useRef, useState, useCallback } from "react";

// ─── Types ────────────────────────────────────────────────────────────────────

interface MemoryCardData {
  type: string;
  title: string;
  meta: string;
}

// ─── Constants ───────────────────────────────────────────────────────────────

const CARDS: MemoryCardData[] = [
  {
    type: "decision",
    title: "JWT with Supabase Auth",
    meta: "project: camaleon · 3 months ago",
  },
  {
    type: "note",
    title: "Never store tokens in localStorage",
    meta: "tags: [security] [lesson]",
  },
  {
    type: "task",
    title: "Implement refresh token rotation",
    meta: "status: done · project: camaleon",
  },
];

const QUESTION = "> what did we decide about auth?";
const RESPONSE =
  "Based on past decisions:\nJWT with Supabase Auth.\nRefresh token rotation already done.\nDo NOT store tokens in localStorage.";
const SPINNER_CHARS = ["⟳", "↻", "↺"];

// ─── MemoryCard ───────────────────────────────────────────────────────────────

function MemoryCard({
  card,
  active,
}: {
  card: MemoryCardData;
  active: boolean;
}) {
  return (
    <div
      style={{
        padding: "12px 16px",
        border: "1px solid var(--border-subtle)",
        background: active ? "var(--accent-dim)" : "var(--surface-1)",
        borderLeft: `2px solid ${active ? "var(--accent)" : "var(--border-subtle)"}`,
        transition: "background 200ms ease, border-color 200ms ease",
      }}
    >
      <div
        style={{
          fontFamily: "var(--font-jetbrains-mono), monospace",
          fontSize: "10px",
          color: "var(--text-muted)",
        }}
      >
        [{card.type}]
      </div>
      <div
        style={{
          fontSize: "13px",
          color: "var(--text-primary)",
          marginTop: "4px",
        }}
      >
        {card.title}
      </div>
      <div
        style={{
          fontFamily: "var(--font-jetbrains-mono), monospace",
          fontSize: "11px",
          color: "var(--text-muted)",
          marginTop: "4px",
        }}
      >
        {card.meta}
      </div>
    </div>
  );
}

// ─── PanelHeader ──────────────────────────────────────────────────────────────

function PanelHeader({
  title,
  showStatus,
}: {
  title: string;
  showStatus?: boolean;
}) {
  return (
    <div
      style={{
        height: "36px",
        background: "var(--surface-2)",
        borderBottom: "1px solid var(--border-subtle)",
        display: "flex",
        alignItems: "center",
        padding: "0 16px",
        gap: "8px",
      }}
    >
      {showStatus ? (
        <div
          style={{
            width: "8px",
            height: "8px",
            borderRadius: "50%",
            background: "var(--accent)",
            flexShrink: 0,
            animation: "statusPulse 1200ms ease-in-out infinite",
          }}
        />
      ) : (
        <>
          {(["#C44C2C", "#CCA85A", "#6EC498"] as const).map((c, i) => (
            <div
              key={i}
              style={{
                width: "10px",
                height: "10px",
                borderRadius: "50%",
                background: c,
                opacity: 0.7,
              }}
            />
          ))}
        </>
      )}
      <span
        style={{
          marginLeft: showStatus ? "4px" : "12px",
          fontSize: "11px",
          color: "var(--text-muted)",
          fontFamily: "var(--font-jetbrains-mono), monospace",
        }}
      >
        {title}
      </span>
    </div>
  );
}

// ─── DemoSection ─────────────────────────────────────────────────────────────

export default function DemoSection() {
  const sectionRef = useRef<HTMLDivElement>(null);
  const headingRef = useRef<HTMLDivElement>(null);
  const started = useRef(false);
  const timeouts = useRef<ReturnType<typeof setTimeout>[]>([]);
  const spinnerInterval = useRef<ReturnType<typeof setInterval> | null>(null);
  const scanLineRef = useRef<HTMLDivElement>(null);

  // Animation state
  const [questionText, setQuestionText] = useState("");
  const [showStatus, setShowStatus] = useState(false);
  const [statusText, setStatusText] = useState("⟳ querying context engine...");
  const [statusColor, setStatusColor] = useState<string>("var(--accent)");
  const [showDivider, setShowDivider] = useState(false);
  const [responseText, setResponseText] = useState("");
  const [showCursor, setShowCursor] = useState(false);
  const [activeCards, setActiveCards] = useState<boolean[]>([false, false, false]);
  const [scanActive, setScanActive] = useState(false);
  const [dotsVisible, setDotsVisible] = useState(false);
  const [panelOpacity, setPanelOpacity] = useState(1);

  function clearAll() {
    timeouts.current.forEach(clearTimeout);
    timeouts.current = [];
    if (spinnerInterval.current) {
      clearInterval(spinnerInterval.current);
      spinnerInterval.current = null;
    }
  }

  const schedule = useCallback((fn: () => void, delay: number) => {
    timeouts.current.push(setTimeout(fn, delay));
  }, []);

  const startAnimation = useCallback(() => {
    clearAll();

    // Check for reduced motion
    const prefersReduced =
      typeof window !== "undefined" &&
      window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    if (prefersReduced) {
      // Skip to completed static state
      setQuestionText(QUESTION);
      setShowStatus(true);
      setStatusText("✓ 3 entries found");
      setStatusColor("var(--code-green)");
      setShowDivider(true);
      setResponseText(RESPONSE);
      setShowCursor(false);
      setActiveCards([true, true, true]);
      setScanActive(false);
      setDotsVisible(false);
      setPanelOpacity(1);
      return;
    }

    // Reset state
    setQuestionText("");
    setShowStatus(false);
    setStatusText("⟳ querying context engine...");
    setStatusColor("var(--accent)");
    setShowDivider(false);
    setResponseText("");
    setShowCursor(true);
    setActiveCards([false, false, false]);
    setScanActive(false);
    setDotsVisible(false);
    setPanelOpacity(1);

    // t=0 — Typewriter: question (40ms/char)
    let qIdx = 0;
    const questionInterval = setInterval(() => {
      qIdx++;
      setQuestionText(QUESTION.slice(0, qIdx));
      if (qIdx >= QUESTION.length) clearInterval(questionInterval);
    }, 40);
    timeouts.current.push(questionInterval as unknown as ReturnType<typeof setTimeout>);

    // t=1000 — Status line appears with spinner
    schedule(() => {
      setShowStatus(true);
      setStatusText("⟳ querying context engine...");
      setStatusColor("var(--accent)");

      let sIdx = 0;
      spinnerInterval.current = setInterval(() => {
        sIdx = (sIdx + 1) % SPINNER_CHARS.length;
        setStatusText(`${SPINNER_CHARS[sIdx]} querying context engine...`);
      }, 400);
    }, 1000);

    // t=1600 — Scan line fires
    schedule(() => {
      setScanActive(false);
      // Force reflow so animation restarts
      requestAnimationFrame(() => {
        requestAnimationFrame(() => setScanActive(true));
      });
    }, 1600);

    // t=2300 — Card 0 active
    schedule(() => {
      setActiveCards(([, c1, c2]) => [true, c1, c2]);
    }, 2300);

    // t=2900 — Card 1 active
    schedule(() => {
      setActiveCards(([c0, , c2]) => [c0, true, c2]);
    }, 2900);

    // t=3500 — Card 2 active
    schedule(() => {
      setActiveCards(([c0, c1]) => [c0, c1, true]);
    }, 3500);

    // t=3800 — Status: found
    schedule(() => {
      if (spinnerInterval.current) {
        clearInterval(spinnerInterval.current);
        spinnerInterval.current = null;
      }
      setStatusText("✓ 3 entries found");
      setStatusColor("var(--code-green)");
    }, 3800);

    // t=4000 — Connection dots
    schedule(() => {
      setDotsVisible(true);
    }, 4000);

    // t=4500 — Claude response typewriter (25ms/char)
    schedule(() => {
      setShowDivider(true);
      setShowCursor(false);
      let rIdx = 0;
      const responseInterval = setInterval(() => {
        rIdx++;
        setResponseText(RESPONSE.slice(0, rIdx));
        if (rIdx >= RESPONSE.length) {
          clearInterval(responseInterval);
          setShowCursor(false);
        }
      }, 25);
      timeouts.current.push(responseInterval as unknown as ReturnType<typeof setTimeout>);
    }, 4500);

    // t=8500 — Fade out
    schedule(() => {
      setPanelOpacity(0);
    }, 8500);

    // t=8800 — Reset and loop
    schedule(() => {
      startAnimation();
    }, 8800);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    const el = sectionRef.current;
    if (!el) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting && !started.current) {
          started.current = true;

          if (headingRef.current)
            headingRef.current.setAttribute("data-inview", "true");

          setTimeout(() => startAnimation(), 400);
          observer.disconnect();
        }
      },
      { threshold: 0.2 }
    );

    observer.observe(el);
    return () => {
      observer.disconnect();
      clearAll();
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [startAnimation]);

  const responseLines = responseText.split("\n");

  return (
    <section
      id="demo"
      ref={sectionRef}
      className="dot-grid"
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
            ── demo ──────────────────────────────
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
            Watch it work.
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
            Memory retrieval. In real time.
          </h2>
        </div>

        {/* Split panel */}
        <div
          className="demo-panels"
          style={{
            display: "flex",
            gap: "24px",
            alignItems: "flex-start",
            transition: "opacity 300ms ease",
            opacity: panelOpacity,
          }}
        >
          {/* ChatPanel */}
          <div
            className="demo-chat"
            style={{
              flex: "0 0 45%",
              border: "1px solid var(--border-subtle)",
              background: "var(--surface-1)",
              overflow: "hidden",
            }}
          >
            <PanelHeader title="claude code — camaleon demo" />
            <div
              style={{
                padding: "20px 24px",
                minHeight: "336px",
                fontFamily: "var(--font-jetbrains-mono), monospace",
                fontSize: "13px",
                lineHeight: 1.7,
              }}
            >
              {/* Question */}
              {questionText && (
                <div style={{ color: "var(--accent)" }}>
                  {questionText}
                  {showCursor && !showDivider && (
                    <span className="cursor-blink">█</span>
                  )}
                </div>
              )}

              {/* Empty line */}
              {questionText && <div style={{ minHeight: "1.7em" }} />}

              {/* Status */}
              {showStatus && (
                <div style={{ color: statusColor }}>{statusText}</div>
              )}

              {/* Divider */}
              {showDivider && (
                <div
                  style={{
                    height: "1px",
                    background: "var(--border-subtle)",
                    margin: "16px 0",
                  }}
                />
              )}

              {/* Response */}
              {responseLines.map((line, i) => (
                <div
                  key={i}
                  style={{
                    color: "var(--text-primary)",
                    minHeight: line === "" ? "1.7em" : undefined,
                  }}
                >
                  {line}
                  {i === responseLines.length - 1 &&
                    responseText.length > 0 &&
                    responseText.length < RESPONSE.length && (
                      <span className="cursor-blink">█</span>
                    )}
                </div>
              ))}
            </div>
          </div>

          {/* Gap area with connection dots */}
          <div
            className="demo-gap"
            style={{
              flex: "0 0 40px",
              position: "relative",
              alignSelf: "stretch",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            {dotsVisible && (
              <div
                style={{
                  display: "flex",
                  flexDirection: "column",
                  gap: "8px",
                }}
              >
                {[0, 1, 2].map((i) => (
                  <span
                    key={i}
                    aria-hidden="true"
                    style={{
                      fontFamily: "var(--font-jetbrains-mono), monospace",
                      fontSize: "8px",
                      color: "var(--accent)",
                      display: "block",
                      animation: `travelDot 600ms ease forwards`,
                      animationDelay: `${i * 100}ms`,
                    }}
                  >
                    ●
                  </span>
                ))}
              </div>
            )}
          </div>

          {/* MemoryPanel */}
          <div
            className="demo-memory"
            style={{
              flex: 1,
              marginTop: "-12px",
              border: "1px solid var(--border-subtle)",
              background: "var(--surface-1)",
              overflow: "hidden",
            }}
          >
            <PanelHeader title="context engine — active" showStatus />
            <div
              style={{
                padding: "16px",
                minHeight: "360px",
                position: "relative",
              }}
            >
              {/* Scan line */}
              {scanActive && (
                <div
                  ref={scanLineRef}
                  style={{
                    position: "absolute",
                    left: 0,
                    right: 0,
                    height: "2px",
                    background:
                      "linear-gradient(90deg, transparent 0%, rgba(224,123,58,0.04) 20%, rgba(224,123,58,0.5) 50%, rgba(224,123,58,0.04) 80%, transparent 100%)",
                    animation: "scanSweep 600ms ease-in-out forwards",
                    pointerEvents: "none",
                    zIndex: 2,
                  }}
                />
              )}

              {/* Memory cards */}
              <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                {CARDS.map((card, i) => (
                  <MemoryCard key={i} card={card} active={activeCards[i]} />
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Bottom annotation */}
        <p
          style={{
            fontFamily: "var(--font-jetbrains-mono), monospace",
            fontSize: "11px",
            color: "var(--text-muted)",
            marginTop: "48px",
          }}
        >
          // loop — memory retrieval in real time
          ─────────────────────────────
        </p>
      </div>

      <style>{`
        @media (max-width: 768px) {
          .demo-panels {
            flex-direction: column !important;
          }
          .demo-chat,
          .demo-memory {
            flex: none !important;
            width: 100% !important;
            margin-top: 0 !important;
          }
          .demo-gap {
            display: none !important;
          }
        }
      `}</style>
    </section>
  );
}
