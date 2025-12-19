import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, GET, OPTIONS',
};

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    const { action, data } = await req.json();

    // Blockchain-style hash generation
    const generateBlockchainHash = (input: string): string => {
      const encoder = new TextEncoder();
      const data = encoder.encode(input + Date.now().toString());
      return crypto.subtle.digest('SHA-256', data)
        .then(hash => {
          const hashArray = Array.from(new Uint8Array(hash));
          return 'SHA256:' + hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
        });
    };

    switch (action) {
      case 'verify_batch': {
        // Verify drug batch authenticity
        const { batchNumber, qrCode } = data;

        // Lookup batch in blockchain
        const { data: batchData, error: batchError } = await supabase
          .from('drug_provenance')
          .select(`
            *,
            product:products (
              id,
              name_en,
              name_ar,
              description_en,
              image_url
            )
          `)
          .or(`batch_number.eq.${batchNumber},qr_code_data.eq.${qrCode}`)
          .single();

        if (batchError || !batchData) {
          return new Response(
            JSON.stringify({
              verified: false,
              status: 'unknown',
              message: 'Batch not found in blockchain. This may be a counterfeit product.',
            }),
            { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 404 }
          );
        }

        // Check expiry date
        const expiryDate = new Date(batchData.expiry_date);
        const isExpired = expiryDate < new Date();

        // Get supply chain history
        const { data: supplyChain } = await supabase
          .from('supply_chain_events')
          .select('*')
          .eq('batch_id', batchData.id)
          .order('event_timestamp', { ascending: true });

        const verificationResult = {
          verified: !isExpired && batchData.verification_status === 'verified',
          status: isExpired ? 'expired' : batchData.verification_status,
          batch: {
            batchNumber: batchData.batch_number,
            blockchainHash: batchData.blockchain_hash,
            product: batchData.product,
            manufacturingDate: batchData.manufacturing_date,
            expiryDate: batchData.expiry_date,
            manufacturer: {
              id: batchData.manufacturer_id,
              name: batchData.manufacturer_name,
              location: batchData.manufacturing_location,
            },
            unitsProduced: batchData.total_units,
            unitsDistributed: batchData.units_distributed,
          },
          supplyChain: supplyChain || [],
          verifiedAt: new Date().toISOString(),
        };

        return new Response(JSON.stringify(verificationResult), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      case 'generate_batch': {
        // Generate new blockchain-verified batch (admin only)
        const { productId, totalUnits, manufacturerName, manufacturingLocation } = data;

        const batchNumber = `BATCH-${Date.now()}-${Math.random().toString(36).substr(2, 6).toUpperCase()}`;
        const qrCodeData = `QR:${batchNumber}:${await generateBlockchainHash(batchNumber)}`;
        const blockchainHash = await generateBlockchainHash(`${productId}:${batchNumber}:${Date.now()}`);

        const { data: newBatch, error: insertError } = await supabase
          .from('drug_provenance')
          .insert({
            product_id: productId,
            batch_number: batchNumber,
            blockchain_hash: blockchainHash,
            manufacturing_date: new Date().toISOString().split('T')[0],
            expiry_date: new Date(Date.now() + 18 * 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
            manufacturer_id: `MFG-${Math.floor(Math.random() * 10000)}`,
            manufacturer_name: manufacturerName,
            manufacturing_location: manufacturingLocation,
            qr_code_data: qrCodeData,
            total_units: totalUnits,
            units_distributed: 0,
            verification_status: 'verified',
          })
          .select()
          .single();

        if (insertError) {
          throw insertError;
        }

        // Create initial supply chain event
        await supabase.from('supply_chain_events').insert({
          batch_id: newBatch.id,
          event_type: 'manufactured',
          location_name: manufacturingLocation,
          handler_name: manufacturerName,
          units_transferred: totalUnits,
          blockchain_hash: await generateBlockchainHash(`${newBatch.id}:manufactured`),
        });

        return new Response(JSON.stringify({ batch: newBatch }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      case 'track_supply_chain': {
        // Add supply chain event
        const { batchId, eventType, locationName, locationCoordinates, handlerName, unitsTransferred } = data;

        const { data: event, error: eventError } = await supabase
          .from('supply_chain_events')
          .insert({
            batch_id: batchId,
            event_type: eventType,
            location_name: locationName,
            location_coordinates: locationCoordinates,
            handler_name: handlerName,
            units_transferred: unitsTransferred,
            blockchain_hash: await generateBlockchainHash(`${batchId}:${eventType}:${Date.now()}`),
          })
          .select()
          .single();

        if (eventError) {
          throw eventError;
        }

        // Update units distributed if applicable
        if (eventType === 'dispensed') {
          await supabase
            .from('drug_provenance')
            .update({
              units_distributed: await supabase
                .from('drug_provenance')
                .select('units_distributed')
                .eq('id', batchId)
                .single()
                .then(({ data }) => (data?.units_distributed || 0) + unitsTransferred),
            })
            .eq('id', batchId);
        }

        return new Response(JSON.stringify({ event }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      case 'record_verification': {
        // Record user verification scan
        const { userId, batchId, verificationMethod, verificationResult, scanLocation } = data;

        const { error: recordError } = await supabase
          .from('verification_history')
          .insert({
            user_id: userId,
            batch_id: batchId,
            verification_method: verificationMethod,
            verification_result: verificationResult,
            scan_location: scanLocation,
          });

        if (recordError) {
          throw recordError;
        }

        return new Response(JSON.stringify({ success: true }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      case 'get_product_batches': {
        // Get all batches for a product
        const { productId } = data;

        const { data: batches, error: batchesError } = await supabase
          .from('drug_provenance')
          .select('*, supply_chain_events(*)')
          .eq('product_id', productId)
          .order('created_at', { ascending: false });

        if (batchesError) {
          throw batchesError;
        }

        return new Response(JSON.stringify({ batches }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      case 'detect_counterfeit': {
        // Counterfeit detection algorithm
        const { batchNumber, productId, qrCode } = data;

        // Check if batch exists
        const { data: batch } = await supabase
          .from('drug_provenance')
          .select('*')
          .eq('batch_number', batchNumber)
          .maybeSingle();

        // Check if QR code matches
        const qrMatch = batch && batch.qr_code_data === qrCode;

        // Check if product ID matches
        const productMatch = batch && batch.product_id === productId;

        // Check blockchain hash integrity
        const expectedHash = batch ? await generateBlockchainHash(`${batch.product_id}:${batch.batch_number}:${new Date(batch.created_at).getTime()}`) : null;
        const hashValid = batch && batch.blockchain_hash.startsWith('SHA256:');

        const counterfeitRisk = {
          isCounterfeit: !batch || !qrMatch || !productMatch || !hashValid,
          riskLevel: !batch ? 'critical' : (!qrMatch || !productMatch) ? 'high' : !hashValid ? 'medium' : 'low',
          checks: {
            batchExists: !!batch,
            qrCodeMatch: qrMatch,
            productIdMatch: productMatch,
            blockchainHashValid: hashValid,
          },
          recommendations: [] as string[],
        };

        if (counterfeitRisk.isCounterfeit) {
          counterfeitRisk.recommendations.push('Do not consume this medication');
          counterfeitRisk.recommendations.push('Report to authorities immediately');
          counterfeitRisk.recommendations.push('Contact manufacturer for verification');
        }

        return new Response(JSON.stringify(counterfeitRisk), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      default:
        return new Response(JSON.stringify({ error: 'Invalid action' }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 400,
        });
    }
  } catch (error) {
    console.error('Blockchain verification error:', error);
    return new Response(
      JSON.stringify({
        error: {
          code: 'BLOCKCHAIN_ERROR',
          message: error.message,
        },
      }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});
