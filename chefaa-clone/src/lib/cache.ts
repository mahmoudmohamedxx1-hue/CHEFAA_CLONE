/**
 * Advanced cache management utility
 * Provides localStorage and sessionStorage caching with automatic expiration
 */

interface CacheOptions {
  ttl?: number; // Time to live in milliseconds
  storage?: 'local' | 'session';
  compress?: boolean;
}

interface CacheEntry<T> {
  value: T;
  timestamp: number;
  ttl?: number;
}

class CacheManager {
  private static instance: CacheManager;
  private memoryCache: Map<string, CacheEntry<any>> = new Map();

  private constructor() {
    // Cleanup expired entries on initialization
    this.cleanupExpired();
  }

  static getInstance(): CacheManager {
    if (!CacheManager.instance) {
      CacheManager.instance = new CacheManager();
    }
    return CacheManager.instance;
  }

  /**
   * Set cache entry
   */
  set<T>(key: string, value: T, options: CacheOptions = {}): void {
    const { ttl, storage = 'local' } = options;
    
    const entry: CacheEntry<T> = {
      value,
      timestamp: Date.now(),
      ttl,
    };

    // Store in memory cache
    this.memoryCache.set(key, entry);

    // Store in browser storage
    try {
      const storageEngine = storage === 'session' ? sessionStorage : localStorage;
      storageEngine.setItem(key, JSON.stringify(entry));
    } catch (e) {
      console.warn(`Failed to store in ${storage}Storage:`, e);
    }
  }

  /**
   * Get cache entry
   */
  get<T>(key: string, options: CacheOptions = {}): T | null {
    const { storage = 'local' } = options;

    // Check memory cache first
    const memoryEntry = this.memoryCache.get(key);
    if (memoryEntry && !this.isExpired(memoryEntry)) {
      return memoryEntry.value;
    }

    // Check browser storage
    try {
      const storageEngine = storage === 'session' ? sessionStorage : localStorage;
      const stored = storageEngine.getItem(key);
      
      if (stored) {
        const entry: CacheEntry<T> = JSON.parse(stored);
        
        if (!this.isExpired(entry)) {
          // Update memory cache
          this.memoryCache.set(key, entry);
          return entry.value;
        } else {
          // Remove expired entry
          this.remove(key, { storage });
        }
      }
    } catch (e) {
      console.warn(`Failed to retrieve from ${storage}Storage:`, e);
    }

    return null;
  }

  /**
   * Check if entry is expired
   */
  private isExpired(entry: CacheEntry<any>): boolean {
    if (!entry.ttl) return false;
    return Date.now() - entry.timestamp > entry.ttl;
  }

  /**
   * Remove cache entry
   */
  remove(key: string, options: CacheOptions = {}): void {
    const { storage = 'local' } = options;

    // Remove from memory cache
    this.memoryCache.delete(key);

    // Remove from browser storage
    try {
      const storageEngine = storage === 'session' ? sessionStorage : localStorage;
      storageEngine.removeItem(key);
    } catch (e) {
      console.warn(`Failed to remove from ${storage}Storage:`, e);
    }
  }

  /**
   * Clear all cache entries
   */
  clear(storage: 'local' | 'session' | 'both' = 'both'): void {
    // Clear memory cache
    this.memoryCache.clear();

    // Clear browser storage
    try {
      if (storage === 'local' || storage === 'both') {
        localStorage.clear();
      }
      if (storage === 'session' || storage === 'both') {
        sessionStorage.clear();
      }
    } catch (e) {
      console.warn('Failed to clear storage:', e);
    }
  }

  /**
   * Cleanup expired entries
   */
  cleanupExpired(): void {
    // Cleanup memory cache
    for (const [key, entry] of this.memoryCache.entries()) {
      if (this.isExpired(entry)) {
        this.memoryCache.delete(key);
      }
    }

    // Cleanup localStorage
    try {
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key) {
          const stored = localStorage.getItem(key);
          if (stored) {
            try {
              const entry = JSON.parse(stored);
              if (entry.timestamp && entry.ttl && this.isExpired(entry)) {
                localStorage.removeItem(key);
              }
            } catch (e) {
              // Not a cache entry, skip
            }
          }
        }
      }
    } catch (e) {
      console.warn('Failed to cleanup localStorage:', e);
    }
  }

  /**
   * Get all cache keys
   */
  keys(storage: 'local' | 'session' = 'local'): string[] {
    try {
      const storageEngine = storage === 'session' ? sessionStorage : localStorage;
      return Object.keys(storageEngine);
    } catch (e) {
      return [];
    }
  }

  /**
   * Get cache size
   */
  size(storage: 'local' | 'session' | 'memory' = 'memory'): number {
    if (storage === 'memory') {
      return this.memoryCache.size;
    }

    try {
      const storageEngine = storage === 'session' ? sessionStorage : localStorage;
      return storageEngine.length;
    } catch (e) {
      return 0;
    }
  }
}

// Export singleton instance
export const cacheManager = CacheManager.getInstance();

/**
 * React hook for caching
 */
export function useCache<T>(
  key: string,
  fetcher: () => Promise<T>,
  options: CacheOptions = {}
): {
  data: T | null;
  isLoading: boolean;
  error: Error | null;
  refetch: () => Promise<void>;
} {
  const [data, setData] = React.useState<T | null>(null);
  const [isLoading, setIsLoading] = React.useState(true);
  const [error, setError] = React.useState<Error | null>(null);

  const fetchData = async () => {
    setIsLoading(true);
    setError(null);

    try {
      // Check cache first
      const cached = cacheManager.get<T>(key, options);
      if (cached !== null) {
        setData(cached);
        setIsLoading(false);
        return;
      }

      // Fetch fresh data
      const freshData = await fetcher();
      cacheManager.set(key, freshData, options);
      setData(freshData);
    } catch (e) {
      setError(e as Error);
    } finally {
      setIsLoading(false);
    }
  };

  React.useEffect(() => {
    fetchData();
  }, [key]);

  return {
    data,
    isLoading,
    error,
    refetch: fetchData,
  };
}

/**
 * Cache API responses
 */
export async function cacheAPIResponse<T>(
  cacheKey: string,
  fetcher: () => Promise<T>,
  ttl: number = 5 * 60 * 1000 // 5 minutes default
): Promise<T> {
  const cached = cacheManager.get<T>(cacheKey);
  if (cached !== null) {
    return cached;
  }

  const data = await fetcher();
  cacheManager.set(cacheKey, data, { ttl });
  return data;
}

/**
 * Prefetch and cache data
 */
export function prefetchData<T>(
  cacheKey: string,
  fetcher: () => Promise<T>,
  options: CacheOptions = {}
): void {
  // Don't prefetch if already cached
  const cached = cacheManager.get<T>(cacheKey, options);
  if (cached !== null) return;

  // Fetch in background
  fetcher()
    .then((data) => {
      cacheManager.set(cacheKey, data, options);
    })
    .catch((e) => {
      console.warn('Prefetch failed:', e);
    });
}

/**
 * Schedule cleanup of expired cache entries
 */
export function scheduleCleanup(intervalMs: number = 60 * 60 * 1000): () => void {
  const interval = setInterval(() => {
    cacheManager.cleanupExpired();
  }, intervalMs);

  return () => clearInterval(interval);
}

// Auto-import React for hooks
import React from 'react';

// Schedule cleanup every hour
if (typeof window !== 'undefined') {
  scheduleCleanup();
}
