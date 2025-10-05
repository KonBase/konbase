// Quick Action Types and Configuration
export interface QuickAction {
  id: string;
  title: string;
  description: string;
  icon: string; // Lucide icon name
  category: QuickActionCategory;
  type: QuickActionType;
  config: QuickActionConfig;
  isEnabled: boolean;
  order: number;
  createdAt: string;
  updatedAt: string;
}

export type QuickActionCategory = 
  | 'association'
  | 'convention'
  | 'inventory'
  | 'user_management'
  | 'reports'
  | 'system';

export type QuickActionType = 
  | 'navigation'
  | 'modal'
  | 'api_call'
  | 'custom_function';

export interface QuickActionConfig {
  // For navigation actions
  navigation?: {
    path: string;
    params?: Record<string, string>;
  };
  
  // For modal actions
  modal?: {
    component: string;
    props?: Record<string, any>;
  };
  
  // For API calls
  apiCall?: {
    endpoint: string;
    method: 'GET' | 'POST' | 'PUT' | 'DELETE';
    payload?: Record<string, any>;
    successMessage?: string;
    errorMessage?: string;
  };
  
  // For custom functions
  customFunction?: {
    functionName: string;
    parameters?: Record<string, any>;
  };
  
  // Common configuration
  requiresConfirmation?: boolean;
  confirmationMessage?: string;
  requiresPermission?: string;
  showInQuickActions?: boolean;
}

// Predefined quick actions that users can enable/disable
export const PREDEFINED_QUICK_ACTIONS: Omit<QuickAction, 'id' | 'createdAt' | 'updatedAt'>[] = [
  // Association Management Actions
  {
    title: 'Add New Member',
    description: 'Invite a new member to the association',
    icon: 'UserPlus',
    category: 'association',
    type: 'modal',
    config: {
      modal: {
        component: 'InviteMemberDialog',
      },
      requiresConfirmation: false,
      showInQuickActions: true,
    },
    isEnabled: false,
    order: 1,
  },
  {
    title: 'Manage Association Profile',
    description: 'Update association details and settings',
    icon: 'Building2',
    category: 'association',
    type: 'navigation',
    config: {
      navigation: {
        path: '/association/profile',
      },
      showInQuickActions: true,
    },
    isEnabled: false,
    order: 2,
  },
  {
    title: 'View Association Members',
    description: 'See all association members and their roles',
    icon: 'Users',
    category: 'association',
    type: 'navigation',
    config: {
      navigation: {
        path: '/association/members',
      },
      showInQuickActions: true,
    },
    isEnabled: false,
    order: 3,
  },
  
  // Convention Management Actions
  {
    title: 'Create New Convention',
    description: 'Start planning a new convention',
    icon: 'CalendarPlus',
    category: 'convention',
    type: 'navigation',
    config: {
      navigation: {
        path: '/conventions/new',
      },
      showInQuickActions: true,
    },
    isEnabled: false,
    order: 4,
  },
  {
    title: 'View Active Conventions',
    description: 'See all active conventions',
    icon: 'Calendar',
    category: 'convention',
    type: 'navigation',
    config: {
      navigation: {
        path: '/conventions',
      },
      showInQuickActions: true,
    },
    isEnabled: false,
    order: 5,
  },
  {
    title: 'Convention Templates',
    description: 'Manage convention templates',
    icon: 'FileTemplate',
    category: 'convention',
    type: 'navigation',
    config: {
      navigation: {
        path: '/conventions/templates',
      },
      showInQuickActions: true,
    },
    isEnabled: false,
    order: 6,
  },
  
  // Inventory Management Actions
  {
    title: 'Add New Item',
    description: 'Add equipment to inventory',
    icon: 'PackagePlus',
    category: 'inventory',
    type: 'navigation',
    config: {
      navigation: {
        path: '/inventory/items/new',
      },
      showInQuickActions: true,
    },
    isEnabled: false,
    order: 7,
  },
  {
    title: 'View Inventory',
    description: 'Browse all inventory items',
    icon: 'Package',
    category: 'inventory',
    type: 'navigation',
    config: {
      navigation: {
        path: '/inventory/items',
      },
      showInQuickActions: true,
    },
    isEnabled: false,
    order: 8,
  },
  {
    title: 'Manage Categories',
    description: 'Organize inventory categories',
    icon: 'FolderOpen',
    category: 'inventory',
    type: 'navigation',
    config: {
      navigation: {
        path: '/inventory/categories',
      },
      showInQuickActions: true,
    },
    isEnabled: false,
    order: 9,
  },
  {
    title: 'Equipment Sets',
    description: 'Manage predefined equipment sets',
    icon: 'Boxes',
    category: 'inventory',
    type: 'navigation',
    config: {
      navigation: {
        path: '/inventory/sets',
      },
      showInQuickActions: true,
    },
    isEnabled: false,
    order: 10,
  },
  
  // User Management Actions
  {
    title: 'User Management',
    description: 'Manage user roles and permissions',
    icon: 'UserCog',
    category: 'user_management',
    type: 'navigation',
    config: {
      navigation: {
        path: '/admin/users',
      },
      requiresPermission: 'manage:users',
      showInQuickActions: true,
    },
    isEnabled: false,
    order: 11,
  },
  
  // Reports Actions
  {
    title: 'Generate Reports',
    description: 'Create inventory and convention reports',
    icon: 'BarChart3',
    category: 'reports',
    type: 'navigation',
    config: {
      navigation: {
        path: '/reports',
      },
      showInQuickActions: true,
    },
    isEnabled: false,
    order: 12,
  },
  
  // System Actions
  {
    title: 'System Settings',
    description: 'Configure system-wide settings',
    icon: 'Settings',
    category: 'system',
    type: 'navigation',
    config: {
      navigation: {
        path: '/admin/settings',
      },
      requiresPermission: 'admin:all',
      showInQuickActions: true,
    },
    isEnabled: false,
    order: 13,
  },
];

// User's configured quick actions (stored in localStorage or user preferences)
export interface UserQuickActionConfig {
  userId: string;
  associationId: string;
  enabledActions: string[]; // Array of action IDs
  customOrder: Record<string, number>; // actionId -> order
  createdAt: string;
  updatedAt: string;
}
