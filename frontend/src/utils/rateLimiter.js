/**
 * Client-side rate limiter (Token Bucket algorithm)
 * Prevents frontend abuse before requests even hit the backend.
 */

const buckets = new Map()

/**
 * @param {string} key - Unique identifier for the action (e.g., 'upload', 'download')
 * @param {number} maxTokens - Max burst capacity
 * @param {number} refillMs - Time in ms to refill one token
 * @returns {boolean} true if action is allowed, false if rate limited
 */
export function checkRateLimit (key, maxTokens = 5, refillMs = 2000) {
  const now = Date.now()

  if (!buckets.has(key)) {
    buckets.set(key, { tokens: maxTokens - 1, lastRefill: now })
    return true
  }

  const bucket = buckets.get(key)
  const elapsed = now - bucket.lastRefill
  const refillCount = Math.floor(elapsed / refillMs)

  if (refillCount > 0) {
    bucket.tokens = Math.min(maxTokens, bucket.tokens + refillCount)
    bucket.lastRefill = now
  }

  if (bucket.tokens > 0) {
    bucket.tokens--
    return true
  }

  return false
}

/**
 * Wrapper that throws if rate limited.
 * @param {string} key
 * @param {number} maxTokens
 * @param {number} refillMs
 */
export function enforceRateLimit (key, maxTokens = 5, refillMs = 2000) {
  if (!checkRateLimit(key, maxTokens, refillMs)) {
    throw new Error('Too many requests. Please wait a moment before trying again.')
  }
}
