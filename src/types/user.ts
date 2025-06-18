import { User as SupabaseUser } from '@supabase/supabase-js';

// Role definitions with hierarchy and permissions
export type UserRoleType =
  | 'super_admin'
  | 'system_admin'
  | 'admin'
  | 'manager'
  | 'member'
  | 'guest';

export interface RoleDefinition {
  level: number;
  name: string;
  description: string;
  requires2FA: boolean;
  permissions: string[];
}

export const USER_ROLES: Record<UserRoleType, RoleDefinition> = {
  super_admin: {
    level: 100,
    name: 'Super Admin',
    description:
      'Complete system access with ability to manage all associations',
    requires2FA: true,
    permissions: [
      'admin:all',
      'manage:users',
      'manage:associations',
      'manage:billing',
      'manage:system',
    ],
  },
  system_admin: {
    level: 90,
    name: 'System Admin',
    description: 'Administrative access with limited access to system settings',
    requires2FA: true,
    permissions: ['manage:users', 'manage:associations', 'manage:billing'],
  },
  admin: {
    level: 80,
    name: 'Admin',
    description: 'Administrative access to manage association and users',
    requires2FA: false,
    permissions: [
      'manage:users',
      'manage:association',
      'manage:inventory',
      'manage:conventions',
    ],
  },
  manager: {
    level: 60,
    name: 'Manager',
    description: 'Ability to manage inventory and events',
    requires2FA: false,
    permissions: ['manage:inventory', 'manage:conventions', 'view:reports'],
  },
  member: {
    level: 40,
    name: 'Member',
    description: 'Regular member with basic access',
    requires2FA: false,
    permissions: ['view:inventory', 'view:conventions', 'participate:events'],
  },
  guest: {
    level: 20,
    name: 'Guest',
    description: 'Limited guest access',
    requires2FA: false,
    permissions: ['view:public'],
  },
};

// Extended User type with additional properties needed by the application
export interface User extends SupabaseUser {
  name?: string;
  profileImage?: string;
  role?: UserRoleType;
  email?: string;
}

// Invitation type for association invitations
export interface AssociationInvitation {
  id: string;
  code: string;
  association_id: string;
  role: UserRoleType;
  email?: string;
  expires_at?: string;
  created_at: string;
}
