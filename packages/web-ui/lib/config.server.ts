import fs from 'fs'
import path from 'path'

const CONFIG_PATH = path.join(process.cwd(), 'config.json')

export interface AppConfig {
  supabaseUrl: string
  supabaseAnonKey: string
  supabaseServiceKey: string
  supabaseAccessToken: string
  openrouterKey: string
}

let _cache: AppConfig | null = null

export function clearConfigCache() {
  _cache = null
}

export function getConfig(): AppConfig {
  if (_cache) return _cache
  try {
    const raw = fs.readFileSync(CONFIG_PATH, 'utf-8')
    _cache = JSON.parse(raw) as AppConfig
    return _cache
  } catch {
    return { supabaseUrl: '', supabaseAnonKey: '', supabaseServiceKey: '', supabaseAccessToken: '', openrouterKey: '' }
  }
}
