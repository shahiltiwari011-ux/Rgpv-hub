import { useState, useEffect, useMemo, useCallback } from 'react'
import { getLeaderboard } from '../services/api'
import { useAuth } from '../context/AuthContext'
import { supabase, isSupabaseReady } from '../services/supabaseClient'

export function useLeaderboard () {
  const { user, profile } = useAuth()
  const [leaderboard, setLeaderboard] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  const fetchLeaderboard = useCallback(async () => {
    try {
      setLoading(true)
      setError(null)
      const data = await getLeaderboard()
      setLeaderboard(data || [])
    } catch (err) {
      console.error('Leaderboard fetch error:', err)
      setError(err.message || 'Failed to fetch leaderboard data')
      setLeaderboard([])
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchLeaderboard()

    if (!isSupabaseReady()) return

    const channel = supabase
      .channel('public:leaderboard:profiles')
      .on('postgres_changes', {
        event: 'UPDATE',
        schema: 'public',
        table: 'profiles'
      }, (payload) => {
        // Refetch leaderboard if someone earns XP
        if (payload.old && payload.new && payload.old.xp !== payload.new.xp) {
          fetchLeaderboard()
        } else if (!payload.old) {
          fetchLeaderboard()
        }
      })
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [fetchLeaderboard])

  // Sync current user's XP in real-time and handle empty leaderboard injection
  const syncedLeaderboard = useMemo(() => {
    const hasData = leaderboard.length > 0
    const hasUserXp = profile?.xp > 0

    // CASE 1: Leaderboard is empty but user has XP — inject user at Rank 1
    if (!hasData && hasUserXp && user) {
      return [{
        user_id: user.id,
        xp: profile.xp,
        rank: 1,
        profiles: { name: profile.name || user.email?.split('@')[0] || 'You' }
      }]
    }

    // CASE 2: No data and no user XP — show empty
    if (!hasData) return []

    // CASE 3: Leaderboard has data — update the user entry if they're in it
    return leaderboard.map(entry => {
      if (user && entry.user_id === user.id && profile) {
        return { ...entry, xp: profile.xp, level: profile.level }
      }
      return entry
    })
  }, [leaderboard, user, profile])

  return { leaderboard: syncedLeaderboard, loading, error, refresh: fetchLeaderboard }
}
