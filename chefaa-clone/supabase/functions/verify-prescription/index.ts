// Real Prescription OCR and Verification Edge Function
// Uses Google Cloud Vision API for text extraction

Deno.serve(async (req) => {
  const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Credentials': 'false'
  };

  if (req.method === 'OPTIONS') {
    return new Response(null, { status: 200, headers: corsHeaders });
  }

  try {
    const { imageUrl, patientName, doctorName, prescriptionDate, orderId } = await req.json();

    if (!imageUrl || !patientName) {
      throw new Error('Image URL and patient name are required');
    }

    // Get credentials
    const authHeader = req.headers.get('authorization');
    if (!authHeader) {
      throw new Error('No authorization header');
    }

    const token = authHeader.replace('Bearer ', '');
    const supabaseUrl = Deno.env.get('SUPABASE_URL');
    const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
    const googleVisionApiKey = Deno.env.get('GOOGLE_VISION_API_KEY');

    // Verify user
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

    let ocrResult = null;
    let detectedMedications = [];
    let detectedDoctor = doctorName || null;
    let detectedDate = prescriptionDate || null;
    let confidence = 0;

    // Perform OCR if Google Vision API key is available
    if (googleVisionApiKey) {
      try {
        ocrResult = await performOCR(imageUrl, googleVisionApiKey);
        
        // Extract information from OCR text
        const extractedInfo = extractPrescriptionInfo(ocrResult.fullText);
        
        detectedMedications = extractedInfo.medications;
        detectedDoctor = extractedInfo.doctor || doctorName;
        detectedDate = extractedInfo.date || prescriptionDate;
        confidence = ocrResult.confidence;
        
      } catch (ocrError) {
        console.error('OCR failed, proceeding with manual verification:', ocrError);
        // Continue with manual verification process
      }
    }

    // Create verification record
    const verificationData = {
      user_id: userId,
      order_id: orderId || null,
      prescription_url: imageUrl,
      patient_name: patientName,
      doctor_name: detectedDoctor,
      prescription_date: detectedDate,
      verification_status: 'pending',
      ai_confidence_score: confidence,
      detected_medications: detectedMedications,
      ocr_raw_text: ocrResult?.fullText || null,
      submitted_at: new Date().toISOString()
    };

    const insertResponse = await fetch(`${supabaseUrl}/rest/v1/prescription_verifications`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${serviceRoleKey}`,
        'apikey': serviceRoleKey,
        'Content-Type': 'application/json',
        'Prefer': 'return=representation'
      },
      body: JSON.stringify(verificationData)
    });

    if (!insertResponse.ok) {
      const errorText = await insertResponse.text();
      throw new Error(`Database insert failed: ${errorText}`);
    }

    const verificationRecord = await insertResponse.json();

    // Log audit event
    await fetch(`${supabaseUrl}/rest/v1/audit_logs`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${serviceRoleKey}`,
        'apikey': serviceRoleKey,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        user_id: userId,
        action: 'prescription_upload',
        resource_type: 'prescription',
        resource_id: verificationRecord[0].id,
        details: {
          patient_name: patientName,
          ai_processed: !!googleVisionApiKey,
          confidence: confidence,
          medications_count: detectedMedications.length
        }
      })
    });

    return new Response(JSON.stringify({
      data: {
        verification: verificationRecord[0],
        ocr_processed: !!googleVisionApiKey,
        detected_info: {
          medications: detectedMedications,
          doctor: detectedDoctor,
          date: detectedDate,
          confidence: confidence
        }
      }
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error('Prescription verification error:', error);
    
    return new Response(JSON.stringify({
      error: {
        code: 'PRESCRIPTION_VERIFICATION_FAILED',
        message: error.message
      }
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
});

// Perform OCR using Google Cloud Vision API
async function performOCR(imageUrl, apiKey) {
  const visionApiUrl = `https://vision.googleapis.com/v1/images:annotate?key=${apiKey}`;
  
  // Fetch image as base64
  const imageResponse = await fetch(imageUrl);
  const imageBuffer = await imageResponse.arrayBuffer();
  const base64Image = btoa(String.fromCharCode(...new Uint8Array(imageBuffer)));
  
  // Call Google Cloud Vision API
  const response = await fetch(visionApiUrl, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      requests: [{
        image: {
          content: base64Image
        },
        features: [{
          type: 'TEXT_DETECTION',
          maxResults: 1
        }]
      }]
    })
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Vision API error: ${errorText}`);
  }

  const result = await response.json();
  
  if (!result.responses || !result.responses[0] || !result.responses[0].textAnnotations) {
    throw new Error('No text detected in image');
  }

  const textAnnotations = result.responses[0].textAnnotations;
  const fullText = textAnnotations[0]?.description || '';
  const confidence = textAnnotations[0]?.confidence || 0;

  return {
    fullText,
    confidence,
    annotations: textAnnotations
  };
}

// Extract prescription information from OCR text
function extractPrescriptionInfo(text) {
  const info = {
    medications: [],
    doctor: null,
    date: null
  };

  if (!text) return info;

  const lines = text.split('\n');
  
  // Common medication name patterns (simplified)
  const medicationPatterns = [
    /(?:tab|cap|syrup|injection|cream|ointment)[:\s]+([a-zA-Z0-9\s-]+?)(?:\d+mg|\d+ml|$)/gi,
    /(?:rx|℞)[:\s]+([a-zA-Z0-9\s-]+?)(?:\d+mg|\d+ml|$)/gi,
    /^[A-Z][a-z]+(?:olol|pril|mycin|cillin|statin|oxin)\b/gm
  ];

  // Extract medications
  for (const pattern of medicationPatterns) {
    const matches = text.matchAll(pattern);
    for (const match of matches) {
      const medication = match[1] || match[0];
      if (medication && medication.length > 3 && medication.length < 50) {
        info.medications.push(medication.trim());
      }
    }
  }

  // Extract doctor name (look for "Dr." or "Doctor")
  const doctorPattern = /(?:Dr\.?|Doctor)\s+([A-Z][a-z]+(?:\s+[A-Z][a-z]+)*)/i;
  const doctorMatch = text.match(doctorPattern);
  if (doctorMatch) {
    info.doctor = doctorMatch[0].trim();
  }

  // Extract date (multiple formats)
  const datePatterns = [
    /\d{1,2}[-\/]\d{1,2}[-\/]\d{2,4}/,
    /\d{4}[-\/]\d{1,2}[-\/]\d{1,2}/,
    /(?:Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)[a-z]*\s+\d{1,2},?\s+\d{4}/i
  ];

  for (const pattern of datePatterns) {
    const dateMatch = text.match(pattern);
    if (dateMatch) {
      info.date = dateMatch[0];
      break;
    }
  }

  // Remove duplicates from medications
  info.medications = [...new Set(info.medications)];

  return info;
}
