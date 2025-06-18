'use client';

import React, { ReactNode } from 'react';
import {
  Building2,
  LayoutDashboard,
  Package,
  Users,
  FileBox,
  MapPin,
  Calendar,
  FileText,
  Settings,
  ShieldAlert,
  Home,
} from 'lucide-react';

// Add export for the SidebarItem type
export interface SidebarItem {
  title: string;
  path: string;
  icon?: ReactNode;
  submenu?: SidebarItem[];
  requiredRole?: string;
}

export const navItems: SidebarItem[] = [
  {
    title: 'Dashboard',
    path: '/dashboard',
    icon: <LayoutDashboard className="w-5 h-5" />,
    requiredRole: 'member',
  },
  {
    title: 'Association',
    path: '/association',
    icon: <Building2 className="w-5 h-5" />,
    submenu: [
      {
        title: 'Profile',
        path: '/association/profile',
        icon: <Home className="w-4 h-4" />,
      },
      {
        title: 'Members',
        path: '/association/members',
        icon: <Users className="w-4 h-4" />,
      },
      {
        title: 'List',
        path: '/association/list',
        icon: <FileText className="w-4 h-4" />,
      },
    ],
    requiredRole: 'member',
  },
  {
    title: 'Inventory',
    path: '/inventory',
    icon: <Package className="w-5 h-5" />,
    submenu: [
      {
        title: 'Items',
        path: '/inventory/items',
        icon: <Package className="w-4 h-4" />,
      },
      {
        title: 'Categories',
        path: '/inventory/categories',
        icon: <FileBox className="w-4 h-4" />,
      },
      {
        title: 'Locations',
        path: '/inventory/locations',
        icon: <MapPin className="w-4 h-4" />,
      },
      {
        title: 'Equipment Sets',
        path: '/inventory/sets',
        icon: <FileBox className="w-4 h-4" />,
      },
      {
        title: 'Warranties',
        path: '/inventory/warranties',
        icon: <FileText className="w-4 h-4" />,
      },
      {
        title: 'Import/Export',
        path: '/inventory/import-export',
        icon: <FileText className="w-4 h-4" />,
      },
    ],
    requiredRole: 'member',
  },
  {
    title: 'Conventions',
    path: '/conventions',
    icon: <Calendar className="w-5 h-5" />,
    submenu: [
      {
        title: 'All Conventions',
        path: '/conventions',
        icon: <Calendar className="w-4 h-4" />,
      },
      {
        title: 'Requirements',
        path: '/conventions/requirements',
        icon: <FileText className="w-4 h-4" />,
      },
      {
        title: 'Archive',
        path: '/conventions/archive',
        icon: <FileBox className="w-4 h-4" />,
      },
    ],
    requiredRole: 'member',
  },
  {
    title: 'Templates',
    path: '/templates',
    icon: <FileBox className="w-5 h-5" />,
    requiredRole: 'member',
  },
  {
    title: 'Reports',
    path: '/reports',
    icon: <FileText className="w-5 h-5" />,
    requiredRole: 'manager',
  },
  {
    title: 'Settings',
    path: '/settings',
    icon: <Settings className="w-5 h-5" />,
    requiredRole: 'manager',
  },
  {
    title: 'Admin',
    path: '/admin',
    icon: <ShieldAlert className="w-5 h-5" />,
    submenu: [
      {
        title: 'Users',
        path: '/admin/users',
        icon: <Users className="w-4 h-4" />,
      },
      {
        title: 'Audit Logs',
        path: '/admin/logs',
        icon: <FileText className="w-4 h-4" />,
      },
      {
        title: 'Backups',
        path: '/admin/backups',
        icon: <FileBox className="w-4 h-4" />,
      },
    ],
    requiredRole: 'admin',
  },
];
