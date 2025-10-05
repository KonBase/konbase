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
  const [securityCode, setSecurityCode] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [userRole, setUserRole] = useState<string | null>(null);
  const { toast } = useToast();
  const { session } = useAuth();

  // Check user role on component mount
  React.useEffect(() => {
    const checkUserRole = async () => {
      if (session?.user?.id) {
        const { data: profile } = await supabase
          .from('profiles')
          .select('role')
          .eq('id', session.user.id)
          .single();
        setUserRole(profile?.role || 'unknown');
      }
    };
    checkUserRole();
  }, [session]);

  const handleElevation = async () => {
    if (!securityCode.trim()) {
      toast({
        title: 'Security Code Required',
        description: 'Please enter the security code',
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

      console.log('Calling elevate-to-super-admin with:', {
        securityCode: securityCode ? 'Present' : 'Missing',
        hasToken: !!session?.access_token,
        sessionAAL: session?.aal,
        userRole: session?.user?.role,
        dbRole: profile?.role
      });

      // Call the Supabase edge function with proper authorization
      const { data, error } = await supabase.functions.invoke('elevate-to-super-admin', {
        body: { securityCode },
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
        description: 'You now have super admin privileges.',
        variant: "default",
      });
      
      setIsDialogOpen(false);
      
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
          disabled={userRole !== 'system_admin'}
        >
          <ShieldAlert className="mr-2 h-4 w-4" />
          Elevate to Super Admin
        </Button>
      </div>

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Super Admin Elevation</DialogTitle>
            <DialogDescription>
              This is a high-security operation. Please enter the security code: <strong>admin123</strong>
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Input
                id="securityCode"
                placeholder="Security Code"
                type="password"
                value={securityCode}
                onChange={(e) => setSecurityCode(e.target.value)}
                className="font-mono"
                autoComplete="off"
              />
            </div>
            <div className="flex items-center space-x-2 text-sm text-muted-foreground">
              <Lock className="h-4 w-4" />
              <span>This action will be logged and audited</span>
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
              disabled={isProcessing || !securityCode.trim()}
            >
              {isProcessing ? 'Processing...' : 'Confirm Elevation'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
