
import React, { useState } from 'react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { UserX, ShieldAlert, Shield, Eye, MoreVertical } from 'lucide-react';
import { useAuth } from '@/contexts/auth';
import { AssociationMember } from '@/hooks/useAssociationMembers';
import { UserRoleType } from '@/types/user';
import MemberProfileDialog from './MemberProfileDialog';
import RoleChangeDialog from './RoleChangeDialog';

export interface MemberListProps {
  members: AssociationMember[];
  onUpdateRole: (memberId: string, newRole: UserRoleType) => void;
  onRemoveMember: (memberId: string, memberName: string) => void;
  canManageRoles?: boolean;
  canViewProfiles?: boolean;
}

const MemberList: React.FC<MemberListProps> = ({ 
  members, 
  onUpdateRole, 
  onRemoveMember,
  canManageRoles = true,
  canViewProfiles = true
}) => {
  const { user } = useAuth();
  const [selectedMember, setSelectedMember] = useState<AssociationMember | null>(null);
  const [showProfileDialog, setShowProfileDialog] = useState(false);
  const [showRoleChangeDialog, setShowRoleChangeDialog] = useState(false);
  const [memberForRoleChange, setMemberForRoleChange] = useState<AssociationMember | null>(null);

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(part => part[0])
      .join('')
      .toUpperCase();
  };

  const handleViewProfile = (member: AssociationMember) => {
    setSelectedMember(member);
    setShowProfileDialog(true);
  };

  const handleChangeRole = (member: AssociationMember) => {
    setMemberForRoleChange(member);
    setShowRoleChangeDialog(true);
  };

  const handleRoleChange = async (newRole: UserRoleType) => {
    if (memberForRoleChange) {
      await onUpdateRole(memberForRoleChange.id, newRole);
      setShowRoleChangeDialog(false);
      setMemberForRoleChange(null);
    }
  };

  const getRoleBadgeVariant = (role: UserRoleType) => {
    switch (role) {
      case 'admin':
      case 'system_admin':
      case 'super_admin':
        return 'default';
      case 'manager':
        return 'secondary';
      case 'member':
        return 'outline';
      default:
        return 'outline';
    }
  };

  return (
    <>
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
        {members.map(member => {
          const profile = member.profile || { name: 'Unknown User', email: 'No email', profile_image: undefined };
          const memberName = profile.name || 'Unknown User';
          const memberEmail = profile.email || 'No email';
          const memberProfileImage = profile.profile_image;
          const isSelf = user?.id === member.user_id;
          
          return (
            <TableRow key={member.id}>
              <TableCell>
                <div className="flex items-center gap-2">
                  <Avatar>
                    <AvatarImage src={memberProfileImage || ''} alt={memberName} />
                    <AvatarFallback>{getInitials(memberName)}</AvatarFallback>
                  </Avatar>
                  <span>{memberName}</span>
                </div>
              </TableCell>
              <TableCell>{memberEmail}</TableCell>
              <TableCell>
                <div className="flex items-center gap-2">
                  <Badge variant={getRoleBadgeVariant(member.role)}>
                    {member.role.charAt(0).toUpperCase() + member.role.slice(1)}
                  </Badge>
                  {!isSelf && canManageRoles && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleChangeRole(member)}
                      className="h-6 w-6 p-0"
                    >
                      <Shield className="h-3 w-3" />
                    </Button>
                  )}
                </div>
              </TableCell>
              <TableCell>
                {new Date(member.created_at).toLocaleDateString()}
              </TableCell>
              <TableCell className="text-right">
                <div className="flex items-center gap-1 justify-end">
                  {canViewProfiles && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleViewProfile(member)}
                      className="h-8 w-8 p-0"
                      title="View Profile"
                    >
                      <Eye className="h-4 w-4" />
                    </Button>
                  )}
                  {!isSelf && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => onRemoveMember(member.id, memberName)}
                      className="h-8 w-8 p-0 text-destructive hover:text-destructive/90 hover:bg-destructive/10"
                      title="Remove Member"
                    >
                      <UserX className="h-4 w-4" />
                    </Button>
                  )}
                </div>
              </TableCell>
            </TableRow>
          );
        })}
      </TableBody>
    </Table>

    {/* Profile Dialog */}
    <MemberProfileDialog
      member={selectedMember}
      isOpen={showProfileDialog}
      onClose={() => setShowProfileDialog(false)}
      canManageRoles={canManageRoles}
    />

    {/* Role Change Dialog */}
    <RoleChangeDialog
      isOpen={showRoleChangeDialog}
      onClose={() => setShowRoleChangeDialog(false)}
      currentRole={memberForRoleChange?.role || 'member'}
      memberName={memberForRoleChange?.profile?.name || 'Unknown User'}
      onRoleChange={handleRoleChange}
    />
  </>
  );
};

export default MemberList;
