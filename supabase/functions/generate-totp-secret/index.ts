import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import * as OTPAuth from 'https://esm.sh/otpauth@9.2.1';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers':
    'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Create a new TOTP secret using the correct API
    // OTPAuth.Secret.generate is not available, use the correct method instead
    const secret = new OTPAuth.Secret();

    // Create a new TOTP object
    const totp = new OTPAuth.TOTP({
      issuer: 'KonBase',
      label: 'KonBase Account',
      algorithm: 'SHA1',
      digits: 6,
      period: 30,
      secret,
    });

    // Generate the provisioning URI for QR code
    const keyUri = totp.toString();

    console.log('TOTP secret generated successfully');

    return new Response(
      JSON.stringify({
        secret: secret.base32,
        keyUri,
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      },
    );
  } catch (error) {
    console.error('Error generating TOTP secret:', error.message);

    return new Response(
      JSON.stringify({
        error: error.message,
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400,
      },
    );
  }
});
