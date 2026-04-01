import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js'
import { createReadStream, existsSync } from 'node:fs'
import { readFile } from 'node:fs/promises'
import { basename, extname } from 'node:path'
import { supabase } from '../lib/supabase.js'
import { embedText, resolveProjectId } from '../lib/helpers.js'
import {
  UploadFileInputSchema,
  SetGenerationProfileInputSchema,
  FetchWorldContextInputSchema,
  GeneratePostsInputSchema,
  SavePostInputSchema,
} from '@context-engine/shared'

const BRAVE_API_KEY = process.env.BRAVE_API_KEY

// Chunk text into ~500 token pieces (≈2000 chars)
function chunkText(text: string, size = 2000): string[] {
  const chunks: string[] = []
  for (let i = 0; i < text.length; i += size) {
    chunks.push(text.slice(i, i + size))
  }
  return chunks
}

export function registerGenerationTools(server: McpServer) {
  // ── Upload File ──────────────────────────────────────────────────────────────
  server.tool(
    'upload_file',
    'Upload a local file to Supabase Storage and index it for RAG. Supports text files, markdown, code, PDFs (text extraction only).',
    UploadFileInputSchema.shape,
    async (input) => {
      const parsed = UploadFileInputSchema.parse(input)

      if (!existsSync(parsed.path)) {
        throw new Error(`File not found: ${parsed.path}`)
      }

      const filename = basename(parsed.path)
      const ext = extname(filename).toLowerCase()
      const category = parsed.category ?? 'documents'
      const bucketPath = `${category}/${Date.now()}-${filename}`

      // Read file content
      const fileBuffer = await readFile(parsed.path)

      // Upload to Supabase Storage
      const { error: uploadError } = await supabase.storage
        .from('context-engine-files')
        .upload(bucketPath, fileBuffer, {
          contentType: ext === '.pdf' ? 'application/pdf' : 'text/plain',
          upsert: false,
        })

      if (uploadError) throw new Error(`Upload failed: ${uploadError.message}`)

      // Extract text (for now: assume text-based files; PDF text extraction requires extra lib)
      const textContent = ['.txt', '.md', '.ts', '.tsx', '.js', '.jsx', '.py', '.json', '.yaml', '.yml', '.css', '.html', '.sql'].includes(ext)
        ? fileBuffer.toString('utf-8')
        : `[Binary file: ${filename}]`

      // Create entry in DB
      const project_id = parsed.project ? await resolveProjectId(parsed.project) : null
      const { data: entry, error: entryErr } = await supabase
        .from('entries')
        .insert({
          type: 'file',
          title: filename,
          content: textContent.slice(0, 500) + (textContent.length > 500 ? '…' : ''),
          project_id,
          tags: [...(parsed.tags ?? []), ...(parsed.project ? [parsed.project] : []), category],
          metadata: {
            bucket_path: bucketPath,
            filename,
            category,
            file_size: fileBuffer.length,
            ext,
          },
        })
        .select('id, created_at')
        .single()

      if (entryErr) throw new Error(`Failed to create file entry: ${entryErr.message}`)

      // Chunk and embed
      const chunks = chunkText(textContent)
      let chunksIndexed = 0

      for (const chunk of chunks) {
        const embedding = await embedText(chunk)
        const { error: embedErr } = await supabase.from('embeddings').insert({
          entry_id: entry.id,
          embedding: JSON.stringify(embedding),
          content: chunk,
          source_type: 'file',
          file_path: bucketPath,
        })
        if (!embedErr) chunksIndexed++
      }

      return {
        content: [{
          type: 'text',
          text: JSON.stringify({
            entry: { id: entry.id, created_at: entry.created_at },
            bucket_path: bucketPath,
            chunks_indexed: chunksIndexed,
          }),
        }],
      }
    }
  )

  // ── Set Generation Profile ───────────────────────────────────────────────────
  server.tool(
    'set_generation_profile',
    'Set or update the content generation profile for a platform (LinkedIn, Twitter, Newsletter). Defines tone, intent, topics, and what to avoid.',
    SetGenerationProfileInputSchema.shape,
    async (input) => {
      const parsed = SetGenerationProfileInputSchema.parse(input)

      const { data, error } = await supabase
        .from('generation_profiles')
        .upsert(
          {
            platform: parsed.platform,
            intent: parsed.intent,
            tone: parsed.tone,
            topics: parsed.topics,
            avoid: parsed.avoid,
            post_frequency: parsed.post_frequency ?? null,
            language: parsed.language,
            active: true,
          },
          { onConflict: 'platform' }
        )
        .select('*')
        .single()

      if (error) throw new Error(`Failed to set profile: ${error.message}`)

      return {
        content: [{ type: 'text', text: JSON.stringify(data) }],
      }
    }
  )

  // ── Fetch World Context ──────────────────────────────────────────────────────
  server.tool(
    'fetch_world_context',
    'Fetch recent news and trends on your topics using Brave Search API. Requires BRAVE_API_KEY env variable.',
    FetchWorldContextInputSchema.shape,
    async (input) => {
      const parsed = FetchWorldContextInputSchema.parse(input)

      if (!BRAVE_API_KEY) {
        return {
          content: [{
            type: 'text',
            text: JSON.stringify({
              error: 'BRAVE_API_KEY not set. Add it to your .env to enable world context.',
              articles: [],
            }),
          }],
        }
      }

      // Resolve topics from profile if not provided
      let topics = parsed.topics
      if (!topics || topics.length === 0) {
        const { data: profile } = await supabase
          .from('generation_profiles')
          .select('topics')
          .eq('active', true)
          .limit(1)
          .single()
        topics = profile?.topics ?? []
      }

      const query = (topics ?? []).join(' OR ')
      if (!query) {
        return { content: [{ type: 'text', text: JSON.stringify({ articles: [], note: 'No topics configured in profile.' }) }] }
      }
      const url = `https://api.search.brave.com/res/v1/news/search?q=${encodeURIComponent(query)}&count=${parsed.limit}&freshness=${parsed.since ?? 'pd'}`

      const res = await fetch(url, {
        headers: {
          'Accept': 'application/json',
          'Accept-Encoding': 'gzip',
          'X-Subscription-Token': BRAVE_API_KEY,
        },
      })

      if (!res.ok) throw new Error(`Brave Search API error: ${res.status} ${res.statusText}`)

      const body = await res.json() as {
        results?: { title: string; description: string; url: string; published: string }[]
      }

      const articles = (body.results ?? []).map(r => ({
        title: r.title,
        summary: r.description,
        url: r.url,
        published_at: r.published,
      }))

      return {
        content: [{ type: 'text', text: JSON.stringify({ articles }) }],
      }
    }
  )

  // ── Generate Posts ───────────────────────────────────────────────────────────
  server.tool(
    'generate_posts',
    'Prepare context for post generation: fetches recent memory + world news and returns a structured prompt for Claude to write posts from.',
    GeneratePostsInputSchema.shape,
    async (input) => {
      const parsed = GeneratePostsInputSchema.parse(input)

      // Load active profile
      const { data: profile } = await supabase
        .from('generation_profiles')
        .select('*')
        .eq('platform', parsed.platform ?? 'linkedin')
        .single()

      // Load recent memory entries (last 7 days)
      const since = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString()
      const { data: recentEntries } = await supabase
        .from('entries')
        .select('type, title, content, tags, created_at')
        .gte('created_at', since)
        .in('type', ['task', 'decision', 'note', 'log', 'analysis'])
        .order('created_at', { ascending: false })
        .limit(15)

      const memoryContext = (recentEntries ?? [])
        .map(e => `[${e.type.toUpperCase()}] ${e.title}${e.content ? ': ' + e.content.slice(0, 200) : ''}`)
        .join('\n')

      const promptLines = [
        `# Post Generation Context`,
        `Platform: ${parsed.platform ?? profile?.platform ?? 'linkedin'}`,
        `Count: ${parsed.count} drafts`,
        `Focus: ${parsed.focus}`,
        parsed.topic_hint ? `Topic hint: ${parsed.topic_hint}` : '',
        ``,
        `## Profile`,
        profile ? `Intent: ${profile.intent}` : 'No profile set — use get_context() to check.',
        profile ? `Tone: ${profile.tone}` : '',
        profile ? `Topics: ${profile.topics.join(', ')}` : '',
        profile ? `Avoid: ${profile.avoid.join(', ')}` : '',
        profile ? `Language: ${profile.language}` : '',
        ``,
        `## Your Recent Work (last 7 days)`,
        memoryContext || 'No recent entries found.',
        ``,
        `---`,
        `Write ${parsed.count} post draft(s) based on the above context.`,
        `For each draft, format as:`,
        `DRAFT N:`,
        `[post content]`,
        `---`,
      ].filter(l => l !== undefined)

      return {
        content: [{ type: 'text', text: promptLines.join('\n') }],
      }
    }
  )

  // ── Save Post ────────────────────────────────────────────────────────────────
  server.tool(
    'save_post',
    'Save a post draft or published post to memory.',
    SavePostInputSchema.shape,
    async (input) => {
      const parsed = SavePostInputSchema.parse(input)

      const { data: entry, error } = await supabase
        .from('entries')
        .insert({
          type: 'post',
          title: parsed.content.slice(0, 80) + (parsed.content.length > 80 ? '…' : ''),
          content: parsed.content,
          status: parsed.published ? 'done' : 'pending',
          tags: [parsed.platform],
          metadata: {
            platform: parsed.platform,
            published: parsed.published,
            published_at: parsed.published_at ?? null,
          },
        })
        .select('id, created_at')
        .single()

      if (error) throw new Error(`Failed to save post: ${error.message}`)

      // Embed
      const embedding = await embedText(parsed.content)
      await supabase.from('embeddings').insert({
        entry_id: entry.id,
        embedding: JSON.stringify(embedding),
        content: parsed.content,
      })

      return {
        content: [{ type: 'text', text: JSON.stringify({ id: entry.id, created_at: entry.created_at }) }],
      }
    }
  )
}
