import React, { useState } from 'react';
import { Button, ButtonProps } from '@/components/ui/button';
import { TicketPlus } from 'lucide-react';
import RedeemInvitationDialog from './RedeemInvitationDialog';

interface RedeemInvitationButtonProps extends ButtonProps {
  onRedeemed?: () => void;
  label?: string;
  showIcon?: boolean;
}

const RedeemInvitationButton: React.FC<RedeemInvitationButtonProps> = ({
  onRedeemed,
  label = 'Redeem Invitation Code',
  showIcon = true,
  ...props
}) => {
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  const handleRedeemed = () => {
    setIsDialogOpen(false);
    if (onRedeemed) onRedeemed();
  };

  return (
    <>
      <Button 
        onClick={() => setIsDialogOpen(true)}
        {...props}
      >
        {showIcon && <TicketPlus className="mr-2 h-4 w-4" />}
        {label}
      </Button>

      <RedeemInvitationDialog
        isOpen={isDialogOpen}
        onClose={() => setIsDialogOpen(false)}
        onRedeemed={handleRedeemed}
      />
    </>
  );
};

export default RedeemInvitationButton;
