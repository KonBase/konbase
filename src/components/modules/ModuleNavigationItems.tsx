'use client';

import React from 'react';
import { useModules } from './ModuleContext';
import Link from 'next/link';
import type { ModuleNavigationItem as ModuleNavItem } from '../../types/modules';

export const ModuleNavigationItems: React.FC = () => {
  const { navigationItems, isInitialized } = useModules();

  // Ensure all navigation items have a label or title property
  const validNavigationItems = navigationItems.filter(
    (item): item is ModuleNavItem => Boolean(item.label || item.title),
  );

  if (!isInitialized || validNavigationItems.length === 0) {
    return null;
  }

  return (
    <>
      {validNavigationItems.map((item, index) => (
        <li key={`${item.path}-${index}`}>
          <Link
            href={item.path}
            // Use inline style instead of className to avoid type errors
            style={{
              display: 'flex',
              alignItems: 'center',
              padding: '0.5rem',
              borderRadius: '0.5rem',
              color: 'var(--text-primary)',
              transition: 'background-color 0.2s',
            }}
          >
            {item.icon &&
              typeof item.icon !== 'string' &&
              React.isValidElement(item.icon) && (
                <span className="h-5 w-5 mr-2">
                  {React.cloneElement(item.icon)}
                </span>
              )}
            <span>{item.label || item.title}</span>
          </Link>
        </li>
      ))}
    </>
  );
};
