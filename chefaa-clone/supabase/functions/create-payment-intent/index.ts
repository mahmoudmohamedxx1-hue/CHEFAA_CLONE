// Stripe Payment Intent Creation Edge Function
// Handles real payment processing for e-commerce orders

Deno.serve(async (req) => {
  const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Credentials': 'false'
  };

  if (req.method === 'OPTIONS') {
    return new Response(null, { status: 200, headers: corsHeaders });
  }

  try {
    const { 
      amount, 
      currency = 'egp', // Egyptian Pound for Chefaa
      cartItems, 
      customerEmail, 
      shippingAddress,
      phone,
      deliveryType = 'instant'
    } = await req.json();

    console.log('Payment intent request received:', { amount, currency, itemsCount: cartItems?.length });

    // Validate required parameters
    if (!amount || amount <= 0) {
      throw new Error('Valid amount is required');
    }

    if (!cartItems || !Array.isArray(cartItems) || cartItems.length === 0) {
      throw new Error('Cart items are required');
    }

    if (!shippingAddress || !phone) {
      throw new Error('Shipping address and phone number are required');
    }

    // Validate cart items
    for (const item of cartItems) {
      if (!item.id || !item.quantity || !item.price || !item.name) {
        throw new Error('Each cart item must have id, quantity, price, and name');
      }
      if (item.quantity <= 0 || item.price <= 0) {
        throw new Error('Cart item quantity and price must be positive');
      }
    }

    // Get credentials
    const stripeSecretKey = Deno.env.get('STRIPE_SECRET_KEY');
    const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
    const supabaseUrl = Deno.env.get('SUPABASE_URL');

    if (!stripeSecretKey) {
      throw new Error('Stripe secret key not configured');
    }

    if (!serviceRoleKey || !supabaseUrl) {
      throw new Error('Supabase configuration missing');
    }

    // Calculate and verify amount
    const deliveryFee = 30; // EGP
    const subtotal = cartItems.reduce((sum, item) => sum + (item.price * item.quantity), 0);
    const calculatedTotal = subtotal + deliveryFee;
    
    if (Math.abs(calculatedTotal - amount) > 0.01) {
      throw new Error('Amount mismatch: calculated amount does not match provided amount');
    }

    // Get user from auth header
    const authHeader = req.headers.get('authorization');
    if (!authHeader) {
      throw new Error('Authentication required');
    }

    const token = authHeader.replace('Bearer ', '');
    const userResponse = await fetch(`${supabaseUrl}/auth/v1/user`, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'apikey': serviceRoleKey
      }
    });

    if (!userResponse.ok) {
      throw new Error('Unauthorized');
    }

    const userData = await userResponse.json();
    const userId = userData.id;

    console.log('User authenticated:', userId);

    // Check for fraud before creating payment
    const fraudCheckResponse = await fetch(
      `${supabaseUrl}/rest/v1/rpc/detect_fraud`,
      {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${serviceRoleKey}`,
          'apikey': serviceRoleKey,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          order_data: {
            user_id: userId,
            total_amount: amount,
            products: cartItems,
            shipping_address: shippingAddress
          }
        })
      }
    );

    if (fraudCheckResponse.ok) {
      const fraudResult = await fraudCheckResponse.json();
      
      if (fraudResult.recommendation === 'block') {
        // Log security event
        await fetch(`${supabaseUrl}/rest/v1/security_events`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${serviceRoleKey}`,
            'apikey': serviceRoleKey,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            user_id: userId,
            event_type: 'fraud_detected',
            severity: 'high',
            details: fraudResult
          })
        });

        throw new Error('Order flagged as high risk. Please contact support.');
      }
    }

    // Create Stripe Payment Intent
    const stripeParams = new URLSearchParams();
    stripeParams.append('amount', Math.round(amount * 100).toString()); // Convert to smallest currency unit
    stripeParams.append('currency', currency);
    stripeParams.append('payment_method_types[]', 'card');
    stripeParams.append('metadata[customer_email]', customerEmail || userData.email || '');
    stripeParams.append('metadata[user_id]', userId);
    stripeParams.append('metadata[phone]', phone);
    stripeParams.append('metadata[delivery_type]', deliveryType);
    stripeParams.append('metadata[items_count]', cartItems.length.toString());

    console.log('Creating Stripe payment intent...');

    const stripeResponse = await fetch('https://api.stripe.com/v1/payment_intents', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${stripeSecretKey}`,
        'Content-Type': 'application/x-www-form-urlencoded'
      },
      body: stripeParams.toString()
    });

    if (!stripeResponse.ok) {
      const errorData = await stripeResponse.text();
      console.error('Stripe API error:', errorData);
      throw new Error(`Stripe API error: ${errorData}`);
    }

    const paymentIntent = await stripeResponse.json();
    console.log('Payment intent created:', paymentIntent.id);

    // Create order in database
    const orderData = {
      user_id: userId,
      stripe_payment_intent_id: paymentIntent.id,
      products: cartItems.map(item => ({
        id: item.id,
        name: item.name,
        name_ar: item.name_ar,
        price: item.price,
        quantity: item.quantity,
        image: item.image
      })),
      subtotal: subtotal,
      delivery_fee: deliveryFee,
      total_amount: amount,
      status: 'pending_payment',
      delivery_type: deliveryType,
      delivery_address: shippingAddress,
      payment_method: 'card',
      phone: phone,
      created_at: new Date().toISOString()
    };

    console.log('Creating order in database...');

    const orderResponse = await fetch(`${supabaseUrl}/rest/v1/orders`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${serviceRoleKey}`,
        'apikey': serviceRoleKey,
        'Content-Type': 'application/json',
        'Prefer': 'return=representation'
      },
      body: JSON.stringify(orderData)
    });

    if (!orderResponse.ok) {
      const errorText = await orderResponse.text();
      console.error('Failed to create order:', errorText);
      
      // Cancel payment intent if order creation fails
      try {
        await fetch(`https://api.stripe.com/v1/payment_intents/${paymentIntent.id}/cancel`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${stripeSecretKey}`,
            'Content-Type': 'application/x-www-form-urlencoded'
          }
        });
        console.log('Payment intent cancelled due to order creation failure');
      } catch (cancelError) {
        console.error('Failed to cancel payment intent:', cancelError.message);
      }
      
      throw new Error(`Failed to create order: ${errorText}`);
    }

    const order = await orderResponse.json();
    const orderId = order[0].id;
    console.log('Order created successfully:', orderId);

    // Log audit event
    await fetch(`${supabaseUrl}/rest/v1/audit_logs`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${serviceRoleKey}`,
        'apikey': serviceRoleKey,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        user_id: userId,
        action: 'payment_initiated',
        resource_type: 'order',
        resource_id: orderId,
        details: {
          amount: amount,
          payment_intent_id: paymentIntent.id,
          items_count: cartItems.length
        }
      })
    });

    return new Response(JSON.stringify({
      data: {
        clientSecret: paymentIntent.client_secret,
        paymentIntentId: paymentIntent.id,
        orderId: orderId,
        amount: amount,
        currency: currency,
        status: 'pending_payment'
      }
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error('Payment intent creation error:', error);

    return new Response(JSON.stringify({
      error: {
        code: 'PAYMENT_INTENT_FAILED',
        message: error.message,
        timestamp: new Date().toISOString()
      }
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
});
