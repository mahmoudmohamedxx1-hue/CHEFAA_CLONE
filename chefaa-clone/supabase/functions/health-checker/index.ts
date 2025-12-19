Deno.serve(async (req) => {
  const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
  };

  if (req.method === 'OPTIONS') {
    return new Response(null, { status: 200, headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL');
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');

    if (!supabaseUrl || !supabaseKey) {
      throw new Error('Missing Supabase configuration');
    }

    // Check various system components
    const checks = [];

    // 1. Database connectivity
    const dbStart = Date.now();
    try {
      const dbCheck = await fetch(`${supabaseUrl}/rest/v1/products?select=count&limit=1`, {
        headers: { 'apikey': supabaseKey, 'Authorization': `Bearer ${supabaseKey}` }
      });
      const dbTime = Date.now() - dbStart;
      checks.push({
        component: 'database',
        status: dbCheck.ok ? 'healthy' : 'degraded',
        health_score: dbCheck.ok ? 100 : 50,
        response_time_ms: dbTime,
        error_count: dbCheck.ok ? 0 : 1,
        metadata: { check_type: 'connectivity' }
      });
    } catch (error) {
      checks.push({
        component: 'database',
        status: 'down',
        health_score: 0,
        response_time_ms: Date.now() - dbStart,
        error_count: 1,
        metadata: { error: error.message }
      });
    }

    // 2. API responsiveness
    const apiStart = Date.now();
    try {
      const apiCheck = await fetch(`${supabaseUrl}/rest/v1/`, {
        headers: { 'apikey': supabaseKey }
      });
      const apiTime = Date.now() - apiStart;
      checks.push({
        component: 'api',
        status: apiCheck.ok ? 'healthy' : 'degraded',
        health_score: apiCheck.ok && apiTime < 1000 ? 100 : (apiCheck.ok ? 75 : 0),
        response_time_ms: apiTime,
        error_count: apiCheck.ok ? 0 : 1,
        metadata: { check_type: 'responsiveness' }
      });
    } catch (error) {
      checks.push({
        component: 'api',
        status: 'down',
        health_score: 0,
        response_time_ms: Date.now() - apiStart,
        error_count: 1,
        metadata: { error: error.message }
      });
    }

    // 3. Edge Functions
    checks.push({
      component: 'edge_functions',
      status: 'healthy',
      health_score: 100,
      response_time_ms: Date.now() - dbStart,
      error_count: 0,
      metadata: { check_type: 'self_check' }
    });

    // Insert health check results
    for (const check of checks) {
      await fetch(`${supabaseUrl}/rest/v1/system_health_logs`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'apikey': supabaseKey,
          'Authorization': `Bearer ${supabaseKey}`,
          'Prefer': 'return=minimal'
        },
        body: JSON.stringify(check)
      });
    }

    // Calculate overall health
    const avgHealthScore = checks.reduce((sum, c) => sum + c.health_score, 0) / checks.length;
    const overallStatus = avgHealthScore >= 90 ? 'healthy' : 
                         avgHealthScore >= 50 ? 'degraded' : 'critical';

    return new Response(
      JSON.stringify({ 
        success: true,
        overall_status: overallStatus,
        overall_health_score: Math.round(avgHealthScore),
        checks,
        timestamp: new Date().toISOString()
      }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    return new Response(
      JSON.stringify({ 
        error: {
          code: 'HEALTH_CHECK_ERROR',
          message: error.message
        }
      }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
