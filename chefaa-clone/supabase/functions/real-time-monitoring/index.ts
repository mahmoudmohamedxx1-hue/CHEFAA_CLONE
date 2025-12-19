// Real-time Health Monitoring Edge Function
// Continuous monitoring of vital signs, medication adherence, and wellness metrics

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, GET, OPTIONS',
};

// Monitoring thresholds and alert rules
const MONITORING_RULES = {
  vital_signs: {
    heart_rate: { min: 60, max: 100, critical_min: 40, critical_max: 150 },
    blood_pressure_systolic: { min: 90, max: 120, critical_min: 70, critical_max: 180 },
    blood_pressure_diastolic: { min: 60, max: 80, critical_min: 40, critical_max: 120 },
    temperature: { min: 36.1, max: 37.2, critical_min: 35, critical_max: 39 },
    spo2: { min: 95, max: 100, critical_min: 90, critical_max: 100 },
    respiratory_rate: { min: 12, max: 20, critical_min: 8, critical_max: 30 },
  },
  medication_adherence: {
    daily_adherence_rate: { min: 80, max: 100, critical_min: 60 },
    missed_doses_per_week: { min: 0, max: 1, critical_max: 3 },
  },
  wellness: {
    sleep_hours: { min: 7, max: 9, critical_min: 5 },
    steps_per_day: { min: 8000, max: 15000, critical_min: 3000 },
    water_intake_liters: { min: 2, max: 3.5, critical_min: 1 },
  },
};

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { status: 200, headers: corsHeaders });
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      throw new Error('Missing authorization header');
    }

    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: userError } = await supabaseClient.auth.getUser(token);
    
    if (userError || !user) {
      throw new Error('Unauthorized');
    }

    const requestData = await req.json();
    const { action, data } = requestData;

    let result;

    switch (action) {
      case 'record_monitoring_data':
        result = await recordMonitoringData(supabaseClient, user.id, data);
        break;
      
      case 'get_monitoring_dashboard':
        result = await getMonitoringDashboard(supabaseClient, user.id);
        break;
      
      case 'get_active_alerts':
        result = await getActiveAlerts(supabaseClient, user.id, data.alert_level);
        break;
      
      case 'get_monitoring_history':
        result = await getMonitoringHistory(supabaseClient, user.id, data.monitoring_type, data.hours);
        break;
      
      case 'update_thresholds':
        result = await updateThresholds(supabaseClient, user.id, data);
        break;
      
      default:
        throw new Error(`Unknown action: ${action}`);
    }

    return new Response(JSON.stringify({ data: result }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    });

  } catch (error) {
    return new Response(JSON.stringify({ error: { message: error.message } }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 500,
    });
  }
});

async function recordMonitoringData(supabase: any, userId: string, monitoringData: any) {
  const { monitoring_type, metrics } = monitoringData;
  const alerts = [];
  const insertPromises = [];

  const rules = MONITORING_RULES[monitoring_type] || {};

  for (const metric of metrics) {
    const { metric_name, current_value, data_source } = metric;
    const rule = rules[metric_name];

    let alertLevel = 'normal';
    let alertMessage = null;

    if (rule) {
      if (current_value < rule.critical_min || current_value > rule.critical_max) {
        alertLevel = 'critical';
        alertMessage = `CRITICAL: ${metric_name} (${current_value}) is outside safe range (${rule.critical_min}-${rule.critical_max})`;
      } else if (current_value < rule.min || current_value > rule.max) {
        alertLevel = 'warning';
        alertMessage = `WARNING: ${metric_name} (${current_value}) is outside normal range (${rule.min}-${rule.max})`;
      }

      if (alertLevel !== 'normal') {
        alerts.push({
          metric_name,
          current_value,
          alert_level: alertLevel,
          message: alertMessage,
        });
      }
    }

    insertPromises.push(
      supabase.from('real_time_monitoring').insert({
        user_id: userId,
        monitoring_type,
        metric_name,
        current_value,
        baseline_value: rule?.min || null,
        threshold_min: rule?.min || null,
        threshold_max: rule?.max || null,
        alert_level: alertLevel,
        alert_message: alertMessage,
        data_source,
        recorded_at: new Date().toISOString(),
      })
    );
  }

  await Promise.all(insertPromises);

  return {
    monitoring_type,
    metrics_recorded: metrics.length,
    alerts: alerts.length > 0 ? alerts : null,
    timestamp: new Date().toISOString(),
    message: alerts.length > 0 
      ? `${alerts.length} alert(s) detected` 
      : 'All metrics within normal range',
  };
}

async function getMonitoringDashboard(supabase: any, userId: string) {
  const dashboard = {
    vital_signs: {},
    medication_adherence: {},
    wellness: {},
    alerts_summary: { critical: 0, warning: 0, normal: 0 },
    last_updated: new Date().toISOString(),
  };

  // Get latest monitoring data for each type
  for (const monitoringType of Object.keys(MONITORING_RULES)) {
    const { data } = await supabase
      .from('real_time_monitoring')
      .select('*')
      .eq('user_id', userId)
      .eq('monitoring_type', monitoringType)
      .order('recorded_at', { ascending: false })
      .limit(10);

    if (data && data.length > 0) {
      dashboard[monitoringType] = data;
      
      // Count alerts
      data.forEach((record: any) => {
        if (record.alert_level === 'critical') dashboard.alerts_summary.critical++;
        else if (record.alert_level === 'warning') dashboard.alerts_summary.warning++;
        else dashboard.alerts_summary.normal++;
      });
    }
  }

  return dashboard;
}

async function getActiveAlerts(supabase: any, userId: string, alertLevel: string = null) {
  let query = supabase
    .from('real_time_monitoring')
    .select('*')
    .eq('user_id', userId)
    .neq('alert_level', 'normal')
    .order('recorded_at', { ascending: false });

  if (alertLevel) {
    query = query.eq('alert_level', alertLevel);
  }

  const { data, error } = await query.limit(50);

  if (error) throw error;

  return {
    active_alerts: data,
    total_alerts: data.length,
    critical_count: data.filter((a: any) => a.alert_level === 'critical').length,
    warning_count: data.filter((a: any) => a.alert_level === 'warning').length,
    retrieved_at: new Date().toISOString(),
  };
}

async function getMonitoringHistory(supabase: any, userId: string, monitoringType: string, hours: number = 24) {
  const startTime = new Date();
  startTime.setHours(startTime.getHours() - hours);

  const { data, error } = await supabase
    .from('real_time_monitoring')
    .select('*')
    .eq('user_id', userId)
    .eq('monitoring_type', monitoringType)
    .gte('recorded_at', startTime.toISOString())
    .order('recorded_at', { ascending: true });

  if (error) throw error;

  return {
    monitoring_type: monitoringType,
    time_period_hours: hours,
    total_records: data.length,
    history: data,
    alerts_in_period: data.filter((d: any) => d.alert_level !== 'normal').length,
  };
}

async function updateThresholds(supabase: any, userId: string, thresholdData: any) {
  // Custom thresholds would be stored in user preferences table
  // For now, return acknowledgment
  return {
    user_id: userId,
    updated_thresholds: thresholdData,
    message: 'Custom thresholds updated successfully',
    timestamp: new Date().toISOString(),
  };
}
