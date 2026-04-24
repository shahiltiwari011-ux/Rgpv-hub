import { useState, useEffect } from 'react'
import { supabase, isSupabaseReady } from '../services/supabaseClient'
import { fetchWithTimeout } from '../services/api'
import { MOCK_RESOURCES } from '../data/mockResources'

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

function getMockTrendingPayload () {
  const sorted = [...MOCK_RESOURCES].sort((a, b) => (b.download_count || 0) - (a.download_count || 0))
  const recent = [...MOCK_RESOURCES].sort((a, b) => new Date(b.created_at) - new Date(a.created_at))
  return {
    trending: sorted.slice(0, 8),
    mostDownloaded: sorted.slice(0, 8),
    recentlyAdded: recent.slice(0, 8),
    isMock: true
  }
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
      recentlyAdded: recentData || [],
      isMock: false
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
  const [isMock, setIsMock] = useState(false)

  useEffect(() => {
    // If Supabase isn't configured, immediately use mock data
    if (!isSupabaseReady()) {
      const mock = getMockTrendingPayload()
      setTrending(mock.trending)
      setMostDownloaded(mock.mostDownloaded)
      setRecentlyAdded(mock.recentlyAdded)
      setIsMock(true)
      setLoading(false)
      return
    }

    const cached = readTrendingCache()
    if (cached) {
      setTrending(cached.trending || [])
      setMostDownloaded(cached.mostDownloaded || [])
      setRecentlyAdded(cached.recentlyAdded || [])
      setIsMock(!!cached.isMock)
      setLoading(false)
    }

    async function fetchAll () {
      try {
        const payload = await fetchTrendingPayload()
        setTrending(payload.trending)
        setMostDownloaded(payload.mostDownloaded)
        setRecentlyAdded(payload.recentlyAdded)
        setIsMock(false)
      } catch (err) {
        console.warn('Trending fetch failed/timed out — using mock data:', err.message)
        if (!cached) {
          const mock = getMockTrendingPayload()
          setTrending(mock.trending)
          setMostDownloaded(mock.mostDownloaded)
          setRecentlyAdded(mock.recentlyAdded)
          setIsMock(true)
        }
      } finally {
        setLoading(false)
      }
    }

    void fetchAll()

    // Only subscribe when supabase is available
    const channel = supabase.channel('public:resources:trending')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'resources' }, () => {
        void fetchAll()
      })
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [])

  return { trending, mostDownloaded, recentlyAdded, loading, isMock }
}
