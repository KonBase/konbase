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
    const { secret, token } = await req.json();

    if (!secret || !token) {
      throw new Error('Secret and token are required');
    }

    const cleanToken = token.trim().replace(/\s/g, '');

    console.log(
      `Verifying TOTP - Token: ${cleanToken}, Secret length: ${secret.length}`,
    );
    console.log(`Current server time: ${new Date().toISOString()}`);

    // Create a new TOTP object with the provided secret
    const secretObj = new OTPAuth.Secret({ base32: secret });

    const totp = new OTPAuth.TOTP({
      issuer: 'KonBase',
      label: 'KonBase Account',
      algorithm: 'SHA1',
      digits: 6,
      period: 30,
      secret: secretObj,
    });

    // Verify with a wider window to account for time drift between client and server
    // Window of 2 means it checks current time, 1 period before, and 1 period after
    const delta = totp.validate({ token: cleanToken, window: 2 });
    const verified = delta !== null;

    if (verified) {
      console.log(`✅ TOTP verification successful with delta: ${delta}`);
    } else {
      console.log(
        `❌ TOTP verification failed - Token provided: ${cleanToken}`,
      );

      // For debugging, generate the current expected token
      const currentToken = totp.generate();
      console.log(`Current expected token would be: ${currentToken}`);
    }

    return new Response(
      JSON.stringify({
        verified,
        delta,
        serverTime: new Date().toISOString(),
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      },
    );
  } catch (error) {
    console.error('Error verifying TOTP:', error.message);
    console.error('Stack trace:', error.stack);

    return new Response(
      JSON.stringify({
        error:
          'An error occurred while processing your request. Please try again later.',
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400,
      },
    );
  }
});
