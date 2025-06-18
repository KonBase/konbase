export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export type Database = {
  public: {
    Tables: {
      association_invitations: {
        Row: {
          association_id: string;
          code: string;
          created_at: string;
          email: string | null;
          expires_at: string | null;
          id: string;
          role: string;
        };
        Insert: {
          association_id: string;
          code: string;
          created_at?: string;
          email?: string | null;
          expires_at?: string | null;
          id?: string;
          role?: string;
        };
        Update: {
          association_id?: string;
          code?: string;
          created_at?: string;
          email?: string | null;
          expires_at?: string | null;
          id?: string;
          role?: string;
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
      association_members: {
        Row: {
          association_id: string;
          created_at: string;
          id: string;
          role: Database['public']['Enums']['user_role_type'];
          user_id: string;
        };
        Insert: {
          association_id: string;
          created_at?: string;
          id?: string;
          role?: Database['public']['Enums']['user_role_type'];
          user_id: string;
        };
        Update: {
          association_id?: string;
          created_at?: string;
          id?: string;
          role?: Database['public']['Enums']['user_role_type'];
          user_id?: string;
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
            referencedRelation: 'profiles';
            referencedColumns: ['id'];
          },
        ];
      };
      associations: {
        Row: {
          address: string | null;
          contact_email: string;
          contact_phone: string | null;
          created_at: string;
          description: string | null;
          id: string;
          logo: string | null;
          name: string;
          updated_at: string;
          website: string | null;
        };
        Insert: {
          address?: string | null;
          contact_email: string;
          contact_phone?: string | null;
          created_at?: string;
          description?: string | null;
          id?: string;
          logo?: string | null;
          name: string;
          updated_at?: string;
          website?: string | null;
        };
        Update: {
          address?: string | null;
          contact_email?: string;
          contact_phone?: string | null;
          created_at?: string;
          description?: string | null;
          id?: string;
          logo?: string | null;
          name?: string;
          updated_at?: string;
          website?: string | null;
        };
        Relationships: [];
      };
      audit_logs: {
        Row: {
          action: string;
          changes: Json | null;
          created_at: string;
          entity: string;
          entity_id: string;
          id: string;
          ip_address: string | null;
          user_id: string;
        };
        Insert: {
          action: string;
          changes?: Json | null;
          created_at?: string;
          entity: string;
          entity_id: string;
          id?: string;
          ip_address?: string | null;
          user_id: string;
        };
        Update: {
          action?: string;
          changes?: Json | null;
          created_at?: string;
          entity?: string;
          entity_id?: string;
          id?: string;
          ip_address?: string | null;
          user_id?: string;
        };
        Relationships: [];
      };
      categories: {
        Row: {
          association_id: string;
          created_at: string;
          description: string | null;
          id: string;
          name: string;
          parent_id: string | null;
          updated_at: string;
        };
        Insert: {
          association_id: string;
          created_at?: string;
          description?: string | null;
          id?: string;
          name: string;
          parent_id?: string | null;
          updated_at?: string;
        };
        Update: {
          association_id?: string;
          created_at?: string;
          description?: string | null;
          id?: string;
          name?: string;
          parent_id?: string | null;
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
          association_id: string;
          created_at: string;
          id: string;
          message: string;
          sender_id: string;
          sender_name: string;
        };
        Insert: {
          association_id: string;
          created_at?: string;
          id?: string;
          message: string;
          sender_id: string;
          sender_name: string;
        };
        Update: {
          association_id?: string;
          created_at?: string;
          id?: string;
          message?: string;
          sender_id?: string;
          sender_name?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'chat_messages_association_id_fkey';
            columns: ['association_id'];
            isOneToOne: false;
            referencedRelation: 'associations';
            referencedColumns: ['id'];
          },
        ];
      };
      convention_access: {
        Row: {
          convention_id: string;
          created_at: string;
          id: string;
          invitation_code: string | null;
          user_id: string;
        };
        Insert: {
          convention_id: string;
          created_at?: string;
          id?: string;
          invitation_code?: string | null;
          user_id: string;
        };
        Update: {
          convention_id?: string;
          created_at?: string;
          id?: string;
          invitation_code?: string | null;
          user_id?: string;
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
            foreignKeyName: 'convention_access_invitation_code_fkey';
            columns: ['invitation_code'];
            isOneToOne: false;
            referencedRelation: 'convention_invitations';
            referencedColumns: ['code'];
          },
        ];
      };
      convention_invitations: {
        Row: {
          code: string;
          convention_id: string;
          created_by: string;
          expires_at: string;
          id: string;
          uses_remaining: number;
        };
        Insert: {
          code: string;
          convention_id: string;
          created_by: string;
          expires_at: string;
          id?: string;
          uses_remaining?: number;
        };
        Update: {
          code?: string;
          convention_id?: string;
          created_by?: string;
          expires_at?: string;
          id?: string;
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
        ];
      };
      conventions: {
        Row: {
          association_id: string;
          created_at: string;
          description: string | null;
          end_date: string;
          id: string;
          location: string | null;
          name: string;
          start_date: string;
          status: string;
          updated_at: string;
        };
        Insert: {
          association_id: string;
          created_at?: string;
          description?: string | null;
          end_date: string;
          id?: string;
          location?: string | null;
          name: string;
          start_date: string;
          status?: string;
          updated_at?: string;
        };
        Update: {
          association_id?: string;
          created_at?: string;
          description?: string | null;
          end_date?: string;
          id?: string;
          location?: string | null;
          name?: string;
          start_date?: string;
          status?: string;
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
      documents: {
        Row: {
          created_at: string;
          file_type: string;
          file_url: string;
          id: string;
          item_id: string;
          name: string;
          updated_at: string;
          uploaded_by: string;
        };
        Insert: {
          created_at?: string;
          file_type: string;
          file_url: string;
          id?: string;
          item_id: string;
          name: string;
          updated_at?: string;
          uploaded_by: string;
        };
        Update: {
          created_at?: string;
          file_type?: string;
          file_url?: string;
          id?: string;
          item_id?: string;
          name?: string;
          updated_at?: string;
          uploaded_by?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'documents_item_id_fkey';
            columns: ['item_id'];
            isOneToOne: false;
            referencedRelation: 'items';
            referencedColumns: ['id'];
          },
        ];
      };
      equipment_set_items: {
        Row: {
          created_at: string;
          id: string;
          item_id: string;
          quantity: number;
          set_id: string;
        };
        Insert: {
          created_at?: string;
          id?: string;
          item_id: string;
          quantity?: number;
          set_id: string;
        };
        Update: {
          created_at?: string;
          id?: string;
          item_id?: string;
          quantity?: number;
          set_id?: string;
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
      equipment_sets: {
        Row: {
          association_id: string;
          created_at: string;
          description: string | null;
          id: string;
          name: string;
          updated_at: string;
        };
        Insert: {
          association_id: string;
          created_at?: string;
          description?: string | null;
          id?: string;
          name: string;
          updated_at?: string;
        };
        Update: {
          association_id?: string;
          created_at?: string;
          description?: string | null;
          id?: string;
          name?: string;
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
      items: {
        Row: {
          association_id: string;
          barcode: string | null;
          category_id: string;
          condition: string;
          created_at: string;
          description: string | null;
          id: string;
          image: string | null;
          is_consumable: boolean;
          location_id: string;
          minimum_quantity: number | null;
          name: string;
          notes: string | null;
          purchase_date: string | null;
          purchase_price: number | null;
          quantity: number;
          serial_number: string | null;
          updated_at: string;
          warranty_expiration: string | null;
        };
        Insert: {
          association_id: string;
          barcode?: string | null;
          category_id: string;
          condition?: string;
          created_at?: string;
          description?: string | null;
          id?: string;
          image?: string | null;
          is_consumable?: boolean;
          location_id: string;
          minimum_quantity?: number | null;
          name: string;
          notes?: string | null;
          purchase_date?: string | null;
          purchase_price?: number | null;
          quantity?: number;
          serial_number?: string | null;
          updated_at?: string;
          warranty_expiration?: string | null;
        };
        Update: {
          association_id?: string;
          barcode?: string | null;
          category_id?: string;
          condition?: string;
          created_at?: string;
          description?: string | null;
          id?: string;
          image?: string | null;
          is_consumable?: boolean;
          location_id?: string;
          minimum_quantity?: number | null;
          name?: string;
          notes?: string | null;
          purchase_date?: string | null;
          purchase_price?: number | null;
          quantity?: number;
          serial_number?: string | null;
          updated_at?: string;
          warranty_expiration?: string | null;
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
          association_id: string;
          created_at: string;
          description: string | null;
          id: string;
          is_room: boolean;
          name: string;
          parent_id: string | null;
          updated_at: string;
        };
        Insert: {
          association_id: string;
          created_at?: string;
          description?: string | null;
          id?: string;
          is_room?: boolean;
          name: string;
          parent_id?: string | null;
          updated_at?: string;
        };
        Update: {
          association_id?: string;
          created_at?: string;
          description?: string | null;
          id?: string;
          is_room?: boolean;
          name?: string;
          parent_id?: string | null;
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
      notifications: {
        Row: {
          created_at: string;
          id: string;
          message: string;
          read: boolean;
          title: string;
          user_id: string;
        };
        Insert: {
          created_at?: string;
          id?: string;
          message: string;
          read?: boolean;
          title: string;
          user_id: string;
        };
        Update: {
          created_at?: string;
          id?: string;
          message?: string;
          read?: boolean;
          title?: string;
          user_id?: string;
        };
        Relationships: [];
      };
      profiles: {
        Row: {
          association_id: string | null;
          created_at: string;
          email: string;
          id: string;
          name: string;
          profile_image: string | null;
          role: Database['public']['Enums']['user_role_type'];
          two_factor_enabled: boolean;
          updated_at: string;
        };
        Insert: {
          association_id?: string | null;
          created_at?: string;
          email: string;
          id: string;
          name: string;
          profile_image?: string | null;
          role?: Database['public']['Enums']['user_role_type'];
          two_factor_enabled?: boolean;
          updated_at?: string;
        };
        Update: {
          association_id?: string | null;
          created_at?: string;
          email?: string;
          id?: string;
          name?: string;
          profile_image?: string | null;
          role?: Database['public']['Enums']['user_role_type'];
          two_factor_enabled?: boolean;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'fk_profiles_association';
            columns: ['association_id'];
            isOneToOne: false;
            referencedRelation: 'associations';
            referencedColumns: ['id'];
          },
        ];
      };
      user_2fa: {
        Row: {
          created_at: string;
          id: string;
          last_used_at: string | null;
          recovery_keys: string[];
          totp_secret: string;
          updated_at: string;
          used_recovery_keys: string[] | null;
          user_id: string;
        };
        Insert: {
          created_at?: string;
          id?: string;
          last_used_at?: string | null;
          recovery_keys: string[];
          totp_secret: string;
          updated_at?: string;
          used_recovery_keys?: string[] | null;
          user_id: string;
        };
        Update: {
          created_at?: string;
          id?: string;
          last_used_at?: string | null;
          recovery_keys?: string[];
          totp_secret?: string;
          updated_at?: string;
          used_recovery_keys?: string[] | null;
          user_id?: string;
        };
        Relationships: [];
      };
    };
    Views: {
      members_with_profiles: {
        Row: {
          association_id: string | null;
          created_at: string | null;
          email: string | null;
          id: string | null;
          name: string | null;
          profile_image: string | null;
          role: Database['public']['Enums']['user_role_type'] | null;
          user_id: string | null;
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
            referencedRelation: 'profiles';
            referencedColumns: ['id'];
          },
        ];
      };
    };
    Functions: {
      get_user_association_memberships: {
        Args: {
          user_id_param: string;
        };
        Returns: {
          association_id: string;
        }[];
      };
      get_user_role: {
        Args: {
          user_id: string;
        };
        Returns: string;
      };
      has_elevated_admin_role: {
        Args: {
          user_id: string;
        };
        Returns: boolean;
      };
      is_admin: {
        Args: Record<PropertyKey, never>;
        Returns: boolean;
      };
      is_member_of_association: {
        Args: {
          user_id: string;
          assoc_id: string;
        };
        Returns: boolean;
      };
      is_system_or_super_admin: {
        Args: Record<PropertyKey, never>;
        Returns: boolean;
      };
      is_user_guest: {
        Args: Record<PropertyKey, never>;
        Returns: boolean;
      };
    };
    Enums: {
      user_role_type:
        | 'super_admin'
        | 'system_admin'
        | 'admin'
        | 'manager'
        | 'member'
        | 'guest';
    };
    CompositeTypes: {
      [_ in never]: never;
    };
  };
};

type PublicSchema = Database[Extract<keyof Database, 'public'>];

export type Tables<
  PublicTableNameOrOptions extends
    | keyof (PublicSchema['Tables'] & PublicSchema['Views'])
    | { schema: keyof Database },
  TableName extends PublicTableNameOrOptions extends { schema: keyof Database }
    ? keyof (Database[PublicTableNameOrOptions['schema']]['Tables'] &
        Database[PublicTableNameOrOptions['schema']]['Views'])
    : never = never,
> = PublicTableNameOrOptions extends { schema: keyof Database }
  ? (Database[PublicTableNameOrOptions['schema']]['Tables'] &
      Database[PublicTableNameOrOptions['schema']]['Views'])[TableName] extends {
      Row: infer R;
    }
    ? R
    : never
  : PublicTableNameOrOptions extends keyof (PublicSchema['Tables'] &
        PublicSchema['Views'])
    ? (PublicSchema['Tables'] &
        PublicSchema['Views'])[PublicTableNameOrOptions] extends {
        Row: infer R;
      }
      ? R
      : never
    : never;

export type TablesInsert<
  PublicTableNameOrOptions extends
    | keyof PublicSchema['Tables']
    | { schema: keyof Database },
  TableName extends PublicTableNameOrOptions extends { schema: keyof Database }
    ? keyof Database[PublicTableNameOrOptions['schema']]['Tables']
    : never = never,
> = PublicTableNameOrOptions extends { schema: keyof Database }
  ? Database[PublicTableNameOrOptions['schema']]['Tables'][TableName] extends {
      Insert: infer I;
    }
    ? I
    : never
  : PublicTableNameOrOptions extends keyof PublicSchema['Tables']
    ? PublicSchema['Tables'][PublicTableNameOrOptions] extends {
        Insert: infer I;
      }
      ? I
      : never
    : never;

export type TablesUpdate<
  PublicTableNameOrOptions extends
    | keyof PublicSchema['Tables']
    | { schema: keyof Database },
  TableName extends PublicTableNameOrOptions extends { schema: keyof Database }
    ? keyof Database[PublicTableNameOrOptions['schema']]['Tables']
    : never = never,
> = PublicTableNameOrOptions extends { schema: keyof Database }
  ? Database[PublicTableNameOrOptions['schema']]['Tables'][TableName] extends {
      Update: infer U;
    }
    ? U
    : never
  : PublicTableNameOrOptions extends keyof PublicSchema['Tables']
    ? PublicSchema['Tables'][PublicTableNameOrOptions] extends {
        Update: infer U;
      }
      ? U
      : never
    : never;

export type Enums<
  PublicEnumNameOrOptions extends
    | keyof PublicSchema['Enums']
    | { schema: keyof Database },
  EnumName extends PublicEnumNameOrOptions extends { schema: keyof Database }
    ? keyof Database[PublicEnumNameOrOptions['schema']]['Enums']
    : never = never,
> = PublicEnumNameOrOptions extends { schema: keyof Database }
  ? Database[PublicEnumNameOrOptions['schema']]['Enums'][EnumName]
  : PublicEnumNameOrOptions extends keyof PublicSchema['Enums']
    ? PublicSchema['Enums'][PublicEnumNameOrOptions]
    : never;

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof PublicSchema['CompositeTypes']
    | { schema: keyof Database },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof Database;
  }
    ? keyof Database[PublicCompositeTypeNameOrOptions['schema']]['CompositeTypes']
    : never = never,
> = PublicCompositeTypeNameOrOptions extends { schema: keyof Database }
  ? Database[PublicCompositeTypeNameOrOptions['schema']]['CompositeTypes'][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof PublicSchema['CompositeTypes']
    ? PublicSchema['CompositeTypes'][PublicCompositeTypeNameOrOptions]
    : never;
