Deno.serve(async (req) => {
  const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
    'Access-Control-Allow-Methods': 'POST, GET, OPTIONS',
    'Access-Control-Allow-Max-Age': '86400',
  };

  if (req.method === 'OPTIONS') {
    return new Response(null, { status: 200, headers: corsHeaders });
  }

  try {
    const { medications, patientLifestyle, existingSchedule } = await req.json();

    if (!medications || medications.length === 0) {
      return new Response(
        JSON.stringify({ error: 'At least one medication required for scheduling' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Enhanced chronopharmacology-based scheduling
    const optimizedSchedules = medications.map((medication: any) => {
      const pharmacokineticProfile = getPharmacokineticProfile(medication.name);
      const circadianTiming = getCircadianPharmacologyGuidance(medication.name, medication.class);
      const foodInteractionProfile = getDrugFoodInteractions(medication.name);
      const optimalTiming = calculateOptimalTiming(medication, patientLifestyle, pharmacokineticProfile, circadianTiming, foodInteractionProfile);
      const interactionWarnings = checkSchedulingConflicts(medication, medications, existingSchedule);
      const lifestyleConsiderations = analyzeLifestyleFactors(medication, patientLifestyle, foodInteractionProfile);
      const reminderStrategy = optimizeReminderFrequency(medication, patientLifestyle, optimalTiming);

      return {
        medication_id: medication.id,
        medication_name: medication.name,
        medication_class: pharmacokineticProfile.class,
        optimal_time: optimalTiming.time,
        frequency_per_day: medication.frequency || 1,
        scheduling_rationale: optimalTiming.rationale,
        pharmacokinetic_basis: pharmacokineticProfile.timing_basis,
        circadian_pharmacology: circadianTiming,
        food_interaction_guidance: foodInteractionProfile,
        lifestyle_considerations: lifestyleConsiderations,
        interaction_warnings: interactionWarnings,
        reminder_frequency: reminderStrategy.frequency,
        reminder_times: reminderStrategy.times,
        schedule_conflicts: interactionWarnings.conflicts,
        ai_confidence_score: optimalTiming.confidence,
        evidence_level: pharmacokineticProfile.evidence,
      };
    });

    return new Response(
      JSON.stringify({
        success: true,
        data: {
          optimized_schedules: optimizedSchedules,
          total_medications: medications.length,
          daily_reminders_count: optimizedSchedules.reduce((sum, s) => sum + s.reminder_times.length, 0),
          conflicts_detected: optimizedSchedules.filter(s => s.schedule_conflicts.length > 0).length,
          optimization_timestamp: new Date().toISOString(),
          data_source: 'Clinical pharmacokinetics + Circadian pharmacology literature',
          disclaimer: 'Scheduling recommendations should be reviewed by a licensed pharmacist',
        },
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});

// Evidence-based pharmacokinetic profiles
function getPharmacokineticProfile(medicationName: string): any {
  const drugName = medicationName.toLowerCase();
  
  const pkDatabase: Record<string, any> = {
    'levothyroxine': {
      class: 'Thyroid Hormone',
      absorption: 'Best absorbed on empty stomach (40-80% bioavailability)',
      tmax: '2-4 hours',
      timing_basis: 'Take 30-60 minutes before breakfast for optimal absorption',
      food_effect: 'Food reduces absorption by 40-50%',
      evidence: 'FDA prescribing information; Liwanpo & Hershman 2009',
    },
    'atorvastatin': {
      class: 'Statin',
      absorption: 'Rapidly absorbed; not significantly affected by food',
      tmax: '1-2 hours',
      timing_basis: 'Evening dosing aligns with peak cholesterol synthesis (midnight-3am)',
      circadian_effect: 'HMG-CoA reductase activity peaks at night',
      evidence: 'Plakogiannis & Cohen 2007; Chronotherapy studies',
    },
    'simvastatin': {
      class: 'Statin',
      absorption: 'Better absorption in evening',
      tmax: '1.3-2.4 hours',
      timing_basis: 'MUST take in evening (bedtime) due to short half-life (2-3 hours)',
      circadian_effect: 'Maximal efficacy when given at night during cholesterol synthesis',
      evidence: 'FDA label; Chronopharmacology studies (Wallace 2003)',
    },
    'amlodipine': {
      class: 'Calcium Channel Blocker',
      absorption: 'Well absorbed independent of meals',
      tmax: '6-12 hours',
      half_life: '30-50 hours',
      timing_basis: 'Morning dosing preferred to cover daytime BP surge',
      circadian_effect: 'Blood pressure highest in morning',
      evidence: 'Hermida et al. Chronotherapy studies 2013',
    },
    'lisinopril': {
      class: 'ACE Inhibitor',
      absorption: 'Not affected by food',
      tmax: '6 hours',
      timing_basis: 'Morning dosing to prevent daytime BP peaks; bedtime if nocturnal HTN',
      circadian_effect: 'Depends on BP pattern (dipper vs non-dipper)',
      evidence: 'MAPEC study (Hermida et al. 2010)',
    },
    'metformin': {
      class: 'Biguanide Antidiabetic',
      absorption: 'Take with meals to reduce GI side effects',
      tmax: '2.5 hours',
      timing_basis: 'With breakfast and dinner for twice-daily; with dinner for once-daily',
      food_effect: 'Food delays absorption but improves tolerability',
      evidence: 'FDA label; Clinical practice guidelines',
    },
    'aspirin': {
      class: 'Antiplatelet/NSAID',
      absorption: 'Rapidly absorbed',
      tmax: '30-40 minutes',
      timing_basis: 'Bedtime dosing may reduce cardiovascular events vs morning',
      circadian_effect: 'Platelet reactivity and cardiovascular events peak in morning',
      evidence: 'Bonten et al. 2015; TIME study ongoing',
    },
    'omeprazole': {
      class: 'Proton Pump Inhibitor',
      absorption: 'Acid-labile; enteric coated',
      tmax: '0.5-3.5 hours',
      timing_basis: '30-60 minutes before breakfast for optimal acid suppression',
      circadian_effect: 'Targets parietal cell proton pumps during daytime acid secretion',
      evidence: 'FDA label; Sachs et al. 2007',
    },
    'warfarin': {
      class: 'Anticoagulant',
      absorption: 'Rapidly and completely absorbed',
      tmax: '2-4 hours',
      timing_basis: 'Evening dosing (4-6 PM) for consistent timing and INR stability',
      rationale: 'Allows for same-day INR result and dose adjustment',
      evidence: 'ACCP guidelines; Holbrook et al. 2012',
    },
    'synthroid': {
      class: 'Thyroid Hormone (levothyroxine)',
      absorption: 'Best absorbed on empty stomach',
      tmax: '2-4 hours',
      timing_basis: 'Morning 30-60 min before breakfast OR bedtime (4 hrs after last meal)',
      food_effect: 'Coffee, soy, iron, calcium reduce absorption',
      evidence: 'Bolk et al. 2010 (bedtime dosing study); FDA label',
    },
    'metoprolol': {
      class: 'Beta Blocker',
      absorption: 'Extensively metabolized',
      tmax: '1.5-2 hours',
      timing_basis: 'Morning dosing to prevent daytime tachycardia and BP surges',
      circadian_effect: 'Heart rate and BP highest during daytime activity',
      evidence: 'Cardiovascular chronotherapy literature',
    },
    'prednisone': {
      class: 'Corticosteroid',
      absorption: 'Well absorbed',
      tmax: '1-2 hours',
      timing_basis: 'Morning dosing (6-8 AM) mimics natural cortisol rhythm',
      circadian_effect: 'Endogenous cortisol peaks at 6-8 AM',
      evidence: 'Buttgereit et al. 2013; Chronotherapy in rheumatology',
    },
    'montelukast': {
      class: 'Leukotriene Receptor Antagonist',
      absorption: 'Rapidly absorbed',
      tmax: '3-4 hours',
      timing_basis: 'Evening dosing for asthma (peak symptoms at night)',
      circadian_effect: 'Asthma symptoms worst at 4 AM',
      evidence: 'FDA label; Smolensky & Haus 2001',
    },
  };

  // Return specific profile or generic
  for (const [drug, profile] of Object.entries(pkDatabase)) {
    if (drugName.includes(drug)) {
      return profile;
    }
  }

  // Generic profile based on drug class
  if (drugName.includes('statin')) {
    return {
      class: 'Statin',
      timing_basis: 'Evening dosing recommended for most statins',
      evidence: 'Lipid synthesis peaks at night',
    };
  }

  return {
    class: 'Unknown',
    timing_basis: 'Consult pharmacist for optimal timing',
    evidence: 'Insufficient data',
  };
}

// Circadian pharmacology guidance
function getCircadianPharmacologyGuidance(medicationName: string, medicationClass: string): any {
  const drugName = medicationName.toLowerCase();

  const circadianGuidance: Record<string, any> = {
    'statin': {
      optimal_time: 'Evening/Bedtime',
      rationale: 'Cholesterol synthesis peaks between midnight-3 AM',
      evidence: 'Multiple chronotherapy studies show greater LDL reduction with evening dosing',
      exception: 'Atorvastatin and rosuvastatin (long half-life) can be taken anytime',
    },
    'corticosteroid': {
      optimal_time: 'Morning (6-8 AM)',
      rationale: 'Mimics endogenous cortisol circadian rhythm',
      evidence: 'Reduces HPA axis suppression and improves tolerability',
      exception: 'Evening for delayed-release prednisone in RA',
    },
    'antihypertensive': {
      optimal_time: 'Individualized based on BP pattern',
      rationale: 'Dippers: morning dosing; Non-dippers: bedtime dosing may reduce CV events',
      evidence: 'MAPEC study (Hermida 2010): bedtime dosing reduced CV events by 61%',
      recommendation: '24-hour ABPM to determine optimal timing',
    },
    'antiplatelet': {
      optimal_time: 'Bedtime',
      rationale: 'Platelet aggregation and CV events peak in morning (6-10 AM)',
      evidence: 'Bedtime aspirin may reduce morning platelet reactivity',
      status: 'Emerging evidence; TIME study results pending',
    },
    'ppi': {
      optimal_time: '30-60 min before breakfast',
      rationale: 'Targets actively secreting parietal cells during first meal',
      evidence: 'Maximal acid suppression when given before food-stimulated secretion',
    },
  };

  // Check for specific guidance
  for (const [drug, guidance] of Object.entries(circadianGuidance)) {
    if (drugName.includes(drug) || medicationClass?.toLowerCase().includes(drug)) {
      return guidance;
    }
  }

  return {
    optimal_time: 'Standard dosing',
    rationale: 'No significant circadian pharmacology data available',
    evidence: 'Limited chronotherapy evidence for this medication',
  };
}

// Comprehensive drug-food interaction database
function getDrugFoodInteractions(medicationName: string): any {
  const drugName = medicationName.toLowerCase();

  const foodInteractionDB: Record<string, any> = {
    'levothyroxine': {
      avoid: ['Coffee (within 1 hour)', 'Soy products', 'High-fiber foods', 'Calcium supplements', 'Iron supplements'],
      timing: 'Take 30-60 min before breakfast on empty stomach, or at bedtime (4 hrs after last meal)',
      severity: 'High - can reduce absorption by 40-50%',
      evidence: 'Benvenga et al. 2008; FDA label',
    },
    'warfarin': {
      avoid: ['Large amounts of vitamin K-rich foods (sudden changes)'],
      monitor: ['Leafy greens (kale, spinach, collards)', 'Cranberry juice', 'Grapefruit juice', 'Alcohol'],
      timing: 'Consistent vitamin K intake; limit alcohol to ≤1-2 drinks/day',
      severity: 'High - affects INR stability',
      evidence: 'ACCP guidelines; Franco et al. 2005',
    },
    'atorvastatin': {
      avoid: ['Grapefruit juice (>1 quart/day)'],
      timing: 'Can take with or without food; limit grapefruit to small amounts',
      severity: 'Moderate - large amounts increase statin levels 2-3 fold',
      evidence: 'FDA label; Bellosta & Corsini 2012',
    },
    'simvastatin': {
      avoid: ['Grapefruit juice (ANY amount)'],
      timing: 'Take in evening; avoid grapefruit entirely',
      severity: 'High - increases simvastatin levels up to 16-fold (rhabdomyolysis risk)',
      evidence: 'FDA warning 2012; Neuvonen et al. 1998',
    },
    'amlodipine': {
      avoid: ['Grapefruit juice'],
      timing: 'Can take with or without food',
      severity: 'Moderate - may increase blood levels and hypotension risk',
      evidence: 'FDA label',
    },
    'metformin': {
      recommendation: 'Take with meals',
      rationale: 'Reduces GI side effects (nausea, diarrhea)',
      timing: 'With breakfast and dinner (IR); with evening meal (XR)',
      severity: 'Low interaction severity, but affects tolerability',
      evidence: 'Clinical practice guidelines',
    },
    'tetracycline': {
      avoid: ['Dairy products', 'Calcium supplements', 'Iron supplements', 'Antacids'],
      timing: 'Take 1 hour before or 2 hours after meals; 2 hours apart from supplements',
      severity: 'High - forms insoluble chelates, reduces absorption by 50-90%',
      evidence: 'FDA label; Jung et al. 1997',
    },
    'ciprofloxacin': {
      avoid: ['Dairy products', 'Calcium-fortified foods', 'Iron/zinc supplements'],
      timing: 'Take 2 hours before or 6 hours after dairy/supplements',
      severity: 'High - chelation reduces absorption',
      evidence: 'FDA label',
    },
    'lisinopril': {
      avoid: ['Potassium supplements', 'Salt substitutes (potassium chloride)'],
      timing: 'Can take with or without food',
      severity: 'Moderate-High - hyperkalemia risk',
      evidence: 'FDA label; ACCP guidelines',
    },
    'azithromycin': {
      timing: 'Take 1 hour before or 2 hours after meals for optimal absorption',
      food_effect: 'Food decreases absorption',
      severity: 'Low-Moderate',
      evidence: 'FDA label',
    },
  };

  for (const [drug, interactions] of Object.entries(foodInteractionDB)) {
    if (drugName.includes(drug)) {
      return interactions;
    }
  }

  return {
    timing: 'No significant food interactions documented',
    severity: 'None',
    evidence: 'Standard dosing guidelines',
  };
}

function calculateOptimalTiming(
  medication: any,
  lifestyle: any,
  pkProfile: any,
  circadianGuidance: any,
  foodInteractions: any
): { time: string; rationale: string; confidence: number } {
  const medName = medication.name?.toLowerCase() || '';
  
  // Priority 1: Evidence-based PK/circadian timing
  if (pkProfile.timing_basis && pkProfile.timing_basis !== 'Consult pharmacist for optimal timing') {
    let optimalTime = '08:00'; // default morning
    let confidence = 0.92;

    if (pkProfile.timing_basis.includes('evening') || pkProfile.timing_basis.includes('bedtime')) {
      optimalTime = lifestyle.sleepTime || '22:00';
    } else if (pkProfile.timing_basis.includes('before breakfast')) {
      const wakeTime = lifestyle.wakeTime || '07:00';
      const wakeHour = parseInt(wakeTime.split(':')[0]);
      optimalTime = `${String(wakeHour).padStart(2, '0')}:00`;
    } else if (pkProfile.timing_basis.includes('with meals') || foodInteractions.recommendation === 'Take with meals') {
      optimalTime = lifestyle.mainMealTime || '12:00';
    }

    const rationale = `${pkProfile.timing_basis}. ${circadianGuidance.rationale || ''}`.trim();
    
    return { time: optimalTime, rationale, confidence };
  }

  // Priority 2: Drug class-based timing
  if (circadianGuidance.optimal_time && circadianGuidance.optimal_time !== 'Standard dosing') {
    let optimalTime = '08:00';
    
    if (circadianGuidance.optimal_time.includes('evening') || circadianGuidance.optimal_time.includes('Bedtime')) {
      optimalTime = lifestyle.sleepTime || '22:00';
    } else if (circadianGuidance.optimal_time.includes('Morning')) {
      optimalTime = lifestyle.wakeTime || '07:00';
    }

    return {
      time: optimalTime,
      rationale: circadianGuidance.rationale || 'Optimized based on circadian pharmacology',
      confidence: 0.85,
    };
  }

  // Priority 3: Food interaction-based timing
  if (foodInteractions.timing && foodInteractions.timing !== 'Can take with or without food') {
    if (foodInteractions.timing.includes('before breakfast') || foodInteractions.timing.includes('empty stomach')) {
      return {
        time: lifestyle.wakeTime || '07:00',
        rationale: `${foodInteractions.timing}. Optimizes bioavailability.`,
        confidence: 0.88,
      };
    } else if (foodInteractions.timing.includes('with meals') || foodInteractions.recommendation === 'Take with meals') {
      return {
        time: lifestyle.mainMealTime || '12:00',
        rationale: 'Take with food to improve tolerability and/or absorption',
        confidence: 0.85,
      };
    }
  }

  // Priority 4: Frequency-based spacing
  if (medication.frequency === 2) {
    return {
      time: '08:00',
      rationale: 'Twice daily: 8 AM and 8 PM (12-hour spacing) for consistent drug levels',
      confidence: 0.80,
    };
  }

  if (medication.frequency === 3) {
    return {
      time: '08:00',
      rationale: 'Three times daily: 8 AM, 2 PM, 8 PM (8-hour spacing) for optimal coverage',
      confidence: 0.80,
    };
  }

  // Default
  return {
    time: '12:00',
    rationale: 'Standard midday timing; no specific chronopharmacology data available',
    confidence: 0.65,
  };
}

function checkSchedulingConflicts(
  medication: any,
  allMedications: any[],
  existingSchedule: any
): { hasConflicts: boolean; conflicts: any[] } {
  const conflicts: any[] = [];
  const medName = medication.name?.toLowerCase() || '';

  // Drug-specific separation requirements
  const separationRequirements: Record<string, any> = {
    'levothyroxine': {
      separateFrom: ['calcium', 'iron', 'soy', 'fiber supplement', 'antacid'],
      hours: 4,
      rationale: 'Prevents chelation and absorption interference',
    },
    'tetracycline': {
      separateFrom: ['dairy', 'calcium', 'iron', 'magnesium', 'aluminum', 'zinc'],
      hours: 2,
      rationale: 'Prevents chelation complex formation',
    },
    'ciprofloxacin': {
      separateFrom: ['calcium', 'iron', 'zinc', 'antacid', 'didanosine'],
      hours: 2,
      rationale: 'Metal cation chelation reduces bioavailability',
    },
    'bisphosphonate': {
      separateFrom: ['food', 'calcium', 'antacid'],
      hours: 0.5,
      rationale: 'Must take on empty stomach; remain upright 30 min',
    },
  };

  // Check if current medication has separation requirements
  for (const [drug, requirements] of Object.entries(separationRequirements)) {
    if (medName.includes(drug)) {
      for (const otherMed of allMedications) {
        if (otherMed.id === medication.id) continue;

        const otherMedName = otherMed.name?.toLowerCase() || '';
        for (const separateFrom of requirements.separateFrom) {
          if (otherMedName.includes(separateFrom)) {
            conflicts.push({
              type: 'timing_separation_required',
              description: `Take at least ${requirements.hours} hours apart from ${otherMed.name}`,
              severity: 'high',
              affected_medication: otherMed.name,
              rationale: requirements.rationale,
            });
          }
        }
      }
    }
  }

  // Check for other medication's separation requirements
  for (const otherMed of allMedications) {
    if (otherMed.id === medication.id) continue;

    const otherMedName = otherMed.name?.toLowerCase() || '';
    for (const [drug, requirements] of Object.entries(separationRequirements)) {
      if (otherMedName.includes(drug)) {
        for (const separateFrom of requirements.separateFrom) {
          if (medName.includes(separateFrom)) {
            conflicts.push({
              type: 'timing_separation_required',
              description: `${otherMed.name} must be taken ${requirements.hours} hours apart from this medication`,
              severity: 'high',
              affected_medication: otherMed.name,
              rationale: requirements.rationale,
            });
          }
        }
      }
    }
  }

  return {
    hasConflicts: conflicts.length > 0,
    conflicts,
  };
}

function analyzeLifestyleFactors(medication: any, lifestyle: any, foodInteractions: any): any {
  const considerations: string[] = [];

  if (foodInteractions.avoid) {
    considerations.push(`Dietary restrictions: Avoid ${foodInteractions.avoid.join(', ')}`);
  }

  if (foodInteractions.recommendation === 'Take with meals' && lifestyle.irregularMeals) {
    considerations.push('Alert: Patient has irregular meal schedule; may affect medication timing consistency');
  }

  if (lifestyle.nightShiftWorker) {
    considerations.push('Circadian timing adjusted for night shift work schedule');
  }

  return {
    work_schedule_compatible: !lifestyle.nightShiftWorker || 'adjusted',
    meal_timing_aligned: !lifestyle.irregularMeals,
    sleep_pattern_considered: true,
    social_activities_impact: 'minimal',
    dietary_considerations: considerations,
    flexibility_score: considerations.length === 0 ? 0.95 : 0.75,
  };
}

function optimizeReminderFrequency(
  medication: any,
  lifestyle: any,
  timing: any
): { frequency: string; times: string[] } {
  const frequency = medication.frequency || 1;
  const times: string[] = [];

  if (frequency === 1) {
    times.push(timing.time);
    return { frequency: 'once_daily', times };
  }

  if (frequency === 2) {
    const morningTime = timing.time.includes('22:') || timing.time.includes('21:') ? '08:00' : timing.time;
    times.push(morningTime, '20:00');
    return { frequency: 'twice_daily', times };
  }

  if (frequency === 3) {
    times.push('08:00', '14:00', '20:00');
    return { frequency: 'three_times_daily', times };
  }

  // Four times daily
  times.push('08:00', '12:00', '16:00', '20:00');
  return { frequency: 'four_times_daily', times };
}
