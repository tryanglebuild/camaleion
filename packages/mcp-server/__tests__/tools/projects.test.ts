import { describe, it, expect, vi, beforeEach } from 'vitest'
import { makeMockServer, parseResult } from '../helpers.js'

// ── Mocks ────────────────────────────────────────────────────────────────────
vi.mock('../../src/lib/supabase.js', () => ({
  supabase: { from: vi.fn() },
}))

const { registerProjectTools } = await import('../../src/tools/projects.js')

describe('projects tools', () => {
  let handlers: Map<string, (input: Record<string, unknown>) => Promise<{ content: { type: string; text: string }[] }>>

  beforeEach(() => {
    vi.clearAllMocks()
    const { server, handlers: h } = makeMockServer()
    registerProjectTools(server as never)
    handlers = h
  })

  // ── add_project ────────────────────────────────────────────────────────────

  describe('add_project', () => {
    it('creates a project with all fields', async () => {
      const proj = {
        id: 'p1', name: 'Context Engine', company: 'Tryangle',
        stack: ['Node', 'Supabase'], status: 'active', description: 'MCP system',
      }
      const { supabase } = await import('../../src/lib/supabase.js')
      vi.mocked(supabase.from).mockReturnValue({
        insert: vi.fn().mockReturnValue({
          select: vi.fn().mockReturnValue({
            single: vi.fn().mockResolvedValue({ data: proj, error: null }),
          }),
        }),
      } as never)

      const result = await handlers.get('add_project')!({
        name: 'Context Engine',
        company: 'Tryangle',
        stack: ['Node', 'Supabase'],
        description: 'MCP system',
        status: 'active',
      })

      const data = parseResult(result)
      expect(data.name).toBe('Context Engine')
      expect(data.company).toBe('Tryangle')
    })

    it('creates a project with minimal fields', async () => {
      const proj = { id: 'p2', name: 'Minimal', company: null, stack: null, status: 'active' }
      const { supabase } = await import('../../src/lib/supabase.js')
      vi.mocked(supabase.from).mockReturnValue({
        insert: vi.fn().mockReturnValue({
          select: vi.fn().mockReturnValue({
            single: vi.fn().mockResolvedValue({ data: proj, error: null }),
          }),
        }),
      } as never)

      const result = await handlers.get('add_project')!({ name: 'Minimal' })
      expect(parseResult(result).name).toBe('Minimal')
    })

    it('throws on insert error', async () => {
      const { supabase } = await import('../../src/lib/supabase.js')
      vi.mocked(supabase.from).mockReturnValue({
        insert: vi.fn().mockReturnValue({
          select: vi.fn().mockReturnValue({
            single: vi.fn().mockResolvedValue({ data: null, error: { message: 'unique violation' } }),
          }),
        }),
      } as never)

      await expect(
        handlers.get('add_project')!({ name: 'Duplicate' }),
      ).rejects.toThrow('Failed to create project')
    })
  })

  // ── get_projects ───────────────────────────────────────────────────────────

  describe('get_projects', () => {
    it('returns all projects without filter', async () => {
      const projects = [
        { id: 'p1', name: 'A', status: 'active' },
        { id: 'p2', name: 'B', status: 'paused' },
      ]
      const { supabase } = await import('../../src/lib/supabase.js')
      vi.mocked(supabase.from).mockReturnValue({
        select: vi.fn().mockReturnValue({
          order: vi.fn().mockResolvedValue({ data: projects, error: null }),
        }),
      } as never)

      const result = await handlers.get('get_projects')!({})
      expect(parseResult(result)).toHaveLength(2)
    })

    it('filters by status', async () => {
      const { supabase } = await import('../../src/lib/supabase.js')
      vi.mocked(supabase.from).mockReturnValue({
        select: vi.fn().mockReturnValue({
          order: vi.fn().mockReturnValue({
            eq: vi.fn().mockResolvedValue({ data: [{ id: 'p1', status: 'active' }], error: null }),
          }),
        }),
      } as never)

      const result = await handlers.get('get_projects')!({ status: 'active' })
      expect(parseResult(result)[0].status).toBe('active')
    })

    it('throws on query error', async () => {
      const { supabase } = await import('../../src/lib/supabase.js')
      vi.mocked(supabase.from).mockReturnValue({
        select: vi.fn().mockReturnValue({
          order: vi.fn().mockResolvedValue({ data: null, error: { message: 'db error' } }),
        }),
      } as never)

      await expect(handlers.get('get_projects')!({})).rejects.toThrow('Failed to get projects')
    })

    it('registers exactly 2 tools', () => {
      const { server, handlers: h } = makeMockServer()
      registerProjectTools(server as never)
      expect(h.size).toBe(2)
    })
  })
})
