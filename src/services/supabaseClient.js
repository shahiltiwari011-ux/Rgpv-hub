import { createClient } from '@supabase/supabase-js'

const supabaseUrl = (import.meta.env.VITE_SUPABASE_URL || '').trim()
const supabaseAnonKey = (import.meta.env.VITE_SUPABASE_ANON_KEY || '').trim()

if (!supabaseUrl || !supabaseAnonKey) {
  console.error(
    '🚨 CONFIG ERROR: Supabase credentials are missing!\n' +
    'Please verify .env.local contains VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY.'
  )
}

export const supabase =
  supabaseUrl && supabaseAnonKey
    ? createClient(supabaseUrl, supabaseAnonKey, {
      auth: {
        // Unique storage key prevents navigator.locks collisions from stale dev sessions
        storageKey: 'study-hub-auth-v2',
        // Production-critical: keep users logged in across page refreshes
        persistSession: true,
        // Automatically refresh JWT before it expires
        autoRefreshToken: true,
        // Detect and restore session from URL hash (OAuth/magic link support)
        detectSessionInUrl: true
      },
      global: {
        // Hard 20-second ceiling on all Supabase fetch calls
        fetch: (url, options = {}) => {
          const controller = new AbortController()
          const id = setTimeout(() => controller.abort(), 20000)
          return fetch(url, { ...options, signal: controller.signal })
            .finally(() => clearTimeout(id))
        }
      }
    })
    : null

export const isSupabaseReady = () => supabase !== null
