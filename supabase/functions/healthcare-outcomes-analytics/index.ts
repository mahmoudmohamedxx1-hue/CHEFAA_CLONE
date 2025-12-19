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
      case 'get_outcomes_dashboard': {
        const { time_range } = requestData || {}
        const startDate = getStartDate(time_range || '30d')

        const { data: outcomes } = await supabaseClient
          .from('healthcare_outcomes')
          .select('*')
          .eq('user_id', user.id)
          .gte('recorded_at', startDate)
          .order('recorded_at', { ascending: false })

        const summary = {
          total_outcomes: outcomes?.length || 0,
          avg_improvement: calculateAverage(outcomes?.map(o => o.improvement_percentage) || []),
          positive_outcomes: outcomes?.filter(o => o.improvement_percentage > 0).length || 0,
          by_type: aggregateByType(outcomes || []),
          trend_analysis: analyzeTrends(outcomes || [])
        }

        result = { summary, outcomes: outcomes?.slice(0, 100) || [] }
        break
      }

      case 'analyze_treatment_effectiveness': {
        const { treatment_type, patient_segment } = requestData || {}

        const { data: outcomes } = await supabaseClient
          .from('healthcare_outcomes')
          .select('*')
          .eq('outcome_type', treatment_type)
          .eq('user_id', user.id)

        const effectiveness = {
          treatment_type,
          success_rate: calculateSuccessRate(outcomes || []),
          average_improvement: calculateAverage(outcomes?.map(o => o.improvement_percentage) || []),
          patient_count: outcomes?.length || 0,
          time_to_improvement: calculateAverageTimeToImprovement(outcomes || []),
          effectiveness_score: calculateEffectivenessScore(outcomes || [])
        }

        result = effectiveness
        break
      }

      case 'get_population_health': {
        const { data: outcomes } = await supabaseClient
          .from('healthcare_outcomes')
          .select('outcome_type, metric_value, improvement_percentage, recorded_at')
          .gte('recorded_at', getStartDate('90d'))

        const populationMetrics = {
          total_patients_tracked: new Set(outcomes?.map(o => o.user_id)).size,
          overall_health_trend: calculateOverallTrend(outcomes || []),
          high_risk_count: outcomes?.filter(o => o.improvement_percentage < -10).length || 0,
          improving_count: outcomes?.filter(o => o.improvement_percentage > 10).length || 0,
          stable_count: outcomes?.filter(o => Math.abs(o.improvement_percentage) <= 10).length || 0,
          by_condition: aggregateByCondition(outcomes || [])
        }

        result = populationMetrics
        break
      }

      case 'track_outcome': {
        const { outcome_type, metric_name, metric_value, unit, baseline_value, notes } = requestData || {}

        if (!outcome_type || !metric_name || metric_value === undefined) {
          return new Response(
            JSON.stringify({ error: { code: 'MISSING_PARAMETERS', message: 'outcome_type, metric_name, and metric_value are required' } }),
            { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
          )
        }

        const improvement = baseline_value ? ((metric_value - baseline_value) / baseline_value) * 100 : 0

        const { data: outcome, error } = await supabaseClient
          .from('healthcare_outcomes')
          .insert({
            user_id: user.id,
            outcome_type,
            metric_name,
            metric_value,
            unit,
            baseline_value,
            improvement_percentage: improvement,
            notes,
            recorded_at: new Date().toISOString()
          })
          .select()
          .single()

        if (error) throw new Error(`Failed to track outcome: ${error.message}`)

        result = { outcome, message: 'Healthcare outcome tracked successfully' }
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

function calculateAverage(values: number[]): number {
  return values.length ? values.reduce((a, b) => a + b, 0) / values.length : 0
}

function aggregateByType(outcomes: any[]): any {
  const byType: Record<string, any[]> = {}
  outcomes.forEach(o => {
    if (!byType[o.outcome_type]) byType[o.outcome_type] = []
    byType[o.outcome_type].push(o)
  })
  return Object.entries(byType).map(([type, items]) => ({
    type,
    count: items.length,
    avg_improvement: calculateAverage(items.map(i => i.improvement_percentage))
  }))
}

function analyzeTrends(outcomes: any[]): any {
  if (outcomes.length < 2) return { trend: 'insufficient_data' }
  const recent = outcomes.slice(0, Math.floor(outcomes.length / 2))
  const older = outcomes.slice(Math.floor(outcomes.length / 2))
  const recentAvg = calculateAverage(recent.map(o => o.improvement_percentage))
  const olderAvg = calculateAverage(older.map(o => o.improvement_percentage))
  return {
    trend: recentAvg > olderAvg + 5 ? 'improving' : recentAvg < olderAvg - 5 ? 'declining' : 'stable',
    change: recentAvg - olderAvg
  }
}

function calculateSuccessRate(outcomes: any[]): number {
  if (!outcomes.length) return 0
  return (outcomes.filter(o => o.improvement_percentage > 0).length / outcomes.length) * 100
}

function calculateAverageTimeToImprovement(outcomes: any[]): number {
  return 30 // Simplified - would calculate from actual data
}

function calculateEffectivenessScore(outcomes: any[]): number {
  const successRate = calculateSuccessRate(outcomes)
  const avgImprovement = calculateAverage(outcomes.map(o => o.improvement_percentage))
  return (successRate + Math.max(0, avgImprovement)) / 2
}

function calculateOverallTrend(outcomes: any[]): string {
  const avgImprovement = calculateAverage(outcomes.map(o => o.improvement_percentage))
  return avgImprovement > 10 ? 'positive' : avgImprovement < -10 ? 'negative' : 'stable'
}

function aggregateByCondition(outcomes: any[]): any {
  const byCondition: Record<string, number> = {}
  outcomes.forEach(o => {
    byCondition[o.outcome_type] = (byCondition[o.outcome_type] || 0) + 1
  })
  return Object.entries(byCondition).map(([condition, count]) => ({ condition, count }))
}
