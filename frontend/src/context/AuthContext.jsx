import { createContext, useContext, useEffect, useState, useRef, useCallback } from 'react'
import { supabase, isSupabaseReady, checkSupabaseConnection } from '../services/supabaseClient'
import { fetchWithTimeout, getSafeSession, getSafeSessionData, isAuthLockError } from '../services/api'

const AuthContext = createContext(null)

const RECONNECT_INTERVAL_MS = 30_000 // Poll every 30 seconds when offline

export function AuthProvider ({ children }) {
  const [user, setUser] = useState(null)
  const [profile, setProfile] = useState(null)
  const [role, setRole] = useState('user')
  const [loading, setLoading] = useState(true)
  const [isConnected, setIsConnected] = useState(true)
  const checkInAttempted = useRef(false)
  const initStarted = useRef(false)
  const reconnectTimer = useRef(null)

  // Helper to normalize DB role (maps legacy 'teacher' -> 'faculty', 'user' -> 'student')
  function resolveUserRole(dbRole) {
    if (!dbRole) return 'student';
    const normalized = dbRole.toLowerCase().trim();
    if (normalized === 'user') return 'student';
    if (normalized === 'teacher') return 'faculty';
    const validRoles = ['student', 'faculty', 'tpo', 'admin'];
    return validRoles.includes(normalized) ? normalized : 'student';
  }

  // Fetch role and last_active from DB by authenticated user.id
  async function _fetchProfile (userId) {
    if (!userId || !isSupabaseReady()) {
      const defaultRole = 'student';
      const p = { role: defaultRole, last_active: null, xp: 0 };
      setProfile(p);
      setRole(defaultRole);
      return p;
    }

    try {
      // Primary: fetch by id (Supabase auth UUID)
      const { data, error } = await fetchWithTimeout(
        supabase
          .from('profiles')
          .select('role, last_active, xp, level, streak_days, badges, email')
          .eq('id', userId)
          .maybeSingle(),
        3000
      );

      if (error) throw error;

      const finalRole = resolveUserRole(data?.role);

      const p = {
        role: finalRole,
        email: data?.email || null,
        last_active: data?.last_active || null,
        xp: data?.xp || 0,
        level: data?.level || 1,
        streak_days: data?.streak_days || 0,
        badges: data?.badges || []
      };

      setProfile(p);
      setRole(finalRole);
      return p;
    } catch (err) {
      console.warn('Profile fetch notice from DB:', err.message);
      const fallbackRole = 'student';
      const p = { role: fallbackRole, last_active: null, xp: 0 };
      setProfile(p);
      setRole(fallbackRole);
      return p;
    }
  }

  // Guarded XP reward (Daily Check-in)
  async function _awardDailyXP (userId, lastActive) {
    if (!isSupabaseReady() || !userId || checkInAttempted.current) return
    checkInAttempted.current = true

    // Use local browser date string (e.g., "Mon Mar 22 2026") to avoid server/client timezone mismatch
    const localToday = new Date().toDateString()
    const storedCheckIn = localStorage.getItem(`last_check_in_${userId}`)

    // Only award if the user hasn't been active today locally
    if (storedCheckIn !== localToday) {
      try {
        await fetchWithTimeout(supabase.rpc('award_xp', { xp_amount: 1 }).throwOnError(), 5000)
        localStorage.setItem(`last_check_in_${userId}`, localToday)
        // Refresh profile after award without blocking the rest of the app
        void _fetchProfile(userId)
      } catch (err) {
        console.warn('Failed to award daily XP:', err.message)
        checkInAttempted.current = false // Allow retry on failure
      }
    }
  }

  // profileChannel ref so we can clean it up without re-running the whole effect
  const profileChannelRef = useRef(null)

  useEffect(() => {
    if (!isSupabaseReady()) {
      setLoading(false)
      return
    }

    const failsafe = setTimeout(() => {
      setLoading(false)
    }, 2500)

    async function _initAuth () {
      if (initStarted.current) return
      initStarted.current = true
      
      try {
        const sessionUser = await getSafeSession(supabase);
        
        if (sessionUser) {
          setUser(sessionUser);
          _subscribeToProfile(sessionUser.id);
          
          // Await profile from database before finishing loading state
          try {
            const p = await _fetchProfile(sessionUser.id);
            void _awardDailyXP(sessionUser.id, p?.last_active);
          } catch (pErr) {
            console.warn('Profile fetch error during init:', pErr?.message);
          }
          return;
        }

        // Check fallback for local guest/offline user if no active Supabase session
        const localUser = JSON.parse(localStorage.getItem('local_user') || 'null');
        if (localUser && localUser.id?.startsWith('local-')) {
          setUser(localUser);
          setRole('student');
          setProfile({ role: 'student', xp: 0 });
        }
      } catch (err) {
        if (!isAuthLockError(err)) {
          console.warn('Auth initialization error:', err.message);
        }
      } finally {
        clearTimeout(failsafe);
        setLoading(false);
        checkSupabaseConnection().then((connected) => {
          setIsConnected(connected);
        });
      }
    }

    function _subscribeToProfile (userId) {
      if (!userId || userId.startsWith('local-')) return // No realtime for local users
      
      // Tear down previous channel before creating a new one
      if (profileChannelRef.current) {
        supabase.removeChannel(profileChannelRef.current)
        profileChannelRef.current = null
      }
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
          }
        })
        .subscribe()
    }

    _initAuth()

    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (event === 'SIGNED_OUT' || event === 'USER_DELETED') {
        localStorage.removeItem('local_user');
        localStorage.removeItem('local_profile');
        setUser(null);
        setProfile(null);
        setRole('student');
        if (profileChannelRef.current) {
          supabase.removeChannel(profileChannelRef.current);
          profileChannelRef.current = null;
        }
      } else if (!session) {
        setUser(null);
        setProfile(null);
        setRole('student');
      } else if (session?.user && (event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED')) {
        setUser(session.user);
        _subscribeToProfile(session.user.id);
        _fetchProfile(session.user.id)
          .then((p) => {
            void _awardDailyXP(session.user.id, p?.last_active);
          })
          .catch(() => {});
      } else if (session?.user) {
        setUser(session.user);
      }
    })

    return () => {
      clearTimeout(failsafe)
      subscription?.unsubscribe()
      if (profileChannelRef.current) {
        supabase.removeChannel(profileChannelRef.current)
        profileChannelRef.current = null
      }
    }
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  // Mobile backgrounding/resume session sync listener
  useEffect(() => {
    const handleVisibilityChange = async () => {
      if (document.visibilityState === 'visible' && isSupabaseReady() && isConnected) {
        try {
          const sessionUser = await getSafeSession(supabase)
          if (sessionUser) {
            setUser(sessionUser)
            _fetchProfile(sessionUser.id).catch(() => {})
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

  // Auto-reconnect polling: when offline, ping every 30s
  // When connection is restored, re-initialize the auth session
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
              void _fetchProfile(freshUser.id)
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
  }, [isConnected]) // eslint-disable-line react-hooks/exhaustive-deps

  const signup = async (email, password) => {
    if (!isSupabaseReady() || !isConnected) {
      throw new Error('Network connection required to register.');
    }

    const { data, error } = await supabase.auth.signUp({ email, password });
    if (error) throw error;
    if (data?.user) {
      setUser(data.user);
      // Ensure user profile default role 'student' is created in database
      await supabase.from('profiles').upsert({ 
        id: data.user.id, 
        email: email, 
        role: 'student', 
        name: email.split('@')[0] 
      }, { onConflict: 'id' });

      await _fetchProfile(data.user.id);
    }
    return data;
  }

  const login = async (email, password) => {
    if (!isConnected || !isSupabaseReady()) {
      throw new Error('Network connection required to sign in.');
    }

    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) throw error;
    
    setIsConnected(true);
    setUser(data.user);
    _subscribeToProfile(data.user.id);
    
    // Fetch authoritative role from Supabase DB
    await _fetchProfile(data.user.id);

    return data;
  }

  const logout = async () => {
    try {
      // Clear local persistence
      localStorage.removeItem('local_user')
      localStorage.removeItem('local_profile')
      
      // Clear UI state immediately
      setUser(null)
      setProfile(null)
      setRole('user')

      if (isSupabaseReady()) {
        // Attempt to sign out on the backend, wrap with timeout to avoid hanging
        const signOutPromise = supabase.auth.signOut()
        const timeoutPromise = new Promise((resolve, reject) => setTimeout(() => reject(new Error('Sign out timeout')), 2000))
        await Promise.race([signOutPromise, timeoutPromise])
      }
    } catch {
      // Ignore background errors
    }
  }

  const resetPassword = async (email) => {
    if (!isSupabaseReady() || !isConnected) {
      console.warn('Supabase offline: Simulating password reset link')
      return { message: 'Password reset link sent (Demo Mode)' }
    }
    const { data, error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/`
    })
    if (error) throw error
    return data
  }

  const ADMIN_EMAILS = [
    'shahiltiwari011@gmail.com',
    ...(import.meta.env.VITE_ADMIN_EMAILS?.split(',') || [])
  ].map(e => e.trim().toLowerCase())

  const value = {
    user,
    profile,
    role,
    loading,
    login,
    signup,
    logout,
    resetPassword,
    // DERIVED STATE: Admin if role is 'admin' OR if email is in the whitelist
    isAdmin: role === 'admin' || (user && ADMIN_EMAILS.includes(user.email?.toLowerCase())),
    isConnected,
    refreshProfile: () => user && _fetchProfile(user.id)
  }

  // Note: We no longer block the entire app if Supabase is missing.
  // The app will gracefully fall back to mock data in Offline Mode.

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
