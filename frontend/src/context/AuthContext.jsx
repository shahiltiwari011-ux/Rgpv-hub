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

  // Helper to determine the best role for an email/userId
  function resolveUserRole(email, dbRole) {
    // If dbRole is already a specific known role, trust it immediately
    const knownRoles = ['tpo', 'teacher', 'admin', 'faculty'];
    if (dbRole && knownRoles.includes(dbRole)) return dbRole;
    
    // Check admin_managed_users list (set by Admin panel)
    try {
      const adminUsers = JSON.parse(localStorage.getItem('admin_managed_users') || '[]');
      const match = adminUsers.find(u => u.email?.toLowerCase() === email?.toLowerCase());
      if (match?.role && knownRoles.includes(match.role)) return match.role;
    } catch {}

    // Keyword auto-detection fallback (email-based)
    const lowerEmail = (email || '').toLowerCase();
    if (lowerEmail.includes('tpo')) return 'tpo';
    if (lowerEmail.includes('teacher') || lowerEmail.includes('faculty') || lowerEmail.includes('prof')) return 'teacher';

    return dbRole || 'student';
  }

  // Fetch role and last_active from DB
  async function _fetchProfile (userId, userEmail) {
    let effectiveEmail = userEmail;
    if (!effectiveEmail) {
      try {
        const localUser = JSON.parse(localStorage.getItem('local_user'));
        effectiveEmail = localUser?.email;
      } catch {}
    }

    if (!isSupabaseReady()) {
      const role = resolveUserRole(effectiveEmail, 'student');
      const p = { role, last_active: null, xp: 0 };
      setProfile(p);
      setRole(role);
      return p;
    }

    try {
      // Primary: fetch by id (Supabase auth UUID)
      const { data } = await fetchWithTimeout(
        supabase
          .from('profiles')
          .select('role, last_active, xp, level, streak_days, badges, email')
          .eq('id', userId)
          .maybeSingle()
          .throwOnError(),
        3000
      )

      let dbRole = data?.role;

      // Fallback: if no row found or role is still 'student', try fetching by email
      // (handles case where admin updated profile by email, not by the local UUID)
      if ((!dbRole || dbRole === 'student') && effectiveEmail) {
        try {
          const { data: emailData } = await fetchWithTimeout(
            supabase
              .from('profiles')
              .select('role')
              .eq('email', effectiveEmail.toLowerCase())
              .maybeSingle(),
            2000
          );
          if (emailData?.role && emailData.role !== 'student') {
            dbRole = emailData.role;
          }
        } catch {}
      }

      const finalRole = resolveUserRole(effectiveEmail, dbRole);

      const p = {
        role: finalRole,
        last_active: data?.last_active || null,
        xp: data?.xp || 0,
        level: data?.level || 1,
        streak_days: data?.streak_days || 0,
        badges: data?.badges || []
      }
      setProfile(p)
      setRole(finalRole)

      // Persist resolved role so mobile keeps it on next refresh
      try {
        const existingLocal = JSON.parse(localStorage.getItem('local_profile') || '{}');
        localStorage.setItem('local_profile', JSON.stringify({ ...existingLocal, ...p }));
      } catch {}

      return p
    } catch (err) {
      console.warn('Profile fetch notice (Using role fallback):', err.message)
      const role = resolveUserRole(effectiveEmail, 'student');
      const p = { role, last_active: null, xp: 0 };
      setProfile(p);
      setRole(role);
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
        // First check for local offline user (highest priority for immediate UI)
        const localUser = JSON.parse(localStorage.getItem('local_user'))
        const localProfile = JSON.parse(localStorage.getItem('local_profile'))
        
        if (localUser && localProfile) {
          const resolvedRole = resolveUserRole(localUser.email, localProfile.role);
          const updatedProfile = { ...localProfile, role: resolvedRole };
          if (resolvedRole !== localProfile.role) {
            localStorage.setItem('local_profile', JSON.stringify(updatedProfile));
          }
          setProfile(updatedProfile);
          setUser(localUser);
          setRole(resolvedRole);

          // If valid Supabase user, fetch latest profile from DB before finishing loading
          if (isSupabaseReady() && localUser.id && !localUser.id.startsWith('local-')) {
            try {
              const p = await _fetchProfile(localUser.id, localUser.email);
              if (p?.role) {
                localStorage.setItem('local_profile', JSON.stringify({ ...updatedProfile, ...p, role: p.role }));
              }
            } catch (pErr) {
              console.warn('Background profile refresh fallback:', pErr?.message);
            }
          }

          setLoading(false);
          checkSupabaseConnection().then((connected) => setIsConnected(connected));
          return;
        }

        const sessionUser = await getSafeSession(supabase);
        
        if (sessionUser) {
          setUser(sessionUser);
          _subscribeToProfile(sessionUser.id);
          
          // Await profile before turning off loading state to prevent flash of wrong role
          try {
            const p = await _fetchProfile(sessionUser.id, sessionUser.email);
            void _awardDailyXP(sessionUser.id, p?.last_active);
          } catch (pErr) {
            console.warn('Profile fetch error during init:', pErr?.message);
          }
          return;
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
            setProfile(prev => ({ ...prev, ...payload.new }))
            if (payload.new.role) setRole(payload.new.role)
          }
        })
        .subscribe()
    }

    _initAuth()

    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (event === 'SIGNED_OUT' || event === 'USER_DELETED' || !session) {
        setUser(null)
        setProfile(null)
        setRole('student')
        // Remove realtime channel on sign-out
        if (profileChannelRef.current) {
          supabase.removeChannel(profileChannelRef.current)
          profileChannelRef.current = null
        }
      } else if (session?.user && (event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED')) {
        setUser(session.user)
        _subscribeToProfile(session.user.id)
        _fetchProfile(session.user.id, session.user.email)
          .then((p) => {
            void _awardDailyXP(session.user.id, p.last_active)
          })
          .catch(() => {})
      } else if (session?.user) {
        setUser(session.user)
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
            _fetchProfile(sessionUser.id, sessionUser.email).catch(() => {})
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
              void _fetchProfile(freshUser.id, freshUser.email)
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

  const signup = async (email, password, selectedRole = 'student') => {
    const assignedRole = resolveUserRole(email, selectedRole);

    const mockUser = { id: 'local-' + Math.random().toString(36).slice(2, 11), email, is_local: true };
    const mockProfile = { role: assignedRole, xp: 0, level: 1, streak_days: 1, name: email.split('@')[0], is_local: true };

    // Update local persistence
    localStorage.setItem('local_user', JSON.stringify(mockUser));
    localStorage.setItem('local_profile', JSON.stringify(mockProfile));

    // Also record in admin_managed_users list
    try {
      const adminUsers = JSON.parse(localStorage.getItem('admin_managed_users') || '[]');
      const updated = [mockUser, ...adminUsers.filter(u => u.email?.toLowerCase() !== email.toLowerCase())];
      localStorage.setItem('admin_managed_users', JSON.stringify(updated));
    } catch {}

    setUser(mockUser);
    setProfile(mockProfile);
    setRole(assignedRole);

    if (!isSupabaseReady() || !isConnected) {
      console.warn('Supabase offline: Registered user in Local Mode');
      return { user: mockUser };
    }

    try {
      const { data, error } = await supabase.auth.signUp({ email, password });
      if (error) throw error;
      if (data?.user) {
        const realUser = { ...data.user, email };
        setUser(realUser);
        localStorage.setItem('local_user', JSON.stringify(realUser));
        void supabase.from('profiles').upsert({ id: data.user.id, email: email, role: assignedRole, name: email.split('@')[0] }, { onConflict: 'id' });
      }
      return data;
    } catch (err) {
      console.warn('Backend signup notice (Operating locally):', err.message);
      return { user: mockUser };
    }
  }

  const login = async (email, password) => {
    const assignedRole = resolveUserRole(email, null);

    const mockUser = { id: 'user-' + Math.random().toString(36).slice(2, 11), email };
    const mockProfile = { role: assignedRole || 'student', xp: 0, level: 1, streak_days: 1, name: email.split('@')[0] };

    // 1. Try local offline session if disconnected
    if (!isConnected || !isSupabaseReady()) {
      localStorage.setItem('local_user', JSON.stringify(mockUser));
      localStorage.setItem('local_profile', JSON.stringify(mockProfile));
      setUser(mockUser);
      setProfile(mockProfile);
      setRole(assignedRole || 'student');
      return { user: mockUser };
    }

    // 2. If online, attempt Supabase login
    try {
      const { data, error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) throw error;
      
      setIsConnected(true);
      setUser(data.user);
      
      const p = await _fetchProfile(data.user.id, email);
      const finalRole = (assignedRole && assignedRole !== 'student') ? assignedRole : p.role;
      
      setRole(finalRole);
      setProfile(prev => ({ ...prev, role: finalRole }));
      
      localStorage.setItem('local_user', JSON.stringify(data.user));
      localStorage.setItem('local_profile', JSON.stringify({ ...p, role: finalRole }));

      return data;
    } catch (err) {
      console.warn('Online login notice (Logging in with resolved role):', err.message);
      localStorage.setItem('local_user', JSON.stringify(mockUser));
      localStorage.setItem('local_profile', JSON.stringify(mockProfile));
      setUser(mockUser);
      setProfile(mockProfile);
      setRole(assignedRole || 'student');
      return { user: mockUser };
    }
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
