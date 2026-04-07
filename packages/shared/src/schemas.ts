import { z } from 'zod'

export const EntryTypeSchema = z.enum(['task', 'note', 'decision', 'meet', 'idea', 'log', 'analysis', 'plan', 'post', 'file'])
export const EntryStatusSchema = z.enum(['pending', 'done', 'blocked'])
export const ProjectStatusSchema = z.enum(['active', 'paused', 'done'])
export const RuleCategorySchema = z.enum(['behavior', 'memory', 'output', 'general'])
export const GenerationPlatformSchema = z.enum(['linkedin', 'twitter', 'newsletter'])

// MCP tool input schemas
export const AddEntryInputSchema = z.object({
  type: EntryTypeSchema,
  title: z.string().min(1),
  content: z.string().optional(),
  project: z.string().optional(),   // project name, resolved to id server-side
  person: z.string().optional(),    // person name, resolved to id server-side
  tags: z.array(z.string()).optional(),
  status: EntryStatusSchema.optional(),
  metadata: z.record(z.unknown()).optional(),
})

export const GetEntriesInputSchema = z.object({
  type: EntryTypeSchema.optional(),
  project: z.string().optional(),
  tags: z.array(z.string()).optional(),
  status: EntryStatusSchema.optional(),
  since: z.string().optional(),     // ISO date
  limit: z.number().int().positive().max(100).default(20),
})

export const UpdateEntryInputSchema = z.object({
  id: z.string().uuid(),
  title: z.string().min(1).optional(),
  status: EntryStatusSchema.optional(),
  content: z.string().optional(),
  tags: z.array(z.string()).optional(),
  metadata: z.record(z.unknown()).optional(),
})

export const SearchMemoryInputSchema = z.object({
  query: z.string().min(1),
  type: EntryTypeSchema.optional(),
  project: z.string().optional(),
  limit: z.number().int().positive().max(20).default(5),
})

export const QueryContextInputSchema = z.object({
  question: z.string().min(1),
})

export const AddProjectInputSchema = z.object({
  name: z.string().min(1),
  company: z.string().optional(),
  stack: z.array(z.string()).optional(),
  description: z.string().optional(),
  status: ProjectStatusSchema.default('active'),
})

export const GetProjectsInputSchema = z.object({
  status: ProjectStatusSchema.optional(),
})

export const GetCompaniesInputSchema = z.object({})

export const GetProjectsByCompanyInputSchema = z.object({
  company: z.string().min(1),
})

export const AddPersonInputSchema = z.object({
  name: z.string().min(1),
  role: z.string().optional(),
  company: z.string().optional(),
  email: z.string().email().optional(),
  notes: z.string().optional(),
})

export const UpdatePersonInputSchema = z.object({
  id: z.string().uuid().optional(),
  name: z.string().min(1).optional(),
  role: z.string().optional(),
  company: z.string().optional(),
  email: z.string().email().optional(),
  notes: z.string().optional(),
}).refine(d => d.id || d.name, { message: 'Either id or name is required to identify the person' })

export const GetPeopleInputSchema = z.object({
  company: z.string().optional(),
})

// ── Module 0: Rules Engine ────────────────────────────────────────────────────

export const GetRulesInputSchema = z.object({
  category: RuleCategorySchema.optional(),
  active: z.boolean().optional(),
})

export const AddRuleInputSchema = z.object({
  title: z.string().min(1),
  content: z.string().min(1),
  category: RuleCategorySchema.optional(),
  priority: z.number().int().default(0),
})

export const UpdateRuleInputSchema = z.object({
  id: z.string().uuid(),
  title: z.string().min(1).optional(),
  content: z.string().min(1).optional(),
  active: z.boolean().optional(),
  priority: z.number().int().optional(),
  category: RuleCategorySchema.optional(),
})

export const DeleteRuleInputSchema = z.object({
  id: z.string().uuid(),
})

// ── Module 1: Analysis ────────────────────────────────────────────────────────

export const SaveAnalysisInputSchema = z.object({
  project: z.string().min(1),
  summary: z.string().min(1),
  insights: z.string().min(1),
  focus: z.enum(['debt', 'patterns', 'dependencies', 'general']).optional(),
  files_referenced: z.array(z.string()).optional(),
  tags: z.array(z.string()).optional(),
})

export const GetAnalysesInputSchema = z.object({
  project: z.string().optional(),
  focus: z.string().optional(),
  since: z.string().optional(),
  limit: z.number().int().positive().max(50).default(10),
})

export const DeleteAnalysisInputSchema = z.object({
  id: z.string().uuid(),
})

// ── Module 2: Planning ────────────────────────────────────────────────────────

export const SavePlanInputSchema = z.object({
  goal: z.string().min(1),
  project: z.string().optional(),
  tasks: z.array(z.object({
    title: z.string().min(1),
    description: z.string().optional(),
    tags: z.array(z.string()).optional(),
    depends_on: z.string().optional(),
  })).min(1),
})

// ── Module 3: Generation — Storage ───────────────────────────────────────────

export const UploadFileInputSchema = z.object({
  path: z.string().min(1),
  category: z.enum(['documents', 'code-snippets', 'notes']).optional(),
  project: z.string().optional(),
  tags: z.array(z.string()).optional(),
})

// ── Module 3: Generation — Posts ─────────────────────────────────────────────

