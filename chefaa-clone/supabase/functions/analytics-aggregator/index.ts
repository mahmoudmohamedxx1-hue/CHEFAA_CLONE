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
    const { metric, timeRange = '24h' } = await req.json();
    
    const supabaseUrl = Deno.env.get('SUPABASE_URL');
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');

    if (!supabaseUrl || !supabaseKey) {
      throw new Error('Missing Supabase configuration');
    }

    // Calculate time filter based on range
    const now = new Date();
    let startTime;
    switch (timeRange) {
      case '1h':
        startTime = new Date(now.getTime() - 60 * 60 * 1000);
        break;
      case '24h':
        startTime = new Date(now.getTime() - 24 * 60 * 60 * 1000);
        break;
      case '7d':
        startTime = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        break;
      case '30d':
        startTime = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
        break;
      default:
        startTime = new Date(now.getTime() - 24 * 60 * 60 * 1000);
    }

    let data = {};

    switch (metric) {
      case 'performance_overview':
        // Get performance metrics
        const perfResponse = await fetch(
          `${supabaseUrl}/rest/v1/system_performance_metrics?timestamp=gte.${startTime.toISOString()}&order=timestamp.desc&limit=100`,
          {
            headers: {
              'apikey': supabaseKey,
              'Authorization': `Bearer ${supabaseKey}`
            }
          }
        );
        data.performance = await perfResponse.json();
        break;

      case 'user_behavior':
        // Get user behavior analytics
        const behaviorResponse = await fetch(
          `${supabaseUrl}/rest/v1/user_behavior_analytics?timestamp=gte.${startTime.toISOString()}&order=timestamp.desc&limit=100`,
          {
            headers: {
              'apikey': supabaseKey,
              'Authorization': `Bearer ${supabaseKey}`
            }
          }
        );
        const behaviorData = await behaviorResponse.json();
        
        // Aggregate data
        const eventTypes = {};
        const pages = {};
        behaviorData.forEach((event: any) => {
          eventTypes[event.event_type] = (eventTypes[event.event_type] || 0) + 1;
          pages[event.page_url] = (pages[event.page_url] || 0) + 1;
        });
        
        data.user_behavior = {
          total_events: behaviorData.length,
          event_types: eventTypes,
          top_pages: Object.entries(pages).sort((a: any, b: any) => b[1] - a[1]).slice(0, 10),
          raw_data: behaviorData.slice(0, 20)
        };
        break;

      case 'security_events':
        // Get security events
        const securityResponse = await fetch(
          `${supabaseUrl}/rest/v1/security_events_analytics?timestamp=gte.${startTime.toISOString()}&order=timestamp.desc&limit=100`,
          {
            headers: {
              'apikey': supabaseKey,
              'Authorization': `Bearer ${supabaseKey}`
            }
          }
        );
        const securityData = await securityResponse.json();
        
        // Aggregate by severity
        const bySeverity = {};
        securityData.forEach((event: any) => {
          bySeverity[event.severity] = (bySeverity[event.severity] || 0) + 1;
        });
        
        data.security_events = {
          total_events: securityData.length,
          by_severity: bySeverity,
          recent_events: securityData.slice(0, 10)
        };
        break;

      case 'system_health':
        // Get system health status
        const healthResponse = await fetch(
          `${supabaseUrl}/rest/v1/system_health_logs?timestamp=gte.${startTime.toISOString()}&order=timestamp.desc&limit=50`,
          {
            headers: {
              'apikey': supabaseKey,
              'Authorization': `Bearer ${supabaseKey}`
            }
          }
        );
        const healthData = await healthResponse.json();
        
        // Get latest status for each component
        const components = {};
        healthData.forEach((log: any) => {
          if (!components[log.component] || new Date(log.timestamp) > new Date(components[log.component].timestamp)) {
            components[log.component] = log;
          }
        });
        
        data.system_health = {
          components: Object.values(components),
          history: healthData
        };
        break;

      case 'medication_adherence':
        // Get medication adherence data
        const adherenceResponse = await fetch(
          `${supabaseUrl}/rest/v1/medication_adherence_data?date=gte.${startTime.toISOString().split('T')[0]}&order=created_at.desc&limit=100`,
          {
            headers: {
              'apikey': supabaseKey,
              'Authorization': `Bearer ${supabaseKey}`
            }
          }
        );
        const adherenceData = await adherenceResponse.json();
        
        // Calculate adherence rate
        const totalRecords = adherenceData.length;
        const takenRecords = adherenceData.filter((r: any) => r.adherence_status === 'taken').length;
        const adherenceRate = totalRecords > 0 ? (takenRecords / totalRecords * 100).toFixed(2) : 0;
        
        data.medication_adherence = {
          total_records: totalRecords,
          taken: takenRecords,
          missed: totalRecords - takenRecords,
          adherence_rate: adherenceRate,
          recent_data: adherenceData.slice(0, 20)
        };
        break;

      case 'clinical_trials':
        // Get clinical trial metrics
        const trialsResponse = await fetch(
          `${supabaseUrl}/rest/v1/clinical_trial_metrics?order=updated_at.desc&limit=50`,
          {
            headers: {
              'apikey': supabaseKey,
              'Authorization': `Bearer ${supabaseKey}`
            }
          }
        );
        const trialsData = await trialsResponse.json();
        
        // Calculate overall success rate
        const trialsWithOutcome = trialsData.filter((t: any) => t.primary_outcome_met !== null);
        const successfulTrials = trialsWithOutcome.filter((t: any) => t.primary_outcome_met === true).length;
        const overallSuccessRate = trialsWithOutcome.length > 0 ? 
          (successfulTrials / trialsWithOutcome.length * 100).toFixed(2) : 0;
        
        data.clinical_trials = {
          total_trials: trialsData.length,
          success_rate: overallSuccessRate,
          trials: trialsData
        };
        break;

      case 'dashboard_overview':
        // Get aggregated data for dashboard overview
        const [perf, behavior, security, health] = await Promise.all([
          fetch(`${supabaseUrl}/rest/v1/system_performance_metrics?timestamp=gte.${startTime.toISOString()}&order=timestamp.desc&limit=10`, {
            headers: { 'apikey': supabaseKey, 'Authorization': `Bearer ${supabaseKey}` }
          }).then(r => r.json()),
          fetch(`${supabaseUrl}/rest/v1/user_behavior_analytics?timestamp=gte.${startTime.toISOString()}&order=timestamp.desc&limit=50`, {
            headers: { 'apikey': supabaseKey, 'Authorization': `Bearer ${supabaseKey}` }
          }).then(r => r.json()),
          fetch(`${supabaseUrl}/rest/v1/security_events_analytics?timestamp=gte.${startTime.toISOString()}&order=timestamp.desc&limit=10`, {
            headers: { 'apikey': supabaseKey, 'Authorization': `Bearer ${supabaseKey}` }
          }).then(r => r.json()),
          fetch(`${supabaseUrl}/rest/v1/system_health_logs?timestamp=gte.${startTime.toISOString()}&order=timestamp.desc&limit=10`, {
            headers: { 'apikey': supabaseKey, 'Authorization': `Bearer ${supabaseKey}` }
          }).then(r => r.json())
        ]);

        data.dashboard_overview = {
          performance: perf,
          user_sessions: behavior.length,
          security_events: security.length,
          system_health: health[0] || { health_score: 100 }
        };
        break;

      default:
        throw new Error(`Unknown metric: ${metric}`);
    }

    return new Response(
      JSON.stringify({ success: true, data, timestamp: new Date().toISOString() }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    return new Response(
      JSON.stringify({ 
        error: {
          code: 'ANALYTICS_AGGREGATION_ERROR',
          message: error.message
        }
      }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
