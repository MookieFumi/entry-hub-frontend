/** Variables públicas del frontal (Vite solo expone las que empiezan por VITE_). */
export const config = {
  apiUrl: (import.meta.env.VITE_API_URL ?? '').replace(/\/$/, ''),
  supabaseUrl: import.meta.env.VITE_SUPABASE_URL ?? '',
  supabaseAnonKey: import.meta.env.VITE_SUPABASE_ANON_KEY ?? '',
}
