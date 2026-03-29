import { describe, it, expect, vi, beforeEach } from 'vitest'

// ── Mocks ────────────────────────────────────────────────────────────────────
const mockSingle = vi.fn()
const mockIlike = vi.fn()
const mockInsert = vi.fn()
const mockFunctionsInvoke = vi.fn()

vi.mock('../../src/lib/supabase.js', () => ({
  supabase: {
    from: vi.fn(() => ({
      select: vi.fn().mockReturnValue({ ilike: mockIlike }),
      insert: mockInsert,
    })),
    functions: { invoke: mockFunctionsInvoke },
  },
}))

// Must import AFTER mocks
const { embedText, resolveProjectId, resolvePersonId } = await import('../../src/lib/helpers.js')

describe('lib/helpers', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  // ── embedText ──────────────────────────────────────────────────────────────

  describe('embedText', () => {
    it('returns embedding array from edge function', async () => {
      const fakeEmbedding = new Array(384).fill(0.05)
      mockFunctionsInvoke.mockResolvedValue({ data: { embedding: fakeEmbedding }, error: null })

      const result = await embedText('hello world')
      expect(result).toHaveLength(384)
      expect(result[0]).toBe(0.05)
      expect(mockFunctionsInvoke).toHaveBeenCalledWith('embed', { body: { input: 'hello world' } })
    })

    it('throws when edge function returns error', async () => {
      mockFunctionsInvoke.mockResolvedValue({ data: null, error: { message: 'function error' } })

      await expect(embedText('fail')).rejects.toThrow('Embedding failed')
    })

    it('throws when embedding field is missing', async () => {
      mockFunctionsInvoke.mockResolvedValue({ data: {}, error: null })

      await expect(embedText('empty')).rejects.toThrow('Embedding response missing')
    })
  })

  // ── resolveProjectId ───────────────────────────────────────────────────────

  describe('resolveProjectId', () => {
    it('returns existing project id', async () => {
      const { supabase } = await import('../../src/lib/supabase.js')
      mockIlike.mockReturnValue({ single: vi.fn().mockResolvedValue({ data: { id: 'proj-1' }, error: null }) })
      vi.mocked(supabase.from).mockReturnValue({
        select: vi.fn().mockReturnValue({ ilike: mockIlike }),
      } as never)

      const id = await resolveProjectId('my-project')
      expect(id).toBe('proj-1')
    })

    it('creates project if not found (PGRST116)', async () => {
      const { supabase } = await import('../../src/lib/supabase.js')
      mockIlike.mockReturnValue({
        single: vi.fn().mockResolvedValue({ data: null, error: { code: 'PGRST116' } }),
      })
      mockInsert.mockReturnValue({
        select: vi.fn().mockReturnValue({
          single: vi.fn().mockResolvedValue({ data: { id: 'new-proj' }, error: null }),
        }),
      })
      vi.mocked(supabase.from).mockReturnValue({
        select: vi.fn().mockReturnValue({ ilike: mockIlike }),
        insert: mockInsert,
      } as never)

      const id = await resolveProjectId('new-project')
      expect(id).toBe('new-proj')
    })

    it('throws on unexpected DB error', async () => {
      const { supabase } = await import('../../src/lib/supabase.js')
      mockIlike.mockReturnValue({
        single: vi.fn().mockResolvedValue({ data: null, error: { code: 'OTHER', message: 'db error' } }),
      })
      vi.mocked(supabase.from).mockReturnValue({
        select: vi.fn().mockReturnValue({ ilike: mockIlike }),
      } as never)

      await expect(resolveProjectId('fail')).rejects.toBeDefined()
    })
  })

  // ── resolvePersonId ────────────────────────────────────────────────────────

  describe('resolvePersonId', () => {
    it('returns person id when found', async () => {
      const { supabase } = await import('../../src/lib/supabase.js')
      mockIlike.mockReturnValue({
        single: vi.fn().mockResolvedValue({ data: { id: 'per-1' }, error: null }),
      })
      vi.mocked(supabase.from).mockReturnValue({
        select: vi.fn().mockReturnValue({ ilike: mockIlike }),
      } as never)

      const id = await resolvePersonId('Alice')
      expect(id).toBe('per-1')
    })

    it('returns null when person not found', async () => {
      const { supabase } = await import('../../src/lib/supabase.js')
      mockIlike.mockReturnValue({
        single: vi.fn().mockResolvedValue({ data: null, error: { code: 'PGRST116' } }),
      })
      vi.mocked(supabase.from).mockReturnValue({
        select: vi.fn().mockReturnValue({ ilike: mockIlike }),
      } as never)

      const id = await resolvePersonId('Unknown')
      expect(id).toBeNull()
    })
  })
})
