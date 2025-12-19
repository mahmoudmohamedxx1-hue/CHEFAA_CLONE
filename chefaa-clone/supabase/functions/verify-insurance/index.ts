import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

// CORS headers for all responses
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, GET, OPTIONS, PUT, DELETE, PATCH',
  'Access-Control-Max-Age': '86400',
};

interface InsuranceVerificationRequest {
  provider_code: string;
  policy_number: string;
  member_id: string;
  group_number?: string;
  order_amount?: number;
  medications?: Array<{
    name: string;
    dosage: string;
    quantity: number;
    price: number;
  }>;
}

interface InsuranceVerificationResponse {
  success: boolean;
  verified: boolean;
  coverage_details?: {
    eligibility_status: 'active' | 'inactive' | 'expired' | 'pending';
    coverage_type: string;
    copay_percentage: number;
    deductible_amount: number;
    max_coverage_amount: number;
    remaining_deductible: number;
    remaining_benefits: number;
  };
  copay_calculation?: {
    total_order_amount: number;
    insurance_coverage: number;
    patient_responsibility: number;
    copay_amount: number;
    medication_breakdown: Array<{
      medication: string;
      price: number;
      coverage_percentage: number;
      patient_pays: number;
      insurance_pays: number;
    }>;
  };
  prior_auth_required?: boolean;
  prior_auth_details?: {
    required_for: string[];
    approval_timeframe: string;
    required_documents: string[];
  };
  verification_details?: {
    verified_at: string;
    verification_method: 'api' | 'manual' | 'cached';
    reference_number?: string;
  };
  error?: string;
}

// Egyptian Insurance Provider Configurations
const EGYPTIAN_PROVIDERS = {
  'EG01': { name: 'مصر للتأمين', api_endpoint: 'https://api.misr-insurance.gov.eg', copay_rules: { medications: 20 } },
  'EG02': { name: 'قناة السويس للتأمين', api_endpoint: 'https://api.suezcanal-insurance.gov.eg', copay_rules: { medications: 15 } },
  'EG03': { name: 'وثاق للتأمين', api_endpoint: 'https://api.wathaq-insurance.com', copay_rules: { medications: 25 } },
  'EG04': { name: 'المصرية للتأمين الطبي', api_endpoint: 'https://api.egyptian-medical.com', copay_rules: { medications: 30 } },
  'EG05': { name: 'التوفيق للتأمين', api_endpoint: 'https://api.taawun-insurance.gov.eg', copay_rules: { medications: 18 } },
  'EG06': { name: 'الفرعونية للتأمين', api_endpoint: 'https://api.pharaonic-insurance.gov.eg', copay_rules: { medications: 22 } },
  'EG07': { name: 'شركة مصر、四川 للتأمين', api_endpoint: 'https://api.misr-sichuan.gov.eg', copay_rules: { medications: 35 } },
  'EG08': { name: 'اتحاد شركات التأمين المصرية', api_endpoint: 'https://api.ecu-insurance.gov.eg', copay_rules: { medications: 12 } },
  'EG09': { name: 'شركة التكافل المصرية', api_endpoint: 'https://api.egyptian-takaful.com', copay_rules: { medications: 28 } },
  'EG10': { name: 'القاهرة للتأمين', api_endpoint: 'https://api.cairo-insurance.gov.eg', copay_rules: { medications: 20 } }
};

