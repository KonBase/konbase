'use client';

import React from 'react';
import Link from 'next/link';
import { cn } from '@/lib/utils';
import type { SidebarItem } from './navItems';

interface SubMenuProps {
  submenu: SidebarItem[];
  isActive: (path: string) => boolean;
  collapsed: boolean;
}

const SubMenu: React.FC<SubMenuProps> = ({ submenu, isActive, collapsed }) => {
  if (collapsed) return null;

  return (
    <div className="pl-4 space-y-1">
      {submenu.map((subItem) => (
        <Link
          key={subItem.path}
          href={subItem.path}
          className={cn(
            'flex items-center px-3 py-2 text-sm rounded-md',
            isActive(subItem.path)
              ? 'bg-accent text-accent-foreground'
              : 'text-foreground hover:bg-accent/50',
          )}
        >
          {subItem.icon}
          <span className="ml-3">{subItem.title}</span>
        </Link>
      ))}
    </div>
  );
};

export default SubMenu;
