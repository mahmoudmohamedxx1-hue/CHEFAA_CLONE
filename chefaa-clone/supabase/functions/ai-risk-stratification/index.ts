// AI-Powered Risk Stratification Edge Function
// Patient risk assessment and scoring across multiple clinical dimensions

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

// Clinical risk scoring models
const RISK_MODELS = {
  cardiovascular: {
    name: 'ASCVD Risk Score (Pooled Cohort Equations)',
    factors: ['age', 'sex', 'race', 'totalCholesterol', 'hdl', 'systolicBP', 'bpTreated', 'diabetes', 'smoker'],
    interpretation: {
      low: { range: [0, 5], action: 'Lifestyle modifications' },
      borderline: { range: [5, 7.5], action: 'Consider statin if risk-enhancing factors present' },
      intermediate: { range: [7.5, 20], action: 'Statin therapy recommended' },
      high: { range: [20, 100], action: 'High-intensity statin therapy' },
    },
  },
  bleeding: {
    name: 'HAS-BLED Score',
    factors: ['hypertension', 'abnormalRenalLiver', 'stroke', 'bleedingHistory', 'labile INR', 'elderly', 'drugs', 'alcohol'],
    maxScore: 9,
    interpretation: {
      low: { range: [0, 2], action: 'Low bleeding risk' },
      moderate: { range: [3, 3], action: 'Moderate bleeding risk, caution with anticoagulation' },
      high: { range: [4, 9], action: 'High bleeding risk, close monitoring required' },
    },
  },
  falls: {
    name: 'STRATIFY Falls Risk Assessment',
    factors: ['recentFalls', 'agitation', 'visualImpairment', 'frequentToileting', 'transferMobility'],
    maxScore: 5,
    interpretation: {
      low: { range: [0, 1], action: 'Standard care' },
      moderate: { range: [2, 2], action: 'Fall prevention interventions' },
      high: { range: [3, 5], action: 'Intensive fall prevention, consider medication review' },
    },
  },
  frailty: {
    name: 'Clinical Frailty Scale',
    levels: {
      1: 'Very Fit',
      2: 'Well',
      3: 'Managing Well',
      4: 'Vulnerable',
      5: 'Mildly Frail',
      6: 'Moderately Frail',
      7: 'Severely Frail',
      8: 'Very Severely Frail',
      9: 'Terminally Ill',
    },
    interpretation: {
      robust: { range: [1, 3], action: 'Standard treatment approach' },
      vulnerable: { range: [4, 4], action: 'Monitor closely, preventive interventions' },
      frail: { range: [5, 9], action: 'Comprehensive geriatric assessment, individualized care' },
    },
  },
};

function calculateASCVDRisk(data: any) {
  const { age, sex, race, totalCholesterol, hdl, systolicBP, bpTreated, diabetes, smoker } = data;
  
  // Simplified ASCVD calculation (actual calculation is more complex)
  let score = 0;
  
  // Age component (simplified)
  if (age >= 40 && age < 50) score += 3;
  else if (age >= 50 && age < 60) score += 6;
  else if (age >= 60 && age < 70) score += 10;
  else if (age >= 70) score += 15;
  
  // Sex component
  if (sex === 'male') score += 2;
  
  // Race component
  if (race === 'African American') score += 1;
  
  // Cholesterol component
  const cholesterolRatio = totalCholesterol / hdl;
  if (cholesterolRatio > 5) score += 3;
  else if (cholesterolRatio > 4) score += 2;
  else if (cholesterolRatio > 3) score += 1;
  
  // Blood pressure component
  if (systolicBP >= 160) score += 4;
  else if (systolicBP >= 140) score += 2;
  else if (systolicBP >= 130) score += 1;
  
  if (bpTreated) score += 1;
  
  // Diabetes
  if (diabetes) score += 4;
  
  // Smoking
  if (smoker) score += 3;
  
  // Convert to percentage (simplified formula)
  const riskPercent = Math.min(score * 1.5, 100);
  
  return {
    score: riskPercent,
    interpretation: getRiskInterpretation(riskPercent, RISK_MODELS.cardiovascular.interpretation),
    recommendations: generateCVDRecommendations(riskPercent, data),
  };
}

function calculateHASBLED(data: any) {
  let score = 0;
  
  if (data.hypertension) score += 1;
  if (data.abnormalRenalLiver) score += 1;
  if (data.stroke) score += 1;
  if (data.bleedingHistory) score += 1;
  if (data.labileINR) score += 1;
  if (data.elderly) score += 1;
  if (data.drugsOrAlcohol) score += 1;
  
  return {
    score,
    maxScore: RISK_MODELS.bleeding.maxScore,
    interpretation: getRiskInterpretation(score, RISK_MODELS.bleeding.interpretation),
    recommendations: generateBleedingRecommendations(score),
  };
}

function getRiskInterpretation(score: number, interpretationMap: any) {
  for (const [level, data] of Object.entries(interpretationMap)) {
    const range = data.range as number[];
    if (score >= range[0] && score <= range[1]) {
      return {
        level,
        action: data.action,
        range: `${range[0]}-${range[1]}%`,
      };
    }
  }
  return { level: 'unknown', action: 'Consult physician', range: 'N/A' };
}

