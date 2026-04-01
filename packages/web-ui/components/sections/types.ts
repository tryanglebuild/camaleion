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
  TASKS:      6,
  RULES:      7,
  ANALYSES:   8,
  PLANS:      9,
  CONTENT:   10,
  GRAPH:     11,
} as const
