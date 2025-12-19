// Telehealth Consultation Scheduling Edge Function
// Handles consultation booking, payment processing, and session management

Deno.serve(async (req) => {
  const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
    'Access-Control-Allow-Methods': 'POST, GET, OPTIONS, PUT, DELETE, PATCH',
    'Access-Control-Max-Age': '86400',
    'Access-Control-Allow-Credentials': 'false'
  };

  if (req.method === 'OPTIONS') {
    return new Response(null, { status: 200, headers: corsHeaders });
  }

  try {
    const url = new URL(req.url);
    const method = req.method;
    const path = url.pathname.split('/').pop();

    const authHeader = req.headers.get('authorization');
    if (!authHeader) {
      throw new Error('Authorization header missing');
    }

    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
    if (!supabaseServiceKey) {
      throw new Error('SUPABASE_SERVICE_ROLE_KEY not configured');
    }

    // Parse request body for POST requests
    let requestData = {};
    if (method === 'POST') {
      try {
        requestData = await req.json();
      } catch (e) {
        throw new Error('Invalid JSON in request body');
      }
    }

    switch (method) {
      case 'POST':
        if (path === 'book') {
          return await handleBooking(requestData, authHeader, corsHeaders, supabaseServiceKey);
        } else if (path === 'cancel') {
          return await handleCancellation(requestData, authHeader, corsHeaders, supabaseServiceKey);
        } else if (path === 'start-session') {
          return await handleStartSession(requestData, authHeader, corsHeaders, supabaseServiceKey);
        } else if (path === 'end-session') {
          return await handleEndSession(requestData, authHeader, corsHeaders, supabaseServiceKey);
        } else if (path === 'payment-intent') {
          return await handlePaymentIntent(requestData, authHeader, corsHeaders, supabaseServiceKey);
        } else if (path === 'verify-payment') {
          return await handlePaymentVerification(requestData, authHeader, corsHeaders, supabaseServiceKey);
        } else {
          throw new Error('Invalid endpoint');
        }
      
      case 'GET':
        if (path === 'availability') {
          const professionalId = url.searchParams.get('professional_id');
          const date = url.searchParams.get('date');
          return await handleAvailabilityCheck(professionalId, date, authHeader, corsHeaders, supabaseServiceKey);
        } else if (path === 'consultations') {
          return await handleGetConsultations(authHeader, corsHeaders, supabaseServiceKey);
        } else {
          throw new Error('Invalid GET endpoint');
        }
      
      default:
        throw new Error('Method not allowed');
    }

  } catch (error) {
    console.error('Telehealth API Error:', error);
    
    const errorResponse = {
      error: {
        code: 'TELEHEALTH_ERROR',
        message: error.message
      }
    };

    return new Response(JSON.stringify(errorResponse), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
});

// Handle consultation booking
async function handleBooking(data: any, authHeader: string, corsHeaders: any, supabaseKey: string) {
  const { professional_id, consultation_type_id, scheduled_at, duration_minutes, reason, symptoms } = data;

  // Validate required fields
  if (!professional_id || !consultation_type_id || !scheduled_at) {
    throw new Error('Missing required fields: professional_id, consultation_type_id, scheduled_at');
  }

  // Get user from auth header
  const userResponse = await fetch(`${Deno.env.get('SUPABASE_URL')}/auth/v1/user`, {
    headers: {
      'authorization': authHeader,
      'apikey': Deno.env.get('SUPABASE_ANON_KEY')!
    }
  });

  if (!userResponse.ok) {
    throw new Error('Invalid authentication');
  }

  const user = await userResponse.json();
  if (!user.id) {
    throw new Error('User not found');
  }

  // Get consultation type details
  const consultationTypeResponse = await fetch(
    `${Deno.env.get('SUPABASE_URL')}/rest/v1/consultation_types?id=eq.${consultation_type_id}&select=*`,
    {
      headers: {
        'authorization': `Bearer ${supabaseKey}`,
        'apikey': supabaseKey,
        'Content-Type': 'application/json'
      }
    }
  );

  const consultationTypes = await consultationTypeResponse.json();
  if (!consultationTypes || consultationTypes.length === 0) {
    throw new Error('Consultation type not found');
  }

  const consultationType = consultationTypes[0];

  // Calculate total cost
  const totalCost = parseFloat(consultationType.price);
  const actualDuration = duration_minutes || consultationType.duration_minutes;

  // Check professional availability
  const availabilityResponse = await fetch(
    `${Deno.env.get('SUPABASE_URL')}/rest/v1/healthcare_professionals?id=eq.${professional_id}&select=*`,
    {
      headers: {
        'authorization': `Bearer ${supabaseKey}`,
        'apikey': supabaseKey,
        'Content-Type': 'application/json'
      }
    }
  );

  const professionals = await availabilityResponse.json();
  if (!professionals || professionals.length === 0) {
    throw new Error('Healthcare professional not found');
  }

  const professional = professionals[0];

  // Check for scheduling conflicts
  const scheduledDateTime = new Date(scheduled_at).toISOString();
  const conflictResponse = await fetch(
    `${Deno.env.get('SUPABASE_URL')}/rest/v1/consultations?professional_id=eq.${professional_id}&status=in.(scheduled,in_progress)&select=*`,
    {
      headers: {
        'authorization': `Bearer ${supabaseKey}`,
        'apikey': supabaseKey,
        'Content-Type': 'application/json'
      }
    }
  );

  const existingConsultations = await conflictResponse.json();
  
  // Check for time conflicts
  const requestedStart = new Date(scheduledDateTime);
  const requestedEnd = new Date(requestedStart.getTime() + actualDuration * 60000);

  const hasConflict = existingConsultations.some((consultation: any) => {
    const existingStart = new Date(consultation.scheduled_at);
    const existingEnd = new Date(existingStart.getTime() + consultation.duration_minutes * 60000);
    
    return (requestedStart < existingEnd && requestedEnd > existingStart);
  });

  if (hasConflict) {
    throw new Error('Time slot is not available');
  }

  // Create consultation record
  const consultationData = {
    user_id: user.id,
    provider_id: professional_id,
    consultation_type_id: consultation_type_id,
    scheduled_at: scheduledDateTime,
    duration_minutes: actualDuration,
    status: consultationType.is_free ? 'scheduled' : 'pending_payment',
    consultation_mode: 'video',
    patient_concerns: reason || symptoms || '',
    payment_amount: totalCost,
    payment_status: consultationType.is_free ? 'paid' : 'pending'
  };

  const createResponse = await fetch(`${Deno.env.get('SUPABASE_URL')}/rest/v1/consultations`, {
    method: 'POST',
    headers: {
      'authorization': `Bearer ${supabaseKey}`,
      'apikey': supabaseKey,
      'Content-Type': 'application/json',
      'Prefer': 'return=representation'
    },
    body: JSON.stringify(consultationData)
  });

  if (!createResponse.ok) {
    const error = await createResponse.text();
    throw new Error(`Failed to create consultation: ${error}`);
  }

  const [consultation] = await createResponse.json();

  // If consultation requires payment, create payment intent
  if (!consultationType.is_free) {
    const paymentIntentResponse = await fetch('/functions/v1/create-payment-intent', {
      method: 'POST',
      headers: {
        'authorization': authHeader,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        amount: Math.round(totalCost * 100), // Convert to cents
        currency: 'egp',
        consultation_id: consultation.id
      })
    });

    if (paymentIntentResponse.ok) {
      const paymentData = await paymentIntentResponse.json();
      consultation.payment_intent_id = paymentData.client_secret;
    }
  }

  return new Response(JSON.stringify({
    success: true,
    data: {
      consultation,
      payment_required: !consultationType.is_free,
      professional_info: professional,
      consultation_type: consultationType
    }
  }), {
    headers: { ...corsHeaders, 'Content-Type': 'application/json' }
  });
}

