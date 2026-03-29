import { describe, it, expect, vi, beforeEach } from 'vitest'
import { makeMockServer, parseResult } from '../helpers.js'

// ── Mocks ────────────────────────────────────────────────────────────────────
vi.mock('../../src/lib/supabase.js', () => ({
  supabase: {
    from: vi.fn(),
    rpc: vi.fn(),
    functions: { invoke: vi.fn() },
  },
}))

vi.mock('../../src/lib/helpers.js', () => ({
  embedText: vi.fn().mockResolvedValue(new Array(384).fill(0.1)),
  resolveProjectId: vi.fn().mockResolvedValue('proj-uuid-1'),
  resolvePersonId: vi.fn().mockResolvedValue(null),
}))

const { registerSearchTools } = await import('../../src/tools/search.js')

describe('search tools', () => {
  let handlers: Map<string, (input: Record<string, unknown>) => Promise<{ content: { type: string; text: string }[] }>>

  beforeEach(() => {
    vi.clearAllMocks()
    const { server, handlers: h } = makeMockServer()
    registerSearchTools(server as never)
    handlers = h
  })

  // ── search_memory ──────────────────────────────────────────────────────────

  describe('search_memory', () => {
    it('returns empty when no matches', async () => {
      const { supabase } = await import('../../src/lib/supabase.js')
      vi.mocked(supabase.rpc).mockResolvedValue({ data: [], error: null } as never)

      const result = await handlers.get('search_memory')!({ query: 'what did I work on?' })
      const data = parseResult(result)
      expect(data.entries).toEqual([])
      expect(data.scores).toEqual([])
    })

    it('returns ranked entries with scores', async () => {
      const { supabase } = await import('../../src/lib/supabase.js')
      const matches = [
        { entry_id: 'e1', score: 0.95 },
        { entry_id: 'e2', score: 0.80 },
      ]
      const entries = [
        { id: 'e1', type: 'task', title: 'Build MCP' },
        { id: 'e2', type: 'note', title: 'Design decision' },
      ]

      vi.mocked(supabase.rpc).mockResolvedValue({ data: matches, error: null } as never)
      vi.mocked(supabase.from).mockReturnValue({
        select: vi.fn().mockReturnValue({
          in: vi.fn().mockResolvedValue({ data: entries, error: null }),
        }),
      } as never)

      const result = await handlers.get('search_memory')!({ query: 'MCP work', limit: 5 })
      const data = parseResult(result)
      expect(data).toHaveLength(2)
      expect(data[0].score).toBe(0.95)
      expect(data[0].entry.id).toBe('e1')
    })

    it('applies project filter', async () => {
      const { supabase } = await import('../../src/lib/supabase.js')
      vi.mocked(supabase.from).mockReturnValue({
        select: vi.fn().mockReturnValue({
          ilike: vi.fn().mockReturnValue({
            single: vi.fn().mockResolvedValue({ data: { id: 'proj-1' }, error: null }),
          }),
          in: vi.fn().mockResolvedValue({ data: [], error: null }),
        }),
      } as never)
      vi.mocked(supabase.rpc).mockResolvedValue({ data: [], error: null } as never)

      const result = await handlers.get('search_memory')!({
        query: 'test',
        project: 'my-project',
        type: 'task',
      })
      expect(parseResult(result).entries).toEqual([])
    })

    it('throws on rpc error', async () => {
      const { supabase } = await import('../../src/lib/supabase.js')
      vi.mocked(supabase.rpc).mockResolvedValue({ data: null, error: { message: 'rpc fail' } } as never)

      await expect(
        handlers.get('search_memory')!({ query: 'test' }),
      ).rejects.toThrow('Semantic search failed')
    })
  })

  // ── query_context ──────────────────────────────────────────────────────────

  describe('query_context', () => {
    it('returns "no context" when no matches', async () => {
      const { supabase } = await import('../../src/lib/supabase.js')
      vi.mocked(supabase.rpc).mockResolvedValue({ data: [], error: null } as never)

      const result = await handlers.get('query_context')!({ question: 'what did I do?' })
      expect(result.content[0].text).toContain('No relevant context')
    })

    it('formats context string with all fields', async () => {
      const { supabase } = await import('../../src/lib/supabase.js')
      const matches = [{ entry_id: 'e1', score: 0.9 }]
      const entries = [{
        id: 'e1',
        type: 'decision',
        title: 'Use Supabase',
        content: 'Decided to use Supabase for persistence.',
        status: null,
        tags: ['db', 'supabase'],
        created_at: '2024-06-15T10:00:00Z',
        project: { name: 'context-engine' },
      }]

      vi.mocked(supabase.rpc).mockResolvedValue({ data: matches, error: null } as never)
      vi.mocked(supabase.from).mockReturnValue({
        select: vi.fn().mockReturnValue({
          in: vi.fn().mockResolvedValue({ data: entries, error: null }),
        }),
      } as never)

      const result = await handlers.get('query_context')!({ question: 'why Supabase?' })
      const text = result.content[0].text
      expect(text).toContain('[DECISION] Use Supabase')
      expect(text).toContain('Project: context-engine')
      expect(text).toContain('Tags: db, supabase')
      expect(text).toContain('Decided to use Supabase')
    })

    it('formats context with status field', async () => {
      const { supabase } = await import('../../src/lib/supabase.js')
      const matches = [{ entry_id: 'e2', score: 0.85 }]
      const entries = [{
        id: 'e2',
        type: 'task',
        title: 'Implement search',
        content: null,
        status: 'pending',
        tags: null,
        created_at: '2024-06-15T10:00:00Z',
        project: null,
      }]

      vi.mocked(supabase.rpc).mockResolvedValue({ data: matches, error: null } as never)
      vi.mocked(supabase.from).mockReturnValue({
        select: vi.fn().mockReturnValue({
          in: vi.fn().mockResolvedValue({ data: entries, error: null }),
        }),
      } as never)

      const result = await handlers.get('query_context')!({ question: 'pending work?' })
      const text = result.content[0].text
      expect(text).toContain('Status: pending')
    })

    it('throws on rpc error', async () => {
      const { supabase } = await import('../../src/lib/supabase.js')
      vi.mocked(supabase.rpc).mockResolvedValue({ data: null, error: { message: 'rpc fail' } } as never)

      await expect(
        handlers.get('query_context')!({ question: 'test?' }),
      ).rejects.toThrow('Context query failed')
    })

    it('registers exactly 2 tools', () => {
      const { server, handlers: h } = makeMockServer()
      registerSearchTools(server as never)
      expect(h.size).toBe(2)
      expect(h.has('search_memory')).toBe(true)
      expect(h.has('query_context')).toBe(true)
    })
  })
})
