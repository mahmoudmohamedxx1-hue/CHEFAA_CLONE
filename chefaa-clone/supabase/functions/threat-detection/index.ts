// Advanced Threat Detection with ML-based Anomaly Detection
// Analyzes user behavior patterns and detects suspicious activities

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, GET, OPTIONS',
};

interface ThreatDetectionRequest {
  action: 'analyze' | 'report_anomaly' | 'get_threats' | 'lock_account' | 'unlock_account';
  userId?: string;
  eventType?: string;
  eventData?: any;
  severity?: 'low' | 'medium' | 'high' | 'critical';
}

// Calculate anomaly score based on behavior patterns
function calculateAnomalyScore(currentBehavior: any, historicalPatterns: any[]): number {
  if (!historicalPatterns || historicalPatterns.length === 0) {
    return 0.5; // Neutral score for new users
  }

  let score = 0;
  let factors = 0;

  // Check login time pattern
  if (currentBehavior.login_hour !== undefined) {
    const historicalHours = historicalPatterns
      .filter(p => p.pattern_type === 'login_time')
      .map(p => p.pattern_data.hour);
    
    if (historicalHours.length > 0) {
      const hourDeviation = Math.min(
        ...historicalHours.map(h => Math.abs(h - currentBehavior.login_hour))
      );
      score += hourDeviation > 6 ? 0.3 : 0; // Suspicious if 6+ hours different
      factors++;
    }
  }

  // Check location pattern
  if (currentBehavior.location) {
    const historicalLocations = historicalPatterns
      .filter(p => p.pattern_type === 'location')
      .map(p => p.pattern_data.country);
    
    if (historicalLocations.length > 0 && !historicalLocations.includes(currentBehavior.location)) {
      score += 0.4; // New location is suspicious
      factors++;
    }
  }

  // Check device pattern
  if (currentBehavior.device) {
    const historicalDevices = historicalPatterns
      .filter(p => p.pattern_type === 'device')
      .map(p => p.pattern_data.device_type);
    
    if (historicalDevices.length > 0 && !historicalDevices.includes(currentBehavior.device)) {
      score += 0.3; // New device is somewhat suspicious
      factors++;
    }
  }

  // Check activity frequency
  if (currentBehavior.request_rate) {
    const avgRate = historicalPatterns
      .filter(p => p.pattern_type === 'activity_frequency')
      .reduce((sum, p) => sum + (p.pattern_data.requests_per_minute || 0), 0) / 
      historicalPatterns.filter(p => p.pattern_type === 'activity_frequency').length;
    
    if (avgRate > 0 && currentBehavior.request_rate > avgRate * 3) {
      score += 0.4; // Much higher activity is suspicious
      factors++;
    }
  }

  return factors > 0 ? Math.min(score / factors, 1.0) : 0.5;
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { status: 200, headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    const body: ThreatDetectionRequest = await req.json();
    const { action, userId, eventType, eventData, severity } = body;

    const ipAddress = req.headers.get('x-forwarded-for') || 'unknown';
    const userAgent = req.headers.get('user-agent') || 'unknown';

    switch (action) {
      case 'analyze': {
        if (!userId) {
          throw new Error('User ID required');
        }

        // Get historical behavior patterns
        const { data: patterns } = await supabase
          .from('user_behavior_patterns')
          .select('*')
          .eq('user_id', userId)
          .order('last_updated', { ascending: false })
          .limit(50);

        // Analyze current behavior
        const currentBehavior = {
          login_hour: new Date().getHours(),
          location: eventData?.country || 'unknown',
          device: eventData?.device_type || 'unknown',
          request_rate: eventData?.request_rate || 0,
        };

        const anomalyScore = calculateAnomalyScore(currentBehavior, patterns || []);

        // Determine threat level
        let threatLevel: 'none' | 'low' | 'medium' | 'high' | 'critical' = 'none';
        let shouldLockAccount = false;

        if (anomalyScore > 0.8) {
          threatLevel = 'critical';
          shouldLockAccount = true;
        } else if (anomalyScore > 0.6) {
          threatLevel = 'high';
        } else if (anomalyScore > 0.4) {
          threatLevel = 'medium';
        } else if (anomalyScore > 0.2) {
          threatLevel = 'low';
        }

        // Log anomaly if score is significant
        if (anomalyScore > 0.4) {
          await supabase
            .from('security_anomalies')
            .insert({
              user_id: userId,
              anomaly_type: eventType || 'behavior_anomaly',
              severity: threatLevel,
              details: {
                anomaly_score: anomalyScore,
                current_behavior: currentBehavior,
                event_data: eventData,
              },
              ip_address: ipAddress,
              user_agent: userAgent,
            });
        }

        // Lock account if critical
        if (shouldLockAccount) {
          await supabase.auth.admin.updateUserById(userId, {
            user_metadata: { account_locked: true, locked_reason: 'Suspicious activity detected' },
          });
        }

        return new Response(
          JSON.stringify({
            success: true,
            anomaly_score: Math.round(anomalyScore * 100) / 100,
            threat_level: threatLevel,
            account_locked: shouldLockAccount,
            recommendations: [
              ...(anomalyScore > 0.6 ? ['Verify user identity'] : []),
              ...(anomalyScore > 0.4 ? ['Enable additional monitoring'] : []),
              ...(shouldLockAccount ? ['Account locked - user must verify identity'] : []),
            ],
          }),
          { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      case 'report_anomaly': {
        if (!userId || !eventType) {
          throw new Error('User ID and event type required');
        }

        await supabase
          .from('security_anomalies')
          .insert({
            user_id: userId,
            anomaly_type: eventType,
            severity: severity || 'medium',
            details: eventData || {},
            ip_address: ipAddress,
            user_agent: userAgent,
          });

        return new Response(
          JSON.stringify({
            success: true,
            message: 'Anomaly reported successfully',
          }),
          { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      case 'get_threats': {
        const { data: threats } = await supabase
          .from('security_anomalies')
          .select('*')
          .eq('resolved', false)
          .order('created_at', { ascending: false })
          .limit(100);

        // Group by severity
        const groupedThreats = {
          critical: threats?.filter(t => t.severity === 'critical') || [],
          high: threats?.filter(t => t.severity === 'high') || [],
          medium: threats?.filter(t => t.severity === 'medium') || [],
          low: threats?.filter(t => t.severity === 'low') || [],
        };

        return new Response(
          JSON.stringify({
            success: true,
            total_threats: threats?.length || 0,
            threats: groupedThreats,
            summary: {
              critical: groupedThreats.critical.length,
              high: groupedThreats.high.length,
              medium: groupedThreats.medium.length,
              low: groupedThreats.low.length,
            },
          }),
          { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      case 'lock_account': {
        if (!userId) {
          throw new Error('User ID required');
        }

        await supabase.auth.admin.updateUserById(userId, {
          user_metadata: { 
            account_locked: true, 
            locked_reason: eventData?.reason || 'Security concern',
            locked_at: new Date().toISOString(),
          },
        });

        // Log the action
        await supabase
          .from('security_anomalies')
          .insert({
            user_id: userId,
            anomaly_type: 'account_locked',
            severity: 'high',
            details: { reason: eventData?.reason || 'Manual lock' },
            ip_address: ipAddress,
          });

        return new Response(
          JSON.stringify({
            success: true,
            message: 'Account locked successfully',
          }),
          { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      case 'unlock_account': {
        if (!userId) {
          throw new Error('User ID required');
        }

        await supabase.auth.admin.updateUserById(userId, {
          user_metadata: { 
            account_locked: false, 
            unlocked_at: new Date().toISOString(),
          },
        });

        // Mark related anomalies as resolved
        await supabase
          .from('security_anomalies')
          .update({ resolved: true, resolved_at: new Date().toISOString() })
          .eq('user_id', userId)
          .eq('resolved', false);

        return new Response(
          JSON.stringify({
            success: true,
            message: 'Account unlocked successfully',
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
    console.error('Threat Detection Error:', error);
    return new Response(
      JSON.stringify({
        error: 'Internal server error',
        message: error.message,
      }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
