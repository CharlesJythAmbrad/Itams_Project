import { createClient } from "@supabase/supabase-js"

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || ""
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || ""

if (!supabaseUrl || !supabaseAnonKey) {
  console.warn(
    "Supabase URL or Anon Key is missing. Please set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY in your .env file."
  )
}

// Ensure single instance with proper configuration
let supabaseInstance = null

if (!supabaseInstance) {
  supabaseInstance = createClient(supabaseUrl, supabaseAnonKey, {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
      detectSessionInUrl: true,
      storage: window.localStorage,
      storageKey: 'sb-itams-auth-token',
      flowType: 'pkce'
    },
    global: {
      headers: {
        'x-my-custom-header': 'itams-client'
      }
    },
    db: {
      schema: 'public'
    }
  })
}

export const supabase = supabaseInstance
export default supabase
