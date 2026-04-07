"use client";
import { useEffect, useState } from "react";

export default function Nav() {
  const [theme, setTheme] = useState<"light" | "dark">("light");
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const saved = (localStorage.getItem("theme") as "light" | "dark") ?? "light";
    setTheme(saved);
    document.documentElement.setAttribute("data-theme", saved);
    const onScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  function toggle() {
    const next = theme === "light" ? "dark" : "light";
    setTheme(next);
    document.documentElement.setAttribute("data-theme", next);
    localStorage.setItem("theme", next);
  }

  return (
    <nav style={{
      position: "sticky", top: 0, zIndex: 100,
      height: "56px",
      background: scrolled ? "color-mix(in srgb, var(--bg-base) 88%, transparent)" : "var(--bg-base)",
      backdropFilter: scrolled ? "blur(12px)" : "none",
      borderBottom: `1px solid ${scrolled ? "var(--border)" : "transparent"}`,
      display: "flex", alignItems: "center", justifyContent: "space-between",
      padding: "0 40px",
      transition: "background 200ms ease, border-color 200ms ease",
    }}>
      <span style={{
        fontFamily: "var(--font-space-grotesk), sans-serif",
        fontSize: "15px", fontWeight: 700,
        color: "var(--text-primary)", letterSpacing: "-0.02em",
      }}>◈ camaleon</span>

      <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
        {[
          { label: "Memory",   href: "#memory"   },
          { label: "Agents",   href: "#agents"   },
          { label: "Docs",     href: "#how-it-works" },
          { label: "GitHub ↗", href: "https://github.com/tryangle/project-ai-system", external: true },
        ].map((l) => (
          <a key={l.label}
            href={l.href}
            target={l.external ? "_blank" : undefined}
            rel={l.external ? "noopener noreferrer" : undefined}
            style={{
              fontFamily: "var(--font-inter), sans-serif",
              fontSize: "13px", fontWeight: 500,
              color: "var(--text-secondary)", textDecoration: "none",
              padding: "6px 10px", borderRadius: "6px",
              transition: "color 120ms, background 120ms",
            }}
            onMouseEnter={e => { e.currentTarget.style.color = "var(--text-primary)"; e.currentTarget.style.background = "var(--surface-2)"; }}
            onMouseLeave={e => { e.currentTarget.style.color = "var(--text-secondary)"; e.currentTarget.style.background = "transparent"; }}
          >{l.label}</a>
        ))}

        <button onClick={toggle} aria-label="Toggle theme" style={{
          width: "32px", height: "32px",
          display: "flex", alignItems: "center", justifyContent: "center",
          border: "1px solid var(--border)", borderRadius: "8px",
          background: "var(--surface-2)", cursor: "pointer",
          fontSize: "14px", color: "var(--text-secondary)",
          transition: "border-color 120ms, color 120ms",
          marginLeft: "4px",
        }}
        onMouseEnter={e => { e.currentTarget.style.borderColor = "var(--accent)"; e.currentTarget.style.color = "var(--accent)"; }}
        onMouseLeave={e => { e.currentTarget.style.borderColor = "var(--border)"; e.currentTarget.style.color = "var(--text-secondary)"; }}
        >
          {theme === "light" ? "◗" : "☀"}
        </button>
      </div>
    </nav>
  );
}
