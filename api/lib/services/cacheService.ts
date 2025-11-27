/**
 * Redis API Stub for Accrual Cache
 *
 * Provides high-performance cache capability for accrual calculations
 * during active phases. This is a stub implementation that can be
 * backed by Redis or any compatible key-value store in production.
 *
 * In production, use:
 * - Vercel KV (Redis-compatible)
 * - Upstash Redis
 * - AWS ElastiCache
 * - Self-hosted Redis
 *
 * Configuration via environment variables:
 * - REDIS_URL: Redis connection URL (optional, uses memory cache if not set)
 * - REDIS_TOKEN: Redis auth token (for Upstash/Vercel KV)
 * - CACHE_TTL_SECONDS: Default cache TTL (default: 3600)
 *
 * @module cacheService
 */

/** Cache entry with metadata */
export interface CacheEntry<T = unknown> {
  value: T;
  createdAt: number;
  expiresAt: number;
  hitCount: number;
}

/** Cache statistics */
export interface CacheStats {
  hits: number;
  misses: number;
  entries: number;
  memoryUsageBytes?: number;
}

/** Cache configuration */
export interface CacheConfig {
  ttlSeconds: number;
  maxEntries: number;
  enableStats: boolean;
}

/** Accrual data to cache */
export interface AccrualCacheData {
  employerId: string;
  employeeId: string;
  yearlyAccrued: number;
  yearlyUsed: number;
  carryoverHours: number;
  availableBalance: number;
  lastCalculatedAt: string;
  calculationMethod: 'large_employer' | 'small_employer';
  yearStart: string;
}

/** In-memory cache store (development/fallback) */
const memoryCache = new Map<string, CacheEntry>();

/** Cache statistics */
let stats: CacheStats = {
  hits: 0,
  misses: 0,
  entries: 0,
};

/**
 * Get cache configuration from environment
 */
export function getCacheConfig(): CacheConfig {
  return {
    ttlSeconds: parseInt(process.env.CACHE_TTL_SECONDS || '3600', 10),
    maxEntries: parseInt(process.env.CACHE_MAX_ENTRIES || '10000', 10),
    enableStats: process.env.CACHE_ENABLE_STATS !== 'false',
  };
}

/**
 * Check if Redis is configured (for future integration)
 */
export function isRedisConfigured(): boolean {
  return !!(process.env.REDIS_URL || process.env.KV_URL);
}

/**
 * Generate cache key for accrual data
 *
 * @param employerId - Employer identifier
 * @param employeeId - Employee identifier
 * @param year - Year for accrual calculation
 * @returns Formatted cache key
 */
export function generateAccrualCacheKey(
  employerId: string,
  employeeId: string,
  year: number
): string {
  return `accrual:${employerId}:${employeeId}:${year}`;
}

/**
 * Get value from cache
 *
 * @param key - Cache key
 * @returns Cached value or null if not found/expired
 */
export async function get<T>(key: string): Promise<T | null> {
  const config = getCacheConfig();
  const entry = memoryCache.get(key);

  if (!entry) {
    if (config.enableStats) stats.misses++;
    return null;
  }

  // Check expiration
  if (Date.now() > entry.expiresAt) {
    memoryCache.delete(key);
    if (config.enableStats) {
      stats.misses++;
      stats.entries = memoryCache.size;
    }
    return null;
  }

  // Update hit count
  entry.hitCount++;
  if (config.enableStats) stats.hits++;

  return entry.value as T;
}

/**
 * Set value in cache
 *
 * @param key - Cache key
 * @param value - Value to cache
 * @param ttlSeconds - Optional TTL override
 */
export async function set<T>(
  key: string,
  value: T,
  ttlSeconds?: number
): Promise<void> {
  const config = getCacheConfig();
  const ttl = ttlSeconds ?? config.ttlSeconds;
  const now = Date.now();

  // Enforce max entries limit with LRU-like eviction
  if (memoryCache.size >= config.maxEntries) {
    evictOldestEntries(Math.floor(config.maxEntries * 0.1));
  }

  memoryCache.set(key, {
    value,
    createdAt: now,
    expiresAt: now + ttl * 1000,
    hitCount: 0,
  });

  if (config.enableStats) {
    stats.entries = memoryCache.size;
  }
}

