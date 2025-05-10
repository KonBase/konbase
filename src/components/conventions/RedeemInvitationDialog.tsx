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
import { Loader2, CheckCircle2, XCircle } from 'lucide-react';

interface RedeemInvitationDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onRedeemed: () => void;
}

export const RedeemInvitationDialog: React.FC<RedeemInvitationDialogProps> = ({
  isOpen,
  onClose,
  onRedeemed
}) => {
  const [invitationCode, setInvitationCode] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [redeemStatus, setRedeemStatus] = useState<'idle' | 'success' | 'error'>('idle');
  const [statusMessage, setStatusMessage] = useState('');
  const { toast } = useToast();

  const handleRedeemCode = async () => {
    if (!invitationCode || invitationCode.length < 6) {
      toast({
        title: 'Invalid Code',
        description: 'Please enter a valid invitation code.',
        variant: 'destructive',
      });
      return;
    }

    setIsLoading(true);
    setRedeemStatus('idle');
    setStatusMessage('');

    try {
      // Get the current user's ID
      const { data: { user }, error: userError } = await supabase.auth.getUser();
      if (userError) throw userError;
      if (!user) throw new Error('Not authenticated');

      // First, check if the invitation code exists and is valid
      const { data: invitation, error: inviteError } = await supabase
        .from('convention_invitations')
        .select('id, convention_id, code, role, expires_at, uses_remaining')
        .eq('code', invitationCode.trim())
        .gt('uses_remaining', 0)
        .gt('expires_at', new Date().toISOString())
        .maybeSingle();

      if (inviteError) throw inviteError;

      if (!invitation) {
        setRedeemStatus('error');
        setStatusMessage('Invalid or expired invitation code.');
        return;
      }

      // Check if user is already in the convention
      const { data: existingAccess, error: checkError } = await supabase
        .from('convention_access')
        .select('id')
        .eq('convention_id', invitation.convention_id)
        .eq('user_id', user.id)
        .maybeSingle();
        
      if (checkError) throw checkError;
      
      if (existingAccess) {
        setRedeemStatus('error');
        setStatusMessage('You already have access to this convention.');
        return;
      }

      // Add the user to convention attendees
      const { error: addError } = await supabase
        .from('convention_access')
        .insert({
          convention_id: invitation.convention_id,
          user_id: user.id,
          role: invitation.role,
          invitation_code: invitation.code // Track which code was used
        });

      if (addError) throw addError;

      // Decrement uses remaining for the invitation
      const { error: updateError } = await supabase
        .from('convention_invitations')
        .update({
          uses_remaining: invitation.uses_remaining - 1
        })
        .eq('id', invitation.id);

      if (updateError) throw updateError;      // Get convention details for the success message
      const { data: convention, error: conventionError } = await supabase
        .from('conventions')
        .select('id, name, association_id')
        .eq('id', invitation.convention_id)
        .single();

      if (conventionError) throw conventionError;
      
      // Get association details for complete context
      const { data: association, error: associationError } = await supabase
        .from('associations')
        .select('name')
        .eq('id', convention.association_id)
        .single();
      
      if (associationError) throw associationError;

      // Log to convention logs
      await supabase.from('convention_logs').insert({
        convention_id: invitation.convention_id,
        user_id: user.id,
        action: 'Redeemed Invitation',
        details: { invitation_code: invitation.code }
      });      setRedeemStatus('success');
      setStatusMessage(`You have successfully joined "${convention.name}" as ${invitation.role}.`);

      toast({
        title: 'Invitation Redeemed',
        description: `You have been added to "${convention.name}" by ${association.name}.`,
      });

      // Notify parent component after a brief delay to show success state
      setTimeout(() => {
        onRedeemed();
        resetState();
        onClose();
      }, 2000);

    } catch (error: any) {
      console.error('Error redeeming invitation:', error);
      setRedeemStatus('error');
      setStatusMessage(error.message || 'An unknown error occurred.');
      toast({
        title: 'Error',
        description: error.message || 'Could not redeem the invitation code.',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const resetState = () => {
    setInvitationCode('');
    setRedeemStatus('idle');
    setStatusMessage('');
    setIsLoading(false);
  };

  const handleClose = () => {
    resetState();
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Redeem Invitation Code</DialogTitle>
          <DialogDescription>
            Enter your invitation code to join a convention.
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-4 py-4">
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="invitationCode" className="text-right">
              Code
            </Label>
            <Input
              id="invitationCode"
              placeholder="Enter invitation code"
              className="col-span-3"
              value={invitationCode}
              onChange={(e) => setInvitationCode(e.target.value)}
              disabled={isLoading || redeemStatus !== 'idle'}
            />
          </div>

          {redeemStatus === 'success' && (
            <div className="flex items-center gap-2 p-3 bg-green-50 border border-green-300 rounded-md text-green-800 dark:bg-green-900 dark:border-green-800 dark:text-green-200">
              <CheckCircle2 className="h-5 w-5" />
              <span>{statusMessage}</span>
            </div>
          )}

          {redeemStatus === 'error' && (
            <div className="flex items-center gap-2 p-3 bg-red-50 border border-red-300 rounded-md text-red-800 dark:bg-red-900 dark:border-red-800 dark:text-red-200">
              <XCircle className="h-5 w-5" />
              <span>{statusMessage}</span>
            </div>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={handleClose} disabled={isLoading}>
            Cancel
          </Button>
          <Button 
            onClick={handleRedeemCode}
            disabled={isLoading || !invitationCode || redeemStatus === 'success'}
          >
            {isLoading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Redeeming...
              </>
            ) : (
              'Redeem Code'
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default RedeemInvitationDialog;
