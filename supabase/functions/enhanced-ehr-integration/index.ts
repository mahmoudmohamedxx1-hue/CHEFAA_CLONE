import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

// Logger utility
const log = (level: string, message: string, data?: any) => {
  const logEntry = {
    timestamp: new Date().toISOString(),
    level,
    message,
    data: data || {},
  }
  console.log(JSON.stringify(logEntry))
}

// Retry utility for external API calls
async function retryWithBackoff(
  fn: () => Promise<any>,
  maxRetries = 3,
  initialDelay = 1000
): Promise<any> {
  for (let attempt = 0; attempt < maxRetries; attempt++) {
    try {
      return await fn()
    } catch (error) {
      if (attempt === maxRetries - 1) throw error
      const delay = initialDelay * Math.pow(2, attempt)
      log('warn', `Retry attempt ${attempt + 1}/${maxRetries} after ${delay}ms`, { error: error.message })
      await new Promise(resolve => setTimeout(resolve, delay))
    }
  }
}

// Simulated EHR API clients (production would use real APIs)
class EHRAPIClient {
  private ehrSystem: string
  private credentials: any

  constructor(ehrSystem: string, credentials: any) {
    this.ehrSystem = ehrSystem
    this.credentials = credentials
  }

  // Simulate FHIR R4 API call
  async fetchFHIRResource(resourceType: string, resourceId: string): Promise<any> {
    log('info', `Fetching FHIR resource from ${this.ehrSystem}`, { resourceType, resourceId })
    
    // Simulate API call delay
    await new Promise(resolve => setTimeout(resolve, 100))
    
    // In production, this would call actual EHR API:
    // const response = await fetch(`${this.baseUrl}/fhir/R4/${resourceType}/${resourceId}`, {
    //   headers: { 'Authorization': `Bearer ${this.credentials.access_token}` }
    // })
    
    // Return FHIR-compliant mock data
    const mockData: any = {
      resourceType,
      id: resourceId,
      meta: {
        versionId: '1',
        lastUpdated: new Date().toISOString(),
      },
    }

    switch (resourceType) {
      case 'Patient':
        mockData.name = [{ family: 'Doe', given: ['John'] }]
        mockData.gender = 'male'
        mockData.birthDate = '1980-01-01'
        break
      case 'Condition':
        mockData.clinicalStatus = { coding: [{ code: 'active' }] }
        mockData.code = { text: 'Type 2 Diabetes' }
        break
      case 'Medication':
        mockData.code = { text: 'Metformin 500mg' }
        mockData.status = 'active'
        break
      case 'Observation':
        mockData.status = 'final'
        mockData.code = { text: 'Blood Glucose' }
        mockData.valueQuantity = { value: 95, unit: 'mg/dL' }
        break
    }

    return mockData
  }

  async searchFHIRResources(resourceType: string, searchParams: any): Promise<any> {
    log('info', `Searching FHIR resources in ${this.ehrSystem}`, { resourceType, searchParams })
    
    await new Promise(resolve => setTimeout(resolve, 150))
    
    // Return FHIR Bundle
    return {
      resourceType: 'Bundle',
      type: 'searchset',
      total: 3,
      entry: [
        { resource: await this.fetchFHIRResource(resourceType, 'mock-id-1') },
        { resource: await this.fetchFHIRResource(resourceType, 'mock-id-2') },
        { resource: await this.fetchFHIRResource(resourceType, 'mock-id-3') },
      ],
    }
  }

  async syncData(resources: string[]): Promise<any> {
    log('info', `Syncing EHR data from ${this.ehrSystem}`, { resources })
    
    const syncedData = await Promise.all(
      resources.map(async (resourceType) => {
        try {
          const bundle = await this.searchFHIRResources(resourceType, {})
          return { resourceType, count: bundle.total, status: 'success' }
        } catch (error) {
          return { resourceType, error: error.message, status: 'failed' }
        }
      })
    )

    return {
      synced_resources: syncedData,
      total_synced: syncedData.filter(r => r.status === 'success').length,
      sync_time: new Date().toISOString(),
    }
  }
}

// Validation functions
function validateEHRSystem(ehrSystem: string): boolean {
  const validSystems = ['epic', 'cerner', 'allscripts', 'athenahealth', 'advancedmd', 'eclinicalworks']
  return validSystems.includes(ehrSystem.toLowerCase())
}

