import { Redis } from "@upstash/redis"

const URL = process.env.UPSTASH_REDIS_REST_URL
const TOKEN = process.env.UPSTASH_REDIS_REST_TOKEN

let client: Redis | null = null

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
  const c = getClient()
  if (!c) return null
  try {
    const val = await c.get(key)
    return (val as T) ?? null
  } catch {
    return null
  }
}

export async function setCache(key: string, value: unknown, ttl = 3600): Promise<void> {
  const c = getClient()
  if (!c) return
  try {
    await c.set(key, value, { ex: ttl })
  } catch {}
}

export async function invalidateCache(pattern: string): Promise<void> {
  const c = getClient()
  if (!c) return
  try {
    const keys = await c.keys(pattern)
    if (keys.length > 0) await c.del(...keys)
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
  try {
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
  } catch {
    return { allowed: true, remaining: maxRequests }
  }
}
