'use client';

import React from 'react';
import Link from 'next/link';
import { cn } from '@/lib/utils';
import type { SidebarItem } from './navItems';

interface MenuItemProps {
  item: SidebarItem;
  collapsed: boolean;
  isActive: (path: string) => boolean;
}

const MenuItem: React.FC<MenuItemProps> = ({ item, collapsed, isActive }) => {
  const isItemActive = isActive(item.path);

  return (
    <Link
      href={item.path}
      className={cn(
        collapsed
          ? 'flex items-center justify-center p-2 my-2 rounded-md'
          : 'flex items-center px-3 py-2 text-sm rounded-md',
        isItemActive
          ? 'bg-accent text-accent-foreground'
          : 'text-foreground hover:bg-accent/50',
      )}
      title={collapsed ? item.title : undefined}
    >
      {item.icon}
      {!collapsed && <span className="ml-3">{item.title}</span>}
    </Link>
  );
};

export default MenuItem;
