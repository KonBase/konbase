
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

// CORS headers
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const ELEVATION_SECRET = Deno.env.get('ELEVATION_SECRET');

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

    // Get the request body
    const body = await req.json();
    console.log('Request body:', body);
    
    const { securityCode } = body;
    
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
    
    // Validate the security code
    if (!ELEVATION_SECRET) {
      console.error('ELEVATION_SECRET not configured');
      throw new Error('Elevation secret not configured');
    }
    
    if (!securityCode || securityCode !== ELEVATION_SECRET) {
      console.log(`Invalid security code attempt: ${securityCode}`);
      throw new Error('Invalid security code');
    }
    
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
    
    // Check if user is already a super_admin
    if (profile.role === 'super_admin') {
      return new Response(
        JSON.stringify({ 
          message: 'User is already a super admin',
          success: true 
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }
    
    // Check if user is system_admin - only system admins can be elevated
    if (profile.role !== 'system_admin') {
      throw new Error(`Only system administrators can be elevated to super admin. Current role: ${profile.role}`);
    }
    
    // Update user role to super_admin
    const { error: updateError } = await supabase
      .from('profiles')
      .update({ role: 'super_admin' })
      .eq('id', userData.user.id);
      
    if (updateError) {
      console.error('Error updating user role:', updateError);
      throw new Error(`Error updating user role: ${updateError.message}`);
    }
    
    console.log('User role updated to super_admin');
    
    // Log the elevation in audit_logs
    const { error: auditError } = await supabase.from('audit_logs').insert({
      action: 'elevate_to_super_admin',
      entity: 'profiles',
      entity_id: userData.user.id,
      user_id: userData.user.id,
      changes: { 
        previous_role: profile.role,
        new_role: 'super_admin',
        elevated_at: new Date().toISOString()
      }
    });
    
    if (auditError) {
      console.error('Error logging elevation:', auditError);
      // Don't throw here, as the elevation was successful
    }
    
    console.log('Elevation completed successfully');
    
    // Return success response
    return new Response(
      JSON.stringify({ 
        message: 'Successfully elevated to super admin',
        success: true
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Error processing request:', error);
    
    return new Response(
      JSON.stringify({ 
        message: error.message || 'An error occurred during the elevation process',
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
