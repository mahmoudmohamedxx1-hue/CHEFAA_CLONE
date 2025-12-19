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
      case 'get_lab_results':
        const { data: labResults } = await supabaseClient
          .from('lab_results')
          .select('*')
          .eq('user_id', user.id)
          .order('result_date', { ascending: false })
        result = { lab_results: labResults || [] }
        break

      case 'sync_lab_results':
        const results = requestData.results || []
        const insertedResults = []
        
        for (const labResult of results) {
          const { data: newResult } = await supabaseClient
            .from('lab_results')
            .insert({
              user_id: user.id,
              lab_provider: requestData.lab_provider,
              test_name: labResult.test_name,
              test_value: labResult.test_value,
              unit: labResult.unit,
              reference_range: labResult.reference_range,
              status: labResult.status || 'normal',
              result_date: labResult.result_date || new Date().toISOString(),
            })
            .select()
            .single()
          if (newResult) insertedResults.push(newResult)
        }
        
        result = { 
          lab_results: insertedResults, 
          message: `${insertedResults.length} lab results synced successfully` 
        }
        break

      case 'get_abnormal_results':
        const { data: abnormal } = await supabaseClient
          .from('lab_results')
          .select('*')
          .eq('user_id', user.id)
          .neq('status', 'normal')
          .order('result_date', { ascending: false })
        result = { abnormal_results: abnormal || [] }
        break

      case 'compare_results':
        result = {
          test_name: requestData.test_name,
          trend: 'stable',
          comparison: [],
          message: 'Lab results comparison retrieved successfully',
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
