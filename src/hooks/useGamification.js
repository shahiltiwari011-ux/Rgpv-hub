import { useState, useEffect, useCallback } from 'react'
import { supabase, isSupabaseReady } from '../services/supabaseClient'
import { useAuth } from '../context/AuthContext'
import { fetchWithTimeout } from '../services/api'

const XP_PER_LEVEL = 100
const FETCH_TIMEOUT = 5000

export function useGamification () {
  const { user, profile, loading, refreshProfile } = useAuth()

  const awardXP = useCallback(async (amount = 10) => {
    if (!user || !isSupabaseReady()) return
    try {
      await fetchWithTimeout(supabase.rpc('award_xp', { xp_amount: amount }).throwOnError(), FETCH_TIMEOUT)
      if (refreshProfile) await refreshProfile()
    } catch { /* silent */ }
  }, [user, refreshProfile])

  const xp = profile?.xp || 0
  const level = profile?.level || 1
  const xpInLevel = xp % XP_PER_LEVEL
  const xpProgress = (xpInLevel / XP_PER_LEVEL) * 100
  const streak = profile?.streak_days || 0
  const badges = profile?.badges || []

  return {
    profile,
    loading,
    xp,
    level,
    xpInLevel,
    xpProgress,
    streak,
    badges,
    awardXP,
    refetch: refreshProfile || (() => {})
  }
}