export const SetGenerationProfileInputSchema = z.object({
  platform: GenerationPlatformSchema,
  intent: z.string().min(1),
  tone: z.string().min(1),
  topics: z.array(z.string()),
  avoid: z.array(z.string()).default([]),
  post_frequency: z.string().optional(),
  language: z.string().default('english'),
})

export const FetchWorldContextInputSchema = z.object({
  topics: z.array(z.string()).optional(),
  since: z.string().optional(),
  limit: z.number().int().positive().max(20).default(10),
})

export const GeneratePostsInputSchema = z.object({
  platform: GenerationPlatformSchema.optional(),
  count: z.number().int().positive().max(10).default(3),
  focus: z.enum(['my recent work', 'world news', 'mixed']).default('mixed'),
  topic_hint: z.string().optional(),
})

export const SavePostInputSchema = z.object({
  content: z.string().min(1),
  platform: GenerationPlatformSchema,
  published: z.boolean().default(false),
  published_at: z.string().optional(),
})

export type AddEntryInput = z.infer<typeof AddEntryInputSchema>
export type GetEntriesInput = z.infer<typeof GetEntriesInputSchema>
export type UpdateEntryInput = z.infer<typeof UpdateEntryInputSchema>
export type SearchMemoryInput = z.infer<typeof SearchMemoryInputSchema>
export type QueryContextInput = z.infer<typeof QueryContextInputSchema>
export type AddProjectInput = z.infer<typeof AddProjectInputSchema>
export type GetProjectsInput = z.infer<typeof GetProjectsInputSchema>
export type GetCompaniesInput = z.infer<typeof GetCompaniesInputSchema>
export type GetProjectsByCompanyInput = z.infer<typeof GetProjectsByCompanyInputSchema>
export type AddPersonInput = z.infer<typeof AddPersonInputSchema>
export type UpdatePersonInput = z.infer<typeof UpdatePersonInputSchema>
export type GetPeopleInput = z.infer<typeof GetPeopleInputSchema>
export type GetRulesInput = z.infer<typeof GetRulesInputSchema>
export type AddRuleInput = z.infer<typeof AddRuleInputSchema>
export type UpdateRuleInput = z.infer<typeof UpdateRuleInputSchema>
export type DeleteRuleInput = z.infer<typeof DeleteRuleInputSchema>
export type SaveAnalysisInput = z.infer<typeof SaveAnalysisInputSchema>
export type GetAnalysesInput = z.infer<typeof GetAnalysesInputSchema>
export type DeleteAnalysisInput = z.infer<typeof DeleteAnalysisInputSchema>
export type SavePlanInput = z.infer<typeof SavePlanInputSchema>
export type UploadFileInput = z.infer<typeof UploadFileInputSchema>
export type SetGenerationProfileInput = z.infer<typeof SetGenerationProfileInputSchema>
export type FetchWorldContextInput = z.infer<typeof FetchWorldContextInputSchema>
export type GeneratePostsInput = z.infer<typeof GeneratePostsInputSchema>
export type SavePostInput = z.infer<typeof SavePostInputSchema>

// ── Module: Agents ────────────────────────────────────────────────────────────

export const AgentStatusSchema = z.enum(['active', 'inactive'])
export const AgentSessionStatusSchema = z.enum(['active', 'completed', 'failed'])
export const AgentMessageTypeSchema = z.enum(['task', 'result', 'request', 'question', 'answer', 'context', 'state', 'error'])
export const AgentVerdictSchema = z.enum(['pass', 'fail', 'weak'])

export const GetAgentsInputSchema = z.object({
  status: AgentStatusSchema.optional(),
})

export const RegisterAgentInputSchema = z.object({
  name:          z.string().min(1),
  role:          z.string().min(1),
  system_prompt: z.string().min(1),
  color:         z.string().optional(),
  status:        AgentStatusSchema.optional(),
})

export const SyncAgentsInputSchema = z.object({
  local_agents: z.array(z.object({
    name:      z.string().min(1),
    file_path: z.string().min(1),
  })),
})

export const StartSessionInputSchema = z.object({
  goal: z.string().min(1),
})

export const EndSessionInputSchema = z.object({
  session_id: z.string().uuid(),
  status:     AgentSessionStatusSchema.optional().default('completed'),
  summary:    z.string().optional(),
})

export const LogMessageInputSchema = z.object({
  session_id:    z.string().uuid(),
  from_agent:    z.string().min(1),
  to_agent:      z.string().min(1),
  type:          AgentMessageTypeSchema,
  content:       z.string().min(1),
  task_id:       z.string().optional(),
  ref_task:      z.string().optional(),
  expects_reply: z.boolean().optional().default(false),
  verdict:       AgentVerdictSchema.optional(),
})

export const GetSessionContextInputSchema = z.object({
  session_id: z.string().uuid(),
})

export const ListSessionsInputSchema = z.object({
  status: AgentSessionStatusSchema.optional(),
  limit:  z.number().int().positive().max(50).default(20),
})

export type GetAgentsInput         = z.infer<typeof GetAgentsInputSchema>
export type RegisterAgentInput     = z.infer<typeof RegisterAgentInputSchema>
export type SyncAgentsInput        = z.infer<typeof SyncAgentsInputSchema>
export type StartSessionInput      = z.infer<typeof StartSessionInputSchema>
export type EndSessionInput        = z.infer<typeof EndSessionInputSchema>
export type LogMessageInput        = z.infer<typeof LogMessageInputSchema>
export type GetSessionContextInput = z.infer<typeof GetSessionContextInputSchema>
export type ListSessionsInput      = z.infer<typeof ListSessionsInputSchema>
