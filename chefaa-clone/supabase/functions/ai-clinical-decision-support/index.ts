// AI-Powered Clinical Decision Support Edge Function
// Real-time clinical recommendations at point-of-care

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

// Clinical decision rules database
const CLINICAL_RULES = {
  chest_pain: {
    name: 'Chest Pain Decision Support',
    criteria: ['age', 'symptoms', 'riskFactors', 'ecgFindings'],
    algorithm: 'HEART Score',
    outcomes: {
      low: { score: '0-3', recommendation: 'Discharge with outpatient follow-up', risk: '<2%' },
      moderate: { score: '4-6', recommendation: 'Admit for observation and stress test', risk: '12-30%' },
      high: { score: '7-10', recommendation: 'Admit for invasive management', risk: '>50%' },
    },
  },
  stroke: {
    name: 'Acute Stroke Management',
    criteria: ['symptomOnset', 'bloodPressure', 'glucose', 'imaging'],
    algorithm: 'AHA/ASA Stroke Guidelines 2019',
    tPA_eligibility: {
      timeWindow: '4.5 hours from symptom onset',
      contraindications: ['Recent surgery', 'Bleeding disorder', 'Severe hypertension'],
    },
  },
  sepsis: {
    name: 'Sepsis Recognition and Management',
    criteria: ['qSOFA', 'lactate', 'vitalSigns'],
    algorithm: 'Surviving Sepsis Campaign 2021',
    bundles: {
      '1hour': ['Blood cultures', 'Lactate', 'Broad-spectrum antibiotics', 'Fluid resuscitation'],
      '3hour': ['Reassess hemodynamics', 'Vasopressors if needed'],
    },
  },
};

// Medication dosing guidelines with renal/hepatic adjustments
const DOSING_GUIDELINES = {
  vancomycin: {
    indication: 'Serious gram-positive infections',
    standardDose: '15-20 mg/kg q8-12h',
    renalAdjustment: {
      'CrCl >50': 'Standard dosing',
      'CrCl 30-50': 'Extend interval to q12-24h',
      'CrCl 10-30': 'Extend interval to q24-48h, monitor levels',
      'CrCl <10': 'Load with 15-20 mg/kg, then monitor levels for redosing',
    },
    monitoring: 'Trough levels 10-20 mcg/mL, check before 4th dose',
    citations: ['IDSA Guidelines 2020'],
  },
  warfarin: {
    indication: 'Anticoagulation',
    standardDose: '2-10 mg daily',
    pharmacogenomic: {
      'CYP2C9*1/*1 + VKORC1 GG': 'Standard dose 5-7 mg',
      'CYP2C9*1/*2 or *1/*3': 'Reduced dose 3-4 mg',
      'VKORC1 AA': 'Reduced dose 3-4 mg',
    },
    monitoring: 'INR target 2-3 for most indications, 2.5-3.5 for mechanical valves',
    interactions: 'High - check all concurrent medications',
  },
};

function provideClinicalDecisionSupport(clinicalScenario: any) {
  const { presentingComplaint, patientData, urgency } = clinicalScenario;
  
  const key = presentingComplaint.toLowerCase().replace(/\s+/g, '_');
  const rule = CLINICAL_RULES[key];
  
  if (!rule) {
    return {
      success: false,
      error: `No clinical decision support available for: ${presentingComplaint}`,
    };
  }
  
  const recommendations = [];
  const alerts = [];
  
  // Generate urgency-based recommendations
  if (urgency === 'emergent') {
    alerts.push({
      level: 'Critical',
      message: 'EMERGENT CASE - Activate rapid response protocols',
      action: 'Immediate physician evaluation required',
    });
  }
  
  // Add algorithm-specific recommendations
  recommendations.push({
    category: 'Clinical Algorithm',
    recommendation: `Apply ${rule.algorithm}`,
    evidence: 'Evidence-based clinical pathway',
    priority: 'High',
  });
  
  // Add specific recommendations based on scenario
  if (key === 'chest_pain') {
    recommendations.push({
      category: 'Initial Workup',
      recommendation: 'ECG, troponin, chest X-ray',
      timing: 'Within 10 minutes',
      priority: 'Critical',
    });
  }
  
  if (key === 'stroke' && patientData.symptomOnset < 4.5) {
    recommendations.push({
      category: 'Acute Treatment',
      recommendation: 'Evaluate for tPA eligibility',
      timing: 'STAT',
      priority: 'Critical',
      details: CLINICAL_RULES.stroke.tPA_eligibility,
    });
  }
  
  if (key === 'sepsis') {
    recommendations.push({
      category: '1-Hour Bundle',
      recommendation: CLINICAL_RULES.sepsis.bundles['1hour'].join(', '),
      timing: 'Within 1 hour',
      priority: 'Critical',
    });
  }
  
  return {
    success: true,
    data: {
      scenario: presentingComplaint,
      clinicalRule: rule.name,
      algorithm: rule.algorithm,
      recommendations,
      alerts,
      nextSteps: generateNextSteps(key, patientData),
      consultation: urgency === 'emergent' ? 'Immediate specialist consultation recommended' : 'Consider specialist consultation',
    },
  };
}

