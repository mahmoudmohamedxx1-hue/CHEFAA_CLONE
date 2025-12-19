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
        JSON.stringify({ error: { code: 'UNAUTHORIZED', message: 'Authentication required' } }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 401 }
      )
    }

    const { action, data: requestData } = await req.json()

    let result

    switch (action) {
      case 'predict_healthcare_outcome': {
        const { patient_data, prediction_type } = requestData || {}
        
        // Simulate ML prediction
        const prediction = {
          prediction_type,
          predicted_outcome: 'positive_improvement',
          confidence_score: 0.85,
          risk_factors: ['age', 'existing_conditions'],
          recommendations: [
            'Regular monitoring recommended',
            'Continue current treatment plan',
            'Follow-up in 30 days'
          ],
          predicted_improvement: 35,
          timeframe_days: 90
        }

        // Store prediction
        await supabaseClient
          .from('predictive_analytics_results')
          .insert({
            prediction_type,
            model_name: 'healthcare_outcome_v1',
            input_data: patient_data,
            prediction_result: prediction,
            confidence_score: prediction.confidence_score
          })

        result = prediction
        break
      }

      case 'predict_adherence': {
        const { user_history, medication_plan } = requestData || {}
        
        const prediction = {
          adherence_probability: 0.78,
          risk_level: 'medium',
          predicted_adherence_rate: 78,
          intervention_recommendations: [
            'Set up medication reminders',
            'Simplify dosing schedule',
            'Regular check-ins'
          ],
          confidence_score: 0.82
        }

        result = prediction
        break
      }

      case 'forecast_demand': {
        const { product_category, time_horizon } = requestData || {}
        
        const forecast = {
          time_horizon,
          predicted_demand: Array.from({ length: time_horizon || 30 }, (_, i) => ({
            date: new Date(Date.now() + i * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
            predicted_value: 100 + Math.sin(i / 7) * 20 + Math.random() * 10
          })),
          trend: 'increasing',
          seasonality_detected: true,
          confidence_interval: { lower: 80, upper: 120 }
        }

        result = forecast
        break
      }

      case 'predict_churn': {
        const { user_segment, behavioral_data } = requestData || {}
        
        const prediction = {
          churn_probability: 0.25,
          risk_score: 25,
          key_factors: [
            'Decreased login frequency',
            'Reduced feature usage',
            'No recent purchases'
          ],
          retention_strategies: [
            'Personalized engagement campaign',
            'Special discount offer',
            'Feature education outreach'
          ],
          confidence_score: 0.79
        }

        result = prediction
        break
      }

      case 'get_predictions_history': {
        const { prediction_type, limit } = requestData || {}
        
        let query = supabaseClient
          .from('predictive_analytics_results')
          .select('*')
          .order('created_at', { ascending: false })
          .limit(limit || 50)

        if (prediction_type) {
          query = query.eq('prediction_type', prediction_type)
        }

        const { data, error } = await query

        if (error) throw new Error(`Database error: ${error.message}`)

        result = { predictions: data || [], count: data?.length || 0 }
        break
      }

      default:
        return new Response(
          JSON.stringify({ error: { code: 'INVALID_ACTION', message: `Unknown action: ${action}` } }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
        )
    }

    return new Response(
      JSON.stringify({ data: result }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  } catch (error) {
    return new Response(
      JSON.stringify({
        error: {
          code: 'INTERNAL_ERROR',
          message: error.message || 'An unexpected error occurred'
        }
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
    )
  }
})
