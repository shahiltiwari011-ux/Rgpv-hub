import { useState, useEffect } from 'react'
import { supabase, isSupabaseReady } from '../services/supabaseClient'

import { fetchWithTimeout } from '../services/api'

const TRENDING_RESOURCE_FIELDS = 'id, type, title, branch, semester, download_count, icon, created_at'

export function useTrending () {
  const [trending, setTrending] = useState([])
  const [mostDownloaded, setMostDownloaded] = useState([])
  const [recentlyAdded, setRecentlyAdded] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!isSupabaseReady()) { setLoading(false); return }

    async function fetchAll () {
      try {
        // Run both queries in PARALLEL with individual abort controllers
        const [trendData, recentData] = await Promise.all([
          fetchWithTimeout(
            supabase.from('resources').select(TRENDING_RESOURCE_FIELDS)
              .order('download_count', { ascending: false })
              .order('created_at', { ascending: false })
              .limit(8)
              .throwOnError(),
            6000
          ).then(res => res.data),

          fetchWithTimeout(
            supabase.from('resources').select(TRENDING_RESOURCE_FIELDS)
              .order('created_at', { ascending: false })
              .limit(8)
              .throwOnError(),
            6000
          ).then(res => res.data)
        ])

        setTrending(trendData || [])
        setMostDownloaded(trendData || [])
        setRecentlyAdded(recentData || [])
      } catch (err) {
        console.warn('Trending fetch failed/timed out:', err.message)
        setTrending([])
        setMostDownloaded([])
        setRecentlyAdded([])
      } finally {
        setLoading(false)
      }
    }

    fetchAll()

    const channel = supabase.channel('public:resources:trending')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'resources' }, () => {
        fetchAll()
      })
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [])

  return { trending, mostDownloaded, recentlyAdded, loading }
}
