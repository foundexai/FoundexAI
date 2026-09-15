import { checkRateLimit as redisCheckRateLimit } from "@/lib/redis";

export interface RateLimitResult {
  allowed: boolean;
  limit: number;
  remaining: number;
  reset: number; // unix timestamp in seconds
}

interface LocalBucket {
  timestamps: number[];
}

// Local in-memory sliding window fallback when Redis credentials are not present
const localRateMap = new Map<string, LocalBucket>();

if (typeof setInterval !== "undefined") {
  const cleanup = setInterval(() => {
    const now = Date.now();
    for (const [key, bucket] of localRateMap.entries()) {
      bucket.timestamps = bucket.timestamps.filter((ts) => now - ts < 60000);
      if (bucket.timestamps.length === 0) {
        localRateMap.delete(key);
      }
    }
  }, 60000);
  cleanup.unref?.();
}

/**
 * Distributed rate limiter with Redis sorted-set backing and in-memory fallback.
 * Uses a 60-second sliding window per identifier.
 */
export async function checkRateLimit(
  identifier: string,
  limitPerMin: number = 120
): Promise<RateLimitResult> {
  const now = Date.now();
  const resetUnix = Math.ceil((now + 60000) / 1000);

  // 1. If Upstash Redis is available, use distributed sorted-set sliding window
  const isRedisConfigured = !!(process.env.UPSTASH_REDIS_REST_URL && process.env.UPSTASH_REDIS_REST_TOKEN);

  if (isRedisConfigured) {
    try {
      const redisResult = await redisCheckRateLimit(identifier, limitPerMin, 60);
      return {
        allowed: redisResult.allowed,
        limit: limitPerMin,
        remaining: redisResult.remaining,
        reset: resetUnix,
      };
    } catch (e) {
      // Graceful fallback to local in-memory window if Redis connection fails
    }
  }

  // 2. In-memory sliding-window fallback
  const windowStart = now - 60000;
  let bucket = localRateMap.get(identifier);
  if (!bucket) {
    bucket = { timestamps: [] };
    localRateMap.set(identifier, bucket);
  }

  bucket.timestamps = bucket.timestamps.filter((ts) => ts > windowStart);
  const currentCount = bucket.timestamps.length;
  const remaining = Math.max(0, limitPerMin - currentCount - 1);

  if (currentCount >= limitPerMin) {
    return {
      allowed: false,
      limit: limitPerMin,
      remaining: 0,
      reset: resetUnix,
    };
  }

  bucket.timestamps.push(now);

  return {
    allowed: true,
    limit: limitPerMin,
    remaining,
    reset: resetUnix,
  };
}

export function createRateLimitHeaders(result: RateLimitResult): Record<string, string> {
  return {
    "X-RateLimit-Limit": String(result.limit),
    "X-RateLimit-Remaining": String(result.remaining),
    "X-RateLimit-Reset": String(result.reset),
  };
}
