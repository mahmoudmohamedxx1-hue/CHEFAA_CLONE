import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

const log = (level: string, message: string, data?: any) => {
  console.log(JSON.stringify({ timestamp: new Date().toISOString(), level, message, data: data || {} }))
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  const startTime = Date.now()

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      { global: { headers: { Authorization: req.headers.get('Authorization')! } } }
    )

    const { data: { user }, error: authError } = await supabaseClient.auth.getUser()
    if (authError || !user) {
      log('warn', 'Unauthorized access attempt')
      return new Response(
        JSON.stringify({ error: { code: 'UNAUTHORIZED', message: 'Authentication required' } }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 401 }
      )
    }

    const { action, data: requestData } = await req.json()

    if (!action) {
      return new Response(
        JSON.stringify({ error: { code: 'INVALID_REQUEST', message: 'Action is required' } }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
      )
    }

    let result

    switch (action) {
      case 'get_dashboard_overview': {
        // Get comprehensive dashboard overview
        const timeRange = requestData?.time_range || '7d'
        const startDate = getStartDate(timeRange)

        // Platform usage metrics
        const { data: usageData } = await supabaseClient
          .from('platform_usage_analytics')
          .select('event_type, event_name, created_at')
          .gte('created_at', startDate)
          .order('created_at', { ascending: false })

        // Healthcare outcomes
        const { data: outcomesData } = await supabaseClient
          .from('healthcare_outcomes')
          .select('outcome_type, metric_value, improvement_percentage, recorded_at')
          .gte('recorded_at', startDate)

        // Business metrics
        const { data: businessData } = await supabaseClient
          .from('business_metrics')
          .select('metric_category, metric_name, metric_value, growth_rate, recorded_at')
          .gte('recorded_at', startDate)

        // User behavior
        const { data: behaviorData } = await supabaseClient
          .from('user_behavior_tracking')
          .select('feature_name, interaction_count, conversion_achieved, created_at')
          .gte('created_at', startDate)

        // Calculate KPIs
        const totalEvents = usageData?.length || 0
        const avgImprovement = calculateAverage(outcomesData?.map(o => o.improvement_percentage) || [])
        const activeFeatures = new Set(behaviorData?.map(b => b.feature_name)).size
        const conversionRate = calculateConversionRate(behaviorData || [])

        result = {
          overview: {
            total_events: totalEvents,
            average_improvement: avgImprovement,
            active_features: activeFeatures,
            conversion_rate: conversionRate,
            time_range: timeRange,
          },
          usage_analytics: aggregateByDate(usageData || []),
          healthcare_outcomes: aggregateOutcomes(outcomesData || []),
          business_metrics: aggregateBusinessMetrics(businessData || []),
          user_behavior: aggregateBehavior(behaviorData || []),
        }

        log('info', 'Dashboard overview retrieved', { timeRange, userId: user.id })
        break
      }

      case 'get_detailed_analytics': {
        const { metric_type, time_range, filters } = requestData || {}

        if (!metric_type) {
          return new Response(
            JSON.stringify({ error: { code: 'MISSING_PARAMETER', message: 'metric_type is required' } }),
            { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
          )
        }

        const startDate = getStartDate(time_range || '30d')

        let query = supabaseClient
          .from(getTableForMetric(metric_type))
          .select('*')
          .gte('created_at', startDate)
          .order('created_at', { ascending: false })

        // Apply filters if provided
        if (filters) {
          Object.keys(filters).forEach(key => {
            query = query.eq(key, filters[key])
          })
        }

        const { data, error } = await query.limit(1000)

        if (error) throw new Error(`Database error: ${error.message}`)

        result = {
          metric_type,
          data: data || [],
          summary: calculateSummary(data || [], metric_type),
          trends: calculateTrends(data || [], time_range),
        }

        log('info', 'Detailed analytics retrieved', { metricType: metric_type })
        break
      }

      case 'get_comparative_analysis': {
        const { metric_name, comparison_periods } = requestData || {}

        if (!metric_name || !comparison_periods || !Array.isArray(comparison_periods)) {
          return new Response(
            JSON.stringify({ error: { code: 'MISSING_PARAMETERS', message: 'metric_name and comparison_periods array are required' } }),
            { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
          )
        }

        const comparisons = await Promise.all(
          comparison_periods.map(async (period: string) => {
            const startDate = getStartDate(period)
            const { data } = await supabaseClient
              .from('business_metrics')
              .select('metric_value, recorded_at')
              .eq('metric_name', metric_name)
              .gte('recorded_at', startDate)

            return {
              period,
              data: data || [],
              average: calculateAverage(data?.map(d => d.metric_value) || []),
              trend: calculateTrendDirection(data || []),
            }
          })
        )

        result = {
          metric_name,
          comparisons,
          growth_analysis: calculateGrowthAnalysis(comparisons),
        }

        log('info', 'Comparative analysis completed', { metricName: metric_name })
        break
      }

      case 'export_analytics_data': {
        const { export_type, time_range, format } = requestData || {}

        if (!export_type || !format) {
          return new Response(
            JSON.stringify({ error: { code: 'MISSING_PARAMETERS', message: 'export_type and format are required' } }),
            { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
          )
        }

        const startDate = getStartDate(time_range || '30d')

        // Get data based on export type
        const { data, error } = await supabaseClient
          .from(getTableForMetric(export_type))
          .select('*')
          .gte('created_at', startDate)
          .order('created_at', { ascending: false })

        if (error) throw new Error(`Database error: ${error.message}`)

        // Format data based on requested format
        const formattedData = formatForExport(data || [], format)

        // Create export record
        await supabaseClient
          .from('report_generation_history')
          .insert({
            user_id: user.id,
            report_type: export_type,
            report_name: `${export_type}_${new Date().toISOString()}`,
            parameters: { time_range, format },
            status: 'completed',
            file_format: format,
          })

        result = {
          export_type,
          format,
          data: formattedData,
          record_count: data?.length || 0,
          generated_at: new Date().toISOString(),
        }

        log('info', 'Analytics data exported', { exportType: export_type, format })
        break
      }

      default:
        return new Response(
          JSON.stringify({ error: { code: 'INVALID_ACTION', message: `Unknown action: ${action}` } }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
        )
    }

    const duration = Date.now() - startTime
    log('info', 'Request completed', { action, duration: `${duration}ms` })

    return new Response(
      JSON.stringify({ data: result }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  } catch (error) {
    const duration = Date.now() - startTime
    log('error', 'Request failed', { error: error.message, duration: `${duration}ms` })

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

// Helper functions
function getStartDate(timeRange: string): string {
  const now = new Date()
  const ranges: Record<string, number> = {
    '1d': 1,
    '7d': 7,
    '30d': 30,
    '90d': 90,
    '1y': 365,
  }
  const days = ranges[timeRange] || 7
  return new Date(now.getTime() - days * 24 * 60 * 60 * 1000).toISOString()
}

function calculateAverage(values: number[]): number {
  if (values.length === 0) return 0
  return values.reduce((sum, val) => sum + val, 0) / values.length
}

function calculateConversionRate(behaviorData: any[]): number {
  if (behaviorData.length === 0) return 0
  const conversions = behaviorData.filter(b => b.conversion_achieved).length
  return (conversions / behaviorData.length) * 100
}

function aggregateByDate(data: any[]): any {
  const aggregated: Record<string, number> = {}
  data.forEach(item => {
    const date = new Date(item.created_at).toISOString().split('T')[0]
    aggregated[date] = (aggregated[date] || 0) + 1
  })
  return Object.entries(aggregated).map(([date, count]) => ({ date, count }))
}

function aggregateOutcomes(data: any[]): any {
  const byType: Record<string, any> = {}
  data.forEach(item => {
    if (!byType[item.outcome_type]) {
      byType[item.outcome_type] = { total: 0, sum: 0, improvements: [] }
    }
    byType[item.outcome_type].total++
    byType[item.outcome_type].sum += item.metric_value
    if (item.improvement_percentage) {
      byType[item.outcome_type].improvements.push(item.improvement_percentage)
    }
  })

  return Object.entries(byType).map(([type, stats]: [string, any]) => ({
    outcome_type: type,
    average_value: stats.sum / stats.total,
    average_improvement: calculateAverage(stats.improvements),
    count: stats.total,
  }))
}

function aggregateBusinessMetrics(data: any[]): any {
  const byCategory: Record<string, any[]> = {}
  data.forEach(item => {
    if (!byCategory[item.metric_category]) {
      byCategory[item.metric_category] = []
    }
    byCategory[item.metric_category].push(item)
  })

  return Object.entries(byCategory).map(([category, metrics]) => ({
    category,
    metrics: metrics.map(m => ({
      name: m.metric_name,
      value: m.metric_value,
      growth_rate: m.growth_rate,
    })),
  }))
}

function aggregateBehavior(data: any[]): any {
  const byFeature: Record<string, any> = {}
  data.forEach(item => {
    if (!byFeature[item.feature_name]) {
      byFeature[item.feature_name] = { interactions: 0, conversions: 0 }
    }
    byFeature[item.feature_name].interactions += item.interaction_count
    if (item.conversion_achieved) {
      byFeature[item.feature_name].conversions++
    }
  })

  return Object.entries(byFeature).map(([feature, stats]: [string, any]) => ({
    feature_name: feature,
    total_interactions: stats.interactions,
    conversion_count: stats.conversions,
    conversion_rate: stats.interactions > 0 ? (stats.conversions / stats.interactions) * 100 : 0,
  }))
}

function getTableForMetric(metricType: string): string {
  const tables: Record<string, string> = {
    'usage': 'platform_usage_analytics',
    'outcomes': 'healthcare_outcomes',
    'business': 'business_metrics',
    'behavior': 'user_behavior_tracking',
  }
  return tables[metricType] || 'platform_usage_analytics'
}

function calculateSummary(data: any[], metricType: string): any {
  return {
    total_records: data.length,
    date_range: {
      start: data[data.length - 1]?.created_at,
      end: data[0]?.created_at,
    },
    unique_users: new Set(data.map(d => d.user_id).filter(Boolean)).size,
  }
}

function calculateTrends(data: any[], timeRange: string): any {
  // Simple trend calculation
  if (data.length < 2) return { direction: 'stable', change: 0 }

  const firstHalf = data.slice(data.length / 2)
  const secondHalf = data.slice(0, data.length / 2)

  const firstAvg = firstHalf.length
  const secondAvg = secondHalf.length

  const change = ((secondAvg - firstAvg) / firstAvg) * 100

  return {
    direction: change > 5 ? 'increasing' : change < -5 ? 'decreasing' : 'stable',
    change: Math.round(change),
  }
}

function calculateTrendDirection(data: any[]): string {
  if (data.length < 2) return 'stable'
  const recent = data[0]?.metric_value || 0
  const older = data[data.length - 1]?.metric_value || 0
  return recent > older ? 'increasing' : recent < older ? 'decreasing' : 'stable'
}

function calculateGrowthAnalysis(comparisons: any[]): any {
  if (comparisons.length < 2) return { overall_trend: 'insufficient_data' }

  const trends = comparisons.map(c => c.trend)
  const increasing = trends.filter(t => t === 'increasing').length
  const decreasing = trends.filter(t => t === 'decreasing').length

  return {
    overall_trend: increasing > decreasing ? 'growth' : decreasing > increasing ? 'decline' : 'stable',
    trend_consistency: (Math.max(increasing, decreasing) / trends.length) * 100,
  }
}

function formatForExport(data: any[], format: string): any {
  switch (format) {
    case 'csv':
      return convertToCSV(data)
    case 'json':
      return data
    case 'excel':
      return { data, format: 'excel', note: 'Excel format requires client-side processing' }
    default:
      return data
  }
}

function convertToCSV(data: any[]): string {
  if (data.length === 0) return ''

  const headers = Object.keys(data[0]).join(',')
  const rows = data.map(row => Object.values(row).join(','))

  return [headers, ...rows].join('\n')
}
