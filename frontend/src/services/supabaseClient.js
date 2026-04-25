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
      console.warn('⚠️ Session refresh failed. Clearing local storage to prevent loops.');
      localStorage.removeItem('rgpv_hub_auth_session');
      window.location.reload();
    }
    
    // If we get an error response indicating invalid key, we should handle it
    // But that usually happens during a fetch
  });
}

/**
 * Enhanced connection check with session validation
 */
export async function checkSupabaseConnection() {
  if (!supabase) {
    console.error('❌ Supabase client not initialized');
    return false;
  }
  
  try {
    // Check if the current session is valid
    const { data: { session }, error: sessionError } = await supabase.auth.getSession();
    
    if (sessionError) {
      console.warn('⚠️ Session error detected:', sessionError.message);
      if (sessionError.message.includes('refresh_token') || sessionError.message.includes('invalid')) {
        console.log('🧹 Clearing corrupted session...');
        localStorage.removeItem('rgpv_hub_auth_session');
      }
    }

    // Ping the database
    const { error } = await supabase.from('resources').select('id', { head: true }).limit(1);
    
    if (error) {
      // If the error is "No API key found", it means the anon key was invalid/missing
      if (error.message?.includes('No API key found')) {
        console.error('❌ Supabase Auth Error: No API key found in request headers. Check your VITE_SUPABASE_ANON_KEY.');
        return false;
      }
      
      // These codes are acceptable for a "connected" state
      const acceptableCodes = ['PGRST116', '42P01', 'PGRST301'];
      if (acceptableCodes.includes(error.code) || error.message?.includes('not found')) {
        return true;
      }
      
      console.error('❌ Supabase Connection Failed:', error.message);
      return false;
    }
    
    return true;
  } catch (err) {
    console.error('❌ Supabase Exception:', err.message);
    return false;
  }
}

export const isSupabaseReady = () => !!supabase;
