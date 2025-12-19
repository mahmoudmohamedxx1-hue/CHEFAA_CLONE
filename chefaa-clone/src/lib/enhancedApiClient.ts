// Enhanced API Client with Caching and Compression
// Integrates with Supabase Edge Functions for optimal performance

import { supabase } from './supabase';

const CACHE_URL = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/cache-manager`;
const PRODUCT_CACHE_URL = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/product-cache`;
const COMPRESSION_URL = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/api-compression`;

interface CacheOptions {
  ttl?: number; // Time to live in seconds
  bypassCache?: boolean; // Skip cache and fetch fresh data
  compress?: boolean; // Enable response compression
}

interface ApiResponse<T> {
  data: T | null;
  cached: boolean;
  compressed: boolean;
  error?: string;
}

class EnhancedApiClient {
  private readonly anonKey: string;

  constructor() {
    this.anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || '';
  }

  /**
   * Cached product fetch with automatic cache management
   */
  async getProducts(options: CacheOptions = {}): Promise<ApiResponse<any[]>> {
    const { ttl = 300, bypassCache = false } = options;

    try {
      if (!bypassCache) {
        const response = await fetch(PRODUCT_CACHE_URL, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'apikey': this.anonKey,
          },
          body: JSON.stringify({
            action: 'get',
            limit: 50,
          }),
        });

        const result = await response.json();

        if (result.success && result.cached) {
          return {
            data: result.data,
            cached: true,
            compressed: false,
          };
        }
      }

      // Cache miss or bypass - fetch from database
      const { data, error } = await supabase
        .from('products')
        .select('*')
        .eq('is_active', true)
        .limit(50);

      if (error) {
        throw error;
      }

      return {
        data,
        cached: false,
        compressed: false,
      };
    } catch (error: any) {
      console.error('Product fetch error:', error);
      return {
        data: null,
        cached: false,
        compressed: false,
        error: error.message,
      };
    }
  }

  /**
   * Get product by ID with caching
   */
  async getProductById(productId: string, options: CacheOptions = {}): Promise<ApiResponse<any>> {
    const { ttl = 300, bypassCache = false } = options;

    try {
      if (!bypassCache) {
        const response = await fetch(PRODUCT_CACHE_URL, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'apikey': this.anonKey,
          },
          body: JSON.stringify({
            action: 'get',
            productId,
          }),
        });

        const result = await response.json();

        if (result.success && result.cached) {
          return {
            data: result.data,
            cached: true,
            compressed: false,
          };
        }
      }

      // Cache miss or bypass - fetch from database
      const { data, error } = await supabase
        .from('products')
        .select('*')
        .eq('id', productId)
        .single();

      if (error) {
        throw error;
      }

      return {
        data,
        cached: false,
        compressed: false,
      };
    } catch (error: any) {
      console.error('Product fetch error:', error);
      return {
        data: null,
        cached: false,
        compressed: false,
        error: error.message,
      };
    }
  }

  /**
   * Get products by category with caching
   */
  async getProductsByCategory(category: string, options: CacheOptions = {}): Promise<ApiResponse<any[]>> {
    const { ttl = 300, bypassCache = false } = options;

    try {
      if (!bypassCache) {
        const response = await fetch(PRODUCT_CACHE_URL, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'apikey': this.anonKey,
          },
          body: JSON.stringify({
            action: 'get',
            category,
            limit: 20,
          }),
        });

        const result = await response.json();

        if (result.success && result.cached) {
          return {
            data: result.data,
            cached: true,
            compressed: false,
          };
        }
      }

      // Cache miss or bypass - fetch from database
      const { data, error } = await supabase
        .from('products')
        .select('*')
        .eq('category', category)
        .eq('is_active', true)
        .limit(20);

      if (error) {
        throw error;
      }

      return {
        data,
        cached: false,
        compressed: false,
      };
    } catch (error: any) {
      console.error('Category products fetch error:', error);
      return {
        data: null,
        cached: false,
        compressed: false,
        error: error.message,
      };
    }
  }

  /**
   * Invalidate cache for a specific product or pattern
   */
  async invalidateCache(productId?: string, category?: string): Promise<boolean> {
    try {
      await fetch(PRODUCT_CACHE_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'apikey': this.anonKey,
        },
        body: JSON.stringify({
          action: 'invalidate',
          productId,
          category,
        }),
      });

      return true;
    } catch (error) {
      console.error('Cache invalidation error:', error);
      return false;
    }
  }

  /**
   * Get cache statistics
   */
  async getCacheStats(): Promise<any> {
    try {
      const response = await fetch(CACHE_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'apikey': this.anonKey,
        },
        body: JSON.stringify({
          action: 'stats',
        }),
      });

      const result = await response.json();
      return result.stats || null;
    } catch (error) {
      console.error('Cache stats error:', error);
      return null;
    }
  }

  /**
   * Compress API response (for large datasets)
   */
  async compressResponse(data: any): Promise<Blob | null> {
    try {
      const response = await fetch(COMPRESSION_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept-Encoding': 'gzip',
          'apikey': this.anonKey,
        },
        body: JSON.stringify({
          data,
          compress: true,
        }),
      });

      if (response.headers.get('Content-Encoding') === 'gzip') {
        return await response.blob();
      }

      return null;
    } catch (error) {
      console.error('Compression error:', error);
      return null;
    }
  }
}

// Export singleton instance
export const apiClient = new EnhancedApiClient();

// Export types
export type { CacheOptions, ApiResponse };