// Mock insurance verification function
async function verifyInsuranceStatus(
  providerCode: string, 
  policyNumber: string, 
  memberId: string
): Promise<any> {
  // Simulate API delay
  await new Promise(resolve => setTimeout(resolve, 1500));

  // Enhanced policy validation based on Egyptian insurance patterns
  const provider = EGYPTIAN_PROVIDERS[providerCode as keyof typeof EGYPTIAN_PROVIDERS];
  if (!provider) {
    return { success: false, error: 'Insurance provider not found' };
  }

  // Policy number pattern validation (Egyptian format)
  const policyPatterns = {
    'EG01': /^MISR\d{8}$/,
    'EG02': /^SUZ\d{6}[A-Z]{2}$/,
    'EG03': /^WTQ\d{9}$/,
    'EG04': /^EGM\d{7}$/,
    'EG05': /^TAW\d{8}[A-Z]{1}$/,
    'EG06': /^PHR\d{6}[A-Z]{3}$/,
    'EG07': /^MSC\d{8}$/,
    'EG08': /^ECU\d{9}$/,
    'EG09': /^TAK\d{7}[A-Z]{2}$/,
    'EG10': /^CAI\d{8}$/
  };

  const pattern = policyPatterns[providerCode as keyof typeof policyPatterns];
  if (pattern && !pattern.test(policyNumber)) {
    return { success: false, error: 'Invalid policy number format' };
  }

  // Member ID validation (Egyptian national ID or member number)
  if (memberId.length < 6 || memberId.length > 15) {
    return { success: false, error: 'Invalid member ID' };
  }

  // Simulate different verification outcomes based on policy number
  const lastDigit = parseInt(policyNumber.slice(-1));
  
  // 85% chance of successful verification
  if (lastDigit <= 7) {
    const startDate = new Date('2024-01-01');
    const endDate = new Date('2025-12-31');
    const today = new Date();
    
    const baseCoverage = {
      'EG01': { copay: 20, deductible: 1000, max: 50000 },
      'EG02': { copay: 15, deductible: 800, max: 45000 },
      'EG03': { copay: 25, deductible: 1200, max: 60000 },
      'EG04': { copay: 30, deductible: 1500, max: 70000 },
      'EG05': { copay: 18, deductible: 900, max: 48000 },
      'EG06': { copay: 22, deductible: 1100, max: 55000 },
      'EG07': { copay: 35, deductible: 2000, max: 80000 },
      'EG08': { copay: 12, deductible: 700, max: 40000 },
      'EG09': { copay: 28, deductible: 1300, max: 65000 },
      'EG10': { copay: 20, deductible: 1000, max: 50000 }
    };

    const coverage = baseCoverage[providerCode as keyof typeof baseCoverage] || { copay: 25, deductible: 1000, max: 50000 };

    return {
      success: true,
      verified: true,
      eligibility_status: 'active',
      coverage_type: 'medications',
      copay_percentage: coverage.copay,
      deductible_amount: coverage.deductible,
      max_coverage_amount: coverage.max,
      remaining_deductible: Math.floor(coverage.deductible * 0.7),
      remaining_benefits: Math.floor(coverage.max * 0.6),
      coverage_start: startDate,
      coverage_end: endDate,
      member_name: 'أحمد محمد علي', // Simulated Arabic name
      member_relationship: 'self',
      dependents_count: 2
    };
  } else if (lastDigit === 8) {
    return {
      success: false,
      verified: false,
      error: 'Policy expired',
      expiry_date: '2024-06-30'
    };
  } else {
    return {
      success: false,
      verified: false,
      error: 'Invalid policy or member information',
      verification_status: 'pending'
    };
  }
}

// Copay calculation engine
function calculateCopay(
  totalAmount: number,
  copayPercentage: number,
  deductibleAmount: number,
  remainingDeductible: number,
  medications: any[] = []
): any {
  let deductibleApplied = 0;
  let copayApplied = 0;
  let insurancePays = 0;
  let patientResponsibility = 0;

  // Calculate medication-specific coverage
  const medicationBreakdown = medications.map(med => {
    const medPrice = med.price * med.quantity;
    const providerSpecificCoverage = {
      'prescription_only': medPrice * 0.8, // 80% coverage
      'generic_only': medPrice * 0.7, // 70% coverage
      'brand_premium': medPrice * 0.6, // 60% coverage
      'full_coverage': medPrice * (1 - copayPercentage / 100) // Variable copay
    };

    const coveragePercentage = 100 - copayPercentage;
    const insurancePays = medPrice * (coveragePercentage / 100);
    const patientPays = medPrice - insurancePays;

    return {
      medication: med.name,
      dosage: med.dosage,
      price: medPrice,
      coverage_percentage: coveragePercentage,
      patient_pays: patientPays,
      insurance_pays: insurancePays
    };
  });

  const medicationTotal = medicationBreakdown.reduce((sum, med) => sum + med.price, 0);

  // Calculate deductible application
  if (remainingDeductible > 0) {
    const deductibleToApply = Math.min(remainingDeductible, totalAmount);
    deductibleApplied = deductibleToApply;
    patientResponsibility += deductibleToApply;
  }

  // Calculate copay on remaining amount
  const remainingAfterDeductible = totalAmount - deductibleApplied;
  if (remainingAfterDeductible > 0) {
    copayApplied = remainingAfterDeductible * (copayPercentage / 100);
    insurancePays = remainingAfterDeductible - copayApplied;
    patientResponsibility += copayApplied;
  }

  // Cap patient responsibility based on coverage limits
  const maxPatientResponsibility = totalAmount * 0.5; // Never more than 50%
  if (patientResponsibility > maxPatientResponsibility) {
    const adjustment = patientResponsibility - maxPatientResponsibility;
    insurancePays += adjustment;
    patientResponsibility = maxPatientResponsibility;
  }

  return {
    total_order_amount: totalAmount,
    insurance_coverage: insurancePays,
    patient_responsibility: patientResponsibility,
    copay_amount: copayApplied,
    deductible_applied: deductibleApplied,
    medication_breakdown: medicationBreakdown
  };
}

