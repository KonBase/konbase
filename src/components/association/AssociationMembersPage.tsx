import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Users, Settings, UserPlus } from 'lucide-react';
import { useAssociationMembers } from '@/hooks/useAssociationMembers';
import { useAuth } from '@/contexts/auth';
import MemberList from './MemberList';
import MemberLoadingState from './MemberLoadingState';
import MemberSearchAndFilter from './MemberSearchAndFilter';
import BulkMemberActions from './BulkMemberActions';
import { UserRoleType } from '@/types/user';
import InviteMemberDialog from './InviteMemberDialog';

interface AssociationMembersPageProps {
  associationId: string;
}

const AssociationMembersPage = ({ associationId }: AssociationMembersPageProps) => {
  const { members, loading, fetchMembers, updateMemberRole, removeMember } = useAssociationMembers(associationId);
  const { user } = useAuth();
  
  const [filteredMembers, setFilteredMembers] = useState(members);
  const [selectedTab, setSelectedTab] = useState('members');

  useEffect(() => {
    fetchMembers();
  }, [fetchMembers]);

  useEffect(() => {
    setFilteredMembers(members);
  }, [members]);

  // Check if current user can manage roles
  const canManageRoles = () => {
    if (!user) return false;
    const currentMember = members.find(m => m.user_id === user.id);
    return currentMember?.role === 'admin' || currentMember?.role === 'system_admin' || currentMember?.role === 'super_admin';
  };

  // Check if current user can view profiles
  const canViewProfiles = () => {
    if (!user) return false;
    const currentMember = members.find(m => m.user_id === user.id);
    return ['admin', 'manager', 'system_admin', 'super_admin'].includes(currentMember?.role || '');
  };

  const handleUpdateRole = async (memberId: string, role: UserRoleType) => {
    await updateMemberRole(memberId, role);
  };

  const handleRemoveMember = async (memberId: string, memberName: string) => {
    if (confirm(`Are you sure you want to remove ${memberName} from the association?`)) {
      await removeMember(memberId);
    }
  };

  const handleBulkRoleChange = async (memberIds: string[], newRole: UserRoleType) => {
    try {
      const promises = memberIds.map(id => updateMemberRole(id, newRole));
      await Promise.all(promises);
      fetchMembers(); // Refresh the list
    } catch (error: any) {
      throw error;
    }
  };

  const handleBulkRemove = async (memberIds: string[]) => {
    try {
      const promises = memberIds.map(id => removeMember(id));
      await Promise.all(promises);
      fetchMembers(); // Refresh the list
    } catch (error: any) {
      throw error;
    }
  };

  const getRoleStats = () => {
    const stats = {
      admin: 0,
      manager: 0,
      member: 0,
      guest: 0,
      total: members.length
    };

    members.forEach(member => {
      stats[member.role as keyof typeof stats]++;
    });

    return stats;
  };

  const roleStats = getRoleStats();

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Association Members</h1>
          <p className="text-muted-foreground">
            Manage your association's members, roles, and permissions
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant="outline" className="text-sm">
            {members.length} members
          </Badge>
          <InviteMemberDialog onInviteSent={fetchMembers} />
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <Users className="h-4 w-4 text-muted-foreground" />
              <div>
                <div className="text-2xl font-bold">{roleStats.total}</div>
                <div className="text-xs text-muted-foreground">Total Members</div>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <Badge variant="default" className="text-xs">Admin</Badge>
              <div>
                <div className="text-2xl font-bold">{roleStats.admin}</div>
                <div className="text-xs text-muted-foreground">Administrators</div>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <Badge variant="secondary" className="text-xs">Manager</Badge>
              <div>
                <div className="text-2xl font-bold">{roleStats.manager}</div>
                <div className="text-xs text-muted-foreground">Managers</div>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <Badge variant="outline" className="text-xs">Member</Badge>
              <div>
                <div className="text-2xl font-bold">{roleStats.member}</div>
                <div className="text-xs text-muted-foreground">Members</div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main Content */}
      <Tabs value={selectedTab} onValueChange={setSelectedTab} className="space-y-4">
        <TabsList>
          <TabsTrigger value="members" className="flex items-center gap-2">
            <Users className="h-4 w-4" />
            Members
          </TabsTrigger>
          <TabsTrigger value="bulk" className="flex items-center gap-2">
            <Settings className="h-4 w-4" />
            Bulk Actions
          </TabsTrigger>
        </TabsList>

        <TabsContent value="members" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="h-5 w-5" />
                Member Management
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Search and Filter */}
              <MemberSearchAndFilter
                members={members}
                onFilteredMembersChange={setFilteredMembers}
              />

              {/* Member List */}
              {loading ? (
                <MemberLoadingState />
              ) : (
                <MemberList
                  members={filteredMembers}
                  onUpdateRole={handleUpdateRole}
                  onRemoveMember={handleRemoveMember}
                  canManageRoles={canManageRoles()}
                  canViewProfiles={canViewProfiles()}
                />
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="bulk" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Settings className="h-5 w-5" />
                Bulk Member Actions
              </CardTitle>
            </CardHeader>
            <CardContent>
              {loading ? (
                <MemberLoadingState />
              ) : (
                <BulkMemberActions
                  members={members}
                  onBulkRoleChange={canManageRoles() ? handleBulkRoleChange : undefined}
                  onBulkRemove={canManageRoles() ? handleBulkRemove : undefined}
                  disabled={!canManageRoles()}
                />
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default AssociationMembersPage;
