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

    // Delete the 2FA entry for the user
    const { error: deleteError } = await supabaseAdmin
      .from('user_2fa')
      .delete()
      .eq('user_id', userId);

    if (deleteError) {
      throw new Error(`Error deleting 2FA data: ${deleteError.message}`);
    }

    // Update the user's profile to indicate 2FA is disabled
    const { error: profileError } = await supabaseAdmin
      .from('profiles')
      .update({ two_factor_enabled: false })
      .eq('id', userId);

    if (profileError) {
      throw new Error(`Error updating profile: ${profileError.message}`);
    }

    console.log('2FA disabled successfully for user:', userId);

    return new Response(
      JSON.stringify({
        success: true,
        message: '2FA has been successfully disabled',
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      },
    );
  } catch (error) {
    console.error('Error disabling 2FA:', error.message);

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