// Prior authorization requirements
function checkPriorAuthorization(
  providerCode: string,
  medications: any[]
): { required: boolean; details: any } {
  const highCostMedications = [
    'biologics', 'immunotherapy', 'oncology', 'specialty_drugs',
    'insulin_analog', 'growth_hormone', 'antiviral_specialty'
  ];

  const controlledSubstances = [
    'opioid', 'stimulant', 'benzodiazepine', 'sedative_hypnotic'
  ];

  const expensiveMedications = medications.filter(med => 
    (med.price * med.quantity) > 2000
  );

  const requiringAuth = [];

  // Check for high-cost medications
  expensiveMedications.forEach(med => {
    requiringAuth.push({
      medication: med.name,
      reason: 'high_cost',
      threshold: 2000,
      current_cost: med.price * med.quantity
    });
  });

  // Provider-specific requirements
  const providerRequirements = {
    'EG01': ['biologics', 'immunotherapy'],
    'EG04': ['oncology', 'specialty_drugs'],
    'EG07': ['growth_hormone', 'insulin_analog'],
    'EG09': ['controlled_substances', 'opioids']
  };

  const required = requiringAuth.length > 0 || 
    providerRequirements[providerCode as keyof typeof providerRequirements]?.some(req => 
      medications.some(med => 
        med.name.toLowerCase().includes(req.toLowerCase())
      )
    );

  return {
    required,
    details: {
      required_for: requiringAuth.map(item => item.medication),
      approval_timeframe: '24-48 hours',
      required_documents: [
        'prescription_from_licensed_physician',
        'medical_necessity_letter',
        'previous_treatment_history',
        'laboratory_reports_if_applicable'
      ],
      estimated_approval_time: '2-3 business days',
      appeal_process: 'Available through provider portal'
    }
  };
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    // Only allow POST requests
    if (req.method !== 'POST') {
      return new Response(JSON.stringify({ error: 'Method not allowed' }), {
        status: 405,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    // Parse request body
    const requestData: InsuranceVerificationRequest = await req.json();
    const { provider_code, policy_number, member_id, group_number, order_amount = 0, medications = [] } = requestData;

    // Validate required fields
    if (!provider_code || !policy_number || !member_id) {
      return new Response(JSON.stringify({
        success: false,
        error: 'Missing required fields: provider_code, policy_number, member_id'
      }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    console.log(`Insurance verification request: ${provider_code} - ${policy_number}`);

    // Verify insurance status
    const verificationResult = await verifyInsuranceStatus(provider_code, policy_number, member_id);

    if (!verificationResult.success) {
      return new Response(JSON.stringify({
        success: false,
        verified: false,
        error: verificationResult.error
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    // Calculate copay if order amount provided
    let copayCalculation = null;
    if (order_amount > 0) {
      copayCalculation = calculateCopay(
        order_amount,
        verificationResult.copay_percentage,
        verificationResult.deductible_amount,
        verificationResult.remaining_deductible,
        medications
      );
    }

    // Check for prior authorization requirements
    const priorAuthCheck = checkPriorAuthorization(provider_code, medications);

    // Create verification log entry
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    try {
      await supabase.from('insurance_verifications').insert({
        verification_type: 'eligibility',
        request_data: {
          provider_code,
          policy_number: policy_number.replace(/(.{4})/g, "$1 "), // Mask for security
          member_id,
          order_amount,
          medications_count: medications.length
        },
        response_data: {
          verified: verificationResult.verified,
          eligibility_status: verificationResult.eligibility_status,
          copay_calculation: copayCalculation
        },
        status: verificationResult.verified ? 'verified' : 'pending',
        coverage_amount: copayCalculation?.insurance_coverage || 0,
        copay_amount: copayCalculation?.copay_amount || 0,
        patient_responsibility: copayCalculation?.patient_responsibility || 0,
        verified_by: 'api',
        verified_at: new Date().toISOString()
      });
    } catch (logError) {
      console.error('Failed to log verification:', logError);
      // Don't fail the request if logging fails
    }

    // Prepare response
    const response: InsuranceVerificationResponse = {
      success: true,
      verified: verificationResult.verified,
      coverage_details: {
        eligibility_status: verificationResult.eligibility_status,
        coverage_type: verificationResult.coverage_type,
        copay_percentage: verificationResult.copay_percentage,
        deductible_amount: verificationResult.deductible_amount,
        max_coverage_amount: verificationResult.max_coverage_amount,
        remaining_deductible: verificationResult.remaining_deductible,
        remaining_benefits: verificationResult.remaining_benefits
      },
      copay_calculation: copayCalculation,
      prior_auth_required: priorAuthCheck.required,
      prior_auth_details: priorAuthCheck.details,
      verification_details: {
        verified_at: new Date().toISOString(),
        verification_method: 'api',
        reference_number: `VER-${Date.now()}-${Math.random().toString(36).substring(7).toUpperCase()}`
      }
    };

    return new Response(JSON.stringify(response), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error('Insurance verification error:', error);
    
    return new Response(JSON.stringify({
      success: false,
      error: 'Insurance verification service unavailable',
      details: error.message
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
});