import { describe, it, expect, vi, beforeEach } from 'vitest'
import { makeMockServer, parseResult } from '../helpers.js'

// ── Mock: supabase client ────────────────────────────────────────────────────
const mockSingle = vi.fn()
const mockSelect = vi.fn()
const mockInsert = vi.fn()
const mockUpdate = vi.fn()
const mockDelete = vi.fn()
const mockEq = vi.fn()
const mockIlike = vi.fn()
const mockOrder = vi.fn()
const mockLimit = vi.fn()
const mockOverlaps = vi.fn()
const mockGte = vi.fn()
const mockIn = vi.fn()
const mockRpc = vi.fn()
const mockFunctionsInvoke = vi.fn()

const chainable = () => ({
  select: mockSelect,
  insert: mockInsert,
  update: mockUpdate,
  delete: mockDelete,
  eq: mockEq,
  ilike: mockIlike,
  order: mockOrder,
  limit: mockLimit,
  overlaps: mockOverlaps,
  gte: mockGte,
  in: mockIn,
  single: mockSingle,
})

vi.mock('../../src/lib/supabase.js', () => ({
  supabase: {
    from: vi.fn(() => chainable()),
    rpc: mockRpc,
    functions: { invoke: mockFunctionsInvoke },
  },
}))

vi.mock('../../src/lib/helpers.js', () => ({
  embedText: vi.fn().mockResolvedValue(new Array(384).fill(0.1)),
  resolveProjectId: vi.fn().mockResolvedValue('proj-uuid-1'),
  resolvePersonId: vi.fn().mockResolvedValue('person-uuid-1'),
}))

// ── Import after mocks ───────────────────────────────────────────────────────
const { registerEntryTools } = await import('../../src/tools/entries.js')

