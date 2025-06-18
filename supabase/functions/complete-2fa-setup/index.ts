import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3';

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
    // Get the request body
    const { secret, recoveryKeys } = await req.json();

    if (
      !secret ||
      !recoveryKeys ||
      !Array.isArray(recoveryKeys) ||
      recoveryKeys.length === 0
    ) {
      throw new Error('Secret and recovery keys are required');
    }

    // Get the JWT from the authorization header
    const authHeader = req.headers.get('authorization') || '';
    const token = authHeader.replace('Bearer ', '');

    if (!token) {
      throw new Error('Authorization token is required');
    }

    // Initialize the Supabase client with the service role key to bypass RLS
    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
      {
        auth: {
          persistSession: false,
        },
      },
    );

    // Use the JWT to get the user ID
    const { data: userData, error: userError } =
      await supabaseAdmin.auth.getUser(token);

    if (userError || !userData) {
      throw new Error(userError?.message || 'Failed to get user data');
    }

    const userId = userData.user.id;

    // Check if the user already has 2FA enabled
    const { data: existing2FA, error: existingError } = await supabaseAdmin
      .from('user_2fa')
      .select('*')
      .eq('user_id', userId)
      .maybeSingle();

    if (existingError) {
      throw new Error(`Error checking existing 2FA: ${existingError.message}`);
    }

    // If 2FA is already set up for this user, update it, otherwise insert a new record
    let dbOperation;
    if (existing2FA) {
      dbOperation = supabaseAdmin
        .from('user_2fa')
        .update({
          totp_secret: secret,
          recovery_keys: recoveryKeys,
          used_recovery_keys: [],
          updated_at: new Date().toISOString(),
        })
        .eq('user_id', userId);
    } else {
      dbOperation = supabaseAdmin.from('user_2fa').insert({
        user_id: userId,
        totp_secret: secret,
        recovery_keys: recoveryKeys,
        used_recovery_keys: [],
      });
    }

    const { error: saveError } = await dbOperation;

    if (saveError) {
      throw new Error(`Error saving 2FA data: ${saveError.message}`);
    }

    // Update the user's profile to indicate 2FA is enabled
    const { error: profileError } = await supabaseAdmin
      .from('profiles')
      .update({ two_factor_enabled: true })
      .eq('id', userId);

    if (profileError) {
      throw new Error(`Error updating profile: ${profileError.message}`);
    }

    console.log('2FA setup completed successfully for user:', userId);

    return new Response(
      JSON.stringify({
        success: true,
        message: '2FA has been successfully enabled',
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      },
    );
  } catch (error) {
    console.error('Error completing 2FA setup:', error.message);

    return new Response(
      JSON.stringify({
        success: false,
        error: error.message,
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400,
      },
    );
  }
});
