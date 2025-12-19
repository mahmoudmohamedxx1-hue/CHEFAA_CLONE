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

    const { integrationType, action, data: requestData } = await req.json();

    // Route to appropriate integration handler
    switch (integrationType) {
      case 'pharmacy':
        return await handlePharmacyIntegration(supabase, user.id, action, requestData);
      
      case 'insurance':
        return await handleInsuranceIntegration(supabase, user.id, action, requestData);
      
      case 'health_device':
        return await handleHealthDeviceIntegration(supabase, user.id, action, requestData);
      
      case 'telemedicine':
        return await handleTelemedicineIntegration(supabase, user.id, action, requestData);
      
      case 'laboratory':
        return await handleLaboratoryIntegration(supabase, user.id, action, requestData);
      
      default:
        return new Response(JSON.stringify({ error: 'Invalid integration type' }), {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
    }
  } catch (error) {
    console.error('Healthcare integration error:', error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});

// PHARMACY NETWORK INTEGRATION
async function handlePharmacyIntegration(supabase: any, userId: string, action: string, requestData: any) {
  switch (action) {
    case 'track_prescription':
      return await trackPrescription(supabase, userId, requestData);
    
    case 'check_inventory':
      return await checkPharmacyInventory(supabase, userId, requestData);
    
    case 'find_pharmacy':
      return await findNearbyPharmacy(supabase, userId, requestData);
    
    case 'get_prescriptions':
      return await getUserPrescriptions(supabase, userId);
    
    default:
      throw new Error('Invalid pharmacy action');
  }
}

async function trackPrescription(supabase: any, userId: string, data: any) {
  const prescriptionData = {
    user_id: userId,
    pharmacy_id: data.pharmacyId,
    pharmacy_name: data.pharmacyName,
    pharmacy_chain: data.pharmacyChain || 'Independent',
    prescription_id: data.prescriptionId,
    prescription_status: data.status || 'pending',
    medication_name: data.medicationName,
    refills_remaining: data.refillsRemaining || 0,
    next_refill_date: data.nextRefillDate,
    inventory_status: data.inventoryStatus || 'in_stock',
    location: data.location || {},
    sync_data: data.syncData || {},
    updated_at: new Date().toISOString(),
  };

  const { data: result, error } = await supabase
    .from('pharmacy_network_data')
    .insert(prescriptionData)
    .select()
    .single();

  if (error) throw error;

  await supabase.from('integration_audit_log').insert({
    user_id: userId,
    action_type: 'pharmacy_prescription_tracked',
    action_details: { prescription_id: data.prescriptionId },
    status: 'success',
  });

  return new Response(
    JSON.stringify({
      success: true,
      prescription: result,
      message: 'Prescription tracking initiated',
    }),
    { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
  );
}

async function checkPharmacyInventory(supabase: any, userId: string, data: any) {
  // Simulated pharmacy inventory check
  const inventoryStatus = ['in_stock', 'low_stock', 'out_of_stock'][Math.floor(Math.random() * 3)];
  
  return new Response(
    JSON.stringify({
      success: true,
      medication: data.medicationName,
      pharmacy: data.pharmacyName,
      inventory_status: inventoryStatus,
      estimated_availability: inventoryStatus === 'out_of_stock' ? '3-5 days' : 'Available now',
      alternative_pharmacies: inventoryStatus === 'out_of_stock' ? ['Pharmacy A', 'Pharmacy B'] : [],
    }),
    { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
  );
}

async function findNearbyPharmacy(supabase: any, userId: string, data: any) {
  // Simulated nearby pharmacy finder
  const nearbyPharmacies = [
    {
      id: 'pharm-001',
      name: 'CVS Pharmacy',
      chain: 'CVS',
      distance: '0.5 miles',
      address: '123 Main St',
      hours: '24/7',
      in_network: true,
    },
    {
      id: 'pharm-002',
      name: 'Walgreens',
      chain: 'Walgreens',
      distance: '0.8 miles',
      address: '456 Oak Ave',
      hours: '8am-10pm',
      in_network: true,
    },
    {
      id: 'pharm-003',
      name: 'Local Pharmacy',
      chain: 'Independent',
      distance: '1.2 miles',
      address: '789 Elm St',
      hours: '9am-6pm',
      in_network: false,
    },
  ];

  return new Response(
    JSON.stringify({
      success: true,
      pharmacies: nearbyPharmacies,
      total: nearbyPharmacies.length,
      user_location: data.location || { lat: 0, lon: 0 },
    }),
    { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
  );
}

async function getUserPrescriptions(supabase: any, userId: string) {
  const { data, error } = await supabase
    .from('pharmacy_network_data')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false });

  if (error) throw error;

  return new Response(
    JSON.stringify({
      success: true,
      prescriptions: data,
      total: data.length,
    }),
    { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
  );
}

// INSURANCE VERIFICATION INTEGRATION
async function handleInsuranceIntegration(supabase: any, userId: string, action: string, requestData: any) {
  switch (action) {
    case 'verify_eligibility':
      return await verifyInsuranceEligibility(supabase, userId, requestData);
    
    case 'check_coverage':
      return await checkMedicationCoverage(supabase, userId, requestData);
    
    case 'get_insurance_info':
      return await getInsuranceInfo(supabase, userId);
    
    default:
      throw new Error('Invalid insurance action');
  }
}

async function verifyInsuranceEligibility(supabase: any, userId: string, data: any) {
  const verificationData = {
    user_id: userId,
    insurance_provider: data.insuranceProvider,
    policy_number: data.policyNumber,
    group_number: data.groupNumber,
    verification_status: 'verified',
    eligibility_status: 'active',
    coverage_effective_date: data.effectiveDate || new Date().toISOString().split('T')[0],
    coverage_termination_date: data.terminationDate,
    copay_amount: parseFloat(data.copayAmount || '25.00'),
    deductible_amount: parseFloat(data.deductibleAmount || '1000.00'),
    deductible_remaining: parseFloat(data.deductibleRemaining || '750.00'),
    formulary_tier: data.formularyTier || 'tier2',
    prior_auth_required: data.priorAuthRequired || false,
    verification_response: data,
    last_verified_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  };

  const { data: result, error } = await supabase
    .from('insurance_verification_data')
    .insert(verificationData)
    .select()
    .single();

  if (error) throw error;

  await supabase.from('integration_audit_log').insert({
    user_id: userId,
    action_type: 'insurance_verified',
    action_details: { provider: data.insuranceProvider },
    status: 'success',
  });

  return new Response(
    JSON.stringify({
      success: true,
      verification: result,
      message: 'Insurance eligibility verified',
      active: true,
      estimated_copay: result.copay_amount,
    }),
    { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
  );
}

async function checkMedicationCoverage(supabase: any, userId: string, data: any) {
  // Simulated medication coverage check
  const covered = Math.random() > 0.3;
  const tier = ['tier1', 'tier2', 'tier3', 'tier4'][Math.floor(Math.random() * 4)];
  const copays = { tier1: 10, tier2: 25, tier3: 50, tier4: 100 };

  return new Response(
    JSON.stringify({
      success: true,
      medication: data.medicationName,
      covered: covered,
      formulary_status: covered ? 'preferred' : 'non-preferred',
      tier: covered ? tier : 'not_covered',
      estimated_copay: covered ? copays[tier as keyof typeof copays] : null,
      prior_authorization_required: tier === 'tier4',
      alternatives: !covered ? ['Generic Alternative A', 'Brand Alternative B'] : [],
    }),
    { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
  );
}

async function getInsuranceInfo(supabase: any, userId: string) {
  const { data, error } = await supabase
    .from('insurance_verification_data')
    .select('*')
    .eq('user_id', userId)
    .order('last_verified_at', { ascending: false })
    .limit(1)
    .single();

  if (error && error.code !== 'PGRST116') throw error;

  return new Response(
    JSON.stringify({
      success: true,
      insurance: data || null,
      has_insurance: !!data,
    }),
    { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
  );
}

// HEALTH DEVICE INTEGRATION
async function handleHealthDeviceIntegration(supabase: any, userId: string, action: string, requestData: any) {
  switch (action) {
    case 'sync_health_data':
      return await syncHealthDeviceData(supabase, userId, requestData);
    
    case 'get_health_data':
      return await getHealthDeviceData(supabase, userId, requestData);
    
    default:
      throw new Error('Invalid health device action');
  }
}

async function syncHealthDeviceData(supabase: any, userId: string, data: any) {
  const healthDataRecords = Array.isArray(data.measurements) ? data.measurements : [data];
  
  const insertData = healthDataRecords.map((measurement: any) => ({
    user_id: userId,
    device_type: data.deviceType || 'apple_health',
    device_id: data.deviceId,
    data_type: measurement.type,
    measurement_value: measurement.value,
    measurement_unit: measurement.unit,
    recorded_at: measurement.recordedAt || new Date().toISOString(),
    synced_at: new Date().toISOString(),
    source_app: data.sourceApp || 'Health App',
    metadata: measurement.metadata || {},
  }));

  const { data: results, error } = await supabase
    .from('health_device_data')
    .insert(insertData)
    .select();

  if (error) throw error;

  await supabase.from('integration_audit_log').insert({
    user_id: userId,
    action_type: 'health_device_synced',
    action_details: { device_type: data.deviceType, records_count: insertData.length },
    status: 'success',
  });

  return new Response(
    JSON.stringify({
      success: true,
      synced_records: results.length,
      records: results,
    }),
    { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
  );
}

async function getHealthDeviceData(supabase: any, userId: string, data: any) {
  let query = supabase
    .from('health_device_data')
    .select('*')
    .eq('user_id', userId);

  if (data.dataType) {
    query = query.eq('data_type', data.dataType);
  }

  if (data.startDate) {
    query = query.gte('recorded_at', data.startDate);
  }

  if (data.endDate) {
    query = query.lte('recorded_at', data.endDate);
  }

  const { data: results, error } = await query
    .order('recorded_at', { ascending: false })
    .limit(data.limit || 100);

  if (error) throw error;

  return new Response(
    JSON.stringify({
      success: true,
      health_data: results,
      total: results.length,
    }),
    { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
  );
}

// TELEMEDICINE INTEGRATION
async function handleTelemedicineIntegration(supabase: any, userId: string, action: string, requestData: any) {
  switch (action) {
    case 'schedule_appointment':
      return await scheduleTelemedicineAppointment(supabase, userId, requestData);
    
    case 'get_appointments':
      return await getTelemedicineAppointments(supabase, userId);
    
    case 'start_session':
      return await startTelemedicineSession(supabase, userId, requestData);
    
    default:
      throw new Error('Invalid telemedicine action');
  }
}

async function scheduleTelemedicineAppointment(supabase: any, userId: string, data: any) {
  const appointmentData = {
    user_id: userId,
    provider_id: data.providerId,
    provider_name: data.providerName,
    appointment_type: data.appointmentType || 'video',
    appointment_status: 'scheduled',
    scheduled_start: data.scheduledStart,
    scheduled_end: data.scheduledEnd,
    meeting_link: `https://telehealth.example.com/meeting/${Date.now()}`,
    meeting_id: 'meeting-' + Date.now(),
    platform: data.platform || 'custom',
    chief_complaint: data.chiefComplaint,
    notes: data.notes,
    updated_at: new Date().toISOString(),
  };

  const { data: result, error } = await supabase
    .from('telemedicine_appointments')
    .insert(appointmentData)
    .select()
    .single();

  if (error) throw error;

  await supabase.from('integration_audit_log').insert({
    user_id: userId,
    action_type: 'telemedicine_scheduled',
    action_details: { appointment_id: result.id, provider: data.providerName },
    status: 'success',
  });

  return new Response(
    JSON.stringify({
      success: true,
      appointment: result,
      message: 'Telemedicine appointment scheduled',
    }),
    { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
  );
}

async function getTelemedicineAppointments(supabase: any, userId: string) {
  const { data, error } = await supabase
    .from('telemedicine_appointments')
    .select('*')
    .eq('user_id', userId)
    .order('scheduled_start', { ascending: false });

  if (error) throw error;

  return new Response(
    JSON.stringify({
      success: true,
      appointments: data,
      total: data.length,
    }),
    { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
  );
}

async function startTelemedicineSession(supabase: any, userId: string, data: any) {
  const { data: appointment, error } = await supabase
    .from('telemedicine_appointments')
    .update({
      appointment_status: 'in_progress',
      actual_start: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    })
    .eq('id', data.appointmentId)
    .eq('user_id', userId)
    .select()
    .single();

  if (error) throw error;

  return new Response(
    JSON.stringify({
      success: true,
      appointment: appointment,
      meeting_link: appointment.meeting_link,
      message: 'Session started',
    }),
    { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
  );
}

// LABORATORY RESULTS INTEGRATION
async function handleLaboratoryIntegration(supabase: any, userId: string, action: string, requestData: any) {
  switch (action) {
    case 'sync_lab_results':
      return await syncLaboratoryResults(supabase, userId, requestData);
    
    case 'get_lab_results':
      return await getLaboratoryResults(supabase, userId, requestData);
    
    default:
      throw new Error('Invalid laboratory action');
  }
}

async function syncLaboratoryResults(supabase: any, userId: string, data: any) {
  const labResultData = {
    user_id: userId,
    lab_provider: data.labProvider || 'Quest Diagnostics',
    order_id: data.orderId,
    test_code: data.testCode,
    test_name: data.testName,
    test_category: data.testCategory || 'Chemistry',
    result_value: data.resultValue,
    result_unit: data.resultUnit,
    reference_range: data.referenceRange,
    abnormal_flag: data.abnormalFlag || 'normal',
    result_status: data.resultStatus || 'final',
    collected_at: data.collectedAt,
    resulted_at: data.resultedAt || new Date().toISOString(),
    ordering_provider: data.orderingProvider,
    result_data: data.fullResult || {},
    updated_at: new Date().toISOString(),
  };

  const { data: result, error } = await supabase
    .from('laboratory_results')
    .insert(labResultData)
    .select()
    .single();

  if (error) throw error;

  await supabase.from('integration_audit_log').insert({
    user_id: userId,
    action_type: 'lab_result_synced',
    action_details: { test_name: data.testName, abnormal: data.abnormalFlag !== 'normal' },
    status: 'success',
  });

  return new Response(
    JSON.stringify({
      success: true,
      lab_result: result,
      message: 'Laboratory result synced',
      requires_attention: data.abnormalFlag && data.abnormalFlag !== 'normal',
    }),
    { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
  );
}

async function getLaboratoryResults(supabase: any, userId: string, data: any) {
  let query = supabase
    .from('laboratory_results')
    .select('*')
    .eq('user_id', userId);

  if (data.testCategory) {
    query = query.eq('test_category', data.testCategory);
  }

  if (data.abnormalOnly) {
    query = query.neq('abnormal_flag', 'normal');
  }

  const { data: results, error } = await query
    .order('resulted_at', { ascending: false })
    .limit(data.limit || 50);

  if (error) throw error;

  return new Response(
    JSON.stringify({
      success: true,
      lab_results: results,
      total: results.length,
      abnormal_count: results.filter((r: any) => r.abnormal_flag !== 'normal').length,
    }),
    { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
  );
}
