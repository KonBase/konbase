'use client';

import React from 'react';
import { Button } from '@/components/ui/button';
import { Menu } from 'lucide-react';
import { Sheet, SheetTrigger } from '@/components/ui/sheet';

interface MobileMenuButtonProps {
  onOpenChange: (open: boolean) => void;
  open: boolean;
}

const MobileMenuButton: React.FC<MobileMenuButtonProps> = ({
  onOpenChange,
  open,
}) => {
  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetTrigger asChild>
        <Button variant="ghost" size="icon" className="md:hidden">
          <Menu className="h-5 w-5" />
          <span className="sr-only">Toggle menu</span>
        </Button>
      </SheetTrigger>
    </Sheet>
  );
};

export default MobileMenuButton;
