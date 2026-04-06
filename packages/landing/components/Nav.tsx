export default function Nav() {
  return (
    <>
      <style>{`
        .nav-link {
          font-family: var(--font-jetbrains-mono), monospace;
          font-size: 12px;
          color: var(--text-muted);
          text-decoration: none;
          transition: color 120ms ease;
        }
        .nav-link:hover { color: var(--text-secondary); }
      `}</style>
      <nav
        style={{
          height: "56px",
          position: "sticky",
          top: 0,
          zIndex: 100,
          background: "rgba(13,12,10,0.85)",
          backdropFilter: "blur(12px)",
          WebkitBackdropFilter: "blur(12px)",
          borderBottom: "1px solid rgba(42,40,37,0.6)",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          padding: "0 40px",
        }}
      >
        <span
          style={{
            fontFamily: "var(--font-space-grotesk), sans-serif",
            fontSize: "15px",
            fontWeight: 600,
            color: "var(--text-primary)",
            letterSpacing: "-0.01em",
          }}
        >
          ◈ camaleon
        </span>

        <div style={{ display: "flex", gap: "24px", alignItems: "center" }}>
          <a
            href="https://github.com/tryangle/project-ai-system"
            target="_blank"
            rel="noopener noreferrer"
            className="nav-link"
          >
            GitHub ↗
          </a>
          <a href="#how-it-works" className="nav-link">
            Docs ↗
          </a>
        </div>
      </nav>
    </>
  );
}
