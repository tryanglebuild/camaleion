# Context Engine — V1 Finalization

> **Goal:** Polish and close V1 with the features needed to make the app genuinely usable and complete.  
> This doc captures all discussed ideas — Obsidian-style notes, UX essentials, and differentiating features.

---

## 🎯 Definition of "V1 Done"

V1 is done when:
- A new user can open the app and immediately understand what it does
- The AI can read and write memory reliably, with visible feedback
- The core UX flows (create, edit, search, view) feel polished and complete
- At least one "wow" feature that makes the product feel unique

---

## 🔴 Must-Have (blocks v1 from being "done")

### Empty States & Onboarding
Each section should guide the user when there's no data yet.
- Illustrated empty state per section (entries, tasks, projects, people...)
- A "first steps" hint on the Overview page: connect MCP → create first entry → search it

### Toast / Notification System
No visual feedback currently on saves, errors, or deletes.
- Global toast provider (top-right or bottom-center)
- Success: entry saved, task moved, rule created
- Error: save failed, connection lost
- Soft confirm for destructive actions (delete)

### Delete with Confirmation
Prevent accidental data loss.
- Inline confirm on cards ("Are you sure?") or a small modal
- Applies to: entries, projects, people, rules, plans

### Keyboard Shortcuts
Essential for power users and AI-native workflows.
| Shortcut | Action |
|---|---|
| `⌘K` / `Ctrl+K` | Global command palette / quick search |
| `N` | New entry (focused on current section type) |
| `E` | Edit selected item |
| `Esc` | Close panel / modal |
| `↑ ↓` | Navigate list |

### Search with Filters
The current semantic search lacks refinement options.
- Filter by: `type`, `project`, `date range`, `status`, `tags`
- Show match score / relevance indicator
- Highlight matched terms in results

---

## 🟡 Should-Have (quality of life for v1)

### Dashboard with Real Metrics
The Overview page should show live numbers that are actually useful.
- Open tasks (with % done)
- Entries created this week vs last week
- Active projects count
- Last memory write (timestamp + what was written)
- MCP connection status (DB / MCP / VEC already partially there)

### Activity Feed / Audit Trail
A chronological log of what the AI has been writing automatically.
- "Claude added a decision: [title] — 2 hours ago"
- "Entry moved to done: [title]"
- Helps build trust that the AI is working correctly
- Could live as a sidebar on Overview or a dedicated section

### Bulk Actions on Entries
When working with many memories, need to act on multiple at once.
- Multi-select mode (checkbox or shift-click)
- Actions: Delete, change status, move to project, add tag

### Pin / Star Entries
Mark important decisions, rules, or notes as pinned.
- Appear at top of their section
- Accessible from Overview as "Pinned"

### Duplicate Entry
Useful for recurring templates (weekly reviews, standups, meeting notes).
- "Duplicate" action on entry card
- Creates a copy with `[Copy]` prefix, clears status

### Export
Basic data ownership feature.
- Export all entries as JSON or CSV
- Export per project or by type
- Could live in a Settings page

---

## 🟢 Polish (makes it feel complete)

### Responsivo Básico
App should work at minimum on tablet.
- Sidebar collapses to icon-only below 768px (already has collapse logic, extend it)
- EntryDetail panel stacks vertically on mobile
- Modals full-screen on small screens

### Profile / Settings Page
Minimal system configuration in one place.
- MCP server connection config (already shown in header dots)
- Appearance: dark/light toggle (already exists, move here)
- Export data button
- API key status (OpenAI embed model)

### Consistent Entry Types
Add the missing entry types that the MCP supports but the UI doesn't surface well.
- `analysis` and `plan` as viewable types in Memory section
- `post` entries visible in Content section (already exists but verify)
- `file` type placeholder for V2

---

## 💡 Obsidian-Style Notes (Differentiator Feature)

The idea: every entry can be viewed and edited as a full-page document, not just a card/modal.

### What changes
- New route: `/dashboard/notes/[id]` — full-page view for any entry
- **Inline editing** — click title or content to edit directly (no "Edit" button)
- **Rich text / Markdown** — support Markdown in content field with live preview
- **Split layout** — entry list on the left, document on the right (like Obsidian / Notion)
- Exit via back button or `Esc`

### Additional notes features (nice to have for v1 or v2)
| Feature | Description |
|---|---|
| **`[[wikilinks]]`** | Type `[[` to link to another entry by title — leverages existing RAG graph |
| **Backlinks panel** | Bottom of note: "Referenced by X entries" |
| **Templates** | Per-type templates: task has a checklist structure, decision has a why/what/tradeoffs template |
| **Full-page in Memory section** | Toggle between card grid and document mode in the existing Entries section |

---

## 🌟 Timeline / History View (Wow Feature)

A chronological view of the entire memory, organized by project.

- Vertical timeline, most recent at top
- Each node is an entry: color-coded by type
- Filter by project → see how a project evolved over time
- Shows AI-written context alongside manually created entries
- Like `git log --oneline` but for your brain

This would be a standalone section in the nav (between Graph and Tasks) or a view toggle inside a project page.

---

## 📋 Suggested Priority Order

```
1. Toast system            ← unblocks all other feedback
2. Delete confirmation     ← prevents data loss
3. Keyboard shortcuts      ← foundational for UX feel
4. Empty states            ← first impression
5. Dashboard metrics       ← shows the system is working
6. Search filters          ← makes search actually useful
7. Notes / full-page view  ← differentiator
8. Activity feed           ← trust-building
9. Bulk actions            ← power user
10. Timeline view          ← wow factor
11. Export + Settings      ← completeness
12. Responsive             ← accessibility
```

---

## 🔗 Relationships with Other Versions

| Feature | Version |
|---|---|
| File attachments on entries | V2 (Supabase Storage) |
| Wikilinks with full graph integration | V2 |
| AI-proactive suggestions | V3 |
| Shared memory / team mode | V3 |

---

*Last updated: 2026-04-01*
