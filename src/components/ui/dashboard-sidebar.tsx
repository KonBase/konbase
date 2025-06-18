import React from 'react';
import Link from 'next/link';
import { cn } from '@/utils/classnames';

interface SidebarProps extends React.HTMLAttributes<HTMLDivElement> {
  items: {
    href: string;
    title: string;
    icon?: React.ReactNode;
  }[];
  collapsed?: boolean;
}

export function DashboardSidebar({
  className,
  items,
  collapsed = false,
  ...props
}: SidebarProps) {
  return (
    <div
      className={cn(
        'flex flex-col h-full bg-background border-r',
        collapsed ? 'w-[70px]' : 'w-[250px]',
        className,
      )}
      {...props}
    >
      <div className="py-4 overflow-auto">
        <nav className="grid items-start px-2 gap-2">
          {items.map((item, index) => (
            <Link
              key={index}
              href={item.href}
              className={cn(
                'flex items-center gap-3 rounded-lg px-3 py-2 text-muted-foreground hover:text-foreground transition-colors',
                'hover:bg-accent',
              )}
            >
              {item.icon && <span className="w-5 h-5">{item.icon}</span>}
              {!collapsed && <span>{item.title}</span>}
            </Link>
          ))}
        </nav>
      </div>
    </div>
  );
}
