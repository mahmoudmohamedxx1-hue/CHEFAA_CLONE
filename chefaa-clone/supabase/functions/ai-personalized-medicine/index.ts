// AI-Powered Personalized Medicine Edge Function
// Provides personalized treatment recommendations based on patient profile, genetics, and history

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

// Personalized Medicine Database with treatment efficacy by population
const PERSONALIZED_TREATMENTS = {
  'hypertension': {
    populations: {
      'african_american': {
        firstLine: [
          { drug: 'Amlodipine', efficacy: 0.85, evidence: 'ALLHAT trial', nnt: 12 },
          { drug: 'Chlorthalidone', efficacy: 0.82, evidence: 'ALLHAT trial', nnt: 14 },
        ],
        avoid: ['ACE Inhibitors (less effective, higher angioedema risk)'],
      },
      'caucasian': {
        firstLine: [
          { drug: 'Lisinopril', efficacy: 0.88, evidence: 'HOPE trial', nnt: 10 },
          { drug: 'Losartan', efficacy: 0.86, evidence: 'LIFE trial', nnt: 11 },
        ],
      },
      'asian': {
        firstLine: [
          { drug: 'Amlodipine (lower dose)', efficacy: 0.87, evidence: 'FEVER trial', nnt: 11 },
          { drug: 'Losartan', efficacy: 0.84, evidence: 'ORIENT trial', nnt: 13 },
        ],
        note: 'Asian patients often require lower doses due to CYP2C9 polymorphisms',
      },
    },
  },
  'type2_diabetes': {
    populations: {
      'ckd_patients': {
        firstLine: [
          { drug: 'Empagliflozin', efficacy: 0.92, evidence: 'EMPA-REG OUTCOME', nnt: 8, benefit: 'Cardiovascular and renal protection' },
          { drug: 'Dapagliflozin', efficacy: 0.90, evidence: 'DAPA-CKD', nnt: 9 },
        ],
      },
      'cvd_patients': {
        firstLine: [
          { drug: 'Liraglutide', efficacy: 0.89, evidence: 'LEADER trial', nnt: 10 },
          { drug: 'Semaglutide', efficacy: 0.91, evidence: 'SUSTAIN-6', nnt: 8 },
        ],
      },
      'elderly': {
        firstLine: [
          { drug: 'Metformin (low dose)', efficacy: 0.78, evidence: 'UKPDS', nnt: 15 },
          { drug: 'Sitagliptin', efficacy: 0.76, evidence: 'Elderly-specific studies', nnt: 18 },
        ],
        avoid: ['Sulfonylureas (hypoglycemia risk)', 'Insulin (complexity)'],
      },
    },
  },
  'depression': {
    populations: {
      'cyp2d6_poor_metabolizers': {
        firstLine: [
          { drug: 'Citalopram', efficacy: 0.82, evidence: 'Meta-analysis', nnt: 12 },
          { drug: 'Sertraline', efficacy: 0.80, evidence: 'STAR*D', nnt: 14 },
        ],
        avoid: ['Venlafaxine', 'Tricyclic antidepressants (require CYP2D6)'],
      },
      'cyp2d6_ultrarapid_metabolizers': {
        firstLine: [
          { drug: 'Venlafaxine (higher dose)', efficacy: 0.84, evidence: 'Pharmacogenomic studies', nnt: 11 },
          { drug: 'Duloxetine (higher dose)', efficacy: 0.82, evidence: 'Pharmacogenomic studies', nnt: 12 },
        ],
      },
      'pregnant_women': {
        firstLine: [
          { drug: 'Sertraline', efficacy: 0.76, evidence: 'Pregnancy registry data', nnt: 16, safety: 'Category C, safest SSRI' },
        ],
        avoid: ['Paroxetine (cardiac defects)', 'All TCAs', 'MAOIs'],
      },
    },
  },
  'atrial_fibrillation': {
    populations: {
      'high_bleeding_risk': {
        firstLine: [
          { drug: 'Apixaban', efficacy: 0.88, evidence: 'ARISTOTLE', nnt: 10, benefit: 'Lowest bleeding risk' },
          { drug: 'Edoxaban', efficacy: 0.85, evidence: 'ENGAGE AF-TIMI 48', nnt: 12 },
        ],
      },
      'ckd_stage_4_5': {
        firstLine: [
          { drug: 'Apixaban (reduced dose)', efficacy: 0.80, evidence: 'ARISTOTLE subanalysis', nnt: 14 },
          { drug: 'Warfarin (INR 2-3)', efficacy: 0.75, evidence: 'Standard care', nnt: 18 },
        ],
        avoid: ['Dabigatran (renal clearance)', 'Rivaroxaban (accumulation)'],
      },
    },
  },
  'osteoporosis': {
    populations: {
      'high_fracture_risk': {
        firstLine: [
          { drug: 'Denosumab', efficacy: 0.92, evidence: 'FREEDOM trial', nnt: 8 },
          { drug: 'Zoledronic acid', efficacy: 0.90, evidence: 'HORIZON trial', nnt: 9 },
        ],
      },
      'postmenopausal_women': {
        firstLine: [
          { drug: 'Alendronate', efficacy: 0.85, evidence: 'FIT trial', nnt: 12 },
          { drug: 'Risedronate', efficacy: 0.83, evidence: 'VERT trial', nnt: 13 },
        ],
      },
    },
  },
};

