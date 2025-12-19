// Medical Device Connectivity Edge Function
// Supports: CGM, Blood Pressure, Pulse Oximeter, ECG, Smart Scale, Sleep Tracker, Thermometer

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, GET, OPTIONS',
};

// Device Type Configurations
const DEVICE_TYPES = {
  cgm: {
    brands: ['Dexcom G6', 'FreeStyle Libre 2', 'Guardian Connect'],
    measurements: ['glucose'],
    units: { glucose: 'mg/dL' },
    normal_ranges: { glucose: { min: 70, max: 180 } },
  },
  blood_pressure: {
    brands: ['Omron Evolv', 'Withings BPM Core', 'Qardio Arm'],
    measurements: ['bp_systolic', 'bp_diastolic', 'heart_rate'],
    units: { bp_systolic: 'mmHg', bp_diastolic: 'mmHg', heart_rate: 'bpm' },
    normal_ranges: { bp_systolic: { min: 90, max: 120 }, bp_diastolic: { min: 60, max: 80 }, heart_rate: { min: 60, max: 100 } },
  },
  pulse_oximeter: {
    brands: ['Nonin 3150', 'Masimo MightySat', 'Wellue O2Ring'],
    measurements: ['spo2', 'heart_rate', 'perfusion_index'],
    units: { spo2: '%', heart_rate: 'bpm', perfusion_index: '%' },
    normal_ranges: { spo2: { min: 95, max: 100 }, heart_rate: { min: 60, max: 100 } },
  },
  ecg: {
    brands: ['AliveCor KardiaMobile 6L', 'Apple Watch Series 7+', 'Withings ScanWatch'],
    measurements: ['ecg_reading', 'heart_rate', 'qrs_duration'],
    units: { heart_rate: 'bpm', qrs_duration: 'ms' },
    normal_ranges: { heart_rate: { min: 60, max: 100 } },
  },
  smart_scale: {
    brands: ['Fitbit Aria Air', 'Garmin Index S2', 'Xiaomi Mi Body Composition Scale 2'],
    measurements: ['weight', 'bmi', 'body_fat_percentage', 'muscle_mass'],
    units: { weight: 'kg', bmi: 'kg/m²', body_fat_percentage: '%', muscle_mass: 'kg' },
    normal_ranges: { bmi: { min: 18.5, max: 24.9 } },
  },
  sleep_tracker: {
    brands: ['Apple Watch', 'Fitbit Sense 2', 'Oura Ring Gen 3'],
    measurements: ['sleep_duration', 'rem_sleep', 'deep_sleep', 'sleep_quality_score'],
    units: { sleep_duration: 'hours', rem_sleep: 'hours', deep_sleep: 'hours', sleep_quality_score: 'score' },
    normal_ranges: { sleep_duration: { min: 7, max: 9 } },
  },
  thermometer: {
    brands: ['ThermoSmart', 'Kinsa QuickCare', 'Withings Thermo'],
    measurements: ['temperature'],
    units: { temperature: '°C' },
    normal_ranges: { temperature: { min: 36.1, max: 37.2 } },
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
      case 'sync_device_data':
        result = await syncDeviceData(supabaseClient, user.id, data);
        break;
      
      case 'get_device_readings':
        result = await getDeviceReadings(supabaseClient, user.id, data.device_type, data.date_range);
        break;
      
      case 'analyze_trends':
        result = await analyzeTrends(supabaseClient, user.id, data.device_type, data.measurement_type, data.days);
        break;
      
      case 'get_latest_readings':
        result = await getLatestReadings(supabaseClient, user.id);
        break;
      
      case 'check_thresholds':
        result = await checkThresholds(supabaseClient, user.id, data.readings);
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

async function syncDeviceData(supabase: any, userId: string, deviceData: any) {
  const { device_type, readings } = deviceData;
  
  if (!DEVICE_TYPES[device_type]) {
    throw new Error(`Unsupported device type: ${device_type}`);
  }

  const config = DEVICE_TYPES[device_type];
  const insertPromises = [];
  const alerts = [];

  for (const reading of readings) {
    const { measurement_type, value, measured_at, device_id, device_brand } = reading;

    // Check if measurement is in normal range
    const normalRange = config.normal_ranges[measurement_type];
    let alertLevel = 'normal';
    let alertMessage = null;

    if (normalRange && (value < normalRange.min || value > normalRange.max)) {
      alertLevel = value < normalRange.min * 0.7 || value > normalRange.max * 1.3 ? 'critical' : 'warning';
      alertMessage = `${measurement_type} ${value} ${config.units[measurement_type]} is ${value < normalRange.min ? 'below' : 'above'} normal range (${normalRange.min}-${normalRange.max})`;
      
      alerts.push({
        measurement_type,
        value,
        alert_level: alertLevel,
        message: alertMessage,
      });
    }

    insertPromises.push(
      supabase.from('medical_device_data').insert({
        user_id: userId,
        device_type,
        device_brand: device_brand || config.brands[0],
        measurement_type,
        value,
        unit: config.units[measurement_type],
        measured_at: measured_at || new Date().toISOString(),
        device_id,
        flags: alertLevel !== 'normal' ? { alert_level: alertLevel, alert_message: alertMessage } : null,
        sync_status: 'synced',
      })
    );
  }

  await Promise.all(insertPromises);

  return {
    device_type,
    readings_synced: readings.length,
    alerts: alerts.length > 0 ? alerts : null,
    sync_timestamp: new Date().toISOString(),
    message: `Successfully synced ${readings.length} readings from ${device_type}`,
  };
}

async function getDeviceReadings(supabase: any, userId: string, deviceType: string, dateRange: any = {}) {
  let query = supabase
    .from('medical_device_data')
    .select('*')
    .eq('user_id', userId);

  if (deviceType) {
    query = query.eq('device_type', deviceType);
  }

  if (dateRange.start) {
    query = query.gte('measured_at', dateRange.start);
  }

  if (dateRange.end) {
    query = query.lte('measured_at', dateRange.end);
  }

  const { data, error } = await query.order('measured_at', { ascending: false }).limit(100);

  if (error) throw error;

  return {
    device_type: deviceType,
    total_readings: data.length,
    readings: data,
    date_range: dateRange,
  };
}

async function analyzeTrends(supabase: any, userId: string, deviceType: string, measurementType: string, days: number = 30) {
  const startDate = new Date();
  startDate.setDate(startDate.getDate() - days);

  const { data, error } = await supabase
    .from('medical_device_data')
    .select('value, measured_at')
    .eq('user_id', userId)
    .eq('device_type', deviceType)
    .eq('measurement_type', measurementType)
    .gte('measured_at', startDate.toISOString())
    .order('measured_at', { ascending: true });

  if (error) throw error;

  if (data.length === 0) {
    return {
      message: 'No data available for trend analysis',
      device_type: deviceType,
      measurement_type: measurementType,
    };
  }

  const values = data.map((d) => parseFloat(d.value));
  const average = values.reduce((a, b) => a + b, 0) / values.length;
  const min = Math.min(...values);
  const max = Math.max(...values);
  
  // Calculate trend (simple linear regression slope)
  const n = values.length;
  const sumX = (n * (n + 1)) / 2;
  const sumY = values.reduce((a, b) => a + b, 0);
  const sumXY = values.reduce((sum, val, idx) => sum + val * (idx + 1), 0);
  const sumX2 = (n * (n + 1) * (2 * n + 1)) / 6;
  const slope = (n * sumXY - sumX * sumY) / (n * sumX2 - sumX * sumX);
  
  const trend = slope > 0.01 ? 'increasing' : slope < -0.01 ? 'decreasing' : 'stable';

  return {
    device_type: deviceType,
    measurement_type: measurementType,
    period_days: days,
    data_points: data.length,
    statistics: {
      average: parseFloat(average.toFixed(2)),
      minimum: min,
      maximum: max,
      range: max - min,
      trend: trend,
      slope: parseFloat(slope.toFixed(4)),
    },
    latest_value: values[values.length - 1],
    time_series: data.slice(-20), // Last 20 points for visualization
  };
}

async function getLatestReadings(supabase: any, userId: string) {
  const readings = {};

  for (const deviceType of Object.keys(DEVICE_TYPES)) {
    const { data } = await supabase
      .from('medical_device_data')
      .select('*')
      .eq('user_id', userId)
      .eq('device_type', deviceType)
      .order('measured_at', { ascending: false })
      .limit(1);

    if (data && data.length > 0) {
      readings[deviceType] = data[0];
    }
  }

  return {
    latest_readings: readings,
    device_types: Object.keys(readings),
    total_devices: Object.keys(readings).length,
    retrieved_at: new Date().toISOString(),
  };
}

async function checkThresholds(supabase: any, userId: string, readings: any[]) {
  const alerts = [];

  for (const reading of readings) {
    const { device_type, measurement_type, value } = reading;
    const config = DEVICE_TYPES[device_type];
    
    if (!config) continue;

    const normalRange = config.normal_ranges[measurement_type];
    if (!normalRange) continue;

    if (value < normalRange.min || value > normalRange.max) {
      const alertLevel = value < normalRange.min * 0.7 || value > normalRange.max * 1.3 ? 'critical' : 'warning';
      
      alerts.push({
        device_type,
        measurement_type,
        value,
        unit: config.units[measurement_type],
        normal_range: normalRange,
        alert_level: alertLevel,
        message: `${measurement_type} is ${value < normalRange.min ? 'below' : 'above'} normal range`,
        recommendation: alertLevel === 'critical' ? 'Seek immediate medical attention' : 'Monitor closely and consult healthcare provider if persists',
      });
    }
  }

  return {
    total_readings_checked: readings.length,
    alerts_triggered: alerts.length,
    alerts: alerts,
    timestamp: new Date().toISOString(),
  };
}
