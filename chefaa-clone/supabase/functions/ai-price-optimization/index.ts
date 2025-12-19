// AI-Powered Price Optimization Edge Function
// Analyzes medication pricing across pharmacies and provides cost-saving recommendations

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

// Medication pricing database with pharmacy comparisons
const MEDICATION_PRICES = {
  'atorvastatin_20mg': {
    brand: { name: 'Lipitor', avgPrice: 145.00 },
    generic: { name: 'Atorvastatin', avgPrice: 12.00 },
    pharmacies: [
      { name: 'CVS', price: 15.00, discount_programs: ['CVS Savings Pass'] },
      { name: 'Walgreens', price: 14.50, discount_programs: ['MyWalgreens'] },
      { name: 'Walmart', price: 10.00, discount_programs: ['Walmart Rx Savings'] },
      { name: 'Costco', price: 8.50, discount_programs: ['Costco Member Rx'] },
    ],
    alternatives: [
      { drug: 'Simvastatin 40mg', efficacy_ratio: 0.95, price: 6.00, evidence: 'Equivalent LDL reduction' },
      { drug: 'Rosuvastatin 10mg', efficacy_ratio: 1.1, price: 18.00, evidence: 'Superior LDL reduction' },
    ],
  },
  'lisinopril_10mg': {
    brand: { name: 'Prinivil', avgPrice: 85.00 },
    generic: { name: 'Lisinopril', avgPrice: 4.00 },
    pharmacies: [
      { name: 'CVS', price: 5.00 },
      { name: 'Walgreens', price: 4.50 },
      { name: 'Walmart', price: 4.00 },
      { name: 'Costco', price: 3.50 },
    ],
    alternatives: [
      { drug: 'Enalapril 10mg', efficacy_ratio: 0.98, price: 3.50, evidence: 'Equivalent ACE inhibition' },
      { drug: 'Losartan 50mg', efficacy_ratio: 0.95, price: 8.00, evidence: 'ARB alternative, fewer cough side effects' },
    ],
  },
  'metformin_1000mg': {
    brand: { name: 'Glucophage', avgPrice: 120.00 },
    generic: { name: 'Metformin', avgPrice: 4.00 },
    pharmacies: [
      { name: 'CVS', price: 5.00 },
      { name: 'Walgreens', price: 4.80 },
      { name: 'Walmart', price: 4.00 },
      { name: 'Costco', price: 3.20 },
    ],
    alternatives: [],
    note: 'First-line diabetes treatment, no therapeutic alternatives with better cost-benefit',
  },
  'omeprazole_20mg': {
    brand: { name: 'Prilosec', avgPrice: 95.00 },
    generic: { name: 'Omeprazole', avgPrice: 9.00 },
    pharmacies: [
      { name: 'CVS', price: 12.00 },
      { name: 'Walgreens', price: 11.00 },
      { name: 'Walmart', price: 9.00 },
      { name: 'Costco', price: 7.50 },
    ],
    alternatives: [
      { drug: 'Pantoprazole 40mg', efficacy_ratio: 1.0, price: 10.00, evidence: 'Equivalent PPI' },
      { drug: 'Lansoprazole 30mg', efficacy_ratio: 0.98, price: 15.00, evidence: 'Equivalent PPI' },
    ],
  },
  'amlodipine_5mg': {
    brand: { name: 'Norvasc', avgPrice: 110.00 },
    generic: { name: 'Amlodipine', avgPrice: 4.00 },
    pharmacies: [
      { name: 'CVS', price: 5.00 },
      { name: 'Walgreens', price: 4.50 },
      { name: 'Walmart', price: 4.00 },
      { name: 'Costco', price: 3.00 },
    ],
    alternatives: [
      { drug: 'Nifedipine ER 30mg', efficacy_ratio: 0.95, price: 6.00, evidence: 'Equivalent CCB' },
    ],
  },
};

// Discount programs and assistance
const ASSISTANCE_PROGRAMS = {
  manufacturer_copay: {
    description: 'Manufacturer copay assistance programs',
    eligibility: 'Commercial insurance required (not Medicare/Medicaid)',
    savings: 'Up to $150/month',
  },
  patient_assistance: {
    description: 'Manufacturer patient assistance programs',
    eligibility: 'Income <400% FPL, uninsured/underinsured',
    savings: 'Free medication or significant discount',
  },
  '340b_program': {
    description: '340B Drug Pricing Program',
    eligibility: 'Qualifying healthcare facilities',
    savings: '25-50% discount',
  },
  goodrx: {
    description: 'GoodRx discount coupons',
    eligibility: 'Anyone',
    savings: 'Variable, 10-80% off retail',
  },
};

