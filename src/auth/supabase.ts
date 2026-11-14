import { createClient, type SupabaseClient } from '@supabase/supabase-js'
import { config } from '@/lib/config'

/** Cliente de Supabase Auth; `null` si no está configurado (entonces se usa el modo de token de desarrollo). */
export const supabase: SupabaseClient | null =
  config.supabaseUrl && config.supabaseAnonKey
    ? createClient(config.supabaseUrl, config.supabaseAnonKey, {
        auth: { persistSession: true, autoRefreshToken: true, detectSessionInUrl: true },
      })
    : null

export const hasSupabase = supabase !== null
