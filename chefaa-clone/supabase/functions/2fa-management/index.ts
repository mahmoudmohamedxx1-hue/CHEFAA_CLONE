// Two-Factor Authentication Management
// Handles TOTP setup, SMS verification, and backup codes

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3';
import { createHmac } from 'https://deno.land/std@0.177.0/node/crypto.ts';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, GET, OPTIONS',
};

interface TwoFactorRequest {
  action: 'setup_totp' | 'verify_totp' | 'enable_sms' | 'verify_sms' | 'generate_backup_codes' | 'verify_backup_code' | 'disable_2fa' | 'get_status';
  code?: string;
  phoneNumber?: string;
}

// Generate TOTP secret (base32)
function generateTOTPSecret(): string {
  const alphabet = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ234567';
  const length = 32;
  const randomBytes = new Uint8Array(length);
  crypto.getRandomValues(randomBytes);
  
  return Array.from(randomBytes)
    .map(byte => alphabet[byte % alphabet.length])
    .join('');
}

// Verify TOTP code
function verifyTOTP(secret: string, token: string): boolean {
  const window = 1; // Allow 1 time step before and after
  const timeStep = 30;
  const currentTime = Math.floor(Date.now() / 1000 / timeStep);
  
  for (let i = -window; i <= window; i++) {
    const time = currentTime + i;
    const hmac = createHmac('sha1', Buffer.from(secret, 'base32'));
    hmac.update(Buffer.from([0, 0, 0, 0, 0, 0, 0, 0].map((_, idx) => 
      idx < 4 ? (time >> ((3 - idx) * 8)) & 0xff : 0
    )));
    
    const hash = hmac.digest();
    const offset = hash[hash.length - 1] & 0xf;
    const code = (
      ((hash[offset] & 0x7f) << 24) |
      ((hash[offset + 1] & 0xff) << 16) |
      ((hash[offset + 2] & 0xff) << 8) |
      (hash[offset + 3] & 0xff)
    ) % 1000000;
    
    if (code.toString().padStart(6, '0') === token) {
      return true;
    }
  }
  
  return false;
}

// Generate backup codes
function generateBackupCodes(count: number = 10): string[] {
  const codes: string[] = [];
  for (let i = 0; i < count; i++) {
    const bytes = new Uint8Array(4);
    crypto.getRandomValues(bytes);
    const code = Array.from(bytes)
      .map(b => b.toString(16).padStart(2, '0'))
      .join('')
      .slice(0, 8);
    codes.push(code);
  }
  return codes;
}

