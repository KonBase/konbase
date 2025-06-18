'use client';

import { useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useAssociationMembers } from '@/hooks/useAssociationMembers';
import MemberList from './MemberList';
import MemberLoadingState from './MemberLoadingState';
import { UserRoleType } from '@/types/user';
import InviteMemberDialog from './InviteMemberDialog';

interface AssociationMembersPageProps {
  associationId: string;
}

const AssociationMembersPage = ({
  associationId,
}: AssociationMembersPageProps) => {
  const { members, loading, fetchMembers, updateMemberRole, removeMember } =
    useAssociationMembers(associationId);

  useEffect(() => {
    fetchMembers();
  }, [fetchMembers]);

  const handleUpdateRole = async (memberId: string, role: UserRoleType) => {
    await updateMemberRole(memberId, role);
  };

  const handleRemoveMember = async (memberId: string, memberName: string) => {
    if (
      confirm(
        `Are you sure you want to remove ${memberName} from the association?`,
      )
    ) {
      await removeMember(memberId);
    }
  };

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="text-2xl">Association Members</CardTitle>
        <InviteMemberDialog onInviteSent={fetchMembers} />
      </CardHeader>
      <CardContent>
        {loading ? (
          <MemberLoadingState />
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

export default AssociationMembersPage;
