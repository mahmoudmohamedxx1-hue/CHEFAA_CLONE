import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, GET, OPTIONS',
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

    const { action, resourceType, resourceId, resourceData, sourceSystem } = await req.json();

    switch (action) {
      case 'sync_patient':
        return await syncPatientResource(supabase, user.id, resourceData, sourceSystem);
      
      case 'sync_medication':
        return await syncMedicationResource(supabase, user.id, resourceData, sourceSystem);
      
      case 'sync_observation':
        return await syncObservationResource(supabase, user.id, resourceData, sourceSystem);
      
      case 'get_resources':
        return await getFHIRResources(supabase, user.id, resourceType);
      
      case 'get_patient_summary':
        return await getPatientSummary(supabase, user.id);
      
      default:
        return new Response(JSON.stringify({ error: 'Invalid action' }), {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
    }
  } catch (error) {
    console.error('FHIR integration error:', error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});

// Sync FHIR Patient resource
async function syncPatientResource(supabase: any, userId: string, resourceData: any, sourceSystem: string) {
  // Validate FHIR Patient resource
  if (!resourceData || resourceData.resourceType !== 'Patient') {
    throw new Error('Invalid FHIR Patient resource');
  }

  const fhirData = {
    user_id: userId,
    resource_type: 'Patient',
    resource_id: resourceData.id || 'generated-' + Date.now(),
    source_system: sourceSystem || 'unknown',
    fhir_version: 'R4',
    resource_data: resourceData,
    last_updated: new Date().toISOString(),
  };

  const { data, error } = await supabase
    .from('fhir_resources')
    .upsert(fhirData, { onConflict: 'user_id,resource_type,resource_id,source_system' })
    .select()
    .single();

  if (error) throw error;

  // Log audit trail
  await supabase.from('integration_audit_log').insert({
    user_id: userId,
    action_type: 'fhir_patient_synced',
    action_details: { resource_id: resourceData.id, source_system: sourceSystem },
    status: 'success',
  });

  return new Response(
    JSON.stringify({
      success: true,
      resource: data,
      message: 'Patient resource synced successfully',
    }),
    { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
  );
}

// Sync FHIR Medication resource
async function syncMedicationResource(supabase: any, userId: string, resourceData: any, sourceSystem: string) {
  if (!resourceData || !['Medication', 'MedicationRequest', 'MedicationStatement'].includes(resourceData.resourceType)) {
    throw new Error('Invalid FHIR Medication resource');
  }

  const fhirData = {
    user_id: userId,
    resource_type: resourceData.resourceType,
    resource_id: resourceData.id || 'generated-' + Date.now(),
    source_system: sourceSystem || 'unknown',
    fhir_version: 'R4',
    resource_data: resourceData,
    last_updated: new Date().toISOString(),
  };

  const { data, error } = await supabase
    .from('fhir_resources')
    .upsert(fhirData, { onConflict: 'user_id,resource_type,resource_id,source_system' })
    .select()
    .single();

  if (error) throw error;

  await supabase.from('integration_audit_log').insert({
    user_id: userId,
    action_type: 'fhir_medication_synced',
    action_details: { resource_id: resourceData.id, resource_type: resourceData.resourceType },
    status: 'success',
  });

  return new Response(
    JSON.stringify({
      success: true,
      resource: data,
      message: 'Medication resource synced successfully',
    }),
    { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
  );
}

// Sync FHIR Observation resource (vital signs, lab results, etc.)
async function syncObservationResource(supabase: any, userId: string, resourceData: any, sourceSystem: string) {
  if (!resourceData || resourceData.resourceType !== 'Observation') {
    throw new Error('Invalid FHIR Observation resource');
  }

  const fhirData = {
    user_id: userId,
    resource_type: 'Observation',
    resource_id: resourceData.id || 'generated-' + Date.now(),
    source_system: sourceSystem || 'unknown',
    fhir_version: 'R4',
    resource_data: resourceData,
    last_updated: new Date().toISOString(),
  };

  const { data, error } = await supabase
    .from('fhir_resources')
    .upsert(fhirData, { onConflict: 'user_id,resource_type,resource_id,source_system' })
    .select()
    .single();

  if (error) throw error;

  await supabase.from('integration_audit_log').insert({
    user_id: userId,
    action_type: 'fhir_observation_synced',
    action_details: { resource_id: resourceData.id, observation_code: resourceData.code },
    status: 'success',
  });

  return new Response(
    JSON.stringify({
      success: true,
      resource: data,
      message: 'Observation resource synced successfully',
    }),
    { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
  );
}

// Get FHIR resources by type
async function getFHIRResources(supabase: any, userId: string, resourceType?: string) {
  let query = supabase
    .from('fhir_resources')
    .select('*')
    .eq('user_id', userId);

  if (resourceType) {
    query = query.eq('resource_type', resourceType);
  }

  const { data, error } = await query.order('last_updated', { ascending: false });

  if (error) throw error;

  return new Response(
    JSON.stringify({
      success: true,
      resources: data,
      total: data.length,
      resource_type: resourceType || 'all',
    }),
    { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
  );
}

// Get comprehensive patient summary from FHIR resources
async function getPatientSummary(supabase: any, userId: string) {
  const { data: resources, error } = await supabase
    .from('fhir_resources')
    .select('*')
    .eq('user_id', userId)
    .order('last_updated', { ascending: false });

  if (error) throw error;

  // Organize resources by type
  const summary = {
    patient: resources.filter((r: any) => r.resource_type === 'Patient'),
    medications: resources.filter((r: any) => ['Medication', 'MedicationRequest', 'MedicationStatement'].includes(r.resource_type)),
    observations: resources.filter((r: any) => r.resource_type === 'Observation'),
    conditions: resources.filter((r: any) => r.resource_type === 'Condition'),
    allergies: resources.filter((r: any) => r.resource_type === 'AllergyIntolerance'),
    immunizations: resources.filter((r: any) => r.resource_type === 'Immunization'),
    procedures: resources.filter((r: any) => r.resource_type === 'Procedure'),
    encounters: resources.filter((r: any) => r.resource_type === 'Encounter'),
    last_updated: resources.length > 0 ? resources[0].last_updated : null,
    total_resources: resources.length,
  };

  // Extract key patient demographics from Patient resource
  const patientResource = summary.patient[0]?.resource_data;
  if (patientResource) {
    summary['demographics'] = {
      name: patientResource.name?.[0],
      gender: patientResource.gender,
      birthDate: patientResource.birthDate,
      address: patientResource.address?.[0],
      telecom: patientResource.telecom,
    };
  }

  // Extract active medications
  summary['active_medications'] = summary.medications
    .filter((m: any) => m.resource_data.status === 'active')
    .map((m: any) => ({
      id: m.resource_id,
      medication: m.resource_data.medicationCodeableConcept || m.resource_data.medicationReference,
      dosage: m.resource_data.dosageInstruction,
      status: m.resource_data.status,
    }));

  // Extract recent vital signs
  summary['recent_vitals'] = summary.observations
    .filter((o: any) => {
      const code = o.resource_data.code?.coding?.[0]?.code;
      return ['85354-9', '8867-4', '8310-5', '8302-2'].includes(code); // Blood pressure, heart rate, temperature, height
    })
    .slice(0, 10)
    .map((o: any) => ({
      id: o.resource_id,
      type: o.resource_data.code?.coding?.[0]?.display,
      value: o.resource_data.valueQuantity,
      effective: o.resource_data.effectiveDateTime,
    }));

  return new Response(
    JSON.stringify({
      success: true,
      summary: summary,
    }),
    { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
  );
}
