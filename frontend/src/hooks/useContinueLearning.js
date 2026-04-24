import { useState, useEffect, useCallback } from 'react'
import { supabase, isSupabaseReady } from '../services/supabaseClient'
import { useAuth } from '../context/AuthContext'
import { fetchWithTimeout } from '../services/api'

export function useContinueLearning ({ skipFetch = false } = {}) {
  const { user } = useAuth()
  const [recentViews, setRecentViews] = useState([])
  const [loading, setLoading] = useState(!skipFetch)

  const fetchRecent = useCallback(async () => {
    if (skipFetch) {
      setRecentViews([])
      setLoading(false)
      return
    }

    if (!user || !isSupabaseReady()) {
      setRecentViews([])
      setLoading(false)
      return
    }
    try {
      const { data } = await fetchWithTimeout(
        supabase
          .from('resource_views')
          .select('id, viewed_at, resource_id, resources(id, type, title, branch, semester, icon)')
          .eq('user_id', user.id)
          .order('viewed_at', { ascending: false })
          .limit(5),
        3500
      )

      const views = (data || [])
        .map(v => ({ ...v, resource: v.resources }))
        .filter(v => v.resource)
      setRecentViews(views)
    } catch { /* silent */ } finally { setLoading(false) }
  }, [skipFetch, user])

  useEffect(() => { fetchRecent() }, [fetchRecent])

  const trackView = useCallback(async (resourceId) => {
    if (!user || !isSupabaseReady()) return
    try {
      await supabase
        .from('resource_views')
        .upsert({
          user_id: user.id,
          resource_id: resourceId,
          viewed_at: new Date().toISOString()
        }, { onConflict: 'user_id,resource_id' })
    } catch { /* silent */ }
  }, [user])

  return { recentViews, loading, trackView, refetch: fetchRecent }
}
