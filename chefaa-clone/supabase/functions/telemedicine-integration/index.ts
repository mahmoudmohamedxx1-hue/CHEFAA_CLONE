// Telemedicine Integration Edge Function
// Video conferencing, e-prescriptions, remote patient monitoring

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, GET, OPTIONS',
};

const TELEMEDICINE_PLATFORMS = {
  zoom_healthcare: { name: 'Zoom for Healthcare', hipaa_compliant: true },
  microsoft_teams: { name: 'Microsoft Teams for Healthcare', hipaa_compliant: true },
  teladoc: { name: 'Teladoc Health', hipaa_compliant: true },
  custom: { name: 'Custom Platform', hipaa_compliant: false },
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
      case 'schedule_session':
        result = await scheduleSession(supabaseClient, user.id, data);
        break;
      case 'start_session':
        result = await startSession(supabaseClient, user.id, data.session_id);
        break;
      case 'end_session':
        result = await endSession(supabaseClient, user.id, data.session_id, data.session_notes);
        break;
      case 'get_sessions':
        result = await getSessions(supabaseClient, user.id, data.status);
        break;
      case 'issue_prescription':
        result = await issuePrescription(supabaseClient, user.id, data);
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

async function scheduleSession(supabase: any, userId: string, sessionData: any) {
  const { session_type, platform, scheduled_at, provider_id } = sessionData;
  
  const platformConfig = TELEMEDICINE_PLATFORMS[platform];
  if (!platformConfig) throw new Error(`Unsupported platform: ${platform}`);

  const meetingId = `MTG-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  const meetingUrl = `https://${platform}.example.com/meeting/${meetingId}`;

  const { data: session, error } = await supabase
    .from('telemedicine_sessions')
    .insert({
      patient_id: userId,
      provider_id,
      session_type,
      platform,
      session_status: 'scheduled',
      scheduled_at,
      meeting_url: meetingUrl,
      meeting_id: meetingId,
      metadata: { platform_config: platformConfig },
    })
    .select()
    .single();

  if (error) throw error;

  return {
    session_id: session.id,
    session_type,
    platform: platformConfig.name,
    meeting_url: meetingUrl,
    meeting_id: meetingId,
    scheduled_at,
    hipaa_compliant: platformConfig.hipaa_compliant,
    message: `Telemedicine session scheduled successfully for ${scheduled_at}`,
  };
}

async function startSession(supabase: any, userId: string, sessionId: string) {
  const { data: session, error } = await supabase
    .from('telemedicine_sessions')
    .update({
      session_status: 'in_progress',
      started_at: new Date().toISOString(),
    })
    .eq('id', sessionId)
    .eq('patient_id', userId)
    .select()
    .single();

  if (error) throw error;

  return {
    session_id: sessionId,
    status: 'in_progress',
    meeting_url: session.meeting_url,
    started_at: session.started_at,
    message: 'Telemedicine session started',
  };
}

async function endSession(supabase: any, userId: string, sessionId: string, sessionNotes: any = {}) {
  const endTime = new Date().toISOString();
  
  const { data: session, error: fetchError } = await supabase
    .from('telemedicine_sessions')
    .select('started_at')
    .eq('id', sessionId)
    .single();

  if (fetchError) throw fetchError;

  const durationMinutes = session.started_at 
    ? Math.floor((new Date(endTime).getTime() - new Date(session.started_at).getTime()) / 60000)
    : 0;

  const { error } = await supabase
    .from('telemedicine_sessions')
    .update({
      session_status: 'completed',
      ended_at: endTime,
      duration_minutes: durationMinutes,
      session_notes: sessionNotes.notes || '',
      prescriptions_issued: sessionNotes.prescriptions || [],
      diagnostic_data: sessionNotes.diagnostics || {},
      follow_up_required: sessionNotes.follow_up_required || false,
      follow_up_date: sessionNotes.follow_up_date || null,
    })
    .eq('id', sessionId)
    .eq('patient_id', userId);

  if (error) throw error;

  return {
    session_id: sessionId,
    status: 'completed',
    duration_minutes: durationMinutes,
    prescriptions_issued: sessionNotes.prescriptions?.length || 0,
    follow_up_required: sessionNotes.follow_up_required || false,
    message: 'Telemedicine session completed successfully',
  };
}

async function getSessions(supabase: any, userId: string, status: string = null) {
  let query = supabase
    .from('telemedicine_sessions')
    .select('*')
    .eq('patient_id', userId)
    .order('scheduled_at', { ascending: false });

  if (status) {
    query = query.eq('session_status', status);
  }

  const { data: sessions, error } = await query.limit(50);
  if (error) throw error;

  return {
    sessions: sessions.map((s: any) => ({
      id: s.id,
      session_type: s.session_type,
      platform: s.platform,
      status: s.session_status,
      scheduled_at: s.scheduled_at,
      duration_minutes: s.duration_minutes,
      meeting_url: s.session_status === 'scheduled' || s.session_status === 'in_progress' ? s.meeting_url : null,
    })),
    total_sessions: sessions.length,
    filter_status: status,
  };
}

async function issuePrescription(supabase: any, userId: string, prescriptionData: any) {
  const { session_id, medications } = prescriptionData;

  const { data: session, error: sessionError } = await supabase
    .from('telemedicine_sessions')
    .select('prescriptions_issued')
    .eq('id', session_id)
    .eq('patient_id', userId)
    .single();

  if (sessionError) throw sessionError;

  const existingPrescriptions = session.prescriptions_issued || [];
  const updatedPrescriptions = [...existingPrescriptions, ...medications];

  const { error } = await supabase
    .from('telemedicine_sessions')
    .update({ prescriptions_issued: updatedPrescriptions })
    .eq('id', session_id);

  if (error) throw error;

  return {
    session_id,
    prescriptions_count: updatedPrescriptions.length,
    medications: medications,
    message: 'E-prescription issued successfully',
  };
}
