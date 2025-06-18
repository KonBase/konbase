// This file serves as the central type definition for our database schema

export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

// Define the Database type with all tables
export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string;
          name: string;
          email: string;
          role:
            | 'super_admin'
            | 'system_admin'
            | 'admin'
            | 'manager'
            | 'member'
            | 'guest';
          profile_image: string | null;
          two_factor_enabled: boolean;
          association_id: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id: string;
          name: string;
          email: string;
          role?:
            | 'super_admin'
            | 'system_admin'
            | 'admin'
            | 'manager'
            | 'member'
            | 'guest';
          profile_image?: string | null;
          two_factor_enabled?: boolean;
          association_id?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          name?: string;
          email?: string;
          role?:
            | 'super_admin'
            | 'system_admin'
            | 'admin'
            | 'manager'
            | 'member'
            | 'guest';
          profile_image?: string | null;
          two_factor_enabled?: boolean;
          association_id?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'profiles_id_fkey';
            columns: ['id'];
            isOneToOne: true;
            referencedRelation: 'users';
            referencedColumns: ['id'];
          },
        ];
      };
      associations: {
        Row: {
          id: string;
          name: string;
          description: string | null;
          contact_email: string;
          contact_phone: string | null;
          website: string | null;
          address: string | null;
          logo: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          name: string;
          description?: string | null;
          contact_email: string;
          contact_phone?: string | null;
          website?: string | null;
          address?: string | null;
          logo?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          name?: string;
          description?: string | null;
          contact_email?: string;
          contact_phone?: string | null;
          website?: string | null;
          address?: string | null;
          logo?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      association_members: {
        Row: {
          id: string;
          user_id: string;
          association_id: string;
          role:
            | 'super_admin'
            | 'system_admin'
            | 'admin'
            | 'manager'
            | 'member'
            | 'guest';
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          association_id: string;
          role?:
            | 'super_admin'
            | 'system_admin'
            | 'admin'
            | 'manager'
            | 'member'
            | 'guest';
          created_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          association_id?: string;
          role?:
            | 'super_admin'
            | 'system_admin'
            | 'admin'
            | 'manager'
            | 'member'
            | 'guest';
          created_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'association_members_association_id_fkey';
            columns: ['association_id'];
            isOneToOne: false;
            referencedRelation: 'associations';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'association_members_user_id_fkey';
            columns: ['user_id'];
            isOneToOne: false;
            referencedRelation: 'users';
            referencedColumns: ['id'];
          },
        ];
      };
      association_invitations: {
        Row: {
          id: string;
          association_id: string;
          code: string;
          email: string | null;
          role: string;
          expires_at: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          association_id: string;
          code: string;
          email?: string | null;
          role?: string;
          expires_at?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          association_id?: string;
          code?: string;
          email?: string | null;
          role?: string;
          expires_at?: string | null;
          created_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'association_invitations_association_id_fkey';
            columns: ['association_id'];
            isOneToOne: false;
            referencedRelation: 'associations';
            referencedColumns: ['id'];
          },
        ];
      };
      audit_logs: {
        Row: {
          id: string;
          entity: string;
          action: string;
          entity_id: string;
          user_id: string;
          changes: Json | null;
          created_at: string;
          ip_address: string | null;
        };
        Insert: {
          id?: string;
          entity: string;
          action: string;
          entity_id: string;
          user_id: string;
          changes?: Json | null;
          created_at?: string;
          ip_address?: string | null;
        };
        Update: {
          id?: string;
          entity?: string;
          action?: string;
          entity_id?: string;
          user_id?: string;
          changes?: Json | null;
          created_at?: string;
          ip_address?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: 'audit_logs_user_id_fkey';
            columns: ['user_id'];
            isOneToOne: false;
            referencedRelation: 'users';
            referencedColumns: ['id'];
          },
        ];
      };
      categories: {
        Row: {
          id: string;
          name: string;
          description: string | null;
          association_id: string;
          parent_id: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          name: string;
          description?: string | null;
          association_id: string;
          parent_id?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          name?: string;
          description?: string | null;
          association_id?: string;
          parent_id?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'categories_association_id_fkey';
            columns: ['association_id'];
            isOneToOne: false;
            referencedRelation: 'associations';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'categories_parent_id_fkey';
            columns: ['parent_id'];
            isOneToOne: false;
            referencedRelation: 'categories';
            referencedColumns: ['id'];
          },
        ];
      };
      chat_messages: {
        Row: {
          id: string;
          sender_id: string;
          message: string;
          sender_name: string;
          created_at: string;
          association_id: string;
        };
        Insert: {
          id?: string;
          sender_id: string;
          message: string;
          sender_name: string;
          created_at?: string;
          association_id: string;
        };
        Update: {
          id?: string;
          sender_id?: string;
          message?: string;
          sender_name?: string;
          created_at?: string;
          association_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'chat_messages_association_id_fkey';
            columns: ['association_id'];
            isOneToOne: false;
            referencedRelation: 'associations';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'chat_messages_sender_id_fkey';
            columns: ['sender_id'];
            isOneToOne: false;
            referencedRelation: 'users';
            referencedColumns: ['id'];
          },
        ];
      };
      conventions: {
        Row: {
          id: string;
          name: string;
          description: string | null;
          start_date: string;
          end_date: string;
          location: string | null;
          status: string;
          association_id: string;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          name: string;
          description?: string | null;
          start_date: string;
          end_date: string;
          location?: string | null;
          status?: string;
          association_id: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          name?: string;
          description?: string | null;
          start_date?: string;
          end_date?: string;
          location?: string | null;
          status?: string;
          association_id?: string;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'conventions_association_id_fkey';
            columns: ['association_id'];
            isOneToOne: false;
            referencedRelation: 'associations';
            referencedColumns: ['id'];
          },
        ];
      };
      convention_access: {
        Row: {
          id: string;
          convention_id: string;
          user_id: string;
          invitation_code: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          convention_id: string;
          user_id: string;
          invitation_code?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          convention_id?: string;
          user_id?: string;
          invitation_code?: string | null;
          created_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'convention_access_convention_id_fkey';
            columns: ['convention_id'];
            isOneToOne: false;
            referencedRelation: 'conventions';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'convention_access_user_id_fkey';
            columns: ['user_id'];
            isOneToOne: false;
            referencedRelation: 'users';
            referencedColumns: ['id'];
          },
        ];
      };
      convention_invitations: {
        Row: {
          id: string;
          code: string;
          convention_id: string;
          created_by: string;
          expires_at: string;
          uses_remaining: number;
        };
        Insert: {
          id?: string;
          code: string;
          convention_id: string;
          created_by: string;
          expires_at: string;
          uses_remaining?: number;
        };
        Update: {
          id?: string;
          code?: string;
          convention_id?: string;
          created_by?: string;
          expires_at?: string;
          uses_remaining?: number;
        };
        Relationships: [
          {
            foreignKeyName: 'convention_invitations_convention_id_fkey';
            columns: ['convention_id'];
            isOneToOne: false;
            referencedRelation: 'conventions';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'convention_invitations_created_by_fkey';
            columns: ['created_by'];
            isOneToOne: false;
            referencedRelation: 'users';
            referencedColumns: ['id'];
          },
        ];
      };
      equipment_sets: {
        Row: {
          id: string;
          name: string;
          description: string | null;
          association_id: string;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          name: string;
          description?: string | null;
          association_id: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          name?: string;
          description?: string | null;
          association_id?: string;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'equipment_sets_association_id_fkey';
            columns: ['association_id'];
            isOneToOne: false;
            referencedRelation: 'associations';
            referencedColumns: ['id'];
          },
        ];
      };
      equipment_set_items: {
        Row: {
          id: string;
          set_id: string;
          item_id: string;
          quantity: number;
          created_at: string;
        };
        Insert: {
          id?: string;
          set_id: string;
          item_id: string;
          quantity: number;
          created_at?: string;
        };
        Update: {
          id?: string;
          set_id?: string;
          item_id?: string;
          quantity?: number;
          created_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'equipment_set_items_item_id_fkey';
            columns: ['item_id'];
            isOneToOne: false;
            referencedRelation: 'items';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'equipment_set_items_set_id_fkey';
            columns: ['set_id'];
            isOneToOne: false;
            referencedRelation: 'equipment_sets';
            referencedColumns: ['id'];
          },
        ];
      };
      items: {
        Row: {
          id: string;
          name: string;
          description: string | null;
          serial_number: string | null;
          barcode: string | null;
          condition: string;
          category_id: string | null;
          location_id: string | null;
          association_id: string;
          is_consumable: boolean;
          quantity: number;
          minimum_quantity: number | null;
          purchase_price: number | null;
          purchase_date: string | null;
          warranty_expiration: string | null;
          image: string | null;
          notes: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          name: string;
          description?: string | null;
          serial_number?: string | null;
          barcode?: string | null;
          condition?: string;
          category_id?: string | null;
          location_id?: string | null;
          association_id: string;
          is_consumable?: boolean;
          quantity?: number;
          minimum_quantity?: number | null;
          purchase_price?: number | null;
          purchase_date?: string | null;
          warranty_expiration?: string | null;
          image?: string | null;
          notes?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          name?: string;
          description?: string | null;
          serial_number?: string | null;
          barcode?: string | null;
          condition?: string;
          category_id?: string | null;
          location_id?: string | null;
          association_id?: string;
          is_consumable?: boolean;
          quantity?: number;
          minimum_quantity?: number | null;
          purchase_price?: number | null;
          purchase_date?: string | null;
          warranty_expiration?: string | null;
          image?: string | null;
          notes?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'items_association_id_fkey';
            columns: ['association_id'];
            isOneToOne: false;
            referencedRelation: 'associations';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'items_category_id_fkey';
            columns: ['category_id'];
            isOneToOne: false;
            referencedRelation: 'categories';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'items_location_id_fkey';
            columns: ['location_id'];
            isOneToOne: false;
            referencedRelation: 'locations';
            referencedColumns: ['id'];
          },
        ];
      };
      locations: {
        Row: {
          id: string;
          name: string;
          description: string | null;
          parent_id: string | null;
          association_id: string;
          is_room: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          name: string;
          description?: string | null;
          parent_id?: string | null;
          association_id: string;
          is_room?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          name?: string;
          description?: string | null;
          parent_id?: string | null;
          association_id?: string;
          is_room?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'locations_association_id_fkey';
            columns: ['association_id'];
            isOneToOne: false;
            referencedRelation: 'associations';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'locations_parent_id_fkey';
            columns: ['parent_id'];
            isOneToOne: false;
            referencedRelation: 'locations';
            referencedColumns: ['id'];
          },
        ];
      };
      documents: {
        Row: {
          id: string;
          name: string;
          file_url: string;
          file_type: string;
          item_id: string;
          uploaded_by: string;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          name: string;
          file_url: string;
          file_type: string;
          item_id: string;
          uploaded_by: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          name?: string;
          file_url?: string;
          file_type?: string;
          item_id?: string;
          uploaded_by?: string;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'documents_item_id_fkey';
            columns: ['item_id'];
            isOneToOne: false;
            referencedRelation: 'items';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'documents_uploaded_by_fkey';
            columns: ['uploaded_by'];
            isOneToOne: false;
            referencedRelation: 'users';
            referencedColumns: ['id'];
          },
        ];
      };
      notifications: {
        Row: {
          id: string;
          user_id: string;
          title: string;
          message: string;
          read: boolean;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          title: string;
          message: string;
          read?: boolean;
          created_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          title?: string;
          message?: string;
          read?: boolean;
          created_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'notifications_user_id_fkey';
            columns: ['user_id'];
            isOneToOne: false;
            referencedRelation: 'users';
            referencedColumns: ['id'];
          },
        ];
      };
      user_2fa: {
        Row: {
          id: string;
          user_id: string;
          totp_secret: string;
          recovery_keys: string[];
          used_recovery_keys: string[] | null;
          created_at: string;
          updated_at: string;
          last_used_at: string | null;
        };
        Insert: {
          id?: string;
          user_id: string;
          totp_secret: string;
          recovery_keys: string[];
          used_recovery_keys?: string[] | null;
          created_at?: string;
          updated_at?: string;
          last_used_at?: string | null;
        };
        Update: {
          id?: string;
          user_id?: string;
          totp_secret?: string;
          recovery_keys?: string[];
          used_recovery_keys?: string[] | null;
          created_at?: string;
          updated_at?: string;
          last_used_at?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: 'user_2fa_user_id_fkey';
            columns: ['user_id'];
            isOneToOne: true;
            referencedRelation: 'users';
            referencedColumns: ['id'];
          },
        ];
      };
    };
    Views: {};
    Functions: {};
    Enums: {
      user_role_type:
        | 'super_admin'
        | 'system_admin'
        | 'admin'
        | 'manager'
        | 'member'
        | 'guest';
    };
    CompositeTypes: {};
  };
}
