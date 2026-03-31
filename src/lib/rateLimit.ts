/**
 * In-memory rate limiter for Next.js API routes.
 * Uses a sliding window algorithm per IP.
 */

interface RateLimitEntry {
  count: number;
  resetAt: number;
}

const store = new Map<string, RateLimitEntry>();

// Auto-purge old entries every 5 minutes to prevent memory bloat
setInterval(() => {
  const now = Date.now();
  for (const [key, entry] of store.entries()) {
    if (entry.resetAt < now) store.delete(key);
  }
}, 5 * 60 * 1000);

interface RateLimitOptions {
  /** Max requests per window */
  limit: number;
  /** Window size in seconds */
  windowSeconds: number;
}

export interface RateLimitResult {
  success: boolean;
  remaining: number;
  resetAt: number;
}

/**
 * Check rate limit for a given identifier (usually IP).
 * Returns { success: true } if under limit, { success: false } if exceeded.
 */
export function rateLimitCheck(
  identifier: string,
  options: RateLimitOptions = { limit: 60, windowSeconds: 60 }
): RateLimitResult {
  const now = Date.now();
  const key = `rl:${identifier}`;
  const existing = store.get(key);

  // If no entry or window expired — start fresh
  if (!existing || existing.resetAt < now) {
    const resetAt = now + options.windowSeconds * 1000;
    store.set(key, { count: 1, resetAt });
    return { success: true, remaining: options.limit - 1, resetAt };
  }

  // Increment
  existing.count += 1;
  store.set(key, existing);

  if (existing.count > options.limit) {
    return { success: false, remaining: 0, resetAt: existing.resetAt };
  }

  return {
    success: true,
    remaining: options.limit - existing.count,
    resetAt: existing.resetAt,
  };
}

/** Presets for common use-cases */
export const RateLimitPresets = {
  /** General API — 60 req/min */
  api: { limit: 60, windowSeconds: 60 },
  /** Auth routes — 10 req/min */
  auth: { limit: 10, windowSeconds: 60 },
  /** Sensitive actions (OTP, call, etc.) — 5 req/5-min */
  sensitive: { limit: 5, windowSeconds: 300 },
  /** AI routes — 20 req/min */
  ai: { limit: 20, windowSeconds: 60 },
};
