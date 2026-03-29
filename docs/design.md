# Context Engine MCP — Frontend Design System

> **Concept: "Digital Control Room"**  
> The user doesn't scroll a page — they navigate a system.  
> Each section feels like a module loading dynamically.

---

## 🧱 Frontend Stack

| Layer | Technology | Why |
|-------|-----------|-----|
| Framework | Next.js 15 (App Router) | SSR + routing + performance |
| Styling | Tailwind CSS v4 | Utility-first, fast to build |
| Components | Float UI | Premium base components |
| Animations | AOS (Animate On Scroll) | Scroll-triggered reveals |
| Micro-interactions | Framer Motion | Hover, click, entrance effects |
| Typography | Space Grotesk + JetBrains Mono | Technical premium feel |
| Icons | Lucide React | Clean, minimal |

---

## 🎨 Design System

### Palette

```css
--bg-base:       #0A0A0A;   /* deep black */
--surface-1:     #111111;   /* card background */
--surface-2:     #181818;   /* elevated surface */
--border:        #2A2A2A;   /* subtle border */
--border-active: #3A3A3A;   /* hover border */
--accent:        #3B82F6;   /* electric blue — ONE accent color */
--accent-glow:   rgba(59, 130, 246, 0.15);
--text-primary:  #F4F4F5;
--text-secondary:#A1A1AA;
--text-mono:     #86EFAC;   /* green terminal text */
```

> ❌ No gradients. ❌ No blobs. ❌ No glassmorphism excess.  
> ✅ Glows. ✅ Lit borders. ✅ Subtle noise texture.

### Typography

```css
/* Headings */
font-family: 'Space Grotesk', sans-serif;

/* Body */
font-family: 'Inter', sans-serif;

/* Labels, code, terminal */
font-family: 'JetBrains Mono', monospace;
```

### Base Component Style (overrides Float UI)

```css
.card {
  background: rgba(255, 255, 255, 0.02);
  border: 1px solid #2A2A2A;
  backdrop-filter: blur(8px);
  border-radius: 8px;  /* less rounded than default */
}

.card:hover {
  border-color: #3B82F6;
  box-shadow: 0 0 20px rgba(59, 130, 246, 0.1);
  transform: translateY(-2px);
  transition: all 0.2s ease;
}
```

---

## 📦 Project Structure

```
/packages/web-ui
  /app
    layout.tsx              ← global fonts, AOS init
    page.tsx                ← landing page (public)
    /dashboard              ← internal app (after auth)
      /entries
      /search
      /projects
      /people
      /generate
  /components
    /landing                ← landing-specific sections
      Hero.tsx
      Modules.tsx
      LivePreview.tsx
      Timeline.tsx
      CTA.tsx
    /ui                     ← shared base components
      Card.tsx
      Button.tsx
      Badge.tsx
      Terminal.tsx
      GlowBorder.tsx
      CountUp.tsx
    /dashboard              ← internal app components
      Sidebar.tsx
      EntryCard.tsx
      SearchBar.tsx
  /lib
    aos-config.ts           ← AOS init + settings
    fonts.ts                ← Next/Font config
  /styles
    globals.css             ← Tailwind + CSS vars
    noise.css               ← subtle noise texture
```

---

## 🌐 Landing Page — Sections

### 1. 🟢 Hero — "System Initializing"

**Concept:** Terminal boot sequence. Not a traditional hero.

```
> SYSTEM INITIALIZED
> CONTEXT ENGINE MCP v1.0

Give your AI permanent memory.
No hallucinations. Just context.

[ EXECUTE SYSTEM ]        [ VIEW DOCS ]
```

**Implementation:**
```tsx
// Staggered terminal lines with AOS + fake cursor
<div data-aos="fade-up" data-aos-delay="0">
  <span className="font-mono text-green-400">&gt; SYSTEM INITIALIZED</span>
</div>
<div data-aos="fade-up" data-aos-delay="200">
  <span className="font-mono text-green-400">&gt; CONTEXT ENGINE MCP v1.0</span>
  <span className="animate-pulse">_</span>  {/* blinking cursor */}
</div>
<div data-aos="fade-up" data-aos-delay="400">
  <h1>Give your AI permanent memory.</h1>
</div>
```

**Effects:**
- Lines appear with progressive delay (terminal feel)
- Blinking cursor CSS animation
- Subtle noise texture on background
- No hero image — the text IS the visual

---

### 2. 🟣 Modules — "Active System Components"

**Concept:** Cards feel like active running modules, not feature bullets.

**Layout:** Float UI card grid (3 cols desktop, 1 mobile)

| Module | Icon | Label |
|--------|------|-------|
| Memory | `Database` | `MODULE_01 // MEMORY` |
| RAG Search | `Search` | `MODULE_02 // RAG` |
| Web UI | `Monitor` | `MODULE_03 // INTERFACE` |
| Analysis | `Code2` | `MODULE_04 // ANALYSIS` |
| Planning | `GitBranch` | `MODULE_05 // PLANNING` |
| Generation | `Zap` | `MODULE_06 // GENERATION` |

**AOS:** stagger `fade-up` with 100ms delay increments

```tsx
{modules.map((mod, i) => (
  <div
    key={mod.id}
    data-aos="fade-up"
    data-aos-delay={i * 100}
    className="group card hover:border-accent hover:shadow-accent-glow"
  >
    <span className="font-mono text-xs text-zinc-500">{mod.label}</span>
    <mod.Icon className="text-accent group-hover:scale-110 transition" />
    <h3>{mod.title}</h3>
    <p>{mod.description}</p>
  </div>
))}
```

