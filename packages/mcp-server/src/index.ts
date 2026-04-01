import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js'
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js'
import { registerEntryTools } from './tools/entries.js'
import { registerSearchTools } from './tools/search.js'
import { registerProjectTools } from './tools/projects.js'
import { registerPeopleTools } from './tools/people.js'
import { registerRulesTools } from './tools/rules.js'
import { registerAnalysisTools } from './tools/analysis.js'
import { registerPlanningTools } from './tools/planning.js'
import { registerGenerationTools } from './tools/generation.js'

const server = new McpServer({
  name: 'context-engine',
  version: '2.0.0',
})

// V1
registerEntryTools(server)
registerSearchTools(server)
registerProjectTools(server)
registerPeopleTools(server)

// V2
registerRulesTools(server)
registerAnalysisTools(server)
registerPlanningTools(server)
registerGenerationTools(server)

const transport = new StdioServerTransport()
await server.connect(transport)
