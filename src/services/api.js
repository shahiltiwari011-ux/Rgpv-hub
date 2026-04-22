import { supabase, isSupabaseReady } from './supabaseClient'
import { enforceRateLimit } from '../utils/rateLimiter'
import logger from '../utils/logger'

const RESOURCE_LIST_FIELDS = 'id,title,subject,icon,branch,semester,year,file_size,download_count,topics,file_url,comment_count,type,created_at'
const RESOURCE_LIST_FIELDS_FALLBACK = 'id,title,subject,icon,branch,semester,year,download_count,file_url,type,created_at'
const RESOURCE_CACHE_TTL = 30 * 1000
const STATS_CACHE_TTL = 60 * 1000
const resourceCache = new Map()
let statsCache = null

// Production-ready Timeout Wrapper with AbortController support
export const fetchWithTimeout = async (promiseOrBuilder, ms = 15000) => {
  const controller = new AbortController()
  const id = setTimeout(() => controller.abort(), ms)

  let queryPromise = promiseOrBuilder
  let queryName = 'Unknown Query'

  // Extract query info for logging if it's a Supabase builder
  if (promiseOrBuilder && promiseOrBuilder.url) {
    try {
      const url = new URL(promiseOrBuilder.url)
      queryName = `${url.pathname}${url.search}`
    } catch {}
  }

  // Inject abort signal if it's a Supabase query builder
  if (promiseOrBuilder && typeof promiseOrBuilder.abortSignal === 'function') {
    promiseOrBuilder = promiseOrBuilder.abortSignal(controller.signal)
    queryPromise = (async () => await promiseOrBuilder)()
  } else {
    queryPromise = Promise.resolve(promiseOrBuilder)
  }

  const timeoutPromise = new Promise((resolve, reject) => {
    controller.signal.addEventListener('abort', () => {
      const err = new Error(`Connection timed out (${ms}ms): ${queryName}`)
      logger.error('API Timeout', { query: queryName, timeout: ms })
      reject(err)
    })
  })

  try {
    return await Promise.race([queryPromise, timeoutPromise])
  } finally {
    clearTimeout(id)
  }
}

const retry = async (fn, retries = 3) => {
  try {
    return await fn()
  } catch (err) {
    if (retries === 0) throw err
    return retry(fn, retries - 1)
  }
}

function getCacheEntry (cache, key, ttl) {
  const entry = cache.get(key)
  if (!entry) return null
  if (Date.now() - entry.timestamp > ttl) {
    cache.delete(key)
    return null
  }
  return entry.value
}

function setCacheEntry (cache, key, value) {
  cache.set(key, {
    value,
    timestamp: Date.now()
  })
}

/* ── Centralized API Layer ── */

function _ensureSupabase () {
  if (!isSupabaseReady()) throw new Error('Supabase is not configured. Please set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY.')
  return supabase
}

/* ── Auth Functions ── */

export async function signUp (email, password) {
  const sb = _ensureSupabase()
  const { data, error } = await sb.auth.signUp({ email, password })
  if (error) throw error
  return data
}

export async function login (email, password) {
  const sb = _ensureSupabase()
  const { data, error } = await sb.auth.signInWithPassword({ email, password })
  if (error) throw error
  return data
}

export async function logout () {
  const sb = _ensureSupabase()
  // Clear local session immediately so UI responds instantly
  const { error } = await sb.auth.signOut()
  if (error) throw error
}


let _sessionPromise = null
<<<<<<< HEAD
=======
const AUTH_LOCK_ERROR_PATTERNS = [
  'lock:',
  'navigatorlockmanager',
  'another request stole it',
  'was released because another request stole it'
]

export function isAuthLockError (error) {
  const message = String(error?.message || error || '').toLowerCase()
  return AUTH_LOCK_ERROR_PATTERNS.some(pattern => message.includes(pattern))
}

