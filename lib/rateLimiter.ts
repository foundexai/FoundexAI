export interface RateLimitResult {
  allowed: boolean;
  limit: number;
  remaining: number;
  reset: number; // unix timestamp in seconds
}

interface RateLimitBucket {
  timestamps: number[];
}

// In-memory sliding window bucket store
const rateLimitMap = new Map<string, RateLimitBucket>();

// Periodic garbage collection every 5 minutes to prevent memory leak
if (typeof setInterval !== "undefined") {
  setInterval(() => {
    const now = Date.now();
    for (const [key, bucket] of rateLimitMap.entries()) {
      bucket.timestamps = bucket.timestamps.filter((ts) => now - ts < 60000);
      if (bucket.timestamps.length === 0) {
        rateLimitMap.delete(key);
      }
    }
  }, 300000);
}

/**
 * Applies a sliding window rate limiter per identifier (API key ID or IP)
 * @param identifier Unique rate limiting key (e.g. key_id, user_id, or IP)
 * @param limitPerMin Max requests allowed in a 60-second window
 */
export function checkRateLimit(
  identifier: string,
  limitPerMin: number = 120
): RateLimitResult {
  const now = Date.now();
  const windowStart = now - 60000;

  let bucket = rateLimitMap.get(identifier);
  if (!bucket) {
    bucket = { timestamps: [] };
    rateLimitMap.set(identifier, bucket);
  }

  // Filter timestamps outside current 60s sliding window
  bucket.timestamps = bucket.timestamps.filter((ts) => ts > windowStart);

  const currentCount = bucket.timestamps.length;
  const remaining = Math.max(0, limitPerMin - currentCount - 1);
  const oldestTimestamp = bucket.timestamps[0] || now;
  const resetUnix = Math.ceil((oldestTimestamp + 60000) / 1000);

  if (currentCount >= limitPerMin) {
    return {
      allowed: false,
      limit: limitPerMin,
      remaining: 0,
      reset: resetUnix,
    };
  }

  // Register current request timestamp
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
