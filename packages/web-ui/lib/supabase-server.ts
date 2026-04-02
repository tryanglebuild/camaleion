import { createClient, type SupabaseClient } from '@supabase/supabase-js'
import { getConfig } from './config.server'

// Server-side client — uses service role key, never exposed to browser.
// Reads credentials from config.json (managed via Settings UI).
function makeAdmin(): SupabaseClient {
  const { supabaseUrl, supabaseServiceKey } = getConfig()
  if (!supabaseUrl || !supabaseServiceKey) {
    return createClient('https://placeholder.supabase.co', 'placeholder', { auth: { persistSession: false } })
  }
  return createClient(supabaseUrl, supabaseServiceKey, { auth: { persistSession: false } })
}

// Proxy so each API call gets a fresh client with latest config.
// This means settings changes take effect on the next request without restart.
export const supabaseAdmin = new Proxy({} as SupabaseClient, {
  get(_t, prop) {
    return (makeAdmin() as unknown as Record<string | symbol, unknown>)[prop]
  },
})