function delay (ms) {
  return new Promise(resolve => setTimeout(resolve, ms))
}

async function readSessionWithRetry (sb, attempts = 3) {
  let lastError = null

  for (let attempt = 0; attempt < attempts; attempt += 1) {
    const { data, error } = await sb.auth.getSession()

    if (!error) {
      return data?.session || null
    }

    if (!isAuthLockError(error)) {
      throw error
    }

    lastError = error
    logger.warn('Transient auth lock detected while reading session', {
      attempt: attempt + 1,
      message: error.message
    })

    await delay(150 * (attempt + 1))
  }

  throw lastError
}
>>>>>>> ad11b44fc234b13ed695f73fce199db7d659a2e2

export async function getSafeSession (sb) {
  // Concurrent Promise Caching: Prevent `navigator.locks` traffic jams
  if (_sessionPromise) return _sessionPromise

  _sessionPromise = (async () => {
    try {
<<<<<<< HEAD
      // Supabase internal retry logic usually handles this, 
      // but we add our own guard to catch leaks
      const { data, error } = await sb.auth.getSession()
      
      if (error) {
        // Harmless lock errors should not be propagated to UI
        if (error.message?.includes('lock')) {
          logger.warn('Suppressed Auth Lock Error:', error.message)
          // Try to return local user as fallback if available
          const { data: localUser } = await sb.auth.getUser()
          return localUser?.user || null
        }
        throw error
      }
      return data?.session?.user || null
    } catch (err) {
      if (!err.message?.includes('lock')) {
        logger.error('Session check failed', { error: err.message })
=======
      const session = await readSessionWithRetry(sb)
      return session?.user || null
    } catch (err) {
      if (!isAuthLockError(err)) {
        logger.error('Session check failed', { error: err.message })
      } else {
        logger.warn('Suppressed Auth Lock Error', { error: err.message })
>>>>>>> ad11b44fc234b13ed695f73fce199db7d659a2e2
      }
      return null
    } finally {
      // Hold promise for 3s to silence any rapid mount noise
      setTimeout(() => { _sessionPromise = null }, 3000)
    }
  })()

  return _sessionPromise
}

<<<<<<< HEAD
=======
export async function getSafeSessionData (sb) {
  try {
    return await readSessionWithRetry(sb)
  } catch (err) {
    if (!isAuthLockError(err)) {
      logger.error('Session read failed', { error: err.message })
    } else {
      logger.warn('Returning null session after transient auth lock retries', { error: err.message })
    }
    return null
  }
}

>>>>>>> ad11b44fc234b13ed695f73fce199db7d659a2e2
/* ── Resource Fetching (Unified) ── */

export async function getResources ({ type = '', search = '', branch = '', semester = '', subject = '', page = 1, limit = 12 } = {}) {
  const sb = _ensureSupabase()
  const cacheKey = JSON.stringify({ type, search, branch, semester, subject, page, limit })
  const cached = getCacheEntry(resourceCache, cacheKey, RESOURCE_CACHE_TTL)
  if (cached) return cached
  const from = (page - 1) * limit
  const to = from + limit - 1

  const applyFilters = (query) => {
    let nextQuery = query

    if (type) nextQuery = nextQuery.eq('type', type)
    if (search.trim()) {
      const s = `%${search.trim()}%`
      nextQuery = nextQuery.or(`title.ilike.${s},subject.ilike.${s},description.ilike.${s}`)
    }
    if (branch) nextQuery = nextQuery.eq('branch', branch)
    if (semester) nextQuery = nextQuery.eq('semester', parseInt(semester))
    if (subject) nextQuery = nextQuery.ilike('subject', `%${subject}%`)

    return nextQuery
  }

  const fetchResourceList = async (fields) => {
    const query = applyFilters(
      sb.from('resources').select(fields, { count: 'exact' })
    )

    return await retry(() =>
      fetchWithTimeout(
        query.order('created_at', { ascending: false }).range(from, to).throwOnError()
      )
    )
  }

  try {
    let response

    try {
      response = await fetchResourceList(RESOURCE_LIST_FIELDS)
    } catch (error) {
      const message = error?.message || ''
      const missingColumn = message.includes('does not exist') || message.includes('column')
      if (!missingColumn) throw error
      response = await fetchResourceList(RESOURCE_LIST_FIELDS_FALLBACK)
    }

    const { data, count } = response

    const result = {
      data: data || [],
      count: count || 0,
      page,
      limit,
      totalPages: Math.ceil((count || 0) / limit)
    }
    setCacheEntry(resourceCache, cacheKey, result)
    return result
  } catch (error) {
    logger.error('Resources fetch failed', { error: error.message })
    throw error
  }
}

/* ── Stats ── */

export async function getStats () {
  const sb = _ensureSupabase()
  if (statsCache && (Date.now() - statsCache.timestamp) <= STATS_CACHE_TTL) {
    return statsCache.value
  }
  try {
    const { data } = await fetchWithTimeout(sb.from('site_stats').select('*').maybeSingle().throwOnError())
    if (data) {
      statsCache = { value: data, timestamp: Date.now() }
      return data
    }

    // Fallback: count resources directly if site_stats is missing/uninitialized
    const [
      { count: n },
      { count: p },
      { count: s }
    ] = await Promise.all([
      fetchWithTimeout(sb.from('resources').select('*', { count: 'exact', head: true }).eq('type', 'notes').throwOnError()),
      fetchWithTimeout(sb.from('resources').select('*', { count: 'exact', head: true }).eq('type', 'pyq').throwOnError()),
      fetchWithTimeout(sb.from('resources').select('*', { count: 'exact', head: true }).eq('type', 'syllabus').throwOnError())
    ])

    const result = {
      total_notes: n || 0,
      total_pyq: p || 0,
      total_syllabus: s || 0
    }
    statsCache = { value: result, timestamp: Date.now() }
    return result
  } catch (err) {
    logger.warn('Stats fetch failed or timed out', { error: err.message })
    return { total_notes: 0, total_pyq: 0, total_syllabus: 0 }
  }
}

/* ── Download Tracking ── */

export async function trackDownload (fileId) {
  try {
    enforceRateLimit('download', 10, 3000) // 10 downloads per 30s burst
    const sb = _ensureSupabase()
    const user = await getSafeSession(sb)

    await fetchWithTimeout(
      sb.from('downloads').insert({
        user_id: user?.id || null,
        file_id: fileId,
        type: 'resource'
      }).throwOnError()
    )
  } catch (err) {
    // Download tracking is non-critical — never crash the app
    logger.warn('Download tracking failed', { fileId, error: err.message })
  }
}

/* ── Ratings ── */
export async function getResourceRatings (resourceId) {
  try {
    const sb = _ensureSupabase()
    const { data, error } = await fetchWithTimeout(
      sb.from('ratings').select('rating').eq('resource_id', resourceId)
    )
    if (error || !data || data.length === 0) return { average: 0, count: 0 }
    const total = data.reduce((acc, r) => acc + r.rating, 0)
    return { average: parseFloat((total / data.length).toFixed(1)), count: data.length }
  } catch (err) {
    return { average: 0, count: 0 }
  }
}

export async function getUserRating (resourceId) {
  try {
    const sb = _ensureSupabase()
    const user = await getSafeSession(sb)
    if (!user) return null
    const { data } = await fetchWithTimeout(
      sb.from('ratings').select('rating').eq('user_id', user.id).eq('resource_id', resourceId).maybeSingle()
    )
    return data?.rating || null
  } catch { return null }
}

export async function submitRating (resourceId, rating) {
  enforceRateLimit('rating', 5, 2000)
  const sb = _ensureSupabase()
  const user = await getSafeSession(sb)
  if (!user) throw new Error('Login to rate resources')
  
  const { data } = await fetchWithTimeout(
    sb.from('ratings').upsert({
      user_id: user.id,
      resource_id: resourceId,
      rating: rating
    }, { onConflict: 'user_id,resource_id' }).select().single()
  )
  for (const key of resourceCache.keys()) {
    resourceCache.delete(key)
  }
  return data
}

export async function getResourceRatingsBatch (resourceIds = [], userId = null) {
  const ids = [...new Set(resourceIds)].filter(Boolean)
  if (ids.length === 0) {
    return { ratingsByResource: {}, userRatingsByResource: {} }
  }

  try {
    const sb = _ensureSupabase()
    const ratingsQuery = fetchWithTimeout(
      sb.from('ratings')
        .select('resource_id, rating')
        .in('resource_id', ids)
        .throwOnError()
    )

    const userRatingsQuery = userId
      ? fetchWithTimeout(
          sb.from('ratings')
            .select('resource_id, rating')
            .eq('user_id', userId)
            .in('resource_id', ids)
            .throwOnError()
        )
      : Promise.resolve({ data: [] })

    const [{ data: ratings }, { data: userRatings }] = await Promise.all([ratingsQuery, userRatingsQuery])

    const totals = {}
    for (const row of ratings || []) {
      if (!totals[row.resource_id]) {
        totals[row.resource_id] = { total: 0, count: 0 }
      }
      totals[row.resource_id].total += row.rating
      totals[row.resource_id].count += 1
    }

    const ratingsByResource = {}
    for (const id of ids) {
      const summary = totals[id]
      ratingsByResource[id] = summary
        ? {
            average: parseFloat((summary.total / summary.count).toFixed(1)),
            count: summary.count
          }
        : { average: 0, count: 0 }
    }

    const userRatingsByResource = {}
    for (const row of userRatings || []) {
      userRatingsByResource[row.resource_id] = row.rating
    }

    return { ratingsByResource, userRatingsByResource }
  } catch {
    return { ratingsByResource: {}, userRatingsByResource: {} }
  }
}

/* ── Forum / Discussions ── */
export async function getForumPosts ({ branch = '', semester = '', page = 1, limit = 20 } = {}) {
  const sb = _ensureSupabase()
  const from = (page - 1) * limit
  const to = from + limit - 1
  
  let query = sb.from('forum_posts').select('*, profiles(name)', { count: 'exact' })
  if (branch && branch !== 'All') query = query.eq('branch', branch)
  if (semester && semester !== 'All') query = query.eq('semester', parseInt(semester))
  
  const { data, count } = await fetchWithTimeout(
    query.order('created_at', { ascending: false }).range(from, to).throwOnError()
  )
  
  return { 
    data: data || [], 
    count: count || 0, 
    totalPages: Math.ceil((count || 0) / limit) 
  }
}

export async function getForumPost (id) {
  const sb = _ensureSupabase()
  const { data } = await fetchWithTimeout(
    sb.from('forum_posts').select('*, profiles(name)').eq('id', id).single().throwOnError()
  )
  return data
}

export async function createForumPost (post) {
  enforceRateLimit('forum_write', 2, 10000)
  const sb = _ensureSupabase()
  const user = await getSafeSession(sb)
  if (!user) throw new Error('Login to post')
  
  const { data } = await fetchWithTimeout(
    sb.from('forum_posts').insert({
      title: post.title,
      content: post.content,
      branch: post.branch || null,
      semester: post.semester || null,
      user_id: user.id
    }).select().single().throwOnError()
  )
  return data
}

export async function getForumComments (postId) {
  const sb = _ensureSupabase()
  const { data } = await fetchWithTimeout(
    sb.from('forum_comments')
      .select('*, profiles(name)')
      .eq('post_id', postId)
      .order('created_at', { ascending: true })
      .throwOnError()
  )
  return data || []
}

export async function addForumComment (postId, content) {
  enforceRateLimit('forum_write', 5, 5000)
  const sb = _ensureSupabase()
  const user = await getSafeSession(sb)
  if (!user) throw new Error('Login to comment')
  
  const { data } = await fetchWithTimeout(
    sb.from('forum_comments').insert({
      post_id: postId,
      user_id: user.id,
      content
    }).select().single().throwOnError()
  )
  return data
}


/* ── Admin CRUD ── */

export async function createResource (resourceData) {
  enforceRateLimit('admin_write', 3, 5000)
  const sb = _ensureSupabase()

  try {
    // Duplicate check
    const { data: existing } = await fetchWithTimeout(
      sb.from('resources')
        .select('id')
        .eq('title', resourceData.title.trim())
        .eq('branch', resourceData.branch)
        .eq('semester', resourceData.semester)
        .eq('type', resourceData.type)
        .maybeSingle()
        .throwOnError()
    )

    if (existing) throw new Error('Resource already exists')

    const { data } = await retry(() =>
      fetchWithTimeout(
        sb.from('resources')
          .insert([{
            title: resourceData.title.trim(),
            description: (resourceData.description || '').trim(),
            type: resourceData.type,
            branch: resourceData.branch,
            semester: resourceData.semester,
            subject: resourceData.subject?.trim() || null,
            file_url: resourceData.file_url,
            created_by: resourceData.created_by || null
          }])
          .select()
          .single()
          .throwOnError()
      )
    )
    resourceCache.clear()
    statsCache = null
    return data
  } catch (error) {
    if (error.code === '23505') throw new Error('Resource already exists')
    logger.error('Resource creation failed', { error: error.message })
    throw new Error(error.message || 'Database write failed')
  }
}

export async function deleteResource (id) {
  enforceRateLimit('admin_write', 3, 5000)
  const sb = _ensureSupabase()
  try {
    await fetchWithTimeout(sb.from('resources').delete().eq('id', id).throwOnError())
    resourceCache.clear()
    statsCache = null
  } catch (error) {
    logger.error('Resource deletion failed', { id, error: error.message })
    throw new Error(error.message)
  }
}

/* ── File Upload ── */

const STORAGE_BUCKET = 'study-materials'
const MAX_UPLOAD_SIZE = 10 * 1024 * 1024 // 10MB

export async function uploadFile (bucket, path, file) {
  enforceRateLimit('upload', 2, 10000) // 2 uploads per 10s
  const sb = _ensureSupabase()

  if (bucket !== STORAGE_BUCKET) throw new Error('Invalid storage target')
  if (file.type !== 'application/pdf') throw new Error('Only PDF files are allowed')
  if (file.size > MAX_UPLOAD_SIZE) throw new Error(`File exceeds ${MAX_UPLOAD_SIZE / 1024 / 1024}MB limit`)

  try {
    const { data } = await retry(() =>
      fetchWithTimeout(
        // Storage API doesn't use throwOnError natively in all versions, so we await and check manually
        sb.storage.from(bucket).upload(path, file, { cacheControl: '3600', upsert: false })
      )
    )
    if (!data || data.error) throw data.error || new Error('Upload object returned null')

    const { data: { publicUrl } } = sb.storage.from(bucket).getPublicUrl(data.path)
    return publicUrl
  } catch (error) {
    if (error.message?.includes('already exists')) throw new Error('File already exists in storage')
    logger.error('File upload failed', { path, error: error.message })
    throw new Error(`Upload failed: ${error.message}`)
  }
}

/* ── Leaderboard & Profiles ── */

export async function getLeaderboard () {
  const sb = _ensureSupabase()

  try {
    const query = sb
      .from('profiles')
      .select('id, name, email, xp, level, streak_days, created_at')
      .order('xp', { ascending: false })
      .order('streak_days', { ascending: false })
      .order('created_at', { ascending: true })
      .limit(100)
      .throwOnError()

    const { data } = await fetchWithTimeout(query)
    if (!data) return []

    // Map properties to match what Leaderboard.jsx expects
    return data.map((p, index) => ({
      user_id: p.id,
      email: p.email,
      xp: p.xp,
      rank: index + 1,
      profiles: { name: p.name }
    }))
  } catch (error) {
    console.warn('Leaderboard fetch issue:', error.message)
    return []
  }
}

export async function getUserProfile (userId) {
  const sb = _ensureSupabase()

  try {
    const { data } = await fetchWithTimeout(
      sb.from('profiles')
        .select('id, name, email, xp, level, streak_days, badges, last_active, created_at')
        .eq('id', userId)
        .maybeSingle()
        .throwOnError()
    )
    return data
  } catch (error) {
    // Handle Permission Denied (42501) gracefully by fetching public stats from leaderboard
    if (error.code === '42501') {
      try {
        const { data: lbData } = await fetchWithTimeout(
          sb.from('leaderboard_weekly')
            .select('id:user_id, email, xp, level, streak_days')
            .eq('user_id', userId)
            .maybeSingle()
            .throwOnError()
        )
        if (lbData) {
          return {
            ...lbData,
            name: lbData.email.split('@')[0],
            badges: [],
            created_at: new Date().toISOString()
          }
        }
      } catch {}
      return null
    }

    // Fallback if the name column hasn't been created yet
    if (error.message?.includes('name')) {
      try {
        const { data: fallbackData } = await fetchWithTimeout(
          sb.from('profiles')
            .select('id, email, xp, level, streak_days, badges, last_active, created_at')
            .eq('id', userId)
            .maybeSingle()
            .throwOnError()
        )
        return fallbackData
      } catch (fallbackError) {
        if (fallbackError.code === '42501') {
          return null
        }
        throw fallbackError
      }
    }

    throw error
  }
}

export async function getUserBadges (userId) {
  const sb = _ensureSupabase()
  try {
    const { data } = await fetchWithTimeout(
      sb.from('user_badges')
        .select('*')
        .eq('user_id', userId)
        .order('awarded_at', { ascending: false })
        .throwOnError()
    )
    return data || []
  } catch (error) {
    // Graceful fallback for timeouts, missing table or permission denied
    logger.warn('user_badges fetch failed or timed out', { error: error.message })
    return []
  }
}

/* ── Analytics ── */
export async function getAnalytics () {
  const sb = _ensureSupabase()
  try {
    const [
      { count: totalResources },
      { count: totalDownloads },
      { data: branchStats },
      { count: totalUsers }
    ] = await Promise.all([
      fetchWithTimeout(sb.from('resources').select('*', { count: 'exact', head: true }).throwOnError()),
      fetchWithTimeout(sb.from('downloads').select('*', { count: 'exact', head: true }).throwOnError()),
      fetchWithTimeout(sb.from('resources').select('branch').throwOnError()),
      fetchWithTimeout(sb.from('profiles').select('*', { count: 'exact', head: true }).throwOnError())
    ])

    const branchCounts = (branchStats || []).reduce((acc, r) => {
      acc[r.branch] = (acc[r.branch] || 0) + 1
      return acc
    }, {})

    return {
      totalResources: totalResources || 0,
      totalDownloads: totalDownloads || 0,
      totalUsers: totalUsers || 0,
      branches: branchCounts
    }
  } catch (err) {
    logger.error('Analytics fetch failed', { error: err.message })
    throw err
  }
}

/* ── System Logging (for ErrorBoundary) ── */

export async function logSystemError (message, metadata = {}) {
  if (!isSupabaseReady()) return
  try {
    // Fire and forget without timeout/throwOnError to avoid cascade
    supabase.from('system_logs').insert({
      level: 'ERROR',
      message: String(message).slice(0, 500),
      metadata
    })
  } catch {
    // Never crash the app from logging
  }
}
