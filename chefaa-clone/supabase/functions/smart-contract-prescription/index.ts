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

    // Generate contract hash
    const generateContractHash = async (input: string): Promise<string> => {
      const encoder = new TextEncoder();
      const data = encoder.encode(input + Date.now().toString());
      const hash = await crypto.subtle.digest('SHA-256', data);
      const hashArray = Array.from(new Uint8Array(hash));
      return 'CONTRACT:' + hashArray.map(b => b.toString(16).padStart(2, '0')).join('').substring(0, 32);
    };

    switch (action) {
      case 'create_contract': {
        // Create new smart contract for prescription
        const { prescriptionId, userId, autoRefillEnabled, refillSchedule } = data;

        const contractHash = await generateContractHash(`${userId}:${prescriptionId}`);

        // Create smart contract
        const { data: contract, error: contractError } = await supabase
          .from('smart_contracts')
          .insert({
            contract_type: 'prescription_fulfillment',
            contract_hash: contractHash,
            prescription_id: prescriptionId,
            user_id: userId,
            state: 'pending',
            auto_refill_enabled: autoRefillEnabled || false,
            refill_schedule: refillSchedule || null,
            execution_log: [],
            error_log: [],
          })
          .select()
          .single();

        if (contractError) {
          throw contractError;
        }

        // Initialize prescription lifecycle
        await supabase.from('prescription_lifecycle').insert({
          contract_id: contract.id,
          prescription_id: prescriptionId,
          lifecycle_stage: 'submitted',
          stage_status: 'in_progress',
          automation_enabled: true,
        });

        // Start automated processing
        await processLifecycleStage(supabase, contract.id, prescriptionId);

        return new Response(JSON.stringify({ contract }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      case 'verify_insurance': {
        // Automated insurance verification
        const { contractId, insuranceInfo } = data;

        // Simulated insurance verification (in production, integrate with real insurance APIs)
        const verificationResult = {
          verified: Math.random() > 0.1, // 90% success rate for demo
          coveragePercentage: Math.floor(Math.random() * 50) + 50, // 50-100%
          copayAmount: Math.floor(Math.random() * 50) + 10, // $10-$60
          authorizationCode: `AUTH-${Date.now()}-${Math.random().toString(36).substr(2, 6).toUpperCase()}`,
          verifiedAt: new Date().toISOString(),
        };

        // Update contract
        const { error: updateError } = await supabase
          .from('smart_contracts')
          .update({
            insurance_verified: verificationResult.verified,
            insurance_details: verificationResult,
            execution_log: supabase.sql`array_append(execution_log, ${JSON.stringify({
              timestamp: new Date().toISOString(),
              action: 'insurance_verification',
              result: verificationResult.verified ? 'success' : 'failed',
              details: verificationResult,
            })})`,
            state: verificationResult.verified ? 'processing' : 'failed',
          })
          .eq('id', contractId);

        if (updateError) {
          throw updateError;
        }

        // Move to next lifecycle stage
        if (verificationResult.verified) {
          await supabase.from('prescription_lifecycle').insert({
            contract_id: contractId,
            prescription_id: await supabase.from('smart_contracts').select('prescription_id').eq('id', contractId).single().then(r => r.data?.prescription_id),
            lifecycle_stage: 'insurance_check',
            stage_status: 'completed',
            automation_enabled: true,
            stage_completed_at: new Date().toISOString(),
            processing_time_seconds: 2,
          });

          await supabase.from('prescription_lifecycle').insert({
            contract_id: contractId,
            prescription_id: await supabase.from('smart_contracts').select('prescription_id').eq('id', contractId).single().then(r => r.data?.prescription_id),
            lifecycle_stage: 'approved',
            stage_status: 'in_progress',
            automation_enabled: true,
          });
        }

        return new Response(JSON.stringify({ verification: verificationResult }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      case 'setup_auto_refill': {
        // Setup automated refill schedule
        const { contractId, userId, medicationName, dosage, frequency, refillsRemaining } = data;

        const nextRefillDate = calculateNextRefillDate(frequency);

        const { data: refill, error: refillError } = await supabase
          .from('automated_refills')
          .insert({
            contract_id: contractId,
            user_id: userId,
            medication_name: medicationName,
            dosage: dosage,
            refill_frequency: frequency,
            next_refill_date: nextRefillDate,
            refills_remaining: refillsRemaining,
            auto_process: true,
            status: 'active',
          })
          .select()
          .single();

        if (refillError) {
          throw refillError;
        }

        // Update contract
        await supabase
          .from('smart_contracts')
          .update({
            auto_refill_enabled: true,
            refill_schedule: {
              frequency,
              next_refill: nextRefillDate,
              refills_remaining: refillsRemaining,
            },
          })
          .eq('id', contractId);

        return new Response(JSON.stringify({ refill }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      case 'process_refill': {
        // Process automated refill
        const { refillId } = data;

        const { data: refill } = await supabase
          .from('automated_refills')
          .select('*')
          .eq('id', refillId)
          .single();

        if (!refill) {
          throw new Error('Refill not found');
        }

        // Check if refill is due
        const today = new Date();
        const refillDate = new Date(refill.next_refill_date);

        if (refillDate > today) {
          return new Response(JSON.stringify({ message: 'Refill not yet due' }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          });
        }

        // Process refill (in production, create actual prescription/order)
        const nextRefill = calculateNextRefillDate(refill.refill_frequency, refillDate);

        await supabase
          .from('automated_refills')
          .update({
            last_refill_date: today.toISOString().split('T')[0],
            next_refill_date: nextRefill,
            refills_remaining: Math.max(0, (refill.refills_remaining || 0) - 1),
            status: (refill.refills_remaining || 0) <= 1 ? 'completed' : 'active',
          })
          .eq('id', refillId);

        return new Response(JSON.stringify({ success: true, nextRefill }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      case 'get_contract_status': {
        // Get contract and lifecycle status
        const { contractId } = data;

        const { data: contract } = await supabase
          .from('smart_contracts')
          .select(`
            *,
            prescription_lifecycle(*)
          `)
          .eq('id', contractId)
          .single();

        if (!contract) {
          return new Response(JSON.stringify({ error: 'Contract not found' }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            status: 404,
          });
        }

        return new Response(JSON.stringify({ contract }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      case 'get_user_refills': {
        // Get all automated refills for user
        const { userId } = data;

        const { data: refills } = await supabase
          .from('automated_refills')
          .select('*')
          .eq('user_id', userId)
          .order('next_refill_date', { ascending: true });

        return new Response(JSON.stringify({ refills: refills || [] }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      case 'handle_intervention': {
        // Handle cases requiring human intervention
        const { contractId, interventionReason, resolution } = data;

        await supabase.from('prescription_lifecycle').insert({
          contract_id: contractId,
          prescription_id: await supabase.from('smart_contracts').select('prescription_id').eq('id', contractId).single().then(r => r.data?.prescription_id),
          lifecycle_stage: 'intervention_required',
          stage_status: resolution === 'approved' ? 'completed' : 'failed',
          automation_enabled: false,
          human_intervention_required: true,
          intervention_reason: interventionReason,
          notes: `Human intervention: ${resolution}`,
          stage_completed_at: new Date().toISOString(),
        });

        await supabase
          .from('smart_contracts')
          .update({
            state: resolution === 'approved' ? 'processing' : 'failed',
            error_log: resolution === 'approved' ? supabase.sql`error_log` : supabase.sql`array_append(error_log, ${JSON.stringify({
              timestamp: new Date().toISOString(),
              error: interventionReason,
              resolution,
            })})`,
          })
          .eq('id', contractId);

        return new Response(JSON.stringify({ success: true }), {
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
    console.error('Smart contract error:', error);
    return new Response(
      JSON.stringify({
        error: {
          code: 'SMART_CONTRACT_ERROR',
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

// Helper functions
async function processLifecycleStage(supabase: any, contractId: string, prescriptionId: string) {
  // Auto-progress through stages (simulated automation)
  const stages = ['submitted', 'insurance_check', 'approved', 'dispensing', 'delivered'];
  
  for (let i = 0; i < 2; i++) { // Process first 2 stages automatically
    await new Promise(resolve => setTimeout(resolve, 100)); // Simulate processing time
    
    await supabase.from('prescription_lifecycle').update({
      stage_status: 'completed',
      stage_completed_at: new Date().toISOString(),
      processing_time_seconds: 2,
    }).eq('contract_id', contractId).eq('lifecycle_stage', stages[i]);

    if (i < stages.length - 1) {
      await supabase.from('prescription_lifecycle').insert({
        contract_id: contractId,
        prescription_id: prescriptionId,
        lifecycle_stage: stages[i + 1],
        stage_status: 'in_progress',
        automation_enabled: true,
      });
    }
  }
}

function calculateNextRefillDate(frequency: string, fromDate?: Date): string {
  const today = fromDate || new Date();
  let nextDate = new Date(today);

  switch (frequency) {
    case 'weekly':
      nextDate.setDate(nextDate.getDate() + 7);
      break;
    case 'biweekly':
      nextDate.setDate(nextDate.getDate() + 14);
      break;
    case 'monthly':
      nextDate.setMonth(nextDate.getMonth() + 1);
      break;
    case 'quarterly':
      nextDate.setMonth(nextDate.getMonth() + 3);
      break;
    default:
      nextDate.setMonth(nextDate.getMonth() + 1);
  }

  return nextDate.toISOString().split('T')[0];
}