describe('entries tools', () => {
  let handlers: Map<string, (input: Record<string, unknown>) => Promise<{ content: { type: string; text: string }[] }>>

  beforeEach(() => {
    vi.clearAllMocks()
    const { server, handlers: h } = makeMockServer()
    registerEntryTools(server as never)
    handlers = h

    // Default chain behaviour: each method returns itself for chaining
    mockSelect.mockReturnValue({
      select: mockSelect, eq: mockEq, ilike: mockIlike,
      order: mockOrder, limit: mockLimit, overlaps: mockOverlaps,
      gte: mockGte, in: mockIn, single: mockSingle,
    })
    mockInsert.mockReturnValue({ select: mockSelect, single: mockSingle })
    mockUpdate.mockReturnValue({ eq: mockEq, select: mockSelect, single: mockSingle })
    mockDelete.mockReturnValue({ eq: mockEq })
    mockEq.mockReturnValue({
      select: mockSelect, eq: mockEq, single: mockSingle,
      order: mockOrder, limit: mockLimit,
    })
    mockIlike.mockReturnValue({ single: mockSingle })
    mockOrder.mockReturnValue({ limit: mockLimit, in: mockIn })
    mockLimit.mockReturnValue(Promise.resolve({ data: [], error: null }))
    mockIn.mockReturnValue(Promise.resolve({ data: [], error: null }))
    mockOverlaps.mockReturnValue({
      order: mockOrder, limit: mockLimit,
      eq: mockEq, gte: mockGte,
    })
    mockGte.mockReturnValue({ order: mockOrder, limit: mockLimit })
  })

  // ── add_entry ──────────────────────────────────────────────────────────────

  describe('add_entry', () => {
    it('inserts entry and embeds', async () => {
      mockSingle.mockResolvedValueOnce({
        data: { id: 'entry-1', created_at: '2024-01-01' },
        error: null,
      })
      mockInsert.mockReturnValue({ select: mockSelect, single: mockSingle })
      mockSelect.mockReturnValue({ single: mockSingle })

      // embeddings insert (no single)
      const embInsert = vi.fn().mockResolvedValue({ error: null })
      const { supabase } = await import('../../src/lib/supabase.js')
      vi.mocked(supabase.from).mockReturnValueOnce({ insert: mockInsert } as never)
      vi.mocked(supabase.from).mockReturnValueOnce({ insert: embInsert } as never)

      const result = await handlers.get('add_entry')!({
        type: 'task',
        title: 'Build MCP server',
        content: 'Implement all tools',
        project: 'context-engine',
        tags: ['mcp', 'typescript'],
        status: 'pending',
      })

      const data = parseResult(result)
      expect(data).toHaveProperty('id')
    })

    it('handles entry without optional fields', async () => {
      mockSingle.mockResolvedValueOnce({
        data: { id: 'entry-2', created_at: '2024-01-02' },
        error: null,
      })
      const { supabase } = await import('../../src/lib/supabase.js')
      vi.mocked(supabase.from).mockReturnValue({
        insert: vi.fn().mockReturnValue({
          select: vi.fn().mockReturnValue({ single: mockSingle }),
        }),
      } as never)

      const result = await handlers.get('add_entry')!({
        type: 'note',
        title: 'Quick note',
      })

      const data = parseResult(result)
      expect(data.id).toBe('entry-2')
    })

    it('throws on supabase insert error', async () => {
      const { supabase } = await import('../../src/lib/supabase.js')
      vi.mocked(supabase.from).mockReturnValue({
        insert: vi.fn().mockReturnValue({
          select: vi.fn().mockReturnValue({
            single: vi.fn().mockResolvedValue({ data: null, error: { message: 'DB error' } }),
          }),
        }),
      } as never)

      await expect(
        handlers.get('add_entry')!({ type: 'note', title: 'fail' }),
      ).rejects.toThrow('Failed to create entry')
    })
  })

  // ── get_entries ────────────────────────────────────────────────────────────

  describe('get_entries', () => {
    it('returns entries without filters', async () => {
      const fakeEntries = [{ id: 'e1', type: 'task', title: 'Test' }]
      const { supabase } = await import('../../src/lib/supabase.js')
      vi.mocked(supabase.from).mockReturnValue({
        select: vi.fn().mockReturnValue({
          order: vi.fn().mockReturnValue({
            limit: vi.fn().mockResolvedValue({ data: fakeEntries, error: null }),
          }),
        }),
      } as never)

      const result = await handlers.get('get_entries')!({})
      const data = parseResult(result)
      expect(data).toHaveLength(1)
      expect(data[0].id).toBe('e1')
    })

    it('applies type filter', async () => {
      const { supabase } = await import('../../src/lib/supabase.js')
      // Full chainable mock: every method returns the same chain, last awaited call resolves
      const chain: Record<string, unknown> = {}
      const terminal = vi.fn().mockResolvedValue({ data: [], error: null })
      ;['select','order','limit','eq','gte','overlaps','in','single'].forEach((m) => {
        chain[m] = vi.fn().mockReturnValue(chain)
      })
      chain['limit'] = terminal
      // Make chain thenable so `await query` works if limit not called at end
      ;(chain as unknown as { then: unknown }).then = (r: (v: unknown) => unknown) =>
        Promise.resolve({ data: [], error: null }).then(r)
      vi.mocked(supabase.from).mockReturnValue(chain as never)

      const result = await handlers.get('get_entries')!({ type: 'task' })
      const data = parseResult(result)
      expect(data).toEqual([])
    })

    it('applies all optional filters', async () => {
      const { supabase } = await import('../../src/lib/supabase.js')
      // Full chainable mock — both from('entries') and from('projects') share the chain
      const chain: Record<string, unknown> = {}
      const terminal = vi.fn().mockResolvedValue({ data: [], error: null })
      ;['select','order','eq','gte','overlaps','in','ilike'].forEach((m) => {
        chain[m] = vi.fn().mockReturnValue(chain)
      })
      chain['limit'] = terminal
      chain['single'] = vi.fn().mockResolvedValue({ data: { id: 'proj-1' }, error: null })
      vi.mocked(supabase.from).mockReturnValue(chain as never)

      const result = await handlers.get('get_entries')!({
        type: 'task',
        status: 'pending',
        since: '2024-01-01',
        tags: ['mcp'],
        project: 'context-engine',
        limit: 5,
      })
      expect(parseResult(result)).toEqual([])
    })

    it('throws on supabase error', async () => {
      const { supabase } = await import('../../src/lib/supabase.js')
      vi.mocked(supabase.from).mockReturnValue({
        select: vi.fn().mockReturnValue({
          order: vi.fn().mockReturnValue({
            limit: vi.fn().mockResolvedValue({ data: null, error: { message: 'query error' } }),
          }),
        }),
      } as never)

      await expect(handlers.get('get_entries')!({})).rejects.toThrow('Failed to get entries')
    })
  })

  // ── update_entry ───────────────────────────────────────────────────────────

  describe('update_entry', () => {
    it('updates status only', async () => {
      const updated = { id: '00000000-0000-0000-0000-000000000001', title: 'Test', content: null, status: 'done' }
      const { supabase } = await import('../../src/lib/supabase.js')
      vi.mocked(supabase.from).mockReturnValue({
        update: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            select: vi.fn().mockReturnValue({
              single: vi.fn().mockResolvedValue({ data: updated, error: null }),
            }),
          }),
        }),
      } as never)

      const result = await handlers.get('update_entry')!({
        id: '00000000-0000-0000-0000-000000000001',
        status: 'done',
      })
      expect(parseResult(result).status).toBe('done')
    })

    it('updates content and re-embeds', async () => {
      const { embedText } = await import('../../src/lib/helpers.js')
      const updated = { id: '00000000-0000-0000-0000-000000000002', title: 'Title', content: 'New content', status: null }
      const { supabase } = await import('../../src/lib/supabase.js')
      const embDelete = vi.fn().mockReturnValue({ eq: vi.fn().mockResolvedValue({ error: null }) })
      const embInsert = vi.fn().mockResolvedValue({ error: null })

      vi.mocked(supabase.from)
        .mockReturnValueOnce({
          update: vi.fn().mockReturnValue({
            eq: vi.fn().mockReturnValue({
              select: vi.fn().mockReturnValue({
                single: vi.fn().mockResolvedValue({ data: updated, error: null }),
              }),
            }),
          }),
        } as never)
        .mockReturnValueOnce({ delete: embDelete } as never)
        .mockReturnValueOnce({ insert: embInsert } as never)

      const result = await handlers.get('update_entry')!({
        id: '00000000-0000-0000-0000-000000000002',
        content: 'New content',
      })

      expect(parseResult(result).id).toBe('00000000-0000-0000-0000-000000000002')
      expect(vi.mocked(embedText)).toHaveBeenCalled()
    })

    it('throws on update error', async () => {
      const { supabase } = await import('../../src/lib/supabase.js')
      vi.mocked(supabase.from).mockReturnValue({
        update: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            select: vi.fn().mockReturnValue({
              single: vi.fn().mockResolvedValue({ data: null, error: { message: 'update failed' } }),
            }),
          }),
        }),
      } as never)

      await expect(
        handlers.get('update_entry')!({ id: '00000000-0000-0000-0000-000000000003', status: 'done' }),
      ).rejects.toThrow('Failed to update entry')
    })

    it('registers exactly 3 tools', () => {
      const { server, handlers: h } = makeMockServer()
      registerEntryTools(server as never)
      expect(h.size).toBe(3)
      expect(h.has('add_entry')).toBe(true)
      expect(h.has('get_entries')).toBe(true)
      expect(h.has('update_entry')).toBe(true)
    })
  })
})
