'use client';

import { useState } from 'react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/lib/supabase';
import { UserRoleType } from '@/types/user';
import { useAuth } from '@/contexts/auth'; // Corrected import path
import { useTypeSafeSupabase } from '@/hooks/useTypeSafeSupabase';
import { handleError } from '@/utils/debug';

interface UserRoleManagerProps {
  userId: string;
  currentRole: UserRoleType;
  onRoleUpdated?: () => void;
  associationContext?: boolean;
}

export function UserRoleManager({
  userId,
  currentRole,
  onRoleUpdated,
  associationContext = false,
}: UserRoleManagerProps) {
  const [role, setRole] = useState<UserRoleType>(currentRole);
  const [isUpdating, setIsUpdating] = useState(false);
  const { toast } = useToast();
  // Destructure necessary properties from useAuth
  const { user, hasPermission, isLoading, isAuthenticated } = useAuth();
  const { safeUpdate } = useTypeSafeSupabase();

  const updateUserRole = async (newRole: UserRoleType) => {
    if (newRole === currentRole) return;

    setIsUpdating(true);
    try {
      // Update the user's role
      if (associationContext) {
        // Update in association_members table
        const { error } = await safeUpdate(
          'association_members',
          { role: newRole },
          { column: 'user_id', value: userId },
        );

        if (error) throw error;
      } else {
        // Update in profiles table
        const { error } = await safeUpdate(
          'profiles',
          { role: newRole },
          { column: 'id', value: userId },
        );

        if (error) throw error;
      }

      // Create audit log entry
      await supabase.from('audit_logs').insert({
        action: 'update_role',
        entity: associationContext ? 'association_members' : 'profiles',
        entity_id: userId,
        user_id: user?.id, // Use optional chaining
        changes: `Changed role from ${currentRole} to ${newRole}`,
      } as any);

      // Send a notification to the user
      await supabase.from('notifications').insert({
        user_id: userId,
        title: 'Role Updated',
        message: `Your role has been updated to ${newRole} by an administrator.`,
        read: false,
      } as any);

      // Update the local state
      setRole(newRole);

      toast({
        title: 'Role Updated',
        description: `User role has been updated to ${newRole}`,
      });

      // Call the callback if provided
      if (onRoleUpdated) onRoleUpdated();
    } catch (error) {
      handleError(error, 'UserRoleManager.updateUserRole');
      toast({
        title: 'Error',
        description: 'Failed to update user role',
        variant: 'destructive',
      });
    } finally {
      setIsUpdating(false);
    }
  };

  // Define which roles the current user can assign
  const getAssignableRoles = (): UserRoleType[] => {
    // Wait until auth is loaded and user is authenticated before checking permissions
    if (isLoading || !isAuthenticated || !user) {
      // Return only the current role if auth isn't ready or user isn't logged in
      return [currentRole];
    }

    // Now safely call hasPermission as it should be available and correctly typed
    if (hasPermission('admin:all')) {
      return [
        'guest',
        'member',
        'manager',
        'admin',
        'system_admin',
        'super_admin',
      ];
    } else if (hasPermission('manage:users')) {
      return ['guest', 'member', 'manager', 'admin', 'system_admin'];
    } else if (hasPermission('manage:association')) {
      return ['guest', 'member', 'manager', 'admin'];
    } else {
      // Default permissions if none of the above match (e.g., manager role)
      // Consider if managers should be able to assign any roles or just view
      return ['guest', 'member', 'manager']; // Example: Managers can assign up to manager
    }
  };

  const assignableRoles = getAssignableRoles();

  // Display a loading skeleton or disabled state while auth is initializing
  if (isLoading) {
    return (
      <div className="w-[120px] sm:w-[140px] h-10 bg-muted rounded animate-pulse"></div>
    );
  }

  return (
    <div className="flex items-center">
      <Select
        value={role}
        onValueChange={(value) => updateUserRole(value as UserRoleType)}
        // Disable if updating, if the user is editing themselves, or if not authenticated
        disabled={isUpdating || userId === user?.id || !isAuthenticated}
      >
        <SelectTrigger className="w-[120px] sm:w-[140px]">
          <SelectValue placeholder="Select role" />
        </SelectTrigger>
        <SelectContent>
          {assignableRoles.map((assignableRole) => (
            <SelectItem
              key={assignableRole}
              value={assignableRole}
              className="capitalize"
            >
              {assignableRole.replace('_', ' ')}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}
