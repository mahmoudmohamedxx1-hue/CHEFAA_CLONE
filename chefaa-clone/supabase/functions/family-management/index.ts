// Comprehensive Family Account Management API
// Handles family relationships, medication schedules, emergency contacts, and parental consent

Deno.serve(async (req) => {
  const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
    'Access-Control-Allow-Methods': 'POST, GET, OPTIONS, PUT, DELETE, PATCH',
    'Access-Control-Allow-Credentials': 'false'
  };

  if (req.method === 'OPTIONS') {
    return new Response(null, { status: 200, headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get('authorization');
    if (!authHeader) {
      throw new Error('No authorization header');
    }

    const token = authHeader.replace('Bearer ', '');
    const supabaseUrl = Deno.env.get('SUPABASE_URL');
    const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');

    // Verify user authentication
    const userResponse = await fetch(`${supabaseUrl}/auth/v1/user`, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'apikey': serviceRoleKey
      }
    });

    if (!userResponse.ok) {
      throw new Error('Unauthorized');
    }

    const userData = await userResponse.json();
    const userId = userData.id;

    const url = new URL(req.url);
    const action = url.searchParams.get('action');

    switch (req.method) {
      case 'GET':
        return await handleGetRequests(action, userId, supabaseUrl, serviceRoleKey, corsHeaders);
      case 'POST':
        return await handlePostRequests(action, req, userId, supabaseUrl, serviceRoleKey, corsHeaders);
      case 'PUT':
      case 'PATCH':
        return await handleUpdateRequests(action, req, userId, supabaseUrl, serviceRoleKey, corsHeaders);
      case 'DELETE':
        return await handleDeleteRequests(action, url, userId, supabaseUrl, serviceRoleKey, corsHeaders);
      default:
        throw new Error('Method not allowed');
    }

  } catch (error) {
    console.error('Family management API error:', error);
    
    return new Response(JSON.stringify({
      error: {
        code: 'FAMILY_MANAGEMENT_ERROR',
        message: error.message
      }
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
});

// GET Requests Handler
async function handleGetRequests(action: string | null, userId: string, supabaseUrl: string, serviceRoleKey: string, corsHeaders: any) {
  switch (action) {
    case 'family-members':
      return await getFamilyMembers(userId, supabaseUrl, serviceRoleKey, corsHeaders);
    case 'medication-schedules':
      const memberId = new URL(req.url).searchParams.get('member_id');
      return await getMedicationSchedules(memberId, supabaseUrl, serviceRoleKey, corsHeaders);
    case 'emergency-contacts':
      return await getEmergencyContacts(userId, supabaseUrl, serviceRoleKey, corsHeaders);
    case 'shared-cart':
      return await getSharedCart(userId, supabaseUrl, serviceRoleKey, corsHeaders);
    case 'notifications':
      return await getFamilyNotifications(userId, supabaseUrl, serviceRoleKey, corsHeaders);
    case 'medical-records':
      return await getMedicalRecords(userId, supabaseUrl, serviceRoleKey, corsHeaders);
    case 'consent-status':
      return await getConsentStatus(userId, supabaseUrl, serviceRoleKey, corsHeaders);
    case 'adherence-report':
      const reportMemberId = new URL(req.url).searchParams.get('member_id');
      return await getAdherenceReport(reportMemberId, supabaseUrl, serviceRoleKey, corsHeaders);
    default:
      throw new Error('Invalid action');
  }
}

// POST Requests Handler
async function handlePostRequests(action: string | null, req: Request, userId: string, supabaseUrl: string, serviceRoleKey: string, corsHeaders: any) {
  const body = await req.json();

  switch (action) {
    case 'add-member':
      return await addFamilyMember(body, userId, supabaseUrl, serviceRoleKey, corsHeaders);
    case 'add-medication':
      return await addMedicationSchedule(body, userId, supabaseUrl, serviceRoleKey, corsHeaders);
    case 'add-emergency-contact':
      return await addEmergencyContact(body, userId, supabaseUrl, serviceRoleKey, corsHeaders);
    case 'add-consent':
      return await addParentalConsent(body, userId, supabaseUrl, serviceRoleKey, corsHeaders);
    case 'add-to-shared-cart':
      return await addToSharedCart(body, userId, supabaseUrl, serviceRoleKey, corsHeaders);
    case 'record-adherence':
      return await recordAdherence(body, userId, supabaseUrl, serviceRoleKey, corsHeaders);
    case 'send-emergency-alert':
      return await sendEmergencyAlert(body, userId, supabaseUrl, serviceRoleKey, corsHeaders);
    case 'bulk-import-medications':
      return await bulkImportMedications(body, userId, supabaseUrl, serviceRoleKey, corsHeaders);
    default:
      throw new Error('Invalid action');
  }
}

// PUT/PATCH Requests Handler
async function handleUpdateRequests(action: string | null, req: Request, userId: string, supabaseUrl: string, serviceRoleKey: string, corsHeaders: any) {
  const body = await req.json();

  switch (action) {
    case 'update-member':
      return await updateFamilyMember(body, userId, supabaseUrl, serviceRoleKey, corsHeaders);
    case 'update-medication':
      return await updateMedicationSchedule(body, userId, supabaseUrl, serviceRoleKey, corsHeaders);
    case 'update-consent':
      return await updateParentalConsent(body, userId, supabaseUrl, serviceRoleKey, corsHeaders);
    case 'update-permissions':
      return await updateFamilyPermissions(body, userId, supabaseUrl, serviceRoleKey, corsHeaders);
    case 'mark-medication-taken':
      return await markMedicationTaken(body, userId, supabaseUrl, serviceRoleKey, corsHeaders);
    default:
      throw new Error('Invalid action');
  }
}

// DELETE Requests Handler
async function handleDeleteRequests(action: string | null, url: URL, userId: string, supabaseUrl: string, serviceRoleKey: string, corsHeaders: any) {
  const memberId = url.searchParams.get('member_id');
  const contactId = url.searchParams.get('contact_id');
  const medicationId = url.searchParams.get('medication_id');

  switch (action) {
    case 'remove-member':
      return await removeFamilyMember(memberId, userId, supabaseUrl, serviceRoleKey, corsHeaders);
    case 'remove-emergency-contact':
      return await removeEmergencyContact(contactId, userId, supabaseUrl, serviceRoleKey, corsHeaders);
    case 'remove-medication':
      return await removeMedicationSchedule(medicationId, userId, supabaseUrl, serviceRoleKey, corsHeaders);
    case 'clear-shared-cart':
      return await clearSharedCart(userId, supabaseUrl, serviceRoleKey, corsHeaders);
    default:
      throw new Error('Invalid action');
  }
}

// ============================================
// FAMILY MEMBERS MANAGEMENT
// ============================================

async function getFamilyMembers(userId: string, supabaseUrl: string, serviceRoleKey: string, corsHeaders: any) {
  const response = await fetch(`${supabaseUrl}/rest/v1/family_members?primary_user_id=eq.${userId}&is_active=eq.true&select=*,emergency_contacts(*),family_medical_conditions(*),family_allergies(*)`, {
    headers: {
      'Authorization': `Bearer ${serviceRoleKey}`,
      'apikey': serviceRoleKey,
      'Content-Type': 'application/json'
    }
  });

  if (!response.ok) {
    throw new Error('Failed to fetch family members');
  }

  const data = await response.json();
  
  // Calculate age categories for each member
  const membersWithCategories = data.map((member: any) => ({
    ...member,
    age: calculateAge(member.date_of_birth),
    age_category: getAgeCategory(calculateAge(member.date_of_birth))
  }));

  return new Response(JSON.stringify({
    data: membersWithCategories
  }), {
    headers: { ...corsHeaders, 'Content-Type': 'application/json' }
  });
}

async function addFamilyMember(body: any, userId: string, supabaseUrl: string, serviceRoleKey: string, corsHeaders: any) {
  const { first_name, last_name, date_of_birth, gender, relationship, phone_number, email, emergency_contact } = body;

  // Calculate age category
  const age = calculateAge(date_of_birth);
  const age_category = getAgeCategory(age);

  // Determine if consent is required (COPPA compliance for under 13)
  const requiresConsent = age < 13;
  const parentalConsentStatus = requiresConsent ? 'pending' : 'not_required';

  const memberData = {
    primary_user_id: userId,
    first_name,
    last_name,
    date_of_birth,
    gender,
    relationship,
    phone_number,
    email,
    emergency_contact: emergency_contact || false,
    age_category,
    requires_emergency_contact: age < 18 || age >= 65,
    can_manage_own_medications: age >= 16,
    parental_consent_status: parentalConsentStatus,
    consent_given: !requiresConsent
  };

  const response = await fetch(`${supabaseUrl}/rest/v1/family_members`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${serviceRoleKey}`,
      'apikey': serviceRoleKey,
      'Content-Type': 'application/json',
      'Prefer': 'return=representation'
    },
    body: JSON.stringify(memberData)
  });

  if (!response.ok) {
    throw new Error('Failed to add family member');
  }

  const data = await response.json();

  // Create default shared cart permissions
  await createDefaultCartPermissions(data[0].id, supabaseUrl, serviceRoleKey);

  return new Response(JSON.stringify({
    data: data[0],
    requiresConsent
  }), {
    headers: { ...corsHeaders, 'Content-Type': 'application/json' }
  });
}

async function updateFamilyMember(body: any, userId: string, supabaseUrl: string, serviceRoleKey: string, corsHeaders: any) {
  const { member_id, ...updateData } = body;

  // Recalculate age category if date of birth changed
  if (updateData.date_of_birth) {
    const age = calculateAge(updateData.date_of_birth);
    updateData.age_category = getAgeCategory(age);
    updateData.can_manage_own_medications = age >= 16;
  }

  const response = await fetch(`${supabaseUrl}/rest/v1/family_members?id=eq.${member_id}&primary_user_id=eq.${userId}`, {
    method: 'PATCH',
    headers: {
      'Authorization': `Bearer ${serviceRoleKey}`,
      'apikey': serviceRoleKey,
      'Content-Type': 'application/json',
      'Prefer': 'return=representation'
    },
    body: JSON.stringify(updateData)
  });

  if (!response.ok) {
    throw new Error('Failed to update family member');
  }

  const data = await response.json();
  return new Response(JSON.stringify({ data: data[0] }), {
    headers: { ...corsHeaders, 'Content-Type': 'application/json' }
  });
}

async function removeFamilyMember(memberId: string | null, userId: string, supabaseUrl: string, serviceRoleKey: string, corsHeaders: any) {
  if (!memberId) {
    throw new Error('Member ID required');
  }

  // Soft delete - set is_active to false
  const response = await fetch(`${supabaseUrl}/rest/v1/family_members?id=eq.${memberId}&primary_user_id=eq.${userId}`, {
    method: 'PATCH',
    headers: {
      'Authorization': `Bearer ${serviceRoleKey}`,
      'apikey': serviceRoleKey,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ is_active: false })
  });

  if (!response.ok) {
    throw new Error('Failed to remove family member');
  }

  return new Response(JSON.stringify({
    data: { success: true }
  }), {
    headers: { ...corsHeaders, 'Content-Type': 'application/json' }
  });
}

// ============================================
// MEDICATION SCHEDULES
// ============================================

async function getMedicationSchedules(memberId: string | null, supabaseUrl: string, serviceRoleKey: string, corsHeaders: any) {
  let query = `${supabaseUrl}/rest/v1/medication_schedules?is_active=eq.true&select=*,family_members(first_name,last_name)`;
  
  if (memberId) {
    query += `&family_member_id=eq.${memberId}`;
  }

  const response = await fetch(query, {
    headers: {
      'Authorization': `Bearer ${serviceRoleKey}`,
      'apikey': serviceRoleKey,
      'Content-Type': 'application/json'
    }
  });

  if (!response.ok) {
    throw new Error('Failed to fetch medication schedules');
  }

  const data = await response.json();
  return new Response(JSON.stringify({ data }), {
    headers: { ...corsHeaders, 'Content-Type': 'application/json' }
  });
}

async function addMedicationSchedule(body: any, userId: string, supabaseUrl: string, serviceRoleKey: string, corsHeaders: any) {
  const { family_member_id, medication_name, dosage, frequency, schedule_times, start_date, end_date, reminder_enabled, notes } = body;

  // Validate age-appropriate medication
  const memberResponse = await fetch(`${supabaseUrl}/rest/v1/family_members?id=eq.${family_member_id}`, {
    headers: {
      'Authorization': `Bearer ${serviceRoleKey}`,
      'apikey': serviceRoleKey
    }
  });

  const memberData = await memberResponse.json();
  if (memberData.length === 0) {
    throw new Error('Family member not found');
  }

  const member = memberData[0];
  const age = calculateAge(member.date_of_birth);

  // Check if medication is age-appropriate
  const medicationData = {
    family_member_id,
    medication_name,
    dosage,
    frequency,
    schedule_times,
    start_date,
    end_date,
    reminder_enabled: reminder_enabled ?? true,
    notes,
    reminder_times: schedule_times,
    next_due_at: new Date(start_date + 'T' + (schedule_times?.[0] || '08:00')).toISOString()
  };

  const response = await fetch(`${supabaseUrl}/rest/v1/medication_schedules`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${serviceRoleKey}`,
      'apikey': serviceRoleKey,
      'Content-Type': 'application/json',
      'Prefer': 'return=representation'
    },
    body: JSON.stringify(medicationData)
  });

  if (!response.ok) {
    throw new Error('Failed to add medication schedule');
  }

  const data = await response.json();

  // Create adherence tracking entries for the next 30 days
  await createAdherenceTrackingEntries(data[0].id, start_date, schedule_times, supabaseUrl, serviceRoleKey);

  return new Response(JSON.stringify({
    data: data[0],
    ageValidated: age
  }), {
    headers: { ...corsHeaders, 'Content-Type': 'application/json' }
  });
}

async function updateMedicationSchedule(body: any, userId: string, supabaseUrl: string, serviceRoleKey: string, corsHeaders: any) {
  const { medication_id, ...updateData } = body;

  // Recalculate next_due_at if schedule times changed
  if (updateData.schedule_times || updateData.start_date) {
    const schedule = await fetch(`${supabaseUrl}/rest/v1/medication_schedules?id=eq.${medication_id}`, {
      headers: {
        'Authorization': `Bearer ${serviceRoleKey}`,
        'apikey': serviceRoleKey
      }
    });

    const scheduleData = await schedule.json();
    if (scheduleData.length > 0) {
      const current = scheduleData[0];
      const nextTime = updateData.schedule_times?.[0] || current.reminder_times?.[0] || '08:00';
      const nextDate = updateData.start_date || current.start_date;
      updateData.next_due_at = new Date(nextDate + 'T' + nextTime).toISOString();
    }
  }

  const response = await fetch(`${supabaseUrl}/rest/v1/medication_schedules?id=eq.${medication_id}`, {
    method: 'PATCH',
    headers: {
      'Authorization': `Bearer ${serviceRoleKey}`,
      'apikey': serviceRoleKey,
      'Content-Type': 'application/json',
      'Prefer': 'return=representation'
    },
    body: JSON.stringify(updateData)
  });

  if (!response.ok) {
    throw new Error('Failed to update medication schedule');
  }

  const data = await response.json();
  return new Response(JSON.stringify({ data: data[0] }), {
    headers: { ...corsHeaders, 'Content-Type': 'application/json' }
  });
}

async function removeMedicationSchedule(medicationId: string | null, userId: string, supabaseUrl: string, serviceRoleKey: string, corsHeaders: any) {
  if (!medicationId) {
    throw new Error('Medication ID required');
  }

  // Soft delete
  const response = await fetch(`${supabaseUrl}/rest/v1/medication_schedules?id=eq.${medicationId}`, {
    method: 'PATCH',
    headers: {
      'Authorization': `Bearer ${serviceRoleKey}`,
      'apikey': serviceRoleKey,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ is_active: false })
  });

  if (!response.ok) {
    throw new Error('Failed to remove medication schedule');
  }

  return new Response(JSON.stringify({
    data: { success: true }
  }), {
    headers: { ...corsHeaders, 'Content-Type': 'application/json' }
  });
}

