// Rate Limiting and DDoS Protection
// Implements sliding window rate limiting with automatic blocking

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-forwarded-for',
  'Access-Control-Allow-Methods': 'POST, GET, OPTIONS',
};

interface RateLimitConfig {
  endpoint: string;
  limit: number; // requests per window
  windowSeconds: number;
}

// Rate limit configurations
const RATE_LIMITS: Record<string, RateLimitConfig> = {
  'login': { endpoint: 'login', limit: 5, windowSeconds: 300 }, // 5 attempts per 5 minutes
  'signup': { endpoint: 'signup', limit: 3, windowSeconds: 3600 }, // 3 attempts per hour
  'api': { endpoint: 'api', limit: 100, windowSeconds: 60 }, // 100 requests per minute
  'search': { endpoint: 'search', limit: 50, windowSeconds: 60 }, // 50 searches per minute
  'checkout': { endpoint: 'checkout', limit: 10, windowSeconds: 300 }, // 10 checkouts per 5 minutes
};

interface RateLimitRequest {
  action: 'check' | 'block' | 'unblock' | 'stats' | 'clear';
  endpoint?: string;
  identifier?: string; // IP or user_id
  reason?: string;
  duration?: number; // Block duration in seconds
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { status: 200, headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    const body: RateLimitRequest = await req.json();
    const { action, endpoint, identifier, reason, duration } = body;

    const ipAddress = req.headers.get('x-forwarded-for') || 
                      req.headers.get('x-real-ip') || 
                      'unknown';
    
    const currentIdentifier = identifier || ipAddress;

    switch (action) {
      case 'check': {
        if (!endpoint) {
          throw new Error('Endpoint required');
        }

        // Check if IP is blocked
        const { data: blockedIp } = await supabase
          .from('blocked_ips')
          .select('*')
          .eq('ip_address', currentIdentifier)
          .single();

        if (blockedIp) {
          const now = new Date();
          const blockedUntil = blockedIp.blocked_until ? new Date(blockedIp.blocked_until) : null;
          
          if (blockedIp.permanent || (blockedUntil && blockedUntil > now)) {
            return new Response(
              JSON.stringify({
                allowed: false,
                blocked: true,
                reason: blockedIp.reason,
                blocked_until: blockedIp.blocked_until,
                permanent: blockedIp.permanent,
              }),
              { status: 429, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
            );
          } else if (blockedUntil && blockedUntil <= now) {
            // Unblock expired temporary block
            await supabase
              .from('blocked_ips')
              .delete()
              .eq('ip_address', currentIdentifier);
          }
        }

        // Get rate limit config
        const config = RATE_LIMITS[endpoint] || RATE_LIMITS['api'];
        const windowStart = new Date(Date.now() - config.windowSeconds * 1000);

        // Get or create rate limit entry
        const { data: existing } = await supabase
          .from('rate_limit_entries')
          .select('*')
          .eq('identifier', currentIdentifier)
          .eq('endpoint', endpoint)
          .gte('window_start', windowStart.toISOString())
          .single();

        if (existing) {
          const requestCount = existing.request_count + 1;
          
          if (requestCount > config.limit) {
            // Rate limit exceeded
            await supabase
              .from('rate_limit_entries')
              .update({ 
                request_count: requestCount,
                blocked_until: new Date(Date.now() + 300000).toISOString() // Block for 5 minutes
              })
              .eq('id', existing.id);

            // Log security anomaly
            await supabase
              .from('security_anomalies')
              .insert({
                anomaly_type: 'rapid_requests',
                severity: 'medium',
                details: {
                  endpoint,
                  request_count: requestCount,
                  limit: config.limit,
                  window_seconds: config.windowSeconds,
                },
                ip_address: currentIdentifier,
                user_agent: req.headers.get('user-agent'),
              });

            return new Response(
              JSON.stringify({
                allowed: false,
                rate_limited: true,
                limit: config.limit,
                window_seconds: config.windowSeconds,
                retry_after: 300,
              }),
              { status: 429, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
            );
          } else {
            // Update count
            await supabase
              .from('rate_limit_entries')
              .update({ request_count: requestCount })
              .eq('id', existing.id);

            return new Response(
              JSON.stringify({
                allowed: true,
                remaining: config.limit - requestCount,
                reset_at: new Date(new Date(existing.window_start).getTime() + config.windowSeconds * 1000).toISOString(),
              }),
              { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
            );
          }
        } else {
          // Create new entry
          await supabase
            .from('rate_limit_entries')
            .insert({
              identifier: currentIdentifier,
              endpoint,
              request_count: 1,
              window_start: new Date().toISOString(),
            });

          return new Response(
            JSON.stringify({
              allowed: true,
              remaining: config.limit - 1,
              reset_at: new Date(Date.now() + config.windowSeconds * 1000).toISOString(),
            }),
            { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }
      }

      case 'block': {
        if (!identifier) {
          throw new Error('Identifier required');
        }

        const blockDuration = duration || 3600; // Default 1 hour
        const blockedUntil = new Date(Date.now() + blockDuration * 1000);

        await supabase
          .from('blocked_ips')
          .upsert({
            ip_address: identifier,
            reason: reason || 'Manual block',
            blocked_until: blockedUntil.toISOString(),
            permanent: false,
          });

        return new Response(
          JSON.stringify({
            success: true,
            message: `Blocked ${identifier} until ${blockedUntil.toISOString()}`,
          }),
          { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      case 'unblock': {
        if (!identifier) {
          throw new Error('Identifier required');
        }

        await supabase
          .from('blocked_ips')
          .delete()
          .eq('ip_address', identifier);

        return new Response(
          JSON.stringify({
            success: true,
            message: `Unblocked ${identifier}`,
          }),
          { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      case 'stats': {
        // Get rate limiting statistics
        const { count: totalBlocked } = await supabase
          .from('blocked_ips')
          .select('*', { count: 'exact', head: true });

        const { count: activeRateLimits } = await supabase
          .from('rate_limit_entries')
          .select('*', { count: 'exact', head: true })
          .gte('window_start', new Date(Date.now() - 3600000).toISOString());

        const { data: recentAnomalies } = await supabase
          .from('security_anomalies')
          .select('anomaly_type, severity')
          .gte('created_at', new Date(Date.now() - 3600000).toISOString())
          .order('created_at', { ascending: false })
          .limit(100);

        return new Response(
          JSON.stringify({
            success: true,
            stats: {
              total_blocked_ips: totalBlocked || 0,
              active_rate_limits: activeRateLimits || 0,
              recent_anomalies: recentAnomalies?.length || 0,
              anomaly_breakdown: recentAnomalies?.reduce((acc: any, a: any) => {
                acc[a.anomaly_type] = (acc[a.anomaly_type] || 0) + 1;
                return acc;
              }, {}),
            },
          }),
          { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      case 'clear': {
        // Clear old rate limit entries (older than 24 hours)
        const oneDayAgo = new Date(Date.now() - 86400000).toISOString();
        
        const { count } = await supabase
          .from('rate_limit_entries')
          .delete()
          .lt('window_start', oneDayAgo);

        return new Response(
          JSON.stringify({
            success: true,
            message: `Cleared ${count || 0} old rate limit entries`,
          }),
          { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      default:
        return new Response(
          JSON.stringify({ error: 'Invalid action' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
    }
  } catch (error) {
    console.error('Rate Limiting Error:', error);
    return new Response(
      JSON.stringify({
        error: 'Internal server error',
        message: error.message,
      }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