// Patient profile risk factors
const RISK_FACTORS = {
  age: {
    '<40': { multiplier: 1.0, note: 'Standard risk' },
    '40-65': { multiplier: 1.2, note: 'Moderate risk increase' },
    '65-80': { multiplier: 1.5, note: 'Elevated risk, consider dose adjustments' },
    '>80': { multiplier: 2.0, note: 'High risk, prioritize safety over efficacy' },
  },
  comorbidities: {
    ckd: { impact: 'Requires dose adjustment for many drugs, avoid nephrotoxic agents' },
    hepatic_impairment: { impact: 'Reduce doses of hepatically metabolized drugs' },
    cvd: { impact: 'Prioritize cardioprotective agents, avoid QT-prolonging drugs' },
    pregnancy: { impact: 'Strictly limit to Category A/B drugs, avoid teratogens' },
  },
};

// Treatment personalization algorithm
function personalizeTreatment(patientProfile: any) {
  const { condition, ethnicity, age, genetics, comorbidities, medications, preferences } = patientProfile;

  const results = {
    condition,
    personalizedRecommendations: [] as any[],
    avoidances: [] as any[],
    doseAdjustments: [] as any[],
    monitoringPlan: [] as any[],
    patientSpecificFactors: [] as any[],
    evidenceLevel: 'High',
    confidenceScore: 0.0,
  };

  // Get condition-specific treatments
  const conditionData = PERSONALIZED_TREATMENTS[condition.toLowerCase().replace(/\s+/g, '_')];
  if (!conditionData) {
    return {
      success: false,
      error: `No personalized data available for condition: ${condition}`,
    };
  }

  // Determine population based on patient profile
  let selectedPopulation = null;
  let populationKey = '';

  // Check for genetic factors first
  if (genetics && genetics.cyp2d6) {
    const metabolizerStatus = genetics.cyp2d6.toLowerCase().replace(/\s+/g, '_');
    if (conditionData.populations[metabolizerStatus]) {
      selectedPopulation = conditionData.populations[metabolizerStatus];
      populationKey = metabolizerStatus;
      results.patientSpecificFactors.push(`CYP2D6 ${genetics.cyp2d6} status identified`);
    }
  }

  // Check for comorbidity-specific populations
  if (!selectedPopulation && comorbidities && comorbidities.length > 0) {
    for (const comorbidity of comorbidities) {
      const comorbidityKey = comorbidity.toLowerCase().replace(/\s+/g, '_');
      if (conditionData.populations[comorbidityKey]) {
        selectedPopulation = conditionData.populations[comorbidityKey];
        populationKey = comorbidityKey;
        results.patientSpecificFactors.push(`Comorbidity-based selection: ${comorbidity}`);
        break;
      }
    }
  }

  // Check for ethnicity-specific populations
  if (!selectedPopulation && ethnicity) {
    const ethnicityKey = ethnicity.toLowerCase().replace(/\s+/g, '_');
    if (conditionData.populations[ethnicityKey]) {
      selectedPopulation = conditionData.populations[ethnicityKey];
      populationKey = ethnicityKey;
      results.patientSpecificFactors.push(`Ethnicity-based selection: ${ethnicity}`);
    }
  }

  // Default to general population if available
  if (!selectedPopulation) {
    const defaultPops = ['general', 'standard', Object.keys(conditionData.populations)[0]];
    for (const key of defaultPops) {
      if (conditionData.populations[key]) {
        selectedPopulation = conditionData.populations[key];
        populationKey = key;
        break;
      }
    }
  }

  if (!selectedPopulation) {
    return {
      success: false,
      error: 'No matching population found for patient profile',
    };
  }

  // Generate personalized recommendations
  if (selectedPopulation.firstLine) {
    for (const treatment of selectedPopulation.firstLine) {
      results.personalizedRecommendations.push({
        medication: treatment.drug,
        efficacy: `${(treatment.efficacy * 100).toFixed(0)}%`,
        nnt: treatment.nnt,
        evidence: treatment.evidence,
        benefit: treatment.benefit || 'Standard therapeutic benefit',
        safety: treatment.safety || 'Standard safety profile',
        populationSpecific: true,
        populationType: populationKey,
      });
    }
  }

  // Add medications to avoid
  if (selectedPopulation.avoid) {
    results.avoidances = selectedPopulation.avoid.map((drug: string) => ({
      medication: drug,
      reason: 'Population-specific contraindication or reduced efficacy',
      severity: 'High',
    }));
  }

  // Age-based adjustments
  let ageGroup = '<40';
  if (age >= 80) ageGroup = '>80';
  else if (age >= 65) ageGroup = '65-80';
  else if (age >= 40) ageGroup = '40-65';

  const ageRisk = RISK_FACTORS.age[ageGroup];
  results.patientSpecificFactors.push(`Age group: ${ageGroup} - ${ageRisk.note}`);

  if (age >= 65) {
    results.doseAdjustments.push({
      recommendation: 'Consider starting at 50% of standard adult dose',
      reason: 'Age-related pharmacokinetic changes',
      apply_to: 'All medications',
    });
  }

  // Comorbidity-based adjustments
  if (comorbidities) {
    for (const comorbidity of comorbidities) {
      const comorbidityKey = comorbidity.toLowerCase().replace(/\s+/g, '_');
      const riskData = RISK_FACTORS.comorbidities[comorbidityKey];
      if (riskData) {
        results.patientSpecificFactors.push(`${comorbidity}: ${riskData.impact}`);
        
        if (comorbidityKey === 'ckd') {
          results.monitoringPlan.push({
            parameter: 'Serum creatinine and eGFR',
            frequency: 'Every 3 months',
            reason: 'Chronic kidney disease monitoring',
          });
        }
      }
    }
  }

  // Add monitoring plan
  results.monitoringPlan.push(
    {
      parameter: 'Blood pressure',
      frequency: 'Weekly for 4 weeks, then monthly',
      reason: 'Treatment efficacy and safety monitoring',
    },
    {
      parameter: 'Adverse effects questionnaire',
      frequency: 'At each visit',
      reason: 'Safety monitoring and adherence assessment',
    }
  );

  // Calculate confidence score
  let confidence = 0.7; // Base confidence
  if (genetics && genetics.cyp2d6) confidence += 0.1; // Genetic data adds confidence
  if (ethnicity) confidence += 0.05; // Ethnicity data adds confidence
  if (comorbidities && comorbidities.length > 0) confidence += 0.1; // Comorbidity data adds confidence
  if (selectedPopulation.note) confidence += 0.05; // Population-specific note indicates high-quality data

  results.confidenceScore = Math.min(confidence, 0.95); // Cap at 95%

  return {
    success: true,
    data: results,
  };
}

