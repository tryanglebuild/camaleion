import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js'
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js'
import { registerEntryTools } from './tools/entries.js'
import { registerSearchTools } from './tools/search.js'
import { registerProjectTools } from './tools/projects.js'
import { registerPeopleTools } from './tools/people.js'

const server = new McpServer({
  name: 'context-engine',
  version: '1.0.0',
})

registerEntryTools(server)
registerSearchTools(server)
registerProjectTools(server)
registerPeopleTools(server)

const transport = new StdioServerTransport()
await server.connect(transport)
