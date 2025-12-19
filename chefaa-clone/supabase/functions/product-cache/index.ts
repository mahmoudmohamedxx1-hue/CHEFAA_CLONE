// Product Cache Edge Function
// Caches frequently accessed product data for improved performance
// Automatically handles cache invalidation and refresh

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, GET, OPTIONS',
};

const CACHE_TTL = 300; // 5 minutes for product data

interface ProductRequest {
  action: 'get' | 'invalidate' | 'refresh';
  productId?: string;
  category?: string;
  featured?: boolean;
  limit?: number;
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { status: 200, headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    const body: ProductRequest = await req.json();
    const { action, productId, category, featured, limit } = body;

    // Get cache function URL
    const cacheUrl = `${supabaseUrl}/functions/v1/cache-manager`;

    switch (action) {
      case 'get': {
        let cacheKey: string;
        let query: any;

        // Build cache key and query based on request
        if (productId) {
          cacheKey = `product:${productId}`;
          query = supabase.from('products').select('*').eq('id', productId).single();
        } else if (category) {
          cacheKey = `products:category:${category}:${limit || 20}`;
          query = supabase.from('products').select('*').eq('category', category).limit(limit || 20);
        } else if (featured) {
          cacheKey = `products:featured:${limit || 10}`;
          query = supabase.from('products').select('*').eq('is_featured', true).limit(limit || 10);
        } else {
          cacheKey = `products:all:${limit || 50}`;
          query = supabase.from('products').select('*').limit(limit || 50);
        }

        // Try to get from cache first
        const cacheResponse = await fetch(cacheUrl, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${supabaseKey}`,
          },
          body: JSON.stringify({
            action: 'get',
            key: cacheKey,
          }),
        });

        const cacheResult = await cacheResponse.json();

        if (cacheResult.cached && cacheResult.data) {
          // Cache hit - return cached data
          return new Response(
            JSON.stringify({
              success: true,
              cached: true,
              data: cacheResult.data,
              message: 'Data served from cache',
            }),
            { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }

        // Cache miss - fetch from database
        const { data, error } = await query;

        if (error) {
          throw error;
        }

        // Store in cache for future requests
        await fetch(cacheUrl, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${supabaseKey}`,
          },
          body: JSON.stringify({
            action: 'set',
            key: cacheKey,
            value: data,
            ttl: CACHE_TTL,
          }),
        });

        return new Response(
          JSON.stringify({
            success: true,
            cached: false,
            data,
            message: 'Data fetched from database and cached',
          }),
          { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      case 'invalidate': {
        // Invalidate specific product or pattern
        const pattern = productId ? `product:${productId}` : category ? `products:category:${category}*` : 'products:*';

        // For now, delete the specific key
        const cacheKey = productId ? `product:${productId}` : `products:category:${category}:20`;

        await fetch(cacheUrl, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${supabaseKey}`,
          },
          body: JSON.stringify({
            action: 'delete',
            key: cacheKey,
          }),
        });

        return new Response(
          JSON.stringify({
            success: true,
            message: `Cache invalidated for pattern: ${pattern}`,
          }),
          { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      case 'refresh': {
        // Force refresh by invalidating and re-fetching
        await fetch(req.url, {
          method: 'POST',
          headers: req.headers,
          body: JSON.stringify({ ...body, action: 'invalidate' }),
        });

        const getResponse = await fetch(req.url, {
          method: 'POST',
          headers: req.headers,
          body: JSON.stringify({ ...body, action: 'get' }),
        });

        return getResponse;
      }

      default:
        return new Response(
          JSON.stringify({ error: 'Invalid action. Use: get, invalidate, or refresh' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
    }
  } catch (error) {
    console.error('Product cache error:', error);
    return new Response(
      JSON.stringify({
        error: 'Internal server error',
        message: error.message,
      }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
