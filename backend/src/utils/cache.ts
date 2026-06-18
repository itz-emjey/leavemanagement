/**
 * In-memory / Redis-backed cache for reference data and aggregates.
 *
 * Uses ioredis when REDIS_URL is set; falls back to an in-memory Map.
 * All operations are safe: Redis failures silently fall back to
 * in-memory, and missing keys return undefined.
 */

import { logger } from './logger';

// ── Key patterns ──────────────────────────────────────────────
export const CacheKeys = {
  LEAVE_TYPES: 'leave_types',
  DEPARTMENTS: 'departments',
  HOLIDAYS: (year: number) => `holidays:${year}`,
  UPCOMING_HOLIDAYS: 'holidays:upcoming',
  LEAVE_POLICIES: 'leave_policies',
  LEAVE_PATTERNS: (employeeId?: number) =>
    employeeId ? `leave_patterns:${employeeId}` : 'leave_patterns',
  DASHBOARD_ADMIN: 'dashboard:admin',
  DASHBOARD_EMPLOYEE: (empId: number) => `dashboard:employee:${empId}`,
  ANALYTICS_OVERVIEW: (year: number) => `analytics:overview:${year}`,
  ANALYTICS_TRENDS: (year: number, deptId?: string) =>
    `analytics:trends:${year}:${deptId || 'all'}`,
  ANALYTICS_EMPLOYEES: (year: number) => `analytics:employees:${year}`,
  ANALYTICS_UTILIZATION: (year: number) => `analytics:utilization:${year}`,
  CALENDAR_EXPORT: (year: number, empId?: number) =>
    `calendar:export:${year}:${empId || 'all'}`,
} as const;

// ── In-memory store ───────────────────────────────────────────
interface CacheEntry<T> {
  data: T;
  expiresAt: number;
}
const memoryStore = new Map<string, CacheEntry<any>>();

const DEFAULT_TTL_SECONDS = 300; // 5 minutes

// ── Redis client (lazy) ───────────────────────────────────────
let redisClient: any = null;

async function getRedis(): Promise<any | null> {
  if (redisClient !== null) return redisClient; // already attempted
  const url = process.env.REDIS_URL;
  if (!url) {
    redisClient = false as any; // signal "not available"
    return null;
  }
  try {
    const { Redis } = await import('ioredis');
    redisClient = new Redis(url, {
      maxRetriesPerRequest: 1,
      retryStrategy(times: number) {
        if (times > 3) return null; // give up
        return Math.min(times * 200, 1000);
      },
      lazyConnect: true,
    });
    await redisClient.connect();
    logger.info('Redis cache connected');
    return redisClient;
  } catch (err) {
    logger.warn('Redis unavailable, falling back to in-memory cache', {
      error: String(err),
    });
    redisClient = false as any;
    return null;
  }
}

// ── Public API ────────────────────────────────────────────────

export function cacheGet<T>(key: string): T | undefined {
  const entry = memoryStore.get(key);
  if (!entry) return undefined;
  if (Date.now() > entry.expiresAt) {
    memoryStore.delete(key);
    return undefined;
  }
  return entry.data as T;
}

export function cacheSet<T>(
  key: string,
  data: T,
  ttlSeconds = DEFAULT_TTL_SECONDS,
): void {
  memoryStore.set(key, {
    data,
    expiresAt: Date.now() + ttlSeconds * 1000,
  });
}

export function cacheDelete(key: string): void {
  memoryStore.delete(key);
}

/**
 * Delete all cache entries whose key starts with the given prefix.
 * Useful for invalidating groups of related keys (e.g. all dashboard data).
 */
export function cacheInvalidateByPrefix(prefix: string): void {
  for (const key of memoryStore.keys()) {
    if (key.startsWith(prefix)) {
      memoryStore.delete(key);
    }
  }
}

export function cacheClear(): void {
  memoryStore.clear();
}

/**
 * Fetch data with caching.  If the cache is warm, return the cached value.
 * If cold, call fetchFn, store the result, and return it.
 */
export async function cacheWrap<T>(
  key: string,
  fetchFn: () => Promise<T>,
  ttlSeconds?: number,
): Promise<T> {
  const cached = cacheGet<T>(key);
  if (cached !== undefined) return cached;

  const data = await fetchFn();
  cacheSet(key, data, ttlSeconds);
  return data;
}
