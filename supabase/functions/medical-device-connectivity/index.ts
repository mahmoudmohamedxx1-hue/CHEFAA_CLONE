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
      case 'get_latest_readings':
        const { data: readings } = await supabaseClient
          .from('device_integrations')
          .select('*')
          .eq('user_id', user.id)
          .order('created_at', { ascending: false })
          .limit(10)
        result = { latest_readings: readings || [] }
        break

      case 'sync_device_data':
        const { data: newReading } = await supabaseClient
          .from('device_integrations')
          .insert({
            user_id: user.id,
            device_type: requestData.device_type,
            device_id: requestData.device_id || `DEVICE-${Date.now()}`,
            reading_type: requestData.reading_type,
            reading_value: requestData.reading_value,
            unit: requestData.unit,
            recorded_at: new Date().toISOString(),
          })
          .select()
          .single()
        result = { reading: newReading, message: 'Device data synced successfully' }
        break

      case 'get_device_readings':
        result = {
          readings: [
            { type: 'Blood Glucose', value: 95, unit: 'mg/dL', timestamp: new Date().toISOString() },
            { type: 'Blood Glucose', value: 102, unit: 'mg/dL', timestamp: new Date(Date.now() - 3600000).toISOString() },
          ],
          trend: 'stable',
        }
        break

      case 'analyze_trends':
        result = {
          trend: 'improving',
          average: 98,
          min: 85,
          max: 110,
          data_points: 45,
        }
        break

      case 'check_thresholds':
        result = {
          alerts: [],
          all_within_range: true,
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
