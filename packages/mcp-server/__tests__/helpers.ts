/**
 * Shared test helpers and mock factory.
 *
 * The McpServer is mocked so we can capture tool handlers and call them
 * directly without standing up a real stdio transport.
 */
import { vi } from 'vitest'

export type ToolHandler = (input: Record<string, unknown>) => Promise<{
  content: { type: string; text: string }[]
}>

/** Captures handlers registered via server.tool(...) */
export function makeMockServer() {
  const handlers = new Map<string, ToolHandler>()
  const server = {
    tool: vi.fn(
      (
        _name: string,
        _desc: string,
        _schema: unknown,
        handler: ToolHandler,
      ) => {
        handlers.set(_name, handler)
      },
    ),
  }
  return { server, handlers }
}

/** Parse JSON from the first content item of an MCP response */
export function parseResult(result: { content: { type: string; text: string }[] }) {
  return JSON.parse(result.content[0].text)
}

/** Build a chainable Supabase query mock */
export function makeQueryMock(resolvedValue: { data: unknown; error: unknown }) {
  const mock: Record<string, unknown> = {}
  const chain = [
    'select', 'insert', 'update', 'delete', 'upsert',
    'eq', 'neq', 'ilike', 'overlaps', 'in', 'gte', 'lte',
    'order', 'limit', 'single',
  ]
  chain.forEach((method) => {
    mock[method] = vi.fn(() => mock)
  })
  // Terminal call resolves the promise
  ;(mock as { single: ReturnType<typeof vi.fn> }).single = vi.fn(() =>
    Promise.resolve(resolvedValue),
  )
  // Make the object itself thenable so `await query` works
  ;(mock as unknown as Promise<unknown>).then = (resolve: (v: unknown) => unknown) =>
    Promise.resolve(resolvedValue).then(resolve)

  return mock
}