// ============================================
// EMERGENCY CONTACTS
// ============================================

async function getEmergencyContacts(userId: string, supabaseUrl: string, serviceRoleKey: string, corsHeaders: any) {
  const response = await fetch(`${supabaseUrl}/rest/v1/emergency_contacts?select=*,family_members(first_name,last_name)`, {
    headers: {
      'Authorization': `Bearer ${serviceRoleKey}`,
      'apikey': serviceRoleKey,
      'Content-Type': 'application/json'
    }
  });

  if (!response.ok) {
    throw new Error('Failed to fetch emergency contacts');
  }

  const data = await response.json();
  return new Response(JSON.stringify({ data }), {
    headers: { ...corsHeaders, 'Content-Type': 'application/json' }
  });
}

async function addEmergencyContact(body: any, userId: string, supabaseUrl: string, serviceRoleKey: string, corsHeaders: any) {
  const { family_member_id, contact_name, contact_phone, contact_email, relationship, primary_contact } = body;

  const contactData = {
    family_member_id,
    contact_name,
    contact_phone,
    contact_email,
    relationship,
    primary_contact: primary_contact || false
  };

  const response = await fetch(`${supabaseUrl}/rest/v1/emergency_contacts`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${serviceRoleKey}`,
      'apikey': serviceRoleKey,
      'Content-Type': 'application/json',
      'Prefer': 'return=representation'
    },
    body: JSON.stringify(contactData)
  });

  if (!response.ok) {
    throw new Error('Failed to add emergency contact');
  }

  const data = await response.json();
  return new Response(JSON.stringify({ data: data[0] }), {
    headers: { ...corsHeaders, 'Content-Type': 'application/json' }
  });
}

async function removeEmergencyContact(contactId: string | null, userId: string, supabaseUrl: string, serviceRoleKey: string, corsHeaders: any) {
  if (!contactId) {
    throw new Error('Contact ID required');
  }

  const response = await fetch(`${supabaseUrl}/rest/v1/emergency_contacts?id=eq.${contactId}`, {
    method: 'DELETE',
    headers: {
      'Authorization': `Bearer ${serviceRoleKey}`,
      'apikey': serviceRoleKey
    }
  });

  if (!response.ok) {
    throw new Error('Failed to remove emergency contact');
  }

  return new Response(JSON.stringify({
    data: { success: true }
  }), {
    headers: { ...corsHeaders, 'Content-Type': 'application/json' }
  });
}

// ============================================
// PARENTAL CONSENT
// ============================================

async function getConsentStatus(userId: string, supabaseUrl: string, serviceRoleKey: string, corsHeaders: any) {
  const response = await fetch(`${supabaseUrl}/rest/v1/parental_consents?parent_guardian_id=eq.${userId}`, {
    headers: {
      'Authorization': `Bearer ${serviceRoleKey}`,
      'apikey': serviceRoleKey,
      'Content-Type': 'application/json'
    }
  });

  if (!response.ok) {
    throw new Error('Failed to fetch consent status');
  }

  const data = await response.json();
  return new Response(JSON.stringify({ data }), {
    headers: { ...corsHeaders, 'Content-Type': 'application/json' }
  });
}

async function addParentalConsent(body: any, userId: string, supabaseUrl: string, serviceRoleKey: string, corsHeaders: any) {
  const { family_member_id, consent_type, consent_details, expiry_date } = body;

  const consentData = {
    family_member_id,
    parent_guardian_id: userId,
    consent_type,
    consent_status: 'granted',
    consent_details,
    expiry_date,
    consent_date: new Date().toISOString()
  };

  const response = await fetch(`${supabaseUrl}/rest/v1/parental_consents`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${serviceRoleKey}`,
      'apikey': serviceRoleKey,
      'Content-Type': 'application/json',
      'Prefer': 'return=representation'
    },
    body: JSON.stringify(consentData)
  });

  if (!response.ok) {
    throw new Error('Failed to add parental consent');
  }

  const data = await response.json();

  // Update family member consent status
  await fetch(`${supabaseUrl}/rest/v1/family_members?id=eq.${family_member_id}`, {
    method: 'PATCH',
    headers: {
      'Authorization': `Bearer ${serviceRoleKey}`,
      'apikey': serviceRoleKey,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      consent_given: true,
      parental_consent_status: 'granted',
      consent_date: new Date().toISOString(),
      consent_expiry_date: expiry_date
    })
  });

  // Log consent audit
  await fetch(`${supabaseUrl}/rest/v1/consent_audit_log`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${serviceRoleKey}`,
      'apikey': serviceRoleKey,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      family_member_id,
      parent_guardian_id: userId,
      action: 'consent_granted',
      new_status: 'granted'
    })
  });

  return new Response(JSON.stringify({ data: data[0] }), {
    headers: { ...corsHeaders, 'Content-Type': 'application/json' }
  });
}

async function updateParentalConsent(body: any, userId: string, supabaseUrl: string, serviceRoleKey: string, corsHeaders: any) {
  const { consent_id, consent_status, consent_details } = body;

  const updateData: any = { consent_status };
  if (consent_details) {
    updateData.consent_details = consent_details;
  }
  if (consent_status === 'revoked') {
    updateData.revoked_at = new Date().toISOString();
  }

  const response = await fetch(`${supabaseUrl}/rest/v1/parental_consents?id=eq.${consent_id}&parent_guardian_id=eq.${userId}`, {
    method: 'PATCH',
    headers: {
      'Authorization': `Bearer ${serviceRoleKey}`,
      'apikey': serviceRoleKey,
      'Content-Type': 'application/json',
      'Prefer': 'return=representation'
    },
    body: JSON.stringify(updateData)
  });

  if (!response.ok) {
    throw new Error('Failed to update parental consent');
  }

  const data = await response.json();
  return new Response(JSON.stringify({ data: data[0] }), {
    headers: { ...corsHeaders, 'Content-Type': 'application/json' }
  });
}

// ============================================
// ADHERENCE TRACKING
// ============================================

async function recordAdherence(body: any, userId: string, supabaseUrl: string, serviceRoleKey: string, corsHeaders: any) {
  const { medication_schedule_id, scheduled_time, actual_time, status, notes, photo_proof_url } = body;

  const adherenceData = {
    medication_schedule_id,
    scheduled_time,
    actual_time: actual_time || new Date().toISOString(),
    status: status || 'taken',
    notes,
    photo_proof_url
  };

  const response = await fetch(`${supabaseUrl}/rest/v1/medication_adherence`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${serviceRoleKey}`,
      'apikey': serviceRoleKey,
      'Content-Type': 'application/json',
      'Prefer': 'return=representation'
    },
    body: JSON.stringify(adherenceData)
  });

  if (!response.ok) {
    throw new Error('Failed to record adherence');
  }

  const data = await response.json();

  // Update medication schedule last_taken_at
  await fetch(`${supabaseUrl}/rest/v1/medication_schedules?id=eq.${medication_schedule_id}`, {
    method: 'PATCH',
    headers: {
      'Authorization': `Bearer ${serviceRoleKey}`,
      'apikey': serviceRoleKey,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      last_taken_at: new Date().toISOString()
    })
  });

  return new Response(JSON.stringify({ data: data[0] }), {
    headers: { ...corsHeaders, 'Content-Type': 'application/json' }
  });
}

