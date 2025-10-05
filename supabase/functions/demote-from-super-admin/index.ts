import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

// CORS headers
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  // Handle CORS preflight request
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Create a Supabase client with the Admin key
    const supabaseUrl = Deno.env.get('SUPABASE_URL');
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
    
    if (!supabaseUrl || !supabaseServiceKey) {
      console.error('Supabase credentials not configured');
      throw new Error('Supabase credentials not configured');
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Get user from auth header
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      console.error('Authorization header is required');
      throw new Error('Authorization header is required');
    }
    
    // Extract the token from the Authorization header
    const token = authHeader.replace('Bearer ', '');
    console.log('Token received:', token ? 'Present' : 'Missing');
    
    // Verify the user with the token
    const { data: userData, error: userError } = await supabase.auth.getUser(token);
    if (userError || !userData.user) {
      console.error('Invalid authorization:', userError);
      throw new Error(`Invalid authorization: ${userError?.message || 'No user data'}`);
    }
    
    console.log('User verified:', userData.user.id);
    
    // Get user's current role
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', userData.user.id)
      .single();
      
    if (profileError) {
      console.error('Failed to fetch user profile:', profileError);
      throw new Error(`Failed to fetch user profile: ${profileError.message}`);
    }
    
    console.log('Current user role:', profile.role);
    
    // Check if user is currently a super_admin
    if (profile.role !== 'super_admin') {
      return new Response(
        JSON.stringify({ 
          message: 'User is not currently a super admin',
          success: true 
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }
    
    // Update user role back to system_admin
    const { error: updateError } = await supabase
      .from('profiles')
      .update({ role: 'system_admin' })
      .eq('id', userData.user.id);
      
    if (updateError) {
      console.error('Error updating user role:', updateError);
      throw new Error(`Error updating user role: ${updateError.message}`);
    }
    
    console.log('User role updated to system_admin');
    
    // Log the demotion in audit_logs
    const { error: auditError } = await supabase.from('audit_logs').insert({
      action: 'demote_from_super_admin',
      entity: 'profiles',
      entity_id: userData.user.id,
      user_id: userData.user.id,
      changes: { 
        previous_role: profile.role,
        new_role: 'system_admin',
        demoted_at: new Date().toISOString()
      }
    });
    
    if (auditError) {
      console.error('Error logging demotion:', auditError);
      // Don't throw here, as the demotion was successful
    }
    
    console.log('Demotion completed successfully');
    
    // Return success response
    return new Response(
      JSON.stringify({ 
        message: 'Successfully demoted from super admin',
        success: true
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Error processing request:', error);
    
    return new Response(
      JSON.stringify({ 
        message: error.message || 'An error occurred during the demotion process',
        success: false,
        error: error.message
      }),
      { 
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }
});
