import { LRUCache } from "lru-cache";

interface CacheEntry<T> {
  value: T;
  expiresAt: number;
}

// Generic typed cache with per-entry TTL using LRUCache
export function createCache<T>(maxSize: number = 500) {
  const cache = new LRUCache<string, CacheEntry<T>>({ max: maxSize });

  return {
    get(key: string): T | undefined {
      const entry = cache.get(key);
      if (!entry) return undefined;
      if (Date.now() > entry.expiresAt) {
        cache.delete(key);
        return undefined;
      }
      return entry.value;
    },

    set(key: string, value: T, ttlMs: number = 15_000): void {
      cache.set(key, { value, expiresAt: Date.now() + ttlMs });
    },

    delete(key: string): void {
      cache.delete(key);
    },

    clear(): void {
      cache.clear();
    },

    has(key: string): boolean {
      const entry = cache.get(key);
      if (!entry) return false;
      if (Date.now() > entry.expiresAt) {
        cache.delete(key);
        return false;
      }
      return true;
    },

    size(): number {
      return cache.size;
    },
  };
}

// Shared caches for different data types
export const priceCache = createCache<unknown>(1000);
export const historyCache = createCache<unknown>(200);
export const fundamentalsCache = createCache<unknown>(100);
export const newsCache = createCache<unknown>(200);
export const macroCache = createCache<unknown>(50);
export const fxCache = createCache<unknown>(50);