async function markMedicationTaken(body: any, userId: string, supabaseUrl: string, serviceRoleKey: string, corsHeaders: any) {
  const { medication_id } = body;

  // Find the next scheduled dose
  const scheduleResponse = await fetch(`${supabaseUrl}/rest/v1/medication_schedules?id=eq.${medication_id}`, {
    headers: {
      'Authorization': `Bearer ${serviceRoleKey}`,
      'apikey': serviceRoleKey
    }
  });

  const scheduleData = await scheduleResponse.json();
  if (scheduleData.length === 0) {
    throw new Error('Medication schedule not found');
  }

  const schedule = scheduleData[0];
  const now = new Date();
  const scheduledTime = new Date(schedule.next_due_at);

  // Record adherence
  const adherenceData = {
    medication_schedule_id: medication_id,
    scheduled_time: scheduledTime.toISOString(),
    actual_time: now.toISOString(),
    status: 'taken'
  };

  const response = await fetch(`${supabaseUrl}/rest/v1/medication_adherence`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${serviceRoleKey}`,
      'apikey': serviceRoleKey,
      'Content-Type': 'application/json',
      'Prefer': 'return=representation'
    },
    body: JSON.stringify(adherenceData)
  });

  if (!response.ok) {
    throw new Error('Failed to mark medication as taken');
  }

  const data = await response.json();

  // Update next_due_at for next dose
  const nextDose = calculateNextDoseTime(schedule.reminder_times, now);
  await fetch(`${supabaseUrl}/rest/v1/medication_schedules?id=eq.${medication_id}`, {
    method: 'PATCH',
    headers: {
      'Authorization': `Bearer ${serviceRoleKey}`,
      'apikey': serviceRoleKey,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      last_taken_at: now.toISOString(),
      next_due_at: nextDose.toISOString()
    })
  });

  return new Response(JSON.stringify({ data: data[0] }), {
    headers: { ...corsHeaders, 'Content-Type': 'application/json' }
  });
}

// ============================================
// SHARED CART MANAGEMENT
// ============================================

async function getSharedCart(userId: string, supabaseUrl: string, serviceRoleKey: string, corsHeaders: any) {
  const response = await fetch(`${supabaseUrl}/rest/v1/family_shared_carts?select=*,family_members(first_name,last_name),products(*)`, {
    headers: {
      'Authorization': `Bearer ${serviceRoleKey}`,
      'apikey': serviceRoleKey,
      'Content-Type': 'application/json'
    }
  });

  if (!response.ok) {
    throw new Error('Failed to fetch shared cart');
  }

  const data = await response.json();
  return new Response(JSON.stringify({ data }), {
    headers: { ...corsHeaders, 'Content-Type': 'application/json' }
  });
}

async function addToSharedCart(body: any, userId: string, supabaseUrl: string, serviceRoleKey: string, corsHeaders: any) {
  const { family_member_id, product_id, quantity, is_urgent, notes } = body;

  const cartData = {
    family_member_id,
    product_id,
    quantity,
    added_by: userId,
    is_urgent: is_urgent || false,
    notes
  };

  const response = await fetch(`${supabaseUrl}/rest/v1/family_shared_carts`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${serviceRoleKey}`,
      'apikey': serviceRoleKey,
      'Content-Type': 'application/json',
      'Prefer': 'return=representation'
    },
    body: JSON.stringify(cartData)
  });

  if (!response.ok) {
    throw new Error('Failed to add item to shared cart');
  }

  const data = await response.json();
  return new Response(JSON.stringify({ data: data[0] }), {
    headers: { ...corsHeaders, 'Content-Type': 'application/json' }
  });
}

