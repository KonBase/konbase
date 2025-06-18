'use client';

import React from 'react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { UserX, ShieldAlert, Shield } from 'lucide-react';
import { useAuth } from '@/contexts/auth';
import { AssociationMember } from '@/hooks/useAssociationMembers';
import { UserRoleType } from '@/types/user';

export interface MemberListProps {
  members: AssociationMember[];
  onUpdateRole: (memberId: string, newRole: UserRoleType) => void;
  onRemoveMember: (memberId: string, memberName: string) => void;
}

const MemberList: React.FC<MemberListProps> = ({
  members,
  onUpdateRole,
  onRemoveMember,
}) => {
  const { user } = useAuth();

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map((part) => part[0])
      .join('')
      .toUpperCase();
  };

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Member</TableHead>
          <TableHead>Email</TableHead>
          <TableHead>Role</TableHead>
          <TableHead>Joined</TableHead>
          <TableHead className="text-right">Actions</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {members.map((member) => {
          const profile = member.profile || {
            name: 'Unknown User',
            email: 'No email',
            profile_image: undefined,
          };
          const memberName = profile.name || 'Unknown User';
          const memberEmail = profile.email || 'No email';
          const memberProfileImage = profile.profile_image;
          const isSelf = user?.id === member.user_id;

          return (
            <TableRow key={member.id}>
              <TableCell>
                <div className="flex items-center gap-2">
                  <Avatar>
                    <AvatarImage
                      src={memberProfileImage || ''}
                      alt={memberName}
                    />
                    <AvatarFallback>{getInitials(memberName)}</AvatarFallback>
                  </Avatar>
                  <span>{memberName}</span>
                </div>
              </TableCell>
              <TableCell>{memberEmail}</TableCell>
              <TableCell>
                {isSelf ? (
                  <div className="flex items-center gap-1">
                    <span className="capitalize">{member.role}</span>
                    {member.role === 'admin' || member.role === 'manager' ? (
                      <ShieldAlert className="h-4 w-4 text-primary" />
                    ) : (
                      <Shield className="h-4 w-4 text-muted-foreground" />
                    )}
                  </div>
                ) : (
                  <Select
                    value={member.role}
                    onValueChange={(value) =>
                      onUpdateRole(member.id, value as UserRoleType)
                    }
                  >
                    <SelectTrigger className="w-32">
                      <SelectValue placeholder="Select role" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="member">Member</SelectItem>
                      <SelectItem value="manager">Manager</SelectItem>
                      <SelectItem value="admin">Admin</SelectItem>
                    </SelectContent>
                  </Select>
                )}
              </TableCell>
              <TableCell>
                {new Date(member.created_at).toLocaleDateString()}
              </TableCell>
              <TableCell className="text-right">
                {!isSelf && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => onRemoveMember(member.id, memberName)}
                    className="text-destructive hover:text-destructive/90 hover:bg-destructive/10"
                  >
                    <UserX className="h-4 w-4" />
                  </Button>
                )}
              </TableCell>
            </TableRow>
          );
        })}
      </TableBody>
    </Table>
  );
};

export default MemberList;
