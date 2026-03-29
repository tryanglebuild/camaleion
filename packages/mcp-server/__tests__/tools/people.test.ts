import { describe, it, expect, vi, beforeEach } from 'vitest'
import { makeMockServer, parseResult } from '../helpers.js'

// ── Mocks ────────────────────────────────────────────────────────────────────
vi.mock('../../src/lib/supabase.js', () => ({
  supabase: { from: vi.fn() },
}))

const { registerPeopleTools } = await import('../../src/tools/people.js')

describe('people tools', () => {
  let handlers: Map<string, (input: Record<string, unknown>) => Promise<{ content: { type: string; text: string }[] }>>

  beforeEach(() => {
    vi.clearAllMocks()
    const { server, handlers: h } = makeMockServer()
    registerPeopleTools(server as never)
    handlers = h
  })

  // ── add_person ─────────────────────────────────────────────────────────────

  describe('add_person', () => {
    it('creates a person with all fields', async () => {
      const person = {
        id: 'per-1', name: 'Alice', role: 'CTO',
        company: 'Tryangle', email: 'alice@tryangle.io', notes: 'Main contact',
      }
      const { supabase } = await import('../../src/lib/supabase.js')
      vi.mocked(supabase.from).mockReturnValue({
        insert: vi.fn().mockReturnValue({
          select: vi.fn().mockReturnValue({
            single: vi.fn().mockResolvedValue({ data: person, error: null }),
          }),
        }),
      } as never)

      const result = await handlers.get('add_person')!({
        name: 'Alice', role: 'CTO',
        company: 'Tryangle', email: 'alice@tryangle.io', notes: 'Main contact',
      })

      const data = parseResult(result)
      expect(data.name).toBe('Alice')
      expect(data.role).toBe('CTO')
    })

    it('creates a person with name only', async () => {
      const person = { id: 'per-2', name: 'Bob', role: null, company: null }
      const { supabase } = await import('../../src/lib/supabase.js')
      vi.mocked(supabase.from).mockReturnValue({
        insert: vi.fn().mockReturnValue({
          select: vi.fn().mockReturnValue({
            single: vi.fn().mockResolvedValue({ data: person, error: null }),
          }),
        }),
      } as never)

      const result = await handlers.get('add_person')!({ name: 'Bob' })
      expect(parseResult(result).name).toBe('Bob')
    })

    it('throws on insert error', async () => {
      const { supabase } = await import('../../src/lib/supabase.js')
      vi.mocked(supabase.from).mockReturnValue({
        insert: vi.fn().mockReturnValue({
          select: vi.fn().mockReturnValue({
            single: vi.fn().mockResolvedValue({ data: null, error: { message: 'constraint error' } }),
          }),
        }),
      } as never)

      await expect(
        handlers.get('add_person')!({ name: 'Fail' }),
      ).rejects.toThrow('Failed to create person')
    })
  })

  // ── get_people ─────────────────────────────────────────────────────────────

  describe('get_people', () => {
    it('returns all people', async () => {
      const people = [
        { id: 'per-1', name: 'Alice' },
        { id: 'per-2', name: 'Bob' },
      ]
      const { supabase } = await import('../../src/lib/supabase.js')
      vi.mocked(supabase.from).mockReturnValue({
        select: vi.fn().mockReturnValue({
          order: vi.fn().mockResolvedValue({ data: people, error: null }),
        }),
      } as never)

      const result = await handlers.get('get_people')!({})
      expect(parseResult(result)).toHaveLength(2)
    })

    it('filters by company', async () => {
      const { supabase } = await import('../../src/lib/supabase.js')
      vi.mocked(supabase.from).mockReturnValue({
        select: vi.fn().mockReturnValue({
          order: vi.fn().mockReturnValue({
            ilike: vi.fn().mockResolvedValue({
              data: [{ id: 'per-1', name: 'Alice', company: 'Tryangle' }],
              error: null,
            }),
          }),
        }),
      } as never)

      const result = await handlers.get('get_people')!({ company: 'Tryangle' })
      expect(parseResult(result)[0].company).toBe('Tryangle')
    })

    it('throws on query error', async () => {
      const { supabase } = await import('../../src/lib/supabase.js')
      vi.mocked(supabase.from).mockReturnValue({
        select: vi.fn().mockReturnValue({
          order: vi.fn().mockResolvedValue({ data: null, error: { message: 'db error' } }),
        }),
      } as never)

      await expect(handlers.get('get_people')!({})).rejects.toThrow('Failed to get people')
    })

    it('registers exactly 2 tools', () => {
      const { server, handlers: h } = makeMockServer()
      registerPeopleTools(server as never)
      expect(h.size).toBe(2)
    })
  })
})
