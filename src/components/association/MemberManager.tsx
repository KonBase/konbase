'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { AssociationMember } from '@/hooks/useAssociationMembers';
import { UserRoleType } from '@/types/user';
import { UserRoundPlus } from 'lucide-react';
import MemberList from './MemberList';
import MemberLoadingState from './MemberLoadingState';
import MemberListMinimal from './MemberListMinimal';

interface MemberManagerProps {
  associationId: string;
  members: AssociationMember[];
  loading: boolean;
  onUpdateRole: (
    memberId: string,
    role: UserRoleType,
  ) => Promise<{ success: boolean; error?: any }>;
  onRemoveMember: (
    memberId: string,
  ) => Promise<{ success: boolean; error?: any }>;
  onInviteMember?: () => void;
  minimal?: boolean;
}

const MemberManager = ({
  members,
  loading,
  onUpdateRole,
  onRemoveMember,
  onInviteMember,
  minimal = false,
}: MemberManagerProps) => {
  const handleUpdateRole = async (memberId: string, role: UserRoleType) => {
    await onUpdateRole(memberId, role);
  };

  const handleRemoveMember = async (memberId: string, memberName: string) => {
    if (
      confirm(
        `Are you sure you want to remove ${memberName} from the association?`,
      )
    ) {
      await onRemoveMember(memberId);
    }
  };

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="text-2xl">Association Members</CardTitle>
        {onInviteMember && (
          <Button variant="outline" size="sm" onClick={onInviteMember}>
            <UserRoundPlus className="mr-2 h-4 w-4" />
            Invite Member
          </Button>
        )}
      </CardHeader>
      <CardContent>
        {loading ? (
          <MemberLoadingState />
        ) : minimal ? (
          <MemberListMinimal members={members} />
        ) : (
          <MemberList
            members={members}
            onUpdateRole={handleUpdateRole}
            onRemoveMember={handleRemoveMember}
          />
        )}
      </CardContent>
    </Card>
  );
};

export default MemberManager;
