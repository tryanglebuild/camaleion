import { z } from 'zod'

export const EntryTypeSchema = z.enum(['task', 'note', 'decision', 'meet', 'idea', 'log'])
export const EntryStatusSchema = z.enum(['pending', 'done', 'blocked'])
export const ProjectStatusSchema = z.enum(['active', 'paused', 'done'])

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

export const AddPersonInputSchema = z.object({
  name: z.string().min(1),
  role: z.string().optional(),
  company: z.string().optional(),
  email: z.string().email().optional(),
  notes: z.string().optional(),
})

export const GetPeopleInputSchema = z.object({
  company: z.string().optional(),
})

export type AddEntryInput = z.infer<typeof AddEntryInputSchema>
export type GetEntriesInput = z.infer<typeof GetEntriesInputSchema>
export type UpdateEntryInput = z.infer<typeof UpdateEntryInputSchema>
export type SearchMemoryInput = z.infer<typeof SearchMemoryInputSchema>
export type QueryContextInput = z.infer<typeof QueryContextInputSchema>
export type AddProjectInput = z.infer<typeof AddProjectInputSchema>
export type GetProjectsInput = z.infer<typeof GetProjectsInputSchema>
export type AddPersonInput = z.infer<typeof AddPersonInputSchema>
export type GetPeopleInput = z.infer<typeof GetPeopleInputSchema>