function analyzePricing(medication: string, quantity: number = 30, insurance: any = null) {
  const medKey = medication.toLowerCase().replace(/\s+/g, '_');
  const medData = MEDICATION_PRICES[medKey];

  if (!medData) {
    return {
      success: false,
      error: `Pricing data not available for: ${medication}`,
    };
  }

  // Calculate costs
  const brandCost = medData.brand.avgPrice * (quantity / 30);
  const genericCost = medData.generic.avgPrice * (quantity / 30);
  const brandSavings = brandCost - genericCost;

  // Find best pharmacy price
  const pharmacyPrices = medData.pharmacies.map(p => ({
    ...p,
    totalCost: p.price * (quantity / 30),
  })).sort((a, b) => a.totalCost - b.totalCost);

  const bestPharmacy = pharmacyPrices[0];
  const worstPharmacy = pharmacyPrices[pharmacyPrices.length - 1];
  const pharmacySavings = worstPharmacy.totalCost - bestPharmacy.totalCost;

  // Analyze alternatives
  const alternatives = medData.alternatives.map(alt => ({
    ...alt,
    monthlyCost: alt.price * (quantity / 30),
    costSavings: genericCost - (alt.price * (quantity / 30)),
    efficacyAdjustedValue: (alt.efficacy_ratio / alt.price) * 100,
  })).sort((a, b) => b.efficacyAdjustedValue - a.efficacyAdjustedValue);

  // Generate recommendations
  const recommendations = [];

  // Generic recommendation
  if (brandSavings > 50) {
    recommendations.push({
      type: 'generic_substitution',
      recommendation: `Switch from ${medData.brand.name} to ${medData.generic.name}`,
      savings: `$${brandSavings.toFixed(2)}/month`,
      evidence: 'FDA-approved bioequivalent generic',
      priority: 'High',
    });
  }

  // Pharmacy recommendation
  if (pharmacySavings > 5) {
    recommendations.push({
      type: 'pharmacy_switch',
      recommendation: `Purchase from ${bestPharmacy.name} instead of ${worstPharmacy.name}`,
      savings: `$${pharmacySavings.toFixed(2)}/month`,
      note: bestPharmacy.discount_programs ? `Consider ${bestPharmacy.discount_programs.join(', ')}` : '',
      priority: 'Medium',
    });
  }

  // Alternative medication recommendation
  if (alternatives.length > 0 && alternatives[0].costSavings > 10) {
    recommendations.push({
      type: 'therapeutic_alternative',
      recommendation: `Consider ${alternatives[0].drug} as therapeutic alternative`,
      savings: `$${alternatives[0].costSavings.toFixed(2)}/month`,
      evidence: alternatives[0].evidence,
      efficacy_note: `${(alternatives[0].efficacy_ratio * 100).toFixed(0)}% relative efficacy`,
      priority: 'Medium',
    });
  }

  // Assistance program recommendations
  if (!insurance || insurance.type === 'none') {
    recommendations.push({
      type: 'assistance_program',
      recommendation: 'Apply for patient assistance programs',
      potential_savings: 'Up to 100% of medication cost',
      programs: ['Manufacturer patient assistance', 'GoodRx coupons', '340B program (if eligible)'],
      priority: 'High',
    });
  }

  return {
    success: true,
    data: {
      medication: medData.generic.name,
      analysis: {
        brandVsGeneric: {
          brand: { name: medData.brand.name, cost: `$${brandCost.toFixed(2)}` },
          generic: { name: medData.generic.name, cost: `$${genericCost.toFixed(2)}` },
          savings: `$${brandSavings.toFixed(2)}`,
          savingsPercent: `${((brandSavings / brandCost) * 100).toFixed(0)}%`,
        },
        pharmacyComparison: pharmacyPrices.map(p => ({
          pharmacy: p.name,
          price: `$${p.totalCost.toFixed(2)}`,
          discountPrograms: p.discount_programs || [],
        })),
        bestPharmacy: {
          name: bestPharmacy.name,
          price: `$${bestPharmacy.totalCost.toFixed(2)}`,
          savingsVsWorst: `$${pharmacySavings.toFixed(2)}`,
        },
        therapeuticAlternatives: alternatives.map(alt => ({
          drug: alt.drug,
          monthlyCost: `$${alt.monthlyCost.toFixed(2)}`,
          savings: `$${alt.costSavings.toFixed(2)}`,
          efficacyRatio: `${(alt.efficacy_ratio * 100).toFixed(0)}%`,
          evidence: alt.evidence,
        })),
      },
      recommendations,
      totalPotentialSavings: recommendations.reduce((sum, rec) => {
        const savingsMatch = rec.savings?.match(/\$?([\d.]+)/);
        return sum + (savingsMatch ? parseFloat(savingsMatch[1]) : 0);
      }, 0),
      assistancePrograms: ASSISTANCE_PROGRAMS,
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
      case 'analyze_pricing': {
        const { medication, quantity, insurance } = data;
        const result = analyzePricing(medication, quantity, insurance);
        return new Response(JSON.stringify(result), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      case 'compare_regimen_costs': {
        const { medications } = data;
        const results = medications.map((med: any) => analyzePricing(med.name, med.quantity || 30, data.insurance));
        
        const totalSavings = results.reduce((sum, r) => sum + (r.success ? r.data.totalPotentialSavings : 0), 0);
        
        return new Response(
          JSON.stringify({
            success: true,
            data: {
              individualAnalyses: results,
              totalMonthlySavings: `$${totalSavings.toFixed(2)}`,
              annualSavings: `$${(totalSavings * 12).toFixed(2)}`,
            },
          }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      case 'get_assistance_programs': {
        return new Response(
          JSON.stringify({ success: true, data: ASSISTANCE_PROGRAMS }),
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
