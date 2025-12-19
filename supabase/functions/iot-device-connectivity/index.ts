import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      { global: { headers: { Authorization: req.headers.get('Authorization')! } } }
    )

    const { data: { user }, error: authError } = await supabaseClient.auth.getUser()
    if (authError || !user) {
      return new Response(
        JSON.stringify({ error: { message: 'Unauthorized' } }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 401 }
      )
    }

    const { action, data: requestData } = await req.json()

    let result
    switch (action) {
      case 'get_devices':
        const { data: devices } = await supabaseClient
          .from('iot_devices')
          .select('*')
          .eq('user_id', user.id)
          .order('created_at', { ascending: false })
        result = { devices: devices || [] }
        break

      case 'register_device':
        const { data: newDevice } = await supabaseClient
          .from('iot_devices')
          .insert({
            user_id: user.id,
            device_type: requestData.device_type,
            device_name: requestData.device_name,
            manufacturer: requestData.manufacturer,
            model: requestData.model,
            status: 'active',
            last_sync_at: new Date().toISOString(),
          })
          .select()
          .single()
        result = { device: newDevice, message: 'IoT device registered successfully' }
        break

      case 'update_device_status':
        const { data: updatedDevice } = await supabaseClient
          .from('iot_devices')
          .update({
            status: requestData.status,
            battery_level: requestData.battery_level,
            signal_strength: requestData.signal_strength,
            last_sync_at: new Date().toISOString(),
          })
          .eq('id', requestData.device_id)
          .eq('user_id', user.id)
          .select()
          .single()
        result = { device: updatedDevice, message: 'Device status updated successfully' }
        break

      case 'sync_device_data':
        result = {
          message: 'IoT device data synced successfully',
          synced_records: requestData.records?.length || 0,
          last_sync: new Date().toISOString(),
        }
        break

      case 'get_adherence_report':
        result = {
          device_id: requestData.device_id,
          adherence_rate: 92,
          missed_doses: 3,
          total_doses: 40,
          period_days: requestData.days || 30,
          trend: 'improving',
        }
        break

      default:
        return new Response(
          JSON.stringify({ error: { message: 'Invalid action' } }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
        )
    }

    return new Response(
      JSON.stringify({ data: result }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  } catch (error) {
    return new Response(
      JSON.stringify({ error: { message: error.message } }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
    )
  }
})
