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
    } catch (err) {
      console.warn('Profile fetch failed (Defaulting to guest):', err.message)
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
          console.log('Elite Offline Mode: Resuming local session')
          setUser(localUser)
          setProfile(localProfile)
          setRole(localProfile.role || 'user')
          setLoading(false)
          // Still try to sync connection in background
          checkSupabaseConnection().then(setIsConnected)
          return
        }

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
        if (!isAuthLockError(err)) {
          console.warn('Auth initialization error:', err.message)
        }
      } finally {
        clearTimeout(failsafe)
        setLoading(false)
        // Ensure connectivity check happens even if auth fails
        checkSupabaseConnection().then((connected) => {
          setIsConnected(connected)
        })
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

  // Auto-reconnect polling: when offline, ping every 30s
  // When connection is restored, re-initialize the auth session
  useEffect(() => {
    if (isConnected) {
      // Clear any pending reconnect timer if we're back online
      if (reconnectTimer.current) {
        clearInterval(reconnectTimer.current)
        reconnectTimer.current = null
      }
      return
    }

    // Start polling
    reconnectTimer.current = setInterval(async () => {
      console.log('🔄 Attempting to reconnect to Supabase...')
      const connected = await checkSupabaseConnection()
      if (connected) {
        console.log('✅ Supabase reconnected! Refreshing session...')
        setIsConnected(true)
        // Reset init flag so auth can re-initialize with the live DB
        initStarted.current = false
        checkInAttempted.current = false
        // Re-fetch the session
        if (isSupabaseReady()) {
          try {
            const freshUser = await getSafeSession(supabase)
            if (freshUser) {
              setUser(freshUser)
              void _fetchProfile(freshUser.id)
            }
          } catch { /* silent */ }
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
      console.warn('Supabase offline: Entering Local Registration Mode')
      // Simulate successful signup for Offline Mode
      const mockUser = { id: 'local-' + Math.random().toString(36).slice(2, 11), email, is_local: true }
      const mockProfile = { role: 'user', xp: 0, level: 1, streak_days: 1, name: email.split('@')[0], is_local: true }
      
      localStorage.setItem('local_user', JSON.stringify(mockUser))
      localStorage.setItem('local_profile', JSON.stringify(mockProfile))
      
      setUser(mockUser)
      setProfile(mockProfile)
      return { user: mockUser }
    }
    const { data, error } = await supabase.auth.signUp({ email, password })
    if (error) throw error
    return data
  }

  const login = async (email, password) => {
    // 1. Try local offline session first (Instant)
    if (!isConnected) {
      const localUser = JSON.parse(localStorage.getItem('local_user'))
      if (localUser && localUser.email === email) {
        setUser(localUser)
        setProfile(JSON.parse(localStorage.getItem('local_profile')))
        return { user: localUser }
      }
    }

    // 2. If no local profile OR we want to attempt a real login
    if (!isSupabaseReady()) throw new Error('Supabase configuration missing')
    
    try {
      const { data, error } = await supabase.auth.signInWithPassword({ email, password })
      if (error) {
        // If we are offline and the real login fails, ONLY then throw the offline error if relevant
        if (!isConnected && (error.message?.includes('fetch') || error.message?.includes('network'))) {
           throw new Error('OFFLINE_PROFILE_NOT_FOUND')
        }
        throw error
      }
      
      // If we got here, we are actually online!
      setIsConnected(true)
      return data
    } catch (err) {
      if (err.message === 'OFFLINE_PROFILE_NOT_FOUND') throw err
      
      // If it's a connection error during login, and we don't have a local profile, throw the helpful error
      if (!isConnected && (err.message?.includes('fetch') || err.message?.includes('network'))) {
        throw new Error('OFFLINE_PROFILE_NOT_FOUND')
      }
      throw err
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
