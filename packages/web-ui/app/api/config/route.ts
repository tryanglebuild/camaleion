import { NextRequest, NextResponse } from 'next/server'
import fs from 'fs'
import path from 'path'
import { clearConfigCache } from '@/lib/config.server'

const CONFIG_PATH = path.join(process.cwd(), 'config.json')

export interface AppConfig {
  supabaseUrl: string
  supabaseAnonKey: string
  supabaseServiceKey: string
  supabaseAccessToken: string
  openrouterKey: string
}

function readConfig(): AppConfig {
  try {
    return JSON.parse(fs.readFileSync(CONFIG_PATH, 'utf-8'))
  } catch {
    return { supabaseUrl: '', supabaseAnonKey: '', supabaseServiceKey: '', supabaseAccessToken: '', openrouterKey: '' }
  }
}

function mask(v: string) { return v ? v.slice(0, 20) + '…' : '' }

export async function GET() {
  const config = readConfig()
  return NextResponse.json({
    supabaseUrl:         config.supabaseUrl,
    supabaseAnonKey:     mask(config.supabaseAnonKey),
    supabaseServiceKey:  mask(config.supabaseServiceKey),
    supabaseAccessToken: mask(config.supabaseAccessToken),
    openrouterKey:       mask(config.openrouterKey),
    configured: !!(config.supabaseUrl && config.supabaseAnonKey && config.supabaseServiceKey),
  })
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json() as Partial<AppConfig>
    const current = readConfig()
    const next: AppConfig = {
      supabaseUrl:         body.supabaseUrl         ?? current.supabaseUrl,
      supabaseAnonKey:     body.supabaseAnonKey     ?? current.supabaseAnonKey,
      supabaseServiceKey:  body.supabaseServiceKey  ?? current.supabaseServiceKey,
      supabaseAccessToken: body.supabaseAccessToken ?? current.supabaseAccessToken,
      openrouterKey:       body.openrouterKey       ?? current.openrouterKey,
    }
    // Don't overwrite with masked values
    if (body.supabaseAnonKey?.endsWith('…'))     next.supabaseAnonKey     = current.supabaseAnonKey
    if (body.supabaseServiceKey?.endsWith('…'))  next.supabaseServiceKey  = current.supabaseServiceKey
    if (body.supabaseAccessToken?.endsWith('…')) next.supabaseAccessToken = current.supabaseAccessToken
    if (body.openrouterKey?.endsWith('…'))       next.openrouterKey       = current.openrouterKey
    fs.writeFileSync(CONFIG_PATH, JSON.stringify(next, null, 2))
    clearConfigCache()
    return NextResponse.json({ ok: true })
  } catch (err) {
    return NextResponse.json({ error: err instanceof Error ? err.message : 'Unknown' }, { status: 500 })
  }
}
