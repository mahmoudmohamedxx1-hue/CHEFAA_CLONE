// AI-Powered Clinical Safety Co-Pilot
// Real-time drug interaction analysis with personalized risk assessment

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
        const startTime = Date.now();

        // Get request data
        const { medications, userId, orderId } = await req.json();

        if (!medications || !Array.isArray(medications) || medications.length === 0) {
            throw new Error('Medications list is required and must be a non-empty array');
        }

        // Get Supabase credentials
        const supabaseUrl = Deno.env.get('SUPABASE_URL');
        const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');

        if (!supabaseUrl || !serviceRoleKey) {
            throw new Error('Supabase configuration missing');
        }

        // Extract medication names
        const medicationNames = medications.map(med => 
            typeof med === 'string' ? med : med.name || med.medication_name
        );

        // Fetch drug interactions from database
        const interactionsResponse = await fetch(
            `${supabaseUrl}/rest/v1/rpc/get_drug_interactions`,
            {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${serviceRoleKey}`,
                    'apikey': serviceRoleKey,
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ medication_names: medicationNames })
            }
        );

        if (!interactionsResponse.ok) {
            throw new Error('Failed to fetch drug interactions');
        }

        const interactions = await interactionsResponse.json();

        // Analyze interactions and calculate risk
        const analysisResults = {
            interactions: interactions,
            totalInteractions: interactions.length,
            majorInteractions: interactions.filter((i: any) => i.interaction_type === 'major').length,
            moderateInteractions: interactions.filter((i: any) => i.interaction_type === 'moderate').length,
            minorInteractions: interactions.filter((i: any) => i.interaction_type === 'minor').length,
        };

        // Calculate overall risk score (0-100)
        let riskScore = 0;
        let riskLevel = 'safe';

        if (interactions.length === 0) {
            riskScore = 0;
            riskLevel = 'safe';
        } else {
            // Weighted scoring: major = 15 points, moderate = 5 points, minor = 2 points
            const majorScore = analysisResults.majorInteractions * 15;
            const moderateScore = analysisResults.moderateInteractions * 5;
            const minorScore = analysisResults.minorInteractions * 2;
            
            riskScore = Math.min(100, majorScore + moderateScore + minorScore);

            if (riskScore >= 75) {
                riskLevel = 'danger';
            } else if (riskScore >= 50) {
                riskLevel = 'warning';
            } else if (riskScore >= 25) {
                riskLevel = 'caution';
            } else {
                riskLevel = 'safe';
            }
        }

        // Generate recommendations
        const recommendations = [];
        const alternativeSuggestions = [];

        if (analysisResults.majorInteractions > 0) {
            recommendations.push('Consult with a pharmacist or physician before taking these medications together');
            recommendations.push('Do not start these medications without medical supervision');
        }

        if (analysisResults.moderateInteractions > 0) {
            recommendations.push('Monitor for side effects and unusual symptoms');
            recommendations.push('Take medications at different times if possible');
        }

        // Add specific recommendations from interactions
        for (const interaction of interactions.slice(0, 5)) {
            if (interaction.management_strategy) {
                recommendations.push(`${interaction.drug_a} + ${interaction.drug_b}: ${interaction.management_strategy}`);
            }
        }

        // Prepare safety analysis data
        const safetyAnalysisData = {
            medication_list: medications.map((med: any) => ({
                name: typeof med === 'string' ? med : (med.name || med.medication_name),
                dosage: typeof med === 'object' ? med.dosage : null,
            })),
            analysis_results: analysisResults,
            overall_risk_score: riskScore,
            risk_level: riskLevel,
            recommendations: recommendations.slice(0, 10), // Limit to 10 recommendations
            alternative_suggestions: alternativeSuggestions,
            analysis_duration_ms: Date.now() - startTime,
        };

        // Save analysis to database if userId is provided
        if (userId) {
            const insertData: any = {
                user_id: userId,
                ...safetyAnalysisData
            };

            if (orderId) {
                insertData.order_id = orderId;
            }

            const saveResponse = await fetch(
                `${supabaseUrl}/rest/v1/safety_analysis`,
                {
                    method: 'POST',
                    headers: {
                        'Authorization': `Bearer ${serviceRoleKey}`,
                        'apikey': serviceRoleKey,
                        'Content-Type': 'application/json',
                        'Prefer': 'return=representation'
                    },
                    body: JSON.stringify(insertData)
                }
            );

            if (!saveResponse.ok) {
                console.error('Failed to save safety analysis:', await saveResponse.text());
            }
        }

        // Create safety alerts for critical interactions
        if (userId && analysisResults.majorInteractions > 0) {
            const criticalInteractions = interactions.filter((i: any) => i.severity_score >= 8);
            
            for (const interaction of criticalInteractions.slice(0, 3)) {
                const alertData = {
                    user_id: userId,
                    alert_type: 'interaction',
                    severity: 'critical',
                    medication_names: [interaction.drug_a, interaction.drug_b],
                    alert_message: `Critical interaction detected: ${interaction.clinical_effects}`,
                    recommendation: interaction.management_strategy,
                    acknowledged: false,
                };

                await fetch(
                    `${supabaseUrl}/rest/v1/medication_safety_alerts`,
                    {
                        method: 'POST',
                        headers: {
                            'Authorization': `Bearer ${serviceRoleKey}`,
                            'apikey': serviceRoleKey,
                            'Content-Type': 'application/json',
                        },
                        body: JSON.stringify(alertData)
                    }
                );
            }
        }

        return new Response(
            JSON.stringify({
                data: safetyAnalysisData,
                success: true
            }),
            {
                headers: { ...corsHeaders, 'Content-Type': 'application/json' }
            }
        );

    } catch (error) {
        console.error('Safety analysis error:', error);

        return new Response(
            JSON.stringify({
                error: {
                    code: 'SAFETY_ANALYSIS_FAILED',
                    message: error.message
                }
            }),
            {
                status: 500,
                headers: { ...corsHeaders, 'Content-Type': 'application/json' }
            }
        );
    }
});
