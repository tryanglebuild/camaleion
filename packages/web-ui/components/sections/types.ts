export interface SectionProps {
  direction: 'up' | 'down'
  initialItemId?: string
  onNavigateTo?: (sectionIndex: number, itemId?: string) => void
}

// Section indices — keep in sync with SECTIONS array in page.tsx
export const SECTION_INDEX = {
  DASHBOARD:  0,
  ENTRIES:    1,
  SEARCH:     2,
  PROJECTS:   3,
  COMPANIES:  4,
  PEOPLE:     5,
  CHAT:       6,
  AGENTS:     7,
  ANALYSES:   8,
  PLANS:      9,
  CONTENT:   10,
  GRAPH:     11,
  TIMELINE:  12,
  TASKS:     13,
  RULES:     14,
  SETTINGS:  15,
} as const