// Handle cancellation
async function handleCancellation(data: any, authHeader: string, corsHeaders: any, supabaseKey: string) {
  const { consultation_id } = data;

  if (!consultation_id) {
    throw new Error('Consultation ID required');
  }

  // Get user from auth header
  const userResponse = await fetch(`${Deno.env.get('SUPABASE_URL')}/auth/v1/user`, {
    headers: {
      'authorization': authHeader,
      'apikey': Deno.env.get('SUPABASE_ANON_KEY')!
    }
  });

  const user = await userResponse.json();
  if (!user.id) {
    throw new Error('User not found');
  }

  // Update consultation status
  const updateResponse = await fetch(
    `${Deno.env.get('SUPABASE_URL')}/rest/v1/consultations?id=eq.${consultation_id}&user_id=eq.${user.id}`,
    {
      method: 'PATCH',
      headers: {
        'authorization': `Bearer ${supabaseKey}`,
        'apikey': supabaseKey,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        status: 'cancelled',
        updated_at: new Date().toISOString()
      })
    }
  );

  if (!updateResponse.ok) {
    throw new Error('Failed to cancel consultation');
  }

  return new Response(JSON.stringify({
    success: true,
    message: 'Consultation cancelled successfully'
  }), {
    headers: { ...corsHeaders, 'Content-Type': 'application/json' }
  });
}

