import { createClient } from '@supabase/supabase-js'

const supabaseUrl = (import.meta.env.VITE_SUPABASE_URL || '').trim()
const supabaseAnonKey = (import.meta.env.VITE_SUPABASE_ANON_KEY || '').trim()


if (!supabaseUrl || !supabaseAnonKey) {
  console.error(
    '🚨 CONFIG ERROR: Supabase credentials are missing!\n' +
    'Please verify .env.local contains VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY.\n' +
    'IMPORTANT: You MUST restart your Vite development server (npm run dev) after creating or editing .env.local for changes to take effect.'
  )
} else {
  console.log('✅ Supabase initialized with project:', supabaseUrl.split('//')[1]?.split('.')[0])
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
        // High 60-second ceiling to allow for paused free-tier projects to wake up
        fetch: (url, options = {}) => {
          const controller = new AbortController()
          const id = setTimeout(() => controller.abort(), 60000)
          return fetch(url, { ...options, signal: controller.signal })
            .finally(() => clearTimeout(id))
        }
      }
    })
    : null

export const isSupabaseReady = () => {
  return !!(supabase && supabaseUrl && supabaseAnonKey)
}

/**
 * Checks if the Supabase project is reachable
 * @returns {Promise<boolean>}
 */
export async function checkSupabaseConnection() {
  if (!supabase) return false
  try {
    // Try a simple ping to the resources table
    const { error } = await supabase.from('resources').select('id', { head: true }).limit(1)
    
    if (error) {
      // PGRST116: Result not found (Table exists but empty)
      // 42P01: relation "resources" does not exist (Connected but schema missing)
      if (
        error.code === 'PGRST116' || 
        error.code === '42P01' || 
        error.message?.includes('not found') ||
        error.message?.includes('exist')
      ) {
        console.log('📡 Connected to Supabase (Database ready or initialization pending)')
        return true
      }
      console.warn('Supabase connectivity check failed:', error.code, error.message)
      return false
    }
    return true
  } catch (err) {
    console.error('Supabase connection exception:', err.message)
    return false
  }
}
