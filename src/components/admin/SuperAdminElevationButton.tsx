'use client';

import { useState } from 'react';
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
  const { toast } = useToast();
  const { session } = useAuth();

  const handleElevation = async () => {
    if (!securityCode.trim()) {
      toast({
        title: 'Security Code Required',
        description: 'Please enter the security code',
        variant: 'destructive',
      });
      return;
    }

    setIsProcessing(true);
    try {
      // Call the Supabase edge function with proper authorization
      const { error } = await supabase.functions.invoke(
        'elevate-to-super-admin',
        {
          body: { securityCode },
          headers: {
            Authorization: `Bearer ${session?.access_token}`,
          },
        },
      );

      if (error) throw new Error(error.message);

      // If successful
      toast({
        title: 'Elevation Successful',
        description: 'You now have super admin privileges.',
        variant: 'default',
      });

      setIsDialogOpen(false);

      // Refresh the page to update permissions, but add a query param to show a success message
      window.location.href = '/admin?elevation=success';
    } catch (error: any) {
      console.error('Error during elevation:', error);
      toast({
        title: 'Elevation Failed',
        description: error.message || 'An unknown error occurred',
        variant: 'destructive',
      });
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <>
      <Button
        variant="destructive"
        onClick={() => setIsDialogOpen(true)}
        className="w-full sm:w-auto whitespace-nowrap"
      >
        <ShieldAlert className="mr-2 h-4 w-4" />
        Elevate to Super Admin
      </Button>

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Super Admin Elevation</DialogTitle>
            <DialogDescription>
              This is a high-security operation. Please enter the security code
              provided by your system administrator.
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