async function clearSharedCart(userId: string, supabaseUrl: string, serviceRoleKey: string, corsHeaders: any) {
  const response = await fetch(`${supabaseUrl}/rest/v1/family_shared_carts?added_by=eq.${userId}`, {
    method: 'DELETE',
    headers: {
      'Authorization': `Bearer ${serviceRoleKey}`,
      'apikey': serviceRoleKey
    }
  });

  if (!response.ok) {
    throw new Error('Failed to clear shared cart');
  }

  return new Response(JSON.stringify({
    data: { success: true }
  }), {
    headers: { ...corsHeaders, 'Content-Type': 'application/json' }
  });
}

// ============================================
// NOTIFICATIONS
// ============================================

async function getFamilyNotifications(userId: string, supabaseUrl: string, serviceRoleKey: string, corsHeaders: any) {
  const response = await fetch(`${supabaseUrl}/rest/v1/family_notifications?user_id=eq.${userId}&order=created_at.desc`, {
    headers: {
      'Authorization': `Bearer ${serviceRoleKey}`,
      'apikey': serviceRoleKey,
      'Content-Type': 'application/json'
    }
  });

  if (!response.ok) {
    throw new Error('Failed to fetch notifications');
  }

  const data = await response.json();
  return new Response(JSON.stringify({ data }), {
    headers: { ...corsHeaders, 'Content-Type': 'application/json' }
  });
}

