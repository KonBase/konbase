'use client';

import React from 'react';
import Link from 'next/link';
import { useRouter } from '@/lib/navigation';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { User, Settings, Shield, TicketPlus } from 'lucide-react';
import LogoutButton from '@/components/auth/LogoutButton';
import RedeemInvitationButton from '@/components/conventions/RedeemInvitationButton';

interface UserMenuProps {
  userName: string;
  userEmail: string;
  userImage?: string;
  isAdmin?: boolean;
  variant?: 'default' | 'ghost' | 'outline';
}

const UserMenu: React.FC<UserMenuProps> = ({
  userName,
  userEmail,
  userImage,
  isAdmin = false,
  variant = 'ghost',
}) => {
  const router = useRouter();
  const userInitial =
    userName && userName.length > 0 ? userName.charAt(0).toUpperCase() : 'U';

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant={variant}
          size="icon"
          className="relative h-8 w-8 rounded-full"
        >
          <Avatar className="h-8 w-8">
            {userImage && <AvatarImage src={userImage} alt={userName} />}
            <AvatarFallback>{userInitial}</AvatarFallback>
          </Avatar>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-56">
        <DropdownMenuLabel className="font-normal">
          <div className="flex flex-col space-y-1">
            <p className="text-sm font-medium leading-none">{userName}</p>
            <p className="text-xs leading-none text-muted-foreground">
              {userEmail}
            </p>
          </div>
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuItem asChild>
          <Link href="/profile">Profile</Link>
        </DropdownMenuItem>
        <DropdownMenuItem asChild>
          <Link href="/redeem-code">
            <TicketPlus className="mr-2 h-4 w-4" />
            <span>Invite</span>
          </Link>
        </DropdownMenuItem>
        <DropdownMenuItem asChild>
          <Link href="/settings">Settings</Link>
        </DropdownMenuItem>
        {isAdmin && (
          <DropdownMenuItem asChild>
            <Link href="/admin">
              <Shield className="mr-2 h-4 w-4" />
              <span>Admin</span>
            </Link>
          </DropdownMenuItem>
        )}
        <DropdownMenuSeparator />
        <DropdownMenuItem>
          <LogoutButton variant="ghost" size="sm" />
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
};

export default UserMenu;
