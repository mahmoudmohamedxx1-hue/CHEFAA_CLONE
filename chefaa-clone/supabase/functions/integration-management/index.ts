import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, GET, OPTIONS, PUT, DELETE',
  'Access-Control-Max-Age': '86400',
};

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { status: 200, headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Get authenticated user
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(JSON.stringify({ error: 'No authorization header' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const { data: { user }, error: authError } = await supabase.auth.getUser(
      authHeader.replace('Bearer ', '')
    );

    if (authError || !user) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const { action, serviceId, serviceType, providerId, consentData, filters } = await req.json();

    // Action routing
    switch (action) {
      case 'list_available_services':
        return await listAvailableServices(supabase);
      
      case 'list_user_connections':
        return await listUserConnections(supabase, user.id);
      
      case 'connect_service':
        return await connectService(supabase, user.id, serviceId, consentData);
      
      case 'disconnect_service':
        return await disconnectService(supabase, user.id, serviceId);
      
      case 'sync_service':
        return await syncService(supabase, user.id, serviceId);
      
      case 'get_integration_status':
        return await getIntegrationStatus(supabase, user.id);
      
      case 'get_consent_records':
        return await getConsentRecords(supabase, user.id);
      
      case 'get_audit_logs':
        return await getAuditLogs(supabase, user.id, filters);
      
      default:
        return new Response(JSON.stringify({ error: 'Invalid action' }), {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
    }
  } catch (error) {
    console.error('Integration management error:', error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});

async function listAvailableServices(supabase: any) {
  const { data, error } = await supabase
    .from('integration_services')
    .select('*')
    .eq('status', 'active')
    .order('service_type', { ascending: true });

  if (error) throw error;

  return new Response(
    JSON.stringify({
      success: true,
      services: data,
      total: data.length,
    }),
    { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
  );
}

async function listUserConnections(supabase: any, userId: string) {
  const { data, error } = await supabase
    .from('user_integration_connections')
    .select(`
      *,
      integration_services (
        service_type,
        service_name,
        provider_name,
        capabilities
      )
    `)
    .eq('user_id', userId)
    .order('created_at', { ascending: false });

  if (error) throw error;

  return new Response(
    JSON.stringify({
      success: true,
      connections: data,
      total: data.length,
    }),
    { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
  );
}

async function connectService(supabase: any, userId: string, serviceId: string, consentData: any) {
  // Check if service exists and is active
  const { data: service, error: serviceError } = await supabase
    .from('integration_services')
    .select('*')
    .eq('id', serviceId)
    .eq('status', 'active')
    .single();

  if (serviceError || !service) {
    throw new Error('Service not found or not active');
  }

  // Create or update connection
  const connectionData = {
    user_id: userId,
    service_id: serviceId,
    connection_status: 'pending',
    consent_given: consentData?.consent_given || false,
    consent_timestamp: consentData?.consent_given ? new Date().toISOString() : null,
    sync_frequency: consentData?.sync_frequency || 'hourly',
    updated_at: new Date().toISOString(),
  };

  const { data, error } = await supabase
    .from('user_integration_connections')
    .upsert(connectionData, { onConflict: 'user_id,service_id' })
    .select()
    .single();

  if (error) throw error;

  // Log audit trail
  await supabase.from('integration_audit_log').insert({
    user_id: userId,
    service_id: serviceId,
    action_type: 'connection_created',
    action_details: { consent_data: consentData },
    status: 'success',
  });

  return new Response(
    JSON.stringify({
      success: true,
      connection: data,
      message: `Connected to ${service.service_name}`,
    }),
    { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
  );
}

async function disconnectService(supabase: any, userId: string, serviceId: string) {
  // Update connection status to revoked
  const { data, error } = await supabase
    .from('user_integration_connections')
    .update({
      connection_status: 'revoked',
      consent_given: false,
      updated_at: new Date().toISOString(),
    })
    .eq('user_id', userId)
    .eq('service_id', serviceId)
    .select()
    .single();

  if (error) throw error;

  // Log audit trail
  await supabase.from('integration_audit_log').insert({
    user_id: userId,
    service_id: serviceId,
    action_type: 'connection_revoked',
    status: 'success',
  });

  return new Response(
    JSON.stringify({
      success: true,
      connection: data,
      message: 'Service disconnected successfully',
    }),
    { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
  );
}

async function syncService(supabase: any, userId: string, serviceId: string) {
  // Trigger manual sync
  const { data, error } = await supabase
    .from('user_integration_connections')
    .update({
      last_sync_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    })
    .eq('user_id', userId)
    .eq('service_id', serviceId)
    .select()
    .single();

  if (error) throw error;

  // Log audit trail
  await supabase.from('integration_audit_log').insert({
    user_id: userId,
    service_id: serviceId,
    action_type: 'manual_sync',
    status: 'success',
  });

  return new Response(
    JSON.stringify({
      success: true,
      connection: data,
      message: 'Sync initiated successfully',
    }),
    { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
  );
}

async function getIntegrationStatus(supabase: any, userId: string) {
  // Get overall integration status
  const { data: connections, error: connError } = await supabase
    .from('user_integration_connections')
    .select('service_id, connection_status, last_sync_at')
    .eq('user_id', userId);

  if (connError) throw connError;

  const { data: auditLogs, error: auditError } = await supabase
    .from('integration_audit_log')
    .select('action_type, status, created_at')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
    .limit(10);

  if (auditError) throw auditError;

  const statusSummary = {
    total_connections: connections.length,
    active_connections: connections.filter((c: any) => c.connection_status === 'active').length,
    pending_connections: connections.filter((c: any) => c.connection_status === 'pending').length,
    recent_syncs: connections.filter((c: any) => {
      if (!c.last_sync_at) return false;
      const hourAgo = new Date(Date.now() - 3600000);
      return new Date(c.last_sync_at) > hourAgo;
    }).length,
    recent_activity: auditLogs,
  };

  return new Response(
    JSON.stringify({
      success: true,
      status: statusSummary,
    }),
    { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
  );
}

async function getConsentRecords(supabase: any, userId: string) {
  // Get all user connections with consent information
  const { data, error } = await supabase
    .from('user_integration_connections')
    .select(`
      id,
      user_id,
      service_id,
      connection_status,
      consent_given,
      consent_timestamp,
      updated_at,
      created_at,
      integration_services (
        service_name,
        service_type,
        provider_name
      )
    `)
    .eq('user_id', userId)
    .order('created_at', { ascending: false });

  if (error) throw error;

  // Transform data to match consent record format
  const consentRecords = data.map((conn: any) => ({
    id: conn.id,
    user_id: conn.user_id,
    service_id: conn.service_id,
    service_name: conn.integration_services?.service_name,
    consent_type: conn.integration_services?.service_type,
    granted: conn.consent_given,
    granted_at: conn.consent_timestamp,
    revoked_at: conn.connection_status === 'revoked' ? conn.updated_at : null,
    expiration_date: null, // Can be added to schema if needed
  }));

  return new Response(
    JSON.stringify({
      success: true,
      consents: consentRecords,
      total: consentRecords.length,
    }),
    { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
  );
}

async function getAuditLogs(supabase: any, userId: string, filters: any = {}) {
  // Build query with filters
  let query = supabase
    .from('integration_audit_log')
    .select(`
      id,
      user_id,
      service_id,
      action_type,
      action_details,
      status,
      error_message,
      ip_address,
      user_agent,
      created_at,
      integration_services (
        service_name
      )
    `)
    .eq('user_id', userId);

  // Apply filters
  if (filters.status && filters.status !== 'all') {
    query = query.eq('status', filters.status);
  }

  if (filters.serviceId) {
    query = query.eq('service_id', filters.serviceId);
  }

  if (filters.dateRange && filters.dateRange !== 'all') {
    const ranges: Record<string, number> = {
      '24h': 24 * 60 * 60 * 1000,
      '7d': 7 * 24 * 60 * 60 * 1000,
      '30d': 30 * 24 * 60 * 60 * 1000,
    };
    
    if (ranges[filters.dateRange]) {
      const startDate = new Date(Date.now() - ranges[filters.dateRange]).toISOString();
      query = query.gte('created_at', startDate);
    }
  }

  // Order and limit
  query = query.order('created_at', { ascending: false }).limit(100);

  const { data, error } = await query;

  if (error) throw error;

  // Transform data to match audit log format
  const auditLogs = data.map((log: any) => ({
    id: log.id,
    user_id: log.user_id,
    service_id: log.service_id,
    service_name: log.integration_services?.service_name,
    action: log.action_type,
    ip_address: log.ip_address,
    user_agent: log.user_agent,
    status: log.status,
    metadata: log.action_details || {},
    created_at: log.created_at,
  }));

  return new Response(
    JSON.stringify({
      success: true,
      logs: auditLogs,
      total: auditLogs.length,
    }),
    { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
  );
}
