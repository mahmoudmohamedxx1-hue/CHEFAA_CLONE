// Stripe Webhook Handler Edge Function
// Processes payment status updates from Stripe

Deno.serve(async (req) => {
  try {
    const signature = req.headers.get('stripe-signature');
    const webhookSecret = Deno.env.get('STRIPE_WEBHOOK_SECRET');
    const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
    const supabaseUrl = Deno.env.get('SUPABASE_URL');

    if (!webhookSecret) {
      console.error('Webhook secret not configured');
      return new Response('Webhook secret not configured', { status: 500 });
    }

    // Get raw body for signature verification
    const body = await req.text();
    
    // Verify webhook signature
    const event = await verifyStripeSignature(body, signature, webhookSecret);
    
    console.log('Webhook event received:', event.type);

    // Handle different event types
    switch (event.type) {
      case 'payment_intent.succeeded':
        await handlePaymentSuccess(event.data.object, supabaseUrl, serviceRoleKey);
        break;
        
      case 'payment_intent.payment_failed':
        await handlePaymentFailed(event.data.object, supabaseUrl, serviceRoleKey);
        break;
        
      case 'payment_intent.canceled':
        await handlePaymentCanceled(event.data.object, supabaseUrl, serviceRoleKey);
        break;
        
      default:
        console.log('Unhandled event type:', event.type);
    }

    return new Response(JSON.stringify({ received: true }), {
      headers: { 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error('Webhook error:', error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' }
    });
  }
});

// Verify Stripe webhook signature
async function verifyStripeSignature(body, signature, secret) {
  if (!signature) {
    throw new Error('No signature provided');
  }

  const signatureParts = signature.split(',');
  const timestamp = signatureParts.find(part => part.startsWith('t='))?.split('=')[1];
  const sig = signatureParts.find(part => part.startsWith('v1='))?.split('=')[1];

  if (!timestamp || !sig) {
    throw new Error('Invalid signature format');
  }

  // Create expected signature
  const payload = `${timestamp}.${body}`;
  const encoder = new TextEncoder();
  const key = await crypto.subtle.importKey(
    'raw',
    encoder.encode(secret),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign']
  );

  const signature_bytes = await crypto.subtle.sign('HMAC', key, encoder.encode(payload));
  const expectedSig = Array.from(new Uint8Array(signature_bytes))
    .map(b => b.toString(16).padStart(2, '0'))
    .join('');

  // Compare signatures
  if (expectedSig !== sig) {
    throw new Error('Invalid signature');
  }

  // Check timestamp (reject if older than 5 minutes)
  const eventTime = parseInt(timestamp) * 1000;
  const currentTime = Date.now();
  if (currentTime - eventTime > 300000) {
    throw new Error('Timestamp too old');
  }

  // Parse and return event
  return JSON.parse(body);
}

// Handle successful payment
async function handlePaymentSuccess(paymentIntent, supabaseUrl, serviceRoleKey) {
  const paymentIntentId = paymentIntent.id;
  console.log('Processing successful payment:', paymentIntentId);

  // Update order status
  const updateResponse = await fetch(
    `${supabaseUrl}/rest/v1/orders?stripe_payment_intent_id=eq.${paymentIntentId}`,
    {
      method: 'PATCH',
      headers: {
        'Authorization': `Bearer ${serviceRoleKey}`,
        'apikey': serviceRoleKey,
        'Content-Type': 'application/json',
        'Prefer': 'return=representation'
      },
      body: JSON.stringify({
        status: 'confirmed',
        payment_status: 'paid',
        paid_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
    }
  );

  if (!updateResponse.ok) {
    const errorText = await updateResponse.text();
    console.error('Failed to update order:', errorText);
    throw new Error(`Failed to update order: ${errorText}`);
  }

  const orders = await updateResponse.json();
  if (orders && orders.length > 0) {
    const order = orders[0];
    console.log('Order confirmed:', order.id);

    // Log audit event
    await fetch(`${supabaseUrl}/rest/v1/audit_logs`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${serviceRoleKey}`,
        'apikey': serviceRoleKey,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        user_id: order.user_id,
        action: 'payment_completed',
        resource_type: 'order',
        resource_id: order.id,
        details: {
          payment_intent_id: paymentIntentId,
          amount: order.total_amount,
          status: 'confirmed'
        }
      })
    });

    // TODO: Send confirmation email to customer
    // TODO: Notify pharmacy/fulfillment system
  }
}

// Handle failed payment
async function handlePaymentFailed(paymentIntent, supabaseUrl, serviceRoleKey) {
  const paymentIntentId = paymentIntent.id;
  const errorMessage = paymentIntent.last_payment_error?.message || 'Payment failed';
  
  console.log('Processing failed payment:', paymentIntentId, errorMessage);

  // Update order status
  const updateResponse = await fetch(
    `${supabaseUrl}/rest/v1/orders?stripe_payment_intent_id=eq.${paymentIntentId}`,
    {
      method: 'PATCH',
      headers: {
        'Authorization': `Bearer ${serviceRoleKey}`,
        'apikey': serviceRoleKey,
        'Content-Type': 'application/json',
        'Prefer': 'return=representation'
      },
      body: JSON.stringify({
        status: 'payment_failed',
        payment_status: 'failed',
        payment_error: errorMessage,
        updated_at: new Date().toISOString()
      })
    }
  );

  if (!updateResponse.ok) {
    const errorText = await updateResponse.text();
    console.error('Failed to update order:', errorText);
  }

  const orders = await updateResponse.json();
  if (orders && orders.length > 0) {
    const order = orders[0];

    // Log security event (multiple failures might indicate fraud)
    await fetch(`${supabaseUrl}/rest/v1/security_events`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${serviceRoleKey}`,
        'apikey': serviceRoleKey,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        user_id: order.user_id,
        event_type: 'payment_failed',
        severity: 'medium',
        details: {
          payment_intent_id: paymentIntentId,
          error: errorMessage,
          order_id: order.id
        }
      })
    });
  }
}

// Handle canceled payment
async function handlePaymentCanceled(paymentIntent, supabaseUrl, serviceRoleKey) {
  const paymentIntentId = paymentIntent.id;
  console.log('Processing canceled payment:', paymentIntentId);

  // Update order status
  await fetch(
    `${supabaseUrl}/rest/v1/orders?stripe_payment_intent_id=eq.${paymentIntentId}`,
    {
      method: 'PATCH',
      headers: {
        'Authorization': `Bearer ${serviceRoleKey}`,
        'apikey': serviceRoleKey,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        status: 'canceled',
        payment_status: 'canceled',
        updated_at: new Date().toISOString()
      })
    }
  );
}
