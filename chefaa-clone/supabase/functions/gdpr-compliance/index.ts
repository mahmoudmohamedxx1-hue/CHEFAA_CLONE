// GDPR Compliance & Data Governance
// Handles Data Subject Access Requests (DSAR) and Right to Erasure

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, GET, OPTIONS, DELETE',
};

interface GDPRRequest {
  action: 'access_request' | 'erasure_request' | 'data_portability' | 'consent_management' | 'process_dsar' | 'export_data';
  consentType?: string;
  granted?: boolean;
}

// Tables containing user data that should be included in DSAR
const USER_DATA_TABLES = [
  'profiles',
  'orders',
  'prescriptions',
  'customer_medications',
  'customer_allergies',
  'medical_records',
  'notifications',
  'loyalty_points',
  'wishlists',
  'product_reviews',
  'user_sessions',
  'audit_logs',
  'consent_records',
];

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { status: 200, headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Get user from auth header
    const authHeader = req.headers.get('authorization');
    if (!authHeader) {
      throw new Error('No authorization header');
    }

    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);
    
    if (authError || !user) {
      throw new Error('Unauthorized');
    }

    const body: GDPRRequest = await req.json();
    const { action, consentType, granted } = body;

    switch (action) {
      case 'access_request': {
        // Create Data Subject Access Request
        const { data: dsar, error } = await supabase
          .from('data_subject_requests')
          .insert({
            user_id: user.id,
            request_type: 'access',
            status: 'pending',
            request_data: {
              requested_at: new Date().toISOString(),
              ip_address: req.headers.get('x-forwarded-for'),
            },
          })
          .select()
          .single();

        if (error) throw error;

        return new Response(
          JSON.stringify({
            success: true,
            request_id: dsar.id,
            message: 'Data access request submitted. You will receive your data within 30 days as per GDPR requirements.',
            estimated_completion: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
          }),
          { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      case 'erasure_request': {
        // Create Right to Erasure Request
        const { data: dsar, error } = await supabase
          .from('data_subject_requests')
          .insert({
            user_id: user.id,
            request_type: 'erasure',
            status: 'pending',
            request_data: {
              requested_at: new Date().toISOString(),
              ip_address: req.headers.get('x-forwarded-for'),
              warning_acknowledged: true,
            },
          })
          .select()
          .single();

        if (error) throw error;

        return new Response(
          JSON.stringify({
            success: true,
            request_id: dsar.id,
            message: 'Data erasure request submitted. Your data will be permanently deleted within 30 days.',
            warning: 'This action is irreversible. All your account data, orders, and medical records will be permanently deleted.',
            estimated_completion: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
          }),
          { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      case 'data_portability': {
        // Create Data Portability Request
        const { data: dsar, error } = await supabase
          .from('data_subject_requests')
          .insert({
            user_id: user.id,
            request_type: 'portability',
            status: 'in_progress',
            request_data: {
              requested_at: new Date().toISOString(),
              format: 'JSON',
            },
          })
          .select()
          .single();

        if (error) throw error;

        // Start data export process
        // This would typically be handled by a background job
        return new Response(
          JSON.stringify({
            success: true,
            request_id: dsar.id,
            message: 'Data portability request initiated. Your data will be prepared in machine-readable format.',
          }),
          { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      case 'consent_management': {
        if (!consentType) {
          throw new Error('Consent type required');
        }

        const now = new Date().toISOString();
        const consentRecord = {
          user_id: user.id,
          consent_type: consentType,
          granted: granted !== undefined ? granted : true,
          version: '1.0',
          ip_address: req.headers.get('x-forwarded-for'),
          granted_at: granted ? now : null,
          revoked_at: !granted ? now : null,
        };

        await supabase
          .from('consent_records')
          .upsert(consentRecord);

        return new Response(
          JSON.stringify({
            success: true,
            message: `Consent ${granted ? 'granted' : 'revoked'} for ${consentType}`,
          }),
          { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      case 'export_data': {
        // Export all user data in machine-readable format
        const userData: any = {
          user_info: {
            id: user.id,
            email: user.email,
            created_at: user.created_at,
          },
          data: {},
        };

        // Collect data from all relevant tables
        for (const table of USER_DATA_TABLES) {
          try {
            const { data, error } = await supabase
              .from(table)
              .select('*')
              .eq('user_id', user.id);

            if (!error && data) {
              userData.data[table] = data;
            }
          } catch (e) {
            console.log(`Table ${table} may not exist or has no user_id column`);
          }
        }

        // Get consent records
        const { data: consents } = await supabase
          .from('consent_records')
          .select('*')
          .eq('user_id', user.id);

        userData.consent_records = consents;

        // Get DSAR history
        const { data: dsarHistory } = await supabase
          .from('data_subject_requests')
          .select('*')
          .eq('user_id', user.id);

        userData.dsar_history = dsarHistory;

        return new Response(
          JSON.stringify({
            success: true,
            export_date: new Date().toISOString(),
            data: userData,
            format: 'JSON',
            gdpr_compliant: true,
          }),
          { 
            status: 200, 
            headers: { 
              ...corsHeaders, 
              'Content-Type': 'application/json',
              'Content-Disposition': `attachment; filename="user-data-export-${user.id}.json"`,
            } 
          }
        );
      }

      case 'process_dsar': {
        // Admin function to process pending DSARs
        // This would be called by an admin or automated job
        
        const { data: pendingRequests } = await supabase
          .from('data_subject_requests')
          .select('*')
          .eq('status', 'pending')
          .limit(10);

        if (!pendingRequests || pendingRequests.length === 0) {
          return new Response(
            JSON.stringify({
              success: true,
              message: 'No pending requests to process',
            }),
            { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }

        let processed = 0;
        for (const request of pendingRequests) {
          if (request.request_type === 'erasure') {
            // Process erasure request
            // Delete user data from all tables
            for (const table of USER_DATA_TABLES) {
              try {
                await supabase
                  .from(table)
                  .delete()
                  .eq('user_id', request.user_id);
              } catch (e) {
                console.log(`Error deleting from ${table}:`, e);
              }
            }

            // Delete user account
            await supabase.auth.admin.deleteUser(request.user_id);

            // Mark request as completed
            await supabase
              .from('data_subject_requests')
              .update({
                status: 'completed',
                completed_at: new Date().toISOString(),
              })
              .eq('id', request.id);

            processed++;
          }
        }

        return new Response(
          JSON.stringify({
            success: true,
            processed: processed,
            message: `Processed ${processed} DSAR(s)`,
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
    console.error('GDPR Compliance Error:', error);
    return new Response(
      JSON.stringify({
        error: 'Internal server error',
        message: error.message,
      }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
