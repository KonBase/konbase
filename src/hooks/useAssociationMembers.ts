import { useState, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import { useToast } from '@/hooks/use-toast';
import { UserRoleType } from '@/types/user';
import { handleError, logDebug } from '@/utils/debug';

export interface ProfileData {
  id: string;
  name: string;
  email: string;
  profile_image?: string;
}

export interface AssociationMember {
  id: string;
  user_id: string;
  association_id: string;
  role: UserRoleType;
  created_at: string;
  profile?: ProfileData;
}

/**
 * Hook to manage association members
 */
export const useAssociationMembers = (associationId: string) => {
  const [members, setMembers] = useState<AssociationMember[]>([]);
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  /**
   * Fetch all members of an association
   */
  const fetchMembers = useCallback(async () => {
    if (!associationId) return;
    
    setLoading(true);
    try {
      logDebug('Fetching association members', { associationId });
      
      // First get the association members
      const { data: membersData, error: membersError } = await supabase
        .from('association_members')
        .select('id, user_id, association_id, created_at') // Explicitly select existing columns
        .eq('association_id', associationId);
        
      if (membersError) throw membersError;
      
      if (!membersData || membersData.length === 0) {
        setMembers([]);
        return;
      }
      
      // Get the user profiles in a separate query
      const userIds = membersData.map(member => member.user_id);
      const { data: profilesData, error: profilesError } = await supabase
        .from('profiles')
        .select('id, name, email, profile_image')
        .in('id', userIds);
        
      if (profilesError) throw profilesError;
      
      // Map profiles to members
      const profileMap = new Map();
      if (profilesData) {
        profilesData.forEach(profile => {
          profileMap.set(profile.id, {
            id: profile.id,
            name: profile.name || '',
            email: profile.email || '',
            profile_image: profile.profile_image
          });
        });
      }
      
      // Combine the data
      const transformedMembers = membersData.map(member => {
        const profile = profileMap.get(member.user_id) || {
          id: member.user_id,
          name: 'Unknown User',
          email: 'No email',
          profile_image: undefined
        };
        
        return {
          id: member.id,
          user_id: member.user_id,
          association_id: member.association_id,
          role: member.role as UserRoleType,
          created_at: member.created_at,
          profile
        };
      });
      
      setMembers(transformedMembers);
    } catch (error) {
      handleError(error, 'useAssociationMembers.fetchMembers');
    } finally {
      setLoading(false);
    }
  }, [associationId]);

  /**
   * Update a member's role
   */
  const updateMemberRole = async (memberId: string, role: UserRoleType) => {
    try {
      logDebug('Updating member role', { memberId, role });
      
      // First, find the member to get their user_id
      const member = members.find(m => m.id === memberId);
      if (!member) {
        throw new Error('Member not found');
      }

      // Update the role in both association_members and profiles tables
      const { error: associationError } = await supabase
        .from('association_members')
        .update({ role })
        .eq('id', memberId);

      if (associationError) throw associationError;

      const { error: profileError } = await supabase
        .from('profiles')
        .update({ role })
        .eq('id', member.user_id);

      if (profileError) throw profileError;

      // Update local state
      setMembers(prev => 
        prev.map(m => 
          m.id === memberId ? { ...m, role } : m
        )
      );
      
      toast({
        title: 'Role updated',
        description: 'Member role has been updated successfully.',
      });
      
      return { success: true };
    } catch (error) {
      handleError(error, 'useAssociationMembers.updateMemberRole');
      
      toast({
        title: 'Failed to update role',
        description: 'There was an error updating the member role.',
        variant: 'destructive',
      });
      
      return { success: false, error };
    }
  };

  /**
   * Remove a member from the association
   */
  const removeMember = async (memberId: string) => {
    try {
      logDebug('Removing member', { memberId });
      
      const { error } = await supabase
        .from('association_members')
        .delete()
        .eq('id', memberId);
        
      if (error) throw error;
      
      // Update local state
      setMembers(prev => prev.filter(member => member.id !== memberId));
      
      toast({
        title: 'Member removed',
        description: 'Member has been removed from the association.',
      });
      
      return { success: true };
    } catch (error) {
      handleError(error, 'useAssociationMembers.removeMember');
      
      toast({
        title: 'Failed to remove member',
        description: 'There was an error removing the member.',
        variant: 'destructive',
      });
      
      return { success: false, error };
    }
  };

  return {
    members,
    loading,
    fetchMembers,
    updateMemberRole,
    removeMember
  };
};
