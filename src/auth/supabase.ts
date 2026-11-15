import { createClient, type SupabaseClient } from '@supabase/supabase-js'
import { config } from '@/lib/config'

/** Supabase Auth client; `null` when not configured (the development token mode is used then). */
export const supabase: SupabaseClient | null =
  config.supabaseUrl && config.supabaseAnonKey
    ? createClient(config.supabaseUrl, config.supabaseAnonKey, {
        auth: { persistSession: true, autoRefreshToken: true, detectSessionInUrl: true },
      })
    : null

export const hasSupabase = supabase !== null
