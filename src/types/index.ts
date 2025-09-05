import React from 'react';

// Core Types for KonBase Modernized System
export type UserRoleType = 
  | 'super_admin' 
  | 'system_admin' 
  | 'admin' 
  | 'manager' 
  | 'member' 
  | 'guest';

export type ConventionRoleType = 
  | 'admin' 
  | 'manager' 
  | 'participant' 
  | 'guest';

export type ConventionStatus = 
  | 'planning' 
  | 'active' 
  | 'completed' 
  | 'cancelled';

export type ItemCondition = 
  | 'excellent' 
  | 'good' 
  | 'fair' 
  | 'poor' 
  | 'broken';

export type NotificationType = 
  | 'info' 
  | 'warning' 
  | 'error' 
  | 'success';

// Association Types
export interface Association {
  id: string;
  name: string;
  description?: string;
  logo_url?: string;
  website?: string;
  email?: string;
  phone?: string;
  address?: string;
  settings: Record<string, any>;
  created_at: Date;
  updated_at: Date;
}

// User & Profile Types
export interface Profile {
  id: string;
  user_id: string;
  first_name: string;
  last_name: string;
  email: string;
  phone?: string;
  avatar_url?: string;
  two_factor_enabled: boolean;
  totp_secret?: string;
  recovery_keys?: string[];
  preferences: Record<string, any>;
  created_at: Date;
  updated_at: Date;
}

export interface AssociationMember {
  id: string;
  association_id: string;
  profile_id: string;
  role: UserRoleType;
  joined_at: Date;
  association?: Association;
  profile?: Profile;
}

// Inventory Types
export interface Category {
  id: string;
  association_id: string;
  name: string;
  description?: string;
  parent_id?: string;
  path: string;
  level: number;
  children?: Category[];
  created_at: Date;
  updated_at: Date;
}

export interface Location {
  id: string;
  association_id: string;
  name: string;
  description?: string;
  parent_id?: string;
  path: string;
  level: number;
  children?: Location[];
  created_at: Date;
  updated_at: Date;
}

export interface Item {
  id: string;
  association_id: string;
  name: string;
  description?: string;
  serial_number?: string;
  barcode?: string;
  category_id?: string;
  location_id?: string;
  condition: ItemCondition;
  purchase_date?: Date;
  purchase_price?: number;
  warranty_expires?: Date;
  notes?: string;
  images: string[];
  created_at: Date;
  updated_at: Date;
  category?: Category;
  location?: Location;
}

export interface EquipmentSet {
  id: string;
  association_id: string;
  name: string;
  description?: string;
  items: EquipmentSetItem[];
  created_at: Date;
  updated_at: Date;
}

export interface EquipmentSetItem {
  id: string;
  equipment_set_id: string;
  item_id: string;
  quantity: number;
  item?: Item;
}

// Convention Types
export interface Convention {
  id: string;
  association_id: string;
  name: string;
  description?: string;
  start_date: Date;
  end_date: Date;
  location?: string;
  status: ConventionStatus;
  settings: Record<string, any>;
  created_at: Date;
  updated_at: Date;
}

export interface ConventionMember {
  id: string;
  convention_id: string;
  profile_id: string;
  role: ConventionRoleType;
  joined_at: Date;
  convention?: Convention;
  profile?: Profile;
}

export interface ConventionEquipment {
  id: string;
  convention_id: string;
  item_id: string;
  quantity_requested: number;
  quantity_allocated: number;
  issued_to?: string;
  issued_at?: Date;
  returned_at?: Date;
  notes?: string;
  item?: Item;
}

// Document & File Types
export interface Document {
  id: string;
  association_id: string;
  name: string;
  description?: string;
  file_path: string;
  file_size: number;
  mime_type: string;
  uploaded_by: string;
  item_id?: string;
  convention_id?: string;
  created_at: Date;
  updated_at: Date;
}

// Notification Types
export interface Notification {
  id: string;
  user_id: string;
  title: string;
  message: string;
  type: NotificationType;
  read: boolean;
  data?: Record<string, any>;
  created_at: Date;
  updated_at: Date;
}

// Chat Types
export interface ChatMessage {
  id: string;
  association_id: string;
  sender_id: string;
  message: string;
  created_at: Date;
  sender?: Profile;
}

// Audit Log Types
export interface AuditLog {
  id: string;
  association_id: string;
  user_id: string;
  action: string;
  resource_type: string;
  resource_id?: string;
  old_values?: Record<string, any>;
  new_values?: Record<string, any>;
  ip_address?: string;
  user_agent?: string;
  created_at: Date;
}

// Form Types
export interface FormFieldProps {
  name: string;
  label: string;
  required?: boolean;
  disabled?: boolean;
  error?: string;
  helperText?: string;
}

export interface TableColumn<T = any> {
  id: keyof T | string;
  label: string;
  sortable?: boolean;
  width?: string | number;
  align?: 'left' | 'center' | 'right';
  format?: (value: any, row?: T) => React.ReactNode;
}

// API Response Types
export interface ApiResponse<T = any> {
  data?: T;
  error?: string;
  message?: string;
  success: boolean;
}

export interface PaginatedResponse<T> extends ApiResponse<T[]> {
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

// Auth Types
export interface SessionUser {
  id: string;
  email: string;
  profile?: Profile;
  associations: AssociationMember[];
  currentAssociation?: AssociationMember;
}

// Component Props Types
export interface PageProps {
  params: { [key: string]: string };
  searchParams: { [key: string]: string | string[] | undefined };
}

export interface LayoutProps {
  children: React.ReactNode;
  params?: { [key: string]: string };
}
