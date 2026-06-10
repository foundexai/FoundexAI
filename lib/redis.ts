import { Redis } from "@upstash/redis"

const URL = process.env.UPSTASH_REDIS_REST_URL
const TOKEN = process.env.UPSTASH_REDIS_REST_TOKEN

let client: Redis | null = null

// Simple local in-memory cache for fast hot-key lookups (0ms latency)
const localCache = new Map<string, { value: any; expires: number }>()

// Periodically clean up expired local cache entries to prevent leaks
if (typeof setInterval !== "undefined") {
  const interval = setInterval(() => {
    const now = Date.now()
    for (const [key, item] of localCache.entries()) {
      if (now > item.expires) {
        localCache.delete(key)
      }
    }
  }, 60000)
  interval.unref?.()
}

// Timeout helper to ensure slow HTTP REST connections to Upstash do not block the application
async function callWithTimeout<T>(promise: Promise<T>, timeoutMs = 800, fallbackValue: T): Promise<T> {
  let timeoutId: any
  const timeoutPromise = new Promise<T>((resolve) => {
    timeoutId = setTimeout(() => resolve(fallbackValue), timeoutMs)
  })
  try {
    const result = await Promise.race([promise, timeoutPromise])
    clearTimeout(timeoutId)
    return result
  } catch {
    clearTimeout(timeoutId)
    return fallbackValue
  }
}

function getClient(): Redis | null {
  if (client) return client
  if (!URL || !TOKEN) return null
  try {
    client = new Redis({ url: URL, token: TOKEN })
    return client
  } catch {
    return null
  }
}

export async function getCache<T>(key: string): Promise<T | null> {
  const now = Date.now()
  const local = localCache.get(key)
  if (local && now < local.expires) {
    return local.value as T
  }

  const c = getClient()
  if (!c) return null
  try {
    const val = await callWithTimeout(
      c.get(key).then(v => (v as T) ?? null),
      600, // 600ms timeout for get
      null
    )
    if (val !== null) {
      // Cache locally for 10 seconds to avoid duplicate network calls in short bursts
      localCache.set(key, { value: val, expires: now + 10000 })
    }
    return val
  } catch {
    return null
  }
}

export async function setCache(key: string, value: unknown, ttl = 3600): Promise<void> {
  const now = Date.now()
  // Update local cache
  localCache.set(key, { value, expires: now + Math.min(ttl * 1000, 10000) })

  const c = getClient()
  if (!c) return
  try {
    await callWithTimeout(
      c.set(key, value, { ex: ttl }),
      600, // 600ms timeout for set
      undefined
    )
  } catch {}
}

export async function deleteCache(key: string): Promise<void> {
  localCache.delete(key)
  const c = getClient()
  if (!c) return
  try {
    await callWithTimeout(
      c.del(key),
      600, // 600ms timeout for single key deletion
      undefined
    )
  } catch {}
}

export async function invalidateCache(pattern: string): Promise<void> {
  const c = getClient()
  if (!c) return
  try {
    await callWithTimeout(
      (async () => {
        const keys = await c.keys(pattern)
        if (keys.length > 0) {
          await c.del(...keys)
          // Invalidate matching keys from local cache
          const regexStr = pattern.replace(/\*/g, ".*")
          const regex = new RegExp(`^${regexStr}$`)
          for (const key of localCache.keys()) {
            if (regex.test(key)) {
              localCache.delete(key)
            }
          }
        }
      })(),
      1000, // 1000ms timeout for invalidation
      undefined
    )
  } catch {}
}

export async function checkRateLimit(
  key: string,
  maxRequests: number,
  windowSeconds: number,
): Promise<{ allowed: boolean; remaining: number }> {
  const c = getClient()
  if (!c) return { allowed: true, remaining: maxRequests }
  const now = Date.now()
  const windowKey = `ratelimit:${key}`
  
  const execution = async () => {
    const p = c.multi()
    p.zremrangebyscore(windowKey, 0, now - windowSeconds * 1000)
    p.zadd(windowKey, { score: now, member: `${now}-${Math.random()}` })
    p.zcard(windowKey)
    p.expire(windowKey, windowSeconds)
    const results = await p.exec()
    const count = typeof results?.[2] === "number" ? results[2] : 0
    return {
      allowed: count <= maxRequests,
      remaining: Math.max(0, maxRequests - count),
    }
  }

  return callWithTimeout(
    execution(),
    800, // 800ms timeout for rate limit checks
    { allowed: true, remaining: maxRequests }
  )
}
