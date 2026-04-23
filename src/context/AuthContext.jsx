import { createContext, useContext, useEffect, useState, useRef } from 'react'
import { supabase, isSupabaseReady } from '../services/supabaseClient'
import { fetchWithTimeout, getSafeSession, getSafeSessionData, isAuthLockError } from '../services/api'

const AuthContext = createContext(null)

export function AuthProvider ({ children }) {
  const [user, setUser] = useState(null)
  const [profile, setProfile] = useState(null)
  const [role, setRole] = useState('user')
  const [loading, setLoading] = useState(true)
  const checkInAttempted = useRef(false)
  const initStarted = useRef(false)

  // Fetch role and last_active from DB
  async function _fetchProfile (userId) {
    if (!isSupabaseReady()) return { role: 'user', last_active: null, xp: 0 }
    try {
      const { data } = await fetchWithTimeout(
        supabase
          .from('profiles')
          .select('role, last_active, xp, level, streak_days, badges')
          .eq('id', userId)
          .maybeSingle()
          .throwOnError()
      )
      const p = {
        role: data?.role || 'user',
        last_active: data?.last_active || null,
        xp: data?.xp || 0,
        level: data?.level || 1,
        streak_days: data?.streak_days || 0,
        badges: data?.badges || []
      }
      setProfile(p)
      setRole(p.role)
      return p
    } catch {
      return { role: 'user', last_active: null, xp: 0 }
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
        console.log('✅ Daily XP awarded')
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
        const user = await getSafeSession(supabase)
        
        if (user) {
          const session = await getSafeSessionData(supabase)
          const sessionUser = session?.user || user

          if (sessionUser) {
            setUser(sessionUser)
            _subscribeToProfile(sessionUser.id)
            setLoading(false)

            _fetchProfile(sessionUser.id)
              .then((p) => {
                void _awardDailyXP(sessionUser.id, p.last_active)
              })
              .catch(() => {})
            return
          }
        }
      } catch (err) {
        // Only log real errors, silence lock contention
        if (!isAuthLockError(err)) {
          console.error('Auth initialization error:', err)
        }
      } finally {
        clearTimeout(failsafe)
        setLoading(false)
      }
    }

    function _subscribeToProfile (userId) {
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
          console.log('🔄 Profile update received via Realtime:', payload.new)
          setProfile(prev => ({ ...prev, ...payload.new }))
          if (payload.new.role) setRole(payload.new.role)
        })
        .subscribe()
    }

    _initAuth()

    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (event === 'SIGNED_OUT' || event === 'USER_DELETED' || !session) {
        setUser(null)
        setProfile(null)
        setRole('user')
        // Remove realtime channel on sign-out
        if (profileChannelRef.current) {
          supabase.removeChannel(profileChannelRef.current)
          profileChannelRef.current = null
        }
      } else if (session?.user && (event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED')) {
        setUser(session.user)
        _subscribeToProfile(session.user.id)
        _fetchProfile(session.user.id)
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

  const login = async (email, password) => {
    if (!isSupabaseReady()) throw new Error('Supabase not configured')
    const { error } = await supabase.auth.signInWithPassword({ email, password })
    if (error) throw error
  }

  const signup = async (email, password) => {
    if (!isSupabaseReady()) throw new Error('Supabase not configured')
    const { error } = await supabase.auth.signUp({ email, password })
    if (error) throw error
  }

  const logout = async () => {
    if (!isSupabaseReady()) return
    try {
      // Clear UI state immediately so the user doesn't feel stuck if Supabase auth hangs
      setUser(null)
      setProfile(null)
      setRole('user')

      // Attempt to sign out on the backend, wrap with timeout to avoid hanging forever
      const signOutPromise = supabase.auth.signOut()
      const timeoutPromise = new Promise((resolve, reject) => setTimeout(() => reject(new Error('Sign out timeout')), 2000))
      await Promise.race([signOutPromise, timeoutPromise])
    } catch {
      // Ignore background signout errors, the user is locally logged out
    }
  }

  const value = {
    user,
    profile,
    role,
    loading,
    login,
    signup,
    logout,
    // SECURITY: isAdmin derived ONLY from database role — no email bypass
    isAdmin: role === 'admin',
    refreshProfile: () => user && _fetchProfile(user.id)
  }

  if (!isSupabaseReady()) {
    return (
      <div style={{ 
        display: 'flex', 
        flexDirection: 'column', 
        alignItems: 'center', 
        justifyContent: 'center', 
        minHeight: '100vh', 
        padding: '2rem',
        textAlign: 'center',
        background: 'var(--bg-primary)',
        color: 'var(--text-primary)',
        fontFamily: 'system-ui'
      }}>
        <div style={{ fontSize: '4rem', marginBottom: '1rem' }}>⚙️</div>
        <h1 style={{ fontSize: '1.5rem', marginBottom: '1rem' }}>System Configuration Required</h1>
        <p style={{ maxWidth: '500px', color: 'var(--text-secondary)', lineHeight: 1.6 }}>
          The application setup is incomplete. Database connection keys are missing from the environment.
        </p>
        <div style={{ 
          marginTop: '2rem', 
          padding: '1rem', 
          background: 'rgba(239, 68, 68, 0.1)', 
          border: '1px solid rgba(239, 68, 68, 0.2)', 
          borderRadius: '12px',
          fontSize: '0.9rem',
          color: '#ef4444'
        }}>
          <strong>Action Required:</strong> Please set <code>VITE_SUPABASE_URL</code> and <code>VITE_SUPABASE_ANON_KEY</code> in your deployment dashboard or local <code>.env</code> file.
        </div>
      </div>
    )
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
