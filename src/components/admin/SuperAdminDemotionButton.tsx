import { useState } from 'react';
import React from 'react';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/lib/supabase';
import { ShieldX, AlertTriangle } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { useAuth } from '@/contexts/auth/useAuth';

/**
 * SuperAdminDemotionButton component
 * 
 * Provides functionality to demote a super admin user back to system administrator role.
 * This component:
 * - Only shows for users with 'super_admin' role
 * - Calls the 'demote-from-super-admin' Supabase Edge Function
 * - Logs the demotion action in audit_logs
 * - Redirects to admin panel with success message
 * - Automatically demotes super admins on logout (handled in AuthProvider)
 */
export function SuperAdminDemotionButton() {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
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

  const handleDemotion = async () => {
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

      if (!profile || profile.role !== 'super_admin') {
        throw new Error(`Only super administrators can be demoted. Current role: ${profile?.role || 'unknown'}`);
      }

      console.log('Calling demote-from-super-admin with:', {
        hasToken: !!session?.access_token,
        sessionAAL: session?.aal,
        userRole: session?.user?.role,
        dbRole: profile?.role
      });

      // Call the Supabase edge function with proper authorization
      const { data, error } = await supabase.functions.invoke('demote-from-super-admin', {
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
        throw new Error(data.message || 'Demotion failed');
      }

      // If successful
      toast({
        title: 'Demotion Successful',
        description: 'You have been demoted from super admin privileges.',
        variant: "default",
      });
      
      setIsDialogOpen(false);
      
      // Refresh the page to update permissions, but add a query param to show a success message
      window.location.href = '/admin?demotion=success';
    } catch (error: any) {
      console.error('Error during demotion:', error);
      toast({
        title: 'Demotion Failed',
        description: error.message || 'An unknown error occurred',
        variant: "destructive",
      });
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <>
      <Button 
        variant="outline" 
        onClick={() => setIsDialogOpen(true)} 
        className="w-full sm:w-auto whitespace-nowrap"
        disabled={userRole !== 'super_admin'}
      >
        <ShieldX className="mr-2 h-4 w-4" />
        Demote from Super Admin
      </Button>

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Super Admin Demotion</DialogTitle>
            <DialogDescription>
              This will remove your super admin privileges and return you to system administrator role.
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4 py-4">
            <div className="flex items-center space-x-2 text-sm text-amber-600">
              <AlertTriangle className="h-4 w-4" />
              <span>This action will be logged and audited</span>
            </div>
            <div className="text-sm text-muted-foreground">
              You will lose access to super admin features like system settings, audit logs, and module management.
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
              onClick={handleDemotion} 
              disabled={isProcessing}
            >
              {isProcessing ? 'Processing...' : 'Confirm Demotion'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
