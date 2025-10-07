import { useState } from 'react';
import React from 'react';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/lib/supabase';
import { Lock, ShieldAlert } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { useAuth } from '@/contexts/auth/useAuth';

export function SuperAdminElevationButton() {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [mfaCode, setMfaCode] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [userRole, setUserRole] = useState<string | null>(null);
  const [hasMFA, setHasMFA] = useState(false);
  const { toast } = useToast();
  const { session } = useAuth();

  // Check user role and MFA status on component mount
  React.useEffect(() => {
    const checkUserStatus = async () => {
      if (session?.user?.id) {
        // Check user role
        const { data: profile, error: profileError } = await supabase
          .from('profiles')
          .select('role')
          .eq('id', session.user.id)
          .single();
        console.log('User profile check:', { profile, profileError });
        setUserRole(profile?.role || 'unknown');
        
        // Check MFA status
        try {
          const { data: factors, error } = await supabase.auth.mfa.listFactors();
          console.log('MFA factors check:', { factors, error });
          if (!error && factors) {
            const verifiedTotpFactors = factors.totp?.filter(f => f.status === 'verified') || [];
            console.log('Verified TOTP factors:', verifiedTotpFactors);
            setHasMFA(verifiedTotpFactors.length > 0);
          } else {
            console.error('Error checking MFA factors:', error);
            setHasMFA(false);
          }
        } catch (error) {
          console.error('Exception during MFA check:', error);
          setHasMFA(false);
        }
      }
    };
    checkUserStatus();
  }, [session]);

  const handleElevation = async () => {
    if (!mfaCode.trim()) {
      toast({
        title: 'MFA Code Required',
        description: 'Please enter the 6-digit code from your authenticator app',
        variant: "destructive",
      });
      return;
    }

    if (!session?.access_token) {
      toast({
        title: 'Authentication Required',
        description: 'Please log in again to continue',
        variant: "destructive",
      });
      return;
    }

    if (!hasMFA) {
      toast({
        title: 'MFA Required',
        description: 'You must enable MFA before elevating to super admin',
        variant: "destructive",
      });
      return;
    }

    setIsProcessing(true);
    try {
      // First, let's check the user's actual role from the database
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', session?.user?.id)
        .single();

      console.log('User profile from database:', { profile, profileError });

      // Check if user has the correct role
      if (profileError) {
        throw new Error(`Failed to fetch user profile: ${profileError.message}`);
      }

      if (!profile || profile.role !== 'system_admin') {
        throw new Error(`Only system administrators can be elevated to super admin. Current role: ${profile?.role || 'unknown'}`);
      }

      // Perform MFA verification client-side before calling the Edge Function
      console.log('Performing MFA verification...');
      
      // Get user's MFA factors
      const { data: factors, error: factorsError } = await supabase.auth.mfa.listFactors();
      if (factorsError) {
        throw new Error(`Failed to fetch MFA factors: ${factorsError.message}`);
      }

      const verifiedTotpFactors = factors.totp?.filter(f => f.status === 'verified') || [];
      if (verifiedTotpFactors.length === 0) {
        throw new Error('No verified TOTP factors found');
      }

      const factorId = verifiedTotpFactors[0].id;
      
      // Create a challenge
      const { data: challengeData, error: challengeError } = await supabase.auth.mfa.challenge({ factorId });
      if (challengeError) {
        throw new Error(`Failed to create MFA challenge: ${challengeError.message}`);
      }

      const challengeId = challengeData.id;
      
      // Verify the MFA code
      const { data: verifyData, error: verifyError } = await supabase.auth.mfa.verify({
        factorId,
        challengeId,
        code: mfaCode
      });

      if (verifyError) {
        throw new Error(`MFA verification failed: ${verifyError.message}`);
      }

      console.log('MFA verification successful, proceeding with elevation...');

      console.log('Calling elevate-to-super-admin with:', {
        hasToken: !!session?.access_token,
        sessionAAL: session?.aal,
        userRole: session?.user?.role,
        dbRole: profile?.role,
        tokenLength: session?.access_token?.length || 0,
        hasMFA: hasMFA,
        mfaVerified: true
      });

      // Call the Supabase edge function with proper authorization
      // No need to send mfaCode since we've already verified it client-side
      const { data, error } = await supabase.functions.invoke('elevate-to-super-admin', {
        body: {},
        headers: {
          Authorization: `Bearer ${session.access_token}`,
        },
      });

      console.log('Edge function response:', { data, error });

      if (error) {
        console.error('Edge function error:', error);
        
        // Try to extract the actual error message from the response
        let errorMessage = 'Edge function returned an error';
        
        if (error.message) {
          errorMessage = error.message;
        }
        
        // If it's a FunctionsHttpError, try to get the response body
        if (error.name === 'FunctionsHttpError' && error.context) {
          try {
            const responseBody = await error.context.response?.text();
            if (responseBody) {
              const parsedBody = JSON.parse(responseBody);
              errorMessage = parsedBody.message || parsedBody.error || errorMessage;
            }
          } catch (parseError) {
            console.error('Error parsing error response:', parseError);
          }
        }
        
        throw new Error(errorMessage);
      }

      if (data && !data.success) {
        throw new Error(data.message || 'Elevation failed');
      }

      // If successful
      toast({
        title: 'Elevation Successful',
        description: 'You now have super admin privileges using MFA verification.',
        variant: "default",
      });
      
      setIsDialogOpen(false);
      setMfaCode(''); // Clear the MFA code
      
      // Refresh the page to update permissions, but add a query param to show a success message
      window.location.href = '/admin?elevation=success';
    } catch (error: any) {
      console.error('Error during elevation:', error);
      toast({
        title: 'Elevation Failed',
        description: error.message || 'An unknown error occurred',
        variant: "destructive",
      });
    } finally {
      setIsProcessing(false);
    }
  };

  const fixUserRole = async () => {
    if (!session?.user?.id) return;
    
    try {
      const { error } = await supabase
        .from('profiles')
        .update({ role: 'system_admin' })
        .eq('id', session.user.id);
      
      if (error) throw error;
      
      toast({
        title: 'Role Updated',
        description: 'Your role has been updated to system_admin',
      });
      
      // Refresh the role
      const { data: profile } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', session.user.id)
        .single();
      setUserRole(profile?.role || 'unknown');
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message,
        variant: 'destructive',
      });
    }
  };

  return (
    <>
      <div className="space-y-2">
        <div className="text-sm text-muted-foreground">
          Current Role: <span className="font-mono">{userRole || 'loading...'}</span>
        </div>
        
        <div className="text-sm text-muted-foreground">
          MFA Status: <span className={`font-mono ${hasMFA ? 'text-green-600' : 'text-red-600'}`}>
            {hasMFA ? 'Enabled' : 'Not Enabled'}
          </span>
        </div>
        
        <div className="text-xs text-muted-foreground">
          Debug: userRole={userRole}, hasMFA={hasMFA ? 'true' : 'false'}, 
          canElevate={userRole === 'system_admin' && hasMFA ? 'true' : 'false'}
        </div>
        
        {userRole && userRole !== 'system_admin' && (
          <Button 
            variant="outline" 
            size="sm" 
            onClick={fixUserRole}
            className="w-full sm:w-auto"
          >
            Fix Role to system_admin
          </Button>
        )}
        
        <Button 
          variant="destructive" 
          onClick={() => setIsDialogOpen(true)} 
          className="w-full sm:w-auto whitespace-nowrap"
          disabled={userRole !== 'system_admin' || !hasMFA}
        >
          <ShieldAlert className="mr-2 h-4 w-4" />
          Elevate to Super Admin
        </Button>
        
        {!hasMFA && (
          <div className="text-sm text-amber-600">
            ⚠️ You must enable MFA before elevating to super admin
          </div>
        )}
      </div>

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Super Admin Elevation</DialogTitle>
            <DialogDescription>
              This is a high-security operation. Please enter the 6-digit code from your authenticator app.
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Input
                id="mfaCode"
                placeholder="123456"
                type="text"
                value={mfaCode}
                onChange={(e) => setMfaCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                className="font-mono text-center text-lg tracking-widest"
                autoComplete="off"
                maxLength={6}
              />
            </div>
            <div className="flex items-center space-x-2 text-sm text-muted-foreground">
              <Lock className="h-4 w-4" />
              <span>This action will be logged and audited using MFA verification</span>
            </div>
          </div>
          
          <DialogFooter>
            <Button 
              variant="outline" 
              onClick={() => setIsDialogOpen(false)}
              disabled={isProcessing}
            >
              Cancel
            </Button>
            <Button 
              variant="destructive" 
              onClick={handleElevation} 
              disabled={isProcessing || !mfaCode.trim() || mfaCode.length !== 6}
            >
              {isProcessing ? 'Processing...' : 'Confirm Elevation'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
