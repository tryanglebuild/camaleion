import { createClient, type SupabaseClient } from '@supabase/supabase-js'

const CONFIG_KEY = 'ce_config'

export interface ClientConfig { supabaseUrl: string; supabaseAnonKey: string }

export function getClientConfig(): ClientConfig {
  if (typeof window === 'undefined') return { supabaseUrl: '', supabaseAnonKey: '' }
  try {
    const raw = localStorage.getItem(CONFIG_KEY)
    if (raw) return JSON.parse(raw) as ClientConfig
  } catch { /* ignore */ }
  return { supabaseUrl: '', supabaseAnonKey: '' }
}

export function saveClientConfig(cfg: ClientConfig) {
  localStorage.setItem(CONFIG_KEY, JSON.stringify(cfg))
}

/**
 * Fetches config from the server API and syncs it to localStorage + reloads
 * the Supabase client. Call this once on app mount to recover from empty localStorage.
 */
export async function syncConfigFromServer(): Promise<void> {
  try {
    // Only seed localStorage when it's empty — never overwrite what the user set via Settings.
    // Settings.saveCredentials() already updates both config.json AND localStorage together.
    const existing = getClientConfig()
    if (existing.supabaseUrl && isValidHttpUrl(existing.supabaseUrl)) return

    const res = await fetch('/api/config')
    if (!res.ok) return
    const data = await res.json() as { supabaseUrl?: string; supabaseAnonKey?: string }
    const url = data.supabaseUrl ?? ''
    // API masks the anon key — skip masked values
    const anonKey = data.supabaseAnonKey?.endsWith('…') ? '' : (data.supabaseAnonKey ?? '')
    if (!url || !isValidHttpUrl(url)) return
    saveClientConfig({ supabaseUrl: url, supabaseAnonKey: anonKey })
    window.location.reload()
  } catch { /* ignore network errors */ }
}

function isValidHttpUrl(s: string): boolean {
  try {
    const u = new URL(s)
    return u.protocol === 'http:' || u.protocol === 'https:'
  } catch { return false }
}

function makeClient(): SupabaseClient {
  const { supabaseUrl, supabaseAnonKey } = getClientConfig()
  if (!supabaseUrl || !supabaseAnonKey || !isValidHttpUrl(supabaseUrl)) {
    // Return a no-op client so the app doesn't crash before configuration
    return createClient('https://placeholder.supabase.co', 'placeholder')
  }
  return createClient(supabaseUrl, supabaseAnonKey)
}

// Singleton — recreated when config changes via reloadSupabase()
let _client: SupabaseClient = makeClient()

export function reloadSupabase() {
  _client = makeClient()
}

// Proxy so all imports share the same reference even after reload
export const supabase = new Proxy({} as SupabaseClient, {
  get(_t, prop) {
    return (_client as unknown as Record<string | symbol, unknown>)[prop]
  },
})
