export interface AuditLog {
  id: string;
  action: string;
  created_at: string;
  entity: string;
  entity_id: string;
  user_id: string;
  changes?: any;
  ip_address?: string;
  profiles?: {
    name: string;
    email: string;
  };
}

export type AuditLogEntity = 
  | 'association'
  | 'convention' 
  | 'item'
  | 'module'
  | 'profiles'
  | 'system_settings'
  | 'association_members'
  | 'users';

export type AuditLogAction = 
  | 'create_association'
  | 'update_association'
  | 'delete_association'
  | 'create_convention'
  | 'update_convention'
  | 'delete_convention'
  | 'create_item'
  | 'update_item'
  | 'delete_item'
  | 'create_module'
  | 'update_module'
  | 'delete_module'
  | 'update_role'
  | 'delete_user'
  | 'super_admin_elevation'
  | 'elevate_to_super_admin'
  | 'update_settings'
  | 'create_association_and_set_admin';