// Hash backup code
async function hashBackupCode(code: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(code);
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { status: 200, headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Get user from auth header
    const authHeader = req.headers.get('authorization');
    if (!authHeader) {
      throw new Error('No authorization header');
    }

    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);
    
    if (authError || !user) {
      throw new Error('Unauthorized');
    }

    const body: TwoFactorRequest = await req.json();
    const { action, code, phoneNumber } = body;

    switch (action) {
      case 'setup_totp': {
        // Generate new TOTP secret
        const secret = generateTOTPSecret();
        
        // Create QR code data
        const otpauth = `otpauth://totp/Chefaa:${user.email}?secret=${secret}&issuer=Chefaa&algorithm=SHA1&digits=6&period=30`;
        
        // Store secret (not enabled yet)
        await supabase
          .from('user_2fa_settings')
          .upsert({
            user_id: user.id,
            totp_secret: secret,
            totp_enabled: false,
            updated_at: new Date().toISOString(),
          });

        return new Response(
          JSON.stringify({
            success: true,
            secret,
            otpauth,
            qr_code_url: `https://api.qrserver.com/v1/create-qr-code/?data=${encodeURIComponent(otpauth)}&size=200x200`,
          }),
          { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      case 'verify_totp': {
        if (!code) {
          throw new Error('Code required');
        }

        // Get user's TOTP secret
        const { data: settings } = await supabase
          .from('user_2fa_settings')
          .select('totp_secret')
          .eq('user_id', user.id)
          .single();

        if (!settings || !settings.totp_secret) {
          throw new Error('2FA not set up');
        }

        const isValid = verifyTOTP(settings.totp_secret, code);

        // Log attempt
        await supabase
          .from('user_2fa_attempts')
          .insert({
            user_id: user.id,
            attempt_type: 'totp',
            success: isValid,
            ip_address: req.headers.get('x-forwarded-for') || 'unknown',
            user_agent: req.headers.get('user-agent'),
          });

        if (isValid) {
          // Enable TOTP
          await supabase
            .from('user_2fa_settings')
            .update({ totp_enabled: true, updated_at: new Date().toISOString() })
            .eq('user_id', user.id);

          return new Response(
            JSON.stringify({ success: true, message: 'TOTP verified and enabled' }),
            { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        } else {
          return new Response(
            JSON.stringify({ success: false, message: 'Invalid code' }),
            { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }
      }

      case 'generate_backup_codes': {
        const codes = generateBackupCodes(10);
        const hashedCodes = await Promise.all(codes.map(c => hashBackupCode(c)));

        // Store hashed codes
        await supabase
          .from('user_2fa_settings')
          .update({ 
            backup_codes: hashedCodes,
            updated_at: new Date().toISOString()
          })
          .eq('user_id', user.id);

        return new Response(
          JSON.stringify({
            success: true,
            backup_codes: codes, // Return plain codes once for user to save
            message: 'Save these codes in a secure location. They will not be shown again.',
          }),
          { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      case 'verify_backup_code': {
        if (!code) {
          throw new Error('Backup code required');
        }

        const { data: settings } = await supabase
          .from('user_2fa_settings')
          .select('backup_codes')
          .eq('user_id', user.id)
          .single();

        if (!settings || !settings.backup_codes) {
          throw new Error('No backup codes found');
        }

        const hashedInput = await hashBackupCode(code);
        const isValid = settings.backup_codes.includes(hashedInput);

        // Log attempt
        await supabase
          .from('user_2fa_attempts')
          .insert({
            user_id: user.id,
            attempt_type: 'backup_code',
            success: isValid,
            ip_address: req.headers.get('x-forwarded-for') || 'unknown',
            user_agent: req.headers.get('user-agent'),
          });

        if (isValid) {
          // Remove used backup code
          const remainingCodes = settings.backup_codes.filter((c: string) => c !== hashedInput);
          await supabase
            .from('user_2fa_settings')
            .update({ backup_codes: remainingCodes })
            .eq('user_id', user.id);

          return new Response(
            JSON.stringify({
              success: true,
              message: 'Backup code verified',
              remaining_codes: remainingCodes.length,
            }),
            { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        } else {
          return new Response(
            JSON.stringify({ success: false, message: 'Invalid backup code' }),
            { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }
      }

      case 'get_status': {
        const { data: settings } = await supabase
          .from('user_2fa_settings')
          .select('totp_enabled, sms_enabled, phone_number, backup_codes')
          .eq('user_id', user.id)
          .single();

        return new Response(
          JSON.stringify({
            success: true,
            enabled: !!(settings?.totp_enabled || settings?.sms_enabled),
            totp_enabled: settings?.totp_enabled || false,
            sms_enabled: settings?.sms_enabled || false,
            phone_number: settings?.phone_number || null,
            backup_codes_count: settings?.backup_codes?.length || 0,
          }),
          { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      case 'disable_2fa': {
        await supabase
          .from('user_2fa_settings')
          .update({
            totp_enabled: false,
            sms_enabled: false,
            totp_secret: null,
            backup_codes: null,
            updated_at: new Date().toISOString(),
          })
          .eq('user_id', user.id);

        return new Response(
          JSON.stringify({ success: true, message: '2FA disabled' }),
          { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      default:
        return new Response(
          JSON.stringify({ error: 'Invalid action' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
    }
  } catch (error) {
    console.error('2FA Management Error:', error);
    return new Response(
      JSON.stringify({
        error: 'Internal server error',
        message: error.message,
      }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
