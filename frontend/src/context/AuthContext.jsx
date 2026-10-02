import { createContext, useContext, useEffect, useState, useRef, useCallback } from 'react'
import { supabase, isSupabaseReady, checkSupabaseConnection } from '../services/supabaseClient'
import { fetchWithTimeout, getSafeSession, getSafeSessionData, isAuthLockError } from '../services/api'

const AuthContext = createContext(null)

const RECONNECT_INTERVAL_MS = 30_000 // Poll every 30 seconds when offline

export function AuthProvider ({ children }) {
  const [user, setUser] = useState(null)
  const [profile, setProfile] = useState(null)
  const [role, setRole] = useState('student')
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

  // Fetch role and last_active from DB by authenticated user.id or email
  async function _fetchProfile (userId) {
    if (!userId || !isSupabaseReady()) {
      const defaultRole = 'student';
      const p = { role: defaultRole, last_active: null, xp: 0 };
      setProfile(p);
      setRole(defaultRole);
      return p;
    }

    try {
      let fetchedRole = null;
      let fetchedEmail = null;

      // Primary: fetch by id (Supabase auth UUID)
      const { data, error } = await fetchWithTimeout(
        supabase
          .from('profiles')
          .select('role, last_active, xp, level, streak_days, badges, email')
          .eq('id', userId)
          .maybeSingle(),
        6000
      );

      if (!error && data) {
        fetchedRole = data.role;
        fetchedEmail = data.email;
      }

      // Secondary: If role by ID is missing or default 'student'/'user', lookup DB by user email
      if (!fetchedRole || fetchedRole === 'user' || fetchedRole === 'student') {
        const sessionUser = (await getSafeSession(supabase)) || user;
        const userEmail = sessionUser?.email || fetchedEmail;

        if (userEmail) {
          try {
            const { data: emailData } = await fetchWithTimeout(
              supabase.from('profiles').select('role').eq('email', userEmail).maybeSingle(),
              4000
            );
            if (emailData?.role && emailData.role !== 'user' && emailData.role !== 'student') {
              fetchedRole = emailData.role;
            }
          } catch {}

          // Tertiary: Check local invited users
          if (!fetchedRole || fetchedRole === 'user' || fetchedRole === 'student') {
            const localInvited = JSON.parse(localStorage.getItem('admin_invited_users') || '[]');
            const invitedMatch = localInvited.find(u => u.email?.toLowerCase() === userEmail.toLowerCase());
            if (invitedMatch?.role) {
              fetchedRole = invitedMatch.role;
            }
          }
        }
      }

      const finalRole = resolveUserRole(fetchedRole);

      const p = {
        role: finalRole,
        email: data?.email || fetchedEmail || null,
        last_active: data?.last_active || null,
        xp: data?.xp || 0,
        level: data?.level || 1,
        streak_days: data?.streak_days || 0,
        badges: data?.badges || []
      };

      setProfile(p);
      setRole(finalRole);
      console.log('[Auth] Profile loaded — user:', userId, 'role:', finalRole);
      return p;
    } catch (err) {
      console.warn('[Auth] Profile fetch error:', err.message);
      let fallbackRole = 'student';
      try {
        const sessionUser = user;
        if (sessionUser?.email) {
          const localInvited = JSON.parse(localStorage.getItem('admin_invited_users') || '[]');
          const invitedMatch = localInvited.find(u => u.email?.toLowerCase() === sessionUser.email.toLowerCase());
          if (invitedMatch?.role) {
            fallbackRole = resolveUserRole(invitedMatch.role);
          }
        }
      } catch {}

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

  // ─── Realtime subscription helper ───────────────────────────────────
  // Defined at component body level so it is accessible from login(),
  // _initAuth(), and onAuthStateChange() without scope issues.
  function _subscribeToProfile (userId) {
    if (!userId || !isSupabaseReady()) return
    if (typeof userId === 'string' && userId.startsWith('local-')) return

    // Tear down previous channel before creating a new one
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
            console.log('[Auth] Realtime role update:', updatedRole);
          }
        })
        .subscribe()
    } catch (err) {
      // Realtime is optional — never let it break auth
      console.warn('[Auth] Realtime subscription failed (non-blocking):', err.message);
    }
  }

  function _teardownRealtimeChannel () {
    if (profileChannelRef.current) {
      supabase.removeChannel(profileChannelRef.current)
      profileChannelRef.current = null
    }
  }

  // ─── Auth initialization effect ─────────────────────────────────────
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
          
          // Await profile from database before finishing loading state
          try {
            const p = await _fetchProfile(sessionUser.id);
            void _awardDailyXP(sessionUser.id, p?.last_active);
          } catch (pErr) {
            console.warn('[Auth] Profile fetch error during init:', pErr?.message);
          }

          // Optional realtime — after profile is loaded
          _subscribeToProfile(sessionUser.id);
          return;
        }

        // No active Supabase session — user is not logged in
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
        localStorage.removeItem('local_user');
        localStorage.removeItem('local_profile');
        setUser(null);
        setProfile(null);
        setRole('student');
        _teardownRealtimeChannel();
      } else if (!session) {
        setUser(null);
        setProfile(null);
        setRole('student');
      } else if (session?.user && (event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED')) {
        setUser(session.user);
        _fetchProfile(session.user.id)
          .then((p) => {
            void _awardDailyXP(session.user.id, p?.last_active);
          })
          .catch(() => {});
        _subscribeToProfile(session.user.id);
      } else if (session?.user) {
        setUser(session.user);
      }
    })

    return () => {
      clearTimeout(failsafe)
      subscription?.unsubscribe()
      _teardownRealtimeChannel()
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

      // Check if this email was pre-assigned a role in DB profiles or local invitations
      let assignedRole = 'student';
      try {
        const { data: existing } = await supabase.from('profiles').select('role').eq('email', email).maybeSingle();
        if (existing?.role && existing.role !== 'user') {
          assignedRole = resolveUserRole(existing.role);
        } else {
          const localInvited = JSON.parse(localStorage.getItem('admin_invited_users') || '[]');
          const match = localInvited.find(u => u.email?.toLowerCase() === email.toLowerCase());
          if (match?.role) assignedRole = resolveUserRole(match.role);
        }
      } catch {}

      // Preserve pre-assigned role or fallback to 'student'
      await supabase.from('profiles').upsert({ 
        id: data.user.id, 
        email: email, 
        role: assignedRole, 
        name: email.split('@')[0] 
      }, { onConflict: 'id' });

      const p = await _fetchProfile(data.user.id);
      return { ...data, profile: p, role: p?.role || assignedRole };
    }
    return data;
  }

  const login = async (email, password) => {
    if (!isConnected || !isSupabaseReady()) {
      throw new Error('Network connection required to sign in.');
    }

    console.log('[Auth] Attempting login for:', email);
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });

    if (error) {
      console.error('[Auth] Login error:', error.message, '| status:', error.status);
      throw error;
    }
    
    console.log('[Auth] Login successful, user.id:', data.user?.id);
    setIsConnected(true);
    setUser(data.user);
    
    // Fetch authoritative role from Supabase DB (required for dashboard routing)
    const p = await _fetchProfile(data.user.id);

    // Optional: start realtime subscription (non-blocking)
    _subscribeToProfile(data.user.id);

    return { ...data, profile: p, role: p?.role };
  }

  const logout = async () => {
    try {
      // Clear local persistence
      localStorage.removeItem('local_user')
      localStorage.removeItem('local_profile')
      
      // Clear UI state immediately
      setUser(null)
      setProfile(null)
      setRole('student')
      _teardownRealtimeChannel()

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
