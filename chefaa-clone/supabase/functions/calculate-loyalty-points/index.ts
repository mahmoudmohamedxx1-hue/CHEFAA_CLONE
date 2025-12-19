// Loyalty Points Calculation Edge Function
// Calculates points earned based on purchase amount, tier, and multiplier

interface CalculatePointsRequest {
  userId: string;
  orderAmount: number;
  orderId: string;
  category?: string;
  timestamp: string;
}

interface CalculatePointsResponse {
  pointsEarned: number;
  multiplier: number;
  bonusPoints: number;
  transactionId: string;
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
    const { userId, orderAmount, orderId, category, timestamp }: CalculatePointsRequest = await req.json();

    if (!userId || !orderAmount || !orderId) {
      return new Response(
        JSON.stringify({ error: 'Missing required parameters' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Base points calculation: 1 point per 10 EGP
    const basePoints = Math.floor(orderAmount / 10);

    // Get user tier from database
    const supabaseUrl = Deno.env.get('SUPABASE_URL');
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
    
    if (!supabaseUrl || !supabaseKey) {
      throw new Error('Supabase configuration missing');
    }

    // Fetch user loyalty data
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

    // Calculate tier multiplier
    const tierMultipliers = {
      'Bronze': 1.0,
      'Silver': 1.5,
      'Gold': 2.0,
      'Platinum': 3.0
    };

    const tierMultiplier = tierMultipliers[customerLoyalty.tier.name] || 1.0;

    // Calculate bonus points
    let bonusPoints = 0;
    
    // First-time buyer bonus
    if (customerLoyalty.lifetime_points === 0) {
      bonusPoints += 100;
    }
    
    // Category-specific bonuses
    if (category === 'wellness') {
      bonusPoints += Math.floor(basePoints * 0.1); // 10% bonus for wellness products
    } else if (category === 'prescription') {
      bonusPoints += Math.floor(basePoints * 0.05); // 5% bonus for prescriptions
    }
    
    // Monthly activity bonus (for active customers)
    const currentDate = new Date();
    const currentMonth = currentDate.getMonth();
    const currentYear = currentDate.getFullYear();
    
    // This would be calculated based on monthly activity - simplified for demo
    if (basePoints >= 50) {
      bonusPoints += 25; // Monthly activity bonus
    }

    // Calculate total points
    const pointsEarned = Math.floor(basePoints * tierMultiplier) + bonusPoints;

    // Create transaction record
    const transactionData = {
      user_id: userId,
      customer_loyalty_id: customerLoyalty.id,
      type: 'earned',
      amount: pointsEarned,
      description: `Points earned from order ${orderId}`,
      order_id: orderId,
      category: category,
      status: 'completed',
      transaction_date: timestamp
    };

    const transactionResponse = await fetch(`${supabaseUrl}/rest/v1/loyalty_transactions`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${supabaseKey}`,
        'apikey': supabaseKey,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(transactionData)
    });

    if (!transactionResponse.ok) {
      throw new Error('Failed to create transaction record');
    }

    const transactionResult = await transactionResponse.json();
    const transactionId = transactionResult[0]?.id;

    // Update customer loyalty points
    const updateData = {
      current_points: customerLoyalty.current_points + pointsEarned,
      available_points: customerLoyalty.available_points + pointsEarned,
      lifetime_points: customerLoyalty.lifetime_points + pointsEarned,
      annual_points: customerLoyalty.annual_points + pointsEarned
    };

    // Update tier if points threshold crossed
    const newTier = await calculateNewTier(updateData.current_points);
    if (newTier) {
      updateData.tier_id = newTier.id;
    }

    const updateResponse = await fetch(`${supabaseUrl}/rest/v1/customer_loyalty?user_id=eq.${userId}`, {
      method: 'PATCH',
      headers: {
        'Authorization': `Bearer ${supabaseKey}`,
        'apikey': supabaseKey,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(updateData)
    });

    if (!updateResponse.ok) {
      throw new Error('Failed to update customer loyalty');
    }

    // Send tier upgrade notification if applicable
    if (newTier && newTier.id !== customerLoyalty.tier_id) {
      await sendTierUpgradeNotification(userId, newTier.name);
    }

    const response: CalculatePointsResponse = {
      pointsEarned,
      multiplier: tierMultiplier,
      bonusPoints,
      transactionId
    };

    return new Response(JSON.stringify({ data: response }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error('Error calculating points:', error);
    
    return new Response(
      JSON.stringify({
        error: {
          code: 'POINTS_CALCULATION_ERROR',
          message: error.message
        }
      }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});

// Helper function to calculate new tier
async function calculateNewTier(points: number): Promise<any | null> {
  const supabaseUrl = Deno.env.get('SUPABASE_URL');
  const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
  
  const tiersResponse = await fetch(`${supabaseUrl}/rest/v1/loyalty_tiers?select=*&order=min_points.asc`, {
    headers: {
      'Authorization': `Bearer ${supabaseKey}`,
      'apikey': supabaseKey
    }
  });

  const tiers = await tiersResponse.json();
  
  for (const tier of tiers) {
    if (points >= tier.min_points && 
        (tier.max_points === null || points <= tier.max_points)) {
      return tier;
    }
  }
  
  return null;
}

// Helper function to send tier upgrade notification
async function sendTierUpgradeNotification(userId: string, newTier: string): Promise<void> {
  // This would integrate with your notification system
  console.log(`Tier upgrade notification: User ${userId} upgraded to ${newTier}`);
}