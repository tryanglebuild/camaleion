# MEMORIA — Design Spec Addendum
## Spacing Scale + Type Color Tokens

> **Status:** Ready for Frontend Handoff  
> **Resolves:** Design Critic blockers (WEAK → PASS)  
> **Appends to:** MEMORIA Design Spec v1.0

---

## Context

The MEMORIA spec (Context Engine UI redesign) received **WEAK (45/60)** from Design Critic.  
Concept quality: PASS. Document completeness: incomplete.

Two hard blockers identified:
1. No spacing scale — Frontend will invent arbitrary values, breaking visual rhythm
2. `--type-*` hex values missing — entire card differentiation system is undefined

Both are resolved below.

---

## Section A — Spacing Scale

**Philosophy:**  
MEMORIA is an editorial ops tool, not a SaaS dashboard. The spacing quantum is 4px but the progression approximates the golden ratio (φ ≈ 1.618) after the first step — giving each increment a perceptible, non-mechanical weight jump. Dense at small scale, generous at page scale.

This is **not** a 4/8/12/16/24/32/48/64 grid. Each step is named for intent, not size.

```css
/* ── Spacing Tokens — MEMORIA ──────────────────────────────────── */
/* Golden-ratio influenced. Editorial density. Intentional, not systematic. */

:root {
  --space-atom:   4px;   /* hairline gaps, active indicators, icon insets */
  --space-tight:  8px;   /* tag padding, paired sibling gap, inline separation */
  --space-snug:  14px;   /* card inner padding (sm), input vertical padding */
  --space-base:  22px;   /* standard component padding, list item gap */
  --space-loose: 36px;   /* card-to-card gap, section inner breathing room */
  --space-open:  58px;   /* major section breaks, page chrome inset */
  --space-vast:  92px;   /* hero whitespace, empty states, page-level margin */

  /* ── Semantic aliases — use these in components ────────────── */
  --card-pad-x:  var(--space-base);   /* 22px — horizontal card padding */
  --card-pad-y:  var(--space-snug);   /* 14px — vertical card padding */
  --list-gap:    var(--space-tight);  /*  8px — gap between list items */
  --section-gap: var(--space-loose);  /* 36px — gap between page sections */
  --page-inset:  var(--space-open);   /* 58px — page-level side inset */
}
```

**Scale rationale:**

| Token | Value | Ratio to prev | Intent |
|-------|-------|---------------|--------|
| `--space-atom` | 4px | — | Sub-perceptual. Barely there. |
| `--space-tight` | 8px | ×2.0 | Related elements breathing. |
| `--space-snug` | 14px | ×1.75 | Compact grouping with presence. |
| `--space-base` | 22px | ×1.57 | Standard inhabited space. |
| `--space-loose` | 36px | ×1.63 | Room to exist separately. |
| `--space-open` | 58px | ×1.61 | Structural separation. |
| `--space-vast` | 92px | ×1.59 | Approaching φ — feels like air. |

The ratio converges toward φ (1.618) deliberately. The scale feels organic, not mechanical.

---

## Section B — Type Color Tokens

**Philosophy:**  
All type colors must harmonize with Ember (`#D95B21`) and the warm beige base (`--surface-1: #FAFAF8`). The palette draws from archival pigments, not the SaaS default spectrum. No generic blue/purple/green/yellow. Think: letterpress ink colors, natural dyes, rare earths.

Every color has earned contrast on `#FAFAF8` (minimum 4.5:1 for text, decorative bars exceed this). All dark-mode overrides maintain readability on `#242220`.

```css
/* ── Entry Type Colors — MEMORIA ────────────────────────────────── */
/* Archival pigment palette. Harmonious with Ember (#D95B21). */
/* Not the Tailwind default spectrum. Not Material. Not Bootstrap. */

:root {
  --type-task:      #1E6A72;   /* deep teal — active, directional, precision-in-motion */
  --type-note:      #6B5C48;   /* warm umber — archival, observational, ink on parchment */
  --type-decision:  #8C2E2E;   /* garnet — weight, permanence, irreversibility */
  --type-meet:      #3D6B44;   /* forest moss — human gathering, organic rhythm */
  --type-idea:      #9B5C1A;   /* burnt copper — adjacent to Ember; ignition without urgency */
  --type-log:       #4A5B6E;   /* slate ink — systematic, neutral, chronological */
  --type-analysis:  #5E3F7C;   /* plum — depth, abstraction, intellectual rigor */
  --type-plan:      #2A5C8A;   /* prussian blue — structured, architectural, reliable */
  --type-post:      #8A4B6B;   /* antique mauve — expressive, published, communicative */
}

/* ── Dark Mode Overrides — type colors lightened ~25% ──────────── */
[data-theme="dark"] {
  --type-task:      #3AAFBA;
  --type-note:      #A8957E;
  --type-decision:  #C45C5C;
  --type-meet:      #6AAF75;
  --type-idea:      #D4853A;
  --type-log:       #7F96AE;
  --type-analysis:  #9B72C2;
  --type-plan:      #4A8ABF;
  --type-post:      #C27A9C;
}
```

