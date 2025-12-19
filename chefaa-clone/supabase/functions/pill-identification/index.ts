// Computer Vision Pill Identification & Verification
// Camera-based medication identification and prescription matching

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
        const { imageData, characteristics, userId, prescriptionMedications } = await req.json();

        if (!imageData && !characteristics) {
            throw new Error('Either imageData or pill characteristics required');
        }

        // Get Supabase credentials
        const supabaseUrl = Deno.env.get('SUPABASE_URL');
        const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');

        if (!supabaseUrl || !serviceRoleKey) {
            throw new Error('Supabase configuration missing');
        }

        let imageUrl = null;
        let imageHash = null;

        // If image data provided, upload to storage
        if (imageData) {
            try {
                // Extract base64 data from data URL
                const base64Data = imageData.split(',')[1];
                const mimeType = imageData.split(';')[0].split(':')[1];

                // Convert base64 to binary
                const binaryData = Uint8Array.from(atob(base64Data), c => c.charCodeAt(0));

                // Generate storage path with timestamp
                const timestamp = Date.now();
                const storagePath = `${timestamp}-pill-verification.jpg`;

                // Upload to Supabase Storage (assuming 'pill-verifications' bucket exists)
                const uploadResponse = await fetch(
                    `${supabaseUrl}/storage/v1/object/pill-verifications/${storagePath}`,
                    {
                        method: 'POST',
                        headers: {
                            'Authorization': `Bearer ${serviceRoleKey}`,
                            'Content-Type': mimeType,
                            'x-upsert': 'true'
                        },
                        body: binaryData
                    }
                );

                if (uploadResponse.ok) {
                    imageUrl = `${supabaseUrl}/storage/v1/object/public/pill-verifications/${storagePath}`;
                    
                    // Generate simple hash for image (using length and timestamp as pseudo-hash)
                    imageHash = `hash_${binaryData.length}_${timestamp}`;
                }
            } catch (uploadError) {
                console.error('Image upload failed:', uploadError);
                // Continue with analysis even if upload fails
            }
        }

        // Extract characteristics from image analysis or use provided characteristics
        // In a real implementation, this would use computer vision AI
        // For now, we'll use characteristics-based matching
        const pillCharacteristics = characteristics || {
            imprint: null,
            color: null,
            shape: null
        };

        // Search pill database using characteristics
        const searchResponse = await fetch(
            `${supabaseUrl}/rest/v1/rpc/search_pills`,
            {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${serviceRoleKey}`,
                    'apikey': serviceRoleKey,
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    p_imprint: pillCharacteristics.imprint,
                    p_color: pillCharacteristics.color,
                    p_shape: pillCharacteristics.shape
                })
            }
        );

        if (!searchResponse.ok) {
            throw new Error('Failed to search pill database');
        }

        const matches = await searchResponse.json();

        // Determine verification status and confidence
        let verificationStatus = 'not_found';
        let confidenceScore = 0;
        let identifiedPillId = null;
        let prescriptionMatch = false;

        if (matches && matches.length > 0) {
            const topMatch = matches[0];
            confidenceScore = parseFloat(topMatch.confidence_score);
            
            if (confidenceScore >= 85) {
                verificationStatus = 'identified';
                identifiedPillId = topMatch.id;
            } else if (confidenceScore >= 60) {
                verificationStatus = 'uncertain';
                identifiedPillId = topMatch.id;
            } else {
                verificationStatus = 'manual_review';
            }

            // Check if identified medication matches prescription
            if (prescriptionMedications && prescriptionMedications.length > 0) {
                const medicationName = topMatch.medication_name.toLowerCase();
                prescriptionMatch = prescriptionMedications.some((pm: string) => 
                    medicationName.includes(pm.toLowerCase()) || pm.toLowerCase().includes(medicationName)
                );
            }
        }

        const verificationDuration = Date.now() - startTime;

        // Save verification session to database
        let sessionId = null;
        if (userId && imageUrl) {
            const sessionData = {
                user_id: userId,
                image_url: imageUrl,
                image_hash: imageHash,
                identified_pill_id: identifiedPillId,
                confidence_score: confidenceScore,
                matches: matches.slice(0, 5).map((m: any) => ({
                    id: m.id,
                    medication_name: m.medication_name,
                    imprint: m.imprint,
                    color: m.color,
                    shape: m.shape,
                    confidence_score: m.confidence_score
                })),
                verification_status: verificationStatus,
                prescription_match: prescriptionMatch,
                verification_duration_ms: verificationDuration
            };

            const saveResponse = await fetch(
                `${supabaseUrl}/rest/v1/verification_sessions`,
                {
                    method: 'POST',
                    headers: {
                        'Authorization': `Bearer ${serviceRoleKey}`,
                        'apikey': serviceRoleKey,
                        'Content-Type': 'application/json',
                        'Prefer': 'return=representation'
                    },
                    body: JSON.stringify(sessionData)
                }
            );

            if (saveResponse.ok) {
                const savedSession = await saveResponse.json();
                if (savedSession && savedSession.length > 0) {
                    sessionId = savedSession[0].id;
                }
            }
        }

        // Prepare response
        const resultData = {
            sessionId: sessionId,
            verificationStatus: verificationStatus,
            confidenceScore: confidenceScore,
            identifiedMedication: matches && matches.length > 0 ? {
                id: matches[0].id,
                name: matches[0].medication_name,
                imprint: matches[0].imprint,
                color: matches[0].color,
                shape: matches[0].shape,
                imageUrl: matches[0].image_url,
                manufacturer: matches[0].manufacturer,
                dosage: matches[0].dosage,
                description: matches[0].description,
                isPrescription: matches[0].is_prescription
            } : null,
            alternativeMatches: matches.slice(1, 5).map((m: any) => ({
                id: m.id,
                name: m.medication_name,
                confidence: m.confidence_score
            })),
            prescriptionMatch: prescriptionMatch,
            verificationDurationMs: verificationDuration,
            recommendations: generateRecommendations(verificationStatus, confidenceScore, prescriptionMatch)
        };

        return new Response(
            JSON.stringify({
                data: resultData,
                success: true
            }),
            {
                headers: { ...corsHeaders, 'Content-Type': 'application/json' }
            }
        );

    } catch (error) {
        console.error('Pill identification error:', error);

        return new Response(
            JSON.stringify({
                error: {
                    code: 'PILL_IDENTIFICATION_FAILED',
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

function generateRecommendations(status: string, confidence: number, prescriptionMatch: boolean): string[] {
    const recommendations = [];

    if (status === 'identified' && confidence >= 90) {
        recommendations.push('Pill identified with high confidence');
        if (prescriptionMatch) {
            recommendations.push('Matches your prescription - safe to proceed');
        } else {
            recommendations.push('Does not match prescription - verify with pharmacist');
        }
    } else if (status === 'identified' && confidence >= 85) {
        recommendations.push('Pill identified with good confidence');
        recommendations.push('Verify pill details match prescription label');
    } else if (status === 'uncertain') {
        recommendations.push('Multiple possible matches found');
        recommendations.push('Verify with pharmacist or check pill bottle label');
    } else if (status === 'manual_review') {
        recommendations.push('Unable to confidently identify pill');
        recommendations.push('Consult pharmacist for manual verification');
    } else {
        recommendations.push('Pill not found in database');
        recommendations.push('Contact your pharmacist for assistance');
    }

    recommendations.push('Never take medication if you are uncertain about its identity');

    return recommendations;
}
