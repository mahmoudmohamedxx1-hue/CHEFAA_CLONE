import { supabase } from './supabase';

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL || 'https://hdcpruwkvarfbdtztzgq.supabase.co';

class AIAPI {
  private async callFunction(functionName: string, data: any) {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      
      const response = await fetch(`${SUPABASE_URL}/functions/v1/${functionName}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session?.access_token || ''}`,
        },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || `HTTP ${response.status}`);
      }

      return await response.json();
    } catch (error: any) {
      console.error(`AI API Error (${functionName}):`, error);
      throw error;
    }
  }

  // Genetic Analysis & Personalized Recommendations
  async analyzeGeneticProfile(geneticMarkers: any, medications: any[], userId: string) {
    return this.callFunction('ai-genetic-analysis', {
      geneticMarkers,
      medications,
      userId,
    });
  }

  // Adherence Prediction
  async predictAdherence(userId: string, medicationHistory: any[], behavioralData: any, demographics: any) {
    return this.callFunction('ai-adherence-prediction', {
      userId,
      medicationHistory,
      behavioralData,
      demographics,
    });
  }

  // Drug Interaction Analysis
  async analyzeDrugInteractions(medications: any[]) {
    return this.callFunction('ai-drug-interactions', {
      medications,
    });
  }

  // Clinical Note Summarization
  async summarizeClinicalNote(clinicalNote: string, noteType: string, language = 'en') {
    return this.callFunction('ai-clinical-summarization', {
      clinicalNote,
      noteType,
      language,
    });
  }

  // Smart Medication Scheduling
  async optimizeMedicationSchedule(medications: any[], patientLifestyle: any, existingSchedule: any) {
    return this.callFunction('ai-smart-scheduling', {
      medications,
      patientLifestyle,
      existingSchedule,
    });
  }

  // Adverse Event Prediction
  async predictAdverseEvents(userId: string, medications: any[], patientProfile: any, vitals: any, medicalHistory: any) {
    return this.callFunction('ai-adverse-events', {
      userId,
      medications,
      patientProfile,
      vitals,
      medicalHistory,
    });
  }

  // NEW: Personalized Medicine - Population-specific treatment recommendations
  async personalizeTreatment(patientProfile: any) {
    return this.callFunction('ai-personalized-medicine', {
      action: 'personalize_treatment',
      data: patientProfile,
    });
  }

  async optimizeRegimen(currentMedications: any[], patientProfile: any) {
    return this.callFunction('ai-personalized-medicine', {
      action: 'optimize_regimen',
      data: { currentMedications, patientProfile },
    });
  }

  // NEW: Price Optimization - Medication cost analysis
  async analyzePricing(medication: string, quantity: number = 30, insurance: any = null) {
    return this.callFunction('ai-price-optimization', {
      action: 'analyze_pricing',
      data: { medication, quantity, insurance },
    });
  }

  async compareRegimenCosts(medications: any[], insurance: any = null) {
    return this.callFunction('ai-price-optimization', {
      action: 'compare_regimen_costs',
      data: { medications, insurance },
    });
  }

  // NEW: Risk Stratification - Patient risk assessment
  async assessRisk(patientData: any) {
    return this.callFunction('ai-risk-stratification', {
      action: 'assess_risk',
      data: patientData,
    });
  }

  async calculateCVDRisk(cardiovascularData: any) {
    return this.callFunction('ai-risk-stratification', {
      action: 'calculate_cvd_risk',
      data: cardiovascularData,
    });
  }

  async calculateBleedingRisk(bleedingData: any) {
    return this.callFunction('ai-risk-stratification', {
      action: 'calculate_bleeding_risk',
      data: bleedingData,
    });
  }

  // NEW: Drug Discovery - Repurposing analysis
  async analyzeDrugRepurposing(drugName: string) {
    return this.callFunction('ai-drug-discovery', {
      action: 'analyze_repurposing',
      data: { drugName },
    });
  }

  async predictCombinationSynergy(drug1: string, drug2: string) {
    return this.callFunction('ai-drug-discovery', {
      action: 'predict_combination_synergy',
      data: { drug1, drug2 },
    });
  }

  // NEW: Predictive Analytics - Time-series predictions
  async predictAdherenceTrend(historicalData: any) {
    return this.callFunction('ai-predictive-analytics', {
      action: 'predict_adherence',
      data: historicalData,
    });
  }

  async predictRefillTiming(medicationHistory: any) {
    return this.callFunction('ai-predictive-analytics', {
      action: 'predict_refill_timing',
      data: medicationHistory,
    });
  }

  async predictTreatmentOutcome(treatmentData: any) {
    return this.callFunction('ai-predictive-analytics', {
      action: 'predict_treatment_outcome',
      data: treatmentData,
    });
  }

  // NEW: Clinical Decision Support - Point-of-care recommendations
  async getClinicalDecisionSupport(clinicalScenario: any) {
    return this.callFunction('ai-clinical-decision-support', {
      action: 'get_clinical_decision_support',
      data: clinicalScenario,
    });
  }

  async calculateMedicationDose(medication: string, patientData: any) {
    return this.callFunction('ai-clinical-decision-support', {
      action: 'calculate_dose',
      data: { medication, patientData },
    });
  }

  // Database operations for storing results
  async saveGeneticProfile(profileData: any) {
    const { data, error } = await supabase
      .from('genetic_profiles')
      .insert([profileData])
      .select();

    if (error) throw error;
    return data;
  }

  async saveMedicationRecommendation(recommendationData: any) {
    const { data, error } = await supabase
      .from('medication_recommendations')
      .insert([recommendationData])
      .select();

    if (error) throw error;
    return data;
  }

  async saveAdherencePrediction(predictionData: any) {
    const { data, error } = await supabase
      .from('adherence_predictions')
      .insert([predictionData])
      .select();

    if (error) throw error;
    return data;
  }

  async saveClinicalNoteSummary(summaryData: any) {
    const { data, error } = await supabase
      .from('clinical_note_summaries')
      .insert([summaryData])
      .select();

    if (error) throw error;
    return data;
  }

  async saveMedicationSchedule(scheduleData: any) {
    const { data, error } = await supabase
      .from('smart_medication_schedules')
      .insert([scheduleData])
      .select();

    if (error) throw error;
    return data;
  }

  async saveAdverseEventPrediction(predictionData: any) {
    const { data, error } = await supabase
      .from('adverse_event_predictions')
      .insert([predictionData])
      .select();

    if (error) throw error;
    return data;
  }

  // Retrieve historical data
  async getUserGeneticProfiles(userId: string) {
    const { data, error } = await supabase
      .from('genetic_profiles')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data;
  }

  async getUserMedicationRecommendations(userId: string) {
    const { data, error } = await supabase
      .from('medication_recommendations')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(10);

    if (error) throw error;
    return data;
  }

  async getUserAdherencePredictions(userId: string) {
    const { data, error } = await supabase
      .from('adherence_predictions')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(10);

    if (error) throw error;
    return data;
  }

  async getUserClinicalNotes(userId: string) {
    const { data, error } = await supabase
      .from('clinical_note_summaries')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(10);

    if (error) throw error;
    return data;
  }

  async getUserMedicationSchedules(userId: string) {
    const { data, error } = await supabase
      .from('smart_medication_schedules')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data;
  }

  async getUserAdverseEventPredictions(userId: string) {
    const { data, error } = await supabase
      .from('adverse_event_predictions')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(10);

    if (error) throw error;
    return data;
  }
}

export default new AIAPI();