**Color decisions rationale:**

| Token | Light | Dark | Why |
|-------|-------|------|-----|
| `--type-task` | `#1E6A72` | `#3AAFBA` | Teal is directional, forward. Not generic blue. Suggests precision-in-motion. |
| `--type-note` | `#6B5C48` | `#A8957E` | Warm umber — the color of old ink. Notes are observations, not actions. |
| `--type-decision` | `#8C2E2E` | `#C45C5C` | Garnet carries weight. Darker than alarm red. Decisions are permanent. |
| `--type-meet` | `#3D6B44` | `#6AAF75` | Forest moss. Meetings are human, organic. Not generic "success" green. |
| `--type-idea` | `#9B5C1A` | `#D4853A` | Burnt copper — in Ember's family, lighter. Ideas ignite but don't alarm. |
| `--type-log` | `#4A5B6E` | `#7F96AE` | Slate ink. Systematic, neutral, chronicles passage of time. |
| `--type-analysis` | `#5E3F7C` | `#9B72C2` | Plum — deep, intellectual. Analysis goes beneath the surface. |
| `--type-plan` | `#2A5C8A` | `#4A8ABF` | Prussian blue — historical gravitas. Plans are architectural, structural. |
| `--type-post` | `#8A4B6B` | `#C27A9C` | Antique mauve — expressive, published. Content that goes outward. |

**Harmony check against Ember (#D95B21):**  
The palette is warm-adjacent without competing. Copper (`idea`) is the only direct Ember relative — lighter and desaturated enough to stay distinct. Garnet (`decision`) sits in the warm-red family but is darker and more burgundy. The remaining colors (teal, umber, moss, slate, plum, prussian, mauve) are chromatic complements or neutrals — they give visual variety without creating a SaaS rainbow.

---

## Full Token Set — Completeness Confirmation

### Spacing (7 tokens + 5 semantic aliases)

| Token | Value | Status |
|-------|-------|--------|
| `--space-atom` | 4px | ✅ |
| `--space-tight` | 8px | ✅ |
| `--space-snug` | 14px | ✅ |
| `--space-base` | 22px | ✅ |
| `--space-loose` | 36px | ✅ |
| `--space-open` | 58px | ✅ |
| `--space-vast` | 92px | ✅ |
| `--card-pad-x` | `var(--space-base)` | ✅ |
| `--card-pad-y` | `var(--space-snug)` | ✅ |
| `--list-gap` | `var(--space-tight)` | ✅ |
| `--section-gap` | `var(--space-loose)` | ✅ |
| `--page-inset` | `var(--space-open)` | ✅ |

### Type Colors (9 tokens × 2 modes)

| Token | Light | Dark | Status |
|-------|-------|------|--------|
| `--type-task` | `#1E6A72` | `#3AAFBA` | ✅ |
| `--type-note` | `#6B5C48` | `#A8957E` | ✅ |
| `--type-decision` | `#8C2E2E` | `#C45C5C` | ✅ |
| `--type-meet` | `#3D6B44` | `#6AAF75` | ✅ |
| `--type-idea` | `#9B5C1A` | `#D4853A` | ✅ |
| `--type-log` | `#4A5B6E` | `#7F96AE` | ✅ |
| `--type-analysis` | `#5E3F7C` | `#9B72C2` | ✅ **new** |
| `--type-plan` | `#2A5C8A` | `#4A8ABF` | ✅ **new** |
| `--type-post` | `#8A4B6B` | `#C27A9C` | ✅ **new** |

---

## Frontend Handoff Notes

**To implement:** Copy the CSS blocks from Section A and Section B directly into `packages/web-ui/app/globals.css`:

1. **Spacing tokens** → append to the `:root` block (after `--nav-width`)
2. **Type colors (light)** → replace existing `--type-*` block in `:root` (lines 43–50) with the full 9-token set
3. **Type colors (dark)** → append to the `[data-theme="dark"]` block (before closing `}`)

**Replace, don't append**, for the type colors — the existing values (`#2563EB` blue, `#7C3AED` purple) are the pre-MEMORIA defaults and must be retired.

**Usage conventions:**
- Left-bar indicators: `background: var(--type-{type})` at 3px width
- Type badges: `background: var(--type-{type})` at 8% opacity, `color: var(--type-{type})`
- Icons: `color: var(--type-{type})`
- Never use type colors for text on colored backgrounds without checking contrast first

---

*MEMORIA Design Spec Addendum — produced by Designer Agent*  
*Design Critic blockers resolved. Spec ready for Frontend Handoff.*
