import { useState, useEffect } from 'react'
import { supabase, isSupabaseReady } from '../services/supabaseClient'

import { fetchWithTimeout } from '../services/api'

const TRENDING_RESOURCE_FIELDS = 'id, type, title, branch, semester, download_count, icon, created_at'
const TRENDING_CACHE_KEY = 'studyhub:trending:v1'
const TRENDING_CACHE_TTL = 60 * 1000

let trendingMemoryCache = null
let trendingInFlightPromise = null

function readTrendingCache () {
  if (trendingMemoryCache && (Date.now() - trendingMemoryCache.timestamp) < TRENDING_CACHE_TTL) {
    return trendingMemoryCache
  }

  try {
    const raw = sessionStorage.getItem(TRENDING_CACHE_KEY)
    if (!raw) return null
    const parsed = JSON.parse(raw)
    if ((Date.now() - parsed.timestamp) >= TRENDING_CACHE_TTL) return null
    trendingMemoryCache = parsed
    return parsed
  } catch {
    return null
  }
}

function writeTrendingCache (value) {
  const entry = { ...value, timestamp: Date.now() }
  trendingMemoryCache = entry
  try {
    sessionStorage.setItem(TRENDING_CACHE_KEY, JSON.stringify(entry))
  } catch {}
}

async function fetchTrendingPayload () {
  if (trendingInFlightPromise) return trendingInFlightPromise

  trendingInFlightPromise = (async () => {
    const [trendData, recentData] = await Promise.all([
      fetchWithTimeout(
        supabase.from('resources').select(TRENDING_RESOURCE_FIELDS)
          .order('download_count', { ascending: false })
          .order('created_at', { ascending: false })
          .limit(8)
          .throwOnError(),
        3500
      ).then(res => res.data),

      fetchWithTimeout(
        supabase.from('resources').select(TRENDING_RESOURCE_FIELDS)
          .order('created_at', { ascending: false })
          .limit(8)
          .throwOnError(),
        3500
      ).then(res => res.data)
    ])

    const payload = {
      trending: trendData || [],
      mostDownloaded: trendData || [],
      recentlyAdded: recentData || []
    }
    writeTrendingCache(payload)
    return payload
  })()

  try {
    return await trendingInFlightPromise
  } finally {
    trendingInFlightPromise = null
  }
}

export function useTrending () {
  const [trending, setTrending] = useState([])
  const [mostDownloaded, setMostDownloaded] = useState([])
  const [recentlyAdded, setRecentlyAdded] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!isSupabaseReady()) { setLoading(false); return }

    const cached = readTrendingCache()
    if (cached) {
      setTrending(cached.trending || [])
      setMostDownloaded(cached.mostDownloaded || [])
      setRecentlyAdded(cached.recentlyAdded || [])
      setLoading(false)
    }

    async function fetchAll () {
      try {
        const payload = await fetchTrendingPayload()
        setTrending(payload.trending)
        setMostDownloaded(payload.mostDownloaded)
        setRecentlyAdded(payload.recentlyAdded)
      } catch (err) {
        console.warn('Trending fetch failed/timed out:', err.message)
        if (!cached) {
          setTrending([])
          setMostDownloaded([])
          setRecentlyAdded([])
        }
      } finally {
        setLoading(false)
      }
    }

    void fetchAll()

    const channel = supabase.channel('public:resources:trending')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'resources' }, () => {
        void fetchAll()
      })
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [])

  return { trending, mostDownloaded, recentlyAdded, loading }
}
