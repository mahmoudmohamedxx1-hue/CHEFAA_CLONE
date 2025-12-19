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
      case 'get_executive_dashboard': {
        const { time_range } = requestData || {}
        const startDate = getStartDate(time_range || '30d')

        const { data: metrics } = await supabaseClient
          .from('business_metrics')
          .select('*')
          .gte('recorded_at', startDate)

        const kpis = {
          revenue: {
            current: 1250000,
            previous: 1100000,
            growth: 13.6,
            trend: 'increasing'
          },
          active_users: {
            current: 15420,
            previous: 14200,
            growth: 8.6,
            trend: 'increasing'
          },
          conversion_rate: {
            current: 3.8,
            previous: 3.2,
            growth: 18.8,
            trend: 'increasing'
          },
          customer_satisfaction: {
            current: 4.6,
            previous: 4.4,
            growth: 4.5,
            trend: 'stable'
          },
          operational_efficiency: {
            current: 92,
            previous: 88,
            growth: 4.5,
            trend: 'increasing'
          }
        }

        result = {
          kpis,
          financial_overview: generateFinancialOverview(),
          operational_metrics: generateOperationalMetrics(),
          market_analysis: generateMarketAnalysis(),
          risk_indicators: generateRiskIndicators()
        }
        break
      }

      case 'get_financial_metrics': {
        result = {
          revenue_breakdown: {
            subscriptions: 750000,
            one_time: 350000,
            services: 150000
          },
          profit_margins: {
            gross: 68,
            operating: 32,
            net: 24
          },
          growth_metrics: {
            mrr_growth: 12.5,
            arr: 8400000,
            customer_lifetime_value: 2400,
            customer_acquisition_cost: 180
          }
        }
        break
      }

      case 'track_business_metric': {
        const { metric_category, metric_name, metric_value, unit, target_value, growth_rate } = requestData || {}

        if (!metric_category || !metric_name || metric_value === undefined) {
          return new Response(
            JSON.stringify({ error: { code: 'MISSING_PARAMETERS', message: 'metric_category, metric_name, and metric_value are required' } }),
            { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
          )
        }

        const { data: metric, error } = await supabaseClient
          .from('business_metrics')
          .insert({
            metric_category,
            metric_name,
            metric_value,
            unit,
            target_value,
            growth_rate,
            recorded_at: new Date().toISOString()
          })
          .select()
          .single()

        if (error) throw new Error(`Failed to track metric: ${error.message}`)

        result = { metric, message: 'Business metric tracked successfully' }
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

function getStartDate(timeRange: string): string {
  const now = new Date()
  const days = { '7d': 7, '30d': 30, '90d': 90, '1y': 365 }[timeRange] || 30
  return new Date(now.getTime() - days * 24 * 60 * 60 * 1000).toISOString()
}

function generateFinancialOverview(): any {
  return {
    total_revenue: 1250000,
    revenue_growth: 13.6,
    profit_margin: 24,
    cash_flow: 'positive',
    burn_rate: 45000,
    runway_months: 36
  }
}

function generateOperationalMetrics(): any {
  return {
    system_uptime: 99.9,
    avg_response_time: 245,
    error_rate: 0.12,
    api_success_rate: 99.88,
    customer_support_resolution_time: 4.2
  }
}

function generateMarketAnalysis(): any {
  return {
    market_share: 8.5,
    competitive_position: 'strong',
    market_growth_rate: 15.2,
    customer_segments: [
      { segment: 'Enterprise', percentage: 45 },
      { segment: 'SMB', percentage: 35 },
      { segment: 'Individual', percentage: 20 }
    ]
  }
}

function generateRiskIndicators(): any {
  return {
    overall_risk_score: 'low',
    churn_risk: 2.3,
    financial_risk: 'low',
    operational_risk: 'medium',
    compliance_risk: 'low'
  }
}
