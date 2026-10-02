import { createContext, useContext, useEffect, useState, useRef } from 'react'
import { supabase, isSupabaseReady, checkSupabaseConnection } from '../services/supabaseClient'
import { fetchWithTimeout, getSafeSession, isAuthLockError } from '../services/api'

const AuthContext = createContext(null)

const RECONNECT_INTERVAL_MS = 30_000

export function AuthProvider ({ children }) {
  const [user, setUser] = useState(null)
  const [profile, setProfile] = useState(null)
  const [role, setRole] = useState('student')
  const [loading, setLoading] = useState(true)
  const [isConnected, setIsConnected] = useState(true)
  const checkInAttempted = useRef(false)
  const initStarted = useRef(false)
  const reconnectTimer = useRef(null)

  // Validate and normalize role string
  function resolveUserRole(dbRole) {
    if (!dbRole) return 'student';
    const normalized = dbRole.toLowerCase().trim();
    if (normalized === 'user') return 'student';
    if (normalized === 'teacher') return 'faculty';
    const validRoles = ['student', 'faculty', 'tpo', 'admin'];
    return validRoles.includes(normalized) ? normalized : 'student';
  }

  // Fetch profile and role directly from Supabase DB public.profiles table by auth user UUID
  async function _fetchProfile (userId) {
    if (!userId || !isSupabaseReady()) {
      setProfile(null);
      setRole('student');
      return null;
    }

    try {
      const { data, error } = await fetchWithTimeout(
        supabase
          .from('profiles')
          .select('id, email, name, role, last_active, xp, level, streak_days, badges')
          .eq('id', userId)
          .maybeSingle(),
        6000
      );

      if (error) {
        console.warn('[Auth] Profile fetch error:', error.message);
      }

      const finalRole = resolveUserRole(data?.role);

      const p = {
        id: userId,
        role: finalRole,
        name: data?.name || null,
        email: data?.email || null,
        last_active: data?.last_active || null,
        xp: data?.xp || 0,
        level: data?.level || 1,
        streak_days: data?.streak_days || 0,
        badges: data?.badges || []
      };

      setProfile(p);
      setRole(finalRole);
      console.log('[Auth] Authoritative profile loaded — user:', userId, 'role:', finalRole);
      return p;
    } catch (err) {
      console.warn('[Auth] Profile fetch exception:', err.message);
      const fallbackProfile = { id: userId, role: 'student', last_active: null, xp: 0 };
      setProfile(fallbackProfile);
      setRole('student');
      return fallbackProfile;
    }
  }

  // Daily check-in XP award
  async function _awardDailyXP (userId) {
    if (!isSupabaseReady() || !userId || checkInAttempted.current) return
    checkInAttempted.current = true

    const localToday = new Date().toDateString()
    const storedCheckIn = localStorage.getItem(`last_check_in_${userId}`)

    if (storedCheckIn !== localToday) {
      try {
        await fetchWithTimeout(supabase.rpc('award_xp', { xp_amount: 1 }).throwOnError(), 5000)
        localStorage.setItem(`last_check_in_${userId}`, localToday)
        void _fetchProfile(userId)
      } catch (err) {
        console.warn('Failed to award daily XP:', err.message)
        checkInAttempted.current = false
      }
    }
  }

  const profileChannelRef = useRef(null)

  function _subscribeToProfile (userId) {
    if (!userId || !isSupabaseReady()) return
    if (typeof userId === 'string' && userId.startsWith('local-')) return

    if (profileChannelRef.current) {
      supabase.removeChannel(profileChannelRef.current)
      profileChannelRef.current = null
    }

    try {
      profileChannelRef.current = supabase
        .channel(`public:profiles:id=eq.${userId}`)
        .on('postgres_changes', {
          event: 'UPDATE',
          schema: 'public',
          table: 'profiles',
          filter: `id=eq.${userId}`
        }, (payload) => {
          if (payload.new) {
            const updatedRole = resolveUserRole(payload.new.role);
            setProfile(prev => ({ ...prev, ...payload.new, role: updatedRole }))
            setRole(updatedRole)
            console.log('[Auth] Realtime role updated:', updatedRole);
          }
        })
        .subscribe()
    } catch (err) {
      console.warn('[Auth] Realtime subscription failed:', err.message);
    }
  }

  function _teardownRealtimeChannel () {
    if (profileChannelRef.current) {
      supabase.removeChannel(profileChannelRef.current)
      profileChannelRef.current = null
    }
  }

  // Auth initialization effect
  useEffect(() => {
    if (!isSupabaseReady()) {
      setLoading(false)
      return
    }

    const failsafe = setTimeout(() => {
      setLoading(false)
    }, 4000)

    async function _initAuth () {
      if (initStarted.current) return
      initStarted.current = true
      
      try {
        const sessionUser = await getSafeSession(supabase);
        
        if (sessionUser) {
          setUser(sessionUser);
          const p = await _fetchProfile(sessionUser.id);
          if (p) void _awardDailyXP(sessionUser.id);
          _subscribeToProfile(sessionUser.id);
        } else {
          setUser(null);
          setProfile(null);
          setRole('student');
        }
      } catch (err) {
        if (!isAuthLockError(err)) {
          console.warn('[Auth] Initialization error:', err.message);
        }
      } finally {
        clearTimeout(failsafe);
        setLoading(false);
        checkSupabaseConnection().then((connected) => {
          setIsConnected(connected);
        });
      }
    }

    _initAuth()

    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (event === 'SIGNED_OUT' || event === 'USER_DELETED') {
        setUser(null);
        setProfile(null);
        setRole('student');
        setLoading(false);
        _teardownRealtimeChannel();
      } else if (!session) {
        setUser(null);
        setProfile(null);
        setRole('student');
        setLoading(false);
      } else if (session?.user && (event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED')) {
        setUser(session.user);
        const p = await _fetchProfile(session.user.id);
        if (p) void _awardDailyXP(session.user.id);
        _subscribeToProfile(session.user.id);
        setLoading(false);
      } else if (session?.user) {
        setUser(session.user);
        setLoading(false);
      }
    })

    return () => {
      clearTimeout(failsafe)
      subscription?.unsubscribe()
      _teardownRealtimeChannel()
    }
  }, [])

  // Visibility listener for mobile resume
  useEffect(() => {
    const handleVisibilityChange = async () => {
      if (document.visibilityState === 'visible' && isSupabaseReady() && isConnected) {
        try {
          const sessionUser = await getSafeSession(supabase)
          if (sessionUser) {
            setUser(sessionUser)
            await _fetchProfile(sessionUser.id)
          }
        } catch {}
      }
    }

    window.addEventListener('visibilitychange', handleVisibilityChange)
    window.addEventListener('focus', handleVisibilityChange)

    return () => {
      window.removeEventListener('visibilitychange', handleVisibilityChange)
      window.removeEventListener('focus', handleVisibilityChange)
    }
  }, [isConnected])

  // Reconnect polling
  useEffect(() => {
    if (isConnected) {
      if (reconnectTimer.current) {
        clearInterval(reconnectTimer.current)
        reconnectTimer.current = null
      }
      return
    }

    reconnectTimer.current = setInterval(async () => {
      const connected = await checkSupabaseConnection()
      if (connected) {
        setIsConnected(true)
        initStarted.current = false
        checkInAttempted.current = false
        if (isSupabaseReady()) {
          try {
            const freshUser = await getSafeSession(supabase)
            if (freshUser) {
              setUser(freshUser)
              await _fetchProfile(freshUser.id)
            }
          } catch {}
        }
        clearInterval(reconnectTimer.current)
        reconnectTimer.current = null
      }
    }, RECONNECT_INTERVAL_MS)

    return () => {
      if (reconnectTimer.current) {
        clearInterval(reconnectTimer.current)
        reconnectTimer.current = null
      }
    }
  }, [isConnected])

  const signup = async (email, password) => {
    if (!isSupabaseReady() || !isConnected) {
      throw new Error('Network connection required to register.');
    }

    const { data, error } = await supabase.auth.signUp({ email, password });
    if (error) throw error;
    if (data?.user) {
      setUser(data.user);
      const p = await _fetchProfile(data.user.id);
      return { ...data, profile: p, role: p?.role || 'student' };
    }
    return data;
  }

  const login = async (email, password) => {
    if (!isConnected || !isSupabaseReady()) {
      throw new Error('Network connection required to sign in.');
    }

    console.log('[Auth] Signing in with Supabase Auth:', email);
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });

    if (error) {
      console.error('[Auth] Login error:', error.message);
      throw error;
    }
    
    setIsConnected(true);
    setUser(data.user);
    
    // Fetch authoritative profile directly from Supabase DB
    const p = await _fetchProfile(data.user.id);

    _subscribeToProfile(data.user.id);

    return { ...data, profile: p, role: p?.role || 'student' };
  }

  const logout = async () => {
    try {
      setUser(null)
      setProfile(null)
      setRole('student')
      _teardownRealtimeChannel()

      if (isSupabaseReady()) {
        const signOutPromise = supabase.auth.signOut()
        const timeoutPromise = new Promise((_, reject) => setTimeout(() => reject(new Error('Sign out timeout')), 2000))
        await Promise.race([signOutPromise, timeoutPromise])
      }
    } catch {}
  }

  const resetPassword = async (email) => {
    if (!isSupabaseReady() || !isConnected) {
      throw new Error('Network connection required to reset password.');
    }
    const { data, error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/`
    })
    if (error) throw error
    return data
  }

  const value = {
    user,
    profile,
    role,
    loading,
    login,
    signup,
    logout,
    resetPassword,
    // Authoritative Admin check: strictly based on profiles.role === 'admin'
    isAdmin: role === 'admin',
    isConnected,
    refreshProfile: () => user && _fetchProfile(user.id)
  }

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth () {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used inside AuthProvider')
  return ctx
}

