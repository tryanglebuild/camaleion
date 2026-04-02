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
  instructions: `You are connected to Context Engine — a persistent memory and knowledge system.

MANDATORY at the start of EVERY session (do both in parallel):
1. Call get_rules() — loads all active behavior rules. Read them and apply for the full session.
2. Call query_context({ question: <user's first message> }) — reconstructs relevant memory before answering.

These two calls are NON-NEGOTIABLE and define how you must behave in this session.

Available tools:
- Memory: add_entry, get_entries, update_entry, search_memory, query_context
- Projects: add_project, get_projects
- People: add_person, get_people
- Rules: get_rules, add_rule, update_rule, delete_rule
- Analysis: save_analysis, get_analyses
- Planning: save_plan
- Generation: save_post, set_generation_profile, generate_posts`,
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