function generateCVDRecommendations(risk: number, data: any) {
  const recommendations = [];
  
  if (risk >= 7.5) {
    recommendations.push({
      category: 'Pharmacotherapy',
      recommendation: risk >= 20 ? 'High-intensity statin (Atorvastatin 40-80mg or Rosuvastatin 20-40mg)' : 'Moderate-intensity statin',
      evidence: 'ACC/AHA Guidelines 2019',
      priority: 'High',
    });
  }
  
  if (data.systolicBP >= 130) {
    recommendations.push({
      category: 'Blood Pressure Management',
      recommendation: 'Target BP <130/80 mmHg',
      evidence: 'ACC/AHA BP Guidelines 2017',
      priority: 'High',
    });
  }
  
  if (data.smoker) {
    recommendations.push({
      category: 'Smoking Cessation',
      recommendation: 'Immediate smoking cessation with pharmacotherapy and counseling',
      evidence: 'Reduces CVD risk by 50% within 1 year',
      priority: 'Critical',
    });
  }
  
  recommendations.push({
    category: 'Lifestyle',
    recommendation: 'Mediterranean diet, 150min/week moderate exercise, weight management',
    evidence: 'PREDIMED trial, multiple RCTs',
    priority: 'High',
  });
  
  return recommendations;
}

function generateBleedingRecommendations(score: number) {
  const recommendations = [];
  
  if (score >= 3) {
    recommendations.push({
      category: 'Anticoagulation Management',
      recommendation: 'More frequent INR monitoring (if on warfarin) or consider DOAC with lower bleeding risk',
      priority: 'High',
    });
    
    recommendations.push({
      category: 'Medication Review',
      recommendation: 'Avoid NSAIDs, minimize antiplatelet therapy if possible',
      priority: 'High',
    });
  }
  
  recommendations.push({
    category: 'Monitoring',
    recommendation: 'Regular assessment for signs of bleeding, patient education on bleeding symptoms',
    priority: 'Medium',
  });
  
  return recommendations;
}

function performComprehensiveRiskAssessment(patientData: any) {
  const assessments = {};
  
  // Cardiovascular risk
  if (patientData.cardiovascular) {
    assessments['cardiovascular'] = calculateASCVDRisk(patientData.cardiovascular);
  }
  
  // Bleeding risk
  if (patientData.bleeding) {
    assessments['bleeding'] = calculateHASBLED(patientData.bleeding);
  }
  
  // Falls risk
  if (patientData.falls) {
    let fallsScore = 0;
    if (patientData.falls.recentFalls) fallsScore += 2;
    if (patientData.falls.agitation) fallsScore += 1;
    if (patientData.falls.visualImpairment) fallsScore += 1;
    if (patientData.falls.frequentToileting) fallsScore += 1;
    if (patientData.falls.transferMobility) fallsScore += 1;
    
    assessments['falls'] = {
      score: fallsScore,
      maxScore: 5,
      interpretation: getRiskInterpretation(fallsScore, RISK_MODELS.falls.interpretation),
    };
  }
  
  // Overall risk summary
  const overallRisk = calculateOverallRisk(assessments);
  
  return {
    success: true,
    data: {
      individualAssessments: assessments,
      overallRisk,
      actionPlan: generateActionPlan(assessments),
      followUpSchedule: generateFollowUpSchedule(assessments),
    },
  };
}

function calculateOverallRisk(assessments: any) {
  const riskLevels = { low: 1, borderline: 2, moderate: 3, intermediate: 3, high: 4, critical: 5 };
  let totalRiskScore = 0;
  let count = 0;
  
  for (const [domain, assessment] of Object.entries(assessments)) {
    if (assessment.interpretation && assessment.interpretation.level) {
      const level = assessment.interpretation.level.toLowerCase();
      totalRiskScore += riskLevels[level] || 2;
      count++;
    }
  }
  
  const avgRisk = count > 0 ? totalRiskScore / count : 0;
  
  if (avgRisk >= 4) return { level: 'High', color: 'red', action: 'Urgent intervention required' };
  if (avgRisk >= 3) return { level: 'Moderate', color: 'orange', action: 'Active management needed' };
  if (avgRisk >= 2) return { level: 'Low-Moderate', color: 'yellow', action: 'Preventive measures recommended' };
  return { level: 'Low', color: 'green', action: 'Standard care appropriate' };
}

function generateActionPlan(assessments: any) {
  const actions = [];
  
  for (const [domain, assessment] of Object.entries(assessments)) {
    if (assessment.recommendations) {
      actions.push(...assessment.recommendations.map((rec: any) => ({
        ...rec,
        domain,
      })));
    }
  }
  
  return actions.sort((a, b) => {
    const priorityOrder = { Critical: 0, High: 1, Medium: 2, Low: 3 };
    return priorityOrder[a.priority] - priorityOrder[b.priority];
  });
}

function generateFollowUpSchedule(assessments: any) {
  const schedule = [];
  
  if (assessments.cardiovascular && assessments.cardiovascular.score >= 7.5) {
    schedule.push({
      timeframe: '3 months',
      purpose: 'Lipid panel and statin efficacy assessment',
      parameters: ['Total cholesterol', 'LDL', 'HDL', 'ALT', 'CK'],
    });
  }
  
  if (assessments.bleeding && assessments.bleeding.score >= 3) {
    schedule.push({
      timeframe: '1 month',
      purpose: 'Bleeding risk monitoring and medication review',
      parameters: ['Complete blood count', 'INR (if on warfarin)', 'Symptom assessment'],
    });
  }
  
  return schedule;
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { status: 200, headers: corsHeaders });
  }

  try {
    const { action, data } = await req.json();

    switch (action) {
      case 'assess_risk': {
        const result = performComprehensiveRiskAssessment(data);
        return new Response(JSON.stringify(result), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      case 'calculate_cvd_risk': {
        const result = calculateASCVDRisk(data);
        return new Response(
          JSON.stringify({ success: true, data: result }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      case 'calculate_bleeding_risk': {
        const result = calculateHASBLED(data);
        return new Response(
          JSON.stringify({ success: true, data: result }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      case 'get_risk_models': {
        return new Response(
          JSON.stringify({ success: true, data: RISK_MODELS }),
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
