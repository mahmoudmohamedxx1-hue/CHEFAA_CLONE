// Laboratory Results Integration Edge Function
// Quest, LabCorp, BioReference, Genetic Testing

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, GET, OPTIONS',
};

const LAB_PROVIDERS = {
  quest_diagnostics: { name: 'Quest Diagnostics', supports_fhir: true },
  labcorp: { name: 'LabCorp', supports_fhir: true },
  bioreference: { name: 'BioReference Laboratories', supports_fhir: true },
  regional_lab: { name: 'Regional Laboratory', supports_fhir: false },
  genetic_testing: { name: 'Genetic Testing Lab', supports_fhir: true },
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
      case 'sync_lab_results':
        result = await syncLabResults(supabaseClient, user.id, data);
        break;
      case 'get_lab_results':
        result = await getLabResults(supabaseClient, user.id, data);
        break;
      case 'get_abnormal_results':
        result = await getAbnormalResults(supabaseClient, user.id);
        break;
      case 'compare_results':
        result = await compareResults(supabaseClient, user.id, data.test_name, data.months);
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

async function syncLabResults(supabase: any, userId: string, syncData: any) {
  const { lab_provider, results } = syncData;
  
  const provider = LAB_PROVIDERS[lab_provider];
  if (!provider) throw new Error(`Unsupported lab provider: ${lab_provider}`);

  const insertPromises = [];
  const abnormalCount = results.filter((r: any) => r.abnormal_flag !== 'normal').length;

  for (const result of results) {
    insertPromises.push(
      supabase.from('laboratory_results').insert({
        user_id: userId,
        lab_provider,
        test_category: result.test_category,
        test_name: result.test_name,
        test_code: result.test_code,
        result_value: result.result_value,
        result_unit: result.result_unit,
        reference_range: result.reference_range,
        abnormal_flag: result.abnormal_flag || 'normal',
        result_status: 'final',
        ordered_at: result.ordered_at,
        collected_at: result.collected_at,
        resulted_at: result.resulted_at || new Date().toISOString(),
        ordering_provider: result.ordering_provider,
        performing_lab: provider.name,
        result_notes: result.result_notes,
      })
    );
  }

  await Promise.all(insertPromises);

  return {
    lab_provider: provider.name,
    results_synced: results.length,
    abnormal_results: abnormalCount,
    sync_timestamp: new Date().toISOString(),
    message: `Synced ${results.length} lab results from ${provider.name}`,
  };
}

async function getLabResults(supabase: any, userId: string, filters: any = {}) {
  let query = supabase
    .from('laboratory_results')
    .select('*')
    .eq('user_id', userId);

  if (filters.lab_provider) query = query.eq('lab_provider', filters.lab_provider);
  if (filters.test_category) query = query.eq('test_category', filters.test_category);
  if (filters.date_from) query = query.gte('resulted_at', filters.date_from);
  if (filters.date_to) query = query.lte('resulted_at', filters.date_to);

  const { data, error } = await query.order('resulted_at', { ascending: false }).limit(100);
  if (error) throw error;

  return {
    lab_results: data,
    total_results: data.length,
    filters_applied: filters,
  };
}

async function getAbnormalResults(supabase: any, userId: string) {
  const { data, error } = await supabase
    .from('laboratory_results')
    .select('*')
    .eq('user_id', userId)
    .neq('abnormal_flag', 'normal')
    .order('resulted_at', { ascending: false })
    .limit(50);

  if (error) throw error;

  return {
    abnormal_results: data,
    total_abnormal: data.length,
    critical_count: data.filter((r: any) => r.abnormal_flag === 'critical').length,
    high_count: data.filter((r: any) => r.abnormal_flag === 'high').length,
    low_count: data.filter((r: any) => r.abnormal_flag === 'low').length,
  };
}

async function compareResults(supabase: any, userId: string, testName: string, months: number = 12) {
  const startDate = new Date();
  startDate.setMonth(startDate.getMonth() - months);

  const { data, error } = await supabase
    .from('laboratory_results')
    .select('result_value, result_unit, resulted_at, abnormal_flag')
    .eq('user_id', userId)
    .eq('test_name', testName)
    .gte('resulted_at', startDate.toISOString())
    .order('resulted_at', { ascending: true });

  if (error) throw error;

  if (data.length === 0) {
    return { message: 'No historical data found for this test', test_name: testName };
  }

  const values = data.map((d: any) => parseFloat(d.result_value)).filter((v: number) => !isNaN(v));
  const trend = values[values.length - 1] > values[0] ? 'increasing' : 
                values[values.length - 1] < values[0] ? 'decreasing' : 'stable';

  return {
    test_name: testName,
    period_months: months,
    total_tests: data.length,
    latest_value: data[data.length - 1].result_value,
    latest_date: data[data.length - 1].resulted_at,
    trend: trend,
    historical_data: data,
    unit: data[0].result_unit,
  };
}
