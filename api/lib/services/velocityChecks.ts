/**
 * Velocity Checks / Rate Limiting Service
 *
 * Implements rate-limiting with environment flags for API usage.
 * Provides countermeasures for preventing abuse and DDoS attacks.
 *
 * Configuration via environment variables:
 * - RATE_LIMIT_ENABLED: Enable/disable rate limiting (default: true)
 * - RATE_LIMIT_WINDOW_MS: Time window in milliseconds (default: 60000)
 * - RATE_LIMIT_MAX_REQUESTS: Maximum requests per window (default: 100)
 * - RATE_LIMIT_BURST_MULTIPLIER: Multiplier for burst detection (default: 5)
 *
 * @module velocityChecks
 */

/** Rate limit configuration from environment */
export interface RateLimitConfig {
  enabled: boolean;
  windowMs: number;
  maxRequests: number;
  burstMultiplier: number;
}

/** Result of a velocity check */
export interface VelocityCheckResult {
  allowed: boolean;
  remaining: number;
  resetTime: number;
  retryAfterMs?: number;
  reason?: string;
}

/** In-memory rate limit record */
interface RateLimitRecord {
  count: number;
  firstRequestTime: number;
  resetTime: number;
  burstCount: number;
  lastBurstCheckTime: number;
}

/** In-memory store for rate limiting (use Redis in production) */
const rateLimitStore = new Map<string, RateLimitRecord>();

/** Cleanup interval for stale records */
const CLEANUP_INTERVAL_MS = 5 * 60 * 1000; // 5 minutes

/**
 * Get rate limit configuration from environment
 */
export function getRateLimitConfig(): RateLimitConfig {
  return {
    enabled: process.env.RATE_LIMIT_ENABLED !== 'false',
    windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS || '60000', 10),
    maxRequests: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS || '100', 10),
    burstMultiplier: parseInt(
      process.env.RATE_LIMIT_BURST_MULTIPLIER || '5',
      10
    ),
  };
}

/**
 * Perform a velocity check for a given client identifier
 *
 * @param clientId - Unique client identifier (IP, user ID, API key, etc.)
 * @param config - Optional custom rate limit configuration
 * @returns VelocityCheckResult indicating if request is allowed
 */
export function checkVelocity(
  clientId: string,
  config?: Partial<RateLimitConfig>
): VelocityCheckResult {
  const effectiveConfig = { ...getRateLimitConfig(), ...config };

  // If rate limiting is disabled, always allow
  if (!effectiveConfig.enabled) {
    return {
      allowed: true,
      remaining: effectiveConfig.maxRequests,
      resetTime: Date.now() + effectiveConfig.windowMs,
    };
  }

  const now = Date.now();
  let record = rateLimitStore.get(clientId);

  // Create new record if doesn't exist or expired
  if (!record || now > record.resetTime) {
    record = {
      count: 0,
      firstRequestTime: now,
      resetTime: now + effectiveConfig.windowMs,
      burstCount: 0,
      lastBurstCheckTime: now,
    };
    rateLimitStore.set(clientId, record);
  }

  // Check for burst behavior (many requests in short time)
  const burstWindowMs = 1000; // 1 second
  if (now - record.lastBurstCheckTime < burstWindowMs) {
    record.burstCount++;

    const burstThreshold = Math.floor(
      effectiveConfig.maxRequests / effectiveConfig.burstMultiplier
    );
    if (record.burstCount > burstThreshold) {
      return {
        allowed: false,
        remaining: 0,
        resetTime: record.resetTime,
        retryAfterMs: burstWindowMs - (now - record.lastBurstCheckTime),
        reason: 'burst_detected',
      };
    }
  } else {
    record.burstCount = 1;
    record.lastBurstCheckTime = now;
  }

  // Check if over limit
  if (record.count >= effectiveConfig.maxRequests) {
    return {
      allowed: false,
      remaining: 0,
      resetTime: record.resetTime,
      retryAfterMs: record.resetTime - now,
      reason: 'rate_limit_exceeded',
    };
  }

  // Increment count and allow request
  record.count++;

  return {
    allowed: true,
    remaining: Math.max(0, effectiveConfig.maxRequests - record.count),
    resetTime: record.resetTime,
  };
}

/**
 * Create middleware-style velocity check for API routes
 *
 * @param extractClientId - Function to extract client ID from request
 * @param config - Optional custom rate limit configuration
 * @returns Middleware function that performs velocity check
 */
export function createVelocityMiddleware<TRequest>(
  extractClientId: (req: TRequest) => string,
  config?: Partial<RateLimitConfig>
): (req: TRequest) => VelocityCheckResult {
  return (req: TRequest) => {
    const clientId = extractClientId(req);
    return checkVelocity(clientId, config);
  };
}

/**
 * Get rate limit headers for HTTP response
 *
 * @param result - VelocityCheckResult from checkVelocity
 * @returns Headers object with rate limit information
 */
export function getRateLimitHeaders(
  result: VelocityCheckResult
): Record<string, string> {
  const config = getRateLimitConfig();

  return {
    'X-RateLimit-Limit': String(config.maxRequests),
    'X-RateLimit-Remaining': String(result.remaining),
    'X-RateLimit-Reset': String(Math.ceil(result.resetTime / 1000)),
    ...(result.retryAfterMs && {
      'Retry-After': String(Math.ceil(result.retryAfterMs / 1000)),
    }),
  };
}

/**
 * Reset rate limit for a specific client
 * Useful for admin operations or testing
 *
 * @param clientId - Client identifier to reset
 */
export function resetRateLimit(clientId: string): void {
  rateLimitStore.delete(clientId);
}

/**
 * Clean up stale rate limit records
 * Call periodically to prevent memory leaks
 */
export function cleanupStaleLimits(): void {
  const now = Date.now();
  for (const [clientId, record] of rateLimitStore.entries()) {
    if (now > record.resetTime + CLEANUP_INTERVAL_MS) {
      rateLimitStore.delete(clientId);
    }
  }
}

/**
 * Get current rate limit stats for monitoring
 */
export function getRateLimitStats(): {
  activeClients: number;
  totalRequests: number;
} {
  let totalRequests = 0;
  for (const record of rateLimitStore.values()) {
    totalRequests += record.count;
  }

  return {
    activeClients: rateLimitStore.size,
    totalRequests,
  };
}

// Start periodic cleanup (only in Node.js environment)
if (typeof setInterval !== 'undefined') {
  setInterval(cleanupStaleLimits, CLEANUP_INTERVAL_MS);
}
