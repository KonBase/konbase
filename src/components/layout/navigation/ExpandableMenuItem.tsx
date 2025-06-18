'use client';

import React from 'react';
import Link from 'next/link';
import { ChevronDown } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { SidebarItem } from './navItems';
import SubMenu from './SubMenu';

interface ExpandableMenuItemProps {
  item: SidebarItem;
  collapsed: boolean;
  isActive: (path: string) => boolean;
  isExpanded: boolean;
  toggleExpand: () => void;
}

const ExpandableMenuItem: React.FC<ExpandableMenuItemProps> = ({
  item,
  collapsed,
  isActive,
  isExpanded,
  toggleExpand,
}) => {
  const isItemActive = isActive(item.path);

  if (collapsed) {
    return (
      <div className="my-2 flex justify-center">
        <Link
          href={item.path}
          className={cn(
            'flex items-center justify-center p-2 rounded-md',
            isItemActive
              ? 'bg-accent text-accent-foreground'
              : 'text-foreground hover:bg-accent/50',
          )}
          title={item.title}
        >
          {item.icon}
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-1">
      <button
        onClick={toggleExpand}
        className={cn(
          'w-full flex items-center justify-between px-3 py-2 text-sm rounded-md',
          isItemActive
            ? 'bg-accent text-accent-foreground'
            : 'text-foreground hover:bg-accent/50',
        )}
      >
        <div className="flex items-center">
          {item.icon}
          <span className="ml-3">{item.title}</span>
        </div>
        <ChevronDown
          className={cn(
            'w-4 h-4 transition-transform',
            isExpanded ? 'transform rotate-180' : '',
          )}
        />
      </button>

      {isExpanded && item.submenu && (
        <SubMenu
          submenu={item.submenu}
          isActive={isActive}
          collapsed={collapsed}
        />
      )}
    </div>
  );
};

export default ExpandableMenuItem;