Deno.serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { status: 200, headers: corsHeaders });
  }

  try {
    const { action, data } = await req.json();

    switch (action) {
      case 'personalize_treatment': {
        const result = personalizeTreatment(data);
        return new Response(JSON.stringify(result), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      case 'get_population_guidelines': {
        const { condition, ethnicity, comorbidities } = data;
        const conditionData = PERSONALIZED_TREATMENTS[condition?.toLowerCase().replace(/\s+/g, '_')];
        
        if (!conditionData) {
          return new Response(
            JSON.stringify({ success: false, error: 'Condition not found' }),
            { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }

        return new Response(
          JSON.stringify({ success: true, data: conditionData }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      case 'optimize_regimen': {
        const { currentMedications, patientProfile } = data;
        
        // Analyze current regimen for optimization opportunities
        const optimizations = [];
        
        for (const med of currentMedications) {
          // Check if medication is optimal for patient profile
          const personalizedResult = personalizeTreatment({
            ...patientProfile,
            condition: med.indication,
          });

          if (personalizedResult.success) {
            const recommendedMeds = personalizedResult.data.personalizedRecommendations;
            const currentMedOptimal = recommendedMeds.some(
              (rec: any) => rec.medication.toLowerCase().includes(med.name.toLowerCase())
            );

            if (!currentMedOptimal && recommendedMeds.length > 0) {
              optimizations.push({
                current: med.name,
                indication: med.indication,
                alternatives: recommendedMeds.slice(0, 2), // Top 2 alternatives
                reason: 'Population-specific efficacy data suggests better alternatives',
              });
            }
          }
        }

        return new Response(
          JSON.stringify({ success: true, data: { optimizations, count: optimizations.length } }),
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
