// AI-Powered Predictive Analytics Edge Function
// Time-series predictions for medication adherence, refills, and outcomes

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

// Predictive models for various healthcare metrics
function predictMedicationAdherence(historicalData: any) {
  const { pastAdherence, demographics, medicationComplexity, sideEffects, cost } = historicalData;

  // Calculate adherence trend
  const trend = calculateTrend(pastAdherence);
  
  // Risk factors scoring
  let riskScore = 0;
  if (medicationComplexity === 'high') riskScore += 3;
  if (sideEffects === 'yes') riskScore += 2;
  if (cost === 'high') riskScore += 2;
  if (demographics.age > 75) riskScore += 1;
  
  // Predict future adherence (simplified model)
  const baseAdherence = pastAdherence[pastAdherence.length - 1] || 75;
  const trendAdjustment = trend * 5;
  const riskAdjustment = riskScore * -3;
  
  const predictedAdherence = Math.max(20, Math.min(100, baseAdherence + trendAdjustment + riskAdjustment));
  
  // Generate 3-month predictions
  const predictions = [
    { month: 1, adherence: predictedAdherence, confidence: 0.85 },
    { month: 2, adherence: Math.max(20, predictedAdherence + (trend * 2)), confidence: 0.75 },
    { month: 3, adherence: Math.max(20, predictedAdherence + (trend * 3)), confidence: 0.65 },
  ];

  return {
    success: true,
    data: {
      currentAdherence: baseAdherence,
      predictions,
      trend: trend > 0 ? 'improving' : trend < 0 ? 'declining' : 'stable',
      riskLevel: riskScore >= 5 ? 'high' : riskScore >= 3 ? 'moderate' : 'low',
      interventions: generateAdherenceInterventions(riskScore, sideEffects, cost),
    },
  };
}

function predictRefillTiming(medicationHistory: any) {
  const { lastRefillDate, daysSupply, averageRefillDelay, adherenceRate } = medicationHistory;
  
  const expectedRunOutDate = new Date(lastRefillDate);
  expectedRunOutDate.setDate(expectedRunOutDate.getDate() + daysSupply);
  
  // Adjust for adherence
  const adjustedDays = daysSupply * (adherenceRate / 100);
  const predictedRunOutDate = new Date(lastRefillDate);
  predictedRunOutDate.setDate(predictedRunOutDate.getDate() + adjustedDays);
  
  // Predict refill date (accounting for delay)
  const predictedRefillDate = new Date(predictedRunOutDate);
  predictedRefillDate.setDate(predictedRefillDate.getDate() + (averageRefillDelay || 0));
  
  // Calculate optimal reminder date (7 days before run-out)
  const reminderDate = new Date(predictedRunOutDate);
  reminderDate.setDate(reminderDate.getDate() - 7);
  
  return {
    success: true,
    data: {
      expectedRunOut: predictedRunOutDate.toISOString().split('T')[0],
      predictedRefillDate: predictedRefillDate.toISOString().split('T')[0],
      recommendedReminderDate: reminderDate.toISOString().split('T')[0],
      daysUntilRunOut: Math.ceil((predictedRunOutDate.getTime() - Date.now()) / (1000 * 60 * 60 * 24)),
      confidence: adherenceRate >= 80 ? 0.9 : adherenceRate >= 60 ? 0.75 : 0.6,
    },
  };
}

function predictTreatmentOutcome(treatmentData: any) {
  const { condition, medication, patientAge, comorbidities, baselineSeverity } = treatmentData;
  
  // Simplified outcome prediction model
  let successProbability = 0.7; // Base success rate
  
  // Age adjustment
  if (patientAge < 50) successProbability += 0.1;
  else if (patientAge > 70) successProbability -= 0.1;
  
  // Comorbidity adjustment
  successProbability -= (comorbidities?.length || 0) * 0.05;
  
  // Baseline severity adjustment
  if (baselineSeverity === 'mild') successProbability += 0.15;
  else if (baselineSeverity === 'severe') successProbability -= 0.15;
  
  successProbability = Math.max(0.2, Math.min(0.95, successProbability));
  
  // Time to improvement predictions
  const timeToImprovement = baselineSeverity === 'mild' ? 4 : baselineSeverity === 'moderate' ? 8 : 12;
  
  return {
    success: true,
    data: {
      condition,
      medication,
      outcomesPrediction: {
        successProbability: (successProbability * 100).toFixed(0) + '%',
        estimatedTimeToImprovement: `${timeToImprovement} weeks`,
        confidenceInterval: `${((successProbability - 0.15) * 100).toFixed(0)}% - ${((successProbability + 0.15) * 100).toFixed(0)}%`,
      },
      milestones: [
        { week: Math.floor(timeToImprovement / 3), expected: 'Initial response', probability: 0.8 },
        { week: Math.floor(timeToImprovement * 2 / 3), expected: 'Moderate improvement', probability: 0.7 },
        { week: timeToImprovement, expected: 'Target response', probability: successProbability },
      ],
      monitoringRecommendations: [
        `Assess response at week ${Math.floor(timeToImprovement / 3)}`,
        `Consider dose adjustment if no response by week ${Math.floor(timeToImprovement / 2)}`,
        `Re-evaluate treatment if no improvement by week ${timeToImprovement}`,
      ],
    },
  };
}

function calculateTrend(data: number[]): number {
  if (data.length < 2) return 0;
  const recent = data.slice(-3);
  const older = data.slice(0, Math.min(3, data.length - 3));
  const recentAvg = recent.reduce((a, b) => a + b, 0) / recent.length;
  const olderAvg = older.length > 0 ? older.reduce((a, b) => a + b, 0) / older.length : recentAvg;
  return recentAvg - olderAvg;
}

function generateAdherenceInterventions(riskScore: number, sideEffects: string, cost: string) {
  const interventions = [];
  
  if (sideEffects === 'yes') {
    interventions.push({
      type: 'Side Effect Management',
      action: 'Schedule medication review to address side effects',
      priority: 'High',
    });
  }
  
  if (cost === 'high') {
    interventions.push({
      type: 'Cost Reduction',
      action: 'Evaluate generic alternatives and assistance programs',
      priority: 'High',
    });
  }
  
  if (riskScore >= 5) {
    interventions.push({
      type: 'Intensive Monitoring',
      action: 'Weekly check-ins with pharmacist or nurse',
      priority: 'Critical',
    });
  }
  
  interventions.push({
    type: 'Patient Education',
    action: 'Provide written materials and medication calendar',
    priority: 'Medium',
  });
  
  return interventions;
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { status: 200, headers: corsHeaders });
  }

  try {
    const { action, data } = await req.json();

    switch (action) {
      case 'predict_adherence': {
        const result = predictMedicationAdherence(data);
        return new Response(JSON.stringify(result), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      case 'predict_refill_timing': {
        const result = predictRefillTiming(data);
        return new Response(JSON.stringify(result), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      case 'predict_treatment_outcome': {
        const result = predictTreatmentOutcome(data);
        return new Response(JSON.stringify(result), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
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
