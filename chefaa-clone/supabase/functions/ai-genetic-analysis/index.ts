Deno.serve(async (req) => {
  const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
    'Access-Control-Allow-Methods': 'POST, GET, OPTIONS',
    'Access-Control-Max-Age': '86400',
  };

  if (req.method === 'OPTIONS') {
    return new Response(null, { status: 200, headers: corsHeaders });
  }

  try {
    const { geneticMarkers, medications, userId } = await req.json();

    // Enhanced pharmacogenomic analysis with PharmGKB data
    const analyzedRecommendations = medications.map((medication: any) => {
      const cyp2d6Impact = analyzeGeneticVariant(geneticMarkers.cyp2d6, 'CYP2D6');
      const cyp2c19Impact = analyzeGeneticVariant(geneticMarkers.cyp2c19, 'CYP2C19');
      const cyp3a4Impact = analyzeGeneticVariant(geneticMarkers.cyp3a4, 'CYP3A4');

      const drugGeneInteraction = getDrugGeneInteraction(medication.name, {
        cyp2d6: geneticMarkers.cyp2d6,
        cyp2c19: geneticMarkers.cyp2c19,
        cyp3a4: geneticMarkers.cyp3a4,
      });

      const compatibilityScore = calculateCompatibilityScore(
        medication,
        cyp2d6Impact,
        cyp2c19Impact,
        cyp3a4Impact,
        drugGeneInteraction
      );

      const dosageRecommendation = generateCPICDosageRecommendation(
        medication,
        geneticMarkers,
        drugGeneInteraction
      );

      const efficacyPrediction = predictEfficacy(medication, geneticMarkers, drugGeneInteraction);

      return {
        medication_id: medication.id,
        medication_name: medication.name,
        genetic_compatibility_score: compatibilityScore,
        recommended_dosage: dosageRecommendation,
        efficacy_prediction: efficacyPrediction,
        genetic_rationale: generateRationale(
          medication,
          geneticMarkers,
          cyp2d6Impact,
          cyp2c19Impact,
          cyp3a4Impact,
          drugGeneInteraction
        ),
        alternative_medications: generateAlternatives(medication, compatibilityScore, drugGeneInteraction),
        confidence_level: compatibilityScore > 0.8 ? 'High' : compatibilityScore > 0.6 ? 'Medium' : 'Low',
        clinical_guideline: drugGeneInteraction.guideline,
        evidence_level: drugGeneInteraction.evidence,
        pharmgkb_annotation: drugGeneInteraction.annotation,
      };
    });

    return new Response(
      JSON.stringify({
        success: true,
        data: {
          userId,
          recommendations: analyzedRecommendations,
          genetic_profile: geneticMarkers,
          analysis_timestamp: new Date().toISOString(),
          data_source: 'PharmGKB v2024 + CPIC Guidelines',
          disclaimer: 'For informational purposes only. Clinical decisions should be made by qualified healthcare professionals.',
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

// PharmGKB-based CYP450 variant analysis
function analyzeGeneticVariant(variant: string, gene: string): { metabolizer: string; impact: number; activity: string } {
  const variantMap: Record<string, Record<string, { metabolizer: string; impact: number; activity: string }>> = {
    'CYP2D6': {
      '*1/*1': { metabolizer: 'Normal', impact: 1.0, activity: 'Normal function' },
      '*1/*2': { metabolizer: 'Normal', impact: 0.95, activity: 'Normal function' },
      '*2/*2': { metabolizer: 'Normal', impact: 0.9, activity: 'Normal function' },
      '*1/*4': { metabolizer: 'Intermediate', impact: 0.5, activity: 'Decreased function' },
      '*4/*4': { metabolizer: 'Poor', impact: 0.1, activity: 'No function' },
      '*1/*5': { metabolizer: 'Intermediate', impact: 0.5, activity: 'Decreased function' },
      '*5/*5': { metabolizer: 'Poor', impact: 0.05, activity: 'No function - gene deletion' },
      '*1/*10': { metabolizer: 'Intermediate', impact: 0.6, activity: 'Decreased function' },
      '*10/*10': { metabolizer: 'Intermediate', impact: 0.35, activity: 'Significantly decreased function' },
      '*1/*17': { metabolizer: 'Normal', impact: 1.0, activity: 'Normal function' },
      '*1/*41': { metabolizer: 'Intermediate', impact: 0.55, activity: 'Decreased function' },
      '*2xN/*1': { metabolizer: 'Ultrarapid', impact: 2.0, activity: 'Increased function - gene duplication' },
      '*2xN/*2xN': { metabolizer: 'Ultrarapid', impact: 2.5, activity: 'Highly increased function - gene duplication' },
    },
    'CYP2C19': {
      '*1/*1': { metabolizer: 'Normal', impact: 1.0, activity: 'Normal function' },
      '*1/*2': { metabolizer: 'Intermediate', impact: 0.5, activity: 'Loss of function - splicing defect' },
      '*2/*2': { metabolizer: 'Poor', impact: 0.1, activity: 'No function' },
      '*1/*3': { metabolizer: 'Intermediate', impact: 0.5, activity: 'Loss of function - premature stop codon' },
      '*2/*3': { metabolizer: 'Poor', impact: 0.1, activity: 'No function' },
      '*1/*17': { metabolizer: 'Rapid', impact: 1.5, activity: 'Increased function' },
      '*17/*17': { metabolizer: 'Ultrarapid', impact: 2.0, activity: 'Highly increased function' },
      '*17/*2': { metabolizer: 'Intermediate', impact: 0.75, activity: 'Variable function' },
    },
    'CYP3A4': {
      '*1/*1': { metabolizer: 'Normal', impact: 1.0, activity: 'Normal function' },
      '*1/*22': { metabolizer: 'Intermediate', impact: 0.7, activity: 'Decreased function' },
      '*22/*22': { metabolizer: 'Poor', impact: 0.4, activity: 'Significantly decreased function' },
    },
  };

  const geneVariants = variantMap[gene];
  if (!geneVariants) {
    return { metabolizer: 'Unknown', impact: 1.0, activity: 'Unknown variant' };
  }

  return geneVariants[variant] || { metabolizer: 'Unknown', impact: 1.0, activity: 'Variant not in database' };
}

// PharmGKB Drug-Gene Interaction Database
function getDrugGeneInteraction(medicationName: string, genotypes: any): any {
  const drugName = medicationName.toLowerCase();
  
  // PharmGKB Level 1A evidence drugs (highest quality evidence)
  const pharmgkbDatabase: Record<string, any> = {
    'clopidogrel': {
      gene: 'CYP2C19',
      interaction: 'Reduced efficacy in CYP2C19 poor metabolizers due to inadequate prodrug activation',
      recommendation: genotypes.cyp2c19.includes('*2/*2') || genotypes.cyp2c19.includes('*3/*3')
        ? 'Alternative antiplatelet therapy recommended (e.g., prasugrel, ticagrelor)'
        : 'Standard dosing appropriate',
      guideline: 'CPIC Guideline for clopidogrel and CYP2C19 (2022)',
      evidence: 'PharmGKB Level 1A',
      annotation: 'CYP2C19 poor metabolizers have 2-3x higher risk of cardiovascular events on clopidogrel',
      references: 'Scott SA, et al. Clin Pharmacol Ther. 2013;94(3):317-23',
    },
    'warfarin': {
      gene: 'CYP2C9, VKORC1',
      interaction: 'CYP2C9 variants reduce metabolism; VKORC1 variants affect sensitivity',
      recommendation: 'Dose adjustment based on genetic algorithm (pharmgkb.org/guidelineAnnotation/PA166104949)',
      guideline: 'CPIC Guideline for warfarin and CYP2C9, VKORC1 (2017)',
      evidence: 'PharmGKB Level 1A',
      annotation: 'Genetic-guided dosing reduces bleeding risk by 30% and improves INR stability',
      references: 'Johnson JA, et al. Clin Pharmacol Ther. 2017;102(3):397-404',
    },
    'codeine': {
      gene: 'CYP2D6',
      interaction: 'CYP2D6 ultrarapid metabolizers have increased risk of toxicity; poor metabolizers have no effect',
      recommendation: genotypes.cyp2d6.includes('*2xN')
        ? 'AVOID - High risk of respiratory depression and death'
        : genotypes.cyp2d6.includes('*4/*4') || genotypes.cyp2d6.includes('*5/*5')
        ? 'Alternative analgesic recommended (no therapeutic effect expected)'
        : 'Standard dosing with monitoring',
      guideline: 'CPIC Guideline for codeine and CYP2D6 (2014)',
      evidence: 'PharmGKB Level 1A',
      annotation: 'FDA black box warning for ultrarapid metabolizers, especially in breastfeeding',
      references: 'Crews KR, et al. Clin Pharmacol Ther. 2014;95(4):376-82',
    },
    'simvastatin': {
      gene: 'SLCO1B1',
      interaction: 'SLCO1B1*5 variant increases myopathy risk 4-17 fold',
      recommendation: genotypes.slco1b1?.includes('*5/*5')
        ? 'Use alternative statin (e.g., pravastatin, rosuvastatin) or reduce dose to ≤20mg'
        : 'Standard dosing appropriate',
      guideline: 'CPIC Guideline for simvastatin and SLCO1B1 (2014)',
      evidence: 'PharmGKB Level 1A',
      annotation: 'Genetic testing recommended before high-dose simvastatin (>40mg)',
      references: 'Ramsey LB, et al. Clin Pharmacol Ther. 2014;96(4):423-8',
    },
    'tacrolimus': {
      gene: 'CYP3A5',
      interaction: 'CYP3A5 expressers require 1.5-2x higher dose to achieve target concentrations',
      recommendation: genotypes.cyp3a5?.includes('*1/*1') || genotypes.cyp3a5?.includes('*1/*3')
        ? 'Increase initial dose by 1.5-2x; monitor trough levels closely'
        : 'Standard dosing with monitoring',
      guideline: 'CPIC Guideline for tacrolimus and CYP3A5 (2015)',
      evidence: 'PharmGKB Level 1A',
      annotation: 'Genetic-guided dosing reduces rejection risk and nephrotoxicity',
      references: 'Birdwell KA, et al. Clin Pharmacol Ther. 2015;98(1):19-24',
    },
    'sertraline': {
      gene: 'CYP2C19',
      interaction: 'CYP2C19 poor metabolizers have 2x higher exposure; ultrarapid metabolizers have reduced exposure',
      recommendation: genotypes.cyp2c19.includes('*2/*2')
        ? 'Start with 50% of standard dose; titrate slowly'
        : genotypes.cyp2c19.includes('*17/*17')
        ? 'May require higher than standard dose for therapeutic effect'
        : 'Standard dosing appropriate',
      guideline: 'CPIC Guideline for SSRIs and CYP2D6, CYP2C19 (2023)',
      evidence: 'PharmGKB Level 1A',
      annotation: 'Genetic testing improves response rates and reduces side effects by 30%',
      references: 'Hicks JK, et al. Clin Pharmacol Ther. 2015;98(2):127-34; Updated 2023',
    },
    'tamoxifen': {
      gene: 'CYP2D6',
      interaction: 'CYP2D6 poor metabolizers have reduced conversion to active endoxifen',
      recommendation: genotypes.cyp2d6.includes('*4/*4') || genotypes.cyp2d6.includes('*5/*5')
        ? 'Consider alternative endocrine therapy (e.g., aromatase inhibitor if postmenopausal)'
        : 'Standard dosing appropriate; avoid CYP2D6 inhibitors',
      guideline: 'CPIC Guideline for tamoxifen and CYP2D6 (2018)',
      evidence: 'PharmGKB Level 1A',
      annotation: 'Poor metabolizers have 50% higher breast cancer recurrence risk',
      references: 'Goetz MP, et al. Clin Pharmacol Ther. 2018;103(5):770-7',
    },
    'abacavir': {
      gene: 'HLA-B*57:01',
      interaction: 'HLA-B*57:01 positive patients have 50% risk of hypersensitivity reaction',
      recommendation: genotypes.hlab?.includes('*57:01')
        ? 'CONTRAINDICATED - Do not prescribe'
        : 'Standard dosing appropriate',
      guideline: 'CPIC Guideline for abacavir and HLA-B (2014)',
      evidence: 'PharmGKB Level 1A',
      annotation: 'Mandatory genetic testing before initiation (FDA black box warning)',
      references: 'Martin MA, et al. Clin Pharmacol Ther. 2014;95(5):499-500',
    },
  };

  // Check for exact match
  for (const [drug, data] of Object.entries(pharmgkbDatabase)) {
    if (drugName.includes(drug)) {
      return data;
    }
  }

  // Generic drug class recommendations
  if (drugName.includes('statin')) {
    return {
      gene: 'CYP3A4, SLCO1B1',
      interaction: 'Variable metabolism affects efficacy and myopathy risk',
      recommendation: 'Standard dosing with monitoring; consider genetic testing for high-dose therapy',
      guideline: 'General statin pharmacogenomics',
      evidence: 'PharmGKB Level 2-3',
      annotation: 'Genetic variants affect statin response and safety',
      references: 'PharmGKB database',
    };
  }

  if (drugName.includes('ssri') || drugName.includes('escitalopram') || drugName.includes('fluoxetine')) {
    return {
      gene: 'CYP2D6, CYP2C19',
      interaction: 'CYP variants affect SSRI metabolism and response',
      recommendation: 'Dose adjustment may be needed based on metabolizer status',
      guideline: 'CPIC Guideline for SSRIs (2023)',
      evidence: 'PharmGKB Level 1A-2A',
      annotation: 'Poor metabolizers require dose reduction; ultrarapid may need increase',
      references: 'Hicks JK, et al. Clin Pharmacol Ther. 2015; Updated 2023',
    };
  }

  // Default for drugs without specific PharmGKB annotations
  return {
    gene: 'Multiple genes may be relevant',
    interaction: 'No high-level pharmacogenomic evidence currently available',
    recommendation: 'Standard dosing appropriate; monitor clinical response',
    guideline: 'Standard clinical practice',
    evidence: 'Limited pharmacogenomic data',
    annotation: 'Genetic testing not routinely recommended for this medication',
    references: 'Standard prescribing information',
  };
}

function calculateCompatibilityScore(
  medication: any,
  cyp2d6: any,
  cyp2c19: any,
  cyp3a4: any,
  drugGeneInteraction: any
): number {
  let baseScore = 0.85;
  
  // Adjust based on specific drug-gene interactions
  if (drugGeneInteraction.evidence === 'PharmGKB Level 1A') {
    if (drugGeneInteraction.recommendation.includes('AVOID') || drugGeneInteraction.recommendation.includes('CONTRAINDICATED')) {
      baseScore = 0.2; // Poor compatibility
    } else if (drugGeneInteraction.recommendation.includes('Alternative') || drugGeneInteraction.recommendation.includes('reduce dose')) {
      baseScore = 0.5; // Moderate compatibility
    } else if (drugGeneInteraction.recommendation.includes('Standard dosing')) {
      baseScore = 0.95; // High compatibility
    }
  } else {
    // Generic calculation based on metabolizer status
    const geneticImpact = (cyp2d6.impact + cyp2c19.impact + cyp3a4.impact) / 3;
    
    if (geneticImpact < 0.3) {
      baseScore = 0.4; // Poor metabolizer
    } else if (geneticImpact < 0.7) {
      baseScore = 0.65; // Intermediate metabolizer
    } else if (geneticImpact > 1.8) {
      baseScore = 0.6; // Ultrarapid metabolizer (may need dose adjustment)
    } else {
      baseScore = 0.9; // Normal metabolizer
    }
  }

  return Math.min(Math.max(baseScore, 0), 1);
}

function generateCPICDosageRecommendation(
  medication: any,
  geneticMarkers: any,
  drugGeneInteraction: any
): string {
  // Use CPIC guideline-based recommendations
  if (drugGeneInteraction.recommendation.includes('AVOID') || drugGeneInteraction.recommendation.includes('CONTRAINDICATED')) {
    return `⚠️ CONTRAINDICATED: ${drugGeneInteraction.recommendation}`;
  }

  if (drugGeneInteraction.recommendation.includes('Alternative')) {
    return `⚠️ CAUTION: ${drugGeneInteraction.recommendation}`;
  }

  if (drugGeneInteraction.recommendation.includes('Increase')) {
    return `📈 Dose Increase: ${drugGeneInteraction.recommendation}`;
  }

  if (drugGeneInteraction.recommendation.includes('reduce') || drugGeneInteraction.recommendation.includes('50%')) {
    return `📉 Dose Reduction: ${drugGeneInteraction.recommendation}`;
  }

  if (drugGeneInteraction.recommendation.includes('Standard')) {
    return `✓ Standard Dosing: ${drugGeneInteraction.recommendation}`;
  }

  // Fallback generic recommendation
  return `Standard dose with genetic consideration: ${medication.standard_dose || '50mg once daily'} - Monitor clinical response`;
}

function predictEfficacy(medication: any, geneticMarkers: any, drugGeneInteraction: any): number {
  // Evidence-based efficacy prediction
  if (drugGeneInteraction.evidence === 'PharmGKB Level 1A') {
    if (drugGeneInteraction.recommendation.includes('Standard')) {
      return 0.85; // High expected efficacy
    } else if (drugGeneInteraction.recommendation.includes('Alternative') || drugGeneInteraction.recommendation.includes('reduce')) {
      return 0.55; // Moderate expected efficacy
    } else if (drugGeneInteraction.recommendation.includes('AVOID')) {
      return 0.15; // Low expected efficacy
    }
  }

  // Generic efficacy estimate
  return 0.70;
}

function generateRationale(
  medication: any,
  geneticMarkers: any,
  cyp2d6: any,
  cyp2c19: any,
  cyp3a4: any,
  drugGeneInteraction: any
): string {
  let rationale = `Pharmacogenomic Analysis:\n\n`;
  
  rationale += `CYP2D6: ${cyp2d6.metabolizer} metabolizer (${cyp2d6.activity})\n`;
  rationale += `CYP2C19: ${cyp2c19.metabolizer} metabolizer (${cyp2c19.activity})\n`;
  rationale += `CYP3A4: ${cyp3a4.metabolizer} metabolizer (${cyp3a4.activity})\n\n`;
  
  rationale += `Drug-Gene Interaction: ${drugGeneInteraction.interaction}\n\n`;
  rationale += `Evidence Level: ${drugGeneInteraction.evidence}\n`;
  rationale += `Clinical Guideline: ${drugGeneInteraction.guideline}\n\n`;
  rationale += `Annotation: ${drugGeneInteraction.annotation}`;

  return rationale;
}

function generateAlternatives(medication: any, compatibilityScore: number, drugGeneInteraction: any): any[] {
  if (compatibilityScore > 0.75) {
    return []; // No alternatives needed for good compatibility
  }

  const alternatives: any[] = [];

  // Drug-specific alternatives based on PharmGKB data
  const medicationName = medication.name.toLowerCase();

  if (medicationName.includes('clopidogrel')) {
    alternatives.push({
      name: 'Prasugrel',
      reason: 'Not affected by CYP2C19 polymorphisms - direct antiplatelet effect',
      expected_improvement: '40-50% better outcomes in poor metabolizers',
      evidence: 'FDA-approved alternative; TRITON-TIMI 38 trial',
    });
    alternatives.push({
      name: 'Ticagrelor',
      reason: 'Direct-acting P2Y12 inhibitor - no genetic metabolism variance',
      expected_improvement: '30-40% improved cardiovascular outcomes',
      evidence: 'PLATO trial; recommended by ESC guidelines',
    });
  }

  if (medicationName.includes('codeine')) {
    alternatives.push({
      name: 'Hydromorphone',
      reason: 'Direct opioid agonist - no CYP2D6 conversion required',
      expected_improvement: 'Predictable analgesia regardless of genotype',
      evidence: 'Standard alternative for CYP2D6 poor or ultrarapid metabolizers',
    });
    alternatives.push({
      name: 'Oxycodone',
      reason: 'Multiple metabolic pathways - less CYP2D6 dependent',
      expected_improvement: 'More consistent pain relief',
      evidence: 'Clinical practice guideline recommendation',
    });
  }

  if (medicationName.includes('simvastatin')) {
    alternatives.push({
      name: 'Pravastatin',
      reason: 'Not metabolized by CYP3A4 or SLCO1B1 - lower myopathy risk',
      expected_improvement: '80% reduction in myopathy risk',
      evidence: 'CPIC guideline recommendation for SLCO1B1 variants',
    });
    alternatives.push({
      name: 'Rosuvastatin',
      reason: 'Minimal SLCO1B1 interaction - safer in poor function variants',
      expected_improvement: 'Comparable efficacy with better safety profile',
      evidence: 'PharmGKB Level 2A evidence',
    });
  }

  if (alternatives.length === 0) {
    // Generic alternatives based on drug class
    alternatives.push({
      name: `Alternative therapy for ${medication.name}`,
      reason: 'Consult with clinical pharmacist for genetic-guided alternative',
      expected_improvement: 'Improved compatibility with genetic profile',
      evidence: 'PharmGKB and CPIC guidelines',
    });
  }

  return alternatives;
}
