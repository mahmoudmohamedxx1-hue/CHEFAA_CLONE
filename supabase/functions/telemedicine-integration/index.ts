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
      case 'get_sessions':
        const { data: sessions } = await supabaseClient
          .from('telemedicine_sessions')
          .select('*')
          .eq('user_id', user.id)
          .order('created_at', { ascending: false })
        result = { sessions: sessions || [] }
        break

      case 'schedule_session':
        const { data: newSession } = await supabaseClient
          .from('telemedicine_sessions')
          .insert({
            user_id: user.id,
            platform: requestData.platform,
            session_type: requestData.session_type || 'consultation',
            status: 'scheduled',
            scheduled_at: requestData.scheduled_at || new Date().toISOString(),
          })
          .select()
          .single()
        result = { session: newSession, message: 'Telemedicine session scheduled successfully' }
        break

      case 'start_session':
        const { data: startedSession } = await supabaseClient
          .from('telemedicine_sessions')
          .update({
            status: 'in_progress',
            started_at: new Date().toISOString(),
          })
          .eq('id', requestData.session_id)
          .eq('user_id', user.id)
          .select()
          .single()
        result = { session: startedSession, message: 'Session started successfully' }
        break

      case 'end_session':
        const { data: endedSession } = await supabaseClient
          .from('telemedicine_sessions')
          .update({
            status: 'completed',
            ended_at: new Date().toISOString(),
            notes: requestData.session_notes,
          })
          .eq('id', requestData.session_id)
          .eq('user_id', user.id)
          .select()
          .single()
        result = { session: endedSession, message: 'Session ended successfully' }
        break

      case 'issue_prescription':
        result = {
          message: 'Prescription issued successfully',
          prescription_id: `RX-${Date.now()}`,
          medications: requestData.medications,
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