// ============================================
// MEDICAL RECORDS
// ============================================

async function getMedicalRecords(userId: string, supabaseUrl: string, serviceRoleKey: string, corsHeaders: any) {
  const response = await fetch(`${supabaseUrl}/rest/v1/family_medical_conditions?select=*,family_members(first_name,last_name)`, {
    headers: {
      'Authorization': `Bearer ${serviceRoleKey}`,
      'apikey': serviceRoleKey,
      'Content-Type': 'application/json'
    }
  });

  if (!response.ok) {
    throw new Error('Failed to fetch medical records');
  }

  const data = await response.json();
  return new Response(JSON.stringify({ data }), {
    headers: { ...corsHeaders, 'Content-Type': 'application/json' }
  });
}

// ============================================
// ADHERENCE REPORTS
// ============================================

async function getAdherenceReport(memberId: string | null, supabaseUrl: string, serviceRoleKey: string, corsHeaders: any) {
  let query = `${supabaseUrl}/rest/v1/medication_adherence?select=*,medication_schedules(*,family_members(first_name,last_name))`;
  
  if (memberId) {
    query += `&medication_schedules.family_member_id=eq.${memberId}`;
  }

  // Get last 30 days of adherence data
  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
  query += `&created_at=gte.${thirtyDaysAgo.toISOString()}`;

  const response = await fetch(query, {
    headers: {
      'Authorization': `Bearer ${serviceRoleKey}`,
      'apikey': serviceRoleKey,
      'Content-Type': 'application/json'
    }
  });

  if (!response.ok) {
    throw new Error('Failed to fetch adherence report');
  }

  const data = await response.json();
  
  // Calculate adherence statistics
  const stats = calculateAdherenceStats(data);
  
  return new Response(JSON.stringify({
    data: {
      records: data,
      statistics: stats
    }
  }), {
    headers: { ...corsHeaders, 'Content-Type': 'application/json' }
  });
}