/**
 * Delete value from cache
 *
 * @param key - Cache key
 */
export async function del(key: string): Promise<void> {
  memoryCache.delete(key);
  const config = getCacheConfig();
  if (config.enableStats) {
    stats.entries = memoryCache.size;
  }
}

/**
 * Delete all keys matching a pattern
 *
 * @param pattern - Key pattern (supports * wildcard)
 */
export async function deletePattern(pattern: string): Promise<number> {
  const regex = new RegExp('^' + pattern.replace(/\*/g, '.*') + '$');
  let deleted = 0;

  for (const key of memoryCache.keys()) {
    if (regex.test(key)) {
      memoryCache.delete(key);
      deleted++;
    }
  }

  const config = getCacheConfig();
  if (config.enableStats) {
    stats.entries = memoryCache.size;
  }

  return deleted;
}

/**
 * Get cached accrual data for employee
 *
 * @param employerId - Employer identifier
 * @param employeeId - Employee identifier
 * @param year - Year for accrual calculation
 * @returns Cached accrual data or null
 */
export async function getAccrualCache(
  employerId: string,
  employeeId: string,
  year: number
): Promise<AccrualCacheData | null> {
  const key = generateAccrualCacheKey(employerId, employeeId, year);
  return get<AccrualCacheData>(key);
}

/**
 * Set accrual data in cache
 *
 * @param data - Accrual data to cache
 * @param ttlSeconds - Optional TTL override
 */
export async function setAccrualCache(
  data: AccrualCacheData,
  ttlSeconds?: number
): Promise<void> {
  const year = new Date(data.yearStart).getFullYear();
  const key = generateAccrualCacheKey(data.employerId, data.employeeId, year);
  await set(key, data, ttlSeconds);
}

/**
 * Invalidate all accrual cache for an employee
 *
 * @param employerId - Employer identifier
 * @param employeeId - Employee identifier
 */
export async function invalidateEmployeeAccrualCache(
  employerId: string,
  employeeId: string
): Promise<void> {
  await deletePattern(`accrual:${employerId}:${employeeId}:*`);
}

/**
 * Invalidate all accrual cache for an employer
 *
 * @param employerId - Employer identifier
 */
export async function invalidateEmployerAccrualCache(
  employerId: string
): Promise<void> {
  await deletePattern(`accrual:${employerId}:*`);
}

/**
 * Evict oldest entries to make room for new ones
 *
 * @param count - Number of entries to evict
 */
function evictOldestEntries(count: number): void {
  const entries = Array.from(memoryCache.entries()).sort(
    (a, b) => a[1].createdAt - b[1].createdAt
  );

  for (let i = 0; i < Math.min(count, entries.length); i++) {
    const entry = entries[i];
    if (entry) {
      memoryCache.delete(entry[0]);
    }
  }
}

/**
 * Get cache statistics
 */
export function getCacheStats(): CacheStats {
  return {
    ...stats,
    entries: memoryCache.size,
    memoryUsageBytes: estimateMemoryUsage(),
  };
}

/**
 * Estimate memory usage of cache
 */
function estimateMemoryUsage(): number {
  let bytes = 0;
  for (const [key, entry] of memoryCache.entries()) {
    bytes += key.length * 2; // UTF-16
    bytes += JSON.stringify(entry.value).length * 2;
    bytes += 48; // overhead for entry metadata
  }
  return bytes;
}

/**
 * Clear all cache entries
 */
export async function clearCache(): Promise<void> {
  memoryCache.clear();
  stats = {
    hits: 0,
    misses: 0,
    entries: 0,
  };
}

/**
 * Cleanup expired entries
 * Call periodically to prevent memory leaks
 */
export function cleanupExpiredEntries(): number {
  const now = Date.now();
  let cleaned = 0;

  for (const [key, entry] of memoryCache.entries()) {
    if (now > entry.expiresAt) {
      memoryCache.delete(key);
      cleaned++;
    }
  }

  const config = getCacheConfig();
  if (config.enableStats) {
    stats.entries = memoryCache.size;
  }

  return cleaned;
}

// Start periodic cleanup (only in Node.js environment)
if (typeof setInterval !== 'undefined') {
  // Clean up expired entries every 5 minutes
  setInterval(cleanupExpiredEntries, 5 * 60 * 1000);
}