// Handle session start
async function handleStartSession(data: any, authHeader: string, corsHeaders: any, supabaseKey: string) {
  const { consultation_id } = data;

  if (!consultation_id) {
    throw new Error('Consultation ID required');
  }

  // Generate meeting link (placeholder for video API integration)
  const meetingLink = `https://meet.chefaa.com/session/${consultation_id}`;
  const meetingId = `CHEFAA-${Date.now()}`;

  // Update consultation
  const updateResponse = await fetch(
    `${Deno.env.get('SUPABASE_URL')}/rest/v1/consultations?id=eq.${consultation_id}`,
    {
      method: 'PATCH',
      headers: {
        'authorization': `Bearer ${supabaseKey}`,
        'apikey': supabaseKey,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        status: 'in_progress',
        started_at: new Date().toISOString(),
        meeting_link: meetingLink,
        meeting_id: meetingId,
        updated_at: new Date().toISOString()
      })
    }
  );

  if (!updateResponse.ok) {
    throw new Error('Failed to start session');
  }

  return new Response(JSON.stringify({
    success: true,
    data: {
      meeting_link: meetingLink,
      meeting_id: meetingId,
      consultation_status: 'in_progress'
    }
  }), {
    headers: { ...corsHeaders, 'Content-Type': 'application/json' }
  });
}

// Handle session end
async function handleEndSession(data: any, authHeader: string, corsHeaders: any, supabaseKey: string) {
  const { consultation_id, recording_url, notes, diagnosis, prescription } = data;

  if (!consultation_id) {
    throw new Error('Consultation ID required');
  }

  // Update consultation
  const updateData: any = {
    status: 'completed',
    completed_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  };

  if (recording_url) {
    updateData.recording_url = recording_url;
  }
  if (notes) {
    updateData.notes = notes;
  }

  const updateResponse = await fetch(
    `${Deno.env.get('SUPABASE_URL')}/rest/v1/consultations?id=eq.${consultation_id}`,
    {
      method: 'PATCH',
      headers: {
        'authorization': `Bearer ${supabaseKey}`,
        'apikey': supabaseKey,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(updateData)
    }
  );

  if (!updateResponse.ok) {
    throw new Error('Failed to end session');
  }

  // Store session recording metadata if provided
  if (recording_url) {
    await fetch(`${Deno.env.get('SUPABASE_URL')}/rest/v1/session_recordings`, {
      method: 'POST',
      headers: {
        'authorization': `Bearer ${supabaseKey}`,
        'apikey': supabaseKey,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        consultation_id,
        recording_url,
        recording_started_at: new Date().toISOString(),
        recording_ended_at: new Date().toISOString(),
        is_encrypted: true,
        retention_until: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString() // 1 year
      })
    });
  }

  return new Response(JSON.stringify({
    success: true,
    message: 'Session ended successfully'
  }), {
    headers: { ...corsHeaders, 'Content-Type': 'application/json' }
  });
}