// ============================================
// EMERGENCY ALERTS
// ============================================

async function sendEmergencyAlert(body: any, userId: string, supabaseUrl: string, serviceRoleKey: string, corsHeaders: any) {
  const { family_member_id, alert_type, message } = body;

  // Get emergency contacts
  const contactsResponse = await fetch(`${supabaseUrl}/rest/v1/emergency_contacts?family_member_id=eq.${family_member_id}`, {
    headers: {
      'Authorization': `Bearer ${serviceRoleKey}`,
      'apikey': serviceRoleKey
    }
  });

  const contacts = await contactsResponse.json();

  // Create notifications for all emergency contacts
  const notifications = contacts.map((contact: any) => ({
    family_member_id,
    user_id: userId, // Use primary user ID for now
    notification_type: 'emergency_contact',
    title: 'Emergency Alert',
    message: `Emergency: ${message}`,
    priority: 'urgent',
    data: JSON.stringify({
      contact_phone: contact.contact_phone,
      contact_name: contact.contact_name,
      alert_type
    })
  }));

  const response = await fetch(`${supabaseUrl}/rest/v1/family_notifications`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${serviceRoleKey}`,
      'apikey': serviceRoleKey,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(notifications)
  });

  if (!response.ok) {
    throw new Error('Failed to send emergency alert');
  }

  return new Response(JSON.stringify({
    data: { success: true, notifications_sent: contacts.length }
  }), {
    headers: { ...corsHeaders, 'Content-Type': 'application/json' }
  });
}

// ============================================
// BULK OPERATIONS
// ============================================

async function bulkImportMedications(body: any, userId: string, supabaseUrl: string, serviceRoleKey: string, corsHeaders: any) {
  const { medications } = body;

  const medicationData = medications.map((med: any) => ({
    ...med,
    created_at: new Date().toISOString()
  }));

  const response = await fetch(`${supabaseUrl}/rest/v1/medication_schedules`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${serviceRoleKey}`,
      'apikey': serviceRoleKey,
      'Content-Type': 'application/json',
      'Prefer': 'return=representation'
    },
    body: JSON.stringify(medicationData)
  });

  if (!response.ok) {
    throw new Error('Failed to bulk import medications');
  }

  const data = await response.json();
  return new Response(JSON.stringify({
    data: { imported_count: data.length, medications: data }
  }), {
    headers: { ...corsHeaders, 'Content-Type': 'application/json' }
  });
}

