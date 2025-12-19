// AI-Powered Drug Discovery & Repurposing Edge Function
// Analyzes drug repurposing opportunities and provides discovery insights

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

// Drug repurposing database with evidence
const DRUG_REPURPOSING_DATABASE = {
  metformin: {
    originalIndication: 'Type 2 Diabetes',
    repurposingOpportunities: [
      {
        condition: 'Cancer Prevention',
        mechanism: 'AMPK activation, mTOR inhibition',
        evidence: 'Multiple observational studies, ongoing RCTs',
        trialStatus: 'Phase III',
        efficacySignal: 'Strong',
        citations: ['JAMA Oncology 2017', 'Diabetes Care 2018'],
      },
      {
        condition: 'Polycystic Ovary Syndrome',
        mechanism: 'Insulin sensitization, androgen reduction',
        evidence: 'Multiple RCTs showing efficacy',
        trialStatus: 'Off-label use approved',
        efficacySignal: 'Strong',
        citations: ['NEJM 2007', 'Cochrane Review 2014'],
      },
      {
        condition: 'Aging/Longevity',
        mechanism: 'Mitochondrial function, oxidative stress reduction',
        evidence: 'Animal studies, observational human data',
        trialStatus: 'Phase II (TAME trial)',
        efficacySignal: 'Moderate',
        citations: ['Cell Metabolism 2019', 'Nature 2020'],
      },
    ],
  },
  aspirin: {
    originalIndication: 'Pain/Inflammation',
    repurposingOpportunities: [
      {
        condition: 'Colorectal Cancer Prevention',
        mechanism: 'COX-2 inhibition, platelet aggregation',
        evidence: 'Large RCTs showing 30-40% risk reduction',
        trialStatus: 'Recommended for high-risk patients',
        efficacySignal: 'Strong',
        citations: ['Lancet 2012', 'USPSTF 2016'],
      },
      {
        condition: 'Cardiovascular Disease Prevention',
        mechanism: 'Antiplatelet effects',
        evidence: 'Meta-analyses of multiple RCTs',
        trialStatus: 'Standard of care',
        efficacySignal: 'Strong',
        citations: ['Circulation 2019', 'ACC/AHA Guidelines'],
      },
    ],
  },
  sildenafil: {
    originalIndication: 'Erectile Dysfunction',
    repurposingOpportunities: [
      {
        condition: 'Pulmonary Arterial Hypertension',
        mechanism: 'PDE5 inhibition, vasodilation',
        evidence: 'RCTs showing improved exercise capacity',
        trialStatus: 'FDA approved (Revatio)',
        efficacySignal: 'Strong',
        citations: ['NEJM 2005', 'Chest 2007'],
      },
      {
        condition: 'Altitude Sickness',
        mechanism: 'Pulmonary vasodilation',
        evidence: 'Small RCTs, clinical experience',
        trialStatus: 'Off-label use',
        efficacySignal: 'Moderate',
        citations: ['High Alt Med Biol 2011'],
      },
    ],
  },
  statins: {
    originalIndication: 'Hyperlipidemia',
    repurposingOpportunities: [
      {
        condition: 'Alzheimer\'s Disease Prevention',
        mechanism: 'Anti-inflammatory, pleiotropic effects',
        evidence: 'Mixed results in observational studies',
        trialStatus: 'Phase III trials',
        efficacySignal: 'Weak-Moderate',
        citations: ['Neurology 2018', 'JAMA Neurology 2020'],
      },
      {
        condition: 'Cancer Prevention',
        mechanism: 'Anti-inflammatory, immune modulation',
        evidence: 'Observational studies, mechanistic data',
        trialStatus: 'Phase II/III trials ongoing',
        efficacySignal: 'Moderate',
        citations: ['Cancer Epidemiol 2019'],
      },
    ],
  },
};

// Drug combination synergy predictions
const DRUG_COMBINATIONS = {
  'metformin_statins': {
    synergy: 'Additive cardiovascular benefit',
    evidence: 'Observational studies show improved outcomes',
    mechanism: 'Complementary metabolic effects',
    safetyProfile: 'Generally safe, monitor liver function',
  },
  'aspirin_statins': {
    synergy: 'Cardiovascular disease prevention',
    evidence: 'Standard combination for secondary prevention',
    mechanism: 'Antiplatelet + lipid-lowering',
    safetyProfile: 'Standard combination, well-tolerated',
  },
};

function analyzeDrugRepurposing(drugName: string) {
  const normalizedDrug = drugName.toLowerCase().trim();
  const drugData = DRUG_REPURPOSING_DATABASE[normalizedDrug];

  if (!drugData) {
    return {
      success: false,
      error: `No repurposing data available for: ${drugName}`,
    };
  }

  // Rank opportunities by efficacy signal and trial status
  const rankedOpportunities = drugData.repurposingOpportunities
    .map(opp => ({
      ...opp,
      score: calculateRepurposingScore(opp),
    }))
    .sort((a, b) => b.score - a.score);

  return {
    success: true,
    data: {
      drug: drugName,
      originalIndication: drugData.originalIndication,
      repurposingOpportunities: rankedOpportunities,
      topOpportunity: rankedOpportunities[0],
      totalOpportunities: rankedOpportunities.length,
    },
  };
}

function calculateRepurposingScore(opportunity: any): number {
  let score = 0;

  // Efficacy signal weight
  const efficacyScores = { Strong: 40, Moderate: 25, 'Weak-Moderate': 15, Weak: 5 };
  score += efficacyScores[opportunity.efficacySignal] || 0;

  // Trial status weight
  if (opportunity.trialStatus.includes('FDA approved')) score += 40;
  else if (opportunity.trialStatus.includes('approved') || opportunity.trialStatus.includes('Standard')) score += 35;
  else if (opportunity.trialStatus.includes('Phase III')) score += 25;
  else if (opportunity.trialStatus.includes('Phase II')) score += 15;
  else if (opportunity.trialStatus.includes('Phase I')) score += 5;

  // Evidence weight
  const evidenceTerms = ['RCT', 'Meta-analysis', 'Multiple'];
  if (evidenceTerms.some(term => opportunity.evidence.includes(term))) score += 20;

  return score;
}

function predictDrugCombinationSynergy(drug1: string, drug2: string) {
  const key1 = `${drug1.toLowerCase()}_${drug2.toLowerCase()}`;
  const key2 = `${drug2.toLowerCase()}_${drug1.toLowerCase()}`;

  const combination = DRUG_COMBINATIONS[key1] || DRUG_COMBINATIONS[key2];

  if (!combination) {
    return {
      success: false,
      error: 'No synergy data available for this combination',
    };
  }

  return {
    success: true,
    data: {
      drugs: [drug1, drug2],
      ...combination,
      recommendation: combination.synergy.includes('benefit') ? 'Consider combination' : 'Use with caution',
    },
  };
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { status: 200, headers: corsHeaders });
  }

  try {
    const { action, data } = await req.json();

    switch (action) {
      case 'analyze_repurposing': {
        const { drugName } = data;
        const result = analyzeDrugRepurposing(drugName);
        return new Response(JSON.stringify(result), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      case 'predict_combination_synergy': {
        const { drug1, drug2 } = data;
        const result = predictDrugCombinationSynergy(drug1, drug2);
        return new Response(JSON.stringify(result), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      case 'get_repurposing_database': {
        return new Response(
          JSON.stringify({ success: true, data: DRUG_REPURPOSING_DATABASE }),
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
