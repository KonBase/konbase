
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

// CORS headers
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// No longer using ELEVATION_SECRET - using MFA verification instead

serve(async (req) => {
  console.log('=== Edge Function Request Debug ===');
  console.log('Method:', req.method);
  console.log('URL:', req.url);
  console.log('Headers:', Object.fromEntries(req.headers.entries()));
  
  // Handle CORS preflight request
  if (req.method === 'OPTIONS') {
    console.log('Handling CORS preflight request');
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
    let body;
    try {
      body = await req.json();
      console.log('Request body:', body);
    } catch (parseError) {
      console.error('Error parsing request body:', parseError);
      throw new Error('Invalid request body format');
    }
    
    const { mfaCode } = body;
    
    // Get user from auth header
    const authHeader = req.headers.get('Authorization');
    console.log('Authorization header:', authHeader ? 'Present' : 'Missing');
    
    if (!authHeader) {
      console.error('Authorization header is required');
      throw new Error('Authorization header is required');
    }
    
    // Extract the token from the Authorization header
    const token = authHeader.replace('Bearer ', '');
    console.log('Token received:', token ? 'Present' : 'Missing');
    
    if (!token) {
      console.error('No token found in Authorization header');
      throw new Error('No token found in Authorization header');
    }
    
    // Verify the user with the token
    const { data: userData, error: userError } = await supabase.auth.getUser(token);
    if (userError || !userData.user) {
      console.error('Invalid authorization:', userError);
      throw new Error(`Invalid authorization: ${userError?.message || 'No user data'}`);
    }
    
    console.log('User verified:', userData.user.id);
    
    // Validate MFA code
    if (!mfaCode) {
      console.error('MFA code is required');
      throw new Error('MFA code is required for super admin elevation');
    }
    
    console.log('MFA code received:', mfaCode ? 'Present' : 'Missing');
    
    // Get user's MFA factors
    const { data: factors, error: factorsError } = await supabase.auth.mfa.listFactors();
    if (factorsError) {
      console.error('Failed to fetch MFA factors:', factorsError);
      throw new Error(`Failed to fetch MFA factors: ${factorsError.message}`);
    }
    
    // Check if user has verified TOTP factors
    const verifiedTotpFactors = factors.totp?.filter(f => f.status === 'verified') || [];
    if (verifiedTotpFactors.length === 0) {
      console.error('User has no verified TOTP factors');
      throw new Error('You must have MFA enabled to elevate to super admin');
    }
    
    console.log('User has verified TOTP factors:', verifiedTotpFactors.length);
    
    // Use the first verified TOTP factor for verification
    const factorId = verifiedTotpFactors[0].id;
    
    // Create a challenge for MFA verification
    const { data: challengeData, error: challengeError } = await supabase.auth.mfa.challenge({ factorId });
    if (challengeError) {
      console.error('Failed to create MFA challenge:', challengeError);
      throw new Error(`Failed to create MFA challenge: ${challengeError.message}`);
    }
    
    const challengeId = challengeData.id;
    console.log('MFA challenge created:', challengeId);
    
    // Verify the MFA code
    const { data: verifyData, error: verifyError } = await supabase.auth.mfa.verify({
      factorId,
      challengeId,
      code: mfaCode
    });
    
    if (verifyError) {
      console.error('MFA verification failed:', verifyError);
      throw new Error(`MFA verification failed: ${verifyError.message}`);
    }
    
    console.log('MFA verification successful');
    
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
        elevated_at: new Date().toISOString(),
        verification_method: 'mfa_totp',
        factor_id: factorId
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
        message: 'Successfully elevated to super admin using MFA verification',
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