---

### 3. 🔵 Live System Preview — "It's Running Right Now"

**Concept:** Simulate a real working system. Metrics updating, logs flowing.

**Elements:**
- Fake real-time metrics with CountUp animation
- Scrolling log lines (CSS marquee)
- Pulsing "LIVE" indicator

```tsx
// CountUp on scroll enter
<CountUp end={1247} suffix=" entries" duration={2} />
<CountUp end={99.2} suffix="% accuracy" decimals={1} duration={2} />
<CountUp end={0.08} prefix="~" suffix="s retrieval" decimals={2} duration={2} />

// Fake log stream
<div className="font-mono text-xs text-zinc-400 overflow-hidden h-32">
  <div className="animate-scroll-up">
    {fakeLogs.map(log => <div key={log.id}>&gt; {log.text}</div>)}
  </div>
</div>
```

**AOS:** `zoom-in` with `data-aos-once="true"`

---

### 4. 🟡 Workflow Timeline — "How It Works"

**Concept:** Pipeline, not steps. Feels like a system being executed.

```
[ Claude Code ]
      ↓
[ MCP Server ] — receives query
      ↓
[ Memory Module ] — searches entries
      ↓
[ RAG Engine ] — semantic match
      ↓
[ Context returned ] — grounded answer
```

**AOS:** alternating `fade-right` / `fade-left` on each step

```tsx
{steps.map((step, i) => (
  <div
    data-aos={i % 2 === 0 ? "fade-right" : "fade-left"}
    data-aos-delay={i * 150}
    className="flex items-start gap-4"
  >
    <div className="w-px h-full bg-accent/30" />  {/* connector line */}
    <div className="card flex-1">
      <span className="font-mono text-accent text-xs">STEP_{i + 1}</span>
      <h3>{step.title}</h3>
      <p>{step.description}</p>
    </div>
  </div>
))}
```

---

### 5. 🔴 CTA — "Execute"

**Concept:** Not a button — a command.

```tsx
<button className="
  font-mono text-sm tracking-widest uppercase
  border border-accent px-8 py-4
  relative overflow-hidden
  hover:shadow-[0_0_30px_rgba(59,130,246,0.3)]
  transition-all duration-300
  group
">
  {/* Sweep light effect on hover */}
  <span className="
    absolute inset-0 -translate-x-full
    bg-gradient-to-r from-transparent via-accent/10 to-transparent
    group-hover:translate-x-full transition-transform duration-500
  " />
  [ EXECUTE SYSTEM ]
</button>
```

---

## ⚡ Special Effects

### Fake Loading State (page entry)

```tsx
// _loading.tsx or layout animation
useEffect(() => {
  // Show skeleton/loading state for 800ms
  // Then reveal content with stagger
  setLoaded(true)
}, [800])
```

### System Mode Toggle (V2 feature flag)

```tsx
// Toggle in navbar
<Toggle
  label="ANALYSIS MODE"
  onChange={(active) => setSystemMode(active ? 'analysis' : 'normal')}
/>
// When active: show more data overlays, technical labels
```

### Noise Texture

```css
/* globals.css */
.noise::before {
  content: '';
  position: fixed;
  inset: 0;
  background-image: url("data:image/svg+xml,..."); /* inline SVG noise */
  opacity: 0.03;
  pointer-events: none;
  z-index: 100;
}
```

---

## 📋 AOS Strategy

| Section | Animation | Delay |
|---------|-----------|-------|
| Hero lines | `fade-up` | 0, 200, 400, 600ms |
| Module cards | `fade-up` | stagger 100ms |
| Live preview | `zoom-in` | 0 |
| Timeline steps | `fade-right` / `fade-left` | stagger 150ms |
| CTA | `fade-up` | 0 |

```ts
// lib/aos-config.ts
import AOS from 'aos'

export function initAOS() {
  AOS.init({
    duration: 600,
    easing: 'ease-out-cubic',
    once: true,       // animate once, not every scroll
    offset: 80,       // trigger 80px before element
  })
}
```

---

## 📋 Tasks — Frontend

### Setup

- [ ] Init Next.js 15 with App Router + TypeScript
- [ ] Configure Tailwind v4 + CSS variables
- [ ] Install Float UI + configure component overrides
- [ ] Install AOS + Framer Motion
- [ ] Setup Google Fonts (Space Grotesk + JetBrains Mono via `next/font`)
- [ ] Create global CSS vars + noise texture

### Landing Page

- [ ] Hero section (terminal animation + blinking cursor)
- [ ] Modules grid (stagger cards)
- [ ] Live Preview section (CountUp + fake logs)
- [ ] Timeline / How It Works
- [ ] CTA section (command button + sweep effect)
- [ ] Responsive (mobile-first)

### Dashboard (internal)

- [ ] Sidebar navigation
- [ ] `/dashboard` — entry list + filters
- [ ] Quick add entry form
- [ ] `/search` — semantic search page
- [ ] `/projects` + `/people` pages
- [ ] `/generate` page (V2)

---

## ✅ Decisions Made

| Decision | Choice | Why |
|----------|--------|-----|
| Framework | Next.js 15 | SSR, routing, performance |
| UI library | Float UI | Premium base, customizable |
| Animations | AOS + Framer Motion | Scroll reveals + micro-interactions |
| Design concept | Digital Control Room | Unique, technical, premium feel |
| Color accent | Electric blue (#3B82F6) | Single accent, maximum contrast |
| No gradients | Glows + lit borders instead | Avoid generic SaaS look |
| Typography | Space Grotesk + JetBrains Mono | Technical + premium |