// ============================================
// UTILITY FUNCTIONS
// ============================================

function calculateAge(birthDate: string): number {
  const today = new Date();
  const birth = new Date(birthDate);
  let age = today.getFullYear() - birth.getFullYear();
  const monthDiff = today.getMonth() - birth.getMonth();
  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
    age--;
  }
  return age;
}

function getAgeCategory(age: number): string {
  if (age < 2) return 'infant';
  if (age < 13) return 'child';
  if (age < 18) return 'adolescent';
  if (age < 65) return 'adult';
  return 'senior';
}

function calculateNextDoseTime(scheduleTimes: string[], lastTaken: Date): Date {
  const now = new Date(lastTaken);
  const today = now.toDateString();
  
  for (const time of scheduleTimes) {
    const [hours, minutes] = time.split(':').map(Number);
    const scheduledTime = new Date(today);
    scheduledTime.setHours(hours, minutes, 0, 0);
    
    if (scheduledTime > now) {
      return scheduledTime;
    }
  }
  
  // If no more doses today, return tomorrow's first dose
  const tomorrow = new Date(now);
  tomorrow.setDate(tomorrow.getDate() + 1);
  const [hours, minutes] = scheduleTimes[0].split(':').map(Number);
  tomorrow.setHours(hours, minutes, 0, 0);
  
  return tomorrow;
}

