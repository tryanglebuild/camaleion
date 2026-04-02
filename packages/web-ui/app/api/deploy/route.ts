import { NextResponse } from 'next/server'
import fs from 'fs'
import path from 'path'
import { getConfig } from '@/lib/config.server'

const MGMT = 'https://api.supabase.com/v1'
const REPO_ROOT = path.join(process.cwd(), '..', '..')

function getRef(supabaseUrl: string): string | null {
  const m = supabaseUrl.match(/https:\/\/([^.]+)\.supabase\.co/)
  return m ? m[1] : null
}

type StepStatus = 'ok' | 'error' | 'skipped'
interface Step { name: string; status: StepStatus; message?: string }

async function setSecret(ref: string, pat: string, name: string, value: string): Promise<Step> {
  const res = await fetch(`${MGMT}/projects/${ref}/secrets`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${pat}`, 'Content-Type': 'application/json' },
    body: JSON.stringify([{ name, value }]),
  })
  if (!res.ok) {
    const txt = await res.text()
    return { name: `Secret: ${name}`, status: 'error', message: txt }
  }
  return { name: `Secret: ${name}`, status: 'ok' }
}

async function deployFunction(ref: string, pat: string, slug: string, body: string): Promise<Step> {
  // Try PATCH first (update), fall back to POST (create)
  for (const [method, url] of [
    ['PATCH', `${MGMT}/projects/${ref}/functions/${slug}`],
    ['POST',  `${MGMT}/projects/${ref}/functions`],
  ] as [string, string][]) {
    const payload = method === 'POST'
      ? { slug, name: slug, body, verify_jwt: false }
      : { body, verify_jwt: false }
    const res = await fetch(url, {
      method,
      headers: { Authorization: `Bearer ${pat}`, 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    })
    if (res.ok) return { name: `Function: ${slug}`, status: 'ok' }
    if (method === 'PATCH' && res.status === 404) continue // doesn't exist yet, try POST
    const txt = await res.text()
    return { name: `Function: ${slug}`, status: 'error', message: txt }
  }
  return { name: `Function: ${slug}`, status: 'error', message: 'Failed to deploy' }
}

async function runMigration(supabaseUrl: string, serviceKey: string, slug: string, sql: string): Promise<Step> {
  // Use PostgREST RPC to run raw SQL via service key
  const res = await fetch(`${supabaseUrl}/rest/v1/rpc/exec_sql`, {
    method: 'POST',
    headers: {
      apikey: serviceKey,
      Authorization: `Bearer ${serviceKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ query: sql }),
  })
  // exec_sql may not exist — fall back to pg endpoint
  if (res.status === 404) {
    const res2 = await fetch(`${supabaseUrl}/pg/query`, {
      method: 'POST',
      headers: {
        apikey: serviceKey,
        Authorization: `Bearer ${serviceKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ query: sql }),
    })
    if (!res2.ok) {
      const txt = await res2.text()
      return { name: `Migration: ${slug}`, status: 'error', message: txt }
    }
    return { name: `Migration: ${slug}`, status: 'ok' }
  }
  if (!res.ok) {
    const txt = await res.text()
    return { name: `Migration: ${slug}`, status: 'error', message: txt }
  }
  return { name: `Migration: ${slug}`, status: 'ok' }
}

export async function POST() {
  const config = getConfig()
  const { supabaseUrl, supabaseServiceKey, supabaseAccessToken, openrouterKey } = config

  if (!supabaseUrl || !supabaseServiceKey) {
    return NextResponse.json({ error: 'Supabase credentials not configured' }, { status: 400 })
  }
  if (!supabaseAccessToken) {
    return NextResponse.json({ error: 'Supabase Access Token not configured' }, { status: 400 })
  }

  const ref = getRef(supabaseUrl)
  if (!ref) {
    return NextResponse.json({ error: 'Could not extract project ref from Supabase URL' }, { status: 400 })
  }

  const steps: Step[] = []

  // 1. Set OpenRouter secret (only if key provided)
  if (openrouterKey) {
    steps.push(await setSecret(ref, supabaseAccessToken, 'OPENROUTER_API_KEY', openrouterKey))
  } else {
    steps.push({ name: 'Secret: OPENROUTER_API_KEY', status: 'skipped', message: 'No key provided' })
  }

  // 2. Deploy edge functions
  const functionsDir = path.join(REPO_ROOT, 'supabase', 'functions')
  const functionSlugs = ['embed', 'rag-answer']
  for (const slug of functionSlugs) {
    try {
      const src = fs.readFileSync(path.join(functionsDir, slug, 'index.ts'), 'utf-8')
      steps.push(await deployFunction(ref, supabaseAccessToken, slug, src))
    } catch {
      steps.push({ name: `Function: ${slug}`, status: 'error', message: 'Could not read source file' })
    }
  }

  // 3. Apply migrations via Management API database query
  // 001_initial.sql uses `\i ../schema.sql` (psql-only command) — replace with actual schema
  const migrationsDir = path.join(REPO_ROOT, 'db', 'migrations')
  const schemaPath    = path.join(REPO_ROOT, 'db', 'schema.sql')
  let migrationFiles: string[] = []
  try {
    migrationFiles = fs.readdirSync(migrationsDir).filter(f => f.endsWith('.sql')).sort()
  } catch {
    steps.push({ name: 'Migrations', status: 'error', message: 'Could not read migrations directory' })
  }

  for (const file of migrationFiles) {
    try {
      let sql = fs.readFileSync(path.join(migrationsDir, file), 'utf-8')

      // Replace psql \i directives with the actual file content
      sql = sql.replace(/^\\i\s+(.+)$/gm, (_, ref) => {
        const target = path.resolve(migrationsDir, ref.trim())
        try { return fs.readFileSync(target, 'utf-8') } catch { return '' }
      })

      // If after substitution the file is empty or only comments, skip it
      const effective = sql.replace(/--[^\n]*/g, '').trim()
      if (!effective) {
        // Directly run the schema for the initial migration
        if (file === '001_initial.sql') {
          sql = fs.readFileSync(schemaPath, 'utf-8')
        } else {
          steps.push({ name: `Migration: ${file}`, status: 'skipped', message: 'No SQL to run' })
          continue
        }
      }

      const res = await fetch(`${MGMT}/projects/${ref}/database/query`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${supabaseAccessToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ query: sql }),
      })
      if (!res.ok) {
        const txt = await res.text()
        steps.push({ name: `Migration: ${file}`, status: 'error', message: txt })
      } else {
        steps.push({ name: `Migration: ${file}`, status: 'ok' })
      }
    } catch (e) {
      steps.push({ name: `Migration: ${file}`, status: 'error', message: String(e) })
    }
  }

  const hasError = steps.some(s => s.status === 'error')
  return NextResponse.json({ steps, ok: !hasError })
}
