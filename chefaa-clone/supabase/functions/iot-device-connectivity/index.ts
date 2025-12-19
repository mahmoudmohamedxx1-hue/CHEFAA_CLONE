// IoT Device Connectivity Edge Function
// Smart medication dispensers, inhalers, insulin pumps, pill bottles

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, GET, OPTIONS',
};

const IOT_DEVICE_CATEGORIES = {
  medication_dispenser: {
    brands: ['PillPack', 'Hero Health', 'MedMinder'],
    features: ['automated_dispensing', 'adherence_tracking', 'refill_alerts'],
  },
  smart_inhaler: {
    brands: ['Propeller Health', 'AsthmaMD', 'Hailie'],
    features: ['usage_tracking', 'technique_feedback', 'environment_monitoring'],
  },
  insulin_pump: {
    brands: ['Medtronic 780G', 'Tandem t:slim X2', 'Omnipod DASH'],
    features: ['continuous_glucose_monitoring', 'automated_dosing', 'carb_counting'],
  },
  smart_pill_bottle: {
    brands: ['AdhereTech', 'Pillsy', 'TimerCap'],
    features: ['dose_reminders', 'adherence_tracking', 'family_notifications'],
  },
  environmental_monitor: {
    brands: ['Awair', 'Foobot', 'PurpleAir'],
    features: ['air_quality', 'allergen_detection', 'temperature_humidity'],
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
    if (!authHeader) throw new Error('Missing authorization header');

    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: userError } = await supabaseClient.auth.getUser(token);
    if (userError || !user) throw new Error('Unauthorized');

    const requestData = await req.json();
    const { action, data } = requestData;

    let result;

    switch (action) {
      case 'register_device':
        result = await registerDevice(supabaseClient, user.id, data);
        break;
      case 'update_device_status':
        result = await updateDeviceStatus(supabaseClient, user.id, data);
        break;
      case 'sync_device_data':
        result = await syncDeviceData(supabaseClient, user.id, data);
        break;
      case 'get_devices':
        result = await getDevices(supabaseClient, user.id);
        break;
      case 'get_adherence_report':
        result = await getAdherenceReport(supabaseClient, user.id, data.device_id, data.days);
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

async function registerDevice(supabase: any, userId: string, deviceData: any) {
  const { device_category, device_name, device_brand, device_model, device_serial, connection_type } = deviceData;
  
  const category = IOT_DEVICE_CATEGORIES[device_category];
  if (!category) throw new Error(`Unsupported device category: ${device_category}`);

  const { data: device, error } = await supabase
    .from('iot_devices')
    .insert({
      user_id: userId,
      device_category,
      device_name,
      device_brand,
      device_model,
      device_serial,
      connection_type,
      connection_status: 'active',
      firmware_version: deviceData.firmware_version || '1.0.0',
      battery_level: deviceData.battery_level || 100,
      last_data_sync: new Date().toISOString(),
      device_settings: deviceData.settings || {},
      alert_config: deviceData.alert_config || {},
    })
    .select()
    .single();

  if (error) throw error;

  return {
    device_id: device.id,
    device_name,
    device_category,
    brand: device_brand,
    features: category.features,
    connection_status: 'active',
    message: `${device_name} successfully registered`,
  };
}

async function updateDeviceStatus(supabase: any, userId: string, statusData: any) {
  const { device_id, connection_status, battery_level, firmware_version } = statusData;

  const updateData: any = {
    updated_at: new Date().toISOString(),
  };

  if (connection_status) updateData.connection_status = connection_status;
  if (battery_level !== undefined) updateData.battery_level = battery_level;
  if (firmware_version) updateData.firmware_version = firmware_version;

  const { error } = await supabase
    .from('iot_devices')
    .update(updateData)
    .eq('id', device_id)
    .eq('user_id', userId);

  if (error) throw error;

  return {
    device_id,
    status_updated: true,
    updates: updateData,
    timestamp: new Date().toISOString(),
  };
}

async function syncDeviceData(supabase: any, userId: string, syncData: any) {
  const { device_id, adherence_data, medication_schedule, environmental_data } = syncData;

  const updateData: any = {
    last_data_sync: new Date().toISOString(),
  };

  if (adherence_data) updateData.adherence_data = adherence_data;
  if (medication_schedule) updateData.medication_schedule = medication_schedule;
  if (environmental_data) updateData.environmental_data = environmental_data;

  const { data: device, error } = await supabase
    .from('iot_devices')
    .update(updateData)
    .eq('id', device_id)
    .eq('user_id', userId)
    .select()
    .single();

  if (error) throw error;

  return {
    device_id,
    device_name: device.device_name,
    data_synced: true,
    sync_timestamp: new Date().toISOString(),
    adherence_rate: adherence_data?.adherence_rate || null,
    message: 'Device data synchronized successfully',
  };
}

async function getDevices(supabase: any, userId: string) {
  const { data: devices, error } = await supabase
    .from('iot_devices')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false });

  if (error) throw error;

  return {
    devices: devices.map((d: any) => ({
      id: d.id,
      name: d.device_name,
      category: d.device_category,
      brand: d.device_brand,
      model: d.device_model,
      status: d.connection_status,
      battery_level: d.battery_level,
      last_sync: d.last_data_sync,
    })),
    total_devices: devices.length,
    active_devices: devices.filter((d: any) => d.connection_status === 'active').length,
  };
}

async function getAdherenceReport(supabase: any, userId: string, deviceId: string, days: number = 30) {
  const { data: device, error } = await supabase
    .from('iot_devices')
    .select('*')
    .eq('id', deviceId)
    .eq('user_id', userId)
    .single();

  if (error) throw error;

  const adherenceData = device.adherence_data || {};
  const medicationSchedule = device.medication_schedule || {};

  // Calculate adherence statistics
  const totalDoses = adherenceData.total_doses || 0;
  const takenDoses = adherenceData.taken_doses || 0;
  const missedDoses = adherenceData.missed_doses || 0;
  const adherenceRate = totalDoses > 0 ? (takenDoses / totalDoses) * 100 : 0;

  return {
    device_id: deviceId,
    device_name: device.device_name,
    period_days: days,
    adherence_statistics: {
      total_doses: totalDoses,
      taken_doses: takenDoses,
      missed_doses: missedDoses,
      adherence_rate: parseFloat(adherenceRate.toFixed(2)),
    },
    medication_schedule: medicationSchedule,
    last_sync: device.last_data_sync,
    battery_level: device.battery_level,
    recommendations: adherenceRate < 80 
      ? ['Consider setting up additional reminders', 'Sync device more frequently', 'Contact healthcare provider if issues persist']
      : ['Great adherence! Keep up the good work'],
  };
}
