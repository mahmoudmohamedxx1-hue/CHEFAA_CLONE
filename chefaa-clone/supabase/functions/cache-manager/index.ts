// Cache Manager Edge Function (Database-backed)
// Provides high-performance caching using Supabase database + in-memory
// Implements TTL expiration and automatic cleanup

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, GET, OPTIONS, DELETE',
};

interface CacheRequest {
  action: 'get' | 'set' | 'delete' | 'clear' | 'stats';
  key?: string;
  value?: any;
  ttl?: number; // Time to live in seconds
}

// In-memory cache for ultra-fast access within edge function instance
const memoryCache = new Map<string, { value: any; expires: number }>();
const stats = {
  hits: 0,
  misses: 0,
  memoryHits: 0,
  dbHits: 0,
};

Deno.serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, { status: 200, headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    const body: CacheRequest = await req.json();
    const { action, key, value, ttl } = body;

    switch (action) {
      case 'get': {
        if (!key) {
          return new Response(
            JSON.stringify({ error: 'Key is required for get operation' }),
            { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }

        // Check memory cache first
        const memoryCached = memoryCache.get(key);
        if (memoryCached && memoryCached.expires > Date.now()) {
          stats.hits++;
          stats.memoryHits++;
          return new Response(
            JSON.stringify({
              success: true,
              cached: true,
              source: 'memory',
              data: memoryCached.value,
              message: 'Cache hit (memory)',
            }),
            { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }

        // Check database cache
        const { data: cacheData, error } = await supabase
          .from('cache_entries')
          .select('*')
          .eq('key', key)
          .gt('expires_at', new Date().toISOString())
          .single();

        if (error || !cacheData) {
          stats.misses++;
          return new Response(
            JSON.stringify({
              success: false,
              cached: false,
              message: 'Cache miss',
            }),
            { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }

        // Store in memory cache for faster subsequent access
        const expiresAt = new Date(cacheData.expires_at).getTime();
        memoryCache.set(key, {
          value: cacheData.value,
          expires: expiresAt,
        });

        stats.hits++;
        stats.dbHits++;
        return new Response(
          JSON.stringify({
            success: true,
            cached: true,
            source: 'database',
            data: cacheData.value,
            message: 'Cache hit (database)',
          }),
          { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      case 'set': {
        if (!key || value === undefined) {
          return new Response(
            JSON.stringify({ error: 'Key and value are required for set operation' }),
            { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }

        const ttlSeconds = ttl || 300; // Default 5 minutes
        const expiresAt = new Date(Date.now() + ttlSeconds * 1000);

        // Store in database
        const { error } = await supabase
          .from('cache_entries')
          .upsert({
            key,
            value,
            expires_at: expiresAt.toISOString(),
            created_at: new Date().toISOString(),
          });

        if (error) {
          throw error;
        }

        // Store in memory cache
        memoryCache.set(key, {
          value,
          expires: expiresAt.getTime(),
        });

        return new Response(
          JSON.stringify({
            success: true,
            message: 'Value cached successfully',
            key,
            ttl: ttlSeconds,
            expires_at: expiresAt.toISOString(),
          }),
          { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      case 'delete': {
        if (!key) {
          return new Response(
            JSON.stringify({ error: 'Key is required for delete operation' }),
            { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }

        // Delete from memory cache
        memoryCache.delete(key);

        // Delete from database
        await supabase.from('cache_entries').delete().eq('key', key);

        return new Response(
          JSON.stringify({
            success: true,
            message: 'Cache entry deleted',
            key,
          }),
          { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      case 'clear': {
        // Clear memory cache
        memoryCache.clear();

        // Delete all from database
        const { error, count } = await supabase.from('cache_entries').delete().neq('key', '');

        return new Response(
          JSON.stringify({
            success: true,
            message: 'Cache cleared',
            deletedKeys: count || 0,
          }),
          { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      case 'stats': {
        // Get database cache size
        const { count } = await supabase
          .from('cache_entries')
          .select('*', { count: 'exact', head: true })
          .gt('expires_at', new Date().toISOString());

        const total = stats.hits + stats.misses;
        const hitRate = total > 0 ? (stats.hits / total) * 100 : 0;
        const missRate = total > 0 ? (stats.misses / total) * 100 : 0;

        return new Response(
          JSON.stringify({
            success: true,
            stats: {
              totalKeys: count || 0,
              memoryKeys: memoryCache.size,
              hitRate: Math.round(hitRate * 100) / 100,
              missRate: Math.round(missRate * 100) / 100,
            },
            rawStats: {
              hits: stats.hits,
              misses: stats.misses,
              memoryHits: stats.memoryHits,
              dbHits: stats.dbHits,
            },
          }),
          { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      default:
        return new Response(
          JSON.stringify({ error: 'Invalid action. Use: get, set, delete, clear, or stats' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
    }
  } catch (error) {
    console.error('Cache manager error:', error);
    return new Response(
      JSON.stringify({
        error: 'Internal server error',
        message: error.message,
      }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
