import { NextResponse } from 'next/server'
import fs from 'fs'
import path from 'path'
import { execSync } from 'child_process'
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

async function deployFunction(_ref: string, pat: string, slug: string): Promise<Step> {
  try {
    execSync(`supabase functions deploy ${slug} --use-api`, {
      cwd: REPO_ROOT,
      env: { ...process.env, SUPABASE_ACCESS_TOKEN: pat },
      stdio: 'pipe',
    })
    return { name: `Function: ${slug}`, status: 'ok' }
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : String(e)
    return { name: `Function: ${slug}`, status: 'error', message: msg.slice(0, 300) }
  }
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
    const srcPath = path.join(functionsDir, slug, 'index.ts')
    if (!fs.existsSync(srcPath)) {
      steps.push({ name: `Function: ${slug}`, status: 'error', message: 'Source file not found' })
      continue
    }
    steps.push(await deployFunction(ref, supabaseAccessToken, slug))
  }

  // 3. Apply migrations via CLI (tracks applied migrations automatically)
  try {
    execSync('supabase db push --use-api', {
      cwd: REPO_ROOT,
      env: { ...process.env, SUPABASE_ACCESS_TOKEN: supabaseAccessToken },
      stdio: 'pipe',
    })
    steps.push({ name: 'Migrations', status: 'ok' })
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : String(e)
    steps.push({ name: 'Migrations', status: 'error', message: msg.slice(0, 300) })
  }

  const hasError = steps.some(s => s.status === 'error')
  return NextResponse.json({ steps, ok: !hasError })
}
