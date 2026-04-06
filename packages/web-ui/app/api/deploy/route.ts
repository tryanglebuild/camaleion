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

// ── Secrets ───────────────────────────────────────────────────────────────────
async function setSecret(ref: string, pat: string, name: string, value: string): Promise<Step> {
  const res = await fetch(`${MGMT}/projects/${ref}/secrets`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${pat}`, 'Content-Type': 'application/json' },
    body: JSON.stringify([{ name, value }]),
  })
  if (!res.ok) return { name: `Secret: ${name}`, status: 'error', message: await res.text() }
  return { name: `Secret: ${name}`, status: 'ok' }
}

// ── Edge function deploy — pure Management API, no CLI ────────────────────────
// POST /v1/projects/{ref}/functions/deploy?slug={slug}
// slug is a QUERY PARAMETER — this is the upsert key (creates or updates)
// Body: multipart/form-data with `file` (TS source) + `metadata` (JSON config)
// Do NOT set Content-Type manually — fetch must set the multipart boundary
async function deployFunction(ref: string, pat: string, slug: string, srcPath: string): Promise<Step> {
  const src = fs.readFileSync(srcPath, 'utf-8')

  const form = new FormData()
  form.append('metadata', JSON.stringify({ entrypoint_path: 'index.ts', verify_jwt: false }))
  form.append('file', new Blob([src], { type: 'application/typescript' }), 'index.ts')

  const res = await fetch(`${MGMT}/projects/${ref}/functions/deploy?slug=${slug}`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${pat}` },
    body: form,
  })
  if (!res.ok) {
    return { name: `Function: ${slug}`, status: 'error', message: (await res.text()).slice(0, 400) }
  }
  return { name: `Function: ${slug}`, status: 'ok' }
}

// ── DB query — pure Management API, no CLI ────────────────────────────────────
// POST /v1/projects/{ref}/database/query
// Body: { query: "<sql>" }
async function runSQL(ref: string, pat: string, sql: string, label: string): Promise<Step> {
  // Strip psql meta-commands (\i, \set, etc.) which the API doesn't support
  const cleaned = sql
    .split('\n')
    .filter(l => !l.trimStart().startsWith('\\'))
    .join('\n')
    .trim()

  if (!cleaned) return { name: label, status: 'skipped', message: 'Empty after stripping psql commands' }

  const res = await fetch(`${MGMT}/projects/${ref}/database/query`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${pat}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ query: cleaned }),
  })
  if (!res.ok) {
    const txt = await res.text()
    return { name: label, status: 'error', message: txt.slice(0, 400) }
  }
  return { name: label, status: 'ok' }
}

// ── Handler ───────────────────────────────────────────────────────────────────
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

  // ── 1. Set secrets ──────────────────────────────────────────────────────────
  if (openrouterKey) {
    steps.push(await setSecret(ref, supabaseAccessToken, 'OPENROUTER_API_KEY', openrouterKey))
  } else {
    steps.push({ name: 'Secret: OPENROUTER_API_KEY', status: 'skipped', message: 'No key provided' })
  }

  // ── 2. Deploy edge functions ────────────────────────────────────────────────
  const functionsDir = path.join(REPO_ROOT, 'supabase', 'functions')
  const functionSlugs = ['embed', 'rag-answer', 'chat']
  for (const slug of functionSlugs) {
    const srcPath = path.join(functionsDir, slug, 'index.ts')
    if (!fs.existsSync(srcPath)) {
      steps.push({ name: `Function: ${slug}`, status: 'error', message: 'Source file not found' })
      continue
    }
    steps.push(await deployFunction(ref, supabaseAccessToken, slug, srcPath))
  }

  // ── 3. Apply DB schema + migrations ────────────────────────────────────────
  // Run schema.sql first (CREATE TABLE IF NOT EXISTS — idempotent)
  const schemaPath = path.join(REPO_ROOT, 'db', 'schema.sql')
  if (fs.existsSync(schemaPath)) {
    steps.push(await runSQL(ref, supabaseAccessToken, fs.readFileSync(schemaPath, 'utf-8'), 'Schema'))
  }

  // Run migration files in order (skip 001 — it just references schema.sql via \i)
  const migrationsDir = path.join(REPO_ROOT, 'db', 'migrations')
  if (fs.existsSync(migrationsDir)) {
    const files = fs.readdirSync(migrationsDir)
      .filter(f => f.endsWith('.sql') && !f.startsWith('001'))
      .sort()

    for (const file of files) {
      const sql = fs.readFileSync(path.join(migrationsDir, file), 'utf-8')
      steps.push(await runSQL(ref, supabaseAccessToken, sql, `Migration: ${file}`))
    }
  }

  const hasError = steps.some(s => s.status === 'error')
  return NextResponse.json({ steps, ok: !hasError })
}
