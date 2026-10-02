import { createClient } from '@supabase/supabase-js'

// Production Debugging Logs (Remove after verifying Vercel config)
console.log('🔍 Supabase URL:', import.meta.env.VITE_SUPABASE_URL ? '✅ Configured' : '❌ MISSING')
console.log('🔍 Supabase Key:', import.meta.env.VITE_SUPABASE_ANON_KEY ? '✅ Configured' : '❌ MISSING')

const supabaseUrl = (import.meta.env.VITE_SUPABASE_URL || '').trim()
const supabaseAnonKey = (import.meta.env.VITE_SUPABASE_ANON_KEY || '').trim()

// Validation check for production
if (!supabaseUrl || !supabaseAnonKey) {
  console.error(
    '🚨 CRITICAL: Supabase credentials not found in environment variables!\n' +
    'Make sure VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY are set in Vercel Project Settings.'
  )
}

export const supabase = (supabaseUrl && supabaseAnonKey) 
  ? createClient(supabaseUrl, supabaseAnonKey, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
        detectSessionInUrl: true,
        storageKey: 'rgpv_hub_auth_session', // Clean storage key
      },
      global: {
        headers: { 'x-application-name': 'rgpv-study-hub' }
      }
    })
  : null

// Prevent infinite refresh_token loops if session is corrupted
if (supabase) {
  supabase.auth.onAuthStateChange(async (event, session) => {
    if (event === 'SIGNED_OUT' || event === 'USER_UPDATED') {
      // Clear any potential stale state
    }
    
    if (event === 'TOKEN_REFRESHED' && !session) {
      console.warn('⚠️ Session refresh failed. Clearing local storage.');
      localStorage.removeItem('rgpv_hub_auth_session');
    }
    
    // If we get an error response indicating invalid key, we should handle it
    // But that usually happens during a fetch
  });
}

/**
 * Enhanced connection check with session validation
 */
export async function checkSupabaseConnection() {
  if (!supabase || !supabaseUrl) {
    return false;
  }
  
  try {
    // Ping Supabase REST API root - works for any anon/authed user without triggering RLS
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 4000);
    
    const res = await fetch(`${supabaseUrl}/rest/v1/`, {
      method: 'HEAD',
      headers: {
        'apikey': supabaseAnonKey,
        'Authorization': `Bearer ${supabaseAnonKey}`,
      },
      signal: controller.signal,
    });
    
    clearTimeout(timeoutId);
    // 200 or 401 both mean the server is reachable
    return res.status < 500;
  } catch (err) {
    if (err.name === 'AbortError') {
      console.warn('⚠️ Supabase connection check timed out');
    } else {
      console.warn('⚠️ Supabase connection check failed:', err.message);
    }
    return false;
  }
}

export const isSupabaseReady = () => !!supabase;
