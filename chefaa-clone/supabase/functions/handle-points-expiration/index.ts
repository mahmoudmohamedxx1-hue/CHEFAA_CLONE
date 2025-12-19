// Points Expiration Handler Edge Function
// Manages points expiration, sends notifications, and maintains point validity

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
    const supabaseUrl = Deno.env.get('SUPABASE_URL');
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
    
    if (!supabaseUrl || !supabaseKey) {
      throw new Error('Supabase configuration missing');
    }

    // Get transactions with expiring points (points earned 365 days ago and not redeemed)
    const expiringTransactionsResponse = await fetch(
      `${supabaseUrl}/rest/v1/loyalty_transactions?select=*&type=eq.earned&status=eq.completed&expiry_date=lte.${new Date().toISOString()}&order=transaction_date.asc&limit=100`,
      {
        headers: {
          'Authorization': `Bearer ${supabaseKey}`,
          'apikey': supabaseKey,
          'Content-Type': 'application/json'
        }
      }
    );

    if (!expiringTransactionsResponse.ok) {
      throw new Error('Failed to fetch expiring transactions');
    }

    const expiringTransactions = await expiringTransactionsResponse.json();
    
    if (expiringTransactions.length === 0) {
      return new Response(
        JSON.stringify({ 
          data: { 
            processed: 0, 
            message: 'No expiring points found' 
          } 
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    let processedCount = 0;
    let expiredPointsTotal = 0;

    // Process each expiring transaction
    for (const transaction of expiringTransactions) {
      try {
        // Get customer loyalty data
        const loyaltyResponse = await fetch(
          `${supabaseUrl}/rest/v1/customer_loyalty?user_id=eq.${transaction.user_id}&select=*`,
          {
            headers: {
              'Authorization': `Bearer ${supabaseKey}`,
              'apikey': supabaseKey,
              'Content-Type': 'application/json'
            }
          }
        );

        const loyaltyData = await loyaltyResponse.json();
        const customerLoyalty = loyaltyData[0];

        if (!customerLoyalty) continue;

        // Check if points are still available (not already redeemed)
        const redemptionCheckResponse = await fetch(
          `${supabaseUrl}/rest/v1/loyalty_redemptions?user_id=eq.${transaction.user_id}&customer_loyalty_id=eq.${customerLoyalty.id}&status=eq.completed&select=points_used`,
          {
            headers: {
              'Authorization': `Bearer ${supabaseKey}`,
              'apikey': supabaseKey,
              'Content-Type': 'application/json'
            }
          }
        );

        const redemptions = await redemptionCheckResponse.json();
        const totalRedeemed = redemptions.reduce((sum: number, redemption: any) => sum + redemption.points_used, 0);

        // Only expire points if they haven't been fully redeemed
        const availablePoints = customerLoyalty.available_points;
        if (availablePoints > 0) {
          // Create expiration transaction
          const expirationAmount = Math.min(transaction.amount, availablePoints);
          
          const expirationTransactionResponse = await fetch(`${supabaseUrl}/rest/v1/loyalty_transactions`, {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${supabaseKey}`,
              'apikey': supabaseKey,
              'Content-Type': 'application/json'
            },
            body: JSON.stringify({
              user_id: transaction.user_id,
              customer_loyalty_id: transaction.customer_loyalty_id,
              type: 'expired',
              amount: -expirationAmount,
              description: `Points expired from transaction ${transaction.id}`,
              transaction_date: new Date().toISOString(),
              status: 'completed',
              category: 'expiration'
            })
          });

          if (!expirationTransactionResponse.ok) {
            console.error(`Failed to create expiration transaction for ${transaction.id}`);
            continue;
          }

          // Update customer loyalty points
          const updateResponse = await fetch(
            `${supabaseUrl}/rest/v1/customer_loyalty?user_id=eq.${transaction.user_id}`,
            {
              method: 'PATCH',
              headers: {
                'Authorization': `Bearer ${supabaseKey}`,
                'apikey': supabaseKey,
                'Content-Type': 'application/json'
              },
              body: JSON.stringify({
                available_points: Math.max(0, customerLoyalty.available_points - expirationAmount),
                points_expiring: customerLoyalty.points_expiring + expirationAmount
              })
            }
          );

          if (!updateResponse.ok) {
            console.error(`Failed to update loyalty for user ${transaction.user_id}`);
            continue;
          }

          // Send expiration notification if significant amount
          if (expirationAmount >= 100) {
            await sendExpirationNotification(transaction.user_id, expirationAmount);
          }

          processedCount++;
          expiredPointsTotal += expirationAmount;
        }

      } catch (error) {
        console.error(`Error processing transaction ${transaction.id}:`, error);
      }
    }

    // Clean up old expired transaction references (optional)
    const cleanupResponse = await fetch(
      `${supabaseUrl}/rest/v1/loyalty_transactions?expiry_date=lt.${new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString()}&select=id`,
      {
        headers: {
          'Authorization': `Bearer ${supabaseKey}`,
          'apikey': supabaseKey,
          'Content-Type': 'application/json'
        }
      }
    );

    // Optional: Archive or delete very old transactions
    // await fetch(`${supabaseUrl}/rest/v1/loyalty_transactions`, { method: 'DELETE', ... });

    return new Response(
      JSON.stringify({ 
        data: { 
          processed: processedCount,
          expiredPointsTotal,
          message: `Processed ${processedCount} expiring transactions, expired ${expiredPointsTotal} total points`
        } 
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error handling points expiration:', error);
    
    return new Response(
      JSON.stringify({
        error: {
          code: 'POINTS_EXPIRATION_ERROR',
          message: error.message
        }
      }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});

// Send expiration notification to user
async function sendExpirationNotification(userId: string, expiredPoints: number): Promise<void> {
  // This would integrate with your notification system (email, SMS, push)
  console.log(`Expiration notification: User ${userId} lost ${expiredPoints} points`);
  
  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL');
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
    
    // Create notification record
    await fetch(`${supabaseUrl}/rest/v1/notifications`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${supabaseKey}`,
        'apikey': supabaseKey,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        user_id: userId,
        type: 'points_expired',
        title: 'Points Expired',
        message: `${expiredPoints} loyalty points have expired. Keep earning to maintain your benefits!`,
        data: { expired_points: expiredPoints },
        created_at: new Date().toISOString()
      })
    });
  } catch (error) {
    console.error('Error creating expiration notification:', error);
  }
}

// Function to set up expiration for new transactions
export async function setPointExpiration(userId: string, transactionId: string, pointsAmount: number): Promise<void> {
  const supabaseUrl = Deno.env.get('SUPABASE_URL');
  const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
  
  const expiryDate = new Date();
  expiryDate.setFullYear(expiryDate.getFullYear() + 1); // 1 year expiration
  
  await fetch(`${supabaseUrl}/rest/v1/loyalty_transactions?id=eq.${transactionId}`, {
    method: 'PATCH',
    headers: {
      'Authorization': `Bearer ${supabaseKey}`,
      'apikey': supabaseKey,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      expiry_date: expiryDate.toISOString()
    })
  });
}

// Function to check for upcoming expirations (within 30 days)
export async function getUpcomingExpirations(userId?: string): Promise<any[]> {
  const supabaseUrl = Deno.env.get('SUPABASE_URL');
  const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
  
  const thirtyDaysFromNow = new Date();
  thirtyDaysFromNow.setDate(thirtyDaysFromNow.getDate() + 30);
  
  let query = `expiry_date=lte.${thirtyDaysFromNow.toISOString()}&expiry_date=gte.${new Date().toISOString()}&select=*,customer_loyalty:customer_loyalty(user_id)`;
  
  if (userId) {
    query += `&user_id=eq.${userId}`;
  }
  
  const response = await fetch(`${supabaseUrl}/rest/v1/loyalty_transactions?${query}`, {
    headers: {
      'Authorization': `Bearer ${supabaseKey}`,
      'apikey': supabaseKey,
      'Content-Type': 'application/json'
    }
  });
  
  return await response.json();
}