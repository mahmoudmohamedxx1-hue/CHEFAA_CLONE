// Loyalty Reward Redemption Edge Function
// Handles reward redemption logic, availability checks, and fulfillment

interface RedeemRewardRequest {
  userId: string;
  rewardId: string;
  redemptionMetadata?: Record<string, any>;
}

interface RedeemRewardResponse {
  redemptionId: string;
  redemptionCode?: string;
  status: 'pending' | 'completed' | 'failed';
  instructions: string[];
  fulfillmentType: 'digital' | 'physical' | 'service';
  estimatedDelivery?: string;
  fulfillmentUrl?: string;
}

Deno.serve(async (req) => {
  const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
    'Access-Control-Allow-Methods': 'POST, GET, OPTIONS, PUT, DELETE, PATCH',
    'Access-Control-Max-Age': '86400',
    'Access-Control-Allow-Credentials': 'false'
  };

  if (req.method === 'OPTIONS') {
    return new Response(null, { status: 200, headers: corsHeaders });
  }

  try {
    const { userId, rewardId, redemptionMetadata }: RedeemRewardRequest = await req.json();

    if (!userId || !rewardId) {
      return new Response(
        JSON.stringify({ error: 'Missing required parameters' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL');
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
    
    if (!supabaseUrl || !supabaseKey) {
      throw new Error('Supabase configuration missing');
    }

    // Get customer loyalty data
    const loyaltyResponse = await fetch(`${supabaseUrl}/rest/v1/customer_loyalty?user_id=eq.${userId}&select=*,tier:loyalty_tiers(*)`, {
      headers: {
        'Authorization': `Bearer ${supabaseKey}`,
        'apikey': supabaseKey,
        'Content-Type': 'application/json'
      }
    });

    const loyaltyData = await loyaltyResponse.json();
    const customerLoyalty = loyaltyData[0];

    if (!customerLoyalty) {
      return new Response(
        JSON.stringify({ error: 'Customer loyalty data not found' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Get reward details
    const rewardResponse = await fetch(`${supabaseUrl}/rest/v1/loyalty_rewards?id=eq.${rewardId}&select=*`, {
      headers: {
        'Authorization': `Bearer ${supabaseKey}`,
        'apikey': supabaseKey,
        'Content-Type': 'application/json'
      }
    });

    const rewardData = await rewardResponse.json();
    const reward = rewardData[0];

    if (!reward) {
      return new Response(
        JSON.stringify({ error: 'Reward not found' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Validate reward availability and eligibility
    const validation = await validateRedemption(customerLoyalty, reward);
    if (!validation.isValid) {
      return new Response(
        JSON.stringify({ error: validation.error }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Determine fulfillment type based on reward category
    const fulfillmentType = determineFulfillmentType(reward.category);

    // Create redemption record
    const redemptionCode = await generateRedemptionCode(reward.category);
    
    const redemptionData = {
      user_id: userId,
      reward_id: rewardId,
      customer_loyalty_id: customerLoyalty.id,
      points_used: reward.cost,
      status: fulfillmentType === 'digital' ? 'completed' : 'pending',
      redemption_code: redemptionCode,
      usage_instructions: reward.how_to_use?.join('\n') || '',
      external_reference: redemptionMetadata?.external_reference || null,
      metadata: redemptionMetadata || {}
    };

    const redemptionResponse = await fetch(`${supabaseUrl}/rest/v1/loyalty_redemptions`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${supabaseKey}`,
        'apikey': supabaseKey,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(redemptionData)
    });

    if (!redemptionResponse.ok) {
      throw new Error('Failed to create redemption record');
    }

    const redemptionResult = await redemptionResponse.json();
    const redemptionId = redemptionResult[0].id;

    // Update customer points
    const newAvailablePoints = customerLoyalty.available_points - reward.cost;

    await fetch(`${supabaseUrl}/rest/v1/customer_loyalty?user_id=eq.${userId}`, {
      method: 'PATCH',
      headers: {
        'Authorization': `Bearer ${supabaseKey}`,
        'apikey': supabaseKey,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        available_points: newAvailablePoints
      })
    });

    // Create transaction record
    await fetch(`${supabaseUrl}/rest/v1/loyalty_transactions`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${supabaseKey}`,
        'apikey': supabaseKey,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        user_id: userId,
        customer_loyalty_id: customerLoyalty.id,
        type: 'redeemed',
        amount: -reward.cost,
        description: `Redeemed: ${reward.name}`,
        status: 'completed'
      })
    });

    // Update reward quantity if limited
    if (reward.is_limited && reward.remaining_quantity !== null) {
      await fetch(`${supabaseUrl}/rest/v1/loyalty_rewards?id=eq.${rewardId}`, {
        method: 'PATCH',
        headers: {
          'Authorization': `Bearer ${supabaseKey}`,
          'apikey': supabaseKey,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          remaining_quantity: reward.remaining_quantity - 1
        })
      });
    }

    // Handle fulfillment based on type
    let fulfillmentResult = null;
    if (fulfillmentType === 'digital') {
      fulfillmentResult = await handleDigitalFulfillment(reward, redemptionCode);
    } else if (fulfillmentType === 'physical') {
      fulfillmentResult = await handlePhysicalFulfillment(reward, userId, redemptionMetadata);
    } else if (fulfillmentType === 'service') {
      fulfillmentResult = await handleServiceFulfillment(reward, userId, redemptionMetadata);
    }

    // Update redemption status if fulfilled
    if (fulfillmentResult?.status === 'completed') {
      await fetch(`${supabaseUrl}/rest/v1/loyalty_redemptions?id=eq.${redemptionId}`, {
        method: 'PATCH',
        headers: {
          'Authorization': `Bearer ${supabaseKey}`,
          'apikey': supabaseKey,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          status: 'completed',
          fulfillment_date: new Date().toISOString()
        })
      });
    }

    const response: RedeemRewardResponse = {
      redemptionId,
      redemptionCode,
      status: fulfillmentResult?.status || 'pending',
      instructions: reward.how_to_use || [],
      fulfillmentType,
      estimatedDelivery: fulfillmentResult?.estimatedDelivery,
      fulfillmentUrl: fulfillmentResult?.fulfillmentUrl
    };

    return new Response(JSON.stringify({ data: response }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error('Error redeeming reward:', error);
    
    return new Response(
      JSON.stringify({
        error: {
          code: 'REWARD_REDEMPTION_ERROR',
          message: error.message
        }
      }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});

// Validate redemption eligibility
async function validateRedemption(customerLoyalty: any, reward: any): Promise<{isValid: boolean, error?: string}> {
  // Check points balance
  if (customerLoyalty.available_points < reward.cost) {
    return { isValid: false, error: 'Insufficient points' };
  }

  // Check tier restrictions
  if (reward.tier_restrictions && reward.tier_restrictions.length > 0) {
    const currentTierIndex = getTierIndex(customerLoyalty.tier.name);
    const hasAccess = reward.tier_restrictions.some((tier: string) => 
      getTierIndex(tier) <= currentTierIndex
    );
    if (!hasAccess) {
      return { isValid: false, error: 'Tier restriction not met' };
    }
  }

  // Check availability for limited rewards
  if (reward.is_limited && reward.remaining_quantity <= 0) {
    return { isValid: false, error: 'Reward is out of stock' };
  }

  // Check expiry
  if (reward.expires_at && new Date(reward.expires_at) < new Date()) {
    return { isValid: false, error: 'Reward has expired' };
  }

  return { isValid: true };
}

// Get tier index for comparison
function getTierIndex(tierName: string): number {
  const tiers = ['Bronze', 'Silver', 'Gold', 'Platinum'];
  return tiers.indexOf(tierName);
}

// Determine fulfillment type based on reward category
function determineFulfillmentType(category: string): 'digital' | 'physical' | 'service' {
  const fulfillmentMap: Record<string, 'digital' | 'physical' | 'service'> = {
    'discount': 'digital',
    'delivery': 'digital',
    'service': 'service',
    'product': 'physical',
    'experience': 'service'
  };
  
  return fulfillmentMap[category] || 'digital';
}

// Generate redemption code
async function generateRedemptionCode(category: string): Promise<string> {
  const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  const prefix = category.substring(0, 3).toUpperCase();
  const code = prefix + Array.from({ length: 8 }, () => 
    characters.charAt(Math.floor(Math.random() * characters.length))
  ).join('');
  
  return code;
}

// Handle digital fulfillment (discounts, codes, etc.)
async function handleDigitalFulfillment(reward: any, code: string): Promise<any> {
  // For digital rewards, immediately mark as completed
  return {
    status: 'completed',
    fulfillmentUrl: `${Deno.env.get('APP_URL')}/redeem/${code}`,
    estimatedDelivery: new Date().toISOString()
  };
}

// Handle physical fulfillment (products, shipping)
async function handlePhysicalFulfillment(reward: any, userId: string, metadata: any): Promise<any> {
  // This would integrate with your fulfillment system
  const estimatedDays = metadata?.shippingPreference === 'express' ? 1 : 3;
  const estimatedDelivery = new Date();
  estimatedDelivery.setDate(estimatedDelivery.getDate() + estimatedDays);
  
  return {
    status: 'pending',
    estimatedDelivery: estimatedDelivery.toISOString(),
    trackingNumber: `CH${Date.now()}`
  };
}

// Handle service fulfillment (consultations, appointments)
async function handleServiceFulfillment(reward: any, userId: string, metadata: any): Promise<any> {
  // This would integrate with your scheduling/booking system
  return {
    status: 'pending',
    estimatedDelivery: metadata?.preferredDate || new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
    bookingReference: `SVC${Date.now()}`
  };
}