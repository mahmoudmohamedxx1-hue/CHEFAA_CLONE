// Real TOTP Verification Edge Function
// Implements RFC 6238 Time-Based One-Time Password Algorithm

Deno.serve(async (req) => {
  const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Max-Age': '86400',
  };

  if (req.method === 'OPTIONS') {
    return new Response(null, { status: 200, headers: corsHeaders });
  }

  try {
    const { code, action } = await req.json();
    
    if (!code || code.length !== 6) {
      throw new Error('Invalid verification code format');
    }

    // Get user from auth header
    const authHeader = req.headers.get('authorization');
    if (!authHeader) {
      throw new Error('No authorization header');
    }

    const token = authHeader.replace('Bearer ', '');
    const supabaseUrl = Deno.env.get('SUPABASE_URL');
    const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');

    // Verify user
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

    // Get user's 2FA secret from database
    const secretResponse = await fetch(
      `${supabaseUrl}/rest/v1/two_factor_auth?user_id=eq.${userId}&select=secret_key,method,backup_codes`,
      {
        headers: {
          'Authorization': `Bearer ${serviceRoleKey}`,
          'apikey': serviceRoleKey,
        }
      }
    );

    if (!secretResponse.ok) {
      throw new Error('2FA not configured');
    }

    const secretData = await secretResponse.json();
    if (!secretData || secretData.length === 0) {
      throw new Error('2FA not configured for this user');
    }

    const { secret_key, method, backup_codes } = secretData[0];

    // Check if it's a backup code
    if (backup_codes && backup_codes.includes(code)) {
      // Remove used backup code
      const updatedCodes = backup_codes.filter(c => c !== code);
      
      await fetch(
        `${supabaseUrl}/rest/v1/two_factor_auth?user_id=eq.${userId}`,
        {
          method: 'PATCH',
          headers: {
            'Authorization': `Bearer ${serviceRoleKey}`,
            'apikey': serviceRoleKey,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ backup_codes: updatedCodes })
        }
      );

      // Log security event
      await logSecurityEvent(supabaseUrl, serviceRoleKey, userId, '2fa_backup_code_used');

      return new Response(JSON.stringify({
        data: { verified: true, method: 'backup_code' }
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    // Verify TOTP code
    if (method === 'totp' && secret_key) {
      const isValid = await verifyTOTP(secret_key, code);
      
      if (isValid) {
        // Log successful verification
        await logSecurityEvent(supabaseUrl, serviceRoleKey, userId, '2fa_verified');

        // Update verification status if this is enrollment
        if (action === 'enroll') {
          await fetch(
            `${supabaseUrl}/rest/v1/two_factor_auth?user_id=eq.${userId}`,
            {
              method: 'PATCH',
              headers: {
                'Authorization': `Bearer ${serviceRoleKey}`,
                'apikey': serviceRoleKey,
                'Content-Type': 'application/json',
              },
              body: JSON.stringify({
                verified: true,
                enabled: true,
                verified_at: new Date().toISOString()
              })
            }
          );
        }

        return new Response(JSON.stringify({
          data: { verified: true, method: 'totp' }
        }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
      } else {
        // Log failed verification
        await logSecurityEvent(supabaseUrl, serviceRoleKey, userId, '2fa_verification_failed');
        
        return new Response(JSON.stringify({
          error: { code: 'INVALID_CODE', message: 'Invalid verification code' }
        }), {
          status: 401,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
      }
    }

    throw new Error('Unsupported 2FA method');

  } catch (error) {
    return new Response(JSON.stringify({
      error: { code: 'VERIFICATION_ERROR', message: error.message }
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
});

// TOTP Verification (RFC 6238)
async function verifyTOTP(secret, code) {
  const window = 1; // Allow 1 time step before/after (30 seconds each)
  const timeStep = 30; // 30 second time steps
  const currentTime = Math.floor(Date.now() / 1000);
  
  // Try current time and +/- 1 window
  for (let i = -window; i <= window; i++) {
    const time = currentTime + (i * timeStep);
    const generatedCode = await generateTOTP(secret, time);
    
    if (generatedCode === code) {
      return true;
    }
  }
  
  return false;
}

// Generate TOTP code
async function generateTOTP(secret, time) {
  const counter = Math.floor(time / 30);
  
  // Decode base32 secret
  const key = base32Decode(secret);
  
  // Create counter buffer (8 bytes, big-endian)
  const buffer = new ArrayBuffer(8);
  const view = new DataView(buffer);
  view.setUint32(4, counter, false); // Big-endian
  
  // HMAC-SHA1
  const cryptoKey = await crypto.subtle.importKey(
    'raw',
    key,
    { name: 'HMAC', hash: 'SHA-1' },
    false,
    ['sign']
  );
  
  const signature = await crypto.subtle.sign('HMAC', cryptoKey, buffer);
  const hmac = new Uint8Array(signature);
  
  // Dynamic truncation
  const offset = hmac[19] & 0x0f;
  const code = ((hmac[offset] & 0x7f) << 24) |
               ((hmac[offset + 1] & 0xff) << 16) |
               ((hmac[offset + 2] & 0xff) << 8) |
               (hmac[offset + 3] & 0xff);
  
  // Return 6-digit code
  return String(code % 1000000).padStart(6, '0');
}

// Base32 decoding
function base32Decode(input) {
  const alphabet = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ234567';
  input = input.toUpperCase().replace(/=+$/, '');
  
  let bits = 0;
  let value = 0;
  const output = [];
  
  for (let i = 0; i < input.length; i++) {
    const idx = alphabet.indexOf(input[i]);
    if (idx === -1) continue;
    
    value = (value << 5) | idx;
    bits += 5;
    
    if (bits >= 8) {
      output.push((value >>> (bits - 8)) & 0xff);
      bits -= 8;
    }
  }
  
  return new Uint8Array(output);
}

// Log security event
async function logSecurityEvent(supabaseUrl, serviceRoleKey, userId, eventType) {
  await fetch(`${supabaseUrl}/rest/v1/security_events`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${serviceRoleKey}`,
      'apikey': serviceRoleKey,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      user_id: userId,
      event_type: eventType,
      severity: 'low',
      details: { timestamp: new Date().toISOString() }
    })
  });
}