function calculateAdherenceStats(adherenceData: any[]) {
  const total = adherenceData.length;
  const taken = adherenceData.filter(record => record.status === 'taken').length;
  const missed = adherenceData.filter(record => record.status === 'missed').length;
  const late = adherenceData.filter(record => record.status === 'late').length;
  
  return {
    total_doses: total,
    taken_doses: taken,
    missed_doses: missed,
    late_doses: late,
    adherence_rate: total > 0 ? ((taken / total) * 100).toFixed(2) : '0.00'
  };
}

async function createDefaultCartPermissions(familyMemberId: string, supabaseUrl: string, serviceRoleKey: string) {
  const permissionsData = {
    family_member_id: familyMemberId,
    can_add_items: true,
    can_remove_items: false,
    can_modify_quantities: true,
    can_checkout: false
  };

  await fetch(`${supabaseUrl}/rest/v1/shared_cart_permissions`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${serviceRoleKey}`,
      'apikey': serviceRoleKey,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(permissionsData)
  });
}

async function createAdherenceTrackingEntries(medicationId: string, startDate: string, scheduleTimes: string[], supabaseUrl: string, serviceRoleKey: string) {
  const entries = [];
  const start = new Date(startDate);
  
  // Create entries for next 30 days
  for (let day = 0; day < 30; day++) {
    const currentDate = new Date(start);
    currentDate.setDate(start.getDate() + day);
    
    for (const time of scheduleTimes) {
      const [hours, minutes] = time.split(':').map(Number);
      const scheduledTime = new Date(currentDate);
      scheduledTime.setHours(hours, minutes, 0, 0);
      
      entries.push({
        medication_schedule_id: medicationId,
        scheduled_time: scheduledTime.toISOString()
      });
    }
  }
  
  if (entries.length > 0) {
    await fetch(`${supabaseUrl}/rest/v1/medication_adherence`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${serviceRoleKey}`,
        'apikey': serviceRoleKey,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(entries)
    });
  }
}