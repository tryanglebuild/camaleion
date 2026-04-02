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

function makeClient(): SupabaseClient {
  const { supabaseUrl, supabaseAnonKey } = getClientConfig()
  if (!supabaseUrl || !supabaseAnonKey) {
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
