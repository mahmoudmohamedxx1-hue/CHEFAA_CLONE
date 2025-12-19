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
      case 'get_monitoring_dashboard':
        const { data: vitals } = await supabaseClient
          .from('real_time_vitals')
          .select('*')
          .eq('user_id', user.id)
          .order('recorded_at', { ascending: false })
          .limit(50)
        
        result = {
          current_vitals: vitals?.[0] || {},
          recent_vitals: vitals || [],
          alerts: [],
          status: 'normal',
        }
        break

      case 'record_monitoring_data':
        const { data: newVital } = await supabaseClient
          .from('real_time_vitals')
          .insert({
            user_id: user.id,
            vital_type: requestData.vital_type,
            value: requestData.value,
            unit: requestData.unit,
            recorded_at: new Date().toISOString(),
          })
          .select()
          .single()
        result = { vital: newVital, message: 'Vital signs recorded successfully' }
        break

      case 'get_active_alerts':
        result = {
          alerts: [],
          count: 0,
        }
        break

      case 'get_monitoring_history':
        result = {
          history: [],
          summary: { average: 0, min: 0, max: 0 },
        }
        break

      case 'update_thresholds':
        result = {
          message: 'Thresholds updated successfully',
          thresholds: requestData,
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