function validateFHIRResourceType(resourceType: string): boolean {
  const validTypes = ['Patient', 'Condition', 'Medication', 'Observation', 'Procedure', 'Encounter']
  return validTypes.includes(resourceType)
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
      log('warn', 'Unauthorized access attempt', { authError })
      return new Response(
        JSON.stringify({ error: { code: 'UNAUTHORIZED', message: 'Authentication required' } }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 401 }
      )
    }

    log('info', 'Request received', { userId: user.id, method: req.method })

    const { action, data: requestData } = await req.json()

    if (!action) {
      return new Response(
        JSON.stringify({ error: { code: 'INVALID_REQUEST', message: 'Action is required' } }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
      )
    }

    let result

    switch (action) {
      case 'get_ehr_connections': {
        const { data: connections, error } = await supabaseClient
          .from('ehr_integrations')
          .select('*')
          .eq('user_id', user.id)
          .order('created_at', { ascending: false })
        
        if (error) throw new Error(`Database error: ${error.message}`)
        
        log('info', 'Retrieved EHR connections', { count: connections?.length || 0 })
        result = { connections: connections || [] }
        break
      }

      case 'connect_ehr': {
        const ehrSystem = requestData?.provider_type
        
        if (!ehrSystem) {
          return new Response(
            JSON.stringify({ error: { code: 'MISSING_PARAMETER', message: 'provider_type is required' } }),
            { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
          )
        }

        if (!validateEHRSystem(ehrSystem)) {
          return new Response(
            JSON.stringify({ error: { code: 'INVALID_EHR_SYSTEM', message: 'Invalid EHR system' } }),
            { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
          )
        }

        // In production, validate credentials with actual EHR API
        const { data: newConnection, error } = await supabaseClient
          .from('ehr_integrations')
          .insert({
            user_id: user.id,
            ehr_system: ehrSystem,
            status: 'active',
            last_sync_at: new Date().toISOString(),
            config: requestData?.config || {},
          })
          .select()
          .single()
        
        if (error) throw new Error(`Failed to create connection: ${error.message}`)
        
        log('info', 'EHR connection created', { ehrSystem, connectionId: newConnection.id })
        result = { connection: newConnection, message: 'EHR system connected successfully' }
        break
      }

      case 'sync_ehr_data': {
        const connectionId = requestData?.connection_id
        const resources = requestData?.resources || ['Patient', 'Condition', 'Medication', 'Observation']
        
        if (!connectionId) {
          return new Response(
            JSON.stringify({ error: { code: 'MISSING_PARAMETER', message: 'connection_id is required' } }),
            { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
          )
        }

        // Validate connection exists
        const { data: connection, error: connError } = await supabaseClient
          .from('ehr_integrations')
          .select('*')
          .eq('id', connectionId)
          .eq('user_id', user.id)
          .single()
        
        if (connError || !connection) {
          return new Response(
            JSON.stringify({ error: { code: 'CONNECTION_NOT_FOUND', message: 'EHR connection not found' } }),
            { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 404 }
          )
        }

        // Simulate EHR API sync with retry logic
        const ehrClient = new EHRAPIClient(connection.ehr_system, connection.config)
        const syncResult = await retryWithBackoff(() => ehrClient.syncData(resources))
        
        // Update last sync time
        await supabaseClient
          .from('ehr_integrations')
          .update({ last_sync_at: new Date().toISOString() })
          .eq('id', connectionId)
        
        log('info', 'EHR data synced', { connectionId, resourceCount: syncResult.total_synced })
        result = { message: 'EHR data synced successfully', ...syncResult }
        break
      }

      case 'fetch_fhir_resource': {
        const { connection_id, resource_type, resource_id } = requestData || {}
        
        if (!connection_id || !resource_type || !resource_id) {
          return new Response(
            JSON.stringify({ error: { code: 'MISSING_PARAMETERS', message: 'connection_id, resource_type, and resource_id are required' } }),
            { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
          )
        }

        if (!validateFHIRResourceType(resource_type)) {
          return new Response(
            JSON.stringify({ error: { code: 'INVALID_RESOURCE_TYPE', message: 'Invalid FHIR resource type' } }),
            { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
          )
        }

        const { data: connection } = await supabaseClient
          .from('ehr_integrations')
          .select('*')
          .eq('id', connection_id)
          .eq('user_id', user.id)
          .single()
        
        if (!connection) {
          return new Response(
            JSON.stringify({ error: { code: 'CONNECTION_NOT_FOUND', message: 'EHR connection not found' } }),
            { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 404 }
          )
        }

        const ehrClient = new EHRAPIClient(connection.ehr_system, connection.config)
        const resource = await retryWithBackoff(() => ehrClient.fetchFHIRResource(resource_type, resource_id))
        
        log('info', 'FHIR resource fetched', { resourceType: resource_type, resourceId: resource_id })
        result = { resource }
        break
      }

      case 'search_fhir_resources': {
        const { connection_id, resource_type, search_params } = requestData || {}
        
        if (!connection_id || !resource_type) {
          return new Response(
            JSON.stringify({ error: { code: 'MISSING_PARAMETERS', message: 'connection_id and resource_type are required' } }),
            { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
          )
        }

        const { data: connection } = await supabaseClient
          .from('ehr_integrations')
          .select('*')
          .eq('id', connection_id)
          .eq('user_id', user.id)
          .single()
        
        if (!connection) {
          return new Response(
            JSON.stringify({ error: { code: 'CONNECTION_NOT_FOUND', message: 'EHR connection not found' } }),
            { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 404 }
          )
        }

        const ehrClient = new EHRAPIClient(connection.ehr_system, connection.config)
        const bundle = await retryWithBackoff(() => ehrClient.searchFHIRResources(resource_type, search_params || {}))
        
        log('info', 'FHIR resources searched', { resourceType: resource_type, total: bundle.total })
        result = bundle
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
    log('error', 'Request failed', { error: error.message, duration: `${duration}ms`, stack: error.stack })
    
    return new Response(
      JSON.stringify({ 
        error: { 
          code: 'INTERNAL_ERROR',
          message: error.message || 'An unexpected error occurred',
          details: Deno.env.get('ENVIRONMENT') === 'development' ? error.stack : undefined
        } 
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
    )
  }
})
