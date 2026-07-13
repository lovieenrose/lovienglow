import { createClient, type SupabaseClient } from '@supabase/supabase-js'

let cached: SupabaseClient<any, any, any> | null = null

export function getSupabaseBrowserClient(): SupabaseClient<any, any, any> {
  if (cached) return cached
  const url = import.meta.env.VITE_SUPABASE_URL
  const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY
  if (!url || !anonKey) {
    throw new Error('VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY must be set')
  }
  cached = createClient(url, anonKey, {
    auth: { persistSession: true, autoRefreshToken: true },
  })
  return cached
}