function calculateMedicationDose(medication: string, patientData: any) {
  const medKey = medication.toLowerCase();
  const dosing = DOSING_GUIDELINES[medKey];
  
  if (!dosing) {
    return {
      success: false,
      error: `No dosing guidelines available for: ${medication}`,
    };
  }
  
  const { renalFunction, hepaticFunction, weight, genetics } = patientData;
  
  let recommendedDose = dosing.standardDose;
  const adjustments = [];
  
  // Renal adjustment
  if (dosing.renalAdjustment && renalFunction) {
    const crCl = renalFunction.creatinineClearance;
    if (crCl > 50) recommendedDose = dosing.renalAdjustment['CrCl >50'];
    else if (crCl >= 30) {
      recommendedDose = dosing.renalAdjustment['CrCl 30-50'];
      adjustments.push('Renal dose adjustment applied');
    }
    else if (crCl >= 10) {
      recommendedDose = dosing.renalAdjustment['CrCl 10-30'];
      adjustments.push('Significant renal dose reduction - monitor closely');
    }
    else {
      recommendedDose = dosing.renalAdjustment['CrCl <10'];
      adjustments.push('CRITICAL: Severe renal impairment - consult nephrology');
    }
  }
  
  // Pharmacogenomic adjustment
  if (dosing.pharmacogenomic && genetics) {
    const genotypeKey = `${genetics.CYP2C9} + ${genetics.VKORC1}`;
    if (dosing.pharmacogenomic[genotypeKey]) {
      recommendedDose = dosing.pharmacogenomic[genotypeKey];
      adjustments.push('Pharmacogenomic-guided dosing');
    }
  }
  
  return {
    success: true,
    data: {
      medication,
      indication: dosing.indication,
      recommendedDose,
      adjustments,
      monitoring: dosing.monitoring,
      interactions: dosing.interactions,
      evidence: dosing.citations,
      alerts: adjustments.filter(adj => adj.includes('CRITICAL')),
    },
  };
}

function generateNextSteps(scenario: string, patientData: any) {
  const steps = [];
  
  switch (scenario) {
    case 'chest_pain':
      steps.push(
        'Serial troponins at 0 and 3 hours',
        'Cardiology consultation if positive',
        'Discharge planning with stress test if negative'
      );
      break;
    case 'stroke':
      steps.push(
        'Neurology consultation STAT',
        'CT head with CTA',
        'Admit to stroke unit'
      );
      break;
    case 'sepsis':
      steps.push(
        'ICU admission',
        'Source control evaluation',
        'Daily reassessment of antibiotic therapy'
      );
      break;
  }
  
  return steps;
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { status: 200, headers: corsHeaders });
  }

  try {
    const { action, data } = await req.json();

    switch (action) {
      case 'get_clinical_decision_support': {
        const result = provideClinicalDecisionSupport(data);
        return new Response(JSON.stringify(result), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      case 'calculate_dose': {
        const { medication, patientData } = data;
        const result = calculateMedicationDose(medication, patientData);
        return new Response(JSON.stringify(result), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      case 'get_clinical_rules': {
        return new Response(
          JSON.stringify({ success: true, data: CLINICAL_RULES }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      default:
        return new Response(
          JSON.stringify({ success: false, error: 'Invalid action' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
    }
  } catch (error) {
    return new Response(
      JSON.stringify({ success: false, error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
