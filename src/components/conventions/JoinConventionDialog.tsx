import React, { useState } from 'react';
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogDescription,
  DialogFooter
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/lib/supabase';
import { Loader2 } from 'lucide-react';

interface JoinConventionDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void; // Called after successfully joining a convention
}

export const JoinConventionDialog: React.FC<JoinConventionDialogProps> = ({
  isOpen,
  onClose,
  onSuccess
}) => {
  const [inviteCode, setInviteCode] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  const handleJoinConvention = async () => {
    if (!inviteCode.trim()) {
      toast({
        title: 'Error',
        description: 'Please enter an invitation code',
        variant: 'destructive',
      });
      return;
    }

    setIsLoading(true);

    try {
      // Get current user
      const { data: { user }, error: userError } = await supabase.auth.getUser();
      if (userError) throw userError;
      if (!user) throw new Error('Not authenticated');

      // Find the invitation
      const { data: invitation, error: inviteError } = await supabase
        .from('convention_invitations')
        .select('*')
        .eq('code', inviteCode.trim())
        .maybeSingle();
      
      if (inviteError) throw inviteError;
      
      if (!invitation) {
        toast({
          title: 'Invalid Code',
          description: 'The invitation code is invalid or has expired',
          variant: 'destructive',
        });
        return;
      }
      
      // Check if the invitation is expired
      if (invitation.expires_at && new Date(invitation.expires_at) < new Date()) {
        toast({
          title: 'Expired Code',
          description: 'This invitation code has expired',
          variant: 'destructive',
        });
        return;
      }
      
      // Check if the invitation has uses remaining
      if (invitation.uses_remaining !== null && invitation.uses_remaining <= 0) {
        toast({
          title: 'Used Code',
          description: 'This invitation code has already been used',
          variant: 'destructive',
        });
        return;
      }
      
      // Check if user is already a member of this convention
      const { data: existingAccess, error: accessCheckError } = await supabase
        .from('convention_access')
        .select('id')
        .eq('convention_id', invitation.convention_id)
        .eq('user_id', user.id)
        .maybeSingle();
        
      if (accessCheckError) throw accessCheckError;
      
      if (existingAccess) {
        toast({
          title: 'Already a Member',
          description: 'You already have access to this convention',
          variant: 'destructive',
        });
        return;
      }
      
      // Add user to convention_access
      const { error: accessError } = await supabase
        .from('convention_access')
        .insert({
          convention_id: invitation.convention_id,
          user_id: user.id,
          role: invitation.role,
          invitation_code: invitation.code
        });
      
      if (accessError) throw accessError;
      
      // Decrement uses remaining if applicable
      if (invitation.uses_remaining !== null) {
        const { error: updateError } = await supabase
          .from('convention_invitations')
          .update({ uses_remaining: invitation.uses_remaining - 1 })
          .eq('id', invitation.id);
          
        if (updateError) console.error('Error updating invitation uses:', updateError);
      }
      
      toast({
        title: 'Success',
        description: 'You have joined the convention successfully',
      });
      
      onSuccess();
      handleClose();
      
    } catch (error: any) {
      console.error('Error joining convention:', error);
      toast({
        title: 'Error',
        description: error.message || 'An unknown error occurred',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleClose = () => {
    setInviteCode('');
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Join Convention</DialogTitle>
          <DialogDescription>
            Enter an invitation code to join a convention.
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="inviteCode" className="text-right">
              Invitation Code
            </Label>
            <Input
              id="inviteCode"
              placeholder="Enter code"
              className="col-span-3 font-mono"
              value={inviteCode}
              onChange={(e) => setInviteCode(e.target.value.toUpperCase())}
            />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={handleClose} disabled={isLoading}>
            Cancel
          </Button>
          <Button onClick={handleJoinConvention} disabled={isLoading}>
            {isLoading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Joining...
              </>
            ) : (
              'Join Convention'
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default JoinConventionDialog;
