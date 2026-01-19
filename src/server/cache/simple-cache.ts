/**
 * Simple in-memory cache with TTL support
 * No external dependencies - uses native Map
 *
 * Cache TTL Configuration:
 * - Events: 15 minutes (event hierarchy rarely changes)
 * - Schedules: 10 minutes (match schedules)
 * - Match Data: 5 minutes (frequently updated during tournaments)
 *
 * This cache is shared across requests in the same server instance
 */

interface CacheEntry<T> {
  data: T
  expiry: number
}

const eventCache = new Map<string, CacheEntry<any>>()
const scheduleCache = new Map<string, CacheEntry<any>>()
const matchCache = new Map<string, CacheEntry<any>>()

const CACHE_TTL = {
  events: 15 * 60 * 1000, // 15 minutes
  schedules: 10 * 60 * 1000, // 10 minutes
  matches: 5 * 60 * 1000, // 5 minutes
}

function get<T>(cache: Map<string, CacheEntry<T>>, key: string): T | null {
  const entry = cache.get(key)
  if (!entry) return null
  if (Date.now() > entry.expiry) {
    cache.delete(key)
    return null
  }
  return entry.data
}

function set<T>(cache: Map<string, CacheEntry<T>>, key: string, data: T, ttl: number): void {
  cache.set(key, { data, expiry: Date.now() + ttl })
}

/**
 * Event cache manager
 * Use for caching event hierarchy data
 */
export const eventCacheManager = {
  get: (key: string) => get(eventCache, key),
  set: <T>(key: string, data: T) => set(eventCache, key, data, CACHE_TTL.events),
  invalidate: (key: string) => eventCache.delete(key),
  clear: () => eventCache.clear(),
  has: (key: string) => {
    const entry = eventCache.get(key)
    if (!entry) return false
    if (Date.now() > entry.expiry) {
      eventCache.delete(key)
      return false
    }
    return true
  }
}

/**
 * Schedule cache manager
 * Use for caching schedule/group data
 */
export const scheduleCacheManager = {
  get: (key: string) => get(scheduleCache, key),
  set: <T>(key: string, data: T) => set(scheduleCache, key, data, CACHE_TTL.schedules),
  invalidate: (key: string) => scheduleCache.delete(key),
  clear: () => scheduleCache.clear(),
  has: (key: string) => {
    const entry = scheduleCache.get(key)
    if (!entry) return false
    if (Date.now() > entry.expiry) {
      scheduleCache.delete(key)
      return false
    }
    return true
  }
}

/**
 * Match data cache manager
 * Use for caching match results
 */
export const matchCacheManager = {
  get: (key: string) => get(matchCache, key),
  set: <T>(key: string, data: T) => set(matchCache, key, data, CACHE_TTL.matches),
  invalidate: (key: string) => matchCache.delete(key),
  clear: () => matchCache.clear(),
  has: (key: string) => {
    const entry = matchCache.get(key)
    if (!entry) return false
    if (Date.now() > entry.expiry) {
      matchCache.delete(key)
      return false
    }
    return true
  }
}

/**
 * Cache invalidation helpers
 * Call these when data is updated
 */
export function invalidateEventCache(eventId?: string) {
  if (eventId) {
    eventCacheManager.invalidate(eventId)
    // Also invalidate related schedules
    for (const key of scheduleCache.keys()) {
      if (key.includes(eventId)) {
        scheduleCacheManager.invalidate(key)
      }
    }
  } else {
    eventCacheManager.clear()
    scheduleCacheManager.clear()
  }
}

export function invalidateScheduleCache(stageId?: string) {
  if (stageId) {
    scheduleCacheManager.invalidate(stageId)
  } else {
    scheduleCacheManager.clear()
  }
}

export function invalidateMatchCache(scheduleId?: string) {
  if (scheduleId) {
    matchCacheManager.invalidate(scheduleId)
  } else {
    matchCacheManager.clear()
  }
}

/**
 * Get cache statistics for monitoring
 */
export function getCacheStats() {
  return {
    events: {
      size: eventCache.size,
      entries: Array.from(eventCache.entries()).map(([key, value]) => ({
        key,
        expiresIn: Math.max(0, value.expiry - Date.now())
      }))
    },
    schedules: {
      size: scheduleCache.size,
      entries: Array.from(scheduleCache.entries()).map(([key, value]) => ({
        key,
        expiresIn: Math.max(0, value.expiry - Date.now())
      }))
    },
    matches: {
      size: matchCache.size,
      entries: Array.from(matchCache.entries()).map(([key, value]) => ({
        key,
        expiresIn: Math.max(0, value.expiry - Date.now())
      }))
    }
  }
}
