'use client';

import React, { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { useToast } from '@/components/ui/use-toast';

interface InviteCodeDialogProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  onAcceptInvitation: (code: string) => Promise<boolean>;
}

const InviteCodeDialog: React.FC<InviteCodeDialogProps> = ({
  isOpen,
  onOpenChange,
  onAcceptInvitation,
}) => {
  const [inviteCode, setInviteCode] = useState('');
  const [isProcessingCode, setIsProcessingCode] = useState(false);
  const { toast } = useToast();

  const handleAcceptInvitation = async () => {
    if (!inviteCode.trim()) {
      toast({
        title: 'Error',
        description: 'Please enter an invitation code',
        variant: 'destructive',
      });
      return;
    }

    setIsProcessingCode(true);
    try {
      const success = await onAcceptInvitation(inviteCode.trim());
      if (success) {
        setInviteCode('');
        onOpenChange(false);
      }
    } finally {
      setIsProcessingCode(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Join Association</DialogTitle>
          <DialogDescription>
            Enter the invitation code you received to join this association.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="invite-code">Invitation Code</Label>
            <Input
              id="invite-code"
              placeholder="Enter invitation code"
              value={inviteCode}
              onChange={(e) => setInviteCode(e.target.value)}
            />
          </div>
        </div>
        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => {
              onOpenChange(false);
              setInviteCode('');
            }}
            disabled={isProcessingCode}
          >
            Cancel
          </Button>
          <Button onClick={handleAcceptInvitation} disabled={isProcessingCode}>
            {isProcessingCode ? 'Processing...' : 'Join Association'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default InviteCodeDialog;