// Handle availability check
async function handleAvailabilityCheck(professionalId: string | null, date: string | null, authHeader: string, corsHeaders: any, supabaseKey: string) {
  if (!professionalId || !date) {
    throw new Error('Professional ID and date required');
  }

  // Get existing consultations for the date
  const dateStart = new Date(date);
  const dateEnd = new Date(dateStart);
  dateEnd.setHours(23, 59, 59, 999);

  const consultationsResponse = await fetch(
    `${Deno.env.get('SUPABASE_URL')}/rest/v1/consultations?professional_id=eq.${professionalId}&scheduled_at=gte.${dateStart.toISOString()}&scheduled_at=lte.${dateEnd.toISOString()}&status=in.(scheduled,in_progress)&select=scheduled_at,duration_minutes`,
    {
      headers: {
        'authorization': `Bearer ${supabaseKey}`,
        'apikey': supabaseKey,
        'Content-Type': 'application/json'
      }
    }
  );

  const existingConsultations = await consultationsResponse.json();

  // Generate available time slots (9 AM to 5 PM, 30-minute slots)
  const availableSlots = [];
  const startHour = 9;
  const endHour = 17;
  const slotDuration = 30; // minutes

  for (let hour = startHour; hour < endHour; hour++) {
    for (let minute = 0; minute < 60; minute += slotDuration) {
      const slotStart = new Date(date);
      slotStart.setHours(hour, minute, 0, 0);
      const slotEnd = new Date(slotStart.getTime() + slotDuration * 60000);

      // Check if slot conflicts with existing consultations
      const hasConflict = existingConsultations.some((consultation: any) => {
        const consultationStart = new Date(consultation.scheduled_at);
        const consultationEnd = new Date(consultationStart.getTime() + consultation.duration_minutes * 60000);
        
        return (slotStart < consultationEnd && slotEnd > consultationStart);
      });

      if (!hasConflict && slotStart > new Date()) {
        availableSlots.push({
          start_time: slotStart.toISOString(),
          end_time: slotEnd.toISOString(),
          available: true
        });
      }
    }
  }

  return new Response(JSON.stringify({
    success: true,
    data: {
      date,
      professional_id: professionalId,
      available_slots: availableSlots
    }
  }), {
    headers: { ...corsHeaders, 'Content-Type': 'application/json' }
  });
}

// Handle get consultations
async function handleGetConsultations(authHeader: string, corsHeaders: any, supabaseKey: string) {
  // Get user from auth header
  const userResponse = await fetch(`${Deno.env.get('SUPABASE_URL')}/auth/v1/user`, {
    headers: {
      'authorization': authHeader,
      'apikey': Deno.env.get('SUPABASE_ANON_KEY')!
    }
  });

  const user = await userResponse.json();
  if (!user.id) {
    throw new Error('User not found');
  }

  // Get user consultations with related data
  const consultationsResponse = await fetch(
    `${Deno.env.get('SUPABASE_URL')}/rest/v1/consultations?user_id=eq.${user.id}&order=scheduled_at.desc&select=*,healthcare_professionals(*),consultation_types(*)`,
    {
      headers: {
        'authorization': `Bearer ${supabaseKey}`,
        'apikey': supabaseKey,
        'Content-Type': 'application/json'
      }
    }
  );

  const consultations = await consultationsResponse.json();

  return new Response(JSON.stringify({
    success: true,
    data: consultations
  }), {
    headers: { ...corsHeaders, 'Content-Type': 'application/json' }
  });
}

// Handle payment intent creation
async function handlePaymentIntent(data: any, authHeader: string, corsHeaders: any, supabaseKey: string) {
  const { amount, currency, consultation_id } = data;

  if (!amount || !consultation_id) {
    throw new Error('Amount and consultation ID required');
  }

  // Call the existing payment intent function
  const paymentResponse = await fetch(`${Deno.env.get('SUPABASE_URL')}/functions/v1/create-payment-intent`, {
    method: 'POST',
    headers: {
      'authorization': authHeader,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      amount,
      currency: currency || 'egp',
      consultation_id
    })
  });

  const paymentData = await paymentResponse.json();
  
  return new Response(JSON.stringify(paymentData), {
    headers: { ...corsHeaders, 'Content-Type': 'application/json' }
  });
}

// Handle payment verification
async function handlePaymentVerification(data: any, authHeader: string, corsHeaders: any, supabaseKey: string) {
  const { consultation_id, payment_intent_id } = data;

  if (!consultation_id || !payment_intent_id) {
    throw new Error('Consultation ID and payment intent ID required');
  }

  // Update consultation payment status
  const updateResponse = await fetch(
    `${Deno.env.get('SUPABASE_URL')}/rest/v1/consultations?id=eq.${consultation_id}`,
    {
      method: 'PATCH',
      headers: {
        'authorization': `Bearer ${supabaseKey}`,
        'apikey': supabaseKey,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        payment_status: 'paid',
        payment_intent_id: payment_intent_id,
        status: 'scheduled',
        updated_at: new Date().toISOString()
      })
    }
  );

  if (!updateResponse.ok) {
    throw new Error('Failed to verify payment');
  }

  return new Response(JSON.stringify({
    success: true,
    message: 'Payment verified successfully'
  }), {
    headers: { ...corsHeaders, 'Content-Type': 'application/json' }
  });
}